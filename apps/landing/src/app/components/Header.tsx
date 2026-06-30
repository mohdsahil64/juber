import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'SCAN', href: '#scan' },
    { label: 'FEATURES', href: '#features' },
    { label: 'HOW IT WORKS', href: '#how-it-works' },
    { label: 'TRUST', href: '#trust' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 border-2 border-emerald-500 flex items-center justify-center relative">
              <Shield className="w-6 h-6 text-emerald-500" />
              <motion.div
                className="absolute inset-0 border-2 border-emerald-500"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <div className="text-slate-50 text-sm font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                TRON SECURITY
              </div>
              <div className="text-emerald-500 text-xs tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                SCAN SYSTEM
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-300 text-sm tracking-wider relative group"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-emerald-500/30 bg-emerald-500/5">
            <motion.div
              className="w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-emerald-500 text-xs tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              ONLINE
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 border border-emerald-500/50 flex items-center justify-center hover:border-emerald-500 transition-colors duration-300"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-emerald-500" />
            ) : (
              <Menu className="w-5 h-5 text-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800 bg-slate-950"
          >
            <nav className="px-6 py-4 space-y-4">
              {navItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-slate-300 hover:text-emerald-400 transition-colors duration-300 py-2 border-l-2 border-transparent hover:border-emerald-500 pl-4"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  {item.label}
                </motion.a>
              ))}
              
              {/* Status in mobile menu */}
              <div className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30 bg-emerald-500/5 w-fit">
                <motion.div
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-emerald-500 text-xs tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  SYSTEM ONLINE
                </span>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
    </header>
  );
}
