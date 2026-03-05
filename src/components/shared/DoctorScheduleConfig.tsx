"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Save, Clock, Loader2 } from "lucide-react";

const DAYS = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
];

const SLOT_DURATIONS = [
  { label: "15 minutos", value: 15 },
  { label: "20 minutos", value: 20 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "60 minutos (1 hora)", value: 60 },
];

interface DaySchedule {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export function DoctorScheduleConfig() {
  const { user, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState<DaySchedule[]>(() =>
    DAYS.map((d) => ({
      day_of_week: d.value,
      is_active: d.value >= 1 && d.value <= 5, // Mon–Fri active by default
      start_time: "08:00",
      end_time: "17:00",
      slot_duration: 30,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("doctor_schedules" as any)
        .select("*")
        .eq("doctor_id", user.id);

      if (data && data.length > 0) {
        setSchedules((prev) =>
          prev.map((s) => {
            const found = (data as any[]).find(
              (d) => d.day_of_week === s.day_of_week
            );
            return found
              ? {
                  day_of_week: found.day_of_week,
                  is_active: found.is_active,
                  start_time: found.start_time.slice(0, 5),
                  end_time: found.end_time.slice(0, 5),
                  slot_duration: found.slot_duration,
                }
              : s;
          })
        );
      }
    } catch (err) {
      console.error("Error fetching schedule", err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchSchedule();
  }, [fetchSchedule, user, authLoading]);

  const handleChange = (
    dayOfWeek: number,
    field: keyof DaySchedule,
    value: any
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const rows = schedules.map((s) => ({
      doctor_id: user.id,
      day_of_week: s.day_of_week,
      is_active: s.is_active,
      start_time: s.start_time,
      end_time: s.end_time,
      slot_duration: s.slot_duration,
    }));

    try {
      const { error } = await supabase
        .from("doctor_schedules" as any)
        .upsert(rows, { onConflict: "doctor_id,day_of_week" });

      if (!error) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      } else {
        console.error("Save error:", error.message);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6 text-primary" />
            Horario de Atención
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure los días y horas en que atiende. Los slots de citas se generarán automáticamente.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {savedMsg ? "¡Guardado!" : "Guardar Horario"}
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr_1fr_1fr] text-xs font-bold uppercase text-muted-foreground px-4 py-3 border-b bg-muted/30">
          <span>Día</span>
          <span className="text-center px-4">Activo</span>
          <span>Hora Inicio</span>
          <span>Hora Fin</span>
          <span>Duración de Cita</span>
        </div>
        <div className="divide-y">
          {schedules.map((sched) => {
            const day = DAYS.find((d) => d.value === sched.day_of_week)!;
            return (
              <div
                key={sched.day_of_week}
                className={`grid grid-cols-[1fr_auto_1fr_1fr_1fr] items-center px-4 py-3 gap-4 transition-colors ${
                  !sched.is_active ? "opacity-40" : ""
                }`}
              >
                <span className="font-medium text-sm">{day.label}</span>

                <div className="flex justify-center px-4">
                  <button
                    role="switch"
                    aria-checked={sched.is_active}
                    onClick={() =>
                      handleChange(sched.day_of_week, "is_active", !sched.is_active)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      sched.is_active ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white transition-transform shadow ${
                        sched.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <input
                  type="time"
                  value={sched.start_time}
                  disabled={!sched.is_active}
                  step="60"
                  onChange={(e) =>
                    handleChange(sched.day_of_week, "start_time", e.target.value)
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <input
                  type="time"
                  value={sched.end_time}
                  disabled={!sched.is_active}
                  step="60"
                  onChange={(e) =>
                    handleChange(sched.day_of_week, "end_time", e.target.value)
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <select
                  value={sched.slot_duration}
                  disabled={!sched.is_active}
                  onChange={(e) =>
                    handleChange(
                      sched.day_of_week,
                      "slot_duration",
                      Number(e.target.value)
                    )
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {SLOT_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
