export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: { id: string; slug: string; name: string; description: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Update: { slug?: string; name?: string; description?: string | null; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      spaces: {
        Row: { id: string; area_id: string; name: string; space_type: string | null; locality: string | null; address: string | null; latitude: number | null; longitude: number | null; location_validated: boolean; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; area_id: string; name: string; space_type?: string | null; locality?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null; location_validated?: boolean; active?: boolean; created_at?: string; updated_at?: string };
        Update: { area_id?: string; name?: string; space_type?: string | null; locality?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null; location_validated?: boolean; active?: boolean; updated_at?: string };
        Relationships: [{ foreignKeyName: "spaces_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: { id: string; username: string; display_name: string; role: Database["public"]["Enums"]["app_role"]; area_id: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { id: string; username: string; display_name: string; role?: Database["public"]["Enums"]["app_role"]; area_id?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Update: { username?: string; display_name?: string; role?: Database["public"]["Enums"]["app_role"]; area_id?: string | null; active?: boolean; updated_at?: string };
        Relationships: [{ foreignKeyName: "profiles_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] }];
      };
      entries: {
        Row: { id: string; kind: Database["public"]["Enums"]["entry_kind"]; title: string; details: string | null; area_id: string; space_id: string | null; status: Database["public"]["Enums"]["entry_status"]; priority: Database["public"]["Enums"]["priority_level"]; visibility: Database["public"]["Enums"]["visibility_level"]; starts_at: string | null; ends_at: string | null; due_date: string | null; created_by: string | null; updated_by: string | null; metadata: Json; created_at: string; updated_at: string };
        Insert: { id?: string; kind: Database["public"]["Enums"]["entry_kind"]; title: string; details?: string | null; area_id: string; space_id?: string | null; status?: Database["public"]["Enums"]["entry_status"]; priority?: Database["public"]["Enums"]["priority_level"]; visibility?: Database["public"]["Enums"]["visibility_level"]; starts_at?: string | null; ends_at?: string | null; due_date?: string | null; created_by?: string | null; updated_by?: string | null; metadata?: Json; created_at?: string; updated_at?: string };
        Update: { kind?: Database["public"]["Enums"]["entry_kind"]; title?: string; details?: string | null; area_id?: string; space_id?: string | null; status?: Database["public"]["Enums"]["entry_status"]; priority?: Database["public"]["Enums"]["priority_level"]; visibility?: Database["public"]["Enums"]["visibility_level"]; starts_at?: string | null; ends_at?: string | null; due_date?: string | null; updated_by?: string | null; metadata?: Json; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "coordinacion" | "responsable_area";
      entry_kind: "evento" | "solicitud" | "reunion" | "nota" | "actualizacion";
      entry_status: "borrador" | "pendiente" | "confirmado" | "completado" | "cancelado";
      priority_level: "normal" | "alta" | "compromiso_prioritario";
      visibility_level: "general" | "area" | "coordinacion";
    };
    CompositeTypes: Record<string, never>;
  };
};
