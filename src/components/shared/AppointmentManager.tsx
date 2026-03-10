"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MoreVertical,
  CalendarDays,
  List,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppointmentForm } from "./AppointmentForm";
import { PatientForm } from "./PatientForm";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppointmentWithPatient = Tables<"appointments"> & {
  patients: {
    first_name: string;
    last_name: string;
  };
};

export function AppointmentManager() {
  const { user, role, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients (
            first_name,
            last_name
          )
        `
        )
        .eq("doctor_id", user.id)
        .order("start_time");

      if (!error && data) {
        setAppointments(data as any);
      }
    } catch (err) {
      console.error("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString("es-ES", { month: "long" });
  const year = currentDate.getFullYear();

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 border-b border-r border-muted/20 bg-muted/5"></div>
      );
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayAppointments = appointments.filter((app) => app.start_time.startsWith(dateStr));
      const isToday =
        new Date().toDateString() === new Date(year, currentDate.getMonth(), d).toDateString();

      days.push(
        <div
          key={d}
          className={cn(
            "h-32 border-b border-r border-muted/20 p-2 transition-colors hover:bg-accent/5 relative group overflow-hidden",
            isToday && "bg-primary/5"
          )}
        >
          <span
            className={cn(
              "text-sm font-medium flex items-center justify-center size-7 rounded-full transition-colors",
              isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {d}
          </span>

          <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[calc(100%-2rem)]">
            {dayAppointments.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  setEditingAppointment(app);
                  setIsAppointmentFormOpen(true);
                }}
                className={cn(
                  "w-full text-left text-[10px] px-1.5 py-0.5 rounded-lg border-none truncate cursor-pointer transition-all hover:scale-[1.02] hover:brightness-105",
                  app.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700"
                    : app.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : app.status === "completed"
                        ? "bg-slate-100 text-slate-600 font-medium"
                        : "bg-amber-100 text-amber-700 font-bold shadow-sm"
                )}
                title={`${app.patients.first_name} ${app.patients.last_name} — ${app.reason || "Sin motivo"}`}
              >
                {new Date(app.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {app.patients.last_name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Citas Médicas</h2>
          <p className="text-muted-foreground text-sm">Gestiona tus turnos y disponibilidad.</p>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer",
              viewMode === "calendar"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <CalendarDays className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <List className="size-4" />
          </button>
        </div>

        <button
          onClick={() => {
            setEditingAppointment(null);
            setIsAppointmentFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="size-4" />
          Nueva Cita
        </button>
      </div>

      {isAppointmentFormOpen && (
        <AppointmentForm
          onClose={() => setIsAppointmentFormOpen(false)}
          onSuccess={() => {
            setIsAppointmentFormOpen(false);
            fetchAppointments();
          }}
          onNewPatient={() => {
            setIsAppointmentFormOpen(false);
            setIsPatientFormOpen(true);
          }}
          initialData={editingAppointment}
        />
      )}

      {isPatientFormOpen && (
        <PatientForm
          onClose={() => {
            setIsPatientFormOpen(false);
            // Optionally reopen appointment form here
            setIsAppointmentFormOpen(true);
          }}
          onSuccess={() => {
            setIsPatientFormOpen(false);
            setIsAppointmentFormOpen(true); // Reopen to select the newly created patient
          }}
        />
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {viewMode === "calendar" ? (
          <div className="medical-card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{monthName}</h2>
                  <p className="text-sm text-slate-500 capitalize">{year}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-l border-t border-border rounded-xl overflow-hidden shadow-sm">
              {renderCalendar()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="medical-card p-12 text-center text-slate-400">
                <Loader2 className="size-8 animate-spin mx-auto mb-4" />
                Cargando citas...
              </div>
            ) : appointments.length === 0 ? (
              <div className="medical-card p-12 text-center">
                <CalendarIcon className="size-12 mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-bold">No hay citas programadas</h3>
                <p className="text-slate-400">Haga clic en 'Nueva Cita' para comenzar.</p>
              </div>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setEditingAppointment(app);
                    setIsAppointmentFormOpen(true);
                  }}
                  className="medical-card p-4 flex items-center justify-between group cursor-pointer border-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="size-14 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                        <User className="size-8 text-slate-300" />
                      </div>
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white",
                          app.status === "confirmed"
                            ? "bg-emerald-500"
                            : app.status === "cancelled"
                              ? "bg-destructive"
                              : app.status === "completed"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">
                        {app.patients.first_name} {app.patients.last_name}
                      </p>
                      <p className="text-sm text-slate-400">{app.reason || "Consulta General"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-primary font-bold">
                      {new Date(app.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest",
                        app.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-600"
                          : app.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : app.status === "completed"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-100 text-amber-600"
                      )}
                    >
                      {app.status === "confirmed"
                        ? "Confirmada"
                        : app.status === "cancelled"
                          ? "Cancelada"
                          : app.status === "completed"
                            ? "Completada"
                            : "Pendiente"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
