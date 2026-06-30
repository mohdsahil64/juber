import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, Shield, FileWarning, Activity, CheckCircle2, XCircle } from "lucide-react";
import { ScanResults } from "./ScannerUI";

interface ResultsDashboardProps {
  results: ScanResults | null;
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  if (!results) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#10b981'; // emerald-500
      case 'MEDIUM': return '#fbbf24'; // amber-400
      case 'HIGH': return '#ef4444'; // red-500
      case 'CRITICAL': return '#dc2626'; // red-600
      default: return '#f8fafc'; // slate-50
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return CheckCircle2;
      case 'MEDIUM': return AlertTriangle;
      case 'HIGH': return XCircle;
      case 'CRITICAL': return AlertTriangle;
      default: return Shield;
    }
  };

  const RiskIcon = getRiskIcon(results.riskLevel);
  const riskColor = getRiskColor(results.riskLevel);

  return (
    <div className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main result header */}
          <div className="border-2 border-emerald-500 bg-slate-900/95 backdrop-blur-sm mb-8 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-emerald-500/10">
              <span className="text-emerald-500 text-lg tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                SECURITY ANALYSIS COMPLETE
              </span>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Risk Level */}
                <div className="relative">
                  <div className="text-slate-400 text-sm mb-3 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    RISK LEVEL
                  </div>
                  <div className="flex items-center gap-4">
                    <RiskIcon className="w-12 h-12" style={{ color: riskColor }} />
                    <div>
                      <div className="text-5xl tracking-tight font-bold" style={{ fontFamily: 'Inter, sans-serif', color: riskColor }}>
                        {results.riskLevel}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                    style={{ backgroundColor: riskColor }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>

                {/* Security Score */}
                <div className="relative">
                  <div className="text-slate-400 text-sm mb-3 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    SECURITY SCORE
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#1e293b" // slate-800
                          strokeWidth="6"
                          fill="none"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={riskColor}
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - results.score / 100) }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-2xl text-slate-50 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {results.score}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-50 text-lg font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Out of 100
                      </div>
                      <div className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {results.vulnerabilities} vulnerabilities found
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard grid panels */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Transaction Risk */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-slate-800 bg-slate-900/90 backdrop-blur-sm relative overflow-hidden rounded-lg"
            >
              <div className="border-l-4 border-emerald-500 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-50 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        TRANSACTION RISK
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Historical transaction analysis
                    </div>
                  </div>
                  <div className="text-3xl text-emerald-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {results.transactionRisk}%
                  </div>
                </div>
                <div className="h-2 bg-slate-800 relative overflow-hidden rounded-full">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${results.transactionRisk}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Smart Contract Exposure */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-slate-800 bg-slate-900/90 backdrop-blur-sm relative overflow-hidden rounded-lg"
            >
              <div className="border-l-4 border-sky-500 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-sky-400" />
                      <span className="text-slate-50 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        CONTRACT EXPOSURE
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Smart contract interactions
                    </div>
                  </div>
                  <div className="text-3xl text-sky-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {results.contractExposure}%
                  </div>
                </div>
                <div className="h-2 bg-slate-800 relative overflow-hidden rounded-full">
                  <motion.div
                    className="h-full bg-gradient-to-r from-sky-600 to-sky-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${results.contractExposure}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Token Security */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-slate-800 bg-slate-900/90 backdrop-blur-sm relative overflow-hidden rounded-lg"
            >
              <div className="border-l-4 border-emerald-500 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-50 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        TOKEN SECURITY
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Token security checked
                    </div>
                  </div>
                  <div className="text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
                <div className="text-emerald-500/80 text-xs mt-3 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Verified, everything is fine
                </div>
              </div>
            </motion.div>

            {/* Suspicious Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-slate-800 bg-slate-900/90 backdrop-blur-sm relative overflow-hidden rounded-lg"
            >
              <div className="border-l-4 border-rose-500 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span className="text-slate-50 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        SUSPICIOUS ACTIVITY
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Anomaly detection results
                    </div>
                  </div>
                  <div className="text-3xl text-rose-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {results.suspiciousActivity}
                  </div>
                </div>
                <div className="text-slate-500 text-xs mt-3 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Potential threats identified
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
