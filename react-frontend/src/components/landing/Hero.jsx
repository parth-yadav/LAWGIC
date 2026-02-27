import { Button } from "@/components/ui/button";
import Reveal from "@/components/animations/Reveal";
import { TextRevealCard } from "@/components/ui/text-reveal-card";
import { ArrowRightIcon, SparklesIcon, Cog } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="py-20 md:py-32 bg-background w-full">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <Reveal type="bottomUp" duration={0.8} once={true}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-secondary border border-primary">
                <Cog className="w-4 h-4 mr-2 text-accent" />
                Made by byteUS
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-secondary border border-primary">
                <SparklesIcon className="w-4 h-4 mr-2 text-accent" />
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
              <span className="text-primary"> Legal Assistant</span>
            </h2>
          </Reveal>

          <Reveal type="bottomUp" duration={0.8} delay={0.6} once={true}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full">
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full">
                Learn More
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
