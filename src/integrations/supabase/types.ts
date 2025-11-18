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
      BMR_bom: {
        Row: {
          id: number
          name: string | null
          odds_factor: number | null
        }
        Insert: {
          id: number
          name?: string | null
          odds_factor?: number | null
        }
        Update: {
          id?: number
          name?: string | null
          odds_factor?: number | null
        }
        Relationships: []
      }
      BMR_conductors: {
        Row: {
          id: number
          material_id: number | null
          resistivity: number | null
          temp_coefficient: number | null
        }
        Insert: {
          id: number
          material_id?: number | null
          resistivity?: number | null
          temp_coefficient?: number | null
        }
        Update: {
          id?: number
          material_id?: number | null
          resistivity?: number | null
          temp_coefficient?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "BMR_conductors_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "BMR_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      BMR_coolants: {
        Row: {
          heat_transfer_rate: number | null
          id: number
          material_id: number
          max_temp: number | null
        }
        Insert: {
          heat_transfer_rate?: number | null
          id: number
          material_id: number
          max_temp?: number | null
        }
        Update: {
          heat_transfer_rate?: number | null
          id?: number
          material_id?: number
          max_temp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "BMR_coolants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "BMR_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      BMR_fed: {
        Row: {
          "# id": number
          drum_diameter: number | null
          drum_length: number | null
          product_id: number | null
          voltage: number | null
        }
        Insert: {
          "# id": number
          drum_diameter?: number | null
          drum_length?: number | null
          product_id?: number | null
          voltage?: number | null
        }
        Update: {
          "# id"?: number
          drum_diameter?: number | null
          drum_length?: number | null
          product_id?: number | null
          voltage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "BMR_fed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "BMR_products"
            referencedColumns: ["id"]
          },
        ]
      }
      BMR_frames: {
        Row: {
          "# id": number
          Frame: string | null
        }
        Insert: {
          "# id": number
          Frame?: string | null
        }
        Update: {
          "# id"?: number
          Frame?: string | null
        }
        Relationships: []
      }
      BMR_labor_hours: {
        Row: {
          hours: number | null
          idx: number | null
          labour_id: number
          method: number | null
        }
        Insert: {
          hours?: number | null
          idx?: number | null
          labour_id: number
          method?: number | null
        }
        Update: {
          hours?: number | null
          idx?: number | null
          labour_id?: number
          method?: number | null
        }
        Relationships: []
      }
      BMR_labour: {
        Row: {
          bom: number | null
          cost_per_unit: number | null
          id: number
          name: string | null
          rate: number | null
        }
        Insert: {
          bom?: number | null
          cost_per_unit?: number | null
          id: number
          name?: string | null
          rate?: number | null
        }
        Update: {
          bom?: number | null
          cost_per_unit?: number | null
          id?: number
          name?: string | null
          rate?: number | null
        }
        Relationships: []
      }
      BMR_magwiz: {
        Row: {
          ambient_temperature_A: string | null
          ambient_temperature_B: string | null
          ambient_temperature_C: string | null
          backbar_dimension: string | null
          backbar_mass: number | null
          belt_width: number | null
          coil_height: number | null
          cold_ampere_turns_A: string | null
          cold_ampere_turns_B: string | null
          cold_ampere_turns_C: string | null
          cold_current_A: number | null
          cold_current_B: number | null
          cold_current_C: number | null
          conservator_dimension: string | null
          conservator_mass: number | null
          coolant_mass: number | null
          core_backbar_dimension: string | null
          core_backbar_mass: number | null
          core_dimension: string | null
          core_insulator_dimension: string | null
          core_insulator_mass: string | null
          core_mass: number | null
          core_size: number | null
          diameter: number | null
          expected_rise_A: number | null
          expected_rise_B: number | null
          expected_rise_C: number | null
          filename: string
          hot_ampere_turns_A: number | null
          hot_ampere_turns_B: number | null
          hot_ampere_turns_C: number | null
          hot_current_A: number | null
          hot_current_B: number | null
          hot_current_C: number | null
          magnet_dimension: string | null
          maximum_rise_A: number | null
          maximum_rise_B: number | null
          maximum_rise_C: number | null
          mean_length_of_turn: number | null
          number_of_sections: number | null
          number_of_turns: string | null
          prefix: number | null
          radial_depth: number | null
          resistance_A: number | null
          resistance_B: number | null
          resistance_C: number | null
          sealing_plate_dimension: string | null
          sealing_plate_mass: string | null
          side_pole_dimension: string | null
          side_pole_mass: number | null
          suffix: number | null
          surface_area: number | null
          temperature_rise_A: number | null
          temperature_rise_B: number | null
          temperature_rise_C: number | null
          total_mass: number | null
          voltage_A: number | null
          voltage_B: number | null
          voltage_C: number | null
          watts_A: number | null
          watts_B: number | null
          watts_C: number | null
          winding_dimension: string | null
          winding_mass: number | null
          wires_in_parallel: number | null
        }
        Insert: {
          ambient_temperature_A?: string | null
          ambient_temperature_B?: string | null
          ambient_temperature_C?: string | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          belt_width?: number | null
          coil_height?: number | null
          cold_ampere_turns_A?: string | null
          cold_ampere_turns_B?: string | null
          cold_ampere_turns_C?: string | null
          cold_current_A?: number | null
          cold_current_B?: number | null
          cold_current_C?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: string | null
          core_mass?: number | null
          core_size?: number | null
          diameter?: number | null
          expected_rise_A?: number | null
          expected_rise_B?: number | null
          expected_rise_C?: number | null
          filename: string
          hot_ampere_turns_A?: number | null
          hot_ampere_turns_B?: number | null
          hot_ampere_turns_C?: number | null
          hot_current_A?: number | null
          hot_current_B?: number | null
          hot_current_C?: number | null
          magnet_dimension?: string | null
          maximum_rise_A?: number | null
          maximum_rise_B?: number | null
          maximum_rise_C?: number | null
          mean_length_of_turn?: number | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix?: number | null
          radial_depth?: number | null
          resistance_A?: number | null
          resistance_B?: number | null
          resistance_C?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: string | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix?: number | null
          surface_area?: number | null
          temperature_rise_A?: number | null
          temperature_rise_B?: number | null
          temperature_rise_C?: number | null
          total_mass?: number | null
          voltage_A?: number | null
          voltage_B?: number | null
          voltage_C?: number | null
          watts_A?: number | null
          watts_B?: number | null
          watts_C?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
        }
        Update: {
          ambient_temperature_A?: string | null
          ambient_temperature_B?: string | null
          ambient_temperature_C?: string | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          belt_width?: number | null
          coil_height?: number | null
          cold_ampere_turns_A?: string | null
          cold_ampere_turns_B?: string | null
          cold_ampere_turns_C?: string | null
          cold_current_A?: number | null
          cold_current_B?: number | null
          cold_current_C?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: string | null
          core_mass?: number | null
          core_size?: number | null
          diameter?: number | null
          expected_rise_A?: number | null
          expected_rise_B?: number | null
          expected_rise_C?: number | null
          filename?: string
          hot_ampere_turns_A?: number | null
          hot_ampere_turns_B?: number | null
          hot_ampere_turns_C?: number | null
          hot_current_A?: number | null
          hot_current_B?: number | null
          hot_current_C?: number | null
          magnet_dimension?: string | null
          maximum_rise_A?: number | null
          maximum_rise_B?: number | null
          maximum_rise_C?: number | null
          mean_length_of_turn?: number | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix?: number | null
          radial_depth?: number | null
          resistance_A?: number | null
          resistance_B?: number | null
          resistance_C?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: string | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix?: number | null
          surface_area?: number | null
          temperature_rise_A?: number | null
          temperature_rise_B?: number | null
          temperature_rise_C?: number | null
          total_mass?: number | null
          voltage_A?: number | null
          voltage_B?: number | null
          voltage_C?: number | null
          watts_A?: number | null
          watts_B?: number | null
          watts_C?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
        }
        Relationships: []
      }
      BMR_materials: {
        Row: {
          cost_per_unit: number | null
          density: number | null
          id: number
          name: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          density?: number | null
          id: number
          name?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          density?: number | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
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
      BMR_part_prices: {
        Row: {
          "# pricing_id": number
          base_method: number | null
          compound_method: number | null
          idx: number | null
          part_id: number | null
          price: string | null
        }
        Insert: {
          "# pricing_id": number
          base_method?: number | null
          compound_method?: number | null
          idx?: number | null
          part_id?: number | null
          price?: string | null
        }
        Update: {
          "# pricing_id"?: number
          base_method?: number | null
          compound_method?: number | null
          idx?: number | null
          part_id?: number | null
          price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "BMR_part_prices_base_method_fkey"
            columns: ["base_method"]
            isOneToOne: false
            referencedRelation: "BMR_price_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BMR_part_prices_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "BMR_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      BMR_parts: {
        Row: {
          amount: number | null
          bom: number | null
          cost_per_unit: number | null
          id: number
          material: number | null
          name: string | null
        }
        Insert: {
          amount?: number | null
          bom?: number | null
          cost_per_unit?: number | null
          id: number
          material?: number | null
          name?: string | null
        }
        Update: {
          amount?: number | null
          bom?: number | null
          cost_per_unit?: number | null
          id?: number
          material?: number | null
          name?: string | null
        }
        Relationships: []
      }
      BMR_plates: {
        Row: {
          "# thickness": number
        }
        Insert: {
          "# thickness": number
        }
        Update: {
          "# thickness"?: number
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
          "# item_id": number
          amount: number | null
          cost: number | null
          name: string | null
          quote_id: number | null
          weight: number | null
        }
        Insert: {
          "# item_id": number
          amount?: number | null
          cost?: number | null
          name?: string | null
          quote_id?: number | null
          weight?: number | null
        }
        Update: {
          "# item_id"?: number
          amount?: number | null
          cost?: number | null
          name?: string | null
          quote_id?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "BMR_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "BMR_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      BMR_quotes: {
        Row: {
          date_generated: number | null
          date_verified: string | null
          id: number
          product_id: number | null
          quote_number: string | null
          verified: string | null
        }
        Insert: {
          date_generated?: number | null
          date_verified?: string | null
          id: number
          product_id?: number | null
          quote_number?: string | null
          verified?: string | null
        }
        Update: {
          date_generated?: number | null
          date_verified?: string | null
          id?: number
          product_id?: number | null
          quote_number?: string | null
          verified?: string | null
        }
        Relationships: []
      }
      BMR_round_alum: {
        Row: {
          Diameter: number | null
          id: number
          resistance_volume: number | null
          turn_density: number | null
        }
        Insert: {
          Diameter?: number | null
          id: number
          resistance_volume?: number | null
          turn_density?: number | null
        }
        Update: {
          Diameter?: number | null
          id?: number
          resistance_volume?: number | null
          turn_density?: number | null
        }
        Relationships: []
      }
      BMR_strip_alum: {
        Row: {
          height: number
          resistance_volume: number | null
          turn_density: number | null
        }
        Insert: {
          height: number
          resistance_volume?: number | null
          turn_density?: number | null
        }
        Update: {
          height?: number
          resistance_volume?: number | null
          turn_density?: number | null
        }
        Relationships: []
      }
      BMR_Top: {
        Row: {
          force_factor: number | null
          frame: string | null
          model: string
          Prefix: number | null
          Suffix: number | null
          surface_gauss: number | null
          watts: number | null
          width: number | null
        }
        Insert: {
          force_factor?: number | null
          frame?: string | null
          model: string
          Prefix?: number | null
          Suffix?: number | null
          surface_gauss?: number | null
          watts?: number | null
          width?: number | null
        }
        Update: {
          force_factor?: number | null
          frame?: string | null
          model?: string
          Prefix?: number | null
          Suffix?: number | null
          surface_gauss?: number | null
          watts?: number | null
          width?: number | null
        }
        Relationships: []
      }
      BMR_users: {
        Row: {
          admin: number | null
          id: number
          password_hash: string | null
          username: string | null
        }
        Insert: {
          admin?: number | null
          id: number
          password_hash?: string | null
          username?: string | null
        }
        Update: {
          admin?: number | null
          id?: number
          password_hash?: string | null
          username?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          contract_number: string | null
          created_at: string
          dimension_1: string | null
          dimension_2: string | null
          end_use_statement: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          issue_date: string | null
          language: string | null
          magnet_specifications: string | null
          notes: string | null
          purpose: string | null
          signature_name: string | null
          status: string
          supplier: string | null
          total_weight_kg: number | null
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          contract_number?: string | null
          created_at?: string
          dimension_1?: string | null
          dimension_2?: string | null
          end_use_statement?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          language?: string | null
          magnet_specifications?: string | null
          notes?: string | null
          purpose?: string | null
          signature_name?: string | null
          status?: string
          supplier?: string | null
          total_weight_kg?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          contract_number?: string | null
          created_at?: string
          dimension_1?: string | null
          dimension_2?: string | null
          end_use_statement?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          language?: string | null
          magnet_specifications?: string | null
          notes?: string | null
          purpose?: string | null
          signature_name?: string | null
          status?: string
          supplier?: string | null
          total_weight_kg?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      end_user_certificates: {
        Row: {
          ai_scanned: boolean | null
          commitment_no_military: boolean
          commitment_no_transfer: boolean
          commitment_no_wmd: boolean
          company_address: string
          company_name: string
          company_stamp_url: string | null
          contract_number: string
          created_at: string
          end_use_description: string
          id: string
          product_description: string
          quantity: string
          signature_date: string | null
          signature_image_url: string | null
          signature_name: string | null
          signature_title: string | null
          status: string
          supplier_address: string | null
          supplier_name: string
          updated_at: string
          website_url: string | null
          weight: string | null
        }
        Insert: {
          ai_scanned?: boolean | null
          commitment_no_military?: boolean
          commitment_no_transfer?: boolean
          commitment_no_wmd?: boolean
          company_address: string
          company_name: string
          company_stamp_url?: string | null
          contract_number: string
          created_at?: string
          end_use_description: string
          id?: string
          product_description: string
          quantity: string
          signature_date?: string | null
          signature_image_url?: string | null
          signature_name?: string | null
          signature_title?: string | null
          status?: string
          supplier_address?: string | null
          supplier_name: string
          updated_at?: string
          website_url?: string | null
          weight?: string | null
        }
        Update: {
          ai_scanned?: boolean | null
          commitment_no_military?: boolean
          commitment_no_transfer?: boolean
          commitment_no_wmd?: boolean
          company_address?: string
          company_name?: string
          company_stamp_url?: string | null
          contract_number?: string
          created_at?: string
          end_use_description?: string
          id?: string
          product_description?: string
          quantity?: string
          signature_date?: string | null
          signature_image_url?: string | null
          signature_name?: string | null
          signature_title?: string | null
          status?: string
          supplier_address?: string | null
          supplier_name?: string
          updated_at?: string
          website_url?: string | null
          weight?: string | null
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
      manufacturing_jobs: {
        Row: {
          Asm: string
          Complete: boolean
          Customer: string
          Dept: string
          "Due Date": string | null
          EstProdHours: number
          id: string
          JobNum: string
          notes: string | null
          "Op Desc": string
          Opr: string
          Part: string
          "Part Desc": string
          "Prod. Qty": number
          "Start Date": string | null
          updated_at: string | null
        }
        Insert: {
          Asm: string
          Complete?: boolean
          Customer: string
          Dept: string
          "Due Date"?: string | null
          EstProdHours: number
          id?: string
          JobNum: string
          notes?: string | null
          "Op Desc": string
          Opr: string
          Part: string
          "Part Desc": string
          "Prod. Qty": number
          "Start Date"?: string | null
          updated_at?: string | null
        }
        Update: {
          Asm?: string
          Complete?: boolean
          Customer?: string
          Dept?: string
          "Due Date"?: string | null
          EstProdHours?: number
          id?: string
          JobNum?: string
          notes?: string | null
          "Op Desc"?: string
          Opr?: string
          Part?: string
          "Part Desc"?: string
          "Prod. Qty"?: number
          "Start Date"?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      OCW_Criteria: {
        Row: {
          "force factor": number | null
          frame: string | null
          gauss: number | null
          model: string | null
          modelid: string
          watts: number | null
          width: number | null
        }
        Insert: {
          "force factor"?: number | null
          frame?: string | null
          gauss?: number | null
          model?: string | null
          modelid?: string
          watts?: number | null
          width?: number | null
        }
        Update: {
          "force factor"?: number | null
          frame?: string | null
          gauss?: number | null
          model?: string | null
          modelid?: string
          watts?: number | null
          width?: number | null
        }
        Relationships: []
      }
      OCW_magwiz: {
        Row: {
          ambient_temperature_A: number | null
          ambient_temperature_B: number | null
          ambient_temperature_C: number | null
          backbar_dimension: string | null
          backbar_mass: number | null
          coil_height: number | null
          cold_ampere_turns_A: number | null
          cold_ampere_turns_B: number | null
          cold_ampere_turns_C: number | null
          cold_current_A: number | null
          cold_current_B: number | null
          cold_current_C: number | null
          conservator_dimension: string | null
          conservator_mass: number | null
          coolant_mass: number | null
          core_backbar_dimension: string | null
          core_backbar_mass: number | null
          core_dimension: string | null
          core_insulator_dimension: string | null
          core_insulator_mass: number | null
          core_mass: number | null
          diameter: number | null
          expected_rise_A: number | null
          expected_rise_B: number | null
          expected_rise_C: number | null
          filename: string
          hot_ampere_turns_A: number | null
          hot_ampere_turns_B: number | null
          hot_ampere_turns_C: number | null
          hot_current_A: number | null
          hot_current_B: number | null
          hot_current_C: number | null
          magnet_dimension: string | null
          maximum_rise_A: number | null
          maximum_rise_B: number | null
          maximum_rise_C: number | null
          mean_length_of_turn: number | null
          number_of_sections: number | null
          number_of_turns: string | null
          prefix: number | null
          radial_depth: number | null
          resistance_A: number | null
          resistance_B: number | null
          resistance_C: number | null
          sealing_plate_dimension: string | null
          sealing_plate_mass: number | null
          side_pole_dimension: string | null
          side_pole_mass: number | null
          suffix: number | null
          surface_area: number | null
          temperature_rise_A: number | null
          temperature_rise_B: number | null
          temperature_rise_C: number | null
          total_mass: number | null
          voltage_A: number | null
          voltage_B: number | null
          voltage_C: number | null
          watts_A: number | null
          watts_B: number | null
          watts_C: number | null
          winding_dimension: string | null
          winding_mass: number | null
          wires_in_parallel: number | null
        }
        Insert: {
          ambient_temperature_A?: number | null
          ambient_temperature_B?: number | null
          ambient_temperature_C?: number | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          coil_height?: number | null
          cold_ampere_turns_A?: number | null
          cold_ampere_turns_B?: number | null
          cold_ampere_turns_C?: number | null
          cold_current_A?: number | null
          cold_current_B?: number | null
          cold_current_C?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: number | null
          core_mass?: number | null
          diameter?: number | null
          expected_rise_A?: number | null
          expected_rise_B?: number | null
          expected_rise_C?: number | null
          filename: string
          hot_ampere_turns_A?: number | null
          hot_ampere_turns_B?: number | null
          hot_ampere_turns_C?: number | null
          hot_current_A?: number | null
          hot_current_B?: number | null
          hot_current_C?: number | null
          magnet_dimension?: string | null
          maximum_rise_A?: number | null
          maximum_rise_B?: number | null
          maximum_rise_C?: number | null
          mean_length_of_turn?: number | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix?: number | null
          radial_depth?: number | null
          resistance_A?: number | null
          resistance_B?: number | null
          resistance_C?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: number | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix?: number | null
          surface_area?: number | null
          temperature_rise_A?: number | null
          temperature_rise_B?: number | null
          temperature_rise_C?: number | null
          total_mass?: number | null
          voltage_A?: number | null
          voltage_B?: number | null
          voltage_C?: number | null
          watts_A?: number | null
          watts_B?: number | null
          watts_C?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
        }
        Update: {
          ambient_temperature_A?: number | null
          ambient_temperature_B?: number | null
          ambient_temperature_C?: number | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          coil_height?: number | null
          cold_ampere_turns_A?: number | null
          cold_ampere_turns_B?: number | null
          cold_ampere_turns_C?: number | null
          cold_current_A?: number | null
          cold_current_B?: number | null
          cold_current_C?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: number | null
          core_mass?: number | null
          diameter?: number | null
          expected_rise_A?: number | null
          expected_rise_B?: number | null
          expected_rise_C?: number | null
          filename?: string
          hot_ampere_turns_A?: number | null
          hot_ampere_turns_B?: number | null
          hot_ampere_turns_C?: number | null
          hot_current_A?: number | null
          hot_current_B?: number | null
          hot_current_C?: number | null
          magnet_dimension?: string | null
          maximum_rise_A?: number | null
          maximum_rise_B?: number | null
          maximum_rise_C?: number | null
          mean_length_of_turn?: number | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix?: number | null
          radial_depth?: number | null
          resistance_A?: number | null
          resistance_B?: number | null
          resistance_C?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: number | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix?: number | null
          surface_area?: number | null
          temperature_rise_A?: number | null
          temperature_rise_B?: number | null
          temperature_rise_C?: number | null
          total_mass?: number | null
          voltage_A?: number | null
          voltage_B?: number | null
          voltage_C?: number | null
          watts_A?: number | null
          watts_B?: number | null
          watts_C?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
        }
        Relationships: []
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
      released_jobs: {
        Row: {
          asm: number
          complete: boolean
          created_at: string
          customer: string | null
          dept: string
          due_date: string | null
          est_prod_hours: number
          id: string
          job_num: string
          op_desc: string
          opr: number
          part: string
          part_desc: string
          prod_qty: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          asm?: number
          complete?: boolean
          created_at?: string
          customer?: string | null
          dept: string
          due_date?: string | null
          est_prod_hours: number
          id?: string
          job_num: string
          op_desc: string
          opr: number
          part: string
          part_desc: string
          prod_qty: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          asm?: number
          complete?: boolean
          created_at?: string
          customer?: string | null
          dept?: string
          due_date?: string | null
          est_prod_hours?: number
          id?: string
          job_num?: string
          op_desc?: string
          opr?: number
          part?: string
          part_desc?: string
          prod_qty?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_ocw_configurations: {
        Row: {
          ambient_temperature_a: string | null
          ambient_temperature_b: string | null
          ambient_temperature_c: string | null
          backbar_dimension: string | null
          backbar_mass: number | null
          coil_height: number | null
          cold_ampere_turns_a: string | null
          cold_ampere_turns_b: string | null
          cold_ampere_turns_c: string | null
          cold_current_a: number | null
          cold_current_b: number | null
          cold_current_c: number | null
          conservator_dimension: string | null
          conservator_mass: number | null
          coolant_mass: number | null
          core_backbar_dimension: string | null
          core_backbar_mass: number | null
          core_dimension: string | null
          core_insulator_dimension: string | null
          core_insulator_mass: string | null
          core_mass: number | null
          created_at: string
          diameter: number | null
          expected_rise_a: number | null
          expected_rise_b: number | null
          expected_rise_c: number | null
          force_factor: number | null
          frame: string | null
          hot_ampere_turns_a: number | null
          hot_ampere_turns_b: number | null
          hot_ampere_turns_c: number | null
          hot_current_a: number | null
          hot_current_b: number | null
          hot_current_c: number | null
          id: string
          maximum_rise_a: number | null
          maximum_rise_b: number | null
          maximum_rise_c: number | null
          mean_length_of_turn: number | null
          name: string
          notes: string | null
          number_of_sections: number | null
          number_of_turns: string | null
          prefix: number
          radial_depth: number | null
          resistance_a: number | null
          resistance_b: number | null
          resistance_c: number | null
          sealing_plate_dimension: string | null
          sealing_plate_mass: string | null
          side_pole_dimension: string | null
          side_pole_mass: number | null
          suffix: number
          surface_area: number | null
          surface_gauss: number | null
          temperature_rise_a: number | null
          temperature_rise_b: number | null
          temperature_rise_c: number | null
          total_mass: number | null
          updated_at: string
          voltage_a: number | null
          voltage_b: number | null
          voltage_c: number | null
          watts: number | null
          watts_a: number | null
          watts_b: number | null
          watts_c: number | null
          width: number | null
          winding_dimension: string | null
          winding_mass: number | null
          wires_in_parallel: number | null
        }
        Insert: {
          ambient_temperature_a?: string | null
          ambient_temperature_b?: string | null
          ambient_temperature_c?: string | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          coil_height?: number | null
          cold_ampere_turns_a?: string | null
          cold_ampere_turns_b?: string | null
          cold_ampere_turns_c?: string | null
          cold_current_a?: number | null
          cold_current_b?: number | null
          cold_current_c?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: string | null
          core_mass?: number | null
          created_at?: string
          diameter?: number | null
          expected_rise_a?: number | null
          expected_rise_b?: number | null
          expected_rise_c?: number | null
          force_factor?: number | null
          frame?: string | null
          hot_ampere_turns_a?: number | null
          hot_ampere_turns_b?: number | null
          hot_ampere_turns_c?: number | null
          hot_current_a?: number | null
          hot_current_b?: number | null
          hot_current_c?: number | null
          id?: string
          maximum_rise_a?: number | null
          maximum_rise_b?: number | null
          maximum_rise_c?: number | null
          mean_length_of_turn?: number | null
          name: string
          notes?: string | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix: number
          radial_depth?: number | null
          resistance_a?: number | null
          resistance_b?: number | null
          resistance_c?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: string | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix: number
          surface_area?: number | null
          surface_gauss?: number | null
          temperature_rise_a?: number | null
          temperature_rise_b?: number | null
          temperature_rise_c?: number | null
          total_mass?: number | null
          updated_at?: string
          voltage_a?: number | null
          voltage_b?: number | null
          voltage_c?: number | null
          watts?: number | null
          watts_a?: number | null
          watts_b?: number | null
          watts_c?: number | null
          width?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
        }
        Update: {
          ambient_temperature_a?: string | null
          ambient_temperature_b?: string | null
          ambient_temperature_c?: string | null
          backbar_dimension?: string | null
          backbar_mass?: number | null
          coil_height?: number | null
          cold_ampere_turns_a?: string | null
          cold_ampere_turns_b?: string | null
          cold_ampere_turns_c?: string | null
          cold_current_a?: number | null
          cold_current_b?: number | null
          cold_current_c?: number | null
          conservator_dimension?: string | null
          conservator_mass?: number | null
          coolant_mass?: number | null
          core_backbar_dimension?: string | null
          core_backbar_mass?: number | null
          core_dimension?: string | null
          core_insulator_dimension?: string | null
          core_insulator_mass?: string | null
          core_mass?: number | null
          created_at?: string
          diameter?: number | null
          expected_rise_a?: number | null
          expected_rise_b?: number | null
          expected_rise_c?: number | null
          force_factor?: number | null
          frame?: string | null
          hot_ampere_turns_a?: number | null
          hot_ampere_turns_b?: number | null
          hot_ampere_turns_c?: number | null
          hot_current_a?: number | null
          hot_current_b?: number | null
          hot_current_c?: number | null
          id?: string
          maximum_rise_a?: number | null
          maximum_rise_b?: number | null
          maximum_rise_c?: number | null
          mean_length_of_turn?: number | null
          name?: string
          notes?: string | null
          number_of_sections?: number | null
          number_of_turns?: string | null
          prefix?: number
          radial_depth?: number | null
          resistance_a?: number | null
          resistance_b?: number | null
          resistance_c?: number | null
          sealing_plate_dimension?: string | null
          sealing_plate_mass?: string | null
          side_pole_dimension?: string | null
          side_pole_mass?: number | null
          suffix?: number
          surface_area?: number | null
          surface_gauss?: number | null
          temperature_rise_a?: number | null
          temperature_rise_b?: number | null
          temperature_rise_c?: number | null
          total_mass?: number | null
          updated_at?: string
          voltage_a?: number | null
          voltage_b?: number | null
          voltage_c?: number | null
          watts?: number | null
          watts_a?: number | null
          watts_b?: number | null
          watts_c?: number | null
          width?: number | null
          winding_dimension?: string | null
          winding_mass?: number | null
          wires_in_parallel?: number | null
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
