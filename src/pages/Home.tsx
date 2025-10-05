import { BlurFade } from "@/components/ui/blur-fade";
import { Link } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import Header from "@/components/Header";
import { Hero1 } from "@/components/ui/hero-with-text-and-two-button";

const Home = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Header />
      
      <main className="container mx-auto px-4 pt-16 pb-20">
          {/* Hero Section */}
          <BlurFade delay={0.3} inView>
            <Hero1 />
          </BlurFade>

          {/* Spacer to push Drop/Pickup sections down */}
          <div className="h-32" />

          {/* CTA Cards */}
          <BlurFade delay={0.7} inView>
            <div data-section="drop-pickup">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-32">
              <Link to="/drop" className="group">
                <div className="relative overflow-hidden rounded-3xl p-10 border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-drop hover:border-white/30">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-drop">
                      <Upload className="w-10 h-10 text-black" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-bold mb-4 text-white">Drop</h2>
                    <p className="text-lg text-white/70 leading-relaxed">
                      Securely share files with military-grade encryption. Generate a unique code and share instantly.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span>Start dropping</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/pickup" className="group">
                <div className="relative overflow-hidden rounded-3xl p-10 border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-pickup hover:border-white/30">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-pickup">
                      <Download className="w-10 h-10 text-black" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-bold mb-4 text-white">PickUp</h2>
                    <p className="text-lg text-white/70 leading-relaxed">
                      Retrieve securely shared files with a 6-character code. Fast, encrypted, and ephemeral.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span>Start picking up</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            </div>
          </BlurFade>

        </main>
    </div>
  );
};

export default Home;
