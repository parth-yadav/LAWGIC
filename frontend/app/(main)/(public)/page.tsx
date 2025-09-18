"use client";

import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <About />
      {/* <Contact /> */}
      <CTA />
    </>
  );
}
