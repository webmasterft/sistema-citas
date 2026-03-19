import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// ── In-memory mutex to replace navigator.locks ──────────────────────────────
// navigator.locks causes "Lock broken by another request with the 'steal'
// option" errors in React/Next.js environments. This mutex serializes
// token refresh operations safely without the browser Locks API.
// A simpler, more robust lock implementation for React/Supabase
let activeLock: Promise<unknown> | null = null;

async function inMemoryLock<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  // We only care about the single 'auth' lock usually
  if (name !== "medapp-auth-token") return fn();

  // If there's an active lock, wait for it with a timeout
  if (activeLock) {
    try {
      await Promise.race([
        activeLock,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Lock acquisition timeout")), 20000))
      ]);
    } catch (err) {
      console.warn("Auth lock wait discarded:", err);
    }
  }

  // Define our task with an internal execution timeout
  const task = async (): Promise<R> => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Auth operation timeout for ${name}`)), 30000)
    );
    try {
      return await (Promise.race([fn(), timeoutPromise]) as Promise<R>);
    } finally {
      if (activeLock === currentLock) {
        activeLock = null;
      }
    }
  };

  const currentLock = task();
  activeLock = currentLock;
  return currentLock;
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
