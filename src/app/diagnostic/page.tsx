"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DiagnosticPage() {
  const { user, role, loading: authLoading, session } = useAuth();
  const [results, setResults] = useState<string[]>([]);

  const log = (msg: string) => {
    setResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    console.log(msg);
  };

  useEffect(() => {
    if (authLoading) {
      log("⏳ Auth still loading...");
      return;
    }

    if (!user) {
      log("❌ No user logged in");
      return;
    }

    log(`✅ Auth resolved — user: ${user.email}, id: ${user.id}, role: ${role}`);
    log(`✅ Session exists: ${!!session}`);

    async function runTests() {
      // Test 1: Simple profile query
      log("🔍 Test 1: Querying own profile...");
      const t1Start = Date.now();
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user!.id)
        .maybeSingle();
      log(`   ⏱️ ${Date.now() - t1Start}ms — ${profileErr ? `❌ Error: ${profileErr.message}` : `✅ Profile: ${JSON.stringify(profile)}`}`);

      // Test 2: Patients query
      log("🔍 Test 2: Querying patients with doctor_id filter...");
      const t2Start = Date.now();
      const { data: patients, error: patientsErr } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("doctor_id", user!.id)
        .limit(5);
      log(`   ⏱️ ${Date.now() - t2Start}ms — ${patientsErr ? `❌ Error: ${patientsErr.message}` : `✅ Patients: ${patients?.length} found — ${JSON.stringify(patients)}`}`);

      // Test 3: Doctor schedules
      log("🔍 Test 3: Querying doctor_schedules...");
      const t3Start = Date.now();
      const { data: schedules, error: schedErr } = await supabase
        .from("doctor_schedules" as any)
        .select("day_of_week, is_active, start_time, end_time")
        .eq("doctor_id", user!.id);
      log(`   ⏱️ ${Date.now() - t3Start}ms — ${schedErr ? `❌ Error: ${(schedErr as any).message}` : `✅ Schedules: ${(schedules as any)?.length} found`}`);

      // Test 4: Appointments query
      log("🔍 Test 4: Querying appointments...");
      const t4Start = Date.now();
      const { data: appts, error: apptErr } = await supabase
        .from("appointments")
        .select("id, start_time, status")
        .eq("doctor_id", user!.id)
        .limit(5);
      log(`   ⏱️ ${Date.now() - t4Start}ms — ${apptErr ? `❌ Error: ${apptErr.message}` : `✅ Appointments: ${appts?.length} found`}`);

      log("🏁 All tests complete.");
    }

    runTests();
  }, [user, role, authLoading, session]);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔧 Diagnostic Page</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page tests Supabase connectivity and RLS policies directly.
      </p>
      <div className="bg-card border rounded-lg p-4 font-mono text-xs space-y-1 max-h-[70vh] overflow-y-auto">
        {results.length === 0 && (
          <p className="text-muted-foreground animate-pulse">Running diagnostics...</p>
        )}
        {results.map((r, i) => (
          <p key={i} className={r.includes("❌") ? "text-red-400" : r.includes("✅") ? "text-green-400" : "text-foreground"}>
            {r}
          </p>
        ))}
      </div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
        className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium cursor-pointer"
      >
        Clear Storage & Redirect to Login
      </button>
    </main>
  );
}
