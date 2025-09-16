"use client";

import Reveal from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

export default function About() {
  const benefits = [
    "Save hours of reading complex legal documents",
    "Understand legal terms in plain English",
    "Identify potential risks before signing",
    "Get AI-powered suggestions for better decisions",
    "Download detailed analysis reports",
    "Access legal help anytime, anywhere",
  ];

  return (
    <section id="about" className="py-20 md:py-32 bg-secondary/10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal type="leftRight" duration={0.8}>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Why Choose Our
                <span className="block text-primary">Legal Assistant?</span>
              </h2>
            </Reveal>

            <Reveal type="leftRight" duration={0.8} delay={0.2}>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We make legal documents accessible to everyone. No law degree
                required - just upload your document and get clear, actionable
                insights in minutes.
              </p>
            </Reveal>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <Reveal
                  key={benefit}
                  type="leftRight"
                  duration={0.6}
                  delay={index * 0.1}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <Reveal type="rightLeft" duration={0.8} delay={0.4}>
              <Card className="p-8 shadow-2xl border-2">
                <CardContent className="p-0">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Making Legal Simple
                    </h3>
                    <p className="text-muted-foreground">
                      Helping thousands of people understand legal documents
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        50K+
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Documents Analyzed
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        98%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User Satisfaction
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        15+
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Document Types
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        4.8/5
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User Rating
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
