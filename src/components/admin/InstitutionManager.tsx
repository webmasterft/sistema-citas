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
  const [editingInstitution, setEditingInstitution] = useState<Tables<"institutions"> | null>(null);
  const [showSlowNetwork, setShowSlowNetwork] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (loading) {
      timer1 = setTimeout(() => setShowSlowNetwork(true), 4000);
      timer2 = setTimeout(() => {
        setLoading(false);
        console.warn("InstitutionManager: Loading failsafe triggered.");
      }, 10000);
    } else {
      setShowSlowNetwork(false);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("institutions").select("*").order("name");

      if (!error && data) {
        setInstitutions(data);
      }
    } catch (err) {
      console.error("Fetch institutions error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la institución "${name}"?`)) return;
    try {
      const { error } = await supabase.from("institutions").delete().eq("id", id);
      if (error) throw error;
      fetchInstitutions();
    } catch (err) {
      console.error("Delete error:", err);
      alert("No se pudo eliminar la institución.");
    }
  };

  if (loading && institutions.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">Cargando instituciones...</p>
        {showSlowNetwork && (
          <div className="mt-4 p-4 border border-destructive/20 bg-destructive/10 rounded-lg max-w-md text-sm text-left">
            <p className="font-semibold text-destructive mb-2">Parece que la conexión se atascó.</p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-md hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              Forzar Limpieza y Recargar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Instituciones</h2>
          <p className="text-muted-foreground">
            Administra las clínicas y centros médicos del sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInstitution(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="size-4" />
          Nueva Institución
        </button>
      </div>

      {isFormOpen && (
        <InstitutionForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingInstitution(null);
          }}
          onSuccess={fetchInstitutions}
          initialData={editingInstitution}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {institutions.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center bg-card/50">
            <Building2 className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay instituciones</h3>
            <p className="text-muted-foreground text-sm">
              Comienza creando la primera institución para los médicos.
            </p>
          </div>
        ) : (
          institutions.map((inst) => (
            <article
              key={inst.id}
              className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 group"
            >
              <div className="flex items-start justify-between">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Building2 className="size-6" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingInstitution(inst);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inst.id, inst.name)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Eliminar"
                  >
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
