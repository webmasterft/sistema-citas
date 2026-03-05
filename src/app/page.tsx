"use client";

import { useState, useEffect } from "react";
import { InstitutionManager } from "@/components/admin/InstitutionManager";
import { DoctorManager } from "@/components/admin/DoctorManager";
import { PatientManager } from "@/components/shared/PatientManager";
import { AppointmentManager } from "@/components/shared/AppointmentManager";
import { Building2, Stethoscope, Users, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";

export default function Home() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = role === "admin" || role === "webmaster";
  
  const tabParam = searchParams.get("tab") as "institutions" | "doctors" | "patients" | "appointments" | null;
  const [activeTab, setActiveTab] = useState<"institutions" | "doctors" | "patients" | "appointments">(
    tabParam || (isAdmin ? "institutions" : "patients")
  );

  // Sincronizar estado con la URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: "institutions" | "doctors" | "patients" | "appointments") => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

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
              <button
                onClick={() => handleTabChange("institutions")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "institutions" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="size-4" />
                Instituciones
              </button>
              <button
                onClick={() => handleTabChange("doctors")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "doctors" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="size-4" />
                Médicos
              </button>
            </>
          )}
          <button
            onClick={() => handleTabChange("patients")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "patients" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-4" />
            Pacientes
          </button>
          <button
            onClick={() => handleTabChange("appointments")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "appointments" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="size-4" />
            Citas
          </button>
        </nav>
      </header>

      {activeTab === "institutions" && isAdmin && <InstitutionManager />}
      {activeTab === "doctors" && isAdmin && <DoctorManager />}
      {activeTab === "patients" && <PatientManager />}
      {activeTab === "appointments" && <AppointmentManager />}
    </div>
  );
}
