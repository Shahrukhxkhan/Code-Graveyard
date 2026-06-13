import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

const getSupabaseServerEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function createServerClient() {
  const cookieStore = cookies();
  const env = getSupabaseServerEnv()

  if (!env) {
    // Return a no-op chainable stub so all query builder calls resolve gracefully.
    // The try/catch blocks in pages will fall back to mock data on null results.
    const chainable: any = new Proxy({} as any, {
      get: (_target, prop) => {
        if (prop === "then") return undefined; // not a Promise itself
        return (..._args: any[]) => chainable;
      },
    });
    const queryBuilder = () => ({
      ...chainable,
      select: (..._args: any[]) => {
        const result = Promise.resolve({ data: null, count: null, error: null });
        // Make the promise chainable with query-builder methods
        return new Proxy(result as any, {
          get: (target, prop) => {
            if (prop in target) return typeof target[prop] === "function" ? target[prop].bind(target) : target[prop];
            // query builder chain methods (order, limit, eq, etc.)
            return (..._args: any[]) => new Proxy(result as any, {
              get: (t2, p2) => {
                if (p2 in t2) return typeof t2[p2] === "function" ? t2[p2].bind(t2) : t2[p2];
                return (..._a: any[]) => result;
              },
            });
          },
        });
      },
    });
    return {
      from: queryBuilder,
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any
  }

  return createSupabaseServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components can read cookies but may not always set them.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Server Components can read cookies but may not always set them.
          }
        },
      },
    },
  );
}

export async function getServerSession(): Promise<User | null> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
