"use client";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/animations/Reveal";
import {
  ArrowRightIcon,
  ScaleIcon,
  CheckCircleIcon,
  ZapIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background w-full relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal type="bottomUp" duration={0.8}>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-secondary/20 text-primary border border-secondary/30 mb-6 hover:bg-secondary/30 hover:scale-105 transition-all duration-300">
              <ScaleIcon className="w-4 h-4 mr-2 animate-pulse" />
              Ready to Test Our Legal Document AI?
            </div>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
              Try Our Prototype
              <span className="block bg-gradient-to-r from-secondary via-primary to-foreground bg-clip-text text-transparent animate-gradient-x bg-300%">
                Today
              </span>
            </h2>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.4}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience{" "}
              <span className="text-secondary font-bold">
                our AI-powered prototype
              </span>{" "}
              that helps you understand legal documents. Get clear insights in{" "}
              <span className="text-secondary font-bold">
                minutes, not hours
              </span>
              .
            </p>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group text-lg px-8 py-6 rounded-full relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25"
                >
                  <span className="relative z-10 flex items-center">
                    Try Prototype
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="group text-lg px-8 py-6 rounded-full border-2 hover:border-secondary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-secondary/5 text-primary border-secondary"
              >
                <ZapIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                See How It Works
              </Button>
            </div>
          </Reveal>

          <Reveal type="fadeIn" duration={1} delay={0.8}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {[
                {
                  icon: CheckCircleIcon,
                  title: "Free Prototype",
                  subtitle: "No Account Required",
                },
                {
                  icon: ZapIcon,
                  title: "Instant Results",
                  subtitle: "Upload & Test AI Analysis",
                },
                {
                  icon: ShieldCheckIcon,
                  title: "Demo Environment",
                  subtitle: "Safe Testing Space",
                },
              ].map((feature) => (
                <div key={feature.title} className="group text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-2 group-hover:text-muted-foreground/80 transition-colors duration-300">
                    ✓ {feature.title}
                  </div>
                  <div className="font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">
                    {feature.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
