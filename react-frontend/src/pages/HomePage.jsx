import About from "@/components/landing/About";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";

export default function HomePage() {
  return (
    <div className="w-full space-y-16">
      <Hero />
      <Features />
      <About />
      <CTA />
    </div>
  );
}
