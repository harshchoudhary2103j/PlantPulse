"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  Terminal, 
  ChevronRight, 
  Layers,
  ArrowUpRight,
  Volume2
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { MachineAsset, MaintenanceTicket, TelemetryReading } from "../types";
import { fetchAssets, fetchTickets, fetchTelemetryHistory } from "../lib/api";
import { HitlDrawer } from "../components/HitlDrawer";
import { ObservabilityTraceModal } from "../components/ObservabilityTraceModal";
import { useMachine } from "../lib/MachineContext";
import { soundEngine } from "../lib/soundEffects";

export default function CommandCenter() {
  const [assets, setAssets] = useState<MachineAsset[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const { selectedMachineId, setSelectedMachineId } = useMachine();
  const [telemetrySeries, setTelemetrySeries] = useState<any[]>([]);
  const [noiseFilterLogs, setNoiseFilterLogs] = useState<any[]>([]);
  
  // Modals & Drawers
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [traceModalState, setTraceModalState] = useState<{ isOpen: boolean; ticketId: string; json: string }>({
    isOpen: false,
    ticketId: "",
    json: "[]"
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [fetchedAssets, fetchedTickets] = await Promise.all([
        fetchAssets(),
        fetchTickets()
      ]);
      setAssets(fetchedAssets);
      setTickets(fetchedTickets);

      // Preload history for selected machine
      const history = await fetchTelemetryHistory(selectedMachineId, 30);
      if (history.length > 0) {
        setTelemetrySeries(
          history.map((h: any) => ({
            time: h.timestamp ? h.timestamp.split("T")[1]?.slice(0, 8) : "--:--:--",
            vibration: h.vibration_mm_s,
            temp: h.spindle_temp_c,
            current: h.motor_current_amps,
            rpm: h.rpm
          }))
        );
      }
    }
    loadData();
  }, [selectedMachineId]);

  // Connect to live Server-Sent Events (SSE) feed
  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/v1/stream/telemetry`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("telemetry", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === "telemetry_tick") {
          const readings: TelemetryReading[] = payload.data.readings;
          
          // Check for noise filter events to log
          readings.forEach((r) => {
            if (r.classification === "FILTERED_NOISE") {
              setNoiseFilterLogs((prev) => [
                {
                  id: Math.random().toString(),
                  machine_id: r.machine_id,
                  time: new Date().toLocaleTimeString(),
                  details: r.details,
                  score: r.anomaly_score
                },
                ...prev.slice(0, 5)
              ]);
            }
          });

          // Update chart buffer if reading matches selected machine
          const targetReading = readings.find((r) => r.machine_id === selectedMachineId);
          if (targetReading) {
            const timeStr = new Date().toLocaleTimeString();
            setTelemetrySeries((prev) => {
              const updated = [
                ...prev,
                {
                  time: timeStr,
                  vibration: targetReading.vibration_mm_s,
                  temp: targetReading.spindle_temp_c,
                  current: targetReading.motor_current_amps,
                  rpm: targetReading.rpm
                }
              ];
              return updated.slice(-35); // Keep rolling 35 points
            });

            // Update asset in local state
            setAssets((prevAssets) =>
              prevAssets.map((a) =>
                a.id === targetReading.machine_id
                  ? {
                      ...a,
                      current_vibration: targetReading.vibration_mm_s,
                      current_temp: targetReading.spindle_temp_c,
                      current_current: targetReading.motor_current_amps,
                      current_rpm: targetReading.rpm,
                      status:
                        targetReading.classification === "ANOMALY_TRIGGER"
                          ? "CRITICAL"
                          : targetReading.classification === "WARNING"
                          ? "WARNING"
                          : a.status === "CRITICAL"
                          ? "CRITICAL"
                          : "HEALTHY"
                    }
                  : a
              )
            );
          }
        } else if (payload.event === "agent_investigation_complete") {
          // Play acoustic warning ping when agent creates diagnostic ticket
          soundEngine.playAlertPing();
          // New ticket generated by agent
          fetchTickets().then((fresh) => setTickets(fresh));
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [selectedMachineId]);

  // Derived KPI figures
  const totalProjectedSavings = tickets.reduce((sum, t) => sum + (t.net_roi_savings || 0), 0);
  const activeAlertsCount = assets.filter((a) => a.status === "CRITICAL" || a.status === "WARNING").length;
  const selectedAsset = assets.find((a) => a.id === selectedMachineId) || assets[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Plant OEE */}
        <div className="glow-card p-5 rounded-2xl border border-zinc-800 bg-[#121215]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Plant Overall OEE</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">89.4%</span>
            <span className="text-xs font-mono text-emerald-400">+2.1% vs baseline</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Austin Gigafactory Line B benchmark</p>
        </div>

        {/* Active Alerts */}
        <div className="glow-card p-5 rounded-2xl border border-zinc-800 bg-[#121215]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Anomalies</span>
            <AlertTriangle className={`w-4 h-4 ${activeAlertsCount > 0 ? "text-rose-400" : "text-emerald-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{activeAlertsCount}</span>
            <span className={`text-xs font-mono ${activeAlertsCount > 0 ? "text-rose-400" : "text-zinc-500"}`}>
              {activeAlertsCount > 0 ? "Threshold breached" : "All lines normal"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Rolling 3-sigma statistical envelope</p>
        </div>

        {/* Projected Savings ROI */}
        <div className="glow-card p-5 rounded-2xl border border-zinc-800 bg-[#121215]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Cost Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">
              ${totalProjectedSavings.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-mono text-emerald-400/80">Net ROI</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Catastrophic downtime prevented</p>
        </div>

        {/* Fleet MTTR */}
        <div className="glow-card p-5 rounded-2xl border border-zinc-800 bg-[#121215]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Mean MTTR</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">2.2 hrs</span>
            <span className="text-xs font-mono text-cyan-400">-45m with AI spec</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Average time to repair resolution</p>
        </div>
      </div>

      {/* Machine Selection Grid (Entity Resolution Identity Display) */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {assets.map((asset) => {
          const isSelected = asset.id === selectedMachineId;
          const isCritical = asset.status === "CRITICAL";
          const isWarning = asset.status === "WARNING";
          return (
            <div
              key={asset.id}
              onClick={() => setSelectedMachineId(asset.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden select-none flex flex-col justify-between ${
                isSelected
                  ? "bg-zinc-800/90 border-emerald-500/80 shadow-lg shadow-black/50 ring-1 ring-emerald-500/50"
                  : "bg-[#121215] border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-white shrink-0">{asset.id}</span>
                      <span className="text-[10px] font-mono text-zinc-400">({asset.model})</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 break-words mt-0.5 line-clamp-1" title={asset.line}>{asset.line}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isCritical
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      : isWarning
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {asset.status}
                  </span>
                </div>

                {/* Resolved Cross-Silo Identity */}
                <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800/90 font-mono text-[10px] text-zinc-400 space-y-1.5 mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">SAP ERP:</span>
                    <span className="text-zinc-200 font-semibold font-mono break-all text-right" title={asset.erp_asset_id}>{asset.erp_asset_id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">ServiceNow:</span>
                    <span className="text-zinc-200 font-semibold font-mono break-all text-right" title={asset.cmms_asset_id}>{asset.cmms_asset_id}</span>
                  </div>
                </div>
              </div>

              {/* Live Metric Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-2.5 border-t border-zinc-800/80">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-zinc-400 text-[11px]">Vib: <strong className="text-white">{asset.current_vibration?.toFixed(2)}</strong> mm/s</span>
                  <span className="text-zinc-400 text-[11px]">Temp: <strong className="text-white">{asset.current_temp?.toFixed(1)}</strong>°C</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] text-zinc-500 uppercase">Health</span>
                  <span className="text-emerald-400 font-bold text-xs">{asset.health_score?.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Command Center Bento: Live Recharts Graph & Agent HITL Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-Time Telemetry Stream Charts */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glow-card p-6 rounded-2xl border border-zinc-800 bg-[#121215]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">
                    Live Telemetry Stream — {selectedAsset?.name || selectedMachineId}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                    2s Ticks
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Real-time RMS vibration velocity vs. 2.80 mm/s ISO-10816 3-sigma anomaly threshold
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Vibration (mm/s)</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Temp (°C)</span>
                </div>
              </div>
            </div>

            {/* Recharts Live Line Graph */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetrySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222226" />
                  <XAxis dataKey="time" stroke="#52525B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#52525B" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121215",
                      borderColor: "#27272A",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontFamily: "monospace"
                    }}
                  />
                  <ReferenceLine
                    y={2.8}
                    stroke="#F43F5E"
                    strokeDasharray="4 4"
                    label={{ value: "3σ Anomaly Threshold (2.8 mm/s)", fill: "#F43F5E", fontSize: 10, position: "top" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#06B6D4"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rolling Z-Score Noise Filter Terminal Ribbon */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0C0C0E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono font-semibold text-zinc-300">
                  Rolling Z-Score Noise Filter Log
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  ACTIVE
                </span>
                <button
                  onClick={() => soundEngine.playSensorNoise()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 text-[10px] text-cyan-300 font-mono transition-colors active:scale-95 ml-1"
                  title="Audible preview of electrical sensor static noise"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>Play Noise Audio</span>
                </button>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Auto-rejecting 1-tick electrical glitches</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[11px]">
              {noiseFilterLogs.length === 0 ? (
                <div className="text-zinc-600 text-xs py-1">
                  &gt; Filter listening... No transient noise spikes detected. (Click [Inject Sensor Noise] to test rejection).
                </div>
              ) : (
                noiseFilterLogs.map((log) => (
                  <div key={log.id} className="text-zinc-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold select-none">[FILTERED_NOISE]</span>
                    <span className="text-zinc-500">{log.time}</span>
                    <span className="text-emerald-400 font-semibold">{log.machine_id}:</span>
                    <span className="text-zinc-400">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Autonomous Agent Investigation Feed & HITL Queue */}
        <div className="space-y-4">
          <div className="glow-card p-5 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">AI Diagnostic HITL Feed</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {tickets.filter(t => t.status === "PENDING_HUMAN_APPROVAL").length} Pending Gate
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px]">
              {tickets.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
                  <Cpu className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No open diagnostic tickets.</p>
                  <p className="text-[11px] text-zinc-600">
                    Click <strong>[Simulate Bearing Failure]</strong> above to trigger sustained degradation and wake the AI agent.
                  </p>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const isApproved = ticket.status === "APPROVED";
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setIsDrawerOpen(true);
                      }}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer group space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          isApproved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{ticket.id}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                        {ticket.title}
                      </h4>

                      {/* ROI Preview */}
                      <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-500">Net ROI Savings:</span>
                        <span className="text-emerald-400 font-bold">
                          +${ticket.net_roi_savings.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-400 pt-1">
                        <span className="truncate max-w-[150px] sm:max-w-none font-mono text-zinc-500">
                          SKU: {ticket.recommended_part_sku}
                        </span>
                        <span className="text-emerald-400 text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ml-auto">
                          Review ↗
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Over HITL Drawer */}
      <HitlDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTicketApproved={(updated) => {
          setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setSelectedTicket(updated);
          fetchAssets().then((fresh) => setAssets(fresh));
        }}
        onOpenTrace={(tId, traceJson) => {
          setTraceModalState({
            isOpen: true,
            ticketId: tId,
            json: traceJson
          });
        }}
      />

      {/* Observability Trace Modal */}
      <ObservabilityTraceModal
        isOpen={traceModalState.isOpen}
        onClose={() => setTraceModalState({ isOpen: false, ticketId: "", json: "[]" })}
        ticketId={traceModalState.ticketId}
        toolTraceJson={traceModalState.json}
      />
    </div>
  );
}
