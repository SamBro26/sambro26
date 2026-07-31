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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ad_images: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_images_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_keywords: {
        Row: {
          ad_id: string
          id: string
          keyword: string
        }
        Insert: {
          ad_id: string
          id?: string
          keyword: string
        }
        Update: {
          ad_id?: string
          id?: string
          keyword?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_keywords_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_reactions: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_reactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_reports: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ad_reports_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_kind: Database["public"]["Enums"]["ad_kind"]
          advance_payment: number | null
          baladiya_id: number
          created_at: string
          description: string | null
          exact_address: string | null
          expires_at: string | null
          featured_until: string | null
          id: string
          is_featured: boolean
          price: number | null
          property_type_id: number
          status: Database["public"]["Enums"]["ad_status"]
          transaction_type_id: number
          updated_at: string
          user_id: string
          views_count: number
          wilaya_id: number
        }
        Insert: {
          ad_kind: Database["public"]["Enums"]["ad_kind"]
          advance_payment?: number | null
          baladiya_id: number
          created_at?: string
          description?: string | null
          exact_address?: string | null
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          price?: number | null
          property_type_id: number
          status?: Database["public"]["Enums"]["ad_status"]
          transaction_type_id: number
          updated_at?: string
          user_id: string
          views_count?: number
          wilaya_id: number
        }
        Update: {
          ad_kind?: Database["public"]["Enums"]["ad_kind"]
          advance_payment?: number | null
          baladiya_id?: number
          created_at?: string
          description?: string | null
          exact_address?: string | null
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          price?: number | null
          property_type_id?: number
          status?: Database["public"]["Enums"]["ad_status"]
          transaction_type_id?: number
          updated_at?: string
          user_id?: string
          views_count?: number
          wilaya_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ads_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_transaction_type_id_fkey"
            columns: ["transaction_type_id"]
            isOneToOne: false
            referencedRelation: "transaction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          agency_name: string
          created_at: string
          id: string
          registration_number: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          agency_name: string
          created_at?: string
          id?: string
          registration_number?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          agency_name?: string
          created_at?: string
          id?: string
          registration_number?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agencies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      baladiyas: {
        Row: {
          code: string
          id: number
          name_ar: string
          name_en: string | null
          name_fr: string
          wilaya_id: number
        }
        Insert: {
          code: string
          id?: number
          name_ar: string
          name_en?: string | null
          name_fr: string
          wilaya_id: number
        }
        Update: {
          code?: string
          id?: number
          name_ar?: string
          name_en?: string | null
          name_fr?: string
          wilaya_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "baladiyas_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ad_id: string | null
          created_at: string
          created_by: string
          id: string
        }
        Insert: {
          ad_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
        }
        Update: {
          ad_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_dzd: number
          chargily_transaction_id: string | null
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          receipt_image_url: string | null
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_dzd: number
          chargily_transaction_id?: string | null
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          receipt_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_dzd?: number
          chargily_transaction_id?: string | null
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          receipt_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reviewed_by_admin_id_fkey"
            columns: ["reviewed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_tier: Database["public"]["Enums"]["account_tier"]
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_banned: boolean
          phone: string | null
          phone_verified_at: string | null
          premium_expires_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_tier?: Database["public"]["Enums"]["account_tier"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_banned?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          premium_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_tier?: Database["public"]["Enums"]["account_tier"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          premium_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      property_types: {
        Row: {
          id: number
          key: string
          label_ar: string
          label_en: string | null
          label_fr: string
          sort_order: number
        }
        Insert: {
          id?: number
          key: string
          label_ar: string
          label_en?: string | null
          label_fr: string
          sort_order?: number
        }
        Update: {
          id?: number
          key?: string
          label_ar?: string
          label_en?: string | null
          label_fr?: string
          sort_order?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price_dzd: number
        }
        Insert: {
          duration_days: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_dzd: number
        }
        Update: {
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_dzd?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ends_at: string
          id: string
          plan_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          ends_at: string
          id?: string
          plan_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          ends_at?: string
          id?: string
          plan_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_types: {
        Row: {
          id: number
          key: string
          label_ar: string
          label_en: string | null
          label_fr: string
          sort_order: number
        }
        Insert: {
          id?: number
          key: string
          label_ar: string
          label_en?: string | null
          label_fr: string
          sort_order?: number
        }
        Update: {
          id?: number
          key?: string
          label_ar?: string
          label_en?: string | null
          label_fr?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          platform?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          ad_id: string | null
          comment: string | null
          created_at: string
          id: string
          rated_user_id: string
          rater_user_id: string
          stars: number
        }
        Insert: {
          ad_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id: string
          rater_user_id: string
          stars: number
        }
        Update: {
          ad_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_rater_user_id_fkey"
            columns: ["rater_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      wilayas: {
        Row: {
          code: string
          id: number
          name_ar: string
          name_en: string | null
          name_fr: string
        }
        Insert: {
          code: string
          id?: number
          name_ar: string
          name_en?: string | null
          name_fr: string
        }
        Update: {
          code?: string
          id?: number
          name_ar?: string
          name_en?: string | null
          name_fr?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_tier: "FREE" | "PREMIUM"
      ad_kind: "SUPPLY" | "DEMAND"
      ad_status:
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "REJECTED"
        | "EXPIRED"
        | "SOLD_RENTED"
      app_role: "admin" | "moderator" | "user"
      payment_method: "CHARGILY_EDAHABIA" | "CHARGILY_CIB" | "BARIDIMOB_MANUAL"
      payment_status: "PENDING" | "APPROVED" | "REJECTED"
      reaction_type: "LIKE" | "LOVE"
      report_status: "OPEN" | "REVIEWED" | "DISMISSED"
      subscription_status: "ACTIVE" | "EXPIRED" | "CANCELLED"
      user_role: "INDIVIDUAL" | "AGENCY" | "ADMIN"
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
      account_tier: ["FREE", "PREMIUM"],
      ad_kind: ["SUPPLY", "DEMAND"],
      ad_status: [
        "PENDING_REVIEW",
        "ACTIVE",
        "REJECTED",
        "EXPIRED",
        "SOLD_RENTED",
      ],
      app_role: ["admin", "moderator", "user"],
      payment_method: ["CHARGILY_EDAHABIA", "CHARGILY_CIB", "BARIDIMOB_MANUAL"],
      payment_status: ["PENDING", "APPROVED", "REJECTED"],
      reaction_type: ["LIKE", "LOVE"],
      report_status: ["OPEN", "REVIEWED", "DISMISSED"],
      subscription_status: ["ACTIVE", "EXPIRED", "CANCELLED"],
      user_role: ["INDIVIDUAL", "AGENCY", "ADMIN"],
    },
  },
} as const
