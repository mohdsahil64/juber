import { motion } from "motion/react";
import { Shield, Terminal, Github, Twitter, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t-2 border-emerald-500/30 bg-slate-950 py-12 px-6">
      {/* Top border glow effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-emerald-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-slate-50 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  TRON SECURITY
                </div>
                <div className="text-emerald-500 text-xs tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  SCAN SYSTEM
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Advanced blockchain security verification platform for USDT TRC20 wallets.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-emerald-500 text-sm mb-4 tracking-wider font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              QUICK ACCESS
            </h4>
            <ul className="space-y-2">
              {['Security Scan', 'How It Works', 'Trust & Safety', 'Documentation'].map((link, i) => (
                <li key={i}>
                  <a 
                    href="#" 
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-300 text-sm flex items-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Terminal className="w-3 h-3" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* System Status */}
          <div>
            <h4 className="text-emerald-500 text-sm mb-4 tracking-wider font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              SYSTEM STATUS
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Network', status: 'ONLINE' },
                { label: 'Scan Engine', status: 'ACTIVE' },
                { label: 'Database', status: 'CONNECTED' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-emerald-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <span className="text-emerald-500 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="text-emerald-500">© 2026</span> TRON Security Scan. All systems operational.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {[
              { icon: Github, label: 'GitHub' },
              { icon: Twitter, label: 'Twitter' },
              { icon: MessageCircle, label: 'Discord' }
            ].map((social, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-center transition-all duration-300 group"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-500" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Terminal-style bottom text */}
        <div className="mt-8 text-center">
          <div className="inline-block border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 rounded-md">
            <div className="flex items-center gap-2 text-emerald-400/60 text-xs font-mono">
              <span className="text-emerald-400">&gt;</span>
              <span>secure_scan_v2.1.0 | ready_for_deployment</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
