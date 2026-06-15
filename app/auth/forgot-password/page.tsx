"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const animationSpeed = 0.8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    // Simulate a brief processing delay, then show confirmation.
    // In production, this would call POST /api/auth/forgot-password to send a reset email.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setSubmitted(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6 * animationSpeed,
        ease: [0, 0, 0.58, 1] as const,
        staggerChildren: 0.1 * animationSpeed,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 * animationSpeed, ease: [0.42, 0, 0.58, 1] as const },
    },
  };

  const blobVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.7 * animationSpeed, ease: [0.42, 0, 0.58, 1] as const },
    },
  };

  const inputHoverVariants = {
    rest: { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
    hover: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.3 * animationSpeed, ease: [0.42, 0, 0.58, 1] as const },
    },
  };

  const buttonHoverVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 * animationSpeed, ease: [0.42, 0, 0.58, 1] as const },
    },
    tap: { scale: 0.98 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <motion.div
        className="relative w-full max-w-4xl h-[520px] bg-card border border-border rounded-3xl overflow-hidden shadow-lg flex"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layoutId="authCard"
        layout
      >
        {/* Left side with blob design */}
        <div className="relative w-2/5 bg-foreground p-8 flex flex-col justify-center overflow-hidden">
          <motion.div
            className="absolute top-10 left-10 w-24 h-24 rounded-full bg-amber-300 opacity-80"
            variants={blobVariants}
            style={{ animation: "snakeMove 15s ease-in-out infinite" }}
          />
          <motion.div
            className="absolute bottom-20 right-[-50px] w-40 h-40 bg-pink-200 rounded-full"
            variants={blobVariants}
            transition={{ delay: 0.2 }}
            style={{ animation: "snakeFloat 20s ease-in-out infinite" }}
          />
          <motion.div
            className="absolute top-40 right-[-30px] w-32 h-20 bg-amber-500 rounded-full"
            variants={blobVariants}
            transition={{ delay: 0.4 }}
          />
          <motion.h1
            className="text-6xl font-bold text-background mb-2 relative z-10"
            variants={itemVariants}
          >
            Reset
            <br />
            Your
            <br />
            Password
          </motion.h1>
          <motion.div
            className="absolute bottom-10 left-10 w-20 h-6 bg-background rounded-full opacity-70"
            variants={blobVariants}
            transition={{ delay: 0.6 }}
          />
        </div>

        <style jsx global>{`
          @keyframes snakeMove {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(15px, 15px); }
            40% { transform: translate(-10px, 25px); }
            60% { transform: translate(10px, 5px); }
            80% { transform: translate(-5px, -15px); }
          }
          @keyframes snakeFloat {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-15px, -20px) rotate(10deg); }
            50% { transform: translate(10px, -30px) rotate(-5deg); }
            75% { transform: translate(5px, -10px) rotate(5deg); }
          }
        `}</style>

        {/* Right side */}
        <motion.div
          className="w-3/5 p-10 flex flex-col justify-center"
          variants={containerVariants}
          layout
        >
          {/* Back to login */}
          <motion.div className="mb-6" variants={itemVariants}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </motion.div>

          <motion.div className="mb-8" variants={itemVariants} layout>
            <motion.h2 className="text-4xl text-foreground font-medium mb-3" layoutId="formTitle">
              Forgot password?
            </motion.h2>
            <motion.p className="text-base text-muted-foreground" layoutId="formSubtitle">
              Enter your account email and we&apos;ll send you a link to reset your password.
            </motion.p>
          </motion.div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <motion.div
                  className="relative"
                  variants={inputHoverVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </motion.div>
              </motion.div>

              {/* Error message */}
              {error && (
                <motion.div
                  className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  variants={buttonHoverVariants}
                  initial="rest"
                  whileHover={isLoading ? "rest" : "hover"}
                  whileTap="tap"
                  layoutId="authButton"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </motion.button>
              </motion.div>
            </form>
          ) : (
            /* Success state */
            <motion.div
              className="flex flex-col items-center text-center gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Check your inbox</h3>
              <p className="text-muted-foreground text-base max-w-xs">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>, you will receive a
                password reset link shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive an email?{" "}
                <button
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="text-amber-500 hover:text-amber-600 font-medium underline transition-colors"
                >
                  Try again
                </button>
              </p>
              <Link
                href="/login"
                className="mt-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                ← Back to sign in
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
