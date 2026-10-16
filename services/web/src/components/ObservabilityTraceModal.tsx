"use client";

import React from "react";
import { CheckCircle2, Clock, X, Code, Terminal, Cpu } from "lucide-react";
import { ToolTraceStep } from "../types";

interface ObservabilityTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  toolTraceJson: string;
}

export function ObservabilityTraceModal({
  isOpen,
  onClose,
  ticketId,
  toolTraceJson
}: ObservabilityTraceModalProps) {
  if (!isOpen) return null;

  let steps: ToolTraceStep[] = [];
  try {
    steps = JSON.parse(toolTraceJson || "[]");
  } catch (e) {
    console.error("Failed to parse tool trace JSON:", e);
  }

  const totalLatency = steps.reduce((sum, s) => sum + (s.latency_ms || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#121215] border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Autonomous Agent Execution Trace</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {ticketId}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {steps.length} deterministic tools executed • {totalLatency.toFixed(1)}ms total latency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trace Waterfall List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-200">
                    {step.step_name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Step {idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-emerald-400">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>{step.latency_ms}ms</span>
                </div>
              </div>

              {/* Tool Input parameters */}
              <div className="mb-2 p-2 rounded bg-black/40 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 overflow-x-auto">
                <span className="text-zinc-500 select-none mr-2">Input:</span>
                <code>{JSON.stringify(step.tool_input)}</code>
              </div>

              {/* Tool Output Summary */}
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {step.tool_output_summary}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Deterministic Tool Calling Engine (Zero-Crash Fallback Active)
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-sans text-xs transition-colors"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
}
