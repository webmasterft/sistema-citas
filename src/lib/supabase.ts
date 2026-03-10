import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// ── In-memory mutex to replace navigator.locks ──────────────────────────────
// navigator.locks causes "Lock broken by another request with the 'steal'
// option" errors in React/Next.js environments. This mutex serializes
// token refresh operations safely without the browser Locks API.
const locks = new Map<string, Promise<any>>();

async function inMemoryLock(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<any>
): Promise<any> {
  // Wait for any existing lock with this name to resolve
  const existing = locks.get(name);
  if (existing) {
    try {
      await existing;
    } catch {
      // Ignore errors from previous lock holder
    }
  }

  // Create our own lock promise
  const lockPromise = fn();
  locks.set(name, lockPromise);

  try {
    return await lockPromise;
  } finally {
    // Only delete if it's still our promise (not replaced by another caller)
    if (locks.get(name) === lockPromise) {
      locks.delete(name);
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "medapp-auth-token",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    lock: inMemoryLock,
  },
});
