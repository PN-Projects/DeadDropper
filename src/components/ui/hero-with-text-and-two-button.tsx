import { WordFadeIn } from "@/components/ui/word-fade-in";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

function Hero1() {
  const scrollToSections = () => {
    const sections = document.querySelector('[data-section="drop-pickup"]');
    if (sections) {
      sections.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <div className="relative">
              <div className="relative z-10">
                <WordFadeIn 
                  words="DROP IT. ENCRYPT IT. FORGET IT." 
                  className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-2xl"
                  delay={0.1}
                />
              </div>
            </div>
            <div className="relative">
              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-white/80 text-center drop-shadow-lg">
                We scramble your files locally — we never touch the keys.
Drop a 6-character code, hand it off, and watch the file vaporize on pickup.
Secure, anonymous, and ridiculously simple.
              </p>
            </div>
            <div className="relative mt-2 flex justify-center">
              <LiquidButton 
                onClick={scrollToSections}
                className="text-white font-semibold"
              >
                Drop or Pickup
              </LiquidButton>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export { Hero1 };
