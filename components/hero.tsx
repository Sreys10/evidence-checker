"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden border-b border-border/50">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/5"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px]"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--primary)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,transparent_0%,hsl(var(--primary)/0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer"></div>
      
      <div className="relative z-10 max-w-(--breakpoint-xl) w-full flex flex-col lg:flex-row mx-auto items-center justify-between gap-y-14 gap-x-10 px-6 py-12 lg:py-0">
        
        {/* Left Section */}
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="rounded-full py-1 border-none bg-foreground text-background">
              Now Live — EvidenceCheck v1.0
            </Badge>
            
            <h1 className="mt-6 max-w-[22ch] text-3xl xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold tracking-tight text-foreground leading-[1.25]">
              Verify Digital Evidence with <br /> AI and Blockchain
            </h1>

            <p className="mt-6 max-w-[60ch] xs:text-lg text-muted-foreground">
              Ensure the authenticity and integrity of digital evidence using
              advanced AI tampering detection and blockchain-based verification.
              Secure, transparent, and tamper-proof — built for digital forensics.
            </p>
          </motion.div>

          <motion.div 
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full text-base shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
                asChild
              >
                <Link href="/login">
                  Get Started <ArrowUpRight className="h-5! w-5!" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full text-base border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors duration-300"
                asChild
              >
                <Link href="/analyst">
                  Quick Analysis
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Section: Glassmorphic browser mockup */}
        <motion.div 
          className="relative lg:max-w-2xl xl:max-w-3xl w-full rounded-2xl border border-border/60 dark:border-white/10 bg-card/40 backdrop-blur-md p-1.5 sm:p-2 shadow-2xl shadow-primary/5 overflow-hidden group hover:scale-[1.01] transition-transform duration-500"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          {/* Mock Browser Header Bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/40 rounded-t-xl select-none">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></div>
            <div className="flex-1 text-[11px] font-mono text-center text-muted-foreground/60">
              evidence-analyzer-v1.0.exe
            </div>
          </div>
          <div className="relative overflow-hidden rounded-b-xl bg-accent">
            <img
              src="/hero.gif"
              alt="AI Evidence Verification Animation"
              className="object-cover w-full h-auto rounded-b-xl group-hover:scale-[1.02] transition-transform duration-700"
            />
            {/* Overlay border */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-b-xl"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Hero;
