export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity?: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
          wompi_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
          wompi_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string
          wompi_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_bogo_offers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          product_id: string | null
          variant_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          product_id?: string | null
          variant_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          product_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_bogo_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_bogo_offers_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_cash_events: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_cash_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_payments: {
        Row: {
          amount: number
          id: string
          method: string
          sale_id: string
        }
        Insert: {
          amount: number
          id?: string
          method: string
          sale_id: string
        }
        Update: {
          amount?: number
          id?: string
          method?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          amount_received: number | null
          change_amount: number | null
          channel: string | null
          created_at: string
          customer_name: string | null
          discount_amount: number | null
          discount_reason: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string
          payment_status: string | null
          seller_id: string
          subtotal: number
          total: number
          work_order_id: string | null
        }
        Insert: {
          amount_received?: number | null
          change_amount?: number | null
          channel?: string | null
          created_at?: string
          customer_name?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          id?: string
          items: Json
          notes?: string | null
          payment_method: string
          payment_status?: string | null
          seller_id: string
          subtotal: number
          total: number
          work_order_id?: string | null
        }
        Update: {
          amount_received?: number | null
          change_amount?: number | null
          channel?: string | null
          created_at?: string
          customer_name?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_status?: string | null
          seller_id?: string
          subtotal?: number
          total?: number
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_types: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          id: string
          option_type_id: string
          position: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_type_id: string
          position?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          option_type_id?: string
          position?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_type_id_fkey"
            columns: ["option_type_id"]
            isOneToOne: false
            referencedRelation: "product_option_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_skus: {
        Row: {
          active: boolean
          created_at: string
          id: string
          price_override: number | null
          product_id: string
          sku_code: string
          stock: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          price_override?: number | null
          product_id: string
          sku_code: string
          stock?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          price_override?: number | null
          product_id?: string
          sku_code?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_skus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string
          has_active_reservation: boolean
          id: string
          image_url: string | null
          name: string
          price: number
          stock: number
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description: string
          has_active_reservation?: boolean
          id?: string
          image_url?: string | null
          name: string
          price?: number
          stock?: number
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          has_active_reservation?: boolean
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      sku_option_values: {
        Row: {
          option_value_id: string
          sku_id: string
        }
        Insert: {
          option_value_id: string
          sku_id: string
        }
        Update: {
          option_value_id?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_option_values_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservation_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          reservation_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reservation_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reservation_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "stock_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservation_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          cancelled_at: string | null
          cart_hash: string
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          cart_hash: string
          confirmed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          cart_hash?: string
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_stock_reservation: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      cancel_stock_reservation_by_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      cleanup_expired_reservations: { Args: never; Returns: number }
      cleanup_expired_reservations_for_product: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      confirm_stock_reservation: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      create_stock_reservation: {
        Args: {
          p_items: Json
          p_reservation_minutes?: number
          p_user_id: string
        }
        Returns: string
      }
      decrement_pos_stock: { Args: { p_items: Json }; Returns: boolean }
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      decrement_sku_stock: {
        Args: { p_quantity: number; p_sku_id: string }
        Returns: undefined
      }
      get_product_effective_stock: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_product_price: {
        Args: { p_product_id: string; p_variant_id?: string }
        Returns: number
      }
      get_product_stock: {
        Args: { p_product_id: string; p_variant_id?: string }
        Returns: number
      }
      get_product_stock_with_cleanup: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_products_with_effective_stock: {
        Args: { product_ids: string[] }
        Returns: {
          effective_stock: number
          product_id: string
        }[]
      }
      increment_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      increment_sku_stock: {
        Args: { p_quantity: number; p_sku_id: string }
        Returns: undefined
      }
      reserve_stock: {
        Args: { p_product_id: string; p_quantity: number; p_sku_id: string }
        Returns: boolean
      }
      restore_pos_stock: { Args: { p_items: Json }; Returns: boolean }
    }
    Enums: {
      order_status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR"
      user_role: "cliente" | "administrador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: ["PENDING", "APPROVED", "DECLINED", "ERROR"],
      user_role: ["cliente", "administrador"],
    },
  },
} as const

