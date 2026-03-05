"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
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

    // Fetch role from `profiles` table
    const fetchRole = async (userId: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw error;
        return data?.role ?? null;
      } catch (err) {
        console.error("AuthProvider fetchRole error:", err);
        return null;
      }
    };

    // Apply a session to state (sets user, session and role atomically)
    const applySession = async (s: Session | null) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        // Fast path: role in metadata (set at sign-up)
        const metaRole = s.user.user_metadata?.role as string | undefined;
        if (metaRole) setRole(metaRole);

        // Authoritative path: always sync from DB
        const dbRole = await fetchRole(s.user.id);
        if (mounted && dbRole) setRole(dbRole);
      } else {
        setRole(null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        await applySession(newSession);
        setLoading(false);
        clearTimeout(failsafe);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []); // ← empty deps: run only on mount

  // ─── Route protection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return; // wait until auth is resolved
    const isPublic = pathname === "/login";
    if (!session && !isPublic) router.push("/login");
    else if (session && isPublic) router.push("/");
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

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
