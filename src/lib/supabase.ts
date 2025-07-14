import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          role: 'super_admin' | 'admin' | 'sales_staff'
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: 'super_admin' | 'admin' | 'sales_staff'
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'super_admin' | 'admin' | 'sales_staff'
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          sku: string
          buy_price: number
          sell_price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          buy_price: number
          sell_price: number
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          buy_price?: number
          sell_price?: number
          quantity?: number
          created_at?: string
        }
      }
      stock_entries: {
        Row: {
          id: string
          product_id: string
          quantity: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          date?: string
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          price: number
          date: string
          recorded_by_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          price: number
          date?: string
          recorded_by_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          price?: number
          date?: string
          recorded_by_user_id?: string
          created_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: string
          created_at: string
        }
        Insert: {
          key: string
          value: string
          created_at?: string
        }
        Update: {
          key?: string
          value?: string
          created_at?: string
        }
      }
    }
  }
}