


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'DECLINED',
    'ERROR'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'cliente',
    'administrador'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_stock_reservation"("p_reservation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT * INTO v_item FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock and collect product_ids
  FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = p_reservation_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
    END IF;
    
    IF v_item.product_id != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, v_item.product_id);
    END IF;
  END LOOP;

  -- Update reservation status
  UPDATE public.stock_reservations
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_reservation_id;

  -- Update flags
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."cancel_stock_reservation"("p_reservation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_stock_reservation_by_user"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Get all pending expired reservations for this user
  FOR v_item IN 
    SELECT sr.id, sri.product_id, sri.variant_id, sri.quantity
    FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sr.user_id = p_user_id 
    AND sr.status = 'pending' 
    AND sr.expires_at <= now()
  LOOP
    -- Restore stock
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
    END IF;
    
    -- Collect product_ids for flag update
    IF v_item.product_id != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, v_item.product_id);
    END IF;
    
    -- Mark reservation as expired
    UPDATE public.stock_reservations SET status = 'expired' WHERE id = v_item.id;
  END LOOP;

  -- Update flags - set to false only if no pending reservations for that product
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."cancel_stock_reservation_by_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_product_pos_sales"("p_product_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT count(*) INTO v_count FROM pos_sales WHERE items::text ILIKE '%' || p_product_id::text || '%';
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."check_product_pos_sales"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_reservations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_expired_reservations UUID[];
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_reservation_id UUID;
  v_i INTEGER := 0;
BEGIN
  -- Find all expired pending reservations
  SELECT ARRAY_AGG(id) INTO v_expired_reservations
  FROM public.stock_reservations
  WHERE status = 'pending' AND expires_at <= now();

  -- Process each expired reservation
  v_i := 1;
  WHILE v_i <= array_length(v_expired_reservations, 1) LOOP
    v_reservation_id := v_expired_reservations[v_i];
    
    -- Restore stock and collect product_ids
    FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = v_reservation_id
    LOOP
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
      ELSE
        UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
      END IF;
      
      IF v_item.product_id != ALL(v_product_ids) THEN
        v_product_ids := array_append(v_product_ids, v_item.product_id);
      END IF;
    END LOOP;

    -- Mark as expired
    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE id = v_reservation_id;

    v_count := v_count + 1;
    v_i := v_i + 1;
  END LOOP;

  -- Update flags
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_reservations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_reservations_for_product"("p_product_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_item RECORD;
  v_reservation_id UUID;
BEGIN
  -- Find expired pending reservations for this product
  FOR v_item IN
    SELECT sr.id, sri.variant_id, sri.quantity
    FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sri.product_id = p_product_id
    AND sr.status = 'pending'
    AND sr.expires_at <= now()
  LOOP
    -- Restore stock
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = p_product_id;
    END IF;
    
    -- Mark reservation as expired
    UPDATE public.stock_reservations SET status = 'expired' WHERE id = v_item.id;
  END LOOP;

  -- Update flag if no more pending reservations for this product
  UPDATE public.products p
  SET has_active_reservation = false
  WHERE p.id = p_product_id
  AND NOT EXISTS (
    SELECT 1 FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sri.product_id = p_product_id
    AND sr.status = 'pending'
    AND sr.expires_at > now()
  );
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_reservations_for_product"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_stock_reservation"("p_reservation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_reservation RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT * INTO v_reservation FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Collect product_ids for flag update
  SELECT ARRAY_AGG(DISTINCT sri.product_id) INTO v_product_ids
  FROM public.stock_reservation_items sri
  WHERE sri.reservation_id = p_reservation_id;

  -- Update reservation status (stock already decremented at reservation time)
  UPDATE public.stock_reservations
  SET status = 'confirmed', confirmed_at = now()
  WHERE id = p_reservation_id;

  -- Update flags - set to false since reservation is confirmed
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
      AND sr.id != p_reservation_id
    );
  END IF;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."confirm_stock_reservation"("p_reservation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer DEFAULT 15) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_reservation_id UUID;
  v_item JSONB;
  v_reserved INTEGER := 0;
  v_cart_hash TEXT;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Generate cart hash from items
  v_cart_hash := encode(digest(p_items::text, 'sha256'), 'hex');

  -- Check if user already has an active reservation
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations 
    WHERE user_id = p_user_id 
    AND status = 'pending' 
    AND expires_at > now()
  ) THEN
    -- Return existing reservation
    SELECT id INTO v_reservation_id 
    FROM public.stock_reservations 
    WHERE user_id = p_user_id AND status = 'pending' AND expires_at > now()
    LIMIT 1;
    
    RETURN v_reservation_id;
  END IF;

  -- Cancel any expired reservations for this user first
  PERFORM cancel_stock_reservation_by_user(p_user_id);

  -- Create new reservation
  INSERT INTO public.stock_reservations (user_id, cart_hash, expires_at)
  VALUES (p_user_id, v_cart_hash, now() + (p_reservation_minutes || ' minutes')::interval)
  RETURNING id INTO v_reservation_id;

  -- Collect unique product_ids for flag update
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'product_id')::UUID != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, (v_item->>'product_id')::UUID);
    END IF;
  END LOOP;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'variant_id') IS NOT NULL THEN
      -- Reserve from SKU
      UPDATE public.product_skus
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'variant_id')::UUID
      AND stock >= (v_item->>'quantity')::INTEGER
      AND active = true;
      
      GET DIAGNOSTICS v_reserved = ROW_COUNT;
      
      -- Insert reservation item
      INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
      VALUES (v_reservation_id, (v_item->>'product_id')::UUID, (v_item->>'variant_id')::UUID, (v_item->>'quantity')::INTEGER);
    ELSE
      -- Reserve from product
      UPDATE public.products
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'product_id')::UUID
      AND stock >= (v_item->>'quantity')::INTEGER
      AND active = true;
      
      GET DIAGNOSTICS v_reserved = ROW_COUNT;
      
      -- Insert reservation item
      INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
      VALUES (v_reservation_id, (v_item->>'product_id')::UUID, NULL, (v_item->>'quantity')::INTEGER);
    END IF;
  END LOOP;

  -- Update flag for all affected products
  UPDATE public.products
  SET has_active_reservation = true
  WHERE id = ANY(v_product_ids);

  RETURN v_reservation_id;
