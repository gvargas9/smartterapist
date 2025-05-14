/**
 * Supabase Database Types
 * 
 * This file contains TypeScript type definitions for the SmartTherapist database schema.
 */

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
      users: {
        Row: {
          id: string
          email: string
          role: 'client' | 'therapist' | 'admin'
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'client' | 'therapist' | 'admin'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'client' | 'therapist' | 'admin'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          therapist_id: string | null
          status: 'active' | 'inactive' | 'archived'
          intake_completed: boolean
          profile_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          therapist_id?: string | null
          status?: 'active' | 'inactive' | 'archived'
          intake_completed?: boolean
          profile_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          therapist_id?: string | null
          status?: 'active' | 'inactive' | 'archived'
          intake_completed?: boolean
          profile_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      therapists: {
        Row: {
          id: string
          user_id: string
          specialties: string[] | null
          credentials: Json
          availability: Json
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialties?: string[] | null
          credentials?: Json
          availability?: Json
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialties?: string[] | null
          credentials?: Json
          availability?: Json
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      therapy_sessions: {
        Row: {
          id: string
          client_id: string
          therapist_id: string
          status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          session_type: 'initial' | 'follow-up' | 'emergency' | 'group'
          scheduled_start: string
          scheduled_end: string
          actual_start: string | null
          actual_end: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          therapist_id: string
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          session_type: 'initial' | 'follow-up' | 'emergency' | 'group'
          scheduled_start: string
          scheduled_end: string
          actual_start?: string | null
          actual_end?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          therapist_id?: string
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          session_type?: 'initial' | 'follow-up' | 'emergency' | 'group'
          scheduled_start?: string
          scheduled_end?: string
          actual_start?: string | null
          actual_end?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      behavior_records: {
        Row: {
          id: string
          client_id: string
          behavior_type: string
          severity: number | null
          duration: number | null
          trigger: string | null
          notes: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          behavior_type: string
          severity?: number | null
          duration?: number | null
          trigger?: string | null
          notes?: string | null
          recorded_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          behavior_type?: string
          severity?: number | null
          duration?: number | null
          trigger?: string | null
          notes?: string | null
          recorded_at?: string
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

// Helper types for more convenient usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type User = Tables<'users'>
export type Client = Tables<'clients'>
export type Therapist = Tables<'therapists'>
export type TherapySession = Tables<'therapy_sessions'>
export type Message = Tables<'messages'>
export type BehaviorRecord = Tables<'behavior_records'>
