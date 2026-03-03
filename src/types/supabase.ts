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
      leads: {
        Row: {
          created_at: string
          email: string
          garage_name: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          garage_name?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          garage_name?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["platform_admin_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["platform_admin_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["platform_admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_defaults: {
        Row: {
          baseline_time_minutes: number
          category_id: string
          created_at: string
          id: string
          service_name: string
          updated_at: string
        }
        Insert: {
          baseline_time_minutes: number
          category_id: string
          created_at?: string
          id?: string
          service_name: string
          updated_at?: string
        }
        Update: {
          baseline_time_minutes?: number
          category_id?: string
          created_at?: string
          id?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_defaults_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "vehicle_model_vehicle_category_fkey"
            columns: ["vehicle_category"]
            isOneToOne: false
            referencedRelation: "vehicle_category"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      is_platform_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      platform_admin_role: "platform_admin" | "employee"
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
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          jobcard_id: string | null
          metadata: Json
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          jobcard_id?: string | null
          metadata?: Json
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          jobcard_id?: string | null
          metadata?: Json
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bays: {
        Row: {
          bay_type: string
          created_at: string
          id: string
          is_available: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bay_type: string
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bay_type?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          counter_key: string
          created_at: string
          current_value: number
          id: string
          prefix: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          counter_key: string
          created_at?: string
          current_value?: number
          id?: string
          prefix: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          counter_key?: string
          created_at?: string
          current_value?: number
          id?: string
          prefix?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counters_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counters_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
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
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dvi_checkpoint_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_checkpoint_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_checkpoint_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_checkpoints: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          name: string
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name: string
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name?: string
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
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
          {
            foreignKeyName: "dvi_checkpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_checkpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_checkpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dvi_items: {
        Row: {
          checkpoint_id: string
          checkpoint_name: string | null
          created_at: string
          id: string
          jobcard_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          checkpoint_id: string
          checkpoint_name?: string | null
          created_at?: string
          id?: string
          jobcard_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          checkpoint_id?: string
          checkpoint_name?: string | null
          created_at?: string
          id?: string
          jobcard_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dvi_items_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "dvi_checkpoints"
            referencedColumns: ["id"]
          },
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
          created_at: string
          dvi_item_id: string
          id: string
          storage_path: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          dvi_item_id: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
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
        ]
      }
      dvi_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dvi_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dvi_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          custom_name: string | null
          custom_part_number: string | null
          description: string | null
          estimate_id: string
          id: string
          labor_cost: number | null
          part_id: string | null
          qty: number
          task_id: string | null
          tenant_id: string
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          labor_cost?: number | null
          part_id?: string | null
          qty: number
          task_id?: string | null
          tenant_id: string
          total?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          custom_part_number?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          labor_cost?: number | null
          part_id?: string | null
          qty?: number
          task_id?: string | null
          tenant_id?: string
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
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_card_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
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
          subtotal: number | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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
          subtotal?: number | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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
          subtotal?: number | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
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
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gupshup_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          source_number: string
          tenant_id: string
          trigger_mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_number: string
          tenant_id: string
          trigger_mode?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_number?: string
          tenant_id?: string
          trigger_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gupshup_settings_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gupshup_settings_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gupshup_settings_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_allocations: {
        Row: {
          consumed_at: string | null
          created_at: string
          created_by: string | null
          estimate_item_id: string | null
          id: string
          item_id: string
          jobcard_id: string
          quantity_consumed: number | null
          quantity_reserved: number
          released_at: string | null
          reserved_at: string
          status: string
          task_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimate_item_id?: string | null
          id?: string
          item_id: string
          jobcard_id: string
          quantity_consumed?: number | null
          quantity_reserved: number
          released_at?: string | null
          reserved_at?: string
          status?: string
          task_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimate_item_id?: string | null
          id?: string
          item_id?: string
          jobcard_id?: string
          quantity_consumed?: number | null
          quantity_reserved?: number
          released_at?: string | null
          reserved_at?: string
          status?: string
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocations_task"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_card_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_usages: {
        Row: {
          created_at: string
          id: string
          jobcard_id: string
          part_id: string
          qty: number
          tenant_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          jobcard_id: string
          part_id: string
          qty: number
          tenant_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          jobcard_id?: string
          part_id?: string
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
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usages_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
      inventory_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          metadata: Json
          name: string
          reorder_level: number | null
          sell_price: number | null
          stock_keeping_unit: string | null
          stock_on_hand: number | null
          stock_reserved: number | null
          tenant_id: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          name: string
          reorder_level?: number | null
          sell_price?: number | null
          stock_keeping_unit?: string | null
          stock_on_hand?: number | null
          stock_reserved?: number | null
          tenant_id: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          name?: string
          reorder_level?: number | null
          sell_price?: number | null
          stock_keeping_unit?: string | null
          stock_on_hand?: number | null
          stock_reserved?: number | null
          tenant_id?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          part_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          part_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
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
            foreignKeyName: "inventory_transactions_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance: number | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          discount_amount: number | null
          discount_percentage: number
          due_date: string | null
          estimate_id: string | null
          file_key: string | null
          filename: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          is_gst_billed: boolean
          issued_at: string
          jobcard_id: string | null
          metadata: Json
          paid_amount: number | null
          payment_mode: string | null
          status: string
          subtotal: number | null
          tax: number | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          balance?: number | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number
          due_date?: string | null
          estimate_id?: string | null
          file_key?: string | null
          filename?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          is_gst_billed?: boolean
          issued_at?: string
          jobcard_id?: string | null
          metadata?: Json
          paid_amount?: number | null
          payment_mode?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number
          due_date?: string | null
          estimate_id?: string | null
          file_key?: string | null
          filename?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          is_gst_billed?: boolean
          issued_at?: string
          jobcard_id?: string | null
          metadata?: Json
          paid_amount?: number | null
          payment_mode?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
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
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
      job_card_tasks: {
        Row: {
          action_type: string
          actual_time_minutes: number | null
          allocation_id: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          estimate_item_id: string | null
          estimated_time_minutes: number | null
          id: string
          inventory_item_id: string | null
          jobcard_id: string
          labor_cost_snapshot: number | null
          priority_score: number | null
          qty: number | null
          required_bay_type: string | null
          required_skill_level: number | null
          service_category_id: string | null
          show_in_estimate: boolean
          task_name: string
          task_status: string
          tax_rate_snapshot: number | null
          tenant_id: string
          unit_price_snapshot: number | null
          updated_at: string
        }
        Insert: {
          action_type?: string
          actual_time_minutes?: number | null
          allocation_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          estimate_item_id?: string | null
          estimated_time_minutes?: number | null
          id?: string
          inventory_item_id?: string | null
          jobcard_id: string
          labor_cost_snapshot?: number | null
          priority_score?: number | null
          qty?: number | null
          required_bay_type?: string | null
          required_skill_level?: number | null
          service_category_id?: string | null
          show_in_estimate?: boolean
          task_name: string
          task_status?: string
          tax_rate_snapshot?: number | null
          tenant_id: string
          unit_price_snapshot?: number | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          actual_time_minutes?: number | null
          allocation_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          estimate_item_id?: string | null
          estimated_time_minutes?: number | null
          id?: string
          inventory_item_id?: string | null
          jobcard_id?: string
          labor_cost_snapshot?: number | null
          priority_score?: number | null
          qty?: number | null
          required_bay_type?: string | null
          required_skill_level?: number | null
          service_category_id?: string | null
          show_in_estimate?: boolean
          task_name?: string
          task_status?: string
          tax_rate_snapshot?: number | null
          tenant_id?: string
          unit_price_snapshot?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_card_tasks_allocation"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "inventory_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_card_tasks_inventory_item"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_card_tasks_inventory_item"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_card_tasks_jobcard"
            columns: ["jobcard_id"]
            isOneToOne: false
            referencedRelation: "jobcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_card_tasks_estimate_item_id_fkey"
            columns: ["estimate_item_id"]
            isOneToOne: false
            referencedRelation: "estimate_items"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcards: {
        Row: {
          assigned_mechanic_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          details: Json
          hard_deadline: string | null
          id: string
          is_waiting_on_site: boolean
          job_number: string
          promised_delivery_time: string | null
          soft_deadline: string | null
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_mechanic_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          details?: Json
          hard_deadline?: string | null
          id?: string
          is_waiting_on_site?: boolean
          job_number: string
          promised_delivery_time?: string | null
          soft_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_mechanic_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          details?: Json
          hard_deadline?: string | null
          id?: string
          is_waiting_on_site?: boolean
          job_number?: string
          promised_delivery_time?: string | null
          soft_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
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
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_skills: {
        Row: {
          category_id: string
          created_at: string
          id: string
          mechanic_id: string
          proficiency_level: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          mechanic_id: string
          proficiency_level: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          mechanic_id?: string
          proficiency_level?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_skills_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          auth_user_id: string | null
          created_at: string
          current_work_status:
            | Database["tenant"]["Enums"]["mechanic_status"]
            | null
          deleted_at: string | null
          deleted_by: string | null
          efficiency_score: number | null
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          skills: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          current_work_status?:
            | Database["tenant"]["Enums"]["mechanic_status"]
            | null
          deleted_at?: string | null
          deleted_by?: string | null
          efficiency_score?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          skills?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          current_work_status?:
            | Database["tenant"]["Enums"]["mechanic_status"]
            | null
          deleted_at?: string | null
          deleted_by?: string | null
          efficiency_score?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          skills?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_analytics: {
        Row: {
          created_at: string
          id: string
          month: number
          outstanding_revenue: number
          paid_revenue: number
          tenant_id: string
          total_invoices: number
          total_jobs: number
          total_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          outstanding_revenue?: number
          paid_revenue?: number
          tenant_id: string
          total_invoices?: number
          total_jobs?: number
          total_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          outstanding_revenue?: number
          paid_revenue?: number
          tenant_id?: string
          total_invoices?: number
          total_jobs?: number
          total_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_analytics_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_analytics_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_analytics_tenant_fkey"
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
          created_at: string
          customer_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          jobcard_id: string | null
          payload: Json | null
          read_at: string | null
          sent_at: string | null
          status: string
          template: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          channel: string
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          jobcard_id?: string | null
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          template?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          channel?: string
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          jobcard_id?: string | null
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          template?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
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
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
          paid_at: string | null
          payment_date: string
          payment_method: Database["tenant"]["Enums"]["payment_method_enum"]
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
          paid_at?: string | null
          payment_date?: string
          payment_method?: Database["tenant"]["Enums"]["payment_method_enum"]
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
          paid_at?: string | null
          payment_date?: string
          payment_method?: Database["tenant"]["Enums"]["payment_method_enum"]
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
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
          created_at: string
          id: string
          key_id: string
          key_secret: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_id: string
          key_secret: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_id?: string
          key_secret?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "razorpay_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
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
          address: string | null
          business_email: string | null
          business_phone: string | null
          city: string | null
          created_at: string
          currency: string | null
          email_enabled: boolean | null
          estimate_prefix: string | null
          gst_number: string | null
          id: string
          invoice_footer: string | null
          invoice_prefix: string | null
          job_prefix: string | null
          legal_name: string | null
          logo_storage_path: string | null
          logo_url: string | null
          pan_number: string | null
          pincode: string | null
          sms_enabled: boolean | null
          state: string | null
          tax_rate: number | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          website: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          business_email?: string | null
          business_phone?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          email_enabled?: boolean | null
          estimate_prefix?: string | null
          gst_number?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          job_prefix?: string | null
          legal_name?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          pan_number?: string | null
          pincode?: string | null
          sms_enabled?: boolean | null
          state?: string | null
          tax_rate?: number | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          business_email?: string | null
          business_phone?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          email_enabled?: boolean | null
          estimate_prefix?: string | null
          gst_number?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          job_prefix?: string | null
          legal_name?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          pan_number?: string | null
          pincode?: string | null
          sms_enabled?: boolean | null
          state?: string | null
          tax_rate?: number | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_onboarded: boolean
          metadata: Json
          name: string
          slug: string | null
          status: Database["tenant"]["Enums"]["tenant_status"]
          subscription: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_onboarded?: boolean
          metadata?: Json
          name: string
          slug?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"]
          subscription?: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_onboarded?: boolean
          metadata?: Json
          name?: string
          slug?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"]
          subscription?: Database["tenant"]["Enums"]["subscription_tier"]
          subscription_status?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          phone: string | null
          role: Database["tenant"]["Enums"]["roles"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          name: string
          phone?: string | null
          role?: Database["tenant"]["Enums"]["roles"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          phone?: string | null
          role?: Database["tenant"]["Enums"]["roles"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
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
          color: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          license_plate: string | null
          make: string | null
          make_id: string | null
          mileage: number | null
          model: string | null
          model_id: string | null
          notes: string | null
          odometer: number | null
          reg_no: string
          tenant_id: string
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          make_id?: string | null
          mileage?: number | null
          model?: string | null
          model_id?: string | null
          notes?: string | null
          odometer?: number | null
          reg_no: string
          tenant_id: string
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          make_id?: string | null
          mileage?: number | null
          model?: string | null
          model_id?: string | null
          notes?: string | null
          odometer?: number | null
          reg_no?: string
          tenant_id?: string
          updated_at?: string | null
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
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
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
    Views: {
      admin_tenant_overview: {
        Row: {
          active_jobs: number | null
          completed_jobs: number | null
          created_at: string | null
          customer_count: number | null
          id: string | null
          mechanic_count: number | null
          name: string | null
          status: Database["tenant"]["Enums"]["tenant_status"] | null
          total_revenue: number | null
        }
        Insert: {
          active_jobs?: never
          completed_jobs?: never
          created_at?: string | null
          customer_count?: never
          id?: string | null
          mechanic_count?: never
          name?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"] | null
          total_revenue?: never
        }
        Update: {
          active_jobs?: never
          completed_jobs?: never
          created_at?: string | null
          customer_count?: never
          id?: string | null
          mechanic_count?: never
          name?: string | null
          status?: Database["tenant"]["Enums"]["tenant_status"] | null
          total_revenue?: never
        }
        Relationships: []
      }
      inventory_items_with_availability: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          reorder_level: number | null
          sell_price: number | null
          stock_available: number | null
          stock_keeping_unit: string | null
          stock_on_hand: number | null
          stock_reserved: number | null
          tenant_id: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          reorder_level?: number | null
          sell_price?: number | null
          stock_available?: never
          stock_keeping_unit?: string | null
          stock_on_hand?: number | null
          stock_reserved?: number | null
          tenant_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          reorder_level?: number | null
          sell_price?: number | null
          stock_available?: never
          stock_keeping_unit?: string | null
          stock_on_hand?: number | null
          stock_reserved?: number | null
          tenant_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_stats_view: {
        Row: {
          active_jobs: number | null
          completed_jobs: number | null
          created_at: string | null
          customer_count: number | null
          id: string | null
          mechanic_count: number | null
          metadata: Json | null
          name: string | null
          slug: string | null
          total_revenue: number | null
        }
        Insert: {
          active_jobs?: never
          completed_jobs?: never
          created_at?: string | null
          customer_count?: never
          id?: string | null
          mechanic_count?: never
          metadata?: Json | null
          name?: string | null
          slug?: string | null
          total_revenue?: never
        }
        Update: {
          active_jobs?: never
          completed_jobs?: never
          created_at?: string | null
          customer_count?: never
          id?: string | null
          mechanic_count?: never
          metadata?: Json | null
          name?: string | null
          slug?: string | null
          total_revenue?: never
        }
        Relationships: []
      }
    }
    Functions: {
      get_next_counter_value: {
        Args: { p_counter_key: string; p_tenant_id: string }
        Returns: string
      }
      init_default_counters: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      mechanic_status: "idle" | "working" | "waiting_for_part" | "on_leave"
      payment_method_enum: "cash" | "card" | "upi" | "bank_transfer" | "cheque"
      roles:
        | "tenant"
        | "tenant_owner"
        | "tenant_admin"
        | "admin"
        | "manager"
        | "frontdesk"
        | "mechanic"
        | "employee"
      subscription_tier: "starter" | "pro" | "enterprise"
      tenant_status: "active" | "suspended" | "trial" | "inactive"
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
      platform_admin_role: ["platform_admin", "employee"],
    },
  },
  tenant: {
    Enums: {
      mechanic_status: ["idle", "working", "waiting_for_part", "on_leave"],
      payment_method_enum: ["cash", "card", "upi", "bank_transfer", "cheque"],
      roles: [
        "tenant",
        "tenant_owner",
        "tenant_admin",
        "admin",
        "manager",
        "frontdesk",
        "mechanic",
        "employee",
      ],
      subscription_tier: ["starter", "pro", "enterprise"],
      tenant_status: ["active", "suspended", "trial", "inactive"],
    },
  },
} as const

