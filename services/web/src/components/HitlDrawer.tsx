"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Package, 
  DollarSign, 
  Terminal, 
  Clock, 
  ShieldCheck,
  TrendingDown,
  Loader2,
  Check
} from "lucide-react";
import { MaintenanceTicket } from "../types";
import { approveTicket } from "../lib/api";
import { soundEngine } from "../lib/soundEffects";

interface HitlDrawerProps {
  ticket: MaintenanceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketApproved: (ticket: MaintenanceTicket) => void;
  onOpenTrace: (ticketId: string, traceJson: string) => void;
}

export function HitlDrawer({
  ticket,
  isOpen,
  onClose,
  onTicketApproved,
  onOpenTrace
}: HitlDrawerProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  if (!isOpen || !ticket) return null;

  const isAlreadyApproved = ticket.status === "APPROVED";

  const handleApprove = async () => {
    if (isAlreadyApproved || isApproving) return;
    setIsApproving(true);
    try {
      const res = await approveTicket(ticket.id, "Plant Chief Engineer (Austin Line B)");
      soundEngine.playApprovalChime();
      setApprovalSuccess(true);
      const updatedTicket: MaintenanceTicket = {
        ...ticket,
        status: "APPROVED",
        approved_by: "Plant Chief Engineer (Austin Line B)",
        approved_at: new Date().toISOString()
      };
      onTicketApproved(updatedTicket);
      setTimeout(() => {
        setApprovalSuccess(false);
      }, 3000);
    } catch (e) {
      console.error("Failed to approve ticket:", e);
    } finally {
      setIsApproving(false);
    }
  };

  const plannedCost = ticket.planned_downtime_cost || 10645;
  const catastrophicCost = ticket.unplanned_catastrophic_cost || 67338;
  const netSavings = ticket.net_roi_savings || (catastrophicCost - plannedCost);
  const plannedRatio = Math.round((plannedCost / catastrophicCost) * 100);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-full sm:max-w-xl bg-[#0E0E12] border-l border-zinc-800 h-full flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-800 bg-[#121216] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                isAlreadyApproved || approvalSuccess
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse"
              }`}>
                {approvalSuccess || isAlreadyApproved ? "APPROVED & DISPATCHED" : "PENDING HUMAN APPROVAL"}
              </span>
              <span className="text-xs font-mono text-zinc-400">{ticket.id}</span>
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Financial Cost-of-Downtime ROI Visual Comparison Card */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Financial ROI & Downtime Analysis
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">Net Projected Savings</span>
                <p className="text-base font-mono font-bold text-emerald-400">
                  +${netSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Visual ROI Comparative Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Planned Repair: ${plannedCost.toLocaleString()}</span>
                <span className="text-rose-400">Unplanned Failure: ${catastrophicCost.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${Math.max(10, plannedRatio)}%` }}
                  title="Planned Repair Cost"
                />
                <div 
                  className="bg-rose-500/80 transition-all duration-500 flex-1" 
                  title="Prevented Catastrophic Cost"
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
                <span>{ticket.estimated_repair_hours}h MTTR @ ${ticket.hourly_downtime_rate}/hr</span>
                <span>12h Outage + $15k Secondary Damage</span>
              </div>
            </div>
          </div>

          {/* Suspected Root Cause & Diagnosis */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Diagnostic Finding
            </h4>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
              <p className="text-zinc-200 leading-relaxed font-sans">
                {ticket.suspected_root_cause}
              </p>
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
                <span className="text-emerald-400 font-semibold">Recommended Action: </span>
                {ticket.recommended_action}
              </div>
            </div>
          </div>

          {/* Cited OEM Manual Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  OEM Technical Manual Citation
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Page {ticket.cited_manual_page}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/40 space-y-2">
              <div className="text-xs font-semibold text-cyan-200">
                {ticket.cited_manual_title} — <span className="font-mono text-cyan-300">{ticket.cited_manual_section}</span>
              </div>
              <p className="text-xs text-zinc-300 italic leading-relaxed border-l-2 border-cyan-500 pl-3">
                &ldquo;{ticket.manual_excerpt}&rdquo;
              </p>
            </div>
          </div>

          {/* ERP Spare Part Stock Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ERP Spare Part Inventory Lock
              </h4>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">{ticket.part_sku_name}</div>
                <div className="text-[11px] font-mono text-zinc-400">
                  SKU: <span className="text-amber-400">{ticket.recommended_part_sku}</span> • Unit Cost: ${ticket.part_unit_cost.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Warehouse Bin</span>
                <p className="text-xs font-mono font-semibold text-zinc-200">BIN-A-12-04</p>
              </div>
            </div>
          </div>

          {/* Agent Observability Trace Trigger */}
          <button
            onClick={() => onOpenTrace(ticket.id, ticket.tool_trace)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Inspect Agent Tool Latency Waterfall</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-emerald-400">
              4 Tools Logged ↗
            </span>
          </button>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-6 border-t border-zinc-800 bg-[#121216] space-y-2">
          {isAlreadyApproved || approvalSuccess ? (
            <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center gap-2 text-xs font-semibold font-mono">
              <Check className="w-4 h-4" />
              <span>Work Order Dispatched • ERP Part Atomically Reserved</span>
            </div>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Decrementing ERP Inventory & Dispatching...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>[Approve Work Order & Reserve Part]</span>
                </>
              )}
            </button>
          )}

          <p className="text-center text-[10px] text-zinc-500 font-mono">
            Closed-Loop HITL Gate: Human approval securely decrements PostgreSQL stock & dispatches CMMS technician.
          </p>
        </div>
      </div>
    </div>
  );
}
