import Link from "next/link";
import Navbar from "@/components/Navbar";
import Logo from "@/components/ui/Logo";
import { SERVERS } from "@/config/servers";
import { Home, ArrowRight } from "lucide-react";
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

          <GoldDivider className="mb-6" />

          <p className="text-amber-100/50 leading-relaxed mb-10 max-w-sm mx-auto">
            Такой страницы не существует. Возможно, ссылка устарела или была удалена.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <CtaButton href="/" variant="primary" icon={<Home size={16} />}>
              На главную
            </CtaButton>
            <CtaButton href="/#servers" variant="outline">
              Выбрать сервер
            </CtaButton>
          </div>

          {/* Quick server links */}
          <div className="rounded-2xl border border-amber-900/30 bg-duck-stone/30 overflow-hidden">
            <p className="text-amber-100/30 text-xs tracking-widest uppercase px-6 pt-5 pb-3">
              Или перейдите в документацию
            </p>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-amber-900/30">
              {SERVERS.map((server) => (
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
                      <div className="text-amber-100/30 text-xs">{server.tagline}</div>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"
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
