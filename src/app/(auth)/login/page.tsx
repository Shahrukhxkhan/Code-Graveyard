"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Skull } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const hasAuthError = searchParams.get("error") === "true"
  const redirectedFrom = searchParams.get("redirectedFrom")

  const handleGithubSignIn = async () => {
    setLoading(true)

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    })

    if (error) {
      setLoading(false)
      window.location.href = "/login?error=true"
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center shadow-2xl shadow-black/30">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
            <Skull className="size-6 text-zinc-200" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Code Graveyard</h1>
          <p className="text-sm text-zinc-400">Where projects come to rest — and be reborn</p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
          onClick={handleGithubSignIn}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Continue with GitHub"}
        </Button>

        {hasAuthError ? (
          <p className="mt-3 text-sm text-red-400">
            Sign-in failed. Please try again.
          </p>
        ) : null}

        {redirectedFrom ? (
          <p className="mt-2 text-xs text-zinc-400">
            Please sign in to continue to <span className="font-mono">{redirectedFrom}</span>.
          </p>
        ) : null}

        <p className="mt-4 text-xs text-zinc-500">
          By signing in, you agree to share your failures with the world
        </p>
      </section>
    </main>
  )
}
