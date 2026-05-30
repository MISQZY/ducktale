import { Shield, Users, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { FEATURES, STATS } from "@/config/site";

// Icons are wired here — adding a feature just means adding to FEATURES in config
const FEATURE_ICONS: LucideIcon[] = [Shield, Users];
const STAT_ICONS: LucideIcon[] = [Flame, Users];

export default function AboutSection() {
  const features = FEATURES.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }));
  const stats = STATS.map((s, i) => ({ ...s, icon: STAT_ICONS[i] }));

  return (
    <section id="about" className="py-28 px-6 relative">
      {/* Decorative side text */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 text-gold-700/20 text-xs"
        style={{ fontFamily: "var(--font-display)", writingMode: "vertical-rl" }}
      >
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
              <h3
                className="text-amber-100/90 font-semibold mb-2.5 text-sm tracking-wider"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h3>
              <p className="text-amber-100/45 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
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
  );
}
