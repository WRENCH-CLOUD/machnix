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
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["platform_admin_role"] | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["platform_admin_role"] | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["platform_admin_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          version?: string
        }
        Relationships: []
      }
      vehicle_category: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicle_make: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicle_model: {
        Row: {
          created_at: string | null
          id: string
          make_id: string
          model_code: string | null
          name: string
          vehicle_category: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          make_id: string
          model_code?: string | null
          name: string
          vehicle_category?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          make_id?: string
          model_code?: string | null
          name?: string
          vehicle_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_model_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_make"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_mechanic_active_jobs: {
        Args: { mechanic_id: string }
        Returns: undefined
      }
      get_or_create_user_tenant: { Args: { user_id: string }; Returns: string }
      increment_mechanic_active_jobs: {
        Args: { mechanic_id: string }
        Returns: undefined
      }
      set_config: {
        Args: { parameter: string; value: string }
        Returns: undefined
      }
      test_tenant_insert: { Args: never; Returns: Json }
    }
    Enums: {
      platform_admin_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  tenant: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          jobcard_id: string
          metadata: Json | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          jobcard_id: string
          metadata?: Json | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          jobcard_id?: string
          metadata?: Json | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          created_at: string | null
          customer_id: string
          direction: string
          id: string
          jobcard_id: string | null
          message: string | null
          metadata: Json | null
          sent_by: string | null
          status: string | null
          subject: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          direction: string
          id?: string
          jobcard_id?: string | null
          message?: string | null
          metadata?: Json | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          direction?: string
          id?: string
          jobcard_id?: string | null
          message?: string | null
          metadata?: Json | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_checkpoint_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dvi_checkpoints: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          name: string
          template_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name: string
          template_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name?: string
          template_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dvi_checkpoints_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dvi_checkpoint_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_checkpoints_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "dvi_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_items: {
        Row: {
          checkpoint_id: string
          checkpoint_name: string | null
          created_at: string | null
          id: string
          jobcard_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          checkpoint_id: string
          checkpoint_name?: string | null
          created_at?: string | null
          id?: string
          jobcard_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          checkpoint_id?: string
          checkpoint_name?: string | null
          created_at?: string | null
          id?: string
          jobcard_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dvi_items_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          dvi_item_id: string
          id: string
          storage_path: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          dvi_item_id: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          dvi_item_id?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "dvi_photos_dvi_item_id_fkey"
            columns: ["dvi_item_id"]
            isOneToOne: false
            referencedRelation: "dvi_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      estimate_items: {
        Row: {
          created_at: string | null
          custom_name: string | null
          custom_part_number: string | null
          description: string | null
          estimate_id: string
          id: string
          labor_cost: number | null
          part_id: string | null
          qty: number
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          labor_cost?: number | null
          part_id?: string | null
          qty: number
          total?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          labor_cost?: number | null
          part_id?: string | null
          qty?: number
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          discount_amount: number | null
          estimate_number: string
          id: string
          items: Json | null
          jobcard_id: string | null
          labor_total: number | null
          parts_total: number | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          discount_amount?: number | null
          estimate_number?: string
          id?: string
          items?: Json | null
          jobcard_id?: string | null
          labor_total?: number | null
          parts_total?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          discount_amount?: number | null
          estimate_number?: string
          id?: string
          items?: Json | null
          jobcard_id?: string | null
          labor_total?: number | null
          parts_total?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_full"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          part_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          part_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          part_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          item_name: string
          item_number: string | null
          labor_cost: number | null
          qty: number
          total: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          item_name: string
          item_number?: string | null
          labor_cost?: number | null
          qty?: number
          total?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          item_name?: string
          item_number?: string | null
          labor_cost?: number | null
          qty?: number
          total?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance: number | null
          created_by: string | null
          customer_id: string | null
          discount_amount: number | null
          due_date: string | null
          estimate_id: string | null
          file_key: string | null
          filename: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          issued_at: string | null
          jobcard_id: string | null
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          payment_mode: string | null
          status: string
          subtotal: number | null
          tax: number | null
          tax_amount: number | null
          tenant_id: string
          total: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          estimate_id?: string | null
          file_key?: string | null
          filename?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          issued_at?: string | null
          jobcard_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tenant_id: string
          total?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          estimate_id?: string | null
          file_key?: string | null
          filename?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          issued_at?: string | null
          jobcard_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tenant_id?: string
          total?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcards: {
        Row: {
          assigned_mechanic_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          details: Json | null
          id: string
          job_number: string
          status: string
          tenant_id: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_mechanic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          details?: Json | null
          id?: string
          job_number: string
          status?: string
          tenant_id: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_mechanic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          details?: Json | null
          id?: string
          job_number?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcards_assigned_mechanic_id_fkey"
            columns: ["assigned_mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcards_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_full"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "jobcards_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          name: string
          phone: string | null
          skills: string[] | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          phone?: string | null
          skills?: string[] | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          phone?: string | null
          skills?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string | null
          channel: string
          created_at: string | null
          customer_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          jobcard_id: string | null
          payload: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          template: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          channel: string
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          jobcard_id?: string | null
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          channel?: string
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          jobcard_id?: string | null
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      part_usages: {
        Row: {
          created_at: string | null
          id: string
          jobcard_id: string
          labor_cost: number | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          qty: number
          tenant_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jobcard_id: string
          labor_cost?: number | null
          part_id?: string | null
          part_name?: string | null
          part_number?: string | null
          qty: number
          tenant_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jobcard_id?: string
          labor_cost?: number | null
          part_id?: string | null
          part_name?: string | null
          part_number?: string | null
          qty?: number
          tenant_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "part_usages_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usages_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          reorder_level: number | null
          sell_price: number | null
          sku: string | null
          stock_on_hand: number | null
          tenant_id: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          reorder_level?: number | null
          sell_price?: number | null
          sku?: string | null
          stock_on_hand?: number | null
          tenant_id: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          reorder_level?: number | null
          sell_price?: number | null
          sku?: string | null
          stock_on_hand?: number | null
          tenant_id?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          mode: string
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          mode: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          mode?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          gateway_ref: string | null
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          payment_date: string | null
          payment_method: string
          received_by: string | null
          reference_number: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          gateway_ref?: string | null
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string
          received_by?: string | null
          reference_number?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          gateway_ref?: string | null
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string
          received_by?: string | null
          reference_number?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      razorpay_settings: {
        Row: {
          created_at: string | null
          id: string
          key_id: string
          key_secret: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_id: string
          key_secret: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_id?: string
          key_secret?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          currency: string | null
          email_enabled: boolean | null
          estimate_prefix: string | null
          id: string
          invoice_footer: string | null
          invoice_prefix: string | null
          job_prefix: string | null
          logo_url: string | null
          sms_enabled: boolean | null
          tax_rate: number | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          email_enabled?: boolean | null
          estimate_prefix?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          job_prefix?: string | null
          logo_url?: string | null
          sms_enabled?: boolean | null
          tax_rate?: number | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          email_enabled?: boolean | null
          estimate_prefix?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          job_prefix?: string | null
          logo_url?: string | null
          sms_enabled?: boolean | null
          tax_rate?: number | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          slug: string | null
          status: Database["tenant"]["Enums"]["tenant_status"]
          subscription: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          slug?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"]
          subscription?: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"]
          subscription?: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          jobcard_id: string | null
          notes: string | null
          payment_method: string
          reference_id: string | null
          tenant_id: string
          transaction_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          jobcard_id?: string | null
          notes?: string | null
          payment_method: string
          reference_id?: string | null
          tenant_id: string
          transaction_date?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          jobcard_id?: string | null
          notes?: string | null
          payment_method?: string
          reference_id?: string | null
          tenant_id?: string
          transaction_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_jobcard_id_fkey"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          phone: string | null
          role: Database["tenant"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          phone?: string | null
          role?: Database["tenant"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          phone?: string | null
          role?: Database["tenant"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          make_id: string | null
          model_id: string | null
          notes: string | null
          odometer: number | null
          reg_no: string
          tenant_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          make_id?: string | null
          model_id?: string | null
          notes?: string | null
          odometer?: number | null
          reg_no: string
          tenant_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          make_id?: string | null
          model_id?: string | null
          notes?: string | null
          odometer?: number | null
          reg_no?: string
          tenant_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_full"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_vehicle_full: {
        Row: {
          customer_id: string | null
          make_id: string | null
          make_name: string | null
          model_id: string | null
          model_name: string | null
          odometer: number | null
          reg_no: string | null
          tenant_id: string | null
          vehicle_category: string | null
          vehicle_id: string | null
          vin: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_invoice_totals: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      current_tenant: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      Roles: "admin" | "tenant" | "mechanic"
      subscription_tier: "starter" | "pro" | "enterprise"
      tenant_status: "active" | "suspended" | "trial" | "inactive"
      user_role: "tenant" | "mechanic"
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
      platform_admin_role: ["admin"],
    },
  },
  tenant: {
    Enums: {
      Roles: ["admin", "tenant", "mechanic"],
      subscription_tier: ["starter", "pro", "enterprise"],
      tenant_status: ["active", "suspended", "trial", "inactive"],
      user_role: ["tenant", "mechanic"],
    },
  },
} as const

