"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2 } from "lucide-react";
import { translateError } from "@/lib/error-translator";

interface PatientFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PatientForm({ onClose, onSuccess }: PatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const id_number = formData.get("id_number") as string;
    const birth_date = formData.get("birth_date") as string;
    const gender = formData.get("gender") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;

    // For the demo, we link to the first profile found or a placeholder UUID
    const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
    const doctor_id = profiles?.[0]?.id || crypto.randomUUID();

    const { error: submitError } = await supabase
      .from("patients")
      .insert([{ 
        first_name,
        last_name,
        id_number, 
        birth_date, 
        gender, 
        phone, 
        email, 
        address,
        doctor_id
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
      <article className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl border animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Registro de Paciente</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="first_name" className="text-sm font-medium text-foreground">Primer Nombre</label>
            <input
              id="first_name"
              name="first_name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: María"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="last_name" className="text-sm font-medium text-foreground">Apellidos</label>
            <input
              id="last_name"
              name="last_name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: José Pérez"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="id_number" className="text-sm font-medium text-foreground">Cédula / Pasaporte</label>
            <input
              id="id_number"
              name="id_number"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring font-mono"
              placeholder="1720000000"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="birth_date" className="text-sm font-medium text-foreground">Fecha de Nacimiento</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-medium text-foreground">Sexo</label>
            <select
              id="gender"
              name="gender"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="099-000-0000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="address" className="text-sm font-medium text-foreground">Dirección de Domicilio</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Calle principal, secundaria, nro de casa..."
            />
          </div>

          {error && (
            <div className="md:col-span-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="flex gap-3 pt-6 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Guardar Paciente
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
