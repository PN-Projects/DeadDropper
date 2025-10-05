import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShaderDemo_ATC from "@/components/ui/atc-shader";
import Home from "./pages/Home";
import Drop from "./pages/Drop";
import Pickup from "./pages/Pickup";
import Why from "./pages/Why";
import FAQ from "./pages/FAQ";
import Security from "./pages/Security";
import Who from "./pages/Who";
import Vision from "./pages/Vision";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen relative">
          {/* Global Shader Background */}
          <div className="fixed inset-0 z-0">
            <ShaderDemo_ATC />
          </div>
          
          {/* Overlay gradient for better text readability */}
          <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80" />
          
          {/* Content */}
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/drop" element={<Drop />} />
              <Route path="/pickup" element={<Pickup />} />
              <Route path="/why" element={<Why />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/security" element={<Security />} />
              <Route path="/who" element={<Who />} />
              <Route path="/vision" element={<Vision />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
