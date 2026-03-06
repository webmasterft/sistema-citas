import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { Plus, ClipboardList, Clock, User, X, Printer, Mail, FileText, Loader2 } from "lucide-react";
import { ClinicalRecordForm } from "./ClinicalRecordForm";

interface ClinicalRecordManagerProps {
  patient: Tables<"patients">;
  onClose: () => void;
}

export function ClinicalRecordManager({ patient, onClose }: ClinicalRecordManagerProps) {
  const [records, setRecords] = useState<Tables<"clinical_history">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showSlowNetwork, setShowSlowNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    physical_illnesses: patient.physical_illnesses || "",
    allergies: patient.allergies || "",
    family_history: patient.family_history || "",
    surgical_history: patient.surgical_history || "",
    medications: patient.medications || ""
  });
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (loading) {
      timer1 = setTimeout(() => setShowSlowNetwork(true), 4000);
      timer2 = setTimeout(() => {
        setLoading(false);
        console.warn("ClinicalRecordManager: Loading failsafe triggered.");
      }, 10000);
    } else {
      setShowSlowNetwork(false);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clinical_history")
        .select(`
          *,
          doctors_profile:profiles (
            full_name,
            specialty,
            license_number
          )
        `)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setRecords(data as any);
      } else if (error) {
        console.error("Supabase Error fetching clinical_history:", error);
        setError("Error al cargar el historial: " + error.message);
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("Error inesperado en la conexión.");
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handlePrint = (record: any) => {
    const printContent = document.getElementById(`print-prescription-${record.id}`);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receta Médica - ${patient.first_name} ${patient.last_name}</title>
          <style>
            ${styles}
            @media print {
              body { padding: 40px; }
              .no-print { display: none !important; }
            }
            .prescription-header { border-bottom: 2px solid #2e74ac; margin-bottom: 30px; padding-bottom: 20px; }
            .prescription-body { min-height: 300px; font-family: monospace; font-size: 16px; line-height: 1.6; border: 1px solid #eee; padding: 20px; }
            .prescription-footer { margin-top: 50px; border-top: 1px solid #eee; pt-10; text-align: center; }
            .signature-line { margin: 50px auto 10px; border-top: 1px solid #000; width: 250px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="prescription-header">
            <div style="display: flex; justify-between; align-items: start;">
              <div>
                <h1 style="color: #2e74ac; margin: 0; font-size: 24px;">RECETA MÉDICA</h1>
                <p style="margin: 5px 0; color: #666;">MedApp Ecuador - Gestión Clínica Digital</p>
              </div>
              <div style="text-align: right; color: #444; font-size: 12px;">
                <p style="margin: 0;"><strong>Fecha:</strong> ${new Date(record.created_at).toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Historia:</strong> ${patient.id_number}</p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #2e74ac; border-bottom: 1px solid #eee; margin-bottom: 10px; font-size: 14px;">DATOS DEL PACIENTE</h4>
              <p style="margin: 0;"><strong>Nombre:</strong> ${patient.first_name} ${patient.last_name}</p>
              <p style="margin: 0;"><strong>Edad:</strong> ${patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : '---'} años</p>
            </div>
            <div style="text-align: right;">
              <h4 style="color: #2e74ac; border-bottom: 1px solid #eee; margin-bottom: 10px; font-size: 14px;">DRA / DR</h4>
              <p style="margin: 0;"><strong>Profesional:</strong> ${record.doctors_profile?.full_name || 'Servicios Médicos'}</p>
              <p style="margin: 0;"><strong>Especialidad:</strong> ${record.doctors_profile?.specialty || 'General'}</p>
            </div>
          </div>

          <div class="prescription-body">
            <p style="font-weight: bold; margin-bottom: 15px; color: #2e74ac;">Rx / Prescripción:</p>
            <div style="white-space: pre-wrap;">${record.prescription}</div>
          </div>

          <div class="prescription-footer">
            <div class="signature-line"></div>
            <p style="margin: 0; font-weight: bold;">Firma y Sello</p>
            <p style="margin: 0; font-size: 11px; color: #888;">${record.doctors_profile?.license_number ? 'Reg. Prof: ' + record.doctors_profile.license_number : ''}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #aaa;">Documento emitido vía MedApp - Verificación: ${crypto.randomUUID().split('-')[0]}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveHistory = async () => {
    try {
      setIsSavingHistory(true);
      const { error: updateError } = await supabase
        .from("patients")
        .update(historyForm)
        .eq("id", patient.id);

      if (updateError) throw updateError;
      
      // Update local patient object (since it's passed from props, we just update the UI state)
      Object.assign(patient, historyForm);
      setIsEditingHistory(false);
    } catch (err: any) {
      console.error("Error saving history:", err);
      alert("Error al guardar antecedentes: " + err.message);
    } finally {
      setIsSavingHistory(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <section className="w-full max-w-4xl h-full bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-6 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h2>
              <p className="text-sm text-muted-foreground">ID: {patient.id_number} | Historia Clínica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="size-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Ficha de Antecedentes */}
          <div className="rounded-xl border border-primary/20 bg-muted/30 p-5 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <ClipboardList className="size-4" />
                Ficha de Antecedentes Médicos
              </h3>
              <div className="flex gap-2">
                {!isEditingHistory ? (
                  <button 
                    onClick={() => setIsEditingHistory(true)}
                    className="text-[10px] font-bold uppercase text-primary hover:underline bg-primary/10 px-2 py-1 rounded cursor-pointer"
                  >
                    Editar Antecedentes
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingHistory(false)}
                      className="text-[10px] font-bold uppercase text-muted-foreground hover:underline bg-muted px-2 py-1 rounded cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveHistory}
                      disabled={isSavingHistory}
                      className="text-[10px] font-bold uppercase text-white bg-primary hover:bg-primary/90 px-2 py-1 rounded cursor-pointer flex items-center gap-1"
                    >
                      {isSavingHistory && <Loader2 className="size-3 animate-spin" />}
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background border shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-1">Enfermedades Físicas / Crónicas</h4>
                  {isEditingHistory ? (
                    <textarea 
                      value={historyForm.physical_illnesses}
                      onChange={(e) => setHistoryForm({...historyForm, physical_illnesses: e.target.value})}
                      className="w-full text-sm rounded border bg-muted/20 p-2 focus:ring-1 focus:ring-primary outline-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-medium">{patient.physical_illnesses || "Ninguna registrada"}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-background border-l-4 border-l-destructive shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-destructive mb-1">Alergias</h4>
                  {isEditingHistory ? (
                    <textarea 
                      value={historyForm.allergies}
                      onChange={(e) => setHistoryForm({...historyForm, allergies: e.target.value})}
                      className="w-full text-sm rounded border bg-muted/20 p-2 focus:ring-1 focus:ring-primary outline-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-bold text-destructive">{patient.allergies || "Ninguna conocida"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background border shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-1">Antecedentes Familiares</h4>
                  {isEditingHistory ? (
                    <textarea 
                      value={historyForm.family_history}
                      onChange={(e) => setHistoryForm({...historyForm, family_history: e.target.value})}
                      className="w-full text-sm rounded border bg-muted/20 p-2 focus:ring-1 focus:ring-primary outline-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm">{patient.family_history || "No reportados"}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-background border shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-1">Antecedentes Quirúrgicos</h4>
                  {isEditingHistory ? (
                    <textarea 
                      value={historyForm.surgical_history}
                      onChange={(e) => setHistoryForm({...historyForm, surgical_history: e.target.value})}
                      className="w-full text-sm rounded border bg-muted/20 p-2 focus:ring-1 focus:ring-primary outline-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm">{patient.surgical_history || "No reportados"}</p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background border shadow-sm min-h-[120px]">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-1">Medicación Actual</h4>
                {isEditingHistory ? (
                  <textarea 
                    value={historyForm.medications}
                    onChange={(e) => setHistoryForm({...historyForm, medications: e.target.value})}
                    className="w-full text-sm rounded border bg-muted/20 p-2 focus:ring-1 focus:ring-primary outline-none h-[80px]"
                  />
                ) : (
                  <p className="text-sm italic">{patient.medications || "No consume medicación"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Evoluciones Médicas
            </h3>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="size-4" />
              Nueva Evolución (SOAP)
            </button>
          </div>

          {isFormOpen && (
            <ClinicalRecordForm 
              patientId={patient.id} 
              onClose={() => setIsFormOpen(false)} 
              onSuccess={fetchRecords} 
            />
          )}

          <div className="flex-1 overflow-y-auto p-6 bg-muted/10 space-y-6">
        {loading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4 shadow-md"></div>
            <p className="text-muted-foreground font-medium animate-pulse">Cargando historial clínico...</p>
            {showSlowNetwork && (
              <p className="mt-2 text-sm text-amber-500">La conexión está tardando más de lo esperado...</p>
            )}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 p-8 text-center bg-destructive/10">
            <p className="text-destructive font-medium">{error}</p>
            <button 
              onClick={() => { setError(null); fetchRecords(); }}
              className="mt-4 text-sm underline hover:no-underline"
            >
              Reintentar carga
            </button>
          </div>
        ) : records.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center bg-muted/20">
                <Clock className="mx-auto size-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay registros previos para este paciente.</p>
              </div>
            ) : (
              records.map((record: any) => (
                <article key={record.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock className="size-3" />
                      {new Date(record.created_at).toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
                    </div>
                    {record.assessment_cie10 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                        CIE-10: {record.assessment_cie10}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-black text-primary uppercase mb-1">Subjetivo (S)</h5>
                        <p className="text-sm leading-relaxed">{record.subjective || "---"}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-primary uppercase mb-1">Objetivo (O)</h5>
                        <p className="text-sm leading-relaxed">{record.objective || "---"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-black text-primary uppercase mb-1">Análisis (A)</h5>
                        <div className="text-sm italic text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-primary/50">
                          {record.internal_notes || "---"}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-primary uppercase mb-1">Plan (P)</h5>
                        <p className="text-sm leading-relaxed font-medium text-foreground">{record.plan || "---"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signos Vitales Summary */}
                  {(record.weight || record.height || record.temperature || record.blood_pressure_sys) && (
                    <div className="mt-6 flex flex-wrap gap-4 p-3 rounded-lg bg-muted/50 border border-muted-foreground/10">
                      {record.blood_pressure_sys && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Presión</p>
                          <p className="text-xs font-bold">{record.blood_pressure_sys}/{record.blood_pressure_dia}</p>
                        </div>
                      )}
                      {record.heart_rate && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">FC</p>
                          <p className="text-xs font-bold">{record.heart_rate} <span className="text-[10px] font-normal">bpm</span></p>
                        </div>
                      )}
                      {record.temperature && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Temp</p>
                          <p className="text-xs font-bold">{record.temperature}°C</p>
                        </div>
                      )}
                      {record.weight && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Peso</p>
                          <p className="text-xs font-bold">{record.weight}kg</p>
                        </div>
                      )}
                      {record.height && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Talla</p>
                          <p className="text-xs font-bold">{record.height}cm</p>
                        </div>
                      )}
                      {record.oxygen_saturation && (
                        <div className="text-center px-3 border-r border-muted-foreground/20 last:border-0">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">SpO2</p>
                          <p className="text-xs font-bold">{record.oxygen_saturation}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  {record.prescription && (
                    <div id={`print-prescription-${record.id}`} className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20 relative">
                      <div className="flex items-center justify-between mb-2 no-print">
                        <h5 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                          <FileText className="size-4" />
                          Receta / Prescripción Médica
                        </h5>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePrint(record);
                            }} 
                            className="p-1.5 hover:bg-primary/20 rounded text-primary transition-colors cursor-pointer"
                            title="Imprimir Receta"
                          >
                            <Printer className="size-4" />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-primary/20 rounded text-primary transition-colors cursor-pointer"
                            title="Enviar por Correo"
                            onClick={() => alert(`Funcionalidad en desarrollo: Enviando receta a ${patient.email || 'correo no registrado'}`)}
                          >
                            <Mail className="size-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-mono whitespace-pre-wrap">{record.prescription}</p>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
