"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { InstitutionForm } from "./InstitutionForm";

export function InstitutionManager() {
  const [institutions, setInstitutions] = useState<Tables<"institutions">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setInstitutions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  if (loading && institutions.length === 0) return <div className="p-8 text-center">Cargando instituciones...</div>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Instituciones</h2>
          <p className="text-muted-foreground">Administra las clínicas y centros médicos del sistema.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="size-4" />
          Nueva Institución
        </button>
      </div>

      {isFormOpen && (
        <InstitutionForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchInstitutions} 
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {institutions.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center bg-card/50">
            <Building2 className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay instituciones</h3>
            <p className="text-muted-foreground text-sm">Comienza creando la primera institución para los médicos.</p>
          </div>
        ) : (
          institutions.map((inst) => (
            <article key={inst.id} className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 group">
              <div className="flex items-start justify-between">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Building2 className="size-6" />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" aria-label="Eliminar">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <h4 className="mt-4 font-bold text-lg">{inst.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">RUC: {inst.ruc}</p>
              <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">📍 {inst.address || "Sin dirección"}</p>
                <p className="flex items-center gap-2">📞 {inst.phone || "Sin teléfono"}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
