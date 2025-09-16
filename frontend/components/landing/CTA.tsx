"use client";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/animations/Reveal";
import { ArrowRightIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal type="bottomUp" duration={0.8}>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 mb-6">
              <ScaleIcon className="w-4 h-4 mr-2" />
              Ready to Understand Legal Documents?
            </div>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Start Analyzing Documents
              <span className="block text-primary">Today</span>
            </h2>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.4}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people who now understand their legal documents.
              Get clear insights in minutes, not hours.
            </p>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full">
                  Try It Free
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full"
              >
                See How It Works
              </Button>
            </div>
          </Reveal>

          <Reveal type="fadeIn" duration={1} delay={0.8}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  ✓ Free to Try
                </div>
                <div className="font-semibold">No Credit Card Required</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  ✓ Instant Results
                </div>
                <div className="font-semibold">Upload & Analyze</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  ✓ Secure & Private
                </div>
                <div className="font-semibold">Your Documents Stay Safe</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
