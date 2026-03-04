"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, Users, Pencil, History, Search } from "lucide-react";
import { PatientForm } from "./PatientForm";
import { ClinicalRecordManager } from "./ClinicalRecordManager";

export function PatientManager() {
  const [patients, setPatients] = useState<Tables<"patients">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Tables<"patients"> | null>(null);
  const [showSlowNetwork, setShowSlowNetwork] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowSlowNetwork(true), 5000);
    } else {
      setShowSlowNetwork(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("patients")
        .select("*")
        .order("last_name");
      
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setPatients(data);
      }
    } catch (err) {
      console.error("Fetch patients error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">Listado general de pacientes y acceso a historias clínicas.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="size-4" />
          Nuevo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input 
          type="search"
          placeholder="Buscar paciente por nombre o identificación..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isFormOpen && (
        <PatientForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchPatients} 
        />
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-bold border-b">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Identificación</th>
                <th className="px-6 py-4">Edad / Sexo</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2"></div>
                      <p className="text-muted-foreground">Cargando pacientes...</p>
                      {showSlowNetwork && (
                        <div className="mt-4 p-4 border border-destructive/20 bg-destructive/10 rounded-lg max-w-md text-sm text-center">
                          <p className="font-semibold text-destructive mb-2">Parece que la conexión se atascó.</p>
                          <button 
                            onClick={() => {
                              localStorage.clear();
                              window.location.reload();
                            }}
                            className="px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-md hover:bg-destructive/90 transition-colors mt-2"
                          >
                            Forzar Limpieza y Recargar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto size-12 opacity-20 mb-4" />
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const birthDate = patient.birth_date ? new Date(patient.birth_date) : null;
                  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : "N/A";
                  
                  return (
                    <tr key={patient.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{patient.first_name} {patient.last_name}</div>
                        <div className="text-xs text-muted-foreground">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{patient.id_number}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize">{patient.gender || "---"}</span>
                        <span className="text-muted-foreground ml-2">({age} años)</span>
                      </td>
                      <td className="px-6 py-4">{patient.phone || "---"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => setSelectedPatientForHistory(patient)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-md flex items-center gap-1 text-xs font-medium"
                            title="Ver Historia Clínica"
                          >
                            <History className="size-4" />
                            <span className="hidden sm:inline">Historia</span>
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="Editar">
                            <Pencil className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatientForHistory && (
        <ClinicalRecordManager 
          patient={selectedPatientForHistory} 
          onClose={() => setSelectedPatientForHistory(null)} 
        />
      )}
    </section>
  );
}
