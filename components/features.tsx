"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  Brain,
  DatabaseZap,
  SearchCheck,
  Lock,
  BarChart3,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    image: "/data-integrityy.gif",
    title: "Evidence Integrity Verification",
    description:
      "Verify whether an image or digital evidence has been tampered with using advanced AI-based analysis.",
    glowClass: "glow-blue",
    iconColor: "text-blue-500",
  },
  {
    icon: Brain,
    image: "/detectionn.gif",
    title: "AI-Powered Forgery Detection",
    description:
      "Utilizes deep learning models to detect subtle manipulations, inconsistencies, and forged patterns in images.",
    glowClass: "glow-indigo",
    iconColor: "text-indigo-500",
  },
  {
    icon: DatabaseZap,
    image: "/blockchain.gif",
    title: "Blockchain-Backed Storage",
    description:
      "Securely store verified evidence on a blockchain ledger to ensure immutability, transparency, and traceability.",
    glowClass: "glow-purple",
    iconColor: "text-purple-500",
  },
  {
    icon: SearchCheck,
    image: "/metadataa.gif",
    title: "Metadata and Authenticity Analysis",
    description:
      "Automatically extract and analyze EXIF metadata, pixel-level anomalies, and image compression artifacts.",
    glowClass: "glow-emerald",
    iconColor: "text-emerald-500",
  },
  {
    icon: Lock,
    image: "/security.gif",
    title: "Secure Access Control",
    description:
      "Implements multi-level authentication and role-based permissions to protect sensitive case information.",
    glowClass: "glow-blue",
    iconColor: "text-blue-500",
  },
  {
    icon: BarChart3,
    image: "/reportt.gif",
    title: "Detailed Verification Reports",
    description:
      "Generate comprehensive reports containing detection results, blockchain proof, and evidence authenticity scores.",
    glowClass: "glow-indigo",
    iconColor: "text-indigo-500",
  },
];

const Features = () => {
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div
      id="features"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <motion.h2 
        className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        Core Features of Evidence Verification System
      </motion.h2>

      <motion.div 
        className="mt-8 xs:mt-14 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.map((feature) => (
          <motion.div 
            key={feature.title} 
            variants={itemVariants}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-full"
          >
            <Card
              className={`flex flex-col border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-card glow-card ${feature.glowClass} w-full`}
            >
              {/* Header with GIF */}
              <CardHeader className="p-0 relative group flex-1">
                <div className="w-full h-48 overflow-hidden relative">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover rounded-t-xl group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="p-6">
                  <feature.icon className={`w-7 h-7 mb-2 ${feature.iconColor}`} />
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm xs:text-[17px] mt-1 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Features;
