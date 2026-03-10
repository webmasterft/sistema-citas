export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          patient_id?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      cie10_codes: {
        Row: {
          code: string;
          description: string;
        };
        Insert: {
          code: string;
          description: string;
        };
        Update: {
          code?: string;
          description?: string;
        };
        Relationships: [];
      };
      clinical_history: {
        Row: {
          assessment_cie10: string | null;
          created_at: string;
          doctor_id: string;
          id: string;
          internal_notes: string | null;
          objective: string | null;
          patient_id: string;
          plan: string | null;
          prescription: string | null;
          subjective: string | null;
          weight: number | null;
          height: number | null;
          temperature: number | null;
          heart_rate: number | null;
          respiratory_rate: number | null;
          blood_pressure_sys: number | null;
          blood_pressure_dia: number | null;
          oxygen_saturation: number | null;
        };
        Insert: {
          assessment_cie10?: string | null;
          created_at?: string;
          doctor_id: string;
          id?: string;
          internal_notes?: string | null;
          objective?: string | null;
          patient_id: string;
          plan?: string | null;
          prescription?: string | null;
          subjective?: string | null;
          weight?: number | null;
          height?: number | null;
          temperature?: number | null;
          heart_rate?: number | null;
          respiratory_rate?: number | null;
          blood_pressure_sys?: number | null;
          blood_pressure_dia?: number | null;
          oxygen_saturation?: number | null;
        };
        Update: {
          assessment_cie10?: string | null;
          created_at?: string;
          doctor_id?: string;
          id?: string;
          internal_notes?: string | null;
          objective?: string | null;
          patient_id?: string;
          plan?: string | null;
          prescription?: string | null;
          subjective?: string | null;
          weight?: number | null;
          height?: number | null;
          temperature?: number | null;
          heart_rate?: number | null;
          respiratory_rate?: number | null;
          blood_pressure_sys?: number | null;
          blood_pressure_dia?: number | null;
          oxygen_saturation?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_history_assessment_cie10_fkey";
            columns: ["assessment_cie10"];
            isOneToOne: false;
            referencedRelation: "cie10_codes";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "clinical_history_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_history_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      institutions: {
        Row: {
          address: string | null;
          created_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          phone: string | null;
          ruc: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          ruc: string;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          ruc?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          created_at: string | null;
          description: string;
          discount: number | null;
          id: string;
          invoice_id: string;
          quantity: number;
          tariff_id: string | null;
          tax_amount: number;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          discount?: number | null;
          id?: string;
          invoice_id: string;
          quantity?: number;
          tariff_id?: string | null;
          tax_amount: number;
          total_price: number;
          unit_price: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          discount?: number | null;
          id?: string;
          invoice_id?: string;
          quantity?: number;
          tariff_id?: string | null;
          tax_amount?: number;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_tariff_id_fkey";
            columns: ["tariff_id"];
            isOneToOne: false;
            referencedRelation: "tariffs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string;
          doctor_id: string;
          grand_total: number;
          id: string;
          patient_id: string;
          sri_access_key: string | null;
          sri_authorization_number: string | null;
          sri_status: string | null;
          total_base_0: number | null;
          total_base_iva: number | null;
          total_iva: number | null;
          xml_path: string | null;
        };
        Insert: {
          created_at?: string;
          doctor_id: string;
          grand_total: number;
          id?: string;
          patient_id: string;
          sri_access_key?: string | null;
          sri_authorization_number?: string | null;
          sri_status?: string | null;
          total_base_0?: number | null;
          total_base_iva?: number | null;
          total_iva?: number | null;
          xml_path?: string | null;
        };
        Update: {
          created_at?: string;
          doctor_id?: string;
          grand_total?: number;
          id?: string;
          patient_id?: string;
          sri_access_key?: string | null;
          sri_authorization_number?: string | null;
          sri_status?: string | null;
          total_base_0?: number | null;
          total_base_iva?: number | null;
          total_iva?: number | null;
          xml_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_documents: {
        Row: {
          content: Json;
          created_at: string;
          doctor_id: string;
          id: string;
          patient_id: string;
          type: string;
          verification_token: string | null;
        };
        Insert: {
          content: Json;
          created_at?: string;
          doctor_id: string;
          id?: string;
          patient_id: string;
          type: string;
          verification_token?: string | null;
        };
        Update: {
          content?: Json;
          created_at?: string;
          doctor_id?: string;
          id?: string;
          patient_id?: string;
          type?: string;
          verification_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "medical_documents_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_documents_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          address: string | null;
          birth_date: string | null;
          created_at: string;
          doctor_id: string;
          email: string | null;
          first_name: string;
          middle_name: string | null;
          id: string;
          id_number: string;
          id_type: string | null;
          insurance_provider_id: string | null;
          last_name: string;
          second_last_name: string | null;
          phone: string | null;
          gender: string | null;
          physical_illnesses: string | null;
          allergies: string | null;
          family_history: string | null;
          surgical_history: string | null;
          medications: string | null;
        };
        Insert: {
          address?: string | null;
          birth_date?: string | null;
          created_at?: string;
          doctor_id: string;
          email?: string | null;
          first_name: string;
          id?: string;
          id_number: string;
          id_type?: string | null;
          insurance_provider_id?: string | null;
          last_name: string;
          phone?: string | null;
          physical_illnesses?: string | null;
          allergies?: string | null;
          family_history?: string | null;
          surgical_history?: string | null;
          medications?: string | null;
        };
        Update: {
          address?: string | null;
          birth_date?: string | null;
          created_at?: string;
          doctor_id?: string;
          email?: string | null;
          first_name?: string;
          middle_name?: string | null;
          id?: string;
          id_number?: string;
          id_type?: string | null;
          insurance_provider_id?: string | null;
          last_name?: string;
          second_last_name?: string | null;
          phone?: string | null;
          gender?: string | null;
          physical_illnesses?: string | null;
          allergies?: string | null;
          family_history?: string | null;
          surgical_history?: string | null;
          medications?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          institution_id: string | null;
          license_number: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          ruc: string | null;
          signature_p12_url: string | null;
          specialty: string | null;
          avatar_url: string | null;
          phone: string | null;
          address: string | null;
          bio: string | null;
          birth_date: string | null;
          experience_years: number | null;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          institution_id?: string | null;
          license_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          ruc?: string | null;
          signature_p12_url?: string | null;
          specialty?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          experience_years?: number | null;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          institution_id?: string | null;
          license_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          ruc?: string | null;
          signature_p12_url?: string | null;
          specialty?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          experience_years?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      tariffs: {
        Row: {
          cie10_code: string | null;
          created_at: string | null;
          description: string | null;
          doctor_id: string;
          id: string;
          institution_id: string | null;
          iva_rate: number;
          name: string;
          price: number;
        };
        Insert: {
          cie10_code?: string | null;
          created_at?: string | null;
          description?: string | null;
          doctor_id: string;
          id?: string;
          institution_id?: string | null;
          iva_rate?: number;
          name: string;
          price?: number;
        };
        Update: {
          cie10_code?: string | null;
          created_at?: string | null;
          description?: string | null;
          doctor_id?: string;
          id?: string;
          institution_id?: string | null;
          iva_rate?: number;
          name?: string;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tariffs_cie10_code_fkey";
            columns: ["cie10_code"];
            isOneToOne: false;
            referencedRelation: "cie10_codes";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "tariffs_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tariffs_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "doctor" | "patient";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = Database["public"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
