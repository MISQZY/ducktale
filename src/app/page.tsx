import Link from "next/link";
import Navbar from "@/components/Navbar";
import ServersSection from "@/components/ServersSection";
import SectionHeader from "@/components/SectionHeader";
import { PageBackground } from "@/components/common/PageBackground";
import { GoldDivider } from "@/components/common/GoldDivider";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CtaButton } from "@/components/common/CtaButton";
import { Shield, Users, ChevronDown } from "lucide-react";
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

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
          <PageBackground />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <StatusBadge label="Minecraft • Java Edition" pulse className="mb-8" />

            <h1
              className="text-6xl md:text-8xl mb-6 leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="shimmer-gold p-4">DuckTale</span>
            </h1>

            <p className="text-amber-100/40 max-w-xl mx-auto leading-relaxed mb-12">
              DuckTale — это сеть Minecraft серверов, объединяющая сервер выживания{" "}
              <Link href="/docs/duckburg" className="text-green-700 hover:text-emerald-600 transition-colors font-semibold">
                DuckBurg
              </Link>{" "}
              и сервер творчества{" "}
              <Link href="/docs/duckhood" className="text-sky-400 hover:text-sky-300 transition-colors font-semibold">
                DuckHood
              </Link>
              . Каждый найдёт здесь свой путь.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CtaButton href="/#servers" variant="primary">Выбрать сервер</CtaButton>
              <CtaButton href="/#about"   variant="outline">Узнать больше</CtaButton>
            </div>

            <div className="mt-20 flex justify-center text-amber-500/30 animate-bounce">
              <ChevronDown size={24} />
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 px-6">
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
                  className="w-full sm:w-[calc(50%-10px)] rounded-xl border border-amber-900/30 bg-duck-stone/50 p-6 hover:border-amber-700/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                    <Icon size={20} className="text-amber-400" />
                  </div>
                  <h3 className="text-amber-100 font-semibold mb-2 text-sm tracking-wide">{title}</h3>
                  <p className="text-amber-100/50 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="mt-8 grid grid-cols-2 divide-x divide-amber-900/30 rounded-2xl border border-amber-900/30 bg-duck-stone/30 overflow-hidden">
              {stats.map(({ n, label }) => (
                <div key={label} className="py-8 text-center">
                  <div
                    className="text-3xl text-amber-400 font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {n}
                  </div>
                  <div className="text-amber-100/40 text-xs tracking-wide uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVERS ── */}
        <ServersSection />

        {/* ── FOOTER ── */}
        <footer className="border-t border-amber-900/20 py-12 px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Logo />
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
