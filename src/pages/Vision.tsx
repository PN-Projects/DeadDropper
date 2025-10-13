import { FileText, Shield, Zap, Users, Smartphone, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { BlurFade } from "@/components/ui/blur-fade";

const Vision = () => {
  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Quick and Secure Text Sharing Tools",
      description:
        "Like Pastebin/Nekobin but with end-to-end encryption. Share code snippets, configs, and text with the same security as file drops. Perfect for sharing API keys, passwords, or sensitive text without risking exposure.",
      status: "Planned",
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Freemium Plan and Limits",
      description:
        "Sustainable monetization through optional Pro tiers. Free tier with generous limits for personal use, Pro tier for power users who need larger files, longer retention, and premium features. Privacy never paywalled.",
      status: "In Design",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Optional Password Protection",
      description:
        "Add an extra layer of security with optional password protection on drops. Even if someone intercepts the 6-character code, they can't access files without the password. Client-side key derivation ensures passwords never touch our servers.",
      status: "Planned",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Peer-to-Peer Mode (No Cloud)",
      description:
        "For ultimate privacy, enable P2P mode where files transfer directly between browsers using WebRTC. No cloud storage, no intermediary servers—just encrypted data flowing peer-to-peer. Perfect for ultra-sensitive transfers.",
      status: "Research Phase",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "iPhone & Android Apps",
      description:
        "Native mobile apps with the same zero-knowledge architecture. Drop files from your phone with a tap, pick them up with a QR scan. Full offline support for P2P mode. Share from any app via native share sheets.",
      status: "Planned",
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "DeadDropper+",
      description:
        "Premium tier features: longer expiration times (up to 7 days), higher download counts (share with teams), larger file limits (up to 50GB), priority support, and custom branding options for businesses. Privacy still guaranteed.",
      status: "In Design",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto">
          <BlurFade delay={0.1}>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Our Vision
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Building the future of private, secure, and user-friendly file sharing. 
                Here's what we're working on next.
              </p>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1}>
                <Card className="p-6 h-full hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {feature.description}
                      </p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary">
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </Card>
              </BlurFade>
            ))}
          </div>

          <BlurFade delay={0.8}>
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-drop/10 border-primary/20">
              <h2 className="text-2xl font-bold mb-4 text-center">Want to Contribute?</h2>
              <p className="text-muted-foreground text-center mb-6">
                DeadDropper is open source and community-driven. If you're excited about any of these features 
                or have ideas of your own, we'd love to hear from you. Check out our GitHub to get involved.
              </p>
              <div className="flex justify-center">
                <a
                  href="https://github.com/PN-Projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Users className="w-5 h-5" />
                  Join the Community
                </a>
              </div>
            </Card>
          </BlurFade>

          <BlurFade delay={0.9}>
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Privacy is not a feature. It's a fundamental right.
                <br />
                We're building tools to protect it.
              </p>
            </div>
          </BlurFade>
        </div>
      </main>
    </div>
  );
};

export default Vision;
