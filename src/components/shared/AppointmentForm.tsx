"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Plus, CalendarDays, Clock, Stethoscope } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tables } from "@/types/database";
import { getAvailableSlots, TimeSlot } from "@/lib/scheduling";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { createAppointment, updateAppointment } from "@/app/actions/appointment-actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onNewPatient: () => void;
  initialData?: any;
}

export function AppointmentForm({ onClose, onSuccess, onNewPatient, initialData }: AppointmentFormProps) {
  const { user, loading: authLoading, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Tables<"patients">[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Slot picker state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialData?.start_time) {
      return new Date(initialData.start_time).toISOString().split("T")[0];
    }
    return "";
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    if (initialData?.start_time) {
      const d = new Date(initialData.start_time);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "";
  });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [patientId, setPatientId] = useState<string>(initialData?.patient_id || "");
  const [reason, setReason] = useState<string>(initialData?.reason || "");
  const [status, setStatus] = useState<string>(initialData?.status || "pending");

  // Admin-only: doctor selector
  const isAdmin = role === "admin" || role === "webmaster";
  const [adminDoctors, setAdminDoctors] = useState<any[]>([]);
  const [adminSelectedDoctorId, setAdminSelectedDoctorId] = useState<string>(initialData?.doctor_id || "");
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // The effective doctor ID: for doctors it's ALWAYS user.id, for admins it's their selection
  const effectiveDoctorId = isAdmin ? adminSelectedDoctorId : user?.id ?? "";

  // Fetch patients – uses effectiveDoctorId which is stable for doctors
  useEffect(() => {
    if (authLoading || !user) {
      setLoadingPatients(false);
      return;
    }
    if (!effectiveDoctorId) {
      // Admin hasn't selected a doctor yet
      setPatients([]);
      setLoadingPatients(false);
      return;
    }

    async function fetchPatients() {
      try {
        setLoadingPatients(true);
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("doctor_id", effectiveDoctorId)
          .order("first_name");

        if (!error && data) setPatients(data);
      } catch (err) {
        console.error("Error fetching patients", err);
      } finally {
        setLoadingPatients(false);
      }
    }
    fetchPatients();
  }, [user, authLoading, effectiveDoctorId]);

  // Admin-only: fetch doctors list
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    async function fetchDoctors() {
      setLoadingDoctors(true);
      const { data } = await (supabase
        .from("doctors_directory" as any)
        .select("id, full_name, specialty") as any);
      if (data) setAdminDoctors(data);
      setLoadingDoctors(false);
    }
    fetchDoctors();
  }, [isAdmin, authLoading]);

  // Fetch available slots when date or doctor changes
  const isFirstSlotLoad = useRef(!!initialData);
  useEffect(() => {
    if (authLoading || !effectiveDoctorId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setScheduleError(null);

    // Only clear slot selection when user actively changes date, not on initial edit load
    if (!isFirstSlotLoad.current) {
      setSelectedSlot("");
    }

    getAvailableSlots(effectiveDoctorId, selectedDate)
      .then(({ slots: s, slotDuration: sd, error: e }) => {
        if (e) {
          setScheduleError(e);
          setSlots([]);
        } else {
          const fetchedSlots = s || [];
          setSlots(fetchedSlots);
          setSlotDuration(sd || 30);

          // On first load for editing, restore the original slot and mark it available
          if (isFirstSlotLoad.current && initialData?.start_time) {
            const d = new Date(initialData.start_time);
            const originalSlot = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setSelectedSlot(originalSlot);
            isFirstSlotLoad.current = false;
          }
        }
      })
      .catch((err) => {
        console.error("Error in getAvailableSlots:", err);
        setScheduleError("Error al conectar con la base de datos.");
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDate, effectiveDoctorId, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError("No hay una sesión activa."); return; }
    if (!effectiveDoctorId) { setError("Seleccione un médico."); return; }
    if (!patientId) { setError("Seleccione un paciente."); return; }
    if (!selectedDate) { setError("Seleccione una fecha."); return; }
    if (!selectedSlot) { setError("Seleccione un horario disponible."); return; }

    setLoading(true);
    setError(null);

    const [h, m] = selectedSlot.split(":").map(Number);
    const startDate = new Date(`${selectedDate}T00:00:00`);
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + slotDuration * 60 * 1000);

    const payload = {
      doctor_id: effectiveDoctorId,
      patient_id: patientId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      reason,
      status,
    };

    try {
      let result;
      if (initialData?.id) {
        result = await updateAppointment(initialData.id, payload);
      } else {
        result = await createAppointment(payload);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar la cita.");
    } finally {
      setLoading(false);
    }
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const patientOptions = patients.map((p) => ({
    id: p.id,
    label: `${p.first_name} ${p.last_name}`,
    subLabel: `ID: ${p.id_number}`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold">{initialData ? "Editar Cita" : "Agendar Nueva Cita"}</h2>
            <p className="text-xs text-muted-foreground">Complete los campos y seleccione un horario disponible.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 opacity-70 hover:opacity-100 hover:bg-accent transition-all cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {/* Doctor selector — admin only */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" /> Médico Responsable <span className="text-destructive">*</span>
              </label>
              {loadingDoctors ? (
                <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
              ) : (
                <SearchableSelect
                  options={adminDoctors.map((d) => ({
                    id: d.id,
                    label: d.full_name,
                    subLabel: d.specialty,
                  }))}
                  value={adminSelectedDoctorId}
                  onChange={setAdminSelectedDoctorId}
                  placeholder="Seleccione el médico para esta cita"
                />
              )}
            </div>
          )}

          {/* Patient selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="patient_id" className="text-sm font-semibold">
                Paciente <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={onNewPatient}
                className="text-[10px] h-6 px-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm border border-secondary cursor-pointer uppercase tracking-wider"
              >
                <Plus className="size-2.5" /> Registrar nuevo
              </button>
            </div>
            {loadingPatients ? (
              <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
            ) : (
              <SearchableSelect
                id="patient_id"
                options={patientOptions}
                value={patientId}
                onChange={setPatientId}
                placeholder="Seleccione un paciente"
                searchPlaceholder="Buscar por nombre o identificación..."
              />
            )}
          </div>

          {/* Date selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" /> Fecha de la cita <span className="text-destructive">*</span>
            </label>
            <DatePicker
              selected={selectedDate ? new Date(selectedDate + "T12:00:00") : null}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(format(date, "yyyy-MM-dd"));
                } else {
                  setSelectedDate("");
                }
              }}
              minDate={todayDate}
              placeholderText="Seleccione el día"
            />
          </div>

          {/* Available Slots */}
          {selectedDate && (
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Horarios disponibles
              </label>

              {loadingSlots ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm font-medium">Calculando turnos disponibles...</p>
                </div>
              ) : scheduleError ? (
                <div className="rounded-md bg-amber-500/10 p-4 text-center border border-amber-500/20">
                  <p className="text-sm text-amber-600 font-medium">{scheduleError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map((slot) => {
                    const isBooked = !slot.isAvailable && slot.reason === "booked";
                    const isPast = !slot.isAvailable && slot.reason === "past";
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={cn(
                          "py-2 text-sm font-medium rounded-lg border transition-all text-center",
                          slot.isAvailable
                            ? isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                              : "bg-background hover:border-primary hover:text-primary cursor-pointer"
                            : isPast
                              ? "bg-muted/20 text-muted-foreground/40 border-muted/20 cursor-not-allowed line-through"
                              : "bg-destructive/10 text-destructive/50 border-destructive/20 cursor-not-allowed relative"
                        )}
                        title={isPast ? "Hora ya pasada" : isBooked ? "Turno ocupado" : slot.time}
                      >
                        {slot.time}
                        {isBooked && (
                          <span className="block text-[9px] leading-none mt-0.5 opacity-70">Ocupado</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-semibold">Motivo de la Cita</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Chequeo general, revisión de exámenes..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border hover:bg-accent transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSlot}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cita"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
