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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          registered_business_name: string | null
          tin_number: string | null
          rdo_code: string | null
          registered_address: string | null
          is_vat_registered: boolean
          tax_regime: '8_percent_gross' | 'graduated'
          currency_default: string
          next_invoice_number: number
          invoice_prefix: string
          logo_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          registered_business_name?: string | null
          tin_number?: string | null
          rdo_code?: string | null
          registered_address?: string | null
          is_vat_registered?: boolean
          tax_regime?: '8_percent_gross' | 'graduated'
          currency_default?: string
          next_invoice_number?: number
          invoice_prefix?: string
          logo_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          registered_business_name?: string | null
          tin_number?: string | null
          rdo_code?: string | null
          registered_address?: string | null
          is_vat_registered?: boolean
          tax_regime?: '8_percent_gross' | 'graduated'
          currency_default?: string
          next_invoice_number?: number
          invoice_prefix?: string
          logo_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          country: string
          currency: string
          billing_address: string | null
          notes: string | null
          archived: boolean
          manual_fx_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          country?: string
          currency?: string
          billing_address?: string | null
          notes?: string | null
          archived?: boolean
          manual_fx_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          country?: string
          currency?: string
          billing_address?: string | null
          notes?: string | null
          archived?: boolean
          manual_fx_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          invoice_number: string
          issue_date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'cancelled'
          currency: string
          subtotal: number
          discount: number
          total_original_currency: number
          bsp_fx_rate: number
          total_in_php: number
          withholding_tax_rate: number
          withholding_tax_amount_php: number
          net_amount_payable_php: number
          payment_date: string | null
          payment_method: string | null
          notes_disclaimer: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          invoice_number: string
          issue_date?: string
          due_date: string
          status?: 'draft' | 'sent' | 'paid' | 'cancelled'
          currency?: string
          subtotal?: number
          discount?: number
          total_original_currency?: number
          bsp_fx_rate?: number
          total_in_php?: number
          withholding_tax_rate?: number
          withholding_tax_amount_php?: number
          net_amount_payable_php?: number
          payment_date?: string | null
          payment_method?: string | null
          notes_disclaimer?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          invoice_number?: string
          issue_date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid' | 'cancelled'
          currency?: string
          subtotal?: number
          discount?: number
          total_original_currency?: number
          bsp_fx_rate?: number
          total_in_php?: number
          withholding_tax_rate?: number
          withholding_tax_amount_php?: number
          net_amount_payable_php?: number
          payment_date?: string | null
          payment_method?: string | null
          notes_disclaimer?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          rate_or_unit_price: number
          quantity: number
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          rate_or_unit_price: number
          quantity?: number
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          rate_or_unit_price?: number
          quantity?: number
          total_amount?: number
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: 'free' | 'pro_monthly' | 'pro_annual'
          status: 'active' | 'pending' | 'past_due' | 'cancelled'
          paymongo_payment_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_tier?: 'free' | 'pro_monthly' | 'pro_annual'
          status?: 'active' | 'pending' | 'past_due' | 'cancelled'
          paymongo_payment_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_tier?: 'free' | 'pro_monthly' | 'pro_annual'
          status?: 'active' | 'pending' | 'past_due' | 'cancelled'
          paymongo_payment_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          id: number
          source: string
          rates: { [key: string]: number }
          fetched_at: string
          valid_until: string
          created_at: string
          updated_at: string
        }
        Insert: {
          source: string
          rates: { [key: string]: number }
          valid_until: string
          id?: number
          fetched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          source?: string
          rates?: { [key: string]: number }
          fetched_at?: string
          valid_until?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
