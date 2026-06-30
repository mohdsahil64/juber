import { motion, AnimatePresence } from "motion/react";
import { Activity, AlertCircle, Shield, Search, Database, FileWarning } from "lucide-react";
import { useState, useEffect } from "react";

interface ScannerUIProps {
  isScanning: boolean;
  onScanComplete: (results: ScanResults) => void;
}

export interface ScanResults {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  vulnerabilities: number;
  transactionRisk: number;
  contractExposure: number;
  tokenApprovals: number;
  suspiciousActivity: number;
}

export function ScannerUI({ isScanning, onScanComplete }: ScannerUIProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const scanLogs = [
    'Initializing security protocols...',
    'Connecting to TRON blockchain...',
    'Scanning transaction history...',
    'Analyzing smart contract interactions...',
    'Checking token approvals...',
    'Detecting anomalies...',
    'Cross-referencing threat database...',
    'Evaluating risk patterns...',
    'Generating security report...',
    'Scan complete.'
  ];

  useEffect(() => {
    if (isScanning) {
      setScanProgress(0);
      setLogs([]);
      let logIndex = 0;
      let progress = 0;

      const logInterval = setInterval(() => {
        if (logIndex < scanLogs.length) {
          setCurrentLog(scanLogs[logIndex]);
          setLogs(prev => [...prev, scanLogs[logIndex]]);
          logIndex++;
        }
      }, 800);

      const progressInterval = setInterval(() => {
        progress += 1;
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
          clearInterval(logInterval);
          
          // Generate mock results
          setTimeout(() => {
            const mockResults: ScanResults = {
              riskLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
              score: Math.floor(Math.random() * 30) + 70,
              vulnerabilities: Math.floor(Math.random() * 5),
              transactionRisk: Math.floor(Math.random() * 100),
              contractExposure: Math.floor(Math.random() * 100),
              tokenApprovals: Math.floor(Math.random() * 15),
              suspiciousActivity: Math.floor(Math.random() * 3)
            };
            onScanComplete(mockResults);
          }, 1000);
        }
      }, 80);

      return () => {
        clearInterval(logInterval);
        clearInterval(progressInterval);
      };
    }
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Main scanner panel */}
          <div className="border-2 border-emerald-500 bg-slate-900/95 backdrop-blur-sm overflow-hidden rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-500 text-lg tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  SECURITY SCAN PANEL
                </span>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Search className="w-5 h-5 text-emerald-400" />
              </motion.div>
            </div>

            {/* Scanning animation bar */}
            <div className="relative h-2 bg-slate-950">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-y-0 w-1 bg-white"
                animate={{ left: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-8">
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-8">
                <div className="text-slate-50 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  SCAN PROGRESS
                </div>
                <div className="text-3xl text-emerald-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {scanProgress}%
                </div>
              </div>

              {/* Terminal logs */}
              <div className="border border-emerald-500/30 bg-slate-950 p-6 min-h-[300px] font-mono text-sm rounded-md">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 mb-2"
                  >
                    <span className="text-emerald-400">&gt;</span>
                    <span className="text-slate-300">{log}</span>
                  </motion.div>
                ))}
                {currentLog && (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-emerald-400">&gt;</span>
                    <span className="text-emerald-500">{currentLog}_</span>
                  </motion.div>
                )}
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: Shield, label: 'TRANSACTIONS', active: scanProgress > 20 },
                  { icon: Database, label: 'CONTRACTS', active: scanProgress > 40 },
                  { icon: FileWarning, label: 'APPROVALS', active: scanProgress > 60 },
                  { icon: AlertCircle, label: 'THREATS', active: scanProgress > 80 }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`border ${item.active ? 'border-emerald-500 bg-emerald-500/5' : 'border-emerald-500/20'} p-4 transition-all duration-300 rounded-md`}
                  >
                    <item.icon className={`w-6 h-6 mb-2 ${item.active ? 'text-emerald-500' : 'text-emerald-500/30'}`} />
                    <div className={`text-xs tracking-wider font-semibold ${item.active ? 'text-slate-50' : 'text-slate-500'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scanning glow effect */}
          <motion.div
            className="absolute inset-0 border-2 border-emerald-500 pointer-events-none rounded-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: 'blur(8px)' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
