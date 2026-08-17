import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/create-metadata";
import ScrollReveal from "@/components/common/ScrollReveal";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const AboutSection = dynamic(() => import("@/components/AboutSection"), { 
  loading: () => <Skeleton className="w-full max-w-5xl mx-auto h-[400px] my-16 rounded-3xl opacity-20" /> 
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
