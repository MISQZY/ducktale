import Link from "next/link";
import Navbar from "@/components/Navbar";
import Logo from "@/components/ui/Logo";
import { SERVERS } from "@/config/servers";
import { Home, ArrowRight, Sword } from "lucide-react";
import { PageBackground } from "@/components/common/PageBackground";
import { GoldDivider } from "@/components/common/GoldDivider";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CtaButton } from "@/components/common/CtaButton";

export const metadata = {
  title: "Страница не найдена",
  description: "Эта страница не существует. Вернитесь на главную DuckTale.",
};

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
        <PageBackground />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <StatusBadge label="Страница не найдена" className="mb-8" />

          <div
            className="text-8xl md:text-9xl leading-none font-bold mb-2 select-none"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(180deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.08) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            aria-hidden="true"
          >
            404
          </div>

          <h1
            className="text-3xl md:text-5xl text-amber-100/90 mb-5 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Здесь пусто
          </h1>

          <GoldDivider wide className="mb-6" />

          <p className="text-amber-100/45 leading-relaxed mb-10 max-w-sm mx-auto">
            Такой страницы не существует. Возможно, ссылка устарела или была удалена.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <CtaButton href="/" variant="primary" icon={<Home size={15} />}>
              На главную
            </CtaButton>
            <CtaButton href="/#servers" variant="outline">
              Выбрать сервер
            </CtaButton>
          </div>

          <div className="rounded-2xl border border-gold-800/20 bg-stone-900/50 overflow-hidden relative">
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold-600/20 to-transparent" />
            <div className="flex items-center justify-center gap-2 px-6 pt-5 pb-3">
              <Sword size={11} className="text-gold-700/40 -rotate-45" />
              <p className="text-amber-100/30 text-xs tracking-[0.35em] uppercase">
                Или перейдите в документацию
              </p>
              <Sword size={11} className="text-gold-700/40 rotate-135" />
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gold-900/25">
              {SERVERS.map((server) => (
                <Link
                  key={server.id}
                  href={server.href}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gold-500/4 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/8 flex items-center justify-center text-lg
                                    group-hover:scale-105 transition-transform">
                      {server.emoji}
                    </div>
                    <div className="text-left">
                      <div
                        className="text-amber-100/80 text-sm font-medium"
                        style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem" }}
                      >
                        {server.name}
                      </div>
                      <div className="text-amber-100/30 text-xs">{server.tagline}</div>
                    </div>
                  </div>
                  <ArrowRight
                    size={13}
                    className="text-gold-600/40 group-hover:text-gold-400/70 group-hover:translate-x-1 transition-all"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Logo />
        </div>
      </main>
    </>
  );
}
