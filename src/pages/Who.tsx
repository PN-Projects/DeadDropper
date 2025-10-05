import { Github } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { BlurFade } from "@/components/ui/blur-fade";

const Who = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white">
              Who are We?
            </h1>
          </BlurFade>

          <div className="space-y-12">
            <BlurFade delay={0.2}>
              <Card className="p-8">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  DeadDropper is an initiative by <span className="font-semibold text-foreground">TeamPrabodhNandini</span>, 
                  a collective of developers and privacy advocates committed to building tools that put user privacy first. 
                  We believe that secure, encrypted communication should be accessible to everyone—not just those with 
                  technical expertise or deep pockets.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Our team is distributed, open-source focused, and driven by the belief that privacy is a fundamental right, 
                  not a premium feature. We don't track you, we don't sell your data, and we can't read your files even if 
                  we wanted to. This isn't marketing—it's our architecture.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We're building DeadDropper in the open because we believe transparency breeds trust. Every line of code, 
                  every decision, and every feature is developed with one question in mind: "Does this protect user privacy?"
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.3}>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-6">Our Organization</h2>
                <Card className="p-8 inline-block">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-drop flex items-center justify-center">
                      <Github className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold">TeamPrabodhNandini</h3>
                      <a
                        href="https://github.com/PN-Projects"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        github.com/PN-Projects
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            </BlurFade>

            <BlurFade delay={0.4}>
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-drop/5 border-primary/20">
                <h2 className="text-2xl font-bold mb-4">Our Values</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Privacy First</h3>
                    <p className="text-muted-foreground">
                      Every technical decision we make prioritizes user privacy over convenience, profit, or growth metrics.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Open Source</h3>
                    <p className="text-muted-foreground">
                      Security through obscurity is not security. Our code is public, auditable, and forkable.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">No Tracking</h3>
                    <p className="text-muted-foreground">
                      We don't use analytics, we don't track users, and we don't build profiles. Period.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Community Driven</h3>
                    <p className="text-muted-foreground">
                      We build features users request, not features that maximize engagement or ad revenue.
                    </p>
                  </div>
                </div>
              </Card>
            </BlurFade>

            <BlurFade delay={0.5}>
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Get Involved</h2>
                <p className="text-muted-foreground mb-6">
                  DeadDropper is open source and community-driven. We welcome contributions, bug reports, 
                  security audits, and feature suggestions.
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://github.com/PN-Projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Github className="w-5 h-5" />
                    View on GitHub
                  </a>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Who;
