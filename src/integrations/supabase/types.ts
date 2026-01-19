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
      admin_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_generated_content: {
        Row: {
          aspect_ratio: string
          content_type: string
          created_at: string
          id: string
          image_url: string
          prompt: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          content_type?: string
          created_at?: string
          id?: string
          image_url: string
          prompt?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          content_type?: string
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      broadcast_emails: {
        Row: {
          body_html: string
          created_at: string
          created_by: string
          failed_count: number | null
          id: string
          recipient_filter: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by: string
          failed_count?: number | null
          id?: string
          recipient_filter?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string
          failed_count?: number | null
          id?: string
          recipient_filter?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          archived_at: string | null
          class_schedule: Json | null
          color: string
          created_at: string
          education_level_id: string | null
          grade_level: number | null
          grade_level_id: string | null
          id: string
          is_archived: boolean
          name: string
          schedule: string | null
          show_badges: boolean | null
          show_leaderboard: boolean | null
          show_stats_banner: boolean | null
          subject: string
          subject_id: string | null
          teacher_template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          class_schedule?: Json | null
          color?: string
          created_at?: string
          education_level_id?: string | null
          grade_level?: number | null
          grade_level_id?: string | null
          id?: string
          is_archived?: boolean
          name: string
          schedule?: string | null
          show_badges?: boolean | null
          show_leaderboard?: boolean | null
          show_stats_banner?: boolean | null
          subject: string
          subject_id?: string | null
          teacher_template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          class_schedule?: Json | null
          color?: string
          created_at?: string
          education_level_id?: string | null
          grade_level?: number | null
          grade_level_id?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          schedule?: string | null
          show_badges?: boolean | null
          show_leaderboard?: boolean | null
          show_stats_banner?: boolean | null
          subject?: string
          subject_id?: string | null
          teacher_template_id?: string | null
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
            foreignKeyName: "classrooms_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_teacher_template_id_fkey"
            columns: ["teacher_template_id"]
            isOneToOne: false
            referencedRelation: "teacher_grading_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_classroom_stats: {
        Row: {
          best_student_id: string | null
          best_student_points: number | null
          classroom_id: string
          created_at: string
          date: string
          engagement_rate: number | null
          id: string
          negative_notes_count: number | null
          positive_notes_count: number | null
          total_students: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_student_id?: string | null
          best_student_points?: number | null
          classroom_id: string
          created_at?: string
          date?: string
          engagement_rate?: number | null
          id?: string
          negative_notes_count?: number | null
          positive_notes_count?: number | null
          total_students?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_student_id?: string | null
          best_student_points?: number | null
          classroom_id?: string
          created_at?: string
          date?: string
          engagement_rate?: number | null
          id?: string
          negative_notes_count?: number | null
          positive_notes_count?: number | null
          total_students?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_classroom_stats_best_student_id_fkey"
            columns: ["best_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_classroom_stats_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      department_heads: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
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
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          subject: string
          template_key: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body_html: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          subject: string
          template_key: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          subject?: string
          template_key?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      grade_levels: {
        Row: {
          created_at: string
          display_order: number
          education_level_id: string
          grade_number: number
          id: string
          is_active: boolean
          name: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          education_level_id: string
          grade_number?: number
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          education_level_id?: string
          grade_number?: number
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
        ]
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
      grading_periods: {
        Row: {
          created_at: string
          display_order: number
          education_level_id: string
          grade_level_id: string | null
          id: string
          is_active: boolean
          max_score: number
          name: string
          name_ar: string
          subject_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          education_level_id: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          name: string
          name_ar: string
          subject_id?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          education_level_id?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          name?: string
          name_ar?: string
          subject_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_periods_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_periods_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_periods_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_template_periods: {
        Row: {
          created_at: string
          display_order: number
          id: string
          max_score: number
          name: string
          name_ar: string
          template_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          max_score?: number
          name: string
          name_ar: string
          template_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          max_score?: number
          name?: string
          name_ar?: string
          template_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_template_periods_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "grading_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          fingerprint_reminder: boolean
          id: string
          push_enabled: boolean
          reminder_minutes_before: number
          schedule_reminder: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          created_at?: string
          fingerprint_reminder?: boolean
          id?: string
          push_enabled?: boolean
          reminder_minutes_before?: number
          schedule_reminder?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          created_at?: string
          fingerprint_reminder?: boolean
          id?: string
          push_enabled?: boolean
          reminder_minutes_before?: number
          schedule_reminder?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          body_ar: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          body: string
          body_ar: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          body?: string
          body_ar?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_head_name: string | null
          education_level_id: string | null
          full_name: string
          id: string
          is_profile_complete: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          principal_name: string | null
          school_name: string | null
          subject: string | null
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_head_name?: string | null
          education_level_id?: string | null
          full_name: string
          id?: string
          is_profile_complete?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          principal_name?: string | null
          school_name?: string | null
          subject?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_head_name?: string | null
          education_level_id?: string | null
          full_name?: string
          id?: string
          is_profile_complete?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          principal_name?: string | null
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
      push_notification_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          share_code: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          share_code: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          share_code?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "teacher_grading_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_type: string
          classroom_id: string
          created_at: string
          id: string
          points: number | null
          rank: number | null
          student_id: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          achievement_type: string
          classroom_id: string
          created_at?: string
          id?: string
          points?: number | null
          rank?: number | null
          student_id: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          achievement_type?: string
          classroom_id?: string
          created_at?: string
          id?: string
          points?: number | null
          rank?: number | null
          student_id?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          parent_name: string | null
          parent_phone: string | null
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
          parent_name?: string | null
          parent_phone?: string | null
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
          parent_name?: string | null
          parent_phone?: string | null
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
      subject_grading_structures: {
        Row: {
          created_at: string
          education_level_id: string | null
          grade_level_id: string | null
          id: string
          is_default: boolean
          name: string
          name_ar: string
          structure: Json
          subject_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          education_level_id?: string | null
          grade_level_id?: string | null
          id?: string
          is_default?: boolean
          name: string
          name_ar: string
          structure?: Json
          subject_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          education_level_id?: string | null
          grade_level_id?: string | null
          id?: string
          is_default?: boolean
          name?: string
          name_ar?: string
          structure?: Json
          subject_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_grading_structures_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_grading_structures_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_grading_structures_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_grading_structures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "grading_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          education_level_id: string
          grade_level_id: string | null
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
          grade_level_id?: string | null
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
          grade_level_id?: string | null
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
          {
            foreignKeyName: "subjects_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_courses: {
        Row: {
          created_at: string
          display_order: number
          end_date: string
          id: string
          is_active: boolean
          name: string
          name_ar: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          courses_count: number
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          name_ar: string
          price: number
          updated_at: string
        }
        Insert: {
          courses_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          price?: number
          updated_at?: string
        }
        Update: {
          courses_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          discount_amount: number
          discount_code_id: string | null
          id: string
          invoice_id: string | null
          original_amount: number
          package_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id?: string | null
          id?: string
          invoice_id?: string | null
          original_amount: number
          package_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id?: string | null
          id?: string
          invoice_id?: string | null
          original_amount?: number
          package_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "teacher_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_id: string
          related_id: string | null
          sender_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_id: string
          related_id?: string | null
          sender_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string
          related_id?: string | null
          sender_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      teacher_department_head_invitations: {
        Row: {
          created_at: string
          department_head_email: string
          department_head_id: string | null
          id: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_head_email: string
          department_head_id?: string | null
          id?: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_head_email?: string
          department_head_id?: string | null
          id?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_grading_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          structure: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          structure?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          structure?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_subscriptions: {
        Row: {
          courses_remaining: number
          created_at: string
          id: string
          is_read_only: boolean
          package_id: string | null
          status: string
          subscription_ends_at: string | null
          subscription_started_at: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          courses_remaining?: number
          created_at?: string
          id?: string
          is_read_only?: boolean
          package_id?: string | null
          status?: string
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          courses_remaining?: number
          created_at?: string
          id?: string
          is_read_only?: boolean
          package_id?: string | null
          status?: string
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
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
      shared_templates_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          share_code: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          share_code?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          share_code?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "teacher_grading_templates"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cleanup_expired_otps: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "department_head"
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
      app_role: ["admin", "user", "department_head"],
    },
  },
} as const
