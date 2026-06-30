import { motion } from "motion/react";
import { Wallet, Scan, Database, FileText } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Wallet,
      title: 'CONNECT WALLET',
      description: 'Authorize read-only access to your TronLink wallet for security analysis'
    },
    {
      number: '02',
      icon: Scan,
      title: 'INITIATE SCAN',
      description: 'Start the comprehensive blockchain security scanning process'
    },
    {
      number: '03',
      icon: Database,
      title: 'ANALYZE BLOCKCHAIN',
      description: 'Deep analysis of transactions, contracts, and wallet interactions'
    },
    {
      number: '04',
      icon: FileText,
      title: 'GENERATE REPORT',
      description: 'Receive detailed security report with risk assessment and recommendations'
    }
  ];

  return (
    <div className="relative py-20 px-6">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 border border-emerald-500/50 bg-emerald-500/10 rounded-md">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-emerald-500 text-sm tracking-widest font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              OPERATION PROTOCOL
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-50 mb-4 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            HOW IT WORKS
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Four-step security verification process
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Step card */}
              <div className="border-2 border-slate-800 bg-slate-900/90 backdrop-blur-sm hover:border-emerald-500 transition-all duration-300 h-full rounded-lg overflow-hidden">
                {/* Step number header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-emerald-500/5">
                  <span className="text-emerald-500 text-xs tracking-wider font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    STEP
                  </span>
                  <span className="text-emerald-500 text-2xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {step.number}
                  </span>
                </div>

                <div className="p-6">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-2 border-emerald-500/50 flex items-center justify-center group-hover:border-emerald-500 transition-colors duration-300 rounded-lg">
                      <step.icon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <motion.div
                      className="absolute inset-0 border-2 border-emerald-500 rounded-lg"
                      initial={{ scale: 1, opacity: 0 }}
                      whileHover={{ scale: 1.1, opacity: 0.5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl text-slate-50 mb-3 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {step.description}
                  </p>
                </div>

                {/* Bottom indicator line */}
                <motion.div
                  className="h-1 bg-gradient-to-r from-emerald-500 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                />
              </div>

              {/* Arrow connector (not on last item in desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 z-20">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="text-emerald-500 text-2xl"
                  >
                    →
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="inline-block border border-emerald-500/50 bg-slate-900/80 backdrop-blur-sm px-8 py-4 rounded-lg">
            <div className="flex items-center gap-3 text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Complete scan in under 60 seconds</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
