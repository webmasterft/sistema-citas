"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { translateError } from "@/lib/error-translator";
import { X, Loader2, Stethoscope, Search, Check, ChevronDown, Lock, ShieldCheck, Camera, User } from "lucide-react";
import { MEDICAL_SPECIALTIES } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createDoctorAccount, updateDoctorAccount, upsertDoctorDirectory } from "@/app/actions/doctor-actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { DatePicker } from "@/components/ui/DatePicker";

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
  const [birthDate, setBirthDate] = useState<Date | null>(() => {
    if (initialData?.birth_date) {
      return new Date(initialData.birth_date + "T12:00:00");
    }
    return null;
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url || "");

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
    const birth_date_val = birthDate ? birthDate.toISOString().split("T")[0] : null;
    const license_number = formData.get("license_number") as string;
    const ruc = formData.get("ruc") as string;
    const institution_id = formData.get("institution_id") as string;

    try {
      let avatarUrl = initialData?.avatar_url;

      // 1. Subir avatar si hay uno nuevo
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      let authUserId = initialData?.auth_user_id;
      
      const doctorData = {
        fullName: full_name,
        avatarUrl,
        specialty: selectedSpecialty,
        licenseNumber: license_number,
        phone,
        address,
        birthDate: birth_date_val || undefined,
        experienceYears: experience_years,
        ruc,
        institutionId: institution_id || undefined,
        email
      };

      // Gestión de cuenta de usuario (Auth)
      if (!authUserId && (password || !initialData)) {
        // CREAR CUENTA
        const authResult = await createDoctorAccount(email, password, full_name, doctorData);
        if (!authResult.success) throw new Error(authResult.error || "Error al crear cuenta");
        authUserId = authResult.userId;
      } 
      else if (authUserId) {
        // ACTUALIZAR CUENTA
        const updates: any = { ...doctorData };
        if (password) updates.password = password;
        if (email !== initialData.email) updates.email = email;

        const authResult = await updateDoctorAccount(authUserId, updates);
        if (!authResult.success) throw new Error(authResult.error || "Error al actualizar cuenta");
      }

      const doctorPayload = { 
        full_name, 
        specialty: selectedSpecialty, 
        email,
        phone,
        address,
        experience_years,
        birth_date: birth_date_val,
        license_number, 
        ruc,
        institution_id: institution_id || null,
        auth_user_id: authUserId
      };

      console.log("DoctorForm: Submitting payload to doctors_directory via Server Action:", doctorPayload);
      
      const upsertResult = await upsertDoctorDirectory(initialData?.id || null, doctorPayload);
      
      if (!upsertResult.success) {
        throw new Error(upsertResult.error || "Error al guardar en el directorio médico");
      }
      
      console.log("DoctorForm: Upsert successful:", upsertResult.data);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("DoctorForm: Caught error in handleSubmit:", err);
      setError(err.message || translateError(err));
    } finally {
      setLoading(false);
    }
  }

  const existingNames = (initialData?.full_name || "").trim().split(/\s+/);
  let defaultFn1 = "", defaultFn2 = "", defaultLn1 = "", defaultLn2 = "";
  if (existingNames.length === 1) {
    defaultFn1 = existingNames[0] || "";
  } else if (existingNames.length === 2) {
    defaultFn1 = existingNames[0];
    defaultLn1 = existingNames[1];
  } else if (existingNames.length === 3) {
    defaultFn1 = existingNames[0];
    defaultLn1 = existingNames[1];
    defaultLn2 = existingNames[2];
  } else if (existingNames.length >= 4) {
    defaultFn1 = existingNames[0];
    defaultLn2 = existingNames[existingNames.length - 1];
    defaultLn1 = existingNames[existingNames.length - 2];
    defaultFn2 = existingNames.slice(1, existingNames.length - 2).join(" ");
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md">
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <article className="relative w-full max-w-2xl bg-card rounded-2xl p-8 shadow-2xl border border-primary/10 animate-in fade-in zoom-in duration-300">
        <button 
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="mb-8 pr-8">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="size-6 text-primary" />
            {initialData ? "Editar Médico" : "Nuevo Médico"}
          </h3>
          <p className="text-muted-foreground mt-1">
            Ingrese la información completa del profesional de la salud.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
              <div className="size-32 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-12 text-slate-300" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                <Camera className="size-4" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }} 
                />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Foto de Perfil (Opcional)</p>
          </div>
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
                      defaultValue={defaultFn1} 
                      required 
                      className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" 
                      placeholder="Ej: Fernando" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Segundo Nombre</label>
                    <input 
                      name="first_name_2" 
                      defaultValue={defaultFn2} 
                      className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" 
                      placeholder="Ej: Javier" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Apellido Paterno *</label>
                    <input 
                      name="last_name_1" 
                      defaultValue={defaultLn1} 
                      required 
                      className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" 
                      placeholder="Ej: Torres" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Apellido Materno</label>
                    <input 
                      name="last_name_2" 
                      defaultValue={defaultLn2} 
                      className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" 
                      placeholder="Ej: Espinosa" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Correo Electrónico (Usuario)</label>
                  <input name="email" type="email" defaultValue={initialData?.email} required className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" placeholder="doctor@medapp.ec" />
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
                    className="w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" 
                    placeholder={initialData ? "Dejar en blanco para no cambiar" : "Min. 6 caracteres"} 
                  />
                  <p className="text-[10px] text-slate-500 italic mt-1">
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
                      className="flex h-[42px] w-full items-center justify-between rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:bg-slate-100 transition-colors cursor-pointer text-slate-800"
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
                  <input name="license_number" defaultValue={initialData?.license_number} required className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400 font-mono" placeholder="REG-MSP-12345" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">RUC Personal / RISE</label>
                  <input name="ruc" defaultValue={initialData?.ruc} className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400 font-mono" placeholder="1712345678001" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Años de Experiencia</label>
                  <input name="experience_years" type="number" min="0" defaultValue={initialData?.experience_years} required className="w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" placeholder="Ej: 10" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Fecha de Nacimiento</label>
                  <DatePicker
                    selected={birthDate}
                    onChange={setBirthDate}
                    maxDate={new Date()}
                    placeholderText="Seleccione fecha"
                  />
                </div>
              </div>
            </div>

            {/* Contacto y Ubicación */}
            <div className="space-y-4 md:col-span-2 pt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">Contacto y Vinculación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Teléfono Celular</label>
                  <input name="phone" defaultValue={initialData?.phone} className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400" placeholder="099-XXX-XXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Institución Principal</label>
                  <select name="institution_id" defaultValue={initialData?.institution_id || ""} className="w-full h-[42px] rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer text-slate-800">
                    <option value="">Independiente / Ninguna</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold">Dirección Consultorio</label>
                  <textarea name="address" rows={2} defaultValue={initialData?.address} className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none text-slate-800 placeholder:text-slate-400" placeholder="Av. Principal N23..." />
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
                   defaultChecked={!!initialData}
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

          <div className="flex gap-4 pt-6 mt-8">
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
    </div>
  );
}
