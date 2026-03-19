"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  profile: Tables<"profiles"> | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // Prevent double-initialization in React Strict Mode / double renders
  const initialized = useRef(false);

  // ─── Single canonical auth effect ────────────────────────────────────────
  useEffect(() => {
    // Guard: only run once per mount
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    // Hard failsafe – prevents infinite spinner if Supabase is down
    const failsafe = setTimeout(() => {
      if (mounted) {
        console.warn("AuthProvider: failsafe – forcing loading=false");
        setLoading(false);
      }
    }, 8000);

    // Fetch profile from `profiles` table
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("AuthProvider fetchProfile error:", err);
        return null;
      }
    };

    // Apply a session to state (sets user, session and profile atomically)
    const applySession = async (s: Session | null) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        // Authoritative path: sync profile from DB
        const dbProfile = await fetchProfile(s.user.id);
        if (mounted) {
          setProfile(dbProfile);
          if (dbProfile?.role) setRole(dbProfile.role);
          else {
            // Fallback to metadata if DB role is missing
            const metaRole = s.user.user_metadata?.role as string | undefined;
            if (metaRole) setRole(metaRole);
          }
        }
      } else {
        setRole(null);
        setProfile(null);
      }
    };

    // 1. Bootstrap – get current session once
    supabase.auth.getSession().then(async ({ data: { session: initial } }) => {
      await applySession(initial);
      if (mounted) {
        setLoading(false);
        clearTimeout(failsafe);
      }
    });

    // 2. Listen for subsequent changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      await applySession(newSession);
      setLoading(false);
      clearTimeout(failsafe);
    });

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []); // ← empty deps: run only on mount

  // ─── Route protection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const isPublic = pathname === "/login";
    
    // Si no hay sesión y no estamos en login, ir a la página principal (Home) o Login
    // El usuario pidió mover al home page si se pierde la sesión.
    if (!session && !isPublic) {
      router.push("/"); // Cambiado de /login a / según pedido del usuario
    } else if (session && isPublic) {
      router.push("/");
    }
  }, [session, loading, pathname, router]);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      localStorage.removeItem("medapp-auth-token");
      // Use window.location for a hard reset to clear all state/cache safely
      window.location.href = "/login";
    } catch (err) {
      console.error("Error signing out:", err);
      window.location.href = "/login";
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setProfile(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
