"use client";

import Reveal from "@/components/animations/Reveal";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleFeatureClick = () => {
    router.push("/dashboard");
  };

  return (
    <section
      id="features"
      className="py-20 md:py-32 w-full relative bg-background overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container px-4 mx-auto relative">
        <div className="text-center mb-20">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Powerful{" "}
              <span className="bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent">
                Features
              </span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to understand and analyze legal documents with
              confidence and clarity.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
         
          {features.length > 0 ? (
            features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative cursor-pointer bg-red-100 border-2 border-red-500"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={handleFeatureClick}
              >
              {/* Animated background glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl"></div>
              
              <div className="relative p-8 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 group-hover:border-secondary/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                {/* Icon with accent color */}
                <div className="mb-6 transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500">
                    <feature.icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-500" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-all duration-500 group-hover:transform group-hover:-translate-y-1">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground/80 transition-all duration-500">
                    {feature.description}
                  </p>

                  {/* Animated arrow indicator */}
                  <div
                    className={`flex items-center text-primary font-semibold transition-all duration-500 ${
                      hoveredIndex === index
                        ? "opacity-100 translate-x-2 translate-y-0"
                        : "opacity-0 translate-x-0 translate-y-2"
                    }`}
                  >
                    Explore feature
                    <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform duration-500 group-hover:translate-x-2" />
                  </div>
                </div>

                {/* Subtle border animation */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary p-[1px]">
                    <div className="w-full h-full rounded-2xl bg-background"></div>
                  </div>
                </div>
              </div>

              {/* Floating particles effect */}
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500"></div>
              <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-secondary/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-700 delay-200"></div>
            </div>
          ))
          ) : (
            <div className="text-center text-red-500">No features found</div>
          )}
        </div>
      </div>
    </section>
  );
}
