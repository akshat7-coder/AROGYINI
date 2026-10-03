import { createContext, useContext } from "react";

export const SosContext = createContext(null);

export function useSos() {
  const context = useContext(SosContext);
  if (!context) throw new Error("useSos must be used inside a SosProvider");
  return context;
}
