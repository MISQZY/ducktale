import Link from "next/link";
import Navbar from "@/components/Navbar";
import ServersSection from "@/components/ServersSection";
import SectionHeader from "@/components/SectionHeader";
import { PageBackground } from "@/components/common/PageBackground";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CtaButton } from "@/components/common/CtaButton";
import { Shield, Users, ChevronDown, Sword, Flame } from "lucide-react";
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
  { n: "2+", label: "года работы проекта", icon: Flame },
  { n: "1000+", label: "человек посетило проект", icon: Users },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
          <PageBackground />

          <div className="relative z-10 text-center max-w-4xl mx-auto">

            <div className="flex items-center justify-center gap-3 mb-8 fade-up">
              <div className="h-px w-16 bg-linear-to-r from-transparent to-gold-500/60" />
              <StatusBadge label="Minecraft • Java Edition" pulse />
              <div className="h-px w-16 bg-linear-to-l from-transparent to-gold-500/60" />
            </div>

            <h1
              className="text-7xl md:text-9xl mb-4 leading-none fade-up fade-up-1"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              <span className="px-4 shimmer-gold drop-shadow-[0_0_40px_rgba(212,160,23,0.3)]">
                DuckTale
              </span>
            </h1>

            <p
              className="text-gold-500/70 text-sm tracking-[0.35em] uppercase mb-6 fade-up fade-up-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ✦ Сеть серверов ✦
            </p>

            <div className="flex items-center justify-center gap-4 mb-8 fade-up fade-up-2">
              <div className="h-px flex-1 max-w-24 bg-linear-to-r from-transparent via-gold-600/50 to-gold-600/50" />
              <Sword size={14} className="text-gold-500/50 rotate-45" />
              <div className="h-px flex-1 max-w-24 bg-linear-to-l from-transparent via-gold-600/50 to-gold-600/50" />
            </div>

            <p className="text-amber-100/45 max-w-xl mx-auto leading-relaxed mb-12 text-lg fade-up fade-up-3"
               style={{ fontFamily: "var(--font-body)" }}>
              DuckTale — это сеть Minecraft серверов, объединяющая сервер выживания{" "}
              <Link href="/docs/duckburg" className="text-emerald-400/80 hover:text-emerald-300 transition-colors font-semibold border-b border-emerald-500/20 hover:border-emerald-400/40">
                DuckBurg
              </Link>{" "}
              и сервер творчества{" "}
              <Link href="/docs/duckhood" className="text-sky-400/80 hover:text-sky-300 transition-colors font-semibold border-b border-sky-500/20 hover:border-sky-400/40">
                DuckHood
              </Link>
              . Каждый найдёт здесь свой путь.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 fade-up fade-up-4">
              <CtaButton href="/#servers" variant="primary">Выбрать сервер</CtaButton>
              <CtaButton href="/#about"   variant="outline">Узнать больше</CtaButton>
            </div>

            <div className="flex justify-center text-gold-600/40 animate-bounce">
              <ChevronDown size={22} />
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-28 px-6 relative">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 text-gold-700/20 text-xs"
               style={{ fontFamily: "var(--font-display)", writingMode: "vertical-rl" }}>
            ✦ DUCKTALE ✦
          </div>

          <div className="max-w-5xl mx-auto">
            <SectionHeader
              label="О проекте"
              title="Что такое DuckTale?"
              description="DuckTale — это не просто Minecraft. Это сообщество людей, которые любят строить, исследовать и создавать. Мы работаем с 2024 года и за это время вырастили теплое и дружное комьюнити."
            />

            <div className="flex flex-wrap justify-center flex-row gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="corner-ornament w-full sm:w-[calc(50%-10px)] rounded-xl border border-gold-700/20 bg-stone-800/40 p-7 hover:border-gold-600/35 transition-all duration-300 group hover:bg-stone-800/60"
                >
                  <div className="w-11 h-11 rounded-lg bg-gold-500/8 border border-gold-500/20 flex items-center justify-center mb-5 group-hover:bg-gold-500/14 group-hover:border-gold-500/35 transition-all duration-300">
                    <Icon size={19} className="text-gold-400/80" />
                  </div>
                  <h3 className="text-amber-100/90 font-semibold mb-2.5 text-sm tracking-wider"
                      style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
                  <p className="text-amber-100/45 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 divide-x divide-gold-800/25 rounded-2xl border border-gold-800/20 bg-stone-900/50 overflow-hidden relative">
              <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold-600/30 to-transparent" />

              {stats.map(({ n, label, icon: Icon }) => (
                <div key={label} className="py-9 text-center group">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon size={14} className="text-gold-600/50 group-hover:text-gold-500/70 transition-colors" />
                    <div
                      className="text-4xl text-gold-400 font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {n}
                    </div>
                  </div>
                  <div className="text-amber-100/35 text-xs tracking-widest uppercase mt-1">{label}</div>
                </div>
              ))}

              <div className="absolute bottom-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold-600/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── SERVERS ── */}
        <ServersSection />

        {/* ── FOOTER ── */}
        <footer className="relative border-t border-gold-800/20 py-14 px-6 text-center overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-600/25 to-transparent" />

          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center mb-5">
              <Logo />
            </div>

            <div className="flex items-center justify-center gap-3 mb-5 text-gold-700/30 text-xs">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-gold-600/30" />
              <span>✦</span>
              <div className="h-px w-12 bg-linear-to-l from-transparent to-gold-600/30" />
            </div>

            <p className="text-amber-100/20 text-xs tracking-wide leading-relaxed">
              Существует с 2024 года. Не является официальным сервисом Minecraft.
              <br />
              <span className="opacity-60">Не одобрено и не связано с компанией Mojang, Microsoft</span>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
