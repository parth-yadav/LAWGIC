"use client";

import Reveal from "@/components/animations/Reveal";
import { CheckIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";

export default function About() {
  const benefits = [
    {
      text: "Save hours of reading complex legal documents",
      highlight: "Save hours",
    },
    {
      text: "Understand legal terms in plain English",
      highlight: "plain English",
    },
    {
      text: "Identify potential risks before signing",
      highlight: "potential risks",
    },
    {
      text: "Get AI-powered suggestions for better decisions",
      highlight: "AI-powered suggestions",
    },
    {
      text: "Download detailed analysis reports",
      highlight: "detailed reports",
    },
    {
      text: "Access legal help anytime, anywhere",
      highlight: "anytime, anywhere",
    },
  ];

  return (
    <section
      id="about"
      className="w-full flex flex-col justify-center py-20 relative"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-secondary/8 to-primary/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-secondary rounded-full animate-ping delay-500"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <Reveal type="bottomUp" duration={0.8}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 mb-6 hover:scale-105 transition-all duration-300">
                <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                Why Choose Our Solution?
              </div>
            </Reveal>

            <Reveal type="bottomUp" duration={0.8} delay={0.2}>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
                Legal Documents
                <span className="block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient-x bg-300%">
                  Made Simple
                </span>
              </h2>
            </Reveal>

            <Reveal type="bottomUp" duration={0.8} delay={0.4}>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transform complex legal jargon into{" "}
                <span className="text-primary font-semibold">clear insights</span>.
                No law degree required - just upload and understand.
              </p>
            </Reveal>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Reveal
                key={benefit.text}
                type="bottomUp"
                duration={0.6}
                delay={0.6 + index * 0.1}
              >
                <div className="group relative">
                  {/* Background card effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100"></div>

                  <div className="relative flex items-center space-x-4 p-6 rounded-2xl border border-transparent group-hover:border-primary/20 transition-all duration-500">
                    {/* Animated check icon */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                        <CheckIcon className="w-6 h-6 text-primary" />
                      </div>
                      {/* Pulse effect */}
                      <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-30"></div>
                    </div>

                    {/* Benefit text */}
                    <div className="flex-1">
                      <span className="text-foreground text-lg md:text-xl leading-relaxed group-hover:text-primary transition-colors duration-300 font-medium">
                        {benefit.text.split(benefit.highlight)[0]}
                        <span className="text-primary font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {benefit.highlight}
                        </span>
                        {benefit.text.split(benefit.highlight)[1]}
                      </span>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRightIcon className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bottom CTA hint */}
          <Reveal type="fadeIn" duration={1} delay={1.2}>
            <div className="text-center mt-16">
              <p className="text-muted-foreground text-lg">
                Ready to see it in action?{" "}
                <span className="text-primary font-semibold animate-pulse">
                  Scroll down to try our prototype
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
