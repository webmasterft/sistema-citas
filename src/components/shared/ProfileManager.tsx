"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { User, Camera, Loader2, CheckCircle2, AlertCircle, Save, Phone, MapPin, Briefcase, FileText, Calendar, Key } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DatePicker } from "@/components/ui/DatePicker";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ProfileManager() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    license_number: "",
    ruc: "",
    phone: "",
    address: "",
    bio: "",
    experience_years: 0,
    birth_date: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        specialty: profile.specialty || "",
        license_number: profile.license_number || "",
        ruc: profile.ruc || "",
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
        experience_years: profile.experience_years || 0,
        birth_date: profile.birth_date || "",
      });
    }
  }, [profile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);
      setMessage(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setMessage({ type: 'success', text: "Avatar actualizado correctamente." });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setMessage({ type: 'error', text: error.message || "Error al subir el avatar." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploadingSignature(true);
      setMessage(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-signature.${fileExt}`;
      const filePath = `signatures/${fileName}`;

      // Create bucket if it doesn't exist (this might fail if no permissions, but we try upsert)
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ signature_p12_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setMessage({ type: 'success', text: "Firma electrónica cargada correctamente." });
    } catch (error: any) {
      console.error("Error uploading signature:", error);
      setMessage({ type: 'error', text: "Error al subir la firma. Asegúrese de que el archivo es válido." });
    } finally {
      setUploadingSignature(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const updatePayload = {
      full_name: formData.full_name,
      specialty: formData.specialty,
      license_number: formData.license_number,
      ruc: formData.ruc,
      phone: formData.phone,
      address: formData.address,
      bio: formData.bio,
      experience_years: formData.experience_years,
      birth_date: formData.birth_date || null,
    };

    console.log("ProfileManager: Submitting update for user ID:", user.id, "Payload:", updatePayload);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updatePayload
        });

      if (error) {
        console.error("ProfileManager: Update error:", error);
        throw error;
      }

      console.log("ProfileManager: Update successful:", data);

      await refreshProfile();
      setMessage({ type: 'success', text: "Perfil actualizado correctamente." });
    } catch (error: any) {
      console.error("ProfileManager: Caught error in handleSubmit:", error);
      setMessage({ type: 'error', text: error.message || "Error al actualizar el perfil." });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-5xl mb-12">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Columna Izquierda: Avatar y Archivos */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-8 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="size-48 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-20 text-slate-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-primary/20">
                <Camera className="size-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-lg">{profile?.full_name || "Doctor"}</h3>
              <p className="text-primary text-sm font-semibold">{profile?.specialty || "Especialidad no definida"}</p>
            </div>

            <div className="w-full pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 text-center">Firma Electrónica (.p12)</p>
              <div className="relative">
                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer group",
                  profile?.signature_p12_url ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-primary/40"
                )}>
                  {uploadingSignature ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : profile?.signature_p12_url ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <Key className="size-5 text-slate-400 group-hover:text-primary transition-colors" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate">
                      {profile?.signature_p12_url ? "Firma Cargada" : "Subir Firma .p12"}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">Requerida para facturación</p>
                  </div>
                  <input type="file" className="hidden" accept=".p12" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario Detallado */}
        <div className="flex-1 w-full space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección 1: Datos Personales */}
            <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <User className="text-primary size-5" />
                Datos Personales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Fecha de Nacimiento</label>
                  <DatePicker
                    selected={formData.birth_date ? new Date(formData.birth_date + "T12:00:00") : null}
                    onChange={(date) => setFormData({ ...formData, birth_date: date ? date.toISOString().split('T')[0] : "" })}
                    placeholderText="Seleccione fecha"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">RUC / Identificación</label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Años de Experiencia</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Información Profesional */}
            <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Briefcase className="text-primary size-5" />
                Ficha Profesional
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Especialidad</label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Número de Licencia</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Biografía Profesional</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400 resize-none"
                    placeholder="Escriba una breve descripción de su trayectoria..."
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Contacto */}
            <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Phone className="text-primary size-5" />
                Contacto y Ubicación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Dirección de Consultorio</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-3",
                message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
                <p className="text-sm font-bold">{message.text}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full lg:w-auto bg-primary text-white font-bold py-4 px-12 rounded-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                {loading ? "Guardando cambios..." : "Guardar Perfil Completo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
