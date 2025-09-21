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
import useIsMobile from "@/hooks/useIsMobile";

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
  const isInView = useInView(sectionRef, { amount: 0.3, once: false });
  const controls = useAnimation();
  const ringControls = useAnimation();

  useEffect(() => {
    if (isMobile) {
      // On mobile, no ring animation needed - static layout
      return;
    }

    if (isInView) {
      // Stop ring rotation and move to positions
      ringControls.start({ rotate: 0, transition: { duration: 0.2 } });
      controls.start("moveToPosition").then(() => {
        setTimeout(() => {
          controls.start("expanded");
        }, 100);
      });
    } else {
      // Start ring rotation
      ringControls.start({ 
        rotate: 360, 
        transition: { 
          duration: 8, 
          ease: "linear", 
          repeat: Infinity 
        } 
      });
      controls.start("ring");
    }
  }, [isInView, controls, ringControls, isMobile]);

  const handleFeatureClick = () => {
    router.push("/dashboard");
  };

  // Calculate ring positions (circular formation)
  const getRingPosition = (index: number) => {
    const totalFeatures = features.length;
    const angle = (index / totalFeatures) * 2 * Math.PI - Math.PI / 2;
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
    
    const cardWidth = 320;
    const cardHeight = 240;
    const gapX = 40;
    const gapY = 60;
    
    const totalWidth = (cardWidth * cols) + (gapX * (cols - 1));
    const totalHeight = (cardHeight * 2) + gapY;
    
    const startX = -totalWidth / 2 + cardWidth / 2;
    const startY = -totalHeight / 2 + cardHeight / 2;
    
    return {
      x: startX + col * (cardWidth + gapX),
      y: startY + row * (cardHeight + gapY),
    };
  };

  // Feature item variants - synchronized animations
  const ballVariants = {
    ring: (index: number) => {
      const ringPos = getRingPosition(index);
      return {
        x: ringPos.x,
        y: ringPos.y,
        scale: 1,
        opacity: 1,
        borderRadius: "100%",
        width: 80,
        height: 80,
        left: -40,
        top: -40,
        transition: { 
          duration: 0.6, 
          ease: "easeInOut" as const,
          delay: index * 0.1
        }
      };
    },
    moveToPosition: (index: number) => {
      const gridPos = getGridPosition(index);
      return {
        x: gridPos.x,
        y: gridPos.y,
        scale: 1,
        opacity: 1,
        borderRadius: "50%",
        width: 80,
        height: 80,
        left: -40,
        top: -40,
        transition: { 
          duration: 0.6, 
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
        left: -160,
        top: -120,
        transition: { 
          duration: 0.6, 
          ease: "easeInOut" as const,
          delay: index * 0.05
        }
      };
    }
  };

  // Content variants - synchronized with card expansion
  const contentVariants = {
    ring: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    moveToPosition: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    expanded: (index: number) => ({ 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.6,
        delay: index * 0.05 + 0.3, // Wait for card to expand first
        ease: "easeOut"
      }
    })
  };

  const cardIconVariants = {
    ring: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    moveToPosition: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    expanded: (index: number) => ({ 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.4,
        delay: index * 0.05 + 0.4, // Appear after content starts
        ease: "easeOut"
      }
    })
  };

  // Icon variants - fade out when expanding
  const iconVariants = {
    ring: { 
      scale: 1.2,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    moveToPosition: { 
      scale: 1.2,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    expanded: { 
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2 } // Fade out quickly
    }
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="w-full py-20 relative bg-gradient-to-br from-background via-secondary/5 to-primary/5"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Powerful{" "}
              <span className="text-primary">
                Features
              </span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Everything you need to understand and analyze legal documents with
              confidence and clarity.
            </p>
          </Reveal>
        </div>

        {/* Features Container */}
        <div className="relative w-full min-h-[800px] flex items-center justify-center">
          {/* Rotating ring container */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={ringControls}
            style={{
              originX: 0.5,
              originY: 0.5,
              zIndex: 20,
            }}
          >
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
                  zIndex: 30 + index,
                }}
              >
                <div 
                  className="relative cursor-pointer bg-background/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 overflow-hidden"
                  onClick={handleFeatureClick}
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* Icon - visible in ring and moveToPosition states */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      variants={iconVariants}
                      animate={controls}
                      className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10"
                    >
                      <feature.icon className="text-primary h-8 w-8" />
                    </motion.div>
                  </div>

                  {/* Card content - only visible when expanded */}
                  <motion.div 
                    className="p-6 h-full flex flex-col justify-center"
                    custom={index}
                    variants={contentVariants}
                    animate={controls}
                  >
                    <motion.div 
                      className="mb-4"
                      custom={index}
                      variants={cardIconVariants}
                      animate={controls}
                    >
                      <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                        <feature.icon className="text-primary h-8 w-8" />
                      </div>
                    </motion.div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>

                      <div className="flex items-center text-primary font-semibold text-sm opacity-75 hover:opacity-100 transition-opacity duration-300">
                        Explore feature
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}