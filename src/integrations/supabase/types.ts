export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_customers: {
        Row: {
          blocked_at: string
          customer_name: string | null
          id: string
          linked_group: string | null
          reason: string | null
          type: string
          value: string
        }
        Insert: {
          blocked_at?: string
          customer_name?: string | null
          id?: string
          linked_group?: string | null
          reason?: string | null
          type: string
          value: string
        }
        Update: {
          blocked_at?: string
          customer_name?: string | null
          id?: string
          linked_group?: string | null
          reason?: string | null
          type?: string
          value?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          date: string | null
          excerpt: string | null
          gallery_images: Json | null
          id: string
          image: string | null
          meta_description: string | null
          meta_keywords: string | null
          slug: string
          status: string | null
          title: string
          type: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          excerpt?: string | null
          gallery_images?: Json | null
          id: string
          image?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          slug: string
          status?: string | null
          title: string
          type?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          excerpt?: string | null
          gallery_images?: Json | null
          id?: string
          image?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          slug?: string
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string | null
          id: string
          name: string
          product_count: number | null
          slug: string
        }
        Insert: {
          icon?: string | null
          id: string
          name: string
          product_count?: number | null
          slug: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          product_count?: number | null
          slug?: string
        }
        Relationships: []
      }
      counters: {
        Row: {
          id: string
          value: number
        }
        Insert: {
          id: string
          value?: number
        }
        Update: {
          id?: string
          value?: number
        }
        Relationships: []
      }
      courier_dispatch: {
        Row: {
          consignment_id: string | null
          courier_status: string | null
          courier_type: string | null
          order_id: string
          sent_at: string | null
          store_id: string | null
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          consignment_id?: string | null
          courier_status?: string | null
          courier_type?: string | null
          order_id: string
          sent_at?: string | null
          store_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          consignment_id?: string | null
          courier_status?: string | null
          courier_type?: string | null
          order_id?: string
          sent_at?: string | null
          store_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      courier_ratio_cache: {
        Row: {
          all_count: number | null
          checked_at: string | null
          delivered: number | null
          phone: string
          returned: number | null
        }
        Insert: {
          all_count?: number | null
          checked_at?: string | null
          delivered?: number | null
          phone: string
          returned?: number | null
        }
        Update: {
          all_count?: number | null
          checked_at?: string | null
          delivered?: number | null
          phone?: string
          returned?: number | null
        }
        Relationships: []
      }
      courier_settings: {
        Row: {
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number | null
          date: string | null
          id: string
          note: string | null
          source: string | null
          title: string
        }
        Insert: {
          amount?: number | null
          date?: string | null
          id: string
          note?: string | null
          source?: string | null
          title: string
        }
        Update: {
          amount?: number | null
          date?: string | null
          id?: string
          note?: string | null
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      employee_activities: {
        Row: {
          action: string | null
          details: string | null
          employee_id: string
          employee_name: string
          id: string
          order_id: string | null
          timestamp: string | null
        }
        Insert: {
          action?: string | null
          details?: string | null
          employee_id: string
          employee_name: string
          id: string
          order_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string | null
          details?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          order_id?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          password: string
          permissions: Json | null
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name: string
          password: string
          permissions?: Json | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password?: string
          permissions?: Json | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number | null
          category: string | null
          date: string | null
          employee_id: string | null
          id: string
          note: string | null
          title: string
        }
        Insert: {
          amount?: number | null
          category?: string | null
          date?: string | null
          employee_id?: string | null
          id: string
          note?: string | null
          title: string
        }
        Update: {
          amount?: number | null
          category?: string | null
          date?: string | null
          employee_id?: string | null
          id?: string
          note?: string | null
          title?: string
        }
        Relationships: []
      }
      follow_up_data: {
        Row: {
          courier_locked: boolean | null
          courier_name: string | null
          note: string | null
          order_id: string
          status: string | null
          stock_type: string | null
          tracking_url: string | null
          updated_at: string | null
          vendor_buy_price: number | null
        }
        Insert: {
          courier_locked?: boolean | null
          courier_name?: string | null
          note?: string | null
          order_id: string
          status?: string | null
          stock_type?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          vendor_buy_price?: number | null
        }
        Update: {
          courier_locked?: boolean | null
          courier_name?: string | null
          note?: string | null
          order_id?: string
          status?: string | null
          stock_type?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          vendor_buy_price?: number | null
        }
        Relationships: []
      }
      fraud_settings: {
        Row: {
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          address: string
          block_reason: string | null
          created_at: string
          customer_fingerprint: string | null
          customer_ip: string | null
          delivery_charge: number
          delivery_zone: string
          grand_total: number
          id: string
          items: Json
          name: string
          phone: string
          status: string | null
          total_price: number
          type: string
        }
        Insert: {
          address?: string
          block_reason?: string | null
          created_at?: string
          customer_fingerprint?: string | null
          customer_ip?: string | null
          delivery_charge?: number
          delivery_zone?: string
          grand_total?: number
          id: string
          items?: Json
          name?: string
          phone?: string
          status?: string | null
          total_price?: number
          type?: string
        }
        Update: {
          address?: string
          block_reason?: string | null
          created_at?: string
          customer_fingerprint?: string | null
          customer_ip?: string | null
          delivery_charge?: number
          delivery_zone?: string
          grand_total?: number
          id?: string
          items?: Json
          name?: string
          phone?: string
          status?: string | null
          total_price?: number
          type?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          slug: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          slug: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          assigned_to: string | null
          assigned_to_name: string | null
          confirmed_by: string | null
          created_at: string | null
          customer: string
          customer_fingerprint: string | null
          customer_ip: string | null
          date: string | null
          delivery_charge: number | null
          id: string
          iso_date: string | null
          items: Json
          note: string | null
          original_delivery_charge: number | null
          paid_return_amount: number | null
          phone: string
          status: string | null
          total: number | null
        }
        Insert: {
          address: string
          assigned_to?: string | null
          assigned_to_name?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer: string
          customer_fingerprint?: string | null
          customer_ip?: string | null
          date?: string | null
          delivery_charge?: number | null
          id: string
          iso_date?: string | null
          items?: Json
          note?: string | null
          original_delivery_charge?: number | null
          paid_return_amount?: number | null
          phone: string
          status?: string | null
          total?: number | null
        }
        Update: {
          address?: string
          assigned_to?: string | null
          assigned_to_name?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer?: string
          customer_fingerprint?: string | null
          customer_ip?: string | null
          date?: string | null
          delivery_charge?: number | null
          id?: string
          iso_date?: string | null
          items?: Json
          note?: string | null
          original_delivery_charge?: number | null
          paid_return_amount?: number | null
          phone?: string
          status?: string | null
          total?: number | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          account_number: string | null
          amount: number | null
          date: string | null
          id: string
          method: string | null
          reseller_id: string
          reseller_name: string | null
          status: string | null
        }
        Insert: {
          account_number?: string | null
          amount?: number | null
          date?: string | null
          id: string
          method?: string | null
          reseller_id: string
          reseller_name?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string | null
          amount?: number | null
          date?: string | null
          id?: string
          method?: string | null
          reseller_id?: string
          reseller_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          buy_price: number | null
          category: string | null
          colors: Json | null
          created_at: string | null
          featured_image: string | null
          featured_video: string | null
          free_delivery: boolean | null
          id: string
          images: Json | null
          in_stock: boolean | null
          long_description: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_tags: Json | null
          original_price: number | null
          price: number
          rating: number | null
          reseller_price: number | null
          review_count: number | null
          reviews: Json | null
          short_description: string | null
          sizes: Json | null
          slug: string
          status: string | null
          stock_product_name: string | null
          stock_type: string | null
          title: string
          variation_prices: Json | null
          variations: Json | null
          weights: Json | null
        }
        Insert: {
          brand?: string | null
          buy_price?: number | null
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          featured_image?: string | null
          featured_video?: string | null
          free_delivery?: boolean | null
          id: string
          images?: Json | null
          in_stock?: boolean | null
          long_description?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_tags?: Json | null
          original_price?: number | null
          price?: number
          rating?: number | null
          reseller_price?: number | null
          review_count?: number | null
          reviews?: Json | null
          short_description?: string | null
          sizes?: Json | null
          slug: string
          status?: string | null
          stock_product_name?: string | null
          stock_type?: string | null
          title: string
          variation_prices?: Json | null
          variations?: Json | null
          weights?: Json | null
        }
        Update: {
          brand?: string | null
          buy_price?: number | null
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          featured_image?: string | null
          featured_video?: string | null
          free_delivery?: boolean | null
          id?: string
          images?: Json | null
          in_stock?: boolean | null
          long_description?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_tags?: Json | null
          original_price?: number | null
          price?: number
          rating?: number | null
          reseller_price?: number | null
          review_count?: number | null
          reviews?: Json | null
          short_description?: string | null
          sizes?: Json | null
          slug?: string
          status?: string | null
          stock_product_name?: string | null
          stock_type?: string | null
          title?: string
          variation_prices?: Json | null
          variations?: Json | null
          weights?: Json | null
        }
        Relationships: []
      }
      reseller_orders: {
        Row: {
          cod_charge: number | null
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          date: string | null
          delivery_charge: number | null
          id: string
          items: Json
          notes: Json | null
          packaging_charge: number | null
          reseller_id: string
          reseller_name: string | null
          status: string | null
          total_profit: number | null
          total_reseller_cost: number | null
          total_selling_price: number | null
        }
        Insert: {
          cod_charge?: number | null
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          date?: string | null
          delivery_charge?: number | null
          id: string
          items?: Json
          notes?: Json | null
          packaging_charge?: number | null
          reseller_id: string
          reseller_name?: string | null
          status?: string | null
          total_profit?: number | null
          total_reseller_cost?: number | null
          total_selling_price?: number | null
        }
        Update: {
          cod_charge?: number | null
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string | null
          delivery_charge?: number | null
          id?: string
          items?: Json
          notes?: Json | null
          packaging_charge?: number | null
          reseller_id?: string
          reseller_name?: string | null
          status?: string | null
          total_profit?: number | null
          total_reseller_cost?: number | null
          total_selling_price?: number | null
        }
        Relationships: []
      }
      reseller_payment_methods: {
        Row: {
          account_number: string
          created_at: string | null
          id: string
          label: string | null
          method_type: string
          reseller_id: string
        }
        Insert: {
          account_number?: string
          created_at?: string | null
          id: string
          label?: string | null
          method_type?: string
          reseller_id: string
        }
        Update: {
          account_number?: string
          created_at?: string | null
          id?: string
          label?: string | null
          method_type?: string
          reseller_id?: string
        }
        Relationships: []
      }
      reseller_product_prices: {
        Row: {
          custom_price: number
          id: string
          product_id: string
          reseller_id: string
        }
        Insert: {
          custom_price: number
          id?: string
          product_id: string
          reseller_id: string
        }
        Update: {
          custom_price?: number
          id?: string
          product_id?: string
          reseller_id?: string
        }
        Relationships: []
      }
      resellers: {
        Row: {
          approval_status: string | null
          balance: number | null
          created_at: string | null
          deactivation_note: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          password: string
          phone: string | null
          shop_name: string | null
        }
        Insert: {
          approval_status?: string | null
          balance?: number | null
          created_at?: string | null
          deactivation_note?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name: string
          password: string
          phone?: string | null
          shop_name?: string | null
        }
        Update: {
          approval_status?: string | null
          balance?: number | null
          created_at?: string | null
          deactivation_note?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password?: string
          phone?: string | null
          shop_name?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          buy_price: number | null
          damage: number | null
          date: string | null
          id: string
          note: string | null
          product_name: string
          quantity: number | null
          sell_price: number | null
          supplier: string | null
        }
        Insert: {
          buy_price?: number | null
          damage?: number | null
          date?: string | null
          id: string
          note?: string | null
          product_name: string
          quantity?: number | null
          sell_price?: number | null
          supplier?: string | null
        }
        Update: {
          buy_price?: number | null
          damage?: number | null
          date?: string | null
          id?: string
          note?: string | null
          product_name?: string
          quantity?: number | null
          sell_price?: number | null
          supplier?: string | null
        }
        Relationships: []
      }
      variations: {
        Row: {
          id: string
          name: string
          type: string
        }
        Insert: {
          id: string
          name: string
          type: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
