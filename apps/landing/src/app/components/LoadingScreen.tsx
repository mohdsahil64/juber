import { motion } from "motion/react";
import { Shield } from "lucide-react";

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center"
    >
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-emerald-500/30 flex items-center justify-center mx-auto rounded-xl">
            <Shield className="w-12 h-12 text-emerald-500" />
          </div>

          {/* Pulse rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-4 border-emerald-500 rounded-xl"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.8, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2
            className="text-3xl text-slate-50 font-bold"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            INITIALIZING SYSTEM
          </h2>

          {/* Loading bar */}
          <div className="w-64 h-1 bg-emerald-500/20 mx-auto overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Terminal text */}
          <div className="space-y-1 text-xs font-mono text-emerald-500/70">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              &gt; Loading security protocols...
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              &gt; Connecting to blockchain...
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              &gt; Ready for deployment
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
