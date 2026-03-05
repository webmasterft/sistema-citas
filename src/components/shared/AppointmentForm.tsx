"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Plus, CalendarDays, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tables } from "@/types/database";
import { getAvailableSlots, TimeSlot } from "@/lib/scheduling";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const { user } = useAuth();
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

  // Fetch patients for this doctor
  useEffect(() => {
    async function fetchPatients() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("doctor_id", user.id)
          .order("first_name");
        if (!error && data) setPatients(data);
      } catch (err) {
        console.error("Error fetching patients", err);
      } finally {
        setLoadingPatients(false);
      }
    }
    fetchPatients();
  }, [user]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !user) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setScheduleError(null);
    setSelectedSlot("");

    getAvailableSlots(user.id, selectedDate).then(({ slots: s, slotDuration: sd, error: e }) => {
      if (e) {
        setScheduleError(e);
        setSlots([]);
      } else {
        setSlots(s);
        setSlotDuration(sd);
      }
      setLoadingSlots(false);
    });
  }, [selectedDate, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError("No hay una sesión activa."); return; }
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
      doctor_id: user.id,
      patient_id: patientId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      reason,
      status,
    };

    try {
      if (initialData?.id) {
        const { error: submitError } = await supabase
          .from("appointments")
          .update(payload)
          .eq("id", initialData.id);
        if (submitError) throw submitError;
      } else {
        const { error: submitError } = await supabase
          .from("appointments")
          .insert([payload]);
        if (submitError) throw submitError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar la cita.");
    } finally {
      setLoading(false);
    }
  }

  // Get the minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  const availableCount = slots.filter((s) => s.isAvailable).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              {error}
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
                className="text-xs text-primary flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="size-3" /> Registrar nuevo
              </button>
            </div>
            {loadingPatients ? (
              <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
            ) : (
              <select
                id="patient_id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>Seleccione un paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} — {p.id_number}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date selector */}
          <div className="space-y-2">
            <label htmlFor="appt_date" className="text-sm font-semibold flex items-center gap-1.5">
              <CalendarDays className="size-4 text-muted-foreground" />
              Fecha de la cita <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="appt_date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Slot picker */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="size-4 text-muted-foreground" />
                  Horario disponible <span className="text-destructive">*</span>
                </label>
                {!loadingSlots && !scheduleError && (
                  <span className="text-xs text-muted-foreground">
                    {availableCount} turno{availableCount !== 1 ? "s" : ""} disponible{availableCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Calculando disponibilidad...</span>
                </div>
              ) : scheduleError ? (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600">
                  <strong>Sin horario configurado.</strong> {scheduleError}
                  <p className="mt-1 text-xs">Configure su horario en la pestaña "Horario" del panel.</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 border border-dashed text-sm text-muted-foreground text-center">
                  No hay turnos disponibles para este día.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-52 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isPast = slot.reason === "past";
                    const isBooked = slot.reason === "booked";
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.time)}
                        aria-pressed={isSelected}
                        className={cn(
                          "rounded-lg border text-xs font-medium py-2.5 transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.05]"
                            : slot.isAvailable
                            ? "bg-background hover:bg-primary/10 hover:border-primary/50 border-input"
                            : isPast
                            ? "bg-muted/20 text-muted-foreground/40 border-muted/20 cursor-not-allowed line-through"
                            : "bg-destructive/10 text-destructive/50 border-destructive/20 cursor-not-allowed relative"
                        )}
                        title={
                          isPast
                            ? "Hora ya pasada"
                            : isBooked
                            ? "Turno ocupado"
                            : slot.time
                        }
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
