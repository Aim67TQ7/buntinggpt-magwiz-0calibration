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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string
          id: string
          last_activity: string | null
          session_id: string
        }
        Insert: {
          access_level: string
          created_at?: string
          expires_at: string
          id?: string
          last_activity?: string | null
          session_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string | null
          session_id?: string
        }
        Relationships: []
      }
      app_items: {
        Row: {
          access_token: string | null
          auth_passcode: string | null
          auth_type: string | null
          category: Database["public"]["Enums"]["app_type"]
          coming_soon: boolean | null
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          iframe_height: string | null
          is_active: boolean | null
          is_new: boolean | null
          license: string | null
          name: string
          requires_auth: boolean | null
          show_to_demo: boolean
          token: string | null
          updated_at: string | null
          url: string
          use_count: number | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          access_token?: string | null
          auth_passcode?: string | null
          auth_type?: string | null
          category: Database["public"]["Enums"]["app_type"]
          coming_soon?: boolean | null
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name: string
          requires_auth?: boolean | null
          show_to_demo?: boolean
          token?: string | null
          updated_at?: string | null
          url: string
          use_count?: number | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          access_token?: string | null
          auth_passcode?: string | null
          auth_type?: string | null
          category?: Database["public"]["Enums"]["app_type"]
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name?: string
          requires_auth?: boolean | null
          show_to_demo?: boolean
          token?: string | null
          updated_at?: string | null
          url?: string
          use_count?: number | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          auth_passcode: string | null
          auth_type: string | null
          category: string | null
          coming_soon: boolean | null
          created_at: string | null
          description: string | null
          icon_path: string | null
          id: string
          iframe_height: string | null
          is_active: boolean | null
          is_new: boolean | null
          license: string | null
          name: string
          requires_auth: boolean | null
          updated_at: string | null
          url: string | null
          use_count: number | null
          view_count: number | null
        }
        Insert: {
          auth_passcode?: string | null
          auth_type?: string | null
          category?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
          use_count?: number | null
          view_count?: number | null
        }
        Update: {
          auth_passcode?: string | null
          auth_type?: string | null
          category?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name?: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
          use_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      approved_knowledge_managers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          department: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attendance_points: {
        Row: {
          attendance_record_id: string
          created_at: string
          date_assessed: string
          employee_id: string
          expires_on: string
          id: string
          is_active: boolean
          points: number
          violation_type: string
        }
        Insert: {
          attendance_record_id: string
          created_at?: string
          date_assessed: string
          employee_id: string
          expires_on: string
          id?: string
          is_active?: boolean
          points: number
          violation_type: string
        }
        Update: {
          attendance_record_id?: string
          created_at?: string
          date_assessed?: string
          employee_id?: string
          expires_on?: string
          id?: string
          is_active?: boolean
          points?: number
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_points_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_points_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          is_excused: boolean | null
          notes: string | null
          points_assessed: number | null
          pto_used: boolean | null
          scheduled_end: string | null
          scheduled_start: string | null
          updated_at: string
          violation_type: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          is_excused?: boolean | null
          notes?: string | null
          points_assessed?: number | null
          pto_used?: boolean | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string
          violation_type?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          is_excused?: boolean | null
          notes?: string | null
          points_assessed?: number | null
          pto_used?: boolean | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string
          violation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_warnings: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          issued_by: string | null
          issued_date: string
          notes: string | null
          total_points: number
          warning_type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          total_points: number
          warning_type: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          total_points?: number
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      baq_stoplight: {
        Row: {
          Asm: number | null
          Department: string | null
          Description: string | null
          "Due Date": string | null
          EstProdHours: number | null
          Job: string | null
          JobNum: string | null
          Name: string | null
          Opr: number | null
          Part: string | null
          "Prod. Qty": number | null
          "Start Date": string | null
          uuid: string
        }
        Insert: {
          Asm?: number | null
          Department?: string | null
          Description?: string | null
          "Due Date"?: string | null
          EstProdHours?: number | null
          Job?: string | null
          JobNum?: string | null
          Name?: string | null
          Opr?: number | null
          Part?: string | null
          "Prod. Qty"?: number | null
          "Start Date"?: string | null
          uuid?: string
        }
        Update: {
          Asm?: number | null
          Department?: string | null
          Description?: string | null
          "Due Date"?: string | null
          EstProdHours?: number | null
          Job?: string | null
          JobNum?: string | null
          Name?: string | null
          Opr?: number | null
          Part?: string | null
          "Prod. Qty"?: number | null
          "Start Date"?: string | null
          uuid?: string
        }
        Relationships: []
      }
      character_directives: {
        Row: {
          character_id: string
          created_at: string | null
          directive_text: string
          directive_type: string
          id: string
          priority: number | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          directive_text: string
          directive_type: string
          id?: string
          priority?: number | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          directive_text?: string
          directive_type?: string
          id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_directives_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          avatar_base_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_base_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_base_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_starters: {
        Row: {
          character_id: string
          created_at: string | null
          description: string | null
          id: string
          starter_order: number | null
          title: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          starter_order?: number | null
          title: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          starter_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      corrections: {
        Row: {
          applied: boolean | null
          conversation_id: string
          correction_text: string
          created_at: string
          id: string
          is_global: boolean | null
          keywords: string[] | null
          message_id: string
          topic: string | null
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          conversation_id: string
          correction_text: string
          created_at?: string
          id?: string
          is_global?: boolean | null
          keywords?: string[] | null
          message_id: string
          topic?: string | null
          user_id: string
        }
        Update: {
          applied?: boolean | null
          conversation_id?: string
          correction_text?: string
          created_at?: string
          id?: string
          is_global?: boolean | null
          keywords?: string[] | null
          message_id?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      curtis_conversations: {
        Row: {
          created_at: string
          customer_inquiry_type: string | null
          equipment_recommendations: Json | null
          id: string
          message: string
          product_context: Json | null
          sender: string
          session_id: string
        }
        Insert: {
          created_at?: string
          customer_inquiry_type?: string | null
          equipment_recommendations?: Json | null
          id?: string
          message: string
          product_context?: Json | null
          sender: string
          session_id: string
        }
        Update: {
          created_at?: string
          customer_inquiry_type?: string | null
          equipment_recommendations?: Json | null
          id?: string
          message?: string
          product_context?: Json | null
          sender?: string
          session_id?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          company: string
          corrected_address: string
          created_at: string | null
          customer_name: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          sales_18_month: string | null
          sales_2024: string | null
          sales_2025: string | null
          territory: string | null
          uuid: string
        }
        Insert: {
          company: string
          corrected_address: string
          created_at?: string | null
          customer_name?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          sales_18_month?: string | null
          sales_2024?: string | null
          sales_2025?: string | null
          territory?: string | null
          uuid?: string
        }
        Update: {
          company?: string
          corrected_address?: string
          created_at?: string | null
          customer_name?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          sales_18_month?: string | null
          sales_2024?: string | null
          sales_2025?: string | null
          territory?: string | null
          uuid?: string
        }
        Relationships: []
      }
      dashboard_cards: {
        Row: {
          author_name: string | null
          card_type: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_urgent: boolean
          linkedin_post_id: string | null
          location: string
          pdf_url: string | null
          post_url: string | null
          priority: number
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          card_type: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_urgent?: boolean
          linkedin_post_id?: string | null
          location?: string
          pdf_url?: string | null
          post_url?: string | null
          priority?: number
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          card_type?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_urgent?: boolean
          linkedin_post_id?: string | null
          location?: string
          pdf_url?: string | null
          post_url?: string | null
          priority?: number
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      don: {
        Row: {
          embedding_b64_f16: string | null
          narrative: string | null
          uuid: string
        }
        Insert: {
          embedding_b64_f16?: string | null
          narrative?: string | null
          uuid?: string
        }
        Update: {
          embedding_b64_f16?: string | null
          narrative?: string | null
          uuid?: string
        }
        Relationships: []
      }
      don2: {
        Row: {
          context: string | null
          job_number: string | null
          line_number: string
          mentions_media_gallery: boolean | null
          order_number: string | null
          picture_ref: string | null
        }
        Insert: {
          context?: string | null
          job_number?: string | null
          line_number: string
          mentions_media_gallery?: boolean | null
          order_number?: string | null
          picture_ref?: string | null
        }
        Update: {
          context?: string | null
          job_number?: string | null
          line_number?: string
          mentions_media_gallery?: boolean | null
          order_number?: string | null
          picture_ref?: string | null
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          embedding: string | null
          narrative_text: string | null
          uuid: string
        }
        Insert: {
          embedding?: string | null
          narrative_text?: string | null
          uuid: string
        }
        Update: {
          embedding?: string | null
          narrative_text?: string | null
          uuid?: string
        }
        Relationships: []
      }
      Employee_id: {
        Row: {
          accountEnabled: boolean | null
          ageGroup: string | null
          alternateEmailAddress: string | null
          city: string | null
          companyName: string | null
          consentProvidedForMinor: string | null
          country: string | null
          createdDateTime: string | null
          creationType: string | null
          department: string | null
          directorySynced: string | null
          displayName: string | null
          employee_id: string
          givenName: string | null
          identityIssuer: string | null
          invitationState: string | null
          jobTitle: string | null
          legalAgeGroupClassification: string | null
          mobilePhone: string | null
          officeLocation: string | null
          postalCode: string | null
          state: string | null
          streetAddress: string | null
          surname: string | null
          telephoneNumber: string | null
          usageLocation: string | null
          user_id: string | null
          userPrincipalName: string
          userType: string | null
        }
        Insert: {
          accountEnabled?: boolean | null
          ageGroup?: string | null
          alternateEmailAddress?: string | null
          city?: string | null
          companyName?: string | null
          consentProvidedForMinor?: string | null
          country?: string | null
          createdDateTime?: string | null
          creationType?: string | null
          department?: string | null
          directorySynced?: string | null
          displayName?: string | null
          employee_id?: string
          givenName?: string | null
          identityIssuer?: string | null
          invitationState?: string | null
          jobTitle?: string | null
          legalAgeGroupClassification?: string | null
          mobilePhone?: string | null
          officeLocation?: string | null
          postalCode?: string | null
          state?: string | null
          streetAddress?: string | null
          surname?: string | null
          telephoneNumber?: string | null
          usageLocation?: string | null
          user_id?: string | null
          userPrincipalName: string
          userType?: string | null
        }
        Update: {
          accountEnabled?: boolean | null
          ageGroup?: string | null
          alternateEmailAddress?: string | null
          city?: string | null
          companyName?: string | null
          consentProvidedForMinor?: string | null
          country?: string | null
          createdDateTime?: string | null
          creationType?: string | null
          department?: string | null
          directorySynced?: string | null
          displayName?: string | null
          employee_id?: string
          givenName?: string | null
          identityIssuer?: string | null
          invitationState?: string | null
          jobTitle?: string | null
          legalAgeGroupClassification?: string | null
          mobilePhone?: string | null
          officeLocation?: string | null
          postalCode?: string | null
          state?: string | null
          streetAddress?: string | null
          surname?: string | null
          telephoneNumber?: string | null
          usageLocation?: string | null
          user_id?: string | null
          userPrincipalName?: string
          userType?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          employee_id: string
          employment_type: string
          first_name: string
          hire_date: string
          id: string
          is_active: boolean
          last_name: string
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id: string
          employment_type?: string
          first_name: string
          hire_date: string
          id?: string
          is_active?: boolean
          last_name: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string
          employment_type?: string
          first_name?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          last_name?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      escalations: {
        Row: {
          assigned_to: string | null
          created_at: string
          days_overdue: number | null
          escalation_type: string
          id: string
          order_id: string | null
          po_number: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          days_overdue?: number | null
          escalation_type: string
          id?: string
          order_id?: string | null
          po_number?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          days_overdue?: number | null
          escalation_type?: string
          id?: string
          order_id?: string | null
          po_number?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      iframe_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          origin_domain: string
          token_hash: string
          user_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_activity?: string
          origin_domain: string
          token_hash: string
          user_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          origin_domain?: string
          token_hash?: string
          user_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      intent_patterns: {
        Row: {
          api_endpoint: string | null
          character_id: string
          confidence_threshold: number | null
          created_at: string | null
          id: string
          intent_name: string
          pattern_text: string
          response_template: string | null
        }
        Insert: {
          api_endpoint?: string | null
          character_id: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          intent_name: string
          pattern_text: string
          response_template?: string | null
        }
        Update: {
          api_endpoint?: string | null
          character_id?: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          intent_name?: string
          pattern_text?: string
          response_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intent_patterns_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_analytics: {
        Row: {
          created_at: string
          id: string
          order_found: boolean
          query_type: string
          response_time: number
          satisfaction_score: number | null
          updated_at: string
          urgency_level: string
          user_role: string
          user_session: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_found?: boolean
          query_type: string
          response_time: number
          satisfaction_score?: number | null
          updated_at?: string
          urgency_level?: string
          user_role?: string
          user_session: string
        }
        Update: {
          created_at?: string
          id?: string
          order_found?: boolean
          query_type?: string
          response_time?: number
          satisfaction_score?: number | null
          updated_at?: string
          urgency_level?: string
          user_role?: string
          user_session?: string
        }
        Relationships: []
      }
      license_users: {
        Row: {
          created_at: string
          id: string
          last_access: string | null
          license_id: string
          user_identifier: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_access?: string | null
          license_id: string
          user_identifier: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_access?: string | null
          license_id?: string
          user_identifier?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_users_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string | null
          created_at: string
          custom_domain: string | null
          id: string
          is_active: boolean
          license_code: string
          qr_code_url: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean
          license_code: string
          qr_code_url?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean
          license_code?: string
          qr_code_url?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      market_research_reports: {
        Row: {
          competitive_landscape: Json
          consumer_analysis: string
          created_at: string
          executive_summary: string
          future_predictions: string
          id: string
          market_segmentation: Json
          market_size: Json
          recommendations: Json
          swot_analysis: Json
          topic_id: string
          trends: Json
          updated_at: string
        }
        Insert: {
          competitive_landscape: Json
          consumer_analysis: string
          created_at?: string
          executive_summary: string
          future_predictions: string
          id?: string
          market_segmentation: Json
          market_size: Json
          recommendations: Json
          swot_analysis: Json
          topic_id: string
          trends: Json
          updated_at?: string
        }
        Update: {
          competitive_landscape?: Json
          consumer_analysis?: string
          created_at?: string
          executive_summary?: string
          future_predictions?: string
          id?: string
          market_segmentation?: Json
          market_size?: Json
          recommendations?: Json
          swot_analysis?: Json
          topic_id?: string
          trends?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_research_reports_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "market_research_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      market_research_topics: {
        Row: {
          created_at: string
          id: string
          status: string
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      match_feedback: {
        Row: {
          created_at: string | null
          document_id: string | null
          feedback_type: string | null
          id: string
          match_context: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          feedback_type?: string | null
          id?: string
          match_context?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          feedback_type?: string | null
          id?: string
          match_context?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "training_data"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_processed: boolean | null
          license_id: string | null
          title: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          license_id?: string | null
          title?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          license_id?: string | null
          title?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          created_at: string | null
          id: string
          key_points: Json | null
          license_id: string | null
          recording_id: string | null
          summary: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_points?: Json | null
          license_id?: string | null
          recording_id?: string | null
          summary: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_points?: Json | null
          license_id?: string | null
          recording_id?: string | null
          summary?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          is_completed: boolean | null
          license_id: string | null
          recording_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          license_id?: string | null
          recording_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          license_id?: string | null
          recording_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_tasks_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      mto_backlog: {
        Row: {
          backlog_data: string | null
          created_at: string
          id: string
          month: string | null
          order_count: number
          status: string | null
          total_amount: number
        }
        Insert: {
          backlog_data?: string | null
          created_at?: string
          id?: string
          month?: string | null
          order_count?: number
          status?: string | null
          total_amount?: number
        }
        Update: {
          backlog_data?: string | null
          created_at?: string
          id?: string
          month?: string | null
          order_count?: number
          status?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      mto_delivery: {
        Row: {
          april_otd: number | null
          august_otd: number | null
          created_at: string | null
          current_year: number | null
          december_otd: number | null
          february_otd: number | null
          id: string
          january_otd: number | null
          july_otd: number | null
          june_otd: number | null
          last_updated_month: string | null
          march_otd: number | null
          may_otd: number | null
          november_otd: number | null
          october_otd: number | null
          september_otd: number | null
          updated_at: string | null
        }
        Insert: {
          april_otd?: number | null
          august_otd?: number | null
          created_at?: string | null
          current_year?: number | null
          december_otd?: number | null
          february_otd?: number | null
          id?: string
          january_otd?: number | null
          july_otd?: number | null
          june_otd?: number | null
          last_updated_month?: string | null
          march_otd?: number | null
          may_otd?: number | null
          november_otd?: number | null
          october_otd?: number | null
          september_otd?: number | null
          updated_at?: string | null
        }
        Update: {
          april_otd?: number | null
          august_otd?: number | null
          created_at?: string | null
          current_year?: number | null
          december_otd?: number | null
          february_otd?: number | null
          id?: string
          january_otd?: number | null
          july_otd?: number | null
          june_otd?: number | null
          last_updated_month?: string | null
          march_otd?: number | null
          may_otd?: number | null
          november_otd?: number | null
          october_otd?: number | null
          september_otd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mto_incoming: {
        Row: {
          created_at: string | null
          gmMonth: number | null
          id: string
          incoming: number | null
          month: string | null
        }
        Insert: {
          created_at?: string | null
          gmMonth?: number | null
          id?: string
          incoming?: number | null
          month?: string | null
        }
        Update: {
          created_at?: string | null
          gmMonth?: number | null
          id?: string
          incoming?: number | null
          month?: string | null
        }
        Relationships: []
      }
      mto_metadata: {
        Row: {
          created_at: string | null
          id: string
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id: string
          timestamp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      mto_shipclerk: {
        Row: {
          created_at: string
          id: string
          import_amount: number
          month: string | null
          orders_data: string | null
          pending_count: number
          processed_count: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          import_amount?: number
          month?: string | null
          orders_data?: string | null
          pending_count?: number
          processed_count?: number
          total_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          import_amount?: number
          month?: string | null
          orders_data?: string | null
          pending_count?: number
          processed_count?: number
          total_amount?: number
        }
        Relationships: []
      }
      mto_shipments: {
        Row: {
          budgetamount: number
          created_at: string
          id: string
          monthtotal: number
          productgroup: string
          shipamount: number
          shipnotinvoiced: number
        }
        Insert: {
          budgetamount?: number
          created_at?: string
          id?: string
          monthtotal?: number
          productgroup: string
          shipamount?: number
          shipnotinvoiced?: number
        }
        Update: {
          budgetamount?: number
          created_at?: string
          id?: string
          monthtotal?: number
          productgroup?: string
          shipamount?: number
          shipnotinvoiced?: number
        }
        Relationships: []
      }
      mto_status: {
        Row: {
          Country: string | null
          "Cr Override": boolean | null
          "Credit Hold": boolean | null
          "Credit Hold Source": string | null
          "Credit Limit": number | null
          "Cust. ID": string | null
          dd: string
          Description: string | null
          "Entry Person": string | null
          FOB: string | null
          "Memo Description": string | null
          Name: string | null
          NextRelDt: string | null
          "On Hold": boolean | null
          Order: number | null
          "Order Amount": number | null
          "Order Date": string | null
          PO: string | null
          "Ship By": string | null
          Site: number | null
          Terms: string | null
        }
        Insert: {
          Country?: string | null
          "Cr Override"?: boolean | null
          "Credit Hold"?: boolean | null
          "Credit Hold Source"?: string | null
          "Credit Limit"?: number | null
          "Cust. ID"?: string | null
          dd?: string
          Description?: string | null
          "Entry Person"?: string | null
          FOB?: string | null
          "Memo Description"?: string | null
          Name?: string | null
          NextRelDt?: string | null
          "On Hold"?: boolean | null
          Order?: number | null
          "Order Amount"?: number | null
          "Order Date"?: string | null
          PO?: string | null
          "Ship By"?: string | null
          Site?: number | null
          Terms?: string | null
        }
        Update: {
          Country?: string | null
          "Cr Override"?: boolean | null
          "Credit Hold"?: boolean | null
          "Credit Hold Source"?: string | null
          "Credit Limit"?: number | null
          "Cust. ID"?: string | null
          dd?: string
          Description?: string | null
          "Entry Person"?: string | null
          FOB?: string | null
          "Memo Description"?: string | null
          Name?: string | null
          NextRelDt?: string | null
          "On Hold"?: boolean | null
          Order?: number | null
          "Order Amount"?: number | null
          "Order Date"?: string | null
          PO?: string | null
          "Ship By"?: string | null
          Site?: number | null
          Terms?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          content_type: string
          created_at: string | null
          filename: string
          id: string
          test_result_id: string
          url: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          filename: string
          id: string
          test_result_id: string
          url: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          filename?: string
          id?: string
          test_result_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      product_knowledge_embeddings: {
        Row: {
          chunk_title: string
          content_md: string
          created_at: string | null
          embedding: string
          id: string
          is_quiz_question: boolean | null
          product_line: string
          source_doc: string | null
          source_page: number | null
          tags: string[] | null
          training_level: string | null
        }
        Insert: {
          chunk_title: string
          content_md: string
          created_at?: string | null
          embedding: string
          id?: string
          is_quiz_question?: boolean | null
          product_line: string
          source_doc?: string | null
          source_page?: number | null
          tags?: string[] | null
          training_level?: string | null
        }
        Update: {
          chunk_title?: string
          content_md?: string
          created_at?: string | null
          embedding?: string
          id?: string
          is_quiz_question?: boolean | null
          product_line?: string
          source_doc?: string | null
          source_page?: number | null
          tags?: string[] | null
          training_level?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          conversation_preferences: string | null
          created_at: string
          encryption_salt: string | null
          first_name: string | null
          id: string
          is_demo_user: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          conversation_preferences?: string | null
          created_at?: string
          encryption_salt?: string | null
          first_name?: string | null
          id: string
          is_demo_user?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          conversation_preferences?: string | null
          created_at?: string
          encryption_salt?: string | null
          first_name?: string | null
          id?: string
          is_demo_user?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pt_entities: {
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
      pt_locations: {
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
            foreignKeyName: "pt_locations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "pt_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pt_test_results: {
        Row: {
          attachment: string | null
          avg_pull: number | null
          comment: string | null
          created_at: string | null
          expected_max: number | null
          expected_min: number | null
          id: string
          inspector_name: string | null
          location_id: string | null
          magnet_id: string | null
          photo_path: string | null
          photo_url: string | null
          pull_test_1: number | null
          pull_test_2: number | null
          pull_test_3: number | null
          pull_test_4: number | null
          pull_test_5: number | null
          pull_test_6: number | null
          serial_number: string | null
          status: string | null
          test_date: string | null
          test_equipment: string | null
          test_type: string | null
          user_id: string | null
        }
        Insert: {
          attachment?: string | null
          avg_pull?: number | null
          comment?: string | null
          created_at?: string | null
          expected_max?: number | null
          expected_min?: number | null
          id: string
          inspector_name?: string | null
          location_id?: string | null
          magnet_id?: string | null
          photo_path?: string | null
          photo_url?: string | null
          pull_test_1?: number | null
          pull_test_2?: number | null
          pull_test_3?: number | null
          pull_test_4?: number | null
          pull_test_5?: number | null
          pull_test_6?: number | null
          serial_number?: string | null
          status?: string | null
          test_date?: string | null
          test_equipment?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Update: {
          attachment?: string | null
          avg_pull?: number | null
          comment?: string | null
          created_at?: string | null
          expected_max?: number | null
          expected_min?: number | null
          id?: string
          inspector_name?: string | null
          location_id?: string | null
          magnet_id?: string | null
          photo_path?: string | null
          photo_url?: string | null
          pull_test_1?: number | null
          pull_test_2?: number | null
          pull_test_3?: number | null
          pull_test_4?: number | null
          pull_test_5?: number | null
          pull_test_6?: number | null
          serial_number?: string | null
          status?: string | null
          test_date?: string | null
          test_equipment?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pt_test_results_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "pt_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pto_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string
          employee_id: string
          end_date: string
          hours_requested: number
          id: string
          notes: string | null
          request_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          hours_requested: number
          id?: string
          notes?: string | null
          request_type: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          hours_requested?: number
          id?: string
          notes?: string | null
          request_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pto_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pulltest_entities: {
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
          id?: string
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
      reports: {
        Row: {
          access_token: string | null
          coming_soon: boolean | null
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          url: string
          video_url: string | null
        }
        Insert: {
          access_token?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          url: string
          video_url?: string | null
        }
        Update: {
          access_token?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      sales_tools: {
        Row: {
          coming_soon: boolean | null
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          is_active: boolean | null
          name: string
          token: string | null
          updated_at: string | null
          url: string
          video_url: string | null
        }
        Insert: {
          coming_soon?: boolean | null
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          token?: string | null
          updated_at?: string | null
          url: string
          video_url?: string | null
        }
        Update: {
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          token?: string | null
          updated_at?: string | null
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          attachment: string | null
          comments: string | null
          created_at: string | null
          entity_id: string | null
          equipment: string
          expected_max: string | null
          expected_min: string | null
          id: string
          inspector_name: string
          is_passed: boolean | null
          location: string | null
          photo_urls: string[] | null
          serial_number: string
          test_average: string
          test_type: string
          test_values: string[]
          updated_at: string | null
        }
        Insert: {
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          entity_id?: string | null
          equipment: string
          expected_max?: string | null
          expected_min?: string | null
          id?: string
          inspector_name: string
          is_passed?: boolean | null
          location?: string | null
          photo_urls?: string[] | null
          serial_number: string
          test_average: string
          test_type: string
          test_values: string[]
          updated_at?: string | null
        }
        Update: {
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          entity_id?: string | null
          equipment?: string
          expected_max?: string | null
          expected_min?: string | null
          id?: string
          inspector_name?: string
          is_passed?: boolean | null
          location?: string | null
          photo_urls?: string[] | null
          serial_number?: string
          test_average?: string
          test_type?: string
          test_values?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      training_data: {
        Row: {
          content: Json
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          embedding: string | null
          exact_match_fields: string[] | null
          id: string
          scope: Database["public"]["Enums"]["training_data_scope"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          embedding?: string | null
          exact_match_fields?: string[] | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          embedding?: string | null
          exact_match_fields?: string[] | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          recording_id: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          recording_id?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          recording_id?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conversations_embeddings: {
        Row: {
          conversation_id: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          parent_conversation_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          parent_conversation_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          parent_conversation_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_embeddings_parent_conversation_id_fkey"
            columns: ["parent_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_app_items: {
        Row: {
          app_item_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          app_item_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          app_item_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_app_items_app_item_id_fkey"
            columns: ["app_item_id"]
            isOneToOne: false
            referencedRelation: "app_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          content: string
          created_at: string
          feedback_type: string
          id: string
          is_anonymous: boolean
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          default_location: string
          enabled_functions: string[] | null
          id: string
          theme: string | null
          updated_at: string | null
          user_guide_progress: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_location?: string
          enabled_functions?: string[] | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_guide_progress?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_location?: string
          enabled_functions?: string[] | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_guide_progress?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_training_submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json
          document_type: string
          embedding: string | null
          id: string
          scope: Database["public"]["Enums"]["training_data_scope"] | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: Json
          document_type: string
          embedding?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"] | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          document_type?: string
          embedding?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"] | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_unread_messages: {
        Row: {
          recipient_id: string | null
          unread_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: { role_to_assign: string; target_user_id: string }
        Returns: boolean
      }
      backfill_training_data_embeddings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_rolling_points: {
        Args: { emp_id: string }
        Returns: number
      }
      check_embedding_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          entries_missing_embeddings: number
          entries_with_embeddings: number
          total_entries: number
        }[]
      }
      clean_old_weather_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_admin_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_license: {
        Args: {
          company_name_param: string
          contact_email_param: string
          contact_name_param?: string
        }
        Returns: {
          license_code: string
          license_id: string
        }[]
      }
      expire_old_points: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_license_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_employees: {
        Args: Record<PropertyKey, never>
        Returns: {
          displayname: string
          employee_id: string
          userprincipalname: string
        }[]
      }
      get_employee_by_user_id: {
        Args: { user_id_param: string }
        Returns: {
          city: string
          country: string
          department: string
          displayname: string
          employee_id: string
          jobtitle: string
          officelocation: string
          state: string
          user_id: string
          userprincipalname: string
        }[]
      }
      get_or_create_conversation_id: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_user_role: {
        Args: { role_param: string; user_id_param: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_demo_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_admin_action: {
        Args: {
          action_type: string
          new_values?: Json
          old_values?: Json
          record_id?: string
          table_name: string
        }
        Returns: undefined
      }
      log_application_usage: {
        Args:
          | { action: string; app_id: string }
          | { action: string; app_id: string; session_id?: string }
        Returns: undefined
      }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: Json
          id: string
          similarity: number
        }[]
      }
      match_documents_with_scope: {
        Args: {
          include_user_scope: boolean
          match_count: number
          match_threshold: number
          query_embedding: string
          user_id: string
        }
        Returns: {
          content: Json
          document_type: string
          id: string
          scope: string
          similarity: number
          user_id: string
        }[]
      }
      search_product_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_text: string
        }
        Returns: {
          chunk_title: string
          content_md: string
          id: string
          product_line: string
          similarity: number
          source_doc: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_employee_data: {
        Args: {
          city_param: string
          country_param: string
          department_param: string
          jobtitle_param: string
          officelocation_param: string
          state_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      validate_iframe_session: {
        Args: { token_hash_param: string }
        Returns: {
          is_valid: boolean
          user_data: Json
          user_id: string
        }[]
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_type: "application" | "calculator" | "sales_tool" | "report"
      document_type: "contact" | "company" | "sales" | "purchase_order"
      function_type:
        | "magnetism_calculator"
        | "five_why"
        | "equipment_selection"
        | "sales_map"
        | "stock_calculator"
        | "qr_generator"
        | "prospect_finder"
        | "bath_rail_designer"
        | "md_flow_calculator"
        | "five_s"
        | "fmea"
      scroll_pattern_type: "continuous" | "fade" | "slide"
      training_data_scope: "user" | "global"
      vote_type: "up" | "down"
    }
    CompositeTypes: {
      metadata_type: {
        title: string | null
        description: string | null
        source: string | null
        timestamp: string | null
      }
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
      app_type: ["application", "calculator", "sales_tool", "report"],
      document_type: ["contact", "company", "sales", "purchase_order"],
      function_type: [
        "magnetism_calculator",
        "five_why",
        "equipment_selection",
        "sales_map",
        "stock_calculator",
        "qr_generator",
        "prospect_finder",
        "bath_rail_designer",
        "md_flow_calculator",
        "five_s",
        "fmea",
      ],
      scroll_pattern_type: ["continuous", "fade", "slide"],
      training_data_scope: ["user", "global"],
      vote_type: ["up", "down"],
    },
  },
} as const
