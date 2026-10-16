"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Activity, 
  Layers, 
  ClipboardCheck, 
  Boxes, 
  Flame, 
  Radio, 
  RotateCcw,
  Cpu
} from "lucide-react";
import { simulateDegradation, simulateNoise, resetSimulation } from "../lib/api";
import { useMachine } from "../lib/MachineContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMachine?: (machineId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectMachine }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { setSelectedMachineId } = useMachine();

  const handleSelectMachine = (id: string) => {
    setSelectedMachineId(id);
    onSelectMachine?.(id);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const actions = [
    // Navigation
    { id: "nav-cmd", title: "Go to Command Center", icon: Activity, group: "Navigation", run: () => router.push("/") },
    { id: "nav-assets", title: "Go to Asset Ontology & Digital Twin", icon: Layers, group: "Navigation", run: () => router.push("/assets") },
    { id: "nav-wo", title: "Go to Work Orders & HITL Queue", icon: ClipboardCheck, group: "Navigation", run: () => router.push("/work-orders") },
    { id: "nav-erp", title: "Go to ERP Parts & OEM Manuals", icon: Boxes, group: "Navigation", run: () => router.push("/inventory") },

    // Machines
    { id: "mach-cnc", title: "Select Haas VF-2 (CNC_04)", icon: Cpu, group: "Machines", run: () => handleSelectMachine("CNC_04") },
    { id: "mach-press", title: "Select Schuler 500T (PRESS_02)", icon: Cpu, group: "Machines", run: () => handleSelectMachine("PRESS_02") },
    { id: "mach-robot", title: "Select Fanuc M-20iA (ROBOT_09)", icon: Cpu, group: "Machines", run: () => handleSelectMachine("ROBOT_09") },
    { id: "mach-pack", title: "Select Bosch Wrapper (PACK_01)", icon: Cpu, group: "Machines", run: () => handleSelectMachine("PACK_01") },

    // Simulations
    { id: "sim-fail-cnc", title: "Simulate Bearing Failure on Haas VF-2", icon: Flame, group: "Simulations", run: async () => { await simulateDegradation("CNC_04"); } },
    { id: "sim-noise-cnc", title: "Inject Transient Sensor Noise on Haas VF-2", icon: Radio, group: "Simulations", run: async () => { await simulateNoise("CNC_04"); } },
    { id: "sim-reset-all", title: "Reset All Machine Baselines", icon: RotateCcw, group: "Simulations", run: async () => { await resetSimulation("CNC_04"); await resetSimulation("PRESS_02"); } }
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.group.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-[#121215] border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 mr-3" />
          <input
            type="text"
            placeholder="Type a command, jump to view, or trigger simulation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-3.5 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No matching commands found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400" />
                    </div>
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
