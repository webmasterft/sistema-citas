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
  List
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

  const fetchAppointments = useCallback(async () => {
    if (authLoading || !user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `)
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

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-muted/20 bg-muted/5"></div>);
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(app => app.start_time.startsWith(dateStr));
      const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), d).toDateString();

      days.push(
        <div key={d} className={cn(
          "h-32 border-b border-r border-muted/20 p-2 transition-colors hover:bg-accent/5 relative group",
          isToday && "bg-primary/5"
        )}>
          <span className={cn(
            "text-sm font-medium flex items-center justify-center size-7 rounded-full transition-colors",
            isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}>
            {d}
          </span>
          
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
            {dayAppointments.map(app => (
              <div 
                key={app.id} 
                className={cn(
                  "text-[10px] px-2 py-1 rounded border truncate cursor-pointer transition-all hover:scale-[1.02]",
                  app.status === 'confirmed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  app.status === 'cancelled' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}
                title={`${app.patients.first_name} - ${app.reason}`}
              >
                {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {app.patients.last_name}
              </div>
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
              viewMode === "calendar" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <CalendarDays className="size-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer",
              viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <List className="size-4" />
          </button>
        </div>

        <button 
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="size-4" />
          Nueva Cita
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {viewMode === "calendar" ? (
          <div>
            <div className="p-4 border-b flex items-center justify-between bg-muted/5">
              <h3 className="text-lg font-bold capitalize">{monthName} {year}</h3>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer">
                  <ChevronLeft className="size-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-xs font-bold hover:bg-accent rounded-md transition-colors cursor-pointer"
                >
                  Hoy
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer">
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 bg-muted/10">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase border-b border-r border-muted/20">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 border-l border-t border-muted/10">
              {renderCalendar()}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Cargando citas...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="size-12 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-bold">No hay citas programadas</h3>
                <p className="text-muted-foreground">Haga clic en 'Nueva Cita' para comenzar.</p>
              </div>
            ) : (
              appointments.map(app => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center",
                      app.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400" :
                      app.status === 'cancelled' ? "bg-destructive/10 text-destructive" :
                      "bg-amber-500/10 text-amber-400"
                    )}>
                      <User className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold">{app.patients.first_name} {app.patients.last_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {new Date(app.start_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      app.status === 'confirmed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      app.status === 'cancelled' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {app.status === 'confirmed' ? 'Confirmada' : 
                       app.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all cursor-pointer">
                      <MoreVertical className="size-4" />
                    </button>
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
