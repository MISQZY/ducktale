import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServersSection from "@/components/ServersSection";
import NetworkDiagram from "@/components/NetworkDiagram";
import SocialSection from "@/components/SocialSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />
        <AboutSection />
        <ServersSection />
        <NetworkDiagram />
        <SocialSection />
      </main>

      <Footer />
    </>
  );
}
