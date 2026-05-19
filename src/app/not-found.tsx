import Link from "next/link";
import Navbar from "@/components/Navbar";
import Logo from "@/components/ui/Logo";
import { SERVERS } from "@/config/servers";
import { Home, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Страница не найдена",
  description: "Эта страница не существует. Вернитесь на главную DuckTale.",
};

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-100 h-100 bg-amber-600/3 rounded-full blur-2xl" />
        </div>

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
            Страница не найдена
          </div>

          {/* 404 */}
          <div
            className="text-8xl md:text-9xl leading-none font-bold text-amber-500/20 mb-2 select-none"
            style={{ fontFamily: "var(--font-display)" }}
            aria-hidden="true"
          >
            404
          </div>
          <h1
            className="text-3xl md:text-5xl text-amber-100 mb-4 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Здесь пусто
          </h1>

          {/* Delimiter */}
          <div className="h-px w-24 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6" />

          {/* Descriptions */}
          <p className="text-amber-100/50 leading-relaxed mb-10 max-w-sm mx-auto">
            Такой страницы не существует. Возможно, ссылка устарела или была
            удалена.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-duck-dark font-bold tracking-wide transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
            >
              <Home size={16} />
              На главную
            </Link>
            <Link
              href="/#servers"
              className="px-8 py-3.5 rounded-xl border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 transition-all"
            >
              Выбрать сервер
            </Link>
          </div>

          {/* Easy links */}
          <div className="rounded-2xl border border-amber-900/30 bg-duck-stone/30 overflow-hidden">
            <p className="text-amber-100/30 text-xs tracking-widest uppercase px-6 pt-5 pb-3">
              Или перейдите в документацию
            </p>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-amber-900/30">
              {SERVERS.map((server) => {
                const Icon = server.icon;
                return (
                  <Link
                    key={server.id}
                    href={server.href}
                    className="flex items-center justify-between px-6 py-4 hover:bg-amber-500/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-lg">
                        {server.emoji}
                      </div>
                      <div className="text-left">
                        <div
                          className="text-amber-100 text-sm font-medium"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {server.name}
                        </div>
                        <div className="text-amber-100/30 text-xs">
                          {server.tagline}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Logo />
        </div>
      </main>
    </>
  );
}