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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          chapter_number: number
          created_at: string
          id: string
          manga_id: string
          page_count: number
          pages_urls: string[] | null
          release_date: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          id?: string
          manga_id: string
          page_count?: number
          pages_urls?: string[] | null
          release_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: string
          manga_id?: string
          page_count?: number
          pages_urls?: string[] | null
          release_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes: number
          manga_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes?: number
          manga_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes?: number
          manga_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      mangas: {
        Row: {
          adult_content: boolean | null
          artist: string | null
          author: string
          cover_url: string
          created_at: string
          description: string
          followers: number
          genre: string[]
          id: string
          rating: number
          status: string
          title: string
          total_reads: number
          updated_at: string
          year: number
        }
        Insert: {
          adult_content?: boolean | null
          artist?: string | null
          author: string
          cover_url: string
          created_at?: string
          description: string
          followers?: number
          genre?: string[]
          id?: string
          rating?: number
          status?: string
          title: string
          total_reads?: number
          updated_at?: string
          year: number
        }
        Update: {
          adult_content?: boolean | null
          artist?: string | null
          author?: string
          cover_url?: string
          created_at?: string
          description?: string
          followers?: number
          genre?: string[]
          id?: string
          rating?: number
          status?: string
          title?: string
          total_reads?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          conteudo_adulto: boolean | null
          created_at: string | null
          id: number
          idade: number
          nome: string
          preferencias: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          conteudo_adulto?: boolean | null
          created_at?: string | null
          id?: number
          idade: number
          nome: string
          preferencias?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          conteudo_adulto?: boolean | null
          created_at?: string | null
          id?: number
          idade?: number
          nome?: string
          preferencias?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          chapter_id: string
          created_at: string
          current_page: number
          id: string
          is_completed: boolean
          last_read_at: string
          manga_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          current_page?: number
          id?: string
          is_completed?: boolean
          last_read_at?: string
          manga_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          current_page?: number
          id?: string
          is_completed?: boolean
          last_read_at?: string
          manga_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_reading_progress: {
        Args: { p_user_id: string }
        Returns: {
          chapter_id: string
          chapter_number: number
          chapter_title: string
          current_page: number
          is_completed: boolean
          last_read_at: string
          manga_cover_url: string
          manga_id: string
          manga_title: string
          progress_percentage: number
          total_pages: number
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_reading_progress: {
        Args: {
          p_chapter_id: string
          p_current_page?: number
          p_is_completed?: boolean
          p_manga_id: string
          p_user_id: string
        }
        Returns: undefined
      }
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
