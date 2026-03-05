"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { translateError } from "@/lib/error-translator";
import { X, Loader2, Stethoscope, Search, Check, ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { MEDICAL_SPECIALTIES } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createDoctorAccount, updateDoctorAccount } from "@/app/actions/doctor-actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoctorFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export function DoctorForm({ onClose, onSuccess, initialData }: DoctorFormProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSpecialtyOpen, setIsSpecialtyOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialData?.specialty || "");

  const filteredSpecialties = MEDICAL_SPECIALTIES.filter((s: string) => 
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  useEffect(() => {
    async function fetchInstitutions() {
      const { data } = await supabase.from("institutions").select("id, name");
      if (data) setInstitutions(data);
    }
    fetchInstitutions();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName1 = formData.get("first_name_1") as string;
    const firstName2 = formData.get("first_name_2") as string;
    const lastName1 = formData.get("last_name_1") as string;
    const lastName2 = formData.get("last_name_2") as string;

    const full_name = `${firstName1} ${firstName2} ${lastName1} ${lastName2}`.replace(/\s+/g, ' ').trim();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const experience_years = parseInt(formData.get("experience_years") as string);
    const birth_date = formData.get("birth_date") as string;
    const license_number = formData.get("license_number") as string;
    const institution_id = formData.get("institution_id") as string;

    try {
      let authUserId = initialData?.auth_user_id;

      // Gestión de cuenta de usuario (Auth)
      if (!authUserId && password) {
        // Si no tiene cuenta (nuevo o error previo) y hay contraseña -> Crear
        const authResult = await createDoctorAccount(email, password, full_name);
        if (!authResult.success) throw new Error(authResult.error || "Error al crear cuenta");
        authUserId = authResult.userId;
      } 
      else if (authUserId) {
        // Si ya tiene cuenta, verificar si hay cambios que requieran actualización
        const updates: any = {};
        if (password) updates.password = password;
        if (email !== initialData.email) updates.email = email;
        if (full_name !== initialData.full_name) updates.fullName = full_name;

        if (Object.keys(updates).length > 0) {
          const authResult = await updateDoctorAccount(authUserId, updates);
          if (!authResult.success) throw new Error(authResult.error || "Error al actualizar cuenta");
        }
      }

      const doctorPayload = { 
        full_name, 
        specialty: selectedSpecialty, 
        email,
        phone,
        address,
        experience_years,
        birth_date,
        license_number, 
        institution_id: institution_id || null,
        auth_user_id: authUserId
      };

      const query = supabase.from("doctors_directory" as any);
      
      if (initialData?.id) {
        const { error: submitError } = await (query
          .update(doctorPayload)
          .eq("id", initialData.id) as any);
        if (submitError) throw submitError;
      } else {
        const { error: submitError } = await (query.insert([doctorPayload]) as any);
        if (submitError) throw submitError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <article className="w-full max-w-2xl my-8 rounded-2xl bg-card p-8 shadow-2xl border border-primary/10 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">
              {initialData ? "Editar Profesional" : "Registro de Profesional Médico"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {initialData ? "Actualice los datos del profesional sanitario." : "Complete la ficha técnica para habilitar el acceso al sistema."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="size-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Primer Nombre *</label>
                    <input 
                      name="first_name_1" 
                      defaultValue={initialData?.full_name?.split(" ")[0]} 
                      required 
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Ej: Fernando" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Segundo Nombre</label>
                    <input 
                      name="first_name_2" 
                      defaultValue={initialData?.full_name?.split(" ")[1]} 
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Ej: Javier" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Apellido Paterno *</label>
                    <input 
                      name="last_name_1" 
                      defaultValue={initialData?.full_name?.split(" ")[2]} 
                      required 
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Ej: Torres" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Apellido Materno</label>
                    <input 
                      name="last_name_2" 
                      defaultValue={initialData?.full_name?.split(" ").slice(3).join(" ")} 
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Ej: Espinosa" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Correo Electrónico (Usuario)</label>
                  <input name="email" type="email" defaultValue={initialData?.email} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="doctor@medapp.ec" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <Lock className="size-3.5 text-primary" />
                    {initialData ? "Nueva Contraseña (Opcional)" : "Contraseña Temporal"}
                  </label>
                  <input 
                    name="password" 
                    type="password" 
                    required={!initialData} 
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    placeholder={initialData ? "Dejar en blanco para no cambiar" : "Min. 6 caracteres"} 
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    {initialData 
                      ? "Use este campo solo si desea cambiar la clave del médico." 
                      : "Esta será la clave inicial para que el médico acceda al sistema."}
                  </p>
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div className="space-y-4 md:col-span-2 pt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">Ficha Profesional</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold">Especialidad Primaria</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSpecialtyOpen(!isSpecialtyOpen)}
                      className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 hover:bg-accent/50 transition-all outline-none cursor-pointer"
                    >
                      <span className={selectedSpecialty ? "text-foreground" : "text-muted-foreground text-xs"}>
                        {selectedSpecialty || "Seleccione..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>

                    {isSpecialtyOpen && (
                      <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center border-b px-3 py-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                          <input
                            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Buscar especialidad..."
                            value={specialtySearch}
                            onChange={(e) => setSpecialtySearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
                          {filteredSpecialties.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">No hay resultados.</div>
                          ) : (
                            filteredSpecialties.map((specialty) => (
                              <button
                                key={specialty}
                                type="button"
                                onClick={() => {
                                  setSelectedSpecialty(specialty);
                                  setIsSpecialtyOpen(false);
                                  setSpecialtySearch("");
                                }}
                                className="relative flex w-full items-center rounded-md px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-primary", selectedSpecialty === specialty ? "opacity-100" : "opacity-0")} />
                                {specialty}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Número de Licencia / MSP</label>
                  <input name="license_number" defaultValue={initialData?.license_number} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono" placeholder="REG-MSP-12345" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Años de Experiencia</label>
                  <input name="experience_years" type="number" min="0" defaultValue={initialData?.experience_years} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ej: 10" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Fecha de Nacimiento</label>
                  <input name="birth_date" type="date" defaultValue={initialData?.birth_date} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Contacto y Ubicación */}
            <div className="space-y-4 md:col-span-2 pt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">Contacto y Vinculación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Teléfono Celular</label>
                  <input name="phone" defaultValue={initialData?.phone} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="099-XXX-XXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Institución Principal</label>
                  <select name="institution_id" defaultValue={initialData?.institution_id || ""} className="w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                    <option value="">Independiente / Ninguna</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold">Dirección Consultorio</label>
                  <textarea name="address" rows={2} defaultValue={initialData?.address} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Av. Principal N23..." />
                </div>
              </div>
            </div>

            {/* 6. Aceptación de términos */}
            <div className="space-y-4 pt-6 border-t md:col-span-2">
               <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                 <input 
                   id="doc-terms" 
                   name="terms" 
                   type="checkbox" 
                   required 
                   className="mt-1 size-4 rounded border-primary text-primary focus:ring-primary cursor-pointer" 
                 />
                 <label htmlFor="doc-terms" className="text-sm leading-tight cursor-pointer">
                   <span className="font-bold flex items-center gap-1.5 mb-1"><ShieldCheck className="size-4 text-primary" /> Aceptación de Términos</span>
                   Certifico que la información proporcionada es veraz y acepto los términos de uso del sistema MedApp para la gestión de pacientes y datos clínicos.
                 </label>
               </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-shake">
              <X className="size-4" />
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 py-3 text-sm font-bold hover:bg-accent transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {initialData ? "Guardar Cambios" : "Habilitar Profesional"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
