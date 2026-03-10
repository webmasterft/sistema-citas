"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  Loader2,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  Clock,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { translateError } from "@/lib/error-translator";
import {
  createInstitutionAccount,
  updateInstitutionAccount,
} from "@/app/actions/institution-actions";

interface InstitutionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export function InstitutionForm({ onClose, onSuccess, initialData }: InstitutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Validar contraseñas
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      let authUserId = initialData?.auth_user_id;
      const email = formData.get("general_email") as string;
      const name = formData.get("name") as string;

      // Manejo de cuenta
      if (!initialData && password) {
        const authResult = await createInstitutionAccount(email, password, name);
        if (!authResult.success) throw new Error(authResult.error);
        authUserId = authResult.userId;
      } else if (initialData?.auth_user_id) {
        const updates: any = {};
        if (password) updates.password = password;
        if (email !== initialData.email) updates.email = email;
        if (name !== initialData.name) updates.name = name;

        if (Object.keys(updates).length > 0) {
          const authResult = await updateInstitutionAccount(initialData.auth_user_id, updates);
          if (!authResult.success) throw new Error(authResult.error);
        }
      }

      const payload = {
        name,
        institution_type: formData.get("type") as string,
        ruc: formData.get("ruc") as string,
        sanitary_license: formData.get("license") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        phone_alt: formData.get("phone_alt") as string,
        email,
        website: formData.get("website") as string,
        responsible_name: formData.get("resp_name") as string,
        responsible_position: formData.get("resp_position") as string,
        responsible_email: formData.get("resp_email") as string,
        responsible_phone: formData.get("resp_phone") as string,
        operating_hours: formData.get("hours") as string,
        num_professionals: parseInt(formData.get("professionals") as string) || null,
        timezone: formData.get("timezone") as string,
        preferred_language: formData.get("language") as string,
        auth_user_id: authUserId,
      };

      const query = supabase.from("institutions") as any;

      if (initialData?.id) {
        const { error: submitError } = await query.update(payload).eq("id", initialData.id);
        if (submitError) throw submitError;
      } else {
        const { error: submitError } = await query.insert([payload]);
        if (submitError) throw submitError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <article className="w-full max-w-4xl my-auto rounded-2xl bg-card p-8 shadow-2xl border border-primary/10 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">
              {initialData ? "Editar Institución" : "Nueva Institución Médica"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete todos los campos requeridos para habilitar la gestión institucional.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="size-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* 1. Información básica */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Building2 className="size-4" /> 1. Información Básica
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nombre de la Institución *</label>
                <input
                  name="name"
                  defaultValue={initialData?.name}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tipo *</label>
                  <select
                    name="type"
                    defaultValue={initialData?.institution_type || "Clinica"}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinica">Clínica</option>
                    <option value="Centro de salud">Centro de Salud</option>
                    <option value="Consultorio">Consultorio</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold font-mono">RUC / NIT *</label>
                  <input
                    name="ruc"
                    defaultValue={initialData?.ruc}
                    required
                    pattern="[0-9]{13}"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Licencia Sanitaria</label>
                <input
                  name="license"
                  defaultValue={initialData?.sanitary_license}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            {/* 2. Datos de contacto */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Phone className="size-4" /> 2. Contacto y Ubicación
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Dirección Física *</label>
                <input
                  name="address"
                  defaultValue={initialData?.address}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Teléfono Principal *</label>
                  <input
                    name="phone"
                    defaultValue={initialData?.phone}
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Teléfono Alt.</label>
                  <input
                    name="phone_alt"
                    defaultValue={initialData?.phone_alt}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email General *</label>
                <input
                  name="general_email"
                  type="email"
                  defaultValue={initialData?.email}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sitio Web</label>
                <input
                  name="website"
                  type="url"
                  defaultValue={initialData?.website}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            {/* 3. Información del responsable */}
            <div className="space-y-4 pt-4 border-t md:col-span-1">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <User className="size-4" /> 3. Responsable
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nombre Completo *</label>
                <input
                  name="resp_name"
                  defaultValue={initialData?.responsible_name}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Cargo</label>
                <input
                  name="resp_position"
                  defaultValue={initialData?.responsible_position}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email Resp. *</label>
                  <input
                    name="resp_email"
                    type="email"
                    defaultValue={initialData?.responsible_email}
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Móvil Resp.</label>
                  <input
                    name="resp_phone"
                    defaultValue={initialData?.responsible_phone}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Operación y Configuración */}
            <div className="space-y-4 pt-4 border-t md:col-span-1">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Clock className="size-4" /> 4. Operatividad
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Horario de Atención *</label>
                <input
                  name="hours"
                  defaultValue={initialData?.operating_hours}
                  required
                  placeholder="L-V 08:00-20:00, Sáb 08:00-14:00"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Zona Horaria *</label>
                  <select
                    name="timezone"
                    defaultValue={initialData?.timezone || "America/Guayaquil"}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="America/Guayaquil">Ecuador (Guayaquil)</option>
                    <option value="America/Bogota">Colombia (Bogotá)</option>
                    <option value="America/Lima">Perú (Lima)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Idioma *</label>
                  <select
                    name="language"
                    defaultValue={initialData?.preferred_language || "es"}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Num. Profesionales</label>
                <input
                  name="professionals"
                  type="number"
                  defaultValue={initialData?.num_professionals}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            {/* 5. Credenciales de acceso */}
            <div className="space-y-4 pt-6 border-t md:col-span-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Lock className="size-4" /> 5. Credenciales de Acceso
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Usuario (Email General)
                  </label>
                  <p className="text-xs p-2 bg-accent/50 rounded-lg italic">
                    Se usará el email general arriba indicado.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    {initialData ? "Nueva Contraseña" : "Contraseña *"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    required={!initialData}
                    minLength={6}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Confirmar Contraseña *</label>
                  <input
                    name="confirm_password"
                    type="password"
                    required={!initialData}
                    minLength={6}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 6. Aceptación de términos */}
            <div className="space-y-4 pt-6 border-t md:col-span-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="mt-1 size-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="size-4 text-primary" /> 6. Aceptación de Términos
                  </span>
                  Confirmo que acepto los términos y condiciones de uso del sistema MedApp, así como
                  las políticas de privacidad y manejo de datos clínicos sensibles conforme a la ley
                  vigente.
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20 animate-shake">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-xl border-2 text-sm font-bold hover:bg-accent transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {initialData ? "Guardar Cambios" : "Habilitar Institución"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
