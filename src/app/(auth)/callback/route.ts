import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=true", url.origin))
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL("/login?error=true", url.origin))
    }

    return NextResponse.redirect(new URL("/", url.origin))
  } catch {
    return NextResponse.redirect(new URL("/login?error=true", url.origin))
  }
}
