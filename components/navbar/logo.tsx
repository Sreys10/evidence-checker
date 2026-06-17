import Link from "next/link";

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <img src="/logo.png" alt="EviCheck Logo" className="h-6 w-auto object-contain" />
    <span className="text-xl font-bold text-foreground">evidence.ai</span>
  </Link>
);
