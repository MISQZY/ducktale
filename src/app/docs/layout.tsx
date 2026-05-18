import Link from "next/link";

// Shared wrapper around all /docs/* pages
export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Minimal docs top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="fixed top-1 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 backdrop-blur-md bg-duck-darker/80 border-b border-amber-900/20">
        <Link
          href="/"
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>🦆</span>
          <span>DuckTale</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-amber-100/50">
          <Link
            href="/docs/duckburg"
            className="hover:text-amber-300 transition-colors"
          >
            ⚔️ DuckBurg
          </Link>
          <Link
            href="/docs/duckhood"
            className="hover:text-sky-300 transition-colors"
          >
            🎨 DuckHood
          </Link>
        </div>
      </div>
      <div className="pt-12">{children}</div>
    </div>
  );
}
