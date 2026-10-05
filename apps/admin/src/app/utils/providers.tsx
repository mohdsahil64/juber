"use client";

// Admin uses Wagmi + Reown AppKit (BSC only) — configured in main.tsx
// No additional wallet providers needed here
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
