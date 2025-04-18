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
      resumes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          file_name: string
          file_url: string
          parsed_data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          file_name: string
          file_url: string
          parsed_data?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          file_name?: string
          file_url?: string
          parsed_data?: Json
        }
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          company: string
          description: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          company: string
          description: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          company?: string
          description?: string
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