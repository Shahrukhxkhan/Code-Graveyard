import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 text-sm sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-white">🪦 Code Graveyard</p>
          <p className="mt-2 text-zinc-400">
            A resting place for abandoned projects and the lessons they left behind.
          </p>
        </div>

        <div>
          <p className="mb-3 font-medium text-white">Explore</p>
          <div className="space-y-2 text-zinc-400">
            <Link href="/" className="block hover:text-white">
              Browse
            </Link>
            <Link href="/snippets" className="block hover:text-white">
              Snippets
            </Link>
            <Link href="/" className="block hover:text-white">
              Adoptable Projects
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-3 font-medium text-white">Contribute</p>
          <div className="space-y-2 text-zinc-400">
            <Link href="/project/new" className="block hover:text-white">
              Bury a Project
            </Link>
            <Link href="/snippets" className="block hover:text-white">
              Submit a Snippet
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-3 font-medium text-white">About</p>
          <div className="space-y-2 text-zinc-400">
            <Link href="/" className="block hover:text-white">
              How it works
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Built for developers who ship and learn</p>
          <p>© {new Date().getFullYear()} Code Graveyard</p>
        </div>
      </div>
    </footer>
  );
}
