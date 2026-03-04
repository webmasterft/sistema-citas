"use client";

import { useState } from "react";
import { InstitutionManager } from "@/components/admin/InstitutionManager";
import { DoctorManager } from "@/components/admin/DoctorManager";
import { PatientManager } from "@/components/shared/PatientManager";
import { Building2, Stethoscope, Users } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"institutions" | "doctors" | "patients">("institutions");

  return (
    <div className="space-y-8">
      <header className="border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Gestión centralizada de la red médica MedApp.
        </p>
        
        <nav className="flex flex-wrap gap-4 mt-6" aria-label="Tabs de navegación">
          <button
            onClick={() => setActiveTab("institutions")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === "institutions" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            Instituciones
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === "doctors" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Stethoscope className="size-4" />
            Médicos
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === "patients" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-4" />
            Pacientes
          </button>
        </nav>
      </header>

      {activeTab === "institutions" && <InstitutionManager />}
      {activeTab === "doctors" && <DoctorManager />}
      {activeTab === "patients" && <PatientManager />}
    </div>
  );
}
