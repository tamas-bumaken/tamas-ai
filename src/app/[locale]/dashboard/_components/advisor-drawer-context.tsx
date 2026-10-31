"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type AdvisorDrawerState = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const AdvisorDrawerContext = createContext<AdvisorDrawerState | null>(null);

// The Advisor drawer opens from its floating button on desktop and from the bottom navigation on phones,
// so its open state lives above both.
export function AdvisorDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AdvisorDrawerContext value={{ isOpen, setIsOpen }}>
      {children}
    </AdvisorDrawerContext>
  );
}

export function useAdvisorDrawer(): AdvisorDrawerState {
  const state = useContext(AdvisorDrawerContext);
  if (!state) {
    throw new Error(
      "useAdvisorDrawer must be used inside AdvisorDrawerProvider",
    );
  }
  return state;
}
