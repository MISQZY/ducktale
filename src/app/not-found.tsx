import Link from "next/link";

import "./globals.css";

export default function RootNotFound() {
  return (
    <html lang="ru">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>404</h1>
          <p style={{ opacity: 0.6 }}>
            Страница не найдена. <Link href="/" style={{ color: "inherit" }}>На главную</Link>
          </p>
        </div>
      </body>
    </html>
  );
}

