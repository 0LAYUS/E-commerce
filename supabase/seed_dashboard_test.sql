-- ============================================
-- SEED DATA: Dashboard Testing
-- All order statuses and valid POS payment statuses
-- ============================================

DO $$
DECLARE
  test_product_id uuid;
  test_product_id2 uuid;
  test_product_id3 uuid;
  test_category_id uuid;
  test_user_id uuid;
  new_order_id uuid;
BEGIN
  -- Find or create test category
  SELECT id INTO test_category_id FROM categories LIMIT 1;
  IF test_category_id IS NULL THEN
    INSERT INTO categories (name, description) VALUES ('Test Category', 'Categoria de prueba')
    RETURNING id INTO test_category_id;
  END IF;

  -- Find or create test products
  SELECT id INTO test_product_id FROM products WHERE category_id = test_category_id LIMIT 1;
  IF test_product_id IS NULL THEN
    INSERT INTO products (category_id, name, description, price, stock, active)
    VALUES (test_category_id, 'Camiseta Básica', 'Camiseta de algodón 100%', 89000, 50, true)
    RETURNING id INTO test_product_id;
  END IF;

  SELECT id INTO test_product_id2 FROM products WHERE category_id = test_category_id AND id != test_product_id LIMIT 1;
  IF test_product_id2 IS NULL THEN
    INSERT INTO products (category_id, name, description, price, stock, active)
    VALUES (test_category_id, 'Pantalón Jean', 'Jean clásico azul', 159000, 30, true)
    RETURNING id INTO test_product_id2;
  END IF;

  SELECT id INTO test_product_id3 FROM products WHERE category_id = test_category_id AND id NOT IN (test_product_id, test_product_id2) LIMIT 1;
  IF test_product_id3 IS NULL THEN
    INSERT INTO products (category_id, name, description, price, stock, active)
    VALUES (test_category_id, 'Zapatos Deportivos', 'Zapatos para correr', 220000, 20, true)
    RETURNING id INTO test_product_id3;
  END IF;

  -- Find or create test user
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  IF test_user_id IS NULL THEN
    INSERT INTO profiles (email, full_name)
    VALUES ('test@example.com', 'Test User')
    RETURNING id INTO test_user_id;
  END IF;

  -- ============================================
  -- ONLINE ORDERS - ALL STATUSES
  -- ============================================

  -- Order 1: TODAY, APPROVED (best seller candidate)
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 267000, 'APPROVED', 'Juan Pérez', 'juan@email.com', 'Calle 123, Bogotá', NOW())
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 2, 89000, NOW());
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id2, 1, 159000, NOW());

  -- Order 2: TODAY, APPROVED (high value)
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 440000, 'APPROVED', 'María López', 'maria@email.com', 'Carrera 45, Medellín', NOW())
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id3, 2, 220000, NOW());

  -- Order 3: TODAY, PENDING
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 89000, 'PENDING', 'Carlos García', 'carlos@email.com', 'Av. El Dorado, Bogotá', NOW())
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW());

  -- Order 4: TODAY, DECLINED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 159000, 'DECLINED', 'Ana Martínez', 'ana@email.com', 'Calle 78, Cali', NOW())
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id2, 1, 159000, NOW());

  -- Order 5: TODAY, ERROR
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 89000, 'ERROR', 'Luis Rodríguez', 'luis@email.com', 'Av. Bolívar, Cartagena', NOW())
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW());

  -- Order 6: YESTERDAY, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 178000, 'APPROVED', 'Pedro Sánchez', 'pedro@email.com', 'Calle 100, Bogotá', NOW() - INTERVAL '1 day')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 2, 89000, NOW() - INTERVAL '1 day');

  -- Order 7: 2 DAYS AGO, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 318000, 'APPROVED', 'Sofia Hernández', 'sofia@email.com', 'Carrera 22, Bucaramanga', NOW() - INTERVAL '2 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id2, 2, 159000, NOW() - INTERVAL '2 days');

  -- Order 8: 3 DAYS AGO, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 89000, 'APPROVED', 'Diego Ramírez', 'diego@email.com', 'Calle 55, Pereira', NOW() - INTERVAL '3 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW() - INTERVAL '3 days');

  -- Order 9: 3 DAYS AGO, PENDING
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 440000, 'PENDING', 'Laura Jiménez', 'laura@email.com', 'Av. Chile, Bogotá', NOW() - INTERVAL '3 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id3, 2, 220000, NOW() - INTERVAL '3 days');

  -- Order 10: 4 DAYS AGO, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 248000, 'APPROVED', 'Andrés Torres', 'andres@email.com', 'Calle 10, Armenia', NOW() - INTERVAL '4 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW() - INTERVAL '4 days');
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id2, 1, 159000, NOW() - INTERVAL '4 days');

  -- Order 11: 5 DAYS AGO, DECLINED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 89000, 'DECLINED', 'Carmen Ruiz', 'carmen@email.com', 'Carrera 30, Manizales', NOW() - INTERVAL '5 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW() - INTERVAL '5 days');

  -- Order 12: 6 DAYS AGO, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 159000, 'APPROVED', 'Roberto Díaz', 'roberto@email.com', 'Av. Guajira, Riohacha', NOW() - INTERVAL '6 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id2, 1, 159000, NOW() - INTERVAL '6 days');

  -- Order 13: 7 DAYS AGO, APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 220000, 'APPROVED', 'Elena Vargas', 'elena@email.com', 'Calle 5, Quibdó', NOW() - INTERVAL '7 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id3, 1, 220000, NOW() - INTERVAL '7 days');

  -- Order 14: 10 DAYS AGO (outside week filter), APPROVED
  INSERT INTO orders (user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at)
  VALUES (test_user_id, 89000, 'APPROVED', 'Francisco Silva', 'francisco@email.com', 'Carrera 15, Cúcuta', NOW() - INTERVAL '10 days')
  RETURNING id INTO new_order_id;
  INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, created_at) VALUES (new_order_id, test_product_id, 1, 89000, NOW() - INTERVAL '10 days');

  -- ============================================
  -- POS SALES - VALID PAYMENT STATUSES ONLY
  -- Valid: paid, pending, partial
  -- ============================================

  -- POS 1: TODAY, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 1',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 3, 'price', 89000),
      jsonb_build_object('product_id', test_product_id2, 'quantity', 1, 'price', 159000)
    ),
    426000, 426000, 'efectivo', 'paid', NOW()
  );

  -- POS 2: TODAY, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 2',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 2, 'price', 89000)
    ),
    178000, 178000, 'tarjeta', 'paid', NOW()
  );

  -- POS 3: TODAY, pending
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 3',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id2, 'quantity', 1, 'price', 159000)
    ),
    159000, 159000, 'transferencia', 'pending', NOW()
  );

  -- POS 4: TODAY, partial
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, discount_amount, total, payment_method, payment_status, amount_received, change_amount, created_at)
  VALUES (
    test_user_id, 'Cliente POS 4',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id3, 'quantity', 1, 'price', 220000)
    ),
    220000, 20000, 200000, 'mixto', 'partial', 100000, 0, NOW()
  );

  -- POS 5: YESTERDAY, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 5',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 5, 'price', 89000)
    ),
    445000, 445000, 'tarjeta', 'paid', NOW() - INTERVAL '1 day'
  );

  -- POS 6: YESTERDAY, pending
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 6',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id2, 'quantity', 2, 'price', 159000)
    ),
    318000, 318000, 'efectivo', 'pending', NOW() - INTERVAL '1 day'
  );

  -- POS 7: 2 DAYS AGO, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 7',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 4, 'price', 89000)
    ),
    356000, 356000, 'tarjeta', 'paid', NOW() - INTERVAL '2 days'
  );

  -- POS 8: 2 DAYS AGO, partial
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, discount_amount, total, payment_method, payment_status, amount_received, change_amount, created_at)
  VALUES (
    test_user_id, 'Cliente POS 8',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id3, 'quantity', 1, 'price', 220000)
    ),
    220000, 20000, 200000, 'mixto', 'partial', 120000, 0, NOW() - INTERVAL '2 days'
  );

  -- POS 9: 3 DAYS AGO, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 9',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 2, 'price', 89000),
      jsonb_build_object('product_id', test_product_id3, 'quantity', 1, 'price', 220000)
    ),
    398000, 398000, 'transferencia', 'paid', NOW() - INTERVAL '3 days'
  );

  -- POS 10: 4 DAYS AGO, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 10',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id2, 'quantity', 1, 'price', 159000)
    ),
    159000, 159000, 'efectivo', 'paid', NOW() - INTERVAL '4 days'
  );

  -- POS 11: 5 DAYS AGO, pending
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 11',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 3, 'price', 89000)
    ),
    267000, 267000, 'tarjeta', 'pending', NOW() - INTERVAL '5 days'
  );

  -- POS 12: 6 DAYS AGO, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 12',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id3, 'quantity', 2, 'price', 220000)
    ),
    440000, 440000, 'efectivo', 'paid', NOW() - INTERVAL '6 days'
  );

  -- POS 13: 7 DAYS AGO, paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 13',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 1, 'price', 89000),
      jsonb_build_object('product_id', test_product_id2, 'quantity', 1, 'price', 159000)
    ),
    248000, 248000, 'tarjeta', 'paid', NOW() - INTERVAL '7 days'
  );

  -- POS 14: 8 DAYS AGO (outside week filter), paid
  INSERT INTO pos_sales (seller_id, customer_name, items, subtotal, total, payment_method, payment_status, created_at)
  VALUES (
    test_user_id, 'Cliente POS 14',
    jsonb_build_array(
      jsonb_build_object('product_id', test_product_id, 'quantity', 1, 'price', 89000)
    ),
    89000, 89000, 'efectivo', 'paid', NOW() - INTERVAL '8 days'
  );

  -- ============================================
  -- STOCK RESERVATIONS
  -- ============================================

  INSERT INTO stock_reservations (user_id, cart_hash, status, expires_at)
  VALUES (test_user_id, 'cart_hash_1', 'pending', NOW() + INTERVAL '30 minutes');

  INSERT INTO stock_reservations (user_id, cart_hash, status, expires_at)
  VALUES (test_user_id, 'cart_hash_2', 'pending', NOW() + INTERVAL '30 minutes');

  INSERT INTO stock_reservations (user_id, cart_hash, status, expires_at)
  VALUES (test_user_id, 'cart_hash_3', 'pending', NOW() + INTERVAL '30 minutes');

  INSERT INTO stock_reservations (user_id, cart_hash, status, expires_at)
  VALUES (test_user_id, 'cart_hash_4', 'pending', NOW() + INTERVAL '30 minutes');

  INSERT INTO stock_reservations (user_id, cart_hash, status, expires_at)
  VALUES (test_user_id, 'cart_hash_5', 'confirmed', NOW() + INTERVAL '30 minutes');

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Test product IDs: %, %, %', test_product_id, test_product_id2, test_product_id3;

END $$;
