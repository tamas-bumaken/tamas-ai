"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type AdvisorDrawerState = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  // A message the drawer should send as soon as it opens, e.g. from an AI suggestion card.
  pendingMessage: string | null;
  setPendingMessage: (message: string | null) => void;
};

const AdvisorDrawerContext = createContext<AdvisorDrawerState | null>(null);

// The Advisor drawer opens from its floating button on desktop and from the bottom navigation on phones,
// so its open state lives above both.
export function AdvisorDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  return (
    <AdvisorDrawerContext
      value={{ isOpen, setIsOpen, pendingMessage, setPendingMessage }}
    >
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
