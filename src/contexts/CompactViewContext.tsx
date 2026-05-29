"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompactViewContextType {
  isCompact: boolean;
  toggleCompact: () => void;
}

const CompactViewContext = createContext<CompactViewContextType | undefined>(undefined);

export function CompactViewProvider({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = window.localStorage.getItem("isCompactView");
    if (stored === "true") {
      setIsCompact(true);
    }
  }, []);

  const toggleCompact = () => {
    setIsCompact((prev) => {
      const newVal = !prev;
      window.localStorage.setItem("isCompactView", String(newVal));
      return newVal;
    });
  };

  // Prevent hydration mismatch by returning children directly, but context values update after mount.
  // We can just render children. If we rely on isCompact for SSR, it defaults to false.
  return (
    <CompactViewContext.Provider value={{ isCompact: isMounted ? isCompact : false, toggleCompact }}>
      {children}
    </CompactViewContext.Provider>
  );
}

export function useCompactView() {
  const context = useContext(CompactViewContext);
  if (context === undefined) {
    throw new Error("useCompactView must be used within a CompactViewProvider");
  }
  return context;
}
