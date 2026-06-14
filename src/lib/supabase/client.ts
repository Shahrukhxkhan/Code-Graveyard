import { createBrowserClient } from "@supabase/ssr";

const getSupabaseBrowserEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

/** Returns a real Supabase client or a graceful no-op stub when env vars are absent. */
export function createClient() {
  const env = getSupabaseBrowserEnv();

  if (!env) {
    // No-op stub — mirrors the server.ts pattern so the app degrades gracefully
    // without crashing when Supabase is not yet configured.
    const noop = () => Promise.resolve({ data: null, error: null, count: null });
    const stub: any = new Proxy(
      {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          onAuthStateChange: (_event: any, _cb: any) => ({
            data: { subscription: { unsubscribe: () => {} } },
          }),
          signInWithOAuth: noop,
          signOut: noop,
          exchangeCodeForSession: noop,
        },
        from: () => stub,
        rpc: noop,
      },
      {
        get(target, prop) {
          if (prop in target) return (target as any)[prop];
          // Chain any unknown query-builder methods back to stub
          return (..._args: any[]) => stub;
        },
      },
    );
    return stub;
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
