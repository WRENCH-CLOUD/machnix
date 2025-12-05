// Supabase Database Types
// Auto-generated from schema files in lib/supabase/schemas/
// To regenerate: npx supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vehicle_category: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      vehicle_make: {
        Row: {
          id: string
          name: string
          code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          created_at?: string
        }
      }
      vehicle_model: {
        Row: {
          id: string
          make_id: string
          name: string
          model_code: string | null
          vehicle_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          make_id: string
          name: string
          model_code?: string | null
          vehicle_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          make_id?: string
          name?: string
          model_code?: string | null
          vehicle_category?: string | null
          created_at?: string
        }
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
  }
  tenant: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          created_at?: string
          metadata?: Json
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          auth_user_id: string
          name: string
          email: string
          phone: string | null
          role: string
          avatar_url: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          auth_user_id: string
          name: string
          email: string
          phone?: string | null
          role?: string
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          auth_user_id?: string
          name?: string
          email?: string
          phone?: string | null
          role?: string
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          reg_no: string
          vin: string | null
          make_id: string | null
          model_id: string | null
          year: number | null
          odometer: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          reg_no: string
          vin?: string | null
          make_id?: string | null
          model_id?: string | null
          year?: number | null
          odometer?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          reg_no?: string
          vin?: string | null
          make_id?: string | null
          model_id?: string | null
          year?: number | null
          odometer?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      mechanics: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          skills: string[] | null
          hourly_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          email?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          created_at?: string
        }
      }
      jobcards: {
        Row: {
          id: string
          tenant_id: string
          job_number: string
          vehicle_id: string
          customer_id: string
          created_by: string | null
          assigned_mechanic_id: string | null
          status: string
          details: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          job_number: string
          vehicle_id: string
          customer_id: string
          created_by?: string | null
          assigned_mechanic_id?: string | null
          status?: string
          details?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          job_number?: string
          vehicle_id?: string
          customer_id?: string
          created_by?: string | null
          assigned_mechanic_id?: string | null
          status?: string
          details?: Json
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          tenant_id: string
          jobcard_id: string | null
          created_by: string | null
          status: string
          total_amount: number
          tax_amount: number
          currency: string
          items: Json
          created_at: string
          updated_at: string
          estimate_number: string
          customer_id: string | null
          vehicle_id: string | null
          description: string | null
          labor_total: number
          parts_total: number
          discount_amount: number
          valid_until: string | null
          approved_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          jobcard_id?: string | null
          created_by?: string | null
          status?: string
          total_amount?: number
          tax_amount?: number
          currency?: string
          items?: Json
          created_at?: string
          updated_at?: string
          estimate_number?: string
          customer_id?: string | null
          vehicle_id?: string | null
          description?: string | null
          labor_total?: number
          parts_total?: number
          discount_amount?: number
          valid_until?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          jobcard_id?: string | null
          created_by?: string | null
          status?: string
          total_amount?: number
          tax_amount?: number
          currency?: string
          items?: Json
          created_at?: string
          updated_at?: string
          estimate_number?: string
          customer_id?: string | null
          vehicle_id?: string | null
          description?: string | null
          labor_total?: number
          parts_total?: number
          discount_amount?: number
          valid_until?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
        }
      }
      estimate_items: {
        Row: {
          id: string
          estimate_id: string
          part_id: string | null
          custom_name: string | null
          custom_part_number: string | null
          description: string | null
          qty: number
          unit_price: number
          labor_cost: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          part_id?: string | null
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          qty: number
          unit_price: number
          labor_cost?: number
          total?: number
          created_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          part_id?: string | null
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          qty?: number
          unit_price?: number
          labor_cost?: number
          total?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          jobcard_id: string | null
          estimate_id: string | null
          invoice_number: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          due_date: string | null
          issued_at: string
          metadata: Json
          payment_mode: string | null
          customer_id: string | null
          invoice_date: string
          tax_amount: number
          discount_amount: number
          total_amount: number
          paid_amount: number
          notes: string | null
          created_by: string | null
          updated_at: string
          balance: number
        }
        Insert: {
          id?: string
          tenant_id: string
          jobcard_id?: string | null
          estimate_id?: string | null
          invoice_number?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          due_date?: string | null
          issued_at?: string
          metadata?: Json
          payment_mode?: string | null
          customer_id?: string | null
          invoice_date?: string
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          created_by?: string | null
          updated_at?: string
          balance?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          jobcard_id?: string | null
          estimate_id?: string | null
          invoice_number?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          due_date?: string | null
          issued_at?: string
          metadata?: Json
          payment_mode?: string | null
          customer_id?: string | null
          invoice_date?: string
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          created_by?: string | null
          updated_at?: string
          balance?: number
        }
      }
      parts: {
        Row: {
          id: string
          tenant_id: string
          sku: string | null
          name: string
          description: string | null
          unit_cost: number
          sell_price: number
          stock_on_hand: number
          reorder_level: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          sku?: string | null
          name: string
          description?: string | null
          unit_cost?: number
          sell_price?: number
          stock_on_hand?: number
          reorder_level?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          sku?: string | null
          name?: string
          description?: string | null
          unit_cost?: number
          sell_price?: number
          stock_on_hand?: number
          reorder_level?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      part_usages: {
        Row: {
          id: string
          tenant_id: string
          jobcard_id: string
          part_id: string
          qty: number
          unit_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          jobcard_id: string
          part_id: string
          qty: number
          unit_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          jobcard_id?: string
          part_id?: string
          qty?: number
          unit_price?: number | null
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          tenant_id: string
          part_id: string
          transaction_type: string
          quantity: number
          unit_cost: number | null
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          part_id: string
          transaction_type: string
          quantity: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          part_id?: string
          transaction_type?: string
          quantity?: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          amount: number
          method: string | null
          gateway_ref: string | null
          status: string
          paid_at: string | null
          payment_date: string
          payment_method: string
          reference_number: string | null
          notes: string | null
          received_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          amount: number
          method?: string | null
          gateway_ref?: string | null
          status?: string
          paid_at?: string | null
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_id?: string
          amount?: number
          method?: string | null
          gateway_ref?: string | null
          status?: string
          paid_at?: string | null
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
        }
      }
      payment_transactions: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          mode: string
          amount: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          mode: string
          amount: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_id?: string
          mode?: string
          amount?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          created_at?: string
          paid_at?: string | null
        }
      }
      dvi_templates: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dvi_checkpoint_categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dvi_checkpoints: {
        Row: {
          id: string
          tenant_id: string
          template_id: string | null
          category_id: string | null
          name: string
          description: string | null
          display_order: number
          is_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          template_id?: string | null
          category_id?: string | null
          name: string
          description?: string | null
          display_order?: number
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          template_id?: string | null
          category_id?: string | null
          name?: string
          description?: string | null
          display_order?: number
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dvi_items: {
        Row: {
          id: string
          jobcard_id: string
          checkpoint_id: string
          status: string
          notes: string | null
          checkpoint_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          jobcard_id: string
          checkpoint_id: string
          status?: string
          notes?: string | null
          checkpoint_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          jobcard_id?: string
          checkpoint_id?: string
          status?: string
          notes?: string | null
          checkpoint_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dvi_photos: {
        Row: {
          id: string
          dvi_item_id: string
          storage_path: string
          url: string
          caption: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          dvi_item_id: string
          storage_path: string
          url: string
          caption?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dvi_item_id?: string
          storage_path?: string
          url?: string
          caption?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          tenant_id: string
          jobcard_id: string
          user_id: string | null
          activity_type: string
          description: string
          metadata: Json
          created_at: string
          entity_type: string | null
          entity_id: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          jobcard_id: string
          user_id?: string | null
          activity_type: string
          description: string
          metadata?: Json
          created_at?: string
          entity_type?: string | null
          entity_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          jobcard_id?: string
          user_id?: string | null
          activity_type?: string
          description?: string
          metadata?: Json
          created_at?: string
          entity_type?: string | null
          entity_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string | null
          jobcard_id: string | null
          channel: string
          template: string | null
          payload: Json | null
          status: string
          sent_at: string | null
          user_id: string | null
          category: string | null
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id?: string | null
          jobcard_id?: string | null
          channel: string
          template?: string | null
          payload?: Json | null
          status?: string
          sent_at?: string | null
          user_id?: string | null
          category?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string | null
          jobcard_id?: string | null
          channel?: string
          template?: string | null
          payload?: Json | null
          status?: string
          sent_at?: string | null
          user_id?: string | null
          category?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      customer_communications: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          jobcard_id: string | null
          type: string
          direction: string
          subject: string | null
          message: string | null
          status: string | null
          metadata: Json
          sent_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          jobcard_id?: string | null
          type: string
          direction: string
          subject?: string | null
          message?: string | null
          status?: string | null
          metadata?: Json
          sent_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          jobcard_id?: string | null
          type?: string
          direction?: string
          subject?: string | null
          message?: string | null
          status?: string | null
          metadata?: Json
          sent_by?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          tenant_id: string
          tax_rate: number
          currency: string
          timezone: string
          sms_enabled: boolean
          email_enabled: boolean
          whatsapp_enabled: boolean
          invoice_prefix: string
          job_prefix: string
          estimate_prefix: string
          invoice_footer: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tax_rate?: number
          currency?: string
          timezone?: string
          sms_enabled?: boolean
          email_enabled?: boolean
          whatsapp_enabled?: boolean
          invoice_prefix?: string
          job_prefix?: string
          estimate_prefix?: string
          invoice_footer?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          tax_rate?: number
          currency?: string
          timezone?: string
          sms_enabled?: boolean
          email_enabled?: boolean
          whatsapp_enabled?: boolean
          invoice_prefix?: string
          job_prefix?: string
          estimate_prefix?: string
          invoice_footer?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      razorpay_settings: {
        Row: {
          id: string
          tenant_id: string
          key_id: string
          key_secret: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          key_id: string
          key_secret: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          key_id?: string
          key_secret?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
