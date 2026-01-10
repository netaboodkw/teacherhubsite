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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          classroom_id: string
          created_at: string
          date: string
          id: string
          period: number
          status: string
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          date: string
          id?: string
          period?: number
          status: string
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          date?: string
          id?: string
          period?: number
          status?: string
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_notes: {
        Row: {
          classroom_id: string
          created_at: string
          date: string
          description: string
          id: string
          points: number
          student_id: string
          type: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          date?: string
          description: string
          id?: string
          points?: number
          student_id: string
          type: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          points?: number
          student_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_notes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          class_schedule: Json | null
          color: string
          created_at: string
          education_level_id: string | null
          grade_level: number | null
          id: string
          name: string
          schedule: string | null
          subject: string
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_schedule?: Json | null
          color?: string
          created_at?: string
          education_level_id?: string | null
          grade_level?: number | null
          id?: string
          name: string
          schedule?: string | null
          subject: string
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_schedule?: Json | null
          color?: string
          created_at?: string
          education_level_id?: string | null
          grade_level?: number | null
          id?: string
          name?: string
          schedule?: string | null
          subject?: string
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      education_levels: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          classroom_id: string
          created_at: string
          date: string
          id: string
          max_score: number
          score: number
          student_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          classroom_id: string
          created_at?: string
          date?: string
          id?: string
          max_score?: number
          score: number
          student_id: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          week_number?: number
        }
        Update: {
          classroom_id?: string
          created_at?: string
          date?: string
          id?: string
          max_score?: number
          score?: number
          student_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          education_level_id: string | null
          full_name: string
          id: string
          is_profile_complete: boolean | null
          phone: string | null
          school_name: string | null
          subject: string | null
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          education_level_id?: string | null
          full_name: string
          id?: string
          is_profile_complete?: boolean | null
          phone?: string | null
          school_name?: string | null
          subject?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          education_level_id?: string | null
          full_name?: string
          id?: string
          is_profile_complete?: boolean | null
          phone?: string | null
          school_name?: string | null
          subject?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_positions: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          position_x: number
          position_y: number
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_positions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_positions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_url: string | null
          classroom_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          special_needs: boolean
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          classroom_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          special_needs?: boolean
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          classroom_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          special_needs?: boolean
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          education_level_id: string
          grade_types: Json
          id: string
          is_active: boolean
          max_score: number
          name: string
          name_ar: string
          updated_at: string
          weeks_count: number
        }
        Insert: {
          created_at?: string
          education_level_id: string
          grade_types?: Json
          id?: string
          is_active?: boolean
          max_score?: number
          name: string
          name_ar: string
          updated_at?: string
          weeks_count?: number
        }
        Update: {
          created_at?: string
          education_level_id?: string
          grade_types?: Json
          id?: string
          is_active?: boolean
          max_score?: number
          name?: string
          name_ar?: string
          updated_at?: string
          weeks_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      teachers_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          education_level_name: string | null
          full_name: string | null
          id: string | null
          is_profile_complete: boolean | null
          phone: string | null
          school_name: string | null
          subject: string | null
          subject_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