END;
$$;


ALTER FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_pos_stock"("p_items" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_item JSONB;
  v_variant_id TEXT;
  v_product_id TEXT;
  v_quantity INTEGER;
  v_decremented INTEGER := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := v_item->>'variant_id';
    v_product_id := v_item->>'product_id';
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Check if variant_id is valid (not null, not empty string, not 'null')
    IF v_variant_id IS NOT NULL AND v_variant_id != '' AND v_variant_id != 'null' THEN
      UPDATE public.product_skus
      SET stock = stock - v_quantity
      WHERE id = v_variant_id::UUID
      AND stock >= v_quantity;

      GET DIAGNOSTICS v_decremented = ROW_COUNT;
      IF v_decremented = 0 THEN
        RETURN FALSE;
      END IF;
    ELSIF v_product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = stock - v_quantity
      WHERE id = v_product_id::UUID
      AND stock >= v_quantity;

      GET DIAGNOSTICS v_decremented = ROW_COUNT;
      IF v_decremented = 0 THEN
        RETURN FALSE;
      END IF;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."decrement_pos_stock"("p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_sku_stock"("p_sku_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.product_skus
  SET stock = stock - p_quantity
  WHERE id = p_sku_id;
END;
$$;


ALTER FUNCTION "public"."decrement_sku_stock"("p_sku_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_effective_stock"("p_product_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_stock INTEGER;
  v_has_variants BOOLEAN;
  v_total_variant_stock INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.product_option_types WHERE product_id = p_product_id) INTO v_has_variants;
  
  IF v_has_variants THEN
    SELECT COALESCE(SUM(stock), 0) INTO v_total_variant_stock
    FROM public.product_skus
    WHERE product_id = p_product_id;
    RETURN v_total_variant_stock;
  ELSE
    SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
    RETURN COALESCE(v_stock, 0);
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_product_effective_stock"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_stock_with_cleanup"("p_product_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_has_active BOOLEAN;
  v_stock INTEGER;
BEGIN
  -- Check flag first
  SELECT has_active_reservation INTO v_has_active FROM public.products WHERE id = p_product_id;
  
  -- If flag is true, cleanup expired reservations first
  IF v_has_active = true THEN
    PERFORM cleanup_expired_reservations_for_product(p_product_id);
    
    -- Recheck flag after cleanup
    SELECT has_active_reservation INTO v_has_active FROM public.products WHERE id = p_product_id;
  END IF;
  
  -- Get stock
  SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
  
  RETURN COALESCE(v_stock, 0);
END;
$$;


ALTER FUNCTION "public"."get_product_stock_with_cleanup"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_with_effective_stock"("product_ids" "uuid"[]) RETURNS TABLE("product_id" "uuid", "effective_stock" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pid,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.product_option_types pot WHERE pot.product_id = pid) THEN
        COALESCE((SELECT SUM(ps.stock) FROM public.product_skus ps WHERE ps.product_id = pid), 0)
      ELSE
        COALESCE((SELECT stock FROM public.products WHERE id = pid), 0)
    END as effective_stock
  FROM unnest(product_ids) AS pid;
END;
$$;


ALTER FUNCTION "public"."get_products_with_effective_stock"("product_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, 'sin-correo@ecommerce.com'), 
    CASE WHEN is_first_user THEN 'administrador'::public.user_role ELSE 'cliente'::public.user_role END
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error on profile creation trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_stock"("p_sku_id" "uuid", "p_product_id" "uuid", "p_quantity" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_stock INTEGER;
  v_reserved BOOLEAN := FALSE;
BEGIN
  -- If SKU variant
  IF p_sku_id IS NOT NULL THEN
    UPDATE public.product_skus
    SET stock = stock - p_quantity
    WHERE id = p_sku_id AND stock >= p_quantity
    RETURNING stock INTO v_stock;
    IF v_stock IS NOT NULL THEN
      v_reserved := TRUE;
    END IF;
  ELSE
    -- Product without variant
    UPDATE public.products
    SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity
    RETURNING stock INTO v_stock;
    IF v_stock IS NOT NULL THEN
      v_reserved := TRUE;
    END IF;
  END IF;
  
  RETURN v_reserved;
END;
$$;


ALTER FUNCTION "public"."reserve_stock"("p_sku_id" "uuid", "p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_pos_stock"("p_items" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'variant_id') IS NOT NULL AND v_item->>'variant_id' != '' THEN
      UPDATE public.product_skus
      SET stock = stock + (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'variant_id')::UUID;
    ELSE
      UPDATE public.products
      SET stock = stock + (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'product_id')::UUID;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."restore_pos_stock"("p_items" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "price_at_purchase" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "variant_id" "uuid"
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_amount" integer NOT NULL,
    "status" "public"."order_status" DEFAULT 'PENDING'::"public"."order_status" NOT NULL,
    "wompi_transaction_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "customer_name" "text",
    "customer_email" "text",
    "shipping_address" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pos_bogo_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "product_id" "uuid",
    "variant_id" "uuid",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."pos_bogo_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pos_cash_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(10,2),
    "payment_method" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "pos_cash_events_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['efectivo'::"text", 'tarjeta'::"text", 'transferencia'::"text"]))),
    CONSTRAINT "pos_cash_events_type_check" CHECK (("type" = ANY (ARRAY['sale'::"text", 'cashup'::"text", 'expense'::"text", 'income'::"text"])))
);


ALTER TABLE "public"."pos_cash_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pos_sale_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "method" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    CONSTRAINT "pos_sale_payments_method_check" CHECK (("method" = ANY (ARRAY['efectivo'::"text", 'tarjeta'::"text", 'transferencia'::"text"])))
);


ALTER TABLE "public"."pos_sale_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pos_sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "customer_name" "text",
    "items" "jsonb" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "discount_reason" "text",
    "total" numeric(10,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "payment_status" "text" DEFAULT 'paid'::"text",
    "amount_received" numeric(10,2),
    "change_amount" numeric(10,2),
    "notes" "text",
    "channel" "text" DEFAULT 'pos'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "pos_sales_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['efectivo'::"text", 'tarjeta'::"text", 'transferencia'::"text", 'mixto'::"text"]))),
    CONSTRAINT "pos_sales_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['paid'::"text", 'pending'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."pos_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_option_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."product_option_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_option_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "option_type_id" "uuid" NOT NULL,
    "value" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."product_option_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_skus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku_code" "text" NOT NULL,
    "price_override" integer,
    "stock" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "active" boolean DEFAULT true,
    "archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."product_skus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" integer DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "active" boolean DEFAULT true,
    "has_active_reservation" boolean DEFAULT false NOT NULL,
    "archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'cliente'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sku_option_values" (
    "sku_id" "uuid" NOT NULL,
    "option_value_id" "uuid" NOT NULL
);


ALTER TABLE "public"."sku_option_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_reservation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reservation_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "stock_reservation_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."stock_reservation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cart_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "confirmed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "stock_reservations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."stock_reservations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_bogo_offers"
    ADD CONSTRAINT "pos_bogo_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_cash_events"
    ADD CONSTRAINT "pos_cash_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_sale_payments"
    ADD CONSTRAINT "pos_sale_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_sales"
    ADD CONSTRAINT "pos_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_option_types"
    ADD CONSTRAINT "product_option_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_option_types"
    ADD CONSTRAINT "product_option_types_product_id_name_key" UNIQUE ("product_id", "name");



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_option_type_id_value_key" UNIQUE ("option_type_id", "value");



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_skus"
    ADD CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_skus"
    ADD CONSTRAINT "product_skus_product_id_sku_code_key" UNIQUE ("product_id", "sku_code");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sku_option_values"
    ADD CONSTRAINT "sku_option_values_pkey" PRIMARY KEY ("sku_id", "option_value_id");



ALTER TABLE ONLY "public"."stock_reservation_items"
    ADD CONSTRAINT "stock_reservation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_option_types_product" ON "public"."product_option_types" USING "btree" ("product_id");



CREATE INDEX "idx_option_values_type" ON "public"."product_option_values" USING "btree" ("option_type_id");



CREATE INDEX "idx_pos_bogo_offers_product" ON "public"."pos_bogo_offers" USING "btree" ("product_id");



CREATE INDEX "idx_pos_cash_events_created" ON "public"."pos_cash_events" USING "btree" ("created_at");



CREATE INDEX "idx_pos_cash_events_user" ON "public"."pos_cash_events" USING "btree" ("user_id");



CREATE INDEX "idx_pos_sales_created" ON "public"."pos_sales" USING "btree" ("created_at");



CREATE INDEX "idx_pos_sales_payment_method" ON "public"."pos_sales" USING "btree" ("payment_method");



CREATE INDEX "idx_pos_sales_seller" ON "public"."pos_sales" USING "btree" ("seller_id");



CREATE INDEX "idx_product_skus_product_id" ON "public"."product_skus" USING "btree" ("product_id");



CREATE INDEX "idx_products_has_active_reservation" ON "public"."products" USING "btree" ("has_active_reservation") WHERE ("has_active_reservation" = true);



CREATE INDEX "idx_reservation_items_reservation" ON "public"."stock_reservation_items" USING "btree" ("reservation_id");



CREATE INDEX "idx_reservations_expires_at" ON "public"."stock_reservations" USING "btree" ("expires_at");



CREATE INDEX "idx_reservations_status" ON "public"."stock_reservations" USING "btree" ("status");



CREATE INDEX "idx_sku_option_values_sku" ON "public"."sku_option_values" USING "btree" ("sku_id");



CREATE INDEX "idx_skus_product" ON "public"."product_skus" USING "btree" ("product_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_skus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pos_bogo_offers"
    ADD CONSTRAINT "pos_bogo_offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pos_bogo_offers"
    ADD CONSTRAINT "pos_bogo_offers_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_skus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pos_cash_events"
    ADD CONSTRAINT "pos_cash_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."pos_sale_payments"
    ADD CONSTRAINT "pos_sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."pos_sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pos_sales"
    ADD CONSTRAINT "pos_sales_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."product_option_types"
    ADD CONSTRAINT "product_option_types_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_option_type_id_fkey" FOREIGN KEY ("option_type_id") REFERENCES "public"."product_option_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_skus"
    ADD CONSTRAINT "product_skus_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sku_option_values"
    ADD CONSTRAINT "sku_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sku_option_values"
    ADD CONSTRAINT "sku_option_values_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservation_items"
    ADD CONSTRAINT "stock_reservation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservation_items"
    ADD CONSTRAINT "stock_reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."stock_reservations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservation_items"
    ADD CONSTRAINT "stock_reservation_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_skus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Active products are viewable by everyone." ON "public"."products" FOR SELECT USING ((("active" = true) AND ("archived" = false)));



CREATE POLICY "Administrators can manage categories." ON "public"."categories" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Administrators can manage orders." ON "public"."orders" FOR UPDATE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Administrators can manage products." ON "public"."products" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can do everything on pos_bogo_offers" ON "public"."pos_bogo_offers" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can do everything on pos_cash_events" ON "public"."pos_cash_events" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can do everything on pos_sale_payments" ON "public"."pos_sale_payments" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can do everything on pos_sales" ON "public"."pos_sales" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can manage SKU option values." ON "public"."sku_option_values" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can manage SKUs." ON "public"."product_skus" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can manage option types." ON "public"."product_option_types" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Admins can manage option values." ON "public"."product_option_values" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "All SKUs are viewable by admins." ON "public"."product_skus" FOR SELECT USING ((("archived" = false) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role")));



CREATE POLICY "All products are viewable by admins." ON "public"."products" FOR SELECT USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role"));



CREATE POLICY "Authenticated users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Categories are viewable by everyone." ON "public"."categories" FOR SELECT USING (("archived" = false));



CREATE POLICY "Option types are viewable by everyone." ON "public"."product_option_types" FOR SELECT USING (true);



CREATE POLICY "Option values are viewable by everyone." ON "public"."product_option_values" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "SKU option values are viewable by everyone." ON "public"."sku_option_values" FOR SELECT USING (true);



CREATE POLICY "SKUs are viewable by everyone." ON "public"."product_skus" FOR SELECT USING (true);



CREATE POLICY "Users can create their own orders." ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert items to their own orders." ON "public"."order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own pending reservations." ON "public"."stock_reservations" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can view items from their own orders." ON "public"."order_items" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role")));



CREATE POLICY "Users can view items of their own reservations." ON "public"."stock_reservation_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stock_reservations"
  WHERE (("stock_reservations"."id" = "stock_reservation_items"."reservation_id") AND ("stock_reservations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own orders." ON "public"."orders" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"public"."user_role")));



CREATE POLICY "Users can view their own reservations." ON "public"."stock_reservations" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_bogo_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_cash_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_sale_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_option_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_option_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_skus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sku_option_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_reservation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_reservations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."user_role" TO "authenticated";
GRANT ALL ON TYPE "public"."user_role" TO "anon";
GRANT ALL ON TYPE "public"."user_role" TO "authenticator";
GRANT ALL ON TYPE "public"."user_role" TO "supabase_auth_admin";
GRANT ALL ON TYPE "public"."user_role" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cancel_stock_reservation"("p_reservation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_stock_reservation"("p_reservation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_stock_reservation"("p_reservation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_stock_reservation_by_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_stock_reservation_by_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_stock_reservation_by_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_product_pos_sales"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_product_pos_sales"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_product_pos_sales"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations_for_product"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations_for_product"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations_for_product"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_stock_reservation"("p_reservation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_stock_reservation"("p_reservation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_stock_reservation"("p_reservation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_pos_stock"("p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_pos_stock"("p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_pos_stock"("p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_sku_stock"("p_sku_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_sku_stock"("p_sku_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_sku_stock"("p_sku_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_effective_stock"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_effective_stock"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_effective_stock"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_stock_with_cleanup"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_stock_with_cleanup"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_stock_with_cleanup"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_with_effective_stock"("product_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_with_effective_stock"("product_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_with_effective_stock"("product_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_stock"("p_sku_id" "uuid", "p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_stock"("p_sku_id" "uuid", "p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_stock"("p_sku_id" "uuid", "p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_pos_stock"("p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_pos_stock"("p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_pos_stock"("p_items" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."pos_bogo_offers" TO "anon";
GRANT ALL ON TABLE "public"."pos_bogo_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_bogo_offers" TO "service_role";



GRANT ALL ON TABLE "public"."pos_cash_events" TO "anon";
GRANT ALL ON TABLE "public"."pos_cash_events" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_cash_events" TO "service_role";



GRANT ALL ON TABLE "public"."pos_sale_payments" TO "anon";
GRANT ALL ON TABLE "public"."pos_sale_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_sale_payments" TO "service_role";



GRANT ALL ON TABLE "public"."pos_sales" TO "anon";
GRANT ALL ON TABLE "public"."pos_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_sales" TO "service_role";



GRANT ALL ON TABLE "public"."product_option_types" TO "anon";
GRANT ALL ON TABLE "public"."product_option_types" TO "authenticated";
GRANT ALL ON TABLE "public"."product_option_types" TO "service_role";



GRANT ALL ON TABLE "public"."product_option_values" TO "anon";
GRANT ALL ON TABLE "public"."product_option_values" TO "authenticated";
GRANT ALL ON TABLE "public"."product_option_values" TO "service_role";



GRANT ALL ON TABLE "public"."product_skus" TO "anon";
GRANT ALL ON TABLE "public"."product_skus" TO "authenticated";
GRANT ALL ON TABLE "public"."product_skus" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sku_option_values" TO "anon";
GRANT ALL ON TABLE "public"."sku_option_values" TO "authenticated";
GRANT ALL ON TABLE "public"."sku_option_values" TO "service_role";



GRANT ALL ON TABLE "public"."stock_reservation_items" TO "anon";
GRANT ALL ON TABLE "public"."stock_reservation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_reservation_items" TO "service_role";



GRANT ALL ON TABLE "public"."stock_reservations" TO "anon";
GRANT ALL ON TABLE "public"."stock_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_reservations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Anyone can update product images"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'product-images'::text))
with check ((bucket_id = 'product-images'::text));



  create policy "Anyone can view product images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'product-images'::text));



  create policy "Authenticated users can upload product images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'product-images'::text));



