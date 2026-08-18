import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/create-metadata";
import ScrollReveal from "@/components/common/ScrollReveal";
import { HeaderVines } from "@/components/common/HeaderVines";
import dynamic from "next/dynamic";

const AboutSection = dynamic(() => import("@/components/AboutSection"));
const ServersSection = dynamic(() => import("@/components/ServersSection"));
const NetworkDiagram = dynamic(() => import("@/components/NetworkDiagram"));
const SocialSection = dynamic(() => import("@/components/SocialSection"));

export const generateMetadata = createMetadata({ namespace: "Home" });

export default function HomePage() {
  return (
    <>
      {/* Outside <main> on purpose: the hero sets overflow-hidden for its
          background glows, which would shear the vines off flat at the top of
          the page — visible through the translucent navbar, and fully exposed
          during a rubber-band overscroll. See the HeaderVines file comment. */}
      <HeaderVines />

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
