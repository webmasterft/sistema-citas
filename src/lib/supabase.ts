import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// ── In-memory mutex to replace navigator.locks ──────────────────────────────
// navigator.locks causes "Lock broken by another request with the 'steal'
// option" errors in React/Next.js environments. This mutex serializes
// token refresh operations safely without the browser Locks API.
const locks = new Map<string, Promise<any>>();

async function inMemoryLock(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<any>
): Promise<any> {
  // 1. Wait for any existing lock with this name to resolve
  const existing = locks.get(name);
  if (existing) {
    try {
      // Use a race to ensure we don't wait forever for the previous lock
      await Promise.race([
        existing,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout waiting for lock: ${name}`)), 10000)
        ),
      ]);
    } catch (err) {
      console.warn(`AuthProvider: lock wait failed for "${name}":`, err instanceof Error ? err.message : err);
      // We continue anyway – better to try and fail than to hang forever
    }
  }

  // 2. Create our own lock promise
  // IMPORTANT: Execute the function first, THEN set the lock to avoid early deletion
  const executeWithTimeout = async () => {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Execution timeout in lock: ${name}`)), 15000)
        ),
      ]);
    } catch (err) {
      throw err;
    }
  };

  const lockPromise = executeWithTimeout();
  locks.set(name, lockPromise);

  try {
    return await lockPromise;
  } finally {
    // Only delete if it's still our promise
    if (locks.get(name) === lockPromise) {
      locks.delete(name);
    }
  }
}

export const supabase = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    storageKey: "medapp-auth-token",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    lock: inMemoryLock,
  },
});
