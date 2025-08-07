"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { variants, springs, durations, hoverAnimations } from "@/lib/animations";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={durations.page}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/8 rounded-xl overflow-hidden shadow-2xl border backdrop-blur-md w-9/12 border-gray-800/50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={variants.hoverScale}
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-purple-400" />
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              SecCheck
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium cursor-pointer"
                whileHover={{ y: -1 }}
                transition={springs.gentle}
              >
                {item.name}
              </motion.a>
            ))}
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="cursor-pointer transition-all duration-200 transform hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                className="bg-gradient-to-r cursor-pointer from-purple-300 to-blue-400 hover:from-purple-500 hover:to-blue-600 text-white font-semibold px-6 py-2 transition-all duration-200 transform hover:scale-105"
              >
                Try for free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0,
          }}
          transition={springs.gentle}
          className="overflow-hidden md:hidden"
        >
          <div className="py-4 space-y-4 border-t border-gray-800/50">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block text-gray-300 hover:text-white transition-colors duration-200 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <Link href="/sign-in" className="block">
              <Button
                variant={"ghost"}
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Button>
            </Link>

            <Link href="/sign-up" className="block">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold mt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Try for free
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}