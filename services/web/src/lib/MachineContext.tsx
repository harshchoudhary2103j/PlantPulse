"use client";

import React, { createContext, useContext, useState } from "react";

interface MachineContextType {
  selectedMachineId: string;
  setSelectedMachineId: (id: string) => void;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("CNC_04");

  return (
    <MachineContext.Provider value={{ selectedMachineId, setSelectedMachineId }}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine() {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error("useMachine must be used within a MachineProvider");
  }
  return context;
}
