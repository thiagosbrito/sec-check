import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FAQSection from "@/components/FAQSection";
import { BackgroundGrid } from "@/components/BackgroundGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <BackgroundGrid />
      <Navbar />
      <main className="relative z-10 pt-16">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
    </div>
  );
}
