"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { GuestSide } from "@/lib/rsvpApi";

type GuestPrefs = {
  side: GuestSide | null;
  setSide: (side: GuestSide) => void;
};

const GuestPrefsContext = createContext<GuestPrefs | null>(null);

export function GuestPrefsProvider({ children }: { children: ReactNode }) {
  const [side, setSide] = useState<GuestSide | null>(null);

  return (
    <GuestPrefsContext.Provider value={{ side, setSide }}>
      {children}
    </GuestPrefsContext.Provider>
  );
}

export function useGuestPrefs(): GuestPrefs {
  const ctx = useContext(GuestPrefsContext);
  if (!ctx) {
    throw new Error("useGuestPrefs must be used within GuestPrefsProvider");
  }
  return ctx;
}
