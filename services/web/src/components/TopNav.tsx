"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Flame, 
  Radio, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Menu,
  Volume2,
  VolumeX,
  Volume1
} from "lucide-react";
import { simulateDegradation, simulateNoise, resetSimulation } from "../lib/api";
import { useMachine } from "../lib/MachineContext";
import { soundEngine } from "../lib/soundEffects";

interface TopNavProps {
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar?: () => void;
  selectedMachineId?: string;
  onSelectMachineId?: (id: string) => void;
  isSseConnected?: boolean;
}

export function TopNav({
  onOpenCommandPalette,
  onToggleMobileSidebar,
  selectedMachineId: propMachineId,
  onSelectMachineId: propSetMachineId,
  isSseConnected = true
}: TopNavProps) {
  const machineContext = useMachine();
  const selectedMachineId = propMachineId || machineContext.selectedMachineId;
  const setSelectedMachineId = propSetMachineId || machineContext.setSelectedMachineId;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "warning" } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    setIsAudioMuted(soundEngine.isMuted);
  }, []);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsAudioMuted(muted);
    showToast(
      muted ? "Audio Simulation Muted" : "Audio Simulation Active",
      muted ? "Acoustic motor noise muted." : "Playing real-time mechanical friction & electrical crackle sounds.",
      "success"
    );
  };

  const showToast = (title: string, desc: string, type: "success" | "warning" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSimulateDegradation = async () => {
    setLoadingAction("degradation");
    // Play acoustic bearing rumble sound immediately!
    soundEngine.playBearingFailure();
    try {
      const res = await simulateDegradation(selectedMachineId);
      showToast(
        "Degradation Curve Initiated",
        `Vibration and heat escalating on ${selectedMachineId}. Rolling window will breach 3σ anomaly threshold.`,
        "warning"
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateNoise = async () => {
    setLoadingAction("noise");
    // Play acoustic electrical spark crackle sound immediately!
    soundEngine.playSensorNoise();
    try {
      const res = await simulateNoise(selectedMachineId);
      showToast(
        "Sensor Noise Injected (1-Tick)",
        `Transient electrical spike injected on ${selectedMachineId}. Rolling Z-score filter rejected it as FILTERED_NOISE.`,
        "success"
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetSimulation = async () => {
    setLoadingAction("reset");
    soundEngine.playResetSound();
    try {
      await resetSimulation(selectedMachineId);
      showToast("Telemetry Normalized", `${selectedMachineId} returned to nominal baseline.`, "success");
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <header className="min-h-16 border-b border-[#27272A] bg-[#09090B]/95 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-0 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 select-none">
        {/* Left: Hamburger (Mobile) + Plant Location + Target Selector */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Mobile Sidebar Hamburger Toggle */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs">
            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="font-semibold text-zinc-200">Austin Gigafactory</span>
            <span className="text-zinc-600 hidden md:inline">/</span>
            <span className="text-emerald-400 font-mono font-medium hidden md:inline">Line B</span>
          </div>

          {/* Machine Target Selector */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span className="hidden sm:inline">Target:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
            >
              <option value="CNC_04">CNC_04 (Haas VF-2)</option>
              <option value="PRESS_02">PRESS_02 (Schuler 500T)</option>
              <option value="ROBOT_09">ROBOT_09 (Fanuc M-20iA)</option>
              <option value="PACK_01">PACK_01 (Bosch Wrapper)</option>
            </select>
          </div>
        </div>

        {/* Center/Right: Interactive Simulation Trigger Bar + Audio Toggle + Cmd+K */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Audio Simulator Acoustic Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all active:scale-95 ${
              isAudioMuted
                ? "bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                : "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-950/50"
            }`}
            title={isAudioMuted ? "Sound Muted (Click to enable motor & electrical sounds)" : "Audio Simulator Active (Click to mute)"}
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            )}
            <span className="hidden md:inline">{isAudioMuted ? "Audio: Mute" : "Audio: ON"}</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
            {/* Degradation Trigger */}
            <button
              onClick={handleSimulateDegradation}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-all active:scale-95 disabled:opacity-50"
              title="Progressive vibration and thermal climb with mechanical rumble sound"
            >
              {loadingAction === "degradation" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Flame className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">Simulate Bearing Failure</span>
              <span className="sm:hidden">Failure</span>
            </button>

            {/* Noise Spike Trigger */}
            <button
              onClick={handleSimulateNoise}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all active:scale-95 disabled:opacity-50"
              title="1-tick electrical spike with static crackle sound that rolling filter rejects"
            >
              {loadingAction === "noise" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">Inject Sensor Noise</span>
              <span className="sm:hidden">Noise</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetSimulation}
              disabled={loadingAction !== null}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors active:scale-95 disabled:opacity-50"
              title="Reset machine to nominal baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cmd+K Search trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 transition-colors group"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
            <span className="hidden md:inline">Quick Jump</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300 hidden sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* SSE Feed Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isSseConnected ? "LIVE SSE" : "OFFLINE"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Tactical Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md w-full px-4 sm:px-0">
          <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${
            toastMessage.type === "warning"
              ? "bg-[#181113]/95 border-rose-500/40 text-rose-200 shadow-rose-950/50"
              : "bg-[#0C1713]/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50"
          }`}>
            <div className="flex items-start gap-3">
              {toastMessage.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold tracking-tight text-white">{toastMessage.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">{toastMessage.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
