import Link from "next/link";

// Shared wrapper around all /docs/* pages
export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="pt-12">{children}</div>
    </div>
  );
}
