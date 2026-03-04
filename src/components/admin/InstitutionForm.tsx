"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2 } from "lucide-react";
import { translateError } from "@/lib/error-translator";

interface InstitutionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InstitutionForm({ onClose, onSuccess }: InstitutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const ruc = formData.get("ruc") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;

    const { error: submitError } = await supabase
      .from("institutions")
      .insert([{ name, ruc, address, phone }]);

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
          <h3 className="text-xl font-bold">Nueva Institución</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nombre de la Institución</label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Clínica Central"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ruc" className="text-sm font-medium">RUC</label>
            <input
              id="ruc"
              name="ruc"
              required
              pattern="[0-9]{13}"
              title="El RUC debe tener 13 dígitos"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="1790000000001"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">Dirección</label>
            <input
              id="address"
              name="address"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Av. Amazonas y... "
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="02-222-2222"
            />
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
              Crear
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
