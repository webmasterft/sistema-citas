"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { translateError } from "@/lib/error-translator";
import { X, Loader2, Stethoscope } from "lucide-react"; // Keep X for the close button

interface DoctorFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function DoctorForm({ onClose, onSuccess }: DoctorFormProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInstitutions() {
      const { data } = await supabase.from("institutions").select("id, name");
      if (data) setInstitutions(data);
    }
    fetchInstitutions();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;
    const specialty = formData.get("specialty") as string;
    const license_number = formData.get("license_number") as string;
    const institution_id = formData.get("institution_id") as string;

    // For now, in this mock logic we use the profile table
    // In a real app, this might involve auth.signUp
    const { error: submitError } = await supabase
      .from("profiles")
      .insert([{ 
        id: crypto.randomUUID(), // Mock ID
        full_name, 
        specialty, 
        license_number, 
        institution_id: institution_id || null,
        role: 'doctor' 
      }]);

    if (submitError) {
      setError(translateError(submitError));
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <article className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Registrar Médico</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">Nombre Completo</label>
            <input
              id="full_name"
              name="full_name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Dr. Fernando Torres"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="specialty" className="text-sm font-medium">Especialidad</label>
            <input
              id="specialty"
              name="specialty"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Pediatría, Cardiología..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="license_number" className="text-sm font-medium">Número de Licencia / Profesional</label>
            <input
              id="license_number"
              name="license_number"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring font-mono"
              placeholder="REG-MSP-12345"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="institution_id" className="text-sm font-medium">Institución Afiliada (Opcional)</label>
            <select
              id="institution_id"
              name="institution_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Independiente / Ninguna</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
