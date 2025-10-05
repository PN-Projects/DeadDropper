import { Shield, Lock, Eye, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { BlurFade } from "@/components/ui/blur-fade";

const Security = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.1}>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                Security is not just a feature.
                <br />
                It's our mission.
              </h1>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <Card className="p-6 text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-white">End-to-End Encrypted</h3>
              </Card>
              <Card className="p-6 text-center">
                <Eye className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">No Ads</h3>
              </Card>
              <Card className="p-6 text-center">
                <Lock className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">No Trackers</h3>
              </Card>
              <Card className="p-6 text-center">
                <Zap className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">NO LOGIN REQUIRED</h3>
              </Card>
            </div>
          </BlurFade>

          <div className="space-y-12">
            <BlurFade delay={0.3}>
              <section>
                <h2 className="text-3xl font-bold mb-6 text-white">How DeadDropper Protects Your Files</h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  DeadDropper implements military-grade encryption and security practices to ensure your files remain 
                  private from the moment they leave your device until they're picked up by the intended recipient.
                </p>
              </section>
            </BlurFade>

            <BlurFade delay={0.4}>
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Client-Side Encryption</h3>
                <p className="text-white/70 leading-relaxed">
                  All encryption happens on your device before any data touches our servers. We use AES-GCM 
                  (Advanced Encryption Standard in Galois/Counter Mode), a NIST-approved symmetric encryption algorithm 
                  that provides both confidentiality and integrity. Your files are split into chunks, each encrypted 
                  individually with a unique key derived from your master drop key.
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.5}>
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Per-Chunk Integrity Verification</h3>
                <p className="text-white/70 leading-relaxed">
                  Each encrypted chunk is hashed using SHA-256, ensuring that any tampering or corruption during 
                  transfer or storage is immediately detected. This cryptographic hash is stored in the manifest 
                  and verified during download, guaranteeing file integrity from end to end.
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.6}>
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Presigned URL Architecture</h3>
                <p className="text-white/70 leading-relaxed">
                  We use presigned URLs to S3-compatible storage, meaning your encrypted file chunks go directly from 
                  your browser to secure cloud storage without ever passing through our application servers in unencrypted 
                  form. Our servers only handle metadata and coordinate the upload process—they never have access to your 
                  actual file data.
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.7}>
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Manifest-Based Distribution</h3>
                <p className="text-white/70 leading-relaxed">
                  When you create a drop, a manifest file is generated containing metadata about your files and the 
                  locations of encrypted chunks. This manifest itself is encrypted and stored securely. When someone 
                  enters the 6-character pickup code, they retrieve the manifest, which their browser uses to fetch and 
                  decrypt the chunks locally. The decryption keys never touch our servers.
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.8}>
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Time-To-Live & Auto-Burn</h3>
                <p className="text-white/70 leading-relaxed">
                  Every drop has a configurable TTL (time-to-live) that you set when creating it. After this period, 
                  or 30 seconds after a successful download, all file chunks and metadata are permanently and 
                  irreversibly deleted from storage. There are no backups, no "undo" buttons, and no way to recover 
                  burned drops—even for us. This ensures your sensitive data doesn't linger on servers indefinitely.
                </p>
              </Card>
            </BlurFade>

            <BlurFade delay={0.9}>
              <section className="mt-16">
                <h2 className="text-2xl font-bold mb-4 text-white">Zero Knowledge Architecture</h2>
                <p className="text-white/70 leading-relaxed">
                  DeadDropper implements a true zero-knowledge architecture. We don't know what files you're sharing, 
                  who you're sharing them with, or what's in them. All we see is encrypted data moving through our 
                  infrastructure. This isn't just a privacy promise—it's a technical guarantee enforced by the 
                  architecture itself.
                </p>
              </section>
            </BlurFade>

            <BlurFade delay={1.0}>
              <section className="mt-12 p-8 rounded-xl border border-white/20 bg-white/5">
                <h3 className="text-xl font-bold mb-4 text-white">Open Source & Auditable</h3>
                <p className="text-white/70 leading-relaxed">
                  Security through obscurity isn't security. That's why DeadDropper is open source. Our code is 
                  publicly available for security researchers, developers, and anyone who wants to verify our claims. 
                  We welcome security audits and responsible disclosure of any vulnerabilities.
                </p>
                <a
                  href="https://github.com/PN-Projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-white hover:underline"
                >
                  View source code on GitHub →
                </a>
              </section>
            </BlurFade>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Security;
