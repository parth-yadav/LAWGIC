"use client";

import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import { HeroScrollDemo } from "@/components/landing/Scrollpane";

export default function Home() {
  return (
    <div className="w-full space-y-16">
      <Hero />
      <Features />
      <About />
      {/* <Contact /> */}
        {/* <HeroScrollDemo /> */}
      <CTA />
    </div>
  );
}
