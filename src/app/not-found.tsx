import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-zinc-800/80 p-5 border border-zinc-700 mb-4">
        <span className="text-5xl">👻</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">404 - Tombstone Not Found</h1>

      <p className="max-w-md text-sm text-zinc-400 mb-6">
        The buried project, snippet, or page you are searching for does not exist in this sector of the graveyard.
      </p>

      <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white">
        <Link href="/">Back to Graveyard Home</Link>
      </Button>
    </div>
  );
}
