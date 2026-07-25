import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { TrustedBy } from "@/components/landing/trusted-by";
import { Features } from "@/components/landing/features";
import { DocumentShowcase } from "@/components/landing/document-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AIStudio } from "@/components/landing/ai-studio";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { CursorGlow } from "@/components/ui/cursor-glow";

export default function HomePage() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      <Hero />
      <TrustedBy />
      <Stats />
      <Features />
      <DocumentShowcase />
      <HowItWorks />
      <AIStudio />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
