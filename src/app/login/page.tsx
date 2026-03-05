"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { translateError } from "@/lib/error-translator";
import { Stethoscope, Loader2, Lock, User as UserIcon } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailInput = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Handle "webmasterft" shorthand as requested
    const email = emailInput === "webmasterft" ? "webmasterft@gmail.com" : emailInput;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(translateError(loginError));
      setLoading(false);
    }
    // AuthProvider will handle the redirect upon session change
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background selection:bg-primary/20">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-primary/5 border-r border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              MedApp <span className="text-primary">Ecuador</span>
            </h1>
          </div>
          
          <h2 className="text-4xl font-extrabold text-foreground mb-6 leading-tight">
            Gestión Médica de <br /> 
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600">
              Siguiente Generación
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12">
            La plataforma definitiva para médicos, clínicas y hospitales en Ecuador. 
            Seguridad cumpliendo normativas locales y diseño premium para su práctica diaria.
          </p>
          
          <div className="space-y-4">
            {["Historias Clínicas SOAP", "Facturación SRI", "Recetas Electrónicas"].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="lg:hidden flex flex-col items-center mb-12">
             <div className="p-4 bg-primary rounded-2xl shadow-lg shadow-primary/20 mb-4">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">MedApp Ecuador</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido</h2>
            <p className="text-muted-foreground">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    placeholder="webmasterft"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {loading ? "Iniciando sesión..." : "Acceder al Sistema"}
            </button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Al continuar, acepta nuestros{" "}
            <a className="underline underline-offset-4 hover:text-primary cursor-pointer" href="#">Términos de Servicio</a>{" "}
            y{" "}
            <a className="underline underline-offset-4 hover:text-primary cursor-pointer" href="#">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
