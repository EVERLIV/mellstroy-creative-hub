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
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          class_id: string
          client_id: string
          created_at: string | null
          has_left_review: boolean | null
          id: string
          status: string
          updated_at: string | null
          verification_code: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          class_id: string
          client_id: string
          created_at?: string | null
          has_left_review?: boolean | null
          id?: string
          status?: string
          updated_at?: string | null
          verification_code?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          class_id?: string
          client_id?: string
          created_at?: string | null
          has_left_review?: boolean | null
          id?: string
          status?: string
          updated_at?: string | null
          verification_code?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participations: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          author_id: string
          cover_image_url: string | null
          created_at: string | null
          description: string
          duration_days: number
          id: string
          participants_count: number | null
          status: string
          title: string
          updated_at: string | null
          votes_count: number | null
        }
        Insert: {
          author_id: string
          cover_image_url?: string | null
          created_at?: string | null
          description: string
          duration_days?: number
          id?: string
          participants_count?: number | null
          status?: string
          title: string
          updated_at?: string | null
          votes_count?: number | null
        }
        Update: {
          author_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string
          duration_days?: number
          id?: string
          participants_count?: number | null
          status?: string
          title?: string
          updated_at?: string | null
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          class_type: string
          created_at: string | null
          description: string | null
          disability_friendly: boolean | null
          duration_minutes: number
          id: string
          image_url: string | null
          image_urls: string[] | null
          kids_friendly: boolean | null
          language: string[] | null
          level: string | null
          name: string
          price: number
          schedule_days: string[] | null
          schedule_time: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          class_type: string
          created_at?: string | null
          description?: string | null
          disability_friendly?: boolean | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          kids_friendly?: boolean | null
          language?: string[] | null
          level?: string | null
          name: string
          price: number
          schedule_days?: string[] | null
          schedule_time?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          class_type?: string
          created_at?: string | null
          description?: string | null
          disability_friendly?: boolean | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          kids_friendly?: boolean | null
          language?: string[] | null
          level?: string | null
          name?: string
          price?: number
          schedule_days?: string[] | null
          schedule_time?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
        }
        Relationships: []
      }
      event_interests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          description: string
          id: string
          image_url: string | null
          location: string
          organizer_id: string
          status: string
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id?: string
          image_url?: string | null
          location: string
          organizer_id: string
          status?: string
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          image_url?: string | null
          location?: string
          organizer_id?: string
          status?: string
          time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_data: Json
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_data: Json
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_data?: Json
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reference_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reference_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          goals: string[] | null
          height: number | null
          id: string
          interests: string[] | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          location: string | null
          onboarding_completed: boolean | null
          phone: string | null
          price_per_hour: number | null
          rating: number | null
          reviews_count: number | null
          short_description: string | null
          specialty: string[] | null
          updated_at: string | null
          username: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          goals?: string[] | null
          height?: number | null
          id: string
          interests?: string[] | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          price_per_hour?: number | null
          rating?: number | null
          reviews_count?: number | null
          short_description?: string | null
          specialty?: string[] | null
          updated_at?: string | null
          username: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          goals?: string[] | null
          height?: number | null
          id?: string
          interests?: string[] | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          price_per_hour?: number | null
          rating?: number | null
          reviews_count?: number | null
          short_description?: string | null
          specialty?: string[] | null
          updated_at?: string | null
          username?: string
          weight?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_challenges: {
        Row: {
          challenge_id: string
          id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          caption: string | null
          challenge_id: string
          created_at: string | null
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          challenge_id: string
          created_at?: string | null
          id?: string
          media_type: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          challenge_id?: string
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          is_verified: boolean
          priority: number
          rejection_reason: string | null
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          is_verified?: boolean
          priority?: number
          rejection_reason?: string | null
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          is_verified?: boolean
          priority?: number
          rejection_reason?: string | null
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_verification_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "trainer" | "client" | "admin"
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
      app_role: ["trainer", "client", "admin"],
    },
  },
} as const
