import Reveal from "@/components/animations/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon, StarIcon, TrendingUpIcon, SendIcon, HeartIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <section id="contact" className="py-20 md:py-32 w-full relative bg-background">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-16">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Help Us <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Improve</span>
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your feedback helps us make our legal assistant better for everyone.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Reveal type="leftRight" duration={0.8}>
              <Card className="h-full group hover:shadow-2xl transition-all duration-500 border-2 hover:border-secondary/30 bg-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6 group-hover:text-primary transition-colors duration-300">Share Your Feedback</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input placeholder="First Name" className="transition-all duration-300 focus:border-primary/50 hover:border-primary/30 bg-background text-foreground" />
                      <Input placeholder="Last Name" className="transition-all duration-300 focus:border-primary/50 hover:border-primary/30 bg-background text-foreground" />
                    </div>
                    <Input placeholder="Email Address" type="email" className="transition-all duration-300 focus:border-primary/50 hover:border-primary/30 bg-background text-foreground" />
                    <Input placeholder="How did you find us?" className="transition-all duration-300 focus:border-primary/50 hover:border-primary/30 bg-background text-foreground" />
                    <Textarea placeholder="What features would you like to see?" rows={4} className="transition-all duration-300 focus:border-primary/50 hover:border-primary/30 bg-background text-foreground" />
                    <Button type="submit" className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" disabled={isSubmitting}>
                      {isSubmitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Submitting...</>) : (<>Submit Feedback <SendIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" /></>)}
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
                  <h3 className="text-2xl font-bold text-foreground mb-6">Ways to Help Us Improve</h3>
                  <div className="space-y-6">
                    {[
                      { icon: MessageCircleIcon, title: "Feature Suggestions", description: "Tell us what new features would help you most" },
                      { icon: StarIcon, title: "User Experience", description: "Share what you love or what needs improvement" },
                      { icon: TrendingUpIcon, title: "Performance Issues", description: "Report any bugs or slow loading times" },
                    ].map((item) => (
                      <div key={item.title} className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-secondary/5 transition-all duration-300 hover:scale-[1.02]">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-foreground text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{item.title}</div>
                          <div className="text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="group p-6 bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/40 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] bg-card">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-2">
                      <HeartIcon className="w-5 h-5 text-primary mr-2 group-hover:scale-110 transition-transform duration-300" />
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">Join Our Community</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Connect with other users and get updates on new features.</p>
                    <Button variant="outline" className="w-full group/btn hover:bg-primary hover:text-primary-foreground border-primary text-foreground transition-all duration-300">
                      Join Community <ArrowRightIcon className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
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
