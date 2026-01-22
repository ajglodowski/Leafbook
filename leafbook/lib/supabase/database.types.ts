export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          plant_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          plant_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          plant_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "journal_entries_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "journal_entries_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
      plant_care_preferences: {
        Row: {
          created_at: string
          fertilizing_frequency_days: number | null
          id: string
          notes: string | null
          plant_id: string
          updated_at: string
          watering_frequency_days: number | null
        }
        Insert: {
          created_at?: string
          fertilizing_frequency_days?: number | null
          id?: string
          notes?: string | null
          plant_id: string
          updated_at?: string
          watering_frequency_days?: number | null
        }
        Update: {
          created_at?: string
          fertilizing_frequency_days?: number | null
          id?: string
          notes?: string | null
          plant_id?: string
          updated_at?: string
          watering_frequency_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_care_preferences_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: true
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_care_preferences_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: true
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_care_preferences_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: true
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_care_preferences_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: true
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
      plant_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          metadata: Json | null
          notes: string | null
          plant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          notes?: string | null
          plant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          notes?: string | null
          plant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_events_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_events_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_events_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_events_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
      plant_issues: {
        Row: {
          created_at: string
          description: string | null
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          plant_id: string
          resolution_notes: string | null
          resolved_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["issue_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          plant_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          plant_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_issues_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_issues_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_issues_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_issues_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
      plant_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          plant_id: string
          taken_at: string
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          plant_id: string
          taken_at?: string
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          plant_id?: string
          taken_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
      plant_type_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          plant_type_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          plant_type_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          plant_type_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_type_photos_plant_type_id_fkey"
            columns: ["plant_type_id"]
            isOneToOne: false
            referencedRelation: "plant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_type_origins: {
        Row: {
          id: string
          plant_type_id: string
          country_code: string
          region: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plant_type_id: string
          country_code: string
          region?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plant_type_id?: string
          country_code?: string
          region?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_type_origins_plant_type_id_fkey"
            columns: ["plant_type_id"]
            isOneToOne: false
            referencedRelation: "plant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_types: {
        Row: {
          care_notes: string | null
          created_at: string
          description: string | null
          enriched_at: string | null
          enriched_by: string | null
          external_raw: Json | null
          fertilizing_frequency_days: number | null
          id: string
          light_max: Database["public"]["Enums"]["light_requirement"] | null
          light_max_numeric: number | null
          light_min: Database["public"]["Enums"]["light_requirement"] | null
          light_min_numeric: number | null
          location_preference: Database["public"]["Enums"]["plant_type_location"]
          name: string
          origin_country_code: string | null
          origin_region: string | null
          scientific_name: string | null
          size_max: Database["public"]["Enums"]["size_category"] | null
          size_max_numeric: number | null
          size_min: Database["public"]["Enums"]["size_category"] | null
          size_min_numeric: number | null
          taxon_id: string | null
          updated_at: string
          watering_frequency_days: number | null
          wikidata_qid: string | null
          wikipedia_lang: string
          wikipedia_title: string | null
        }
        Insert: {
          care_notes?: string | null
          created_at?: string
          description?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          external_raw?: Json | null
          fertilizing_frequency_days?: number | null
          id?: string
          light_max?: Database["public"]["Enums"]["light_requirement"] | null
          light_max_numeric?: number | null
          light_min?: Database["public"]["Enums"]["light_requirement"] | null
          light_min_numeric?: number | null
          location_preference?: Database["public"]["Enums"]["plant_type_location"]
          name: string
          origin_country_code?: string | null
          origin_region?: string | null
          scientific_name?: string | null
          size_max?: Database["public"]["Enums"]["size_category"] | null
          size_max_numeric?: number | null
          size_min?: Database["public"]["Enums"]["size_category"] | null
          size_min_numeric?: number | null
          taxon_id?: string | null
          updated_at?: string
          watering_frequency_days?: number | null
          wikidata_qid?: string | null
          wikipedia_lang?: string
          wikipedia_title?: string | null
        }
        Update: {
          care_notes?: string | null
          created_at?: string
          description?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          external_raw?: Json | null
          fertilizing_frequency_days?: number | null
          id?: string
          light_max?: Database["public"]["Enums"]["light_requirement"] | null
          light_max_numeric?: number | null
          light_min?: Database["public"]["Enums"]["light_requirement"] | null
          light_min_numeric?: number | null
          location_preference?: Database["public"]["Enums"]["plant_type_location"]
          name?: string
          origin_country_code?: string | null
          origin_region?: string | null
          scientific_name?: string | null
          size_max?: Database["public"]["Enums"]["size_category"] | null
          size_max_numeric?: number | null
          size_min?: Database["public"]["Enums"]["size_category"] | null
          size_min_numeric?: number | null
          taxon_id?: string | null
          updated_at?: string
          watering_frequency_days?: number | null
          wikidata_qid?: string | null
          wikipedia_lang?: string
          wikipedia_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_types_taxon_id_fkey"
            columns: ["taxon_id"]
            isOneToOne: false
            referencedRelation: "taxa"
            referencedColumns: ["id"]
          },
        ]
      }
      taxa: {
        Row: {
          id: string
          wikidata_qid: string
          rank: string | null
          scientific_name: string | null
          common_name: string | null
          description: string | null
          wikipedia_title: string | null
          wikipedia_lang: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wikidata_qid: string
          rank?: string | null
          scientific_name?: string | null
          common_name?: string | null
          description?: string | null
          wikipedia_title?: string | null
          wikipedia_lang?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wikidata_qid?: string
          rank?: string | null
          scientific_name?: string | null
          common_name?: string | null
          description?: string | null
          wikipedia_title?: string | null
          wikipedia_lang?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxon_edges: {
        Row: {
          parent_taxon_id: string
          child_taxon_id: string
          relationship: string
          created_at: string
        }
        Insert: {
          parent_taxon_id: string
          child_taxon_id: string
          relationship?: string
          created_at?: string
        }
        Update: {
          parent_taxon_id?: string
          child_taxon_id?: string
          relationship?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxon_edges_parent_taxon_id_fkey"
            columns: ["parent_taxon_id"]
            isOneToOne: false
            referencedRelation: "taxa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxon_edges_child_taxon_id_fkey"
            columns: ["child_taxon_id"]
            isOneToOne: false
            referencedRelation: "taxa"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          acquired_at: string | null
          active_photo_id: string | null
          created_at: string
          current_pot_id: string | null
          description: string | null
          how_acquired: string | null
          id: string
          is_active: boolean
          is_legacy: boolean
          legacy_at: string | null
          legacy_reason: string | null
          light_exposure:
            | Database["public"]["Enums"]["light_requirement"]
            | null
          light_numeric: number | null
          location: string | null
          name: string
          nickname: string | null
          parent_plant_id: string | null
          plant_location: Database["public"]["Enums"]["plant_location"]
          plant_type_id: string | null
          size_category: Database["public"]["Enums"]["size_category"] | null
          size_numeric: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          active_photo_id?: string | null
          created_at?: string
          current_pot_id?: string | null
          description?: string | null
          how_acquired?: string | null
          id?: string
          is_active?: boolean
          is_legacy?: boolean
          legacy_at?: string | null
          legacy_reason?: string | null
          light_exposure?:
            | Database["public"]["Enums"]["light_requirement"]
            | null
          light_numeric?: number | null
          location?: string | null
          name: string
          nickname?: string | null
          parent_plant_id?: string | null
          plant_location?: Database["public"]["Enums"]["plant_location"]
          plant_type_id?: string | null
          size_category?: Database["public"]["Enums"]["size_category"] | null
          size_numeric?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          active_photo_id?: string | null
          created_at?: string
          current_pot_id?: string | null
          description?: string | null
          how_acquired?: string | null
          id?: string
          is_active?: boolean
          is_legacy?: boolean
          legacy_at?: string | null
          legacy_reason?: string | null
          light_exposure?:
            | Database["public"]["Enums"]["light_requirement"]
            | null
          light_numeric?: number | null
          location?: string | null
          name?: string
          nickname?: string | null
          parent_plant_id?: string | null
          plant_location?: Database["public"]["Enums"]["plant_location"]
          plant_type_id?: string | null
          size_category?: Database["public"]["Enums"]["size_category"] | null
          size_numeric?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plants_active_photo_id_fkey"
            columns: ["active_photo_id"]
            isOneToOne: false
            referencedRelation: "plant_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_current_pot_id_fkey"
            columns: ["current_pot_id"]
            isOneToOne: false
            referencedRelation: "user_pots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_parent_plant_id_fkey"
            columns: ["parent_plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_plant_type_id_fkey"
            columns: ["plant_type_id"]
            isOneToOne: false
            referencedRelation: "plant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_pots: {
        Row: {
          color: string | null
          created_at: string
          has_drainage: boolean | null
          id: string
          is_retired: boolean
          material: string | null
          name: string
          notes: string | null
          size_inches: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          has_drainage?: boolean | null
          id?: string
          is_retired?: boolean
          material?: string | null
          name: string
          notes?: string | null
          size_inches?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          has_drainage?: boolean | null
          id?: string
          is_retired?: boolean
          material?: string | null
          name?: string
          notes?: string | null
          size_inches?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          custom_name: string | null
          id: string
          notes: string | null
          plant_type_id: string | null
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          id?: string
          notes?: string | null
          plant_type_id?: string | null
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          id?: string
          notes?: string | null
          plant_type_id?: string | null
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_plant_type_id_fkey"
            columns: ["plant_type_id"]
            isOneToOne: false
            referencedRelation: "plant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      watering_schedule_suggestions: {
        Row: {
          id: string
          plant_id: string
          user_id: string
          suggested_interval_days: number
          current_interval_days: number
          confidence_score: number | null
          detected_at: string
          dismissed_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plant_id: string
          user_id: string
          suggested_interval_days: number
          current_interval_days: number
          confidence_score?: number | null
          detected_at?: string
          dismissed_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plant_id?: string
          user_id?: string
          suggested_interval_days?: number
          current_interval_days?: number
          confidence_score?: number | null
          detected_at?: string
          dismissed_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watering_schedule_suggestions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watering_schedule_suggestions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_due_tasks"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "watering_schedule_suggestions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_effective_care"
            referencedColumns: ["plant_id"]
          },
          {
            foreignKeyName: "watering_schedule_suggestions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "v_plant_last_actions"
            referencedColumns: ["plant_id"]
          },
        ]
      }
    }
    Views: {
      v_plant_due_tasks: {
        Row: {
          fertilize_due_at: string | null
          fertilizing_frequency_days: number | null
          fertilizing_status: string | null
          last_fertilized_at: string | null
          last_watered_at: string | null
          plant_id: string | null
          plant_name: string | null
          plant_type_name: string | null
          user_id: string | null
          water_due_at: string | null
          watering_frequency_days: number | null
          watering_status: string | null
        }
        Relationships: []
      }
      v_plant_effective_care: {
        Row: {
          fertilizing_frequency_days: number | null
          plant_id: string | null
          plant_name: string | null
          plant_type_name: string | null
          user_id: string | null
          watering_frequency_days: number | null
        }
        Relationships: []
      }
      v_plant_last_actions: {
        Row: {
          event_type: Database["public"]["Enums"]["event_type"] | null
          last_action_date: string | null
          plant_id: string | null
          plant_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_type:
        | "watered"
        | "fertilized"
        | "repotted"
        | "pruned"
        | "rotated"
        | "misted"
        | "cleaned"
        | "propagated"
        | "acquired"
        | "other"
      issue_status: "active" | "resolved" | "monitoring"
      issue_type:
        | "pest"
        | "disease"
        | "overwatering"
        | "underwatering"
        | "sunburn"
        | "etiolation"
        | "nutrient_deficiency"
        | "root_rot"
        | "dropping_leaves"
        | "yellowing"
        | "browning"
        | "wilting"
        | "other"
      light_requirement:
        | "dark"
        | "low_indirect"
        | "medium_indirect"
        | "bright_indirect"
        | "direct"
      plant_location: "indoor" | "outdoor"
      plant_type_location: "indoor" | "outdoor" | "both"
      size_category: "small" | "medium" | "large" | "extra_large"
      user_role: "user" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_type: [
        "watered",
        "fertilized",
        "repotted",
        "pruned",
        "rotated",
        "misted",
        "cleaned",
        "propagated",
        "acquired",
        "other",
      ],
      issue_status: ["active", "resolved", "monitoring"],
      issue_type: [
        "pest",
        "disease",
        "overwatering",
        "underwatering",
        "sunburn",
        "etiolation",
        "nutrient_deficiency",
        "root_rot",
        "dropping_leaves",
        "yellowing",
        "browning",
        "wilting",
        "other",
      ],
      light_requirement: [
        "dark",
        "low_indirect",
        "medium_indirect",
        "bright_indirect",
        "direct",
      ],
      plant_location: ["indoor", "outdoor"],
      plant_type_location: ["indoor", "outdoor", "both"],
      size_category: ["small", "medium", "large", "extra_large"],
      user_role: ["user", "admin"],
    },
  },
} as const

