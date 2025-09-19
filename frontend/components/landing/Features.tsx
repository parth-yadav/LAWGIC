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
  const isInView = useInView(sectionRef, { amount: 0.7 });
  const controls = useAnimation();
  const ringControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      // Stop ring rotation and move to positions
      ringControls.start({ rotate: 0, transition: { duration: 0.2 } });
      controls.start("moveToPosition").then(() => {
        setTimeout(() => {
          controls.start("expanded");
        }, 50); // 0.05 second delay
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
  }, [isInView, controls, ringControls]);

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
    
    // Card dimensions and spacing
    const cardWidth = 320;
    const cardHeight = 240;
    const gapX = 40;
    const gapY = 60;
    
    // Calculate positions relative to center (0,0)
    const totalWidth = (cardWidth * cols) + (gapX * (cols - 1));
    const totalHeight = (cardHeight * 2) + gapY; // 2 rows for 6 items
    
    // Start from negative half to center the grid around (0,0)
    const startX = -totalWidth / 2 + cardWidth / 2;
    const startY = -totalHeight / 2 + cardHeight / 2;
    
    return {
      x: startX + col * (cardWidth + gapX),
      y: startY + row * (cardHeight + gapY),
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
        left: -40, // Center for 80px circles
        top: -40,
        transition: { 
          duration: 0.2, 
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
        left: -40, // Still center for 80px circles
        top: -40,
        transition: { 
          duration: 0.2, 
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
        left: -160, // Center for 320px cards
        top: -120,  // Center for 240px cards
        transition: { 
          duration: 0.5, 
          ease: "easeInOut" as const,
          delay: index * 0.05
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
    moveToPosition: { 
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    },
    expanded: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay: 0.1 // Reduced delay since we already wait 0.2s
      }
    }
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
    moveToPosition: { 
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
      className="min-h-screen flex flex-col justify-center py-20 relative overflow-visible"
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
          {/* Rotating ring container */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={ringControls}
            style={{
              originX: 0.5,
              originY: 0.5,
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
                  zIndex: 10,
                }}
              >
              <div 
                className="relative cursor-pointer bg-background/90 backdrop-blur-sm border border-border/50 overflow-hidden"
                onClick={handleFeatureClick}
                style={{ width: "100%", height: "100%" }}
              >
                
                {/* Icon - always visible */}
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
                  variants={contentVariants}
                  animate={controls}
                >
                  <motion.div 
                    className="mb-4"
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

                    <div className="flex items-center text-primary font-semibold text-sm opacity-0">
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

        {/* Scroll indicator */}
        {/* {!isInView && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground animate-pulse">
              Scroll to explore features
            </p>
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full mx-auto mt-4 relative">
              <div className="w-1 h-3 bg-primary rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-bounce"></div>
            </div>
          </div>
        )} */}
      </div>
    </section>
  );
}