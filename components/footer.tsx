import { Separator } from "@/components/ui/separator";
import { GithubIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-12 xs:mt-20 border-t bg-background">
      <div className="max-w-(--breakpoint-xl) mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground">evidence.ai</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered digital evidence verification and tampering detection — built for digital forensics.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h6 className="text-sm font-semibold text-foreground mb-4">Platform</h6>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
            <li><Link href="#tech-stack" className="hover:text-foreground transition-colors">Tech Stack</Link></li>
            <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h6 className="text-sm font-semibold text-foreground mb-4">Legal</h6>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Use</Link></li>
          </ul>
        </div>
      </div>

      <Separator />

      <div className="max-w-(--breakpoint-xl) mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} evidence.ai. All rights reserved.</span>
        <Link href="#" target="_blank" className="hover:text-foreground transition-colors">
          <GithubIcon className="h-5 w-5" />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;


