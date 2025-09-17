"use client";

import Reveal from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpenIcon,
  ShieldAlertIcon,
  LightbulbIcon,
  PenToolIcon,
  DownloadIcon,
  FileTextIcon,
  ArrowRightIcon,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: BookOpenIcon,
    title: "Smart Complex Words Explainer",
    description:
      "Break down difficult legal terms into simple, everyday language that anyone can understand.",
  },
  {
    icon: ShieldAlertIcon,
    title: "Potential Threat Analyzer",
    description:
      "Identify hidden risks, unfavorable clauses, and potential legal issues in your documents.",
  },
  {
    icon: LightbulbIcon,
    title: "AI Suggestions",
    description:
      "Get intelligent recommendations for improvements and alternative approaches to clauses.",
  },
  {
    icon: PenToolIcon,
    title: "Smart Annotations",
    description:
      "Highlight important sections with AI-powered notes and explanations for easy reference.",
  },
  {
    icon: DownloadIcon,
    title: "Download Risk Reports",
    description:
      "Export detailed threat analysis reports to share with your team or legal advisors.",
  },
  {
    icon: FileTextIcon,
    title: "Document Summaries",
    description:
      "Generate concise summaries of lengthy documents and download them for quick review.",
  },
];

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 md:py-32 w-full relative bg-[var(--color-scheme-light)] dark:bg-[var(--color-scheme-darkest)]">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--color-scheme-blue)]/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[var(--color-scheme-blue)]/5 rounded-full blur-2xl"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-16">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-scheme-darkest)] dark:text-white mb-4">
              Powerful{" "}
              <span className="bg-gradient-to-r from-[var(--color-scheme-blue)] to-[var(--color-scheme-dark-blue)] bg-clip-text text-transparent">
                Features
              </span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-[var(--color-scheme-darkest)]/70 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to understand and analyze legal documents with
              confidence and clarity.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Reveal
              key={feature.title}
              type="bottomUp"
              duration={0.6}
              delay={index * 0.1}
            >
              <Card 
                className="group h-full relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--color-scheme-blue)]/10 border-2 hover:border-[var(--color-scheme-blue)]/30 cursor-pointer bg-white dark:bg-black"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-scheme-light)] to-[var(--color-scheme-blue)] opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-scheme-blue)]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--color-scheme-dark-blue)] to-[var(--color-scheme-darkest)] text-white transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-[var(--color-scheme-darkest)] dark:text-white mb-3 group-hover:text-[var(--color-scheme-dark-blue)] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-[var(--color-scheme-darkest)]/60 dark:text-gray-400 leading-relaxed mb-4 group-hover:text-[var(--color-scheme-darkest)]/80 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Learn more link that appears on hover */}
                  <div className={`flex items-center text-[var(--color-scheme-dark-blue)] font-medium transition-all duration-300 ${hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    Learn more
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
