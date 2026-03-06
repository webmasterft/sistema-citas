"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getDoctorsAndAvatars } from "@/app/actions/doctor-actions";
import { Tables } from "@/types/database";
import { Plus, Stethoscope, Pencil, Trash2, Building2 } from "lucide-react";
import { DoctorForm } from "./DoctorForm";

export function DoctorManager() {
  const [doctors, setDoctors] = useState<Tables<"profiles">[]>([]);
  const [institutions, setInstitutions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [showSlowNetwork, setShowSlowNetwork] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (loading) {
      timer1 = setTimeout(() => setShowSlowNetwork(true), 4000);
      timer2 = setTimeout(() => {
        setLoading(false);
        console.warn("DoctorManager: Loading failsafe triggered.");
      }, 10000);
    } else {
      setShowSlowNetwork(false);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const doctorsResult = await getDoctorsAndAvatars();

      // Fetch institutions for mapping labels
      const { data: instData } = await supabase
        .from("institutions")
        .select("id, name");

      if (doctorsResult.success && doctorsResult.data) {
        setDoctors(doctorsResult.data as any);
      } else {
        console.error("Fetch doctors error via server action:", doctorsResult.error);
      }

      if (instData) {
        const mapping = instData.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {});
        setInstitutions(mapping);
      }
    } catch (err) {
      console.error("Fetch doctors error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && doctors.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">Cargando médicos...</p>
        {showSlowNetwork && (
          <div className="mt-4 p-4 border border-destructive/20 bg-destructive/10 rounded-lg max-w-md text-sm">
            <p className="font-semibold text-destructive mb-2">Parece que la conexión se atascó.</p>
            <p className="text-muted-foreground mb-4">Esto ocurre a veces en desarrollo cuando la base de datos bloquea el almacenamiento local.</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Médicos</h2>
          <p className="text-muted-foreground">Administra los profesionales de la salud y sus afiliaciones.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="size-4" />
          Registrar Médico
        </button>
      </div>

      {isFormOpen && (
        <DoctorForm 
          initialData={editingDoctor}
          onClose={() => {
            setIsFormOpen(false);
            setEditingDoctor(null);
          }} 
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
                        <button 
                          onClick={() => {
                            setEditingDoctor(doc);
                            setIsFormOpen(true);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground cursor-pointer" 
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("¿Está seguro de eliminar a este profesional?")) {
                              const { error } = await (supabase
                                .from("doctors_directory" as any)
                                .delete()
                                .eq("id", doc.id) as any);
                              if (!error) fetchData();
                              else alert("Error al eliminar");
                            }
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive cursor-pointer" 
                          aria-label="Eliminar"
                        >
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
