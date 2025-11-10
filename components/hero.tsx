import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden border-b border-accent bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-(--breakpoint-xl) w-full flex flex-col lg:flex-row mx-auto items-center justify-between gap-y-14 gap-x-10 px-6 py-12 lg:py-0">
        
        {/* Left Section */}
        <div className="max-w-xl">
          <Badge className="rounded-full py-1 border-none bg-foreground text-background">
            Now Live — EvidenceCheck v1.0
          </Badge>
          
          <h1 className="mt-6 max-w-[22ch] text-3xl xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold leading-[1.2]! tracking-tight text-foreground">
            Verify Digital Evidence with <br /> AI and Blockchain
          </h1>

          <p className="mt-6 max-w-[60ch] xs:text-lg text-muted-foreground">
            Ensure the authenticity and integrity of digital evidence using
            advanced AI tampering detection and blockchain-based verification.
            Secure, transparent, and tamper-proof — built for digital forensics.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full text-base"
              asChild
            >
              <Link href="/login">
                Get Started <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative lg:max-w-2xl xl:max-w-3xl w-full bg-accent rounded-xl overflow-hidden">
  <img
    src="/hero.gif"
    alt="AI Evidence Verification Animation"
    className="object-cover w-full h-auto rounded-xl"
  />
</div>


      </div>
    </div>
  );
};

export default Hero;
