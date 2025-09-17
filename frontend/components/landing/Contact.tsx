"use client";

import Reveal from "@/components/animations/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon, StarIcon, TrendingUpIcon, SendIcon, HeartIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <section id="contact" className="py-20 md:py-32 w-full relative bg-[var(--color-scheme-light)] dark:bg-[var(--color-scheme-darkest)]">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-40 h-40 bg-[var(--color-scheme-blue)]/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-[var(--color-scheme-blue)]/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-16">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-scheme-darkest)] dark:text-white mb-4">
              Help Us{" "}
              <span className="bg-gradient-to-r from-[var(--color-scheme-blue)] to-[var(--color-scheme-dark-blue)] bg-clip-text text-transparent">
                Improve
              </span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-[var(--color-scheme-darkest)]/70 dark:text-gray-300 max-w-2xl mx-auto">
              Your feedback helps us make our legal assistant better for
              everyone. Tell us how we can improve your experience.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Reveal type="leftRight" duration={0.8}>
              <Card className="h-full group hover:shadow-2xl transition-all duration-500 border-2 hover:border-[var(--color-scheme-blue)]/30 bg-white dark:bg-black">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-[var(--color-scheme-darkest)] dark:text-white mb-6 group-hover:text-[var(--color-scheme-dark-blue)] transition-colors duration-300">
                    Share Your Feedback
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        placeholder="First Name" 
                        className="transition-all duration-300 focus:border-[var(--color-scheme-dark-blue)]/50 hover:border-[var(--color-scheme-dark-blue)]/30 bg-white dark:bg-black text-[var(--color-scheme-darkest)] dark:text-white"
                      />
                      <Input 
                        placeholder="Last Name" 
                        className="transition-all duration-300 focus:border-[var(--color-scheme-dark-blue)]/50 hover:border-[var(--color-scheme-dark-blue)]/30 bg-white dark:bg-black text-[var(--color-scheme-darkest)] dark:text-white"
                      />
                    </div>
                    <Input 
                      placeholder="Email Address" 
                      type="email" 
                      className="transition-all duration-300 focus:border-[var(--color-scheme-dark-blue)]/50 hover:border-[var(--color-scheme-dark-blue)]/30 bg-white dark:bg-black text-[var(--color-scheme-darkest)] dark:text-white"
                    />
                    <Input 
                      placeholder="How did you find us?" 
                      className="transition-all duration-300 focus:border-[var(--color-scheme-dark-blue)]/50 hover:border-[var(--color-scheme-dark-blue)]/30 bg-white dark:bg-black text-[var(--color-scheme-darkest)] dark:text-white"
                    />
                    <Textarea
                      placeholder="What features would you like to see? How can we improve your experience?"
                      rows={4}
                      className="transition-all duration-300 focus:border-[var(--color-scheme-dark-blue)]/50 hover:border-[var(--color-scheme-dark-blue)]/30 bg-white dark:bg-black text-[var(--color-scheme-darkest)] dark:text-white"
                    />
                    <Button 
                      type="submit"
                      className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Feedback
                          <SendIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          <div>
            <Reveal type="rightLeft" duration={0.8}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-scheme-darkest)] dark:text-white mb-6">
                    Ways to Help Us Improve
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        icon: MessageCircleIcon,
                        title: "Feature Suggestions",
                        description: "Tell us what new features would help you most"
                      },
                      {
                        icon: StarIcon,
                        title: "User Experience",
                        description: "Share what you love or what needs improvement"
                      },
                      {
                        icon: TrendingUpIcon,
                        title: "Performance Issues",
                        description: "Report any bugs or slow loading times"
                      }
                    ].map((item) => (
                      <div key={item.title} className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-[var(--color-scheme-blue)]/5 transition-all duration-300 hover:scale-[1.02]">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--color-scheme-dark-blue)] to-[var(--color-scheme-darkest)] text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--color-scheme-darkest)] dark:text-white group-hover:text-[var(--color-scheme-dark-blue)] transition-colors duration-300">
                            {item.title}
                          </div>
                          <div className="text-[var(--color-scheme-darkest)]/60 dark:text-gray-400 group-hover:text-[var(--color-scheme-darkest)]/80 dark:group-hover:text-gray-300 transition-colors duration-300">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="group p-6 bg-gradient-to-r from-[var(--color-scheme-blue)]/10 to-[var(--color-scheme-blue)]/5 border-[var(--color-scheme-blue)]/20 hover:border-[var(--color-scheme-blue)]/40 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] bg-white dark:bg-black">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-2">
                      <HeartIcon className="w-5 h-5 text-[var(--color-scheme-dark-blue)] mr-2 group-hover:scale-110 transition-transform duration-300" />
                      <h4 className="font-bold text-[var(--color-scheme-darkest)] dark:text-white group-hover:text-[var(--color-scheme-dark-blue)] transition-colors duration-300">
                        Join Our Community
                      </h4>
                    </div>
                    <p className="text-sm text-[var(--color-scheme-darkest)]/60 dark:text-gray-400 mb-4">
                      Connect with other users and get updates on new features
                      and improvements.
                    </p>
                    <Button variant="outline" className="w-full group/btn hover:bg-[var(--color-scheme-dark-blue)] hover:text-white border-[var(--color-scheme-dark-blue)] text-[var(--color-scheme-darkest)] dark:text-white transition-all duration-300">
                      Join Community
                      <ArrowRightIcon className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
