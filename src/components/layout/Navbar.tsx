"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, profile, loading, signIn, signOut } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const avatarSrc =
    profile?.avatar_url ??
    (user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : undefined);

  const avatarInitials = (
    profile?.username ??
    user?.email ??
    "CG"
  )
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl">🪦</span>
          <span className="ml-1 text-lg font-display font-semibold">Code Graveyard</span>
        </Link>

        {/* ── Desktop nav ──────────────────────────────────────────────────── */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
            Browse
          </Link>
          <Link href="/snippets" className="text-sm text-zinc-400 transition hover:text-white">
            Snippets
          </Link>
        </nav>

        {/* ── Desktop actions ───────────────────────────────────────────────── */}
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild className="bg-violet-600 text-white hover:bg-violet-500">
            <Link href="/project/new">+ Bury a Project</Link>
          </Button>

          {/* Auth state */}
          {loading ? (
            /* Skeleton while session is resolving */
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-700" />
          ) : user ? (
            /* Logged-in: avatar + dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <Avatar className="h-8 w-8 border border-zinc-700">
                  <AvatarImage src={avatarSrc} alt={profile?.username ?? "User"} />
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-900 text-white">
                {profile?.username && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/profile/${profile.username}`)}
                  >
                    My Graveyard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-400 focus:bg-zinc-800 focus:text-red-300"
                  onClick={() => signOut()}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged-out: Sign In button */
            <Button
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800"
              onClick={() => signIn()}
            >
              Sign In with GitHub
            </Button>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────────────────── */}
        <button
          className="rounded-md p-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <Link href="/" onClick={closeMenu} className="text-zinc-300 hover:text-white">
              Browse
            </Link>
            <Link
              href="/snippets"
              onClick={closeMenu}
              className="text-zinc-300 hover:text-white"
            >
              Snippets
            </Link>
            <Link
              href="/project/new"
              onClick={closeMenu}
              className="text-zinc-300 hover:text-white"
            >
              + Bury a Project
            </Link>

            {user && profile?.username && (
              <Link
                href={`/profile/${profile.username}`}
                onClick={closeMenu}
                className="text-zinc-300 hover:text-white"
              >
                My Graveyard
              </Link>
            )}

            <div className="border-t border-zinc-800 pt-2">
              {user ? (
                <button
                  className="text-left text-red-400 hover:text-red-300"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  className="text-left text-zinc-300 hover:text-white"
                  onClick={() => {
                    signIn();
                    closeMenu();
                  }}
                >
                  Sign In with GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
