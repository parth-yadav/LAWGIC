"use client";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/animations/Reveal";
import { TextRevealCard } from "@/components/ui/text-reveal-card";
import { ArrowRightIcon, SparklesIcon, Cog } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-20 md:py-32 bg-background w-full">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <Reveal type="bottomUp" duration={0.8} once={true}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/20 text-foreground border border-primary/30">
                <Cog className="w-4 h-4 mr-2" />
                Made by byteUS
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/20 text-foreground border border-primary/30">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Powered by GEMINI
              </div>
            </div>
          </Reveal>

         <Reveal type="bottomUp" duration={0.8} delay={0.2} once={true}>
            <div className="flex justify-center mb-6">
              <TextRevealCard
                text="Complex legal jargon that nobody understands"
                revealText="Clear, simple explanations that anyone can grasp"
                className="w-full max-w-4xl scale-110"
                stayRevealed={true}
              />
            </div>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.4} once={true}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-8">
              Your Personal
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {" "}
                Legal Assistant
              </span>
            </h2>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.6} once={true}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full">
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full"
              >
                Learn More
              </Button>
            </div>
          </Reveal>

          {/* <Reveal type="fadeIn" duration={1} delay={0.8} once={true}>
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 blur-3xl rounded-full"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      95%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Risk Detection
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      5min
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Document Analysis
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      24/7
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal> */}
        </div>
      </div>
    </section>
  );
}