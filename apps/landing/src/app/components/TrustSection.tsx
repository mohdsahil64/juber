import { motion } from "motion/react";
import { ShieldCheck, Lock, Eye, Server } from "lucide-react";

export function TrustSection() {
  const trustItems = [
    {
      icon: Eye,
      title: 'READ-ONLY ACCESS',
      description: 'We only request read permissions. No transactions can be executed.'
    },
    {
      icon: Lock,
      title: 'NO PRIVATE KEY REQUIRED',
      description: 'Your private keys remain secure in your wallet at all times.'
    },
    {
      icon: Server,
      title: 'NON-CUSTODIAL SYSTEM',
      description: 'You maintain complete control over your assets. Always.'
    },
    {
      icon: ShieldCheck,
      title: 'ZERO TRUST ARCHITECTURE',
      description: 'Security verification without compromising your wallet security.'
    }
  ];

  return (
    <div className="relative py-20 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 border border-emerald-500/50 bg-emerald-500/10 rounded-md">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-sm tracking-widest font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              SECURITY VERIFICATION
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-50 mb-4 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            TRUST & TRANSPARENCY
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Your security is our priority. Learn how we protect your assets.
          </p>
        </motion.div>

        {/* Trust Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="border-2 border-slate-800 bg-slate-900/80 backdrop-blur-sm hover:border-emerald-500 transition-all duration-300 p-8 rounded-lg">
                {/* Checkmark indicator */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center rounded-lg">
                      <item.icon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 flex items-center justify-center rounded-full"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <span className="text-slate-950 text-xs font-bold">✓</span>
                    </motion.div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl text-slate-50 mb-2 group-hover:text-emerald-400 transition-colors duration-300 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.title}
                    </h3>
                    <p className="text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Pulse effect on hover */}
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none"
                  initial={{ opacity: 0, scale: 1 }}
                  whileHover={{ opacity: [0, 0.3, 0], scale: [1, 1.02, 1] }}
                  transition={{ duration: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 border-2 border-emerald-500 bg-emerald-500/5 p-8 relative overflow-hidden rounded-xl"
        >
          {/* Animated corner accent */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-emerald-500"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-emerald-500" />
              <h3 className="text-2xl text-slate-50 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                SECURITY GUARANTEE
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Our security scan operates entirely on read-only access. We cannot and will never request your private keys, 
              seed phrases, or the ability to execute transactions. Your wallet remains completely under your control.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
              {['NO TRANSACTION SIGNING', 'NO FUND ACCESS', 'NO DATA STORAGE'].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-emerald-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
