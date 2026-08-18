import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/create-metadata";
import ScrollReveal from "@/components/common/ScrollReveal";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const AboutSection = dynamic(() => import("@/components/AboutSection"), { 
  loading: () => (
    <section className="py-16 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <Skeleton className="h-5 w-24 mb-6 rounded-full opacity-30" />
          <Skeleton className="h-12 w-64 mb-6 rounded-lg opacity-30" />
          <Skeleton className="h-5 w-96 max-w-full rounded-md opacity-30" />
        </div>
        <div className="flex flex-wrap justify-center flex-row gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full sm:w-[calc(33%-15px)] h-[212px] rounded-xl opacity-20" />
          ))}
        </div>
      </div>
    </section>
  )
});
const ServersSection = dynamic(() => import("@/components/ServersSection"), {
  loading: () => <Skeleton className="w-full max-w-5xl mx-auto h-[500px] my-16 rounded-3xl opacity-20" />
});
const NetworkDiagram = dynamic(() => import("@/components/NetworkDiagram"), {
  loading: () => <Skeleton className="w-full max-w-5xl mx-auto h-[600px] my-16 rounded-3xl opacity-20" />
});
const SocialSection = dynamic(() => import("@/components/SocialSection"), {
  loading: () => <Skeleton className="w-full max-w-5xl mx-auto h-[300px] my-16 rounded-3xl opacity-20" />
});

export const generateMetadata = createMetadata({ namespace: "Home", useDefaultTitle: true });

export default function HomePage() {
  return (
    <>
      <main>
        <HeroSection />
        
        <ScrollReveal>
          <AboutSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <ServersSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <SocialSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <NetworkDiagram />
        </ScrollReveal>
      </main>

      <Footer />
    </>
  );
}
