"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, ClipboardList, Clock, User, X } from "lucide-react";
import { ClinicalRecordForm } from "./ClinicalRecordForm";

interface ClinicalRecordManagerProps {
  patient: Tables<"patients">;
  onClose: () => void;
}

export function ClinicalRecordManager({ patient, onClose }: ClinicalRecordManagerProps) {
  const [records, setRecords] = useState<Tables<"clinical_history">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clinical_history")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  }, [patient.id]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <section className="w-full max-w-4xl h-full bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-6 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h2>
              <p className="text-sm text-muted-foreground">ID: {patient.id_number} | Historia Clínica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors" aria-label="Cerrar">
            <X className="size-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Evoluciones Médicas
            </h3>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-4" />
              Nueva Evolución (SOAP)
            </button>
          </div>

          {isFormOpen && (
            <ClinicalRecordForm 
              patientId={patient.id} 
              onClose={() => setIsFormOpen(false)} 
              onSuccess={fetchRecords} 
            />
          )}

          <div className="space-y-6">
            {loading && records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">Cargando historial...</div>
            ) : records.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center bg-muted/20">
                <Clock className="mx-auto size-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay registros previos para este paciente.</p>
              </div>
            ) : (
              records.map((record) => (
                <article key={record.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock className="size-3" />
                      {new Date(record.created_at).toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
                    </div>
                    {record.assessment_cie10 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                        CIE-10: {record.assessment_cie10}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-black text-primary/70 uppercase mb-1">Subjetivo (S)</h5>
                        <p className="text-sm leading-relaxed">{record.subjective || "---"}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-primary/70 uppercase mb-1">Objetivo (O)</h5>
                        <p className="text-sm leading-relaxed">{record.objective || "---"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-black text-primary/70 uppercase mb-1">Análisis (A)</h5>
                        <div className="text-sm italic text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-primary/50">
                          {record.internal_notes || "---"}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-primary/70 uppercase mb-1">Plan (P)</h5>
                        <p className="text-sm leading-relaxed font-medium text-foreground">{record.plan || "---"}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
