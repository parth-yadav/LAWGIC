import Reveal from "@/components/animations/Reveal";
import {
  BookOpenIcon, ShieldAlertIcon, LightbulbIcon,
  PenToolIcon, DownloadIcon, FileTextIcon, ArrowRightIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: BookOpenIcon, title: "Smart Complex Words Explainer", description: "Break down difficult legal terms into simple, everyday language that anyone can understand." },
  { icon: ShieldAlertIcon, title: "Potential Threat Analyzer", description: "Identify hidden risks, unfavorable clauses, and potential legal issues in your documents." },
  { icon: LightbulbIcon, title: "AI Suggestions", description: "Get intelligent recommendations for improvements and alternative approaches to clauses." },
  { icon: PenToolIcon, title: "Smart Annotations", description: "Highlight important sections with AI-powered notes and explanations for easy reference." },
  { icon: DownloadIcon, title: "Download Risk Reports", description: "Export detailed threat analysis reports to share with your team or legal advisors." },
  { icon: FileTextIcon, title: "Document Summaries", description: "Generate concise summaries of lengthy documents and download them for quick review." },
];

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(sectionRef, { amount: 0.9, once: false });
  const controls = useAnimation();
  const ringControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      ringControls.start({ rotate: 0, transition: { duration: 0.2 } });
      controls.start("moveToPosition").then(() => {
        setTimeout(() => { controls.start("expanded"); }, 100);
      });
    } else {
      ringControls.start({ rotate: 360, transition: { duration: 8, ease: "linear", repeat: Infinity } });
      controls.start("ring");
    }
  }, [isInView, controls, ringControls]);

  const handleFeatureClick = () => navigate("/dashboard");

  const getRingPosition = (index) => {
    const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 };
  };

  const getGridPosition = (index) => {
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cardWidth = 240, cardHeight = 180, gapX = 30, gapY = 40;
    const totalWidth = (cardWidth * cols) + (gapX * (cols - 1));
    const totalHeight = (cardHeight * 2) + gapY;
    return {
      x: -totalWidth / 2 + cardWidth / 2 + col * (cardWidth + gapX),
      y: -totalHeight / 2 + cardHeight / 2 + row * (cardHeight + gapY),
    };
  };

  const ballVariants = {
    ring: (index) => {
      const p = getRingPosition(index);
      return { x: p.x, y: p.y, scale: 1, opacity: 1, borderRadius: "100%", width: 60, height: 60, left: -30, top: -30, transition: { duration: 0.6, ease: "easeInOut", delay: index * 0.1 } };
    },
    moveToPosition: (index) => {
      const p = getGridPosition(index);
      return { x: p.x, y: p.y, scale: 1, opacity: 1, borderRadius: "50%", width: 60, height: 60, left: -30, top: -30, transition: { duration: 0.6, ease: "easeInOut", delay: index * 0.1 } };
    },
    expanded: (index) => {
      const p = getGridPosition(index);
      return { x: p.x, y: p.y, scale: 1, opacity: 1, borderRadius: "16px", width: 240, height: 180, left: -120, top: -90, transition: { duration: 0.6, ease: "easeInOut", delay: index * 0.05 } };
    },
  };

  const contentVariants = {
    ring: { opacity: 0, scale: 0, transition: { duration: 0.3 } },
    moveToPosition: { opacity: 0, scale: 0, transition: { duration: 0.3 } },
    expanded: (index) => ({ opacity: 1, scale: 1, transition: { duration: 0.6, delay: index * 0.05 + 0.3, ease: "easeOut" } }),
  };

  const cardIconVariants = {
    ring: { opacity: 0, scale: 0, transition: { duration: 0.3 } },
    moveToPosition: { opacity: 0, scale: 0, transition: { duration: 0.3 } },
    expanded: (index) => ({ opacity: 1, scale: 1, transition: { duration: 0.4, delay: index * 0.05 + 0.4, ease: "easeOut" } }),
  };

  const iconVariants = {
    ring: { scale: 1.2, opacity: 1, transition: { duration: 0.3 } },
    moveToPosition: { scale: 1.2, opacity: 1, transition: { duration: 0.3 } },
    expanded: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <section id="features" ref={sectionRef} className="w-full h-[80vh] relative bg-gradient-to-br from-background via-secondary/5 to-primary/5 flex flex-col">
      <div className="container mx-auto px-4 relative z-10 flex flex-col h-full">
        <div className="text-center mb-8 flex-shrink-0">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful <span className="text-primary">Features</span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Everything you need to understand and analyze legal documents with confidence and clarity.
            </p>
          </Reveal>
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center">
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={ringControls}
            style={{ originX: 0.5, originY: 0.5, zIndex: 20 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="absolute"
                custom={index}
                variants={ballVariants}
                initial="ring"
                animate={controls}
                style={{ originX: 0.5, originY: 0.5, zIndex: 30 + index }}
              >
                <div
                  className="relative cursor-pointer bg-background/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 overflow-hidden"
                  onClick={handleFeatureClick}
                  style={{ width: "100%", height: "100%" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div variants={iconVariants} animate={controls} className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                      <feature.icon className="text-primary h-6 w-6" />
                    </motion.div>
                  </div>
                  <motion.div className="p-4 h-full flex flex-col justify-center" custom={index} variants={contentVariants} animate={controls}>
                    <motion.div className="mb-3" custom={index} variants={cardIconVariants} animate={controls}>
                      <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                        <feature.icon className="text-primary h-6 w-6" />
                      </div>
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
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
