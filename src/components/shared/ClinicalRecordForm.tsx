import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Save, Plus, FileText } from "lucide-react";
import { translateError } from "@/lib/error-translator";
import { useAuth } from "@/components/auth/AuthProvider";

interface ClinicalRecordFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClinicalRecordForm({ patientId, onClose, onSuccess }: ClinicalRecordFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPrescription, setShowPrescription] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const subjective = formData.get("subjective") as string;
    const objective = formData.get("objective") as string;
    const plan = formData.get("plan") as string;
    const prescription = showPrescription ? (formData.get("prescription") as string) : "";
    const internal_notes = formData.get("internal_notes") as string;
    const assessment_cie10 = formData.get("assessment_cie10") as string;

    if (!user) {
      setError("No hay sesión activa.");
      setLoading(false);
      return;
    }
    const doctor_id = user.id;

    const { error: submitError } = await supabase
      .from("clinical_history")
      .insert([{ 
        patient_id: patientId,
        doctor_id,
        subjective,
        objective,
        plan,
        prescription,
        internal_notes,
        assessment_cie10
      }]);

    if (submitError) {
      setError(translateError(submitError));
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  }

  return (
    <article className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-lg animate-in fade-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold flex items-center gap-2">
          <Save className="size-5 text-primary" />
          Nueva Nota de Evolución (SOAP)
        </h4>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded-full">
          <X className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="subjective" className="text-xs font-bold uppercase text-muted-foreground">Subjetivo (S) - Motivo de consulta / Síntomas</label>
            <textarea
              id="subjective"
              name="subjective"
              required
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
              placeholder="Paciente refiere dolor abdominal..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="objective" className="text-xs font-bold uppercase text-muted-foreground">Objetivo (O) - Signos vitales / Examen físico</label>
            <textarea
              id="objective"
              name="objective"
              required
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
              placeholder="TA: 120/80, FC: 72, T: 37C..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="internal_notes" className="text-xs font-bold uppercase text-muted-foreground">Análisis (A) - Diagnóstico sugerido / Notas internas</label>
            <textarea
              id="internal_notes"
              name="internal_notes"
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-inner italic"
              placeholder="Posible cuadro de apendicitis..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="plan" className="text-xs font-bold uppercase text-muted-foreground">Plan (P) - Indicaciones / Tratamiento</label>
            <textarea
              id="plan"
              name="plan"
              required
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-inner font-medium"
              placeholder="Reposo absoluto, hidratación..."
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            {!showPrescription ? (
              <button
                type="button"
                onClick={() => setShowPrescription(true)}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border-2 border-dashed border-primary/20 transition-all w-full justify-center"
              >
                <Plus className="size-4" />
                Emitir Receta Médica (Opcional)
              </button>
            ) : (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <label htmlFor="prescription" className="text-xs font-bold uppercase tracking-tight text-primary flex items-center gap-1.5">
                    <FileText className="size-3" />
                    Receta Médica / Prescripción
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPrescription(false)}
                    className="text-[10px] text-destructive hover:underline font-bold uppercase"
                  >
                    Quitar receta
                  </button>
                </div>
                <textarea
                  id="prescription"
                  name="prescription"
                  rows={4}
                  className="w-full rounded-md border-2 border-primary/10 bg-primary/5 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-inner font-mono"
                  placeholder="Ej: Paracetamol 500mg - 1 tableta cada 8 horas por 3 días..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="assessment_cie10" className="text-xs font-bold uppercase text-muted-foreground">Código CIE-10 (Diagnóstico Definitivo)</label>
          <input
            id="assessment_cie10"
            name="assessment_cie10"
            className="max-w-[150px] rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary font-mono"
            placeholder="Ej: K35.8"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:underline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all hover:scale-105"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Guardar Nota Médica
          </button>
        </div>
      </form>
    </article>
  );
}
