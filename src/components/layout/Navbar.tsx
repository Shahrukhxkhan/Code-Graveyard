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

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-lg">🪦</span>
          <span className="font-bold">Code Graveyard</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
            Browse
          </Link>
          <Link
            href="/snippets"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Snippets
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild className="bg-violet-600 text-white hover:bg-violet-500">
            <Link href="/project/new">+ Bury a Project</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <Avatar className="h-8 w-8 border border-zinc-700">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <AvatarFallback>CG</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-900 text-white">
              <DropdownMenuItem onClick={() => router.push("/profile/alex_codes")}>
                My Graveyard
              </DropdownMenuItem>
              <DropdownMenuItem>Saved Projects</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          className="rounded-md p-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-zinc-800 bg-zinc-950 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-zinc-300">
              Browse
            </Link>
            <Link
              href="/snippets"
              onClick={() => setMenuOpen(false)}
              className="text-zinc-300"
            >
              Snippets
            </Link>
            <Link
              href="/project/new"
              onClick={() => setMenuOpen(false)}
              className="text-zinc-300"
            >
              + Bury a Project
            </Link>
            <Link
              href="/profile/alex_codes"
              onClick={() => setMenuOpen(false)}
              className="text-zinc-300"
            >
              My Graveyard
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
