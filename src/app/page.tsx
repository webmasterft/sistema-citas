"use client";

import { useState, useEffect } from "react";
import { InstitutionManager } from "@/components/admin/InstitutionManager";
import { DoctorManager } from "@/components/admin/DoctorManager";
import { PatientManager } from "@/components/shared/PatientManager";
import { AppointmentManager } from "@/components/shared/AppointmentManager";
import { DoctorScheduleConfig } from "@/components/shared/DoctorScheduleConfig";
import { ProfileManager } from "@/components/shared/ProfileManager";
import { Building2, Stethoscope, Users, Clock, CalendarClock, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";

type TabId = "institutions" | "doctors" | "patients" | "appointments" | "schedule" | "configuracion";

export default function Home() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = role === "admin" || role === "webmaster";
  const isDoctor = role === "doctor";

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam || (isAdmin ? "institutions" : "patients")
  );

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  const tabClass = (tab: TabId) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer ${
      activeTab === tab
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-8">
      <header className="border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {isAdmin
            ? "Gestión centralizada de la red médica MedApp."
            : "Portal de Gestión de Pacientes."}
        </p>

        <nav className="flex flex-wrap gap-4 mt-6" aria-label="Tabs de navegación">
          {isAdmin && (
            <>
              <button onClick={() => handleTabChange("institutions")} className={tabClass("institutions")}>
                <Building2 className="size-4" />
                Instituciones
              </button>
              <button onClick={() => handleTabChange("doctors")} className={tabClass("doctors")}>
                <Stethoscope className="size-4" />
                Médicos
              </button>
            </>
          )}
          <button onClick={() => handleTabChange("patients")} className={tabClass("patients")}>
            <Users className="size-4" />
            Pacientes
          </button>
          <button onClick={() => handleTabChange("appointments")} className={tabClass("appointments")}>
            <Clock className="size-4" />
            Citas
          </button>
          {/* Only doctors can configure their own schedule */}
          {isDoctor && (
            <button onClick={() => handleTabChange("schedule")} className={tabClass("schedule")}>
              <CalendarClock className="size-4" />
              Mi Horario
            </button>
          )}
          <button onClick={() => handleTabChange("configuracion")} className={tabClass("configuracion")}>
            <Settings className="size-4" />
            Configuración
          </button>
        </nav>
      </header>

      {activeTab === "institutions" && isAdmin && <InstitutionManager />}
      {activeTab === "doctors" && isAdmin && <DoctorManager />}
      {activeTab === "patients" && <PatientManager />}
      {activeTab === "appointments" && <AppointmentManager />}
      {activeTab === "schedule" && isDoctor && <DoctorScheduleConfig />}
      {activeTab === "configuracion" && <ProfileManager />}
    </div>
  );
}
