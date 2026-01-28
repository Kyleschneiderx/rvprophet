// Generated types for Supabase database schema
// Run `supabase gen types typescript --project-id <your-project-id>` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      dealerships: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          default_labor_rate: number;
          currency_symbol: string;
          default_terms: string | null;
          parts_markup_percent: number;
          technicians_see_pricing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          default_labor_rate?: number;
          currency_symbol?: string;
          default_terms?: string | null;
          parts_markup_percent?: number;
          technicians_see_pricing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          default_labor_rate?: number;
          currency_symbol?: string;
          default_terms?: string | null;
          parts_markup_percent?: number;
          technicians_see_pricing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          dealership_id: string;
          name: string;
          email: string;
          role: 'owner' | 'manager' | 'technician';
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          dealership_id: string;
          name: string;
          email: string;
          role: 'owner' | 'manager' | 'technician';
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          name?: string;
          email?: string;
          role?: 'owner' | 'manager' | 'technician';
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          dealership_id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          name: string;
          email: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          }
        ];
      };
      rvs: {
        Row: {
          id: string;
          dealership_id: string;
          customer_id: string;
          year: number;
          make: string;
          model: string;
          vin: string;
          nickname: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          customer_id: string;
          year: number;
          make: string;
          model: string;
          vin: string;
          nickname?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          customer_id?: string;
          year?: number;
          make?: string;
          model?: string;
          vin?: string;
          nickname?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rvs_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rvs_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      parts: {
        Row: {
          id: string;
          dealership_id: string;
          name: string;
          sku: string | null;
          description: string | null;
          price: number;
          in_stock_qty: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          name: string;
          sku?: string | null;
          description?: string | null;
          price: number;
          in_stock_qty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          name?: string;
          sku?: string | null;
          description?: string | null;
          price?: number;
          in_stock_qty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parts_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          }
        ];
      };
      work_orders: {
        Row: {
          id: string;
          dealership_id: string;
          rv_id: string;
          customer_id: string;
          issue_description: string;
          labor_hours: number;
          labor_rate: number;
          status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_customer_approval' | 'customer_approved' | 'customer_rejected' | 'completed';
          technician_notes: string | null;
          manager_notes: string | null;
          technician_id: string | null;
          total_estimate: number;
          approval_token: string | null;
          approval_token_expires_at: string | null;
          pdf_path: string | null;
          customer_notes: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          rv_id: string;
          customer_id: string;
          issue_description: string;
          labor_hours?: number;
          labor_rate?: number;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_customer_approval' | 'customer_approved' | 'customer_rejected' | 'completed';
          technician_notes?: string | null;
          manager_notes?: string | null;
          technician_id?: string | null;
          total_estimate?: number;
          approval_token?: string | null;
          approval_token_expires_at?: string | null;
          pdf_path?: string | null;
          customer_notes?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          rv_id?: string;
          customer_id?: string;
          issue_description?: string;
          labor_hours?: number;
          labor_rate?: number;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_customer_approval' | 'customer_approved' | 'customer_rejected' | 'completed';
          technician_notes?: string | null;
          manager_notes?: string | null;
          technician_id?: string | null;
          total_estimate?: number;
          approval_token?: string | null;
          approval_token_expires_at?: string | null;
          pdf_path?: string | null;
          customer_notes?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_orders_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'work_orders_rv_id_fkey';
            columns: ['rv_id'];
            isOneToOne: false;
            referencedRelation: 'rvs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'work_orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'work_orders_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      work_order_parts: {
        Row: {
          id: string;
          work_order_id: string;
          part_id: string;
          name: string;
          unit_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          part_id: string;
          name: string;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          part_id?: string;
          name?: string;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_order_parts_work_order_id_fkey';
            columns: ['work_order_id'];
            isOneToOne: false;
            referencedRelation: 'work_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'work_order_parts_part_id_fkey';
            columns: ['part_id'];
            isOneToOne: false;
            referencedRelation: 'parts';
            referencedColumns: ['id'];
          }
        ];
      };
      work_order_photos: {
        Row: {
          id: string;
          work_order_id: string;
          storage_path: string;
          filename: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          storage_path: string;
          filename: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          storage_path?: string;
          filename?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_order_photos_work_order_id_fkey';
            columns: ['work_order_id'];
            isOneToOne: false;
            referencedRelation: 'work_orders';
            referencedColumns: ['id'];
          }
        ];
      };
      announcements: {
        Row: {
          id: string;
          dealership_id: string;
          title: string;
          message: string;
          audience: string[];
          action_label: string | null;
          action_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          title: string;
          message: string;
          audience: string[];
          action_label?: string | null;
          action_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          title?: string;
          message?: string;
          audience?: string[];
          action_label?: string | null;
          action_link?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcements_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          dealership_id: string;
          title: string;
          message: string;
          type: 'work_order_submitted' | 'work_order_approved' | 'work_order_rejected' | 'customer_approved' | 'customer_rejected' | 'general';
          work_order_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dealership_id: string;
          title: string;
          message: string;
          type: 'work_order_submitted' | 'work_order_approved' | 'work_order_rejected' | 'customer_approved' | 'customer_rejected' | 'general';
          work_order_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dealership_id?: string;
          title?: string;
          message?: string;
          type?: 'work_order_submitted' | 'work_order_approved' | 'work_order_rejected' | 'customer_approved' | 'customer_rejected' | 'general';
          work_order_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_dealership_id_fkey';
            columns: ['dealership_id'];
            isOneToOne: false;
            referencedRelation: 'dealerships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_work_order_id_fkey';
            columns: ['work_order_id'];
            isOneToOne: false;
            referencedRelation: 'work_orders';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_approval_logs: {
        Row: {
          id: string;
          work_order_id: string;
          action: 'sent' | 'viewed' | 'approved' | 'rejected';
          delivery_method: 'sms' | 'email' | null;
          ip_address: string | null;
          user_agent: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          action: 'sent' | 'viewed' | 'approved' | 'rejected';
          delivery_method?: 'sms' | 'email' | null;
          ip_address?: string | null;
          user_agent?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          action?: 'sent' | 'viewed' | 'approved' | 'rejected';
          delivery_method?: 'sms' | 'email' | null;
          ip_address?: string | null;
          user_agent?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_approval_logs_work_order_id_fkey';
            columns: ['work_order_id'];
            isOneToOne: false;
            referencedRelation: 'work_orders';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      revenue_metrics: {
        Row: {
          date: string;
          total_revenue: number;
          parts_revenue: number;
          labor_revenue: number;
          order_count: number;
        };
        Relationships: [];
      };
      technician_productivity: {
        Row: {
          technician_id: string;
          technician_name: string;
          total_orders: number;
          completed_orders: number;
          total_revenue: number;
          avg_completion_time_hours: number | null;
        };
        Relationships: [];
      };
      work_order_funnel: {
        Row: {
          week_start: string;
          draft_count: number;
          submitted_count: number;
          approved_count: number;
          completed_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_dealership_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: 'owner' | 'manager' | 'technician';
      user_status: 'active' | 'inactive';
      work_order_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_customer_approval' | 'customer_approved' | 'customer_rejected' | 'completed';
      notification_type: 'work_order_submitted' | 'work_order_approved' | 'work_order_rejected' | 'customer_approved' | 'customer_rejected' | 'general';
      approval_action: 'sent' | 'viewed' | 'approved' | 'rejected';
      delivery_method: 'sms' | 'email';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
