"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, Stethoscope, Pencil, Trash2, Building2 } from "lucide-react";
import { DoctorForm } from "./DoctorForm";

export function DoctorManager() {
  const [doctors, setDoctors] = useState<Tables<"profiles">[]>([]);
  const [institutions, setInstitutions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch doctors (profiles with role=doctor)
    const { data: doctorsData, error: doctorsError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor")
      .order("full_name");

    // Fetch institutions for mapping labels
    const { data: instData } = await supabase
      .from("institutions")
      .select("id, name");

    if (!doctorsError && doctorsData) {
      setDoctors(doctorsData);
    }

    if (instData) {
      const mapping = instData.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {});
      setInstitutions(mapping);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && doctors.length === 0) return <div className="p-8 text-center">Cargando médicos...</div>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Médicos</h2>
          <p className="text-muted-foreground">Administra los profesionales de la salud y sus afiliaciones.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="size-4" />
          Registrar Médico
        </button>
      </div>

      {isFormOpen && (
        <DoctorForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchData} 
        />
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-bold border-b">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4">Licencia</th>
                <th className="px-6 py-4">Institución</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay médicos registrados.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-accent/30 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Stethoscope className="size-4" />
                      </div>
                      <span className="font-medium text-foreground">{doc.full_name}</span>
                    </td>
                    <td className="px-6 py-4">{doc.specialty || "General"}</td>
                    <td className="px-6 py-4 text-xs font-mono">{doc.license_number || "N/A"}</td>
                    <td className="px-6 py-4">
                      {doc.institution_id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          <Building2 className="size-3" />
                          {institutions[doc.institution_id] || "Cargando..."}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Independiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="Editar">
                          <Pencil className="size-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
