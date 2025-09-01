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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      BMR_ocw: {
        Row: {
          ampere_turns: number | null
          coil_core_ratio: number | null
          core_diameter: number | null
          frame: number | null
          height: number | null
          id: number
          product_id: number | null
          side_pole_width: number | null
          voltage: number | null
          width: number | null
        }
        Insert: {
          ampere_turns?: number | null
          coil_core_ratio?: number | null
          core_diameter?: number | null
          frame?: number | null
          height?: number | null
          id: number
          product_id?: number | null
          side_pole_width?: number | null
          voltage?: number | null
          width?: number | null
        }
        Update: {
          ampere_turns?: number | null
          coil_core_ratio?: number | null
          core_diameter?: number | null
          frame?: number | null
          height?: number | null
          id?: number
          product_id?: number | null
          side_pole_width?: number | null
          voltage?: number | null
          width?: number | null
        }
        Relationships: []
      }
      BMR_part_price: {
        Row: {
          ampere_turns: number | null
          coil_core_ratio: number | null
          core_diameter: number | null
          frame: number | null
          height: number | null
          id: number
          product_id: number | null
          side_pole_width: number | null
          voltage: number | null
          width: number | null
        }
        Insert: {
          ampere_turns?: number | null
          coil_core_ratio?: number | null
          core_diameter?: number | null
          frame?: number | null
          height?: number | null
          id: number
          product_id?: number | null
          side_pole_width?: number | null
          voltage?: number | null
          width?: number | null
        }
        Update: {
          ampere_turns?: number | null
          coil_core_ratio?: number | null
          core_diameter?: number | null
          frame?: number | null
          height?: number | null
          id?: number
          product_id?: number | null
          side_pole_width?: number | null
          voltage?: number | null
          width?: number | null
        }
        Relationships: []
      }
      BMR_parts: {
        Row: {
          amount: number | null
          bom: number | null
          id: number
          material: number | null
          name: string | null
        }
        Insert: {
          amount?: number | null
          bom?: number | null
          id: number
          material?: number | null
          name?: string | null
        }
        Update: {
          amount?: number | null
          bom?: number | null
          id?: number
          material?: number | null
          name?: string | null
        }
        Relationships: []
      }
      BMR_price_methods: {
        Row: {
          field: string | null
          id: number
          name: string | null
          tbl: string | null
          type: string | null
        }
        Insert: {
          field?: string | null
          id: number
          name?: string | null
          tbl?: string | null
          type?: string | null
        }
        Update: {
          field?: string | null
          id?: number
          name?: string | null
          tbl?: string | null
          type?: string | null
        }
        Relationships: []
      }
      BMR_products: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id: number
          name?: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      BMR_quote_items: {
        Row: {
          amount: string | null
          cost: number | null
          item_id: number
          name: string | null
          quote_id: number | null
          weight: string | null
        }
        Insert: {
          amount?: string | null
          cost?: number | null
          item_id: number
          name?: string | null
          quote_id?: number | null
          weight?: string | null
        }
        Update: {
          amount?: string | null
          cost?: number | null
          item_id?: number
          name?: string | null
          quote_id?: number | null
          weight?: string | null
        }
        Relationships: []
      }
      BMR_quotes: {
        Row: {
          date_generated: number | null
          date_verified: string | null
          id: number
          owner: number | null
          product_id: number | null
          quote_number: string | null
          verified: string | null
        }
        Insert: {
          date_generated?: number | null
          date_verified?: string | null
          id: number
          owner?: number | null
          product_id?: number | null
          quote_number?: string | null
          verified?: string | null
        }
        Update: {
          date_generated?: number | null
          date_verified?: string | null
          id?: number
          owner?: number | null
          product_id?: number | null
          quote_number?: string | null
          verified?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inspectors: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          content_type: string | null
          created_at: string | null
          filename: string | null
          id: string
          test_result_id: string | null
          url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          filename?: string | null
          id: string
          test_result_id?: string | null
          url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          filename?: string | null
          id?: string
          test_result_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          attachment: string | null
          comments: string | null
          created_at: string
          entity_id: string | null
          equipment: string
          expected_max: string | null
          expected_min: string | null
          id: string
          inspector_name: string
          is_passed: boolean | null
          location: string | null
          location_id: string | null
          photo_urls: string[] | null
          serial_number: string | null
          test_average: string | null
          test_type: string
          test_values: string[]
        }
        Insert: {
          attachment?: string | null
          comments?: string | null
          created_at?: string
          entity_id?: string | null
          equipment: string
          expected_max?: string | null
          expected_min?: string | null
          id: string
          inspector_name: string
          is_passed?: boolean | null
          location?: string | null
          location_id?: string | null
          photo_urls?: string[] | null
          serial_number?: string | null
          test_average?: string | null
          test_type: string
          test_values: string[]
        }
        Update: {
          attachment?: string | null
          comments?: string | null
          created_at?: string
          entity_id?: string | null
          equipment?: string
          expected_max?: string | null
          expected_min?: string | null
          id?: string
          inspector_name?: string
          is_passed?: boolean | null
          location?: string | null
          location_id?: string | null
          photo_urls?: string[] | null
          serial_number?: string | null
          test_average?: string | null
          test_type?: string
          test_values?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "test_results_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
