import Link from "next/link";
import Navbar from "@/components/Navbar";
import ServersSection from "@/components/ServersSection";
import { Shield, Users, Trophy, Zap, ChevronDown } from "lucide-react";
import Logo from "@/components/ui/Logo";

const features = [
  {
    icon: Shield,
    title: "Защита и стабильность",
    desc: "Выделенные серверы с защитой от DDoS, ежедневные бэкапы, аптайм 99.9%.",
  },
  {
    icon: Users,
    title: "Живое сообщество",
    desc: "Дружный Discord, регулярные ивенты, активные администраторы всегда на связи.",
  },
];

const stats = [
  { n: "2+", label: "года работы проекта" },
  { n: "1000+", label: "человек посетило проект" },
];

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};


export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
          {/* Background radial */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/3 left-1/3 w-100 h-100 bg-amber-600/3 rounded-full blur-2xl" />
          </div>

          {/* Decorative grid lines */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Minecraft • Java Edition
            </div>

            {/* Title */}
            <h1
              className="text-6xl md:text-8xl mb-6 leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="shimmer-gold p-4">DuckTale</span>
            </h1>

            {/* Subtitle */}
            <p className="text-amber-100/40 max-w-xl mx-auto leading-relaxed mb-12">
              DuckTale — это сеть Minecraft серверов, объединяющая сервер
              выживания{" "}
              <Link href="/docs/duckburg" className="text-green-700  hover:text-emerald-600 transition-colors font-semibold">
                DuckBurg
              </Link>{" "}
              и сервер творчества{" "}
              <Link href="/docs/duckhood" className="text-sky-400 hover:text-sky-300 transition-colors font-semibold">
                DuckHood
              </Link>
              . Каждый найдёт здесь свой путь.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/#servers"
                className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-duck-dark font-bold tracking-wide transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
              >
                Выбрать сервер
              </Link>
              <Link
                href="/#about"
                className="px-8 py-3.5 rounded-xl border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 transition-all"
              >
                Узнать больше
              </Link>
            </div>

            {/* Scroll hint */}
            <div className="mt-20 flex justify-center text-amber-500/30 animate-bounce">
              <ChevronDown size={24} />
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Label */}
            <div className="text-center mb-16">
              <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-3">
                О проекте
              </p>
              <h2
                className="text-4xl md:text-5xl text-amber-100 mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Что такое DuckTale?
              </h2>
              <div className="h-px w-24 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8" />
              <p className="text-amber-100/60 max-w-2xl mx-auto leading-relaxed text-lg">
                DuckTale — это не просто Minecraft. Это сообщество людей,
                которые любят строить, исследовать и создавать. Мы работаем с
                2024 года и за это время вырастили теплое и дружное комьюнити.
              </p>
            </div>

            {/* Features grid */}
            <div className="flex flex-wrap justify-center flex-row gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] rounded-xl border border-amber-900/30 bg-duck-stone/50 p-6 hover:border-amber-700/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                    <Icon size={20} className="text-amber-400" />
                  </div>
                  <h3 className="text-amber-100 font-semibold mb-2 text-sm tracking-wide">
                    {title}
                  </h3>
                  <p className="text-amber-100/50 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className={`mt-12 grid divide-x divide-amber-900/30 rounded-2xl border border-amber-900/30 bg-duck-stone/30 overflow-hidden ${colsMap[stats.length] ?? "grid-cols-3"}`}>
              {stats.map(({ n, label }) => (
                <div key={label} className="py-8 text-center">
                  <div
                    className="text-3xl text-amber-400 font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {n}
                  </div>
                  <div className="text-amber-100/40 text-xs tracking-wide uppercase">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVERS SECTION ── */}
        <ServersSection />

        {/* ── FOOTER ── */}
        <footer className="border-t border-amber-900/20 py-12 px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Logo/>
            </div>
            <p className="text-amber-100/20 text-xs">
              Существует с 2024 года. Не является официальным сервисом Minecraft. Не одобрено и не связано с компанией Mojang, Microsoft
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
