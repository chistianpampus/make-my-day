"use client";

import React from "react";
import { CompactViewProvider } from "../contexts/CompactViewContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CompactViewProvider>
      {children}
    </CompactViewProvider>
  );
}
