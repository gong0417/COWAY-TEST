import { createContext, useContext, type ReactNode } from "react";
import { useReliabilityData } from "@/hooks/useReliabilityData";

type Value = ReturnType<typeof useReliabilityData>;

const ReliabilityDataContext = createContext<Value | null>(null);

export function ReliabilityDataProvider({ children }: { children: ReactNode }) {
  const value = useReliabilityData();
  return (
    <ReliabilityDataContext.Provider value={value}>
      {children}
    </ReliabilityDataContext.Provider>
  );
}

export function useReliabilityDataContext() {
  const ctx = useContext(ReliabilityDataContext);
  if (!ctx)
    throw new Error(
      "useReliabilityDataContext must be used within ReliabilityDataProvider",
    );
  return ctx;
}
