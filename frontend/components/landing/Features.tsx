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
import { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
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
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const isInView = useInView(sectionRef, { amount: 0.8 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("expanded");
    } else {
      controls.start("ring");
    }
  }, [isInView, controls]);

  const handleFeatureClick = () => {
    router.push("/dashboard");
  };

  // Calculate ring positions (circular formation)
  const getRingPosition = (index: number) => {
    const totalFeatures = features.length;
    const angle = (index / totalFeatures) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radius = 150;
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Calculate final grid positions
  const getGridPosition = (index: number) => {
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const containerWidth = 1000;
    const itemWidth = containerWidth / cols;
    const itemHeight = 280;
    
    return {
      x: (col - 1) * itemWidth,
      y: (row - 1) * itemHeight,
    };
  };

  // Feature item variants
  const ballVariants = {
    ring: (index: number) => {
      const ringPos = getRingPosition(index);
      return {
        x: ringPos.x,
        y: ringPos.y,
        scale: 1,
        opacity: 1,
        borderRadius: "50%",
        width: 80,
        height: 80,
        transition: { 
          duration: 0.8, 
          ease: "easeInOut" as const,
          delay: index * 0.1
        }
      };
    },
    expanded: (index: number) => {
      const gridPos = getGridPosition(index);
      return {
        x: gridPos.x,
        y: gridPos.y,
        scale: 1,
        opacity: 1,
        borderRadius: "16px",
        width: 320,
        height: 240,
        transition: { 
          duration: 0.8, 
          ease: "easeInOut" as const,
          delay: index * 0.15
        }
      };
    }
  };

  // Content variants for cards
  const contentVariants = {
    ring: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    expanded: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay: 0.8 // Wait for card animation to complete (0.8s)
      }
    }
  };

  const cardIconVariants = {
    ring: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    expanded: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay: 0.6 // Appear slightly before text
      }
    }
  };

  // Icon variants
    const iconVariants = {
    ring: { 
      scale: 1.2,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    expanded: { 
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center py-20 relative overflow-hidden"
    >
      <div className="">
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

        {/* Features Container */}
        <div className="relative w-full min-h-[800px] flex items-center justify-center">
          {/* Features as balls/cards */}
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="absolute"
              custom={index}
              variants={ballVariants}
              initial="ring"
              animate={controls}
              style={{
                originX: 0.5,
                originY: 0.5,
              }}
            >
              <div 
                className="relative group cursor-pointer bg-background/90 backdrop-blur-sm border border-border/50 overflow-hidden"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={handleFeatureClick}
                style={{ width: "100%", height: "100%" }}
              >
                {/* Gradient background for hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                
                {/* Icon - always visible */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    variants={iconVariants}
                    animate={controls}
                    className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500"
                  >
                    <feature.icon className="text-primary group-hover:text-secondary transition-colors duration-500 h-8 w-8" />
                  </motion.div>
                </div>

                 {/* Card content - only visible when expanded */}
                <motion.div 
                  className="p-6 h-full flex flex-col justify-center"
                  variants={contentVariants}
                  animate={controls}
                >
                  <motion.div 
                    className="mb-4"
                    variants={cardIconVariants}
                    animate={controls}
                  >
                    <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500">
                      <feature.icon className="text-primary group-hover:text-secondary transition-colors duration-500 h-8 w-8" />
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-all duration-500">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-all duration-500">
                      {feature.description}
                    </p>

                    <div
                      className={`flex items-center text-primary font-semibold text-sm transition-all duration-500 ${
                        hoveredIndex === index
                          ? "opacity-100 translate-x-2"
                          : "opacity-0 translate-x-0"
                      }`}
                    >
                      Explore feature
                      <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform duration-500 group-hover:translate-x-2" />
                    </div>
                  </div>
                </motion.div>
                {/* Hover decorations */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500"></div>
                <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-secondary/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-700 delay-200"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        {!isInView && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground animate-pulse">
              Scroll to explore features
            </p>
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full mx-auto mt-4 relative">
              <div className="w-1 h-3 bg-primary rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}