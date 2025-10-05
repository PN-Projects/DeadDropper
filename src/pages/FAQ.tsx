import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Is DeadDropper secure?",
      answer: (
        <>
          Yes, absolutely. DeadDropper uses end-to-end encryption with AES-GCM, meaning your files are encrypted 
          on your device before they're uploaded. We use per-chunk SHA-256 hashing for integrity verification, 
          and implement a zero-knowledge architecture where even we can't read your files. For more technical details, 
          check out our{" "}
          <Link to="/security" className="text-primary hover:underline">
            Security page
          </Link>
          .
        </>
      ),
    },
    {
      question: "What is the maximum file size that can be transferred?",
      answer: (
        <>
          The default limit is 5 GB per drop for optimal performance and reliability. This limit can be adjusted 
          server-side based on your infrastructure. If you attempt to upload files larger than the configured limit, 
          the client will show a clear error message. For larger files, we recommend splitting them into multiple drops 
          or waiting for our upcoming Pro tier with higher limits.
        </>
      ),
    },
    {
      question: "What features are coming?",
      answer: (
        <>
          We have an exciting roadmap ahead! Check out our{" "}
          <Link to="/vision" className="text-primary hover:underline">
            Our Vision page
          </Link>
          {" "}to see all the planned features including secure text sharing, optional password protection, 
          peer-to-peer mode, mobile apps, and more.
        </>
      ),
    },
    {
      question: "How long are files stored?",
      answer: (
        <>
          Files are stored based on the burn schedule you select when creating a drop (60 minutes, 2 hours, 6 hours, 
          12 hours, or 24 hours). After that time, files are automatically and permanently deleted. Additionally, 
          files are burned 30 seconds after being successfully downloaded, whichever comes first. This ensures maximum 
          security and minimal data retention.
        </>
      ),
    },
    {
      question: "Do I need to create an account?",
      answer: (
        <>
          No! One of DeadDropper's core principles is no-account-required file sharing. We believe privacy shouldn't 
          require handing over your email or personal information. Just drop your files, share the code, and you're done. 
          No tracking, no profiles, no data collection.
        </>
      ),
    },
    {
      question: "Can I share files with multiple people?",
      answer: (
        <>
          Yes! Once you create a drop and receive your 6-character code, you can share that code with as many people as you'd 
          like. Each recipient can use the code to download the files. However, remember that the files will auto-burn 
          30 seconds after the first successful download or after the scheduled burn time, whichever comes first.
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-white/70 text-center mb-12">
              Everything you need to know about DeadDropper
            </p>
          </BlurFade>

          <BlurFade delay={0.2}>
            <Card className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-white">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-12 text-center">
              <p className="text-white/70 mb-4">
                Still have questions?
              </p>
              <a
                href="https://github.com/PN-Projects"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                Visit our GitHub organization
              </a>
            </div>
          </BlurFade>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
