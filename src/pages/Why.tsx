import { Shield, Zap, Lock, Users, Github, Linkedin } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { BlurFade } from "@/components/ui/blur-fade";

const Why = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white">
              Why DeadDropper?
            </h1>
          </BlurFade>

          <div className="space-y-16">
            {/* Why don't most web services encrypt */}
            <BlurFade delay={0.2}>
              <section>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Why don't most web services end-to-end encrypt your data?
                </h2>
                <p className="text-white/70 leading-relaxed">
                  Most file-sharing services don't implement end-to-end encryption because it requires giving up control—and profits. 
                  When servers can read your data, companies can scan files for ads, train AI models, comply with surveillance requests, 
                  and build detailed user profiles. E2E encryption makes all of this impossible, which is why true privacy is rare.
                </p>
              </section>
            </BlurFade>

            {/* Importance of E2E */}
            <BlurFade delay={0.3}>
              <section>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  The importance of end-to-end encryption
                </h2>
                <p className="text-white/70 leading-relaxed mb-4">
                  End-to-end encryption means your files are encrypted on your device before they leave. The server storing them can't 
                  read them. Only the person with the decryption key (shared via the 6-character code) can unlock and view the files. 
                  This ensures:
                </p>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span>Your files remain private, even from us</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span>No third party can access or scan your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span>Protection against breaches and unauthorized access</span>
                  </li>
                </ul>
              </section>
            </BlurFade>

            {/* Ten times better */}
            <BlurFade delay={0.4}>
              <section>
                <h2 className="text-2xl font-bold mb-4 text-white">Ten times better</h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  DeadDropper isn't just an alternative—it's a paradigm shift. No login. No tracking. No ads. No data mining. 
                  Just pure, fast, encrypted file sharing that respects your privacy.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <Lock className="w-8 h-8 text-white mb-3" />
                    <h3 className="font-semibold mb-2 text-white">Zero Knowledge</h3>
                    <p className="text-sm text-white/70">
                      We can't read your files even if we wanted to
                    </p>
                  </Card>
                  <Card className="p-6">
                    <Zap className="w-8 h-8 text-white mb-3" />
                    <h3 className="font-semibold mb-2 text-white">Lightning Fast</h3>
                    <p className="text-sm text-white/70">
                      Optimized chunked uploads for maximum speed
                    </p>
                  </Card>
                  <Card className="p-6">
                    <Users className="w-8 h-8 text-white mb-3" />
                    <h3 className="font-semibold mb-2 text-white">No Accounts</h3>
                    <p className="text-sm text-white/70">
                      Share files without creating yet another account
                    </p>
                  </Card>
                </div>
              </section>
            </BlurFade>

            {/* Fastest way to send files */}
            <BlurFade delay={0.5}>
              <section>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  The fastest way to send files on the internet. Period.
                </h2>
                <p className="text-white/70 leading-relaxed">
                  Our chunked upload architecture with parallel processing means your files transfer at maximum possible speed. 
                  No bloated web interfaces. No unnecessary steps. Just drag, drop, and share. Encrypted in milliseconds, 
                  uploaded in seconds.
                </p>
              </section>
            </BlurFade>

            {/* Comparison */}
            <BlurFade delay={0.6}>
              <section>
                <h2 className="text-2xl font-bold mb-4 text-white">Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/20">
                      <tr>
                        <th className="text-left py-3 px-4 text-white">Feature</th>
                        <th className="text-center py-3 px-4 text-white">DeadDropper</th>
                        <th className="text-center py-3 px-4 text-white">Dropbox</th>
                        <th className="text-center py-3 px-4 text-white">WeTransfer</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-4 text-white/70">End-to-end encrypted</td>
                        <td className="text-center py-3 px-4 text-white">✓</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-4 text-white/70">No login required</td>
                        <td className="text-center py-3 px-4 text-white">✓</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                        <td className="text-center py-3 px-4 text-white/60">~</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-4 text-white/70">No ads or tracking</td>
                        <td className="text-center py-3 px-4 text-white">✓</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-4 text-white/70">Auto-burn capability</td>
                        <td className="text-center py-3 px-4 text-white">✓</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                        <td className="text-center py-3 px-4 text-white/60">~</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white/70">Open source</td>
                        <td className="text-center py-3 px-4 text-white">✓</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                        <td className="text-center py-3 px-4 text-white/40">✗</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </BlurFade>

            {/* DEVs Section */}
            <BlurFade delay={0.7}>
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white">DEVs</h2>
                <div className="space-y-6">
                  {/* Anand Sharma */}
                  <Card className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src="/Anand Sharma.jpg" 
                          alt="Anand Sharma" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-white">Anand Sharma</h3>
                        <p className="text-white/70 mb-4 leading-relaxed">
                          A Data Science Enthusiate with a Bachelors in Electronics and communication 
                          keen to always make something fun and funky. Professional Procastinator and a lazy lump.
                        </p>
                        <div className="flex gap-4">
                          <a
                            href="https://www.linkedin.com/in/sharma-anand47/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:underline"
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                          <a
                            href="https://github.com/PanotiProgrammer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:underline"
                          >
                            <Github className="w-4 h-4" />
                            GitHub
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Parthiv Katapara */}
                  <Card className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src="/Parthiv.jpg" 
                          alt="Parthiv Katapara" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-white">Parthiv Katapara</h3>
                        <p className="text-white/70 mb-4 leading-relaxed">
                          A Machine Learning, DevOps and Cloud Engineering admirer with years of experience in open source contributions. 
                          Pursuing Bachelors in electronics and Head of{" "}
                          <a 
                            href="https://github.com/PN-Projects" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white hover:underline font-medium"
                          >
                            TeamPrabodhNandini
                          </a>
                          , an open source organisation for students and researchers.
                        </p>
                        <div className="flex gap-4">
                        <a
                            href="https://www.linkedin.com/in/parthiv-katapara/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:underline"
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                          <a
                            href="https://github.com/satyanandatripathi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:underline"
                          >
                            <Github className="w-4 h-4" />
                            Github
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>
            </BlurFade>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Why;
