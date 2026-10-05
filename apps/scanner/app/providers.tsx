"use client";

import { type ReactNode } from "react";

// No wallet provider needed - using MetaMask/window.ethereum directly for BSC
export default function Providers({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}
