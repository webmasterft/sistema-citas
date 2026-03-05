"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const initialized = React.useRef(false);

  useEffect(() => {
    // Failsafe to ensure loading screen doesn't stay forever
    const timeout = setTimeout(() => {
      // Usar un check interno para no depender de la variable 'loading' del estado que puede cambiar
      setLoading(prev => {
        if (prev) console.warn("AuthProvider: Failsafe triggered, forcing loading=false");
        return false;
      });
    }, 5000);

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error("AuthProvider Init Error:", err);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    initAuth();

    // Listen for auth changes - ALWAYS subscribe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Auth State Change Error:", err);
      } finally {
        // Asegurarse de que el loading se apague en cualquier cambio de estado
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // Solo al montar

  const fetchProfile = async (userId: string) => {
    try {
      // Usar .select().eq().maybeSingle() para evitar errores si no existe
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setRole(data.role);
      } else {
        console.warn("AuthProvider: No se encontró perfil para el usuario", userId);
        setRole(null);
      }
    } catch (err) {
      console.error("AuthProvider Profile Error:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Intentar obtener la sesión inicial sin forzar lock
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          const newUser = currentSession?.user ?? null;
          setUser(newUser);
          
          if (newUser) {
            if (newUser.user_metadata?.role) {
              setRole(newUser.user_metadata.role);
            }
            await fetchProfile(newUser.id);
          }
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      
      if (newUser) {
        // Primero intentamos sacar el rol de los metadatos del usuario (es más rápido y seguro)
        const metadataRole = newUser.user_metadata?.role;
        if (metadataRole) {
          setRole(metadataRole);
        }
        
        // Luego intentamos actualizar con los datos reales del perfil si hiciera falta
        await fetchProfile(newUser.id);
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Redirección basada en auth
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = pathname === "/login";
      if (!session && !isPublicRoute) {
        router.push("/login");
      } else if (session && isPublicRoute) {
        router.push("/");
      }
    }
  }, [session, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
