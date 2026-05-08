import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <p className="text-7xl">🪦</p>
      <h1 className="mt-4 text-3xl font-bold text-white">This grave doesn&apos;t exist.</h1>
      <p className="mt-3 max-w-xl text-zinc-400">
        Maybe it was never buried. Maybe it was dug up. Maybe it never shipped.
      </p>
      <Button asChild className="mt-6 bg-violet-600 hover:bg-violet-500">
        <Link href="/">Back to the Graveyard</Link>
      </Button>
    </div>
  );
}
