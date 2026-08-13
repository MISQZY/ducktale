import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/create-metadata";
import ScrollReveal from "@/components/common/ScrollReveal";
import dynamic from "next/dynamic";

const AboutSection = dynamic(() => import("@/components/AboutSection"));
const ServersSection = dynamic(() => import("@/components/ServersSection"));
const NetworkDiagram = dynamic(() => import("@/components/NetworkDiagram"));
const SocialSection = dynamic(() => import("@/components/SocialSection"));

export const generateMetadata = createMetadata({ namespace: "Home" });

export default function HomePage() {
  return (
    <>
      <Navbar />

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
