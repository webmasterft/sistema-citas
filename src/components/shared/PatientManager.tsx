"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, Users, Pencil, History, Search, Trash2, RefreshCw, UserCheck, UserX } from "lucide-react";
import { PatientForm } from "./PatientForm";
import { ClinicalRecordManager } from "./ClinicalRecordManager";
import { useAuth } from "@/components/auth/AuthProvider";
import { togglePatientActive } from "@/app/actions/patient-actions";
import { useRef } from "react";

export function PatientManager() {
  const { user, role, loading: authLoading } = useAuth();
  // Only treat user as a doctor once auth is fully resolved
  const isDoctor = !authLoading && role === "doctor";
  const [patients, setPatients] = useState<Tables<"patients">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Tables<"patients"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientForHistory, setSelectedPatientForHistory] =
    useState<Tables<"patients"> | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState<Tables<"patients"> | null>(null);
  const [showSlowNetwork, setShowSlowNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirmingAction && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [isConfirmingAction]);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (loading) {
      // Mostrar advertencia de red lenta después de 4 segundos
      timer1 = setTimeout(() => setShowSlowNetwork(true), 4000);

      // Failsafe absoluto: abortar el estado de carga después de 10 segundos
      // Esto previene que la aplicación se "congele" para siempre
      timer2 = setTimeout(() => {
        setLoading(false);
        console.warn("PatientManager: Loading failsafe triggered. Request took too long.");
      }, 10000);
    } else {
      setShowSlowNetwork(false);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching patients for user:", user?.id, "with role:", role, "showInactive:", showInactive);

      let query = supabase.from("patients").select("*");

      // Filtrar por estado activo/inactivo - handling potential nulls
      if (showInactive) {
        query = query.eq("is_active", false);
      } else {
        // Patients that are NOT is_active = false (includes true and null just in case)
        query = query.or("is_active.is.null,is_active.eq.true");
      }
      
      query = query.order("last_name");

      // Solo filtrar si NO es administrador
      const isAdmin = role === "admin";
      if (!isAdmin && user) {
        console.log("Applying doctor filter for ID:", user.id);
        query = query.eq("doctor_id", user.id);
      } else {
        console.log("Admin access: Fetching all patients");
      }

      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (!error && data) {
        console.log("Patients fetched successfully:", data.length, "rows");
        setPatients(data);
        setError(null);
      } else if (error) {
        console.error("Supabase Error fetching patients:", error);
        setError(`Error al cargar pacientes (${error.code}): ${error.message}`);
      }
    } catch (err: any) {
      console.error("Fetch patients error:", err);
      setError("Fallo de conexión al cargar pacientes.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, isDoctor, user, showInactive, role]);

  useEffect(() => {
    if (authLoading) return; // wait for auth to settle

    if (!user) {
      setLoading(false);
      return;
    }

    fetchPatients();
  }, [fetchPatients, user, authLoading]);

  const handleToggleActive = async () => {
    if (!isConfirmingAction) return;
    
    try {
      setLoading(true);
      const newStatus = !isConfirmingAction.is_active;
      const result = await togglePatientActive(isConfirmingAction.id, newStatus);
      
      if (!result.success) throw new Error(result.error);
      
      setIsConfirmingAction(null);
      fetchPatients();
    } catch (err) {
      console.error("Toggle active error:", err);
      alert("No se pudo cambiar el estado del paciente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
            Listado general de pacientes y acceso a historias clínicas.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPatient(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="size-4" />
          Nuevo Paciente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar paciente por nombre o identificación..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex p-1 bg-muted rounded-lg w-fit self-end sm:self-auto">
          <button
            onClick={() => setShowInactive(false)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              !showInactive 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-4" />
            Activos
          </button>
          <button
            onClick={() => setShowInactive(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              showInactive 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserX className="size-4" />
            Inactivos
          </button>
        </div>
      </div>

      {isFormOpen && (
        <PatientForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingPatient(null);
          }}
          onSuccess={fetchPatients}
          initialData={editingPatient}
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando pacientes...</p>
                    {showSlowNetwork && (
                      <p className="text-xs text-amber-500 mt-2">
                        Esto está tardando más de lo normal...
                      </p>
                    )}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-destructive font-medium mb-4">{error}</div>
                    <button
                      onClick={() => {
                        setError(null);
                        fetchPatients();
                      }}
                      className="text-sm px-4 py-2 bg-muted rounded-md border hover:bg-muted/80 transition-colors"
                    >
                      Reintentar carga
                    </button>
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
                  const age = birthDate
                    ? new Date().getFullYear() - birthDate.getFullYear()
                    : "N/A";

                  return (
                    <tr key={patient.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">
                          {patient.first_name} {patient.last_name}
                        </div>
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
                            className="p-2 text-primary hover:bg-primary/10 rounded-md flex items-center gap-1 text-xs font-medium cursor-pointer"
                            title="Ver Historia Clínica"
                          >
                            <History className="size-4" />
                            <span className="hidden sm:inline">Historia</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingPatient(patient);
                              setIsFormOpen(true);
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </button>
                          {(role === "admin" || role === "webmaster" || role === "doctor") && (
                            <button
                              onClick={() => setIsConfirmingAction(patient)}
                              className={`p-2 rounded-md transition-colors cursor-pointer ${
                                patient.is_active
                                  ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  : "text-primary hover:bg-primary/10"
                              }`}
                              title={patient.is_active ? "Inactivar" : "Reactivar"}
                              aria-label={patient.is_active ? "Inactivar" : "Reactivar"}
                            >
                              {patient.is_active ? (
                                <Trash2 className="size-4" />
                              ) : (
                                <RefreshCw className="size-4" />
                              )}
                            </button>
                          )}
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

      {isConfirmingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-full ${isConfirmingAction.is_active ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {isConfirmingAction.is_active ? <UserX className="size-6" /> : <UserCheck className="size-6" />}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                {isConfirmingAction.is_active ? 'Inactivar' : 'Reactivar'} Paciente
              </h3>
            </div>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {isConfirmingAction.is_active 
                ? `¿Estás seguro de inactivar a ${isConfirmingAction.first_name} ${isConfirmingAction.last_name}? Sus récords históricos y facturas se preservarán para estadísticas, pero será ocultado del panel principal.`
                : `¿Deseas reactivar a ${isConfirmingAction.first_name} ${isConfirmingAction.last_name} y devolverlo a la lista de pacientes activos?`}
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3 font-medium">
              <button
                ref={cancelRef}
                onClick={() => setIsConfirmingAction(null)}
                className="order-2 sm:order-1 px-6 py-2.5 rounded-xl border bg-muted/50 hover:bg-muted transition-all cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                onClick={handleToggleActive}
                className={`order-1 sm:order-2 px-6 py-2.5 rounded-xl text-white transition-all shadow-lg cursor-pointer ${
                  isConfirmingAction.is_active 
                    ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' 
                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {isConfirmingAction.is_active ? 'Sí, inactivar' : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
