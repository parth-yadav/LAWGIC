"use client";

import Reveal from "@/components/animations/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon, StarIcon, TrendingUpIcon } from "lucide-react";

export default function Contact() {
  return (
    <section id="contact" className="py-20 md:py-32">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <Reveal type="bottomUp" duration={0.8}>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Help Us Improve
            </h2>
          </Reveal>
          <Reveal type="bottomUp" duration={0.8} delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your feedback helps us make our legal assistant better for
              everyone. Tell us how we can improve your experience.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Reveal type="leftRight" duration={0.8}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Share Your Feedback
                  </h3>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input placeholder="First Name" />
                      <Input placeholder="Last Name" />
                    </div>
                    <Input placeholder="Email Address" type="email" />
                    <Input placeholder="How did you find us?" />
                    <Textarea
                      placeholder="What features would you like to see? How can we improve your experience?"
                      rows={4}
                    />
                    <Button className="w-full">Submit Feedback</Button>
                  </form>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          <div>
            <Reveal type="rightLeft" duration={0.8}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Ways to Help Us Improve
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <MessageCircleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">Feature Suggestions</div>
                        <div className="text-muted-foreground">
                          Tell us what new features would help you most
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <StarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">User Experience</div>
                        <div className="text-muted-foreground">
                          Share what you love or what needs improvement
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <TrendingUpIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">Performance Issues</div>
                        <div className="text-muted-foreground">
                          Report any bugs or slow loading times
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20">
                  <CardContent className="p-0">
                    <h4 className="font-bold text-foreground mb-2">
                      Join Our Community
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with other users and get updates on new features
                      and improvements.
                    </p>
                    <Button variant="outline" className="w-full">
                      Join Community
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
