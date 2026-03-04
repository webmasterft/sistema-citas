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
      if (loading) {
        console.warn("AuthProvider: Failsafe triggered, forcing loading=false");
        setLoading(false);
      }
    }, 3000);

    // Get initial session
    const initAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;
      
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
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [loading]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (data) {
        setRole(data.role);
      }
    } catch (err) {
      console.error("AuthProvider Profile Error:", err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Basic route protection logic
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
