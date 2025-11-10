"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const animationSpeed = 0.8;

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement signup logic here
    console.log("Signup attempt with:", { name, email, password });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6 * animationSpeed,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1 * animationSpeed,
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6 * animationSpeed,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 * animationSpeed, ease: "easeOut" },
    },
  };

  const blobVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: (custom: number) => ({
      scale: 1,
      opacity: custom < 3 ? 0.8 : 0.6,
      transition: {
        duration: 0.7 * animationSpeed,
        delay: custom * 0.1 * animationSpeed,
        ease: "easeOut",
      },
    }),
  };

  // Hover animations
  const buttonHoverVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 * animationSpeed, ease: "easeInOut" },
    },
    tap: { scale: 0.98 },
  };

  const inputHoverVariants = {
    rest: { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
    hover: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.3 * animationSpeed, ease: "easeInOut" },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 overflow-hidden">
      {/* Background blob shapes - absolute positioned within the container */}
      <motion.div
        className="fixed top-[15%] left-[10%] w-64 h-64 rounded-full bg-pink-200 opacity-70"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          animation: "blobMove 25s ease-in-out infinite",
        }}
      ></motion.div>

      <motion.div
        className="fixed bottom-[20%] left-[20%] w-96 h-96 rounded-full bg-amber-100 opacity-60"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
        custom={1}
        style={{
          animation: "blobFloatLarge 30s ease-in-out infinite alternate",
        }}
      ></motion.div>

      <motion.div
        className="fixed top-[30%] right-[15%] w-72 h-72 rounded-full bg-pink-100 opacity-50"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
        custom={2}
        style={{
          animation: "blobPulse 18s ease-in-out infinite",
        }}
      ></motion.div>

      <motion.div
        className="fixed top-[70%] right-[25%] w-40 h-40 rounded-full bg-white opacity-30"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
        custom={3}
        style={{
          animation: "blobSpin 22s linear infinite",
        }}
      ></motion.div>

      <motion.div
        className="fixed top-[10%] right-[30%] w-24 h-24 rounded-full bg-amber-200 opacity-70"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
        custom={4}
        style={{
          animation: "blobBounce 12s ease-in-out infinite",
        }}
      ></motion.div>

      {/* Form container with shared layoutId for smooth transition */}
      <motion.div
        className="relative w-full max-w-xl bg-gray-300 rounded-3xl overflow-hidden shadow-xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layoutId="authCard"
        layout
      >
        <motion.div className="p-10" layout>
          <motion.div className="mb-8" variants={itemVariants} layout>
            <motion.h2
              className="text-4xl text-black font-bold mb-2"
              layoutId="formTitle"
            >
              Create Account
            </motion.h2>
            <motion.p className="text-lg text-black" layoutId="formSubtitle">
              Join our creative community
            </motion.p>
          </motion.div>

          <form onSubmit={handleSignup} className="space-y-5">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-black mb-1">
                Full Name
              </label>
              <motion.div
                className="relative"
                variants={inputHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder="Your Name"
                  required
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-black mb-1">
                Email Address
              </label>
              <motion.div
                className="relative"
                variants={inputHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder="your@email.com"
                  required
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-black mb-1">
                  Password
                </label>
                <motion.div
                  className="relative"
                  variants={inputHoverVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-black mb-1">
                  Confirm Password
                </label>
                <motion.div
                  className="relative"
                  variants={inputHoverVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </motion.div>
              </motion.div>
            </div>

            <motion.div className="pt-2" variants={itemVariants}>
              <div className="flex items-start">
                <motion.input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-amber-500 focus:ring-amber-400 border-gray-300 rounded cursor-pointer"
                  required
                  whileTap={{ scale: 0.9 }}
                />
                <motion.label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-600"
                  whileHover={{ color: "#F0A500" }}
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-amber-500 hover:text-amber-600 underline transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-amber-500 hover:text-amber-600 underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </motion.label>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
                variants={buttonHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                layoutId="authButton"
              >
                Create Account
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </motion.svg>
              </motion.button>
            </motion.div>

            <motion.div
              className="mt-6 text-center"
              variants={itemVariants}
              transition={{ delay: 0.2 }}
              layoutId="authFooter"
            >
              <p className="text-gray-600">
                Already have an account?{" "}
                <motion.span whileHover={{ scale: 1.05 }}>
                  <Link
                    href="/login"
                    className="text-black hover:text-white font-medium transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </motion.span>
              </p>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>

      {/* Add custom animation keyframes */}
      <style jsx global>{`
        @keyframes blobMove {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(40px, -30px);
          }
          50% {
            transform: translate(-20px, 40px);
          }
          75% {
            transform: translate(30px, 20px);
          }
        }

        @keyframes blobFloatLarge {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, -30px) scale(1.1);
          }
        }

        @keyframes blobPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        @keyframes blobSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes blobBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-40px);
          }
        }
      `}</style>
    </div>
  );
}