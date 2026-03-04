"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { translateError } from "@/lib/error-translator";
import { X, Loader2, Stethoscope, Search, Check, ChevronDown } from "lucide-react";
import { MEDICAL_SPECIALTIES } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoctorFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function DoctorForm({ onClose, onSuccess }: DoctorFormProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSpecialtyOpen, setIsSpecialtyOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const filteredSpecialties = MEDICAL_SPECIALTIES.filter((s: string) => 
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  );

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
    const specialty = selectedSpecialty;
    const license_number = formData.get("license_number") as string;
    const institution_id = formData.get("institution_id") as string;

    const { error: submitError } = await (supabase
      .from("doctors_directory" as any)
      .insert([{ 
        full_name, 
        specialty, 
        license_number, 
        institution_id: institution_id || null,
      }]) as any);

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

          <div className="space-y-2 relative">
            <label className="text-sm font-medium">Especialidad</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSpecialtyOpen(!isSpecialtyOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={selectedSpecialty ? "text-foreground" : "text-muted-foreground"}>
                  {selectedSpecialty || "Seleccione una especialidad"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {isSpecialtyOpen && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Buscar especialidad..."
                      value={specialtySearch}
                      onChange={(e) => setSpecialtySearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredSpecialties.length === 0 ? (
                      <div className="py-6 text-center text-sm">No se encontraron resultados.</div>
                    ) : (
                      filteredSpecialties.map((specialty) => (
                        <button
                          key={specialty}
                          type="button"
                          onClick={() => {
                            setSelectedSpecialty(specialty);
                            setIsSpecialtyOpen(false);
                            setSpecialtySearch("");
                          }}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedSpecialty === specialty ? "opacity-100" : "opacity-0")} />
                          {specialty}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
