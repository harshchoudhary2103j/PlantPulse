"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Cpu, 
  ArrowRight, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { MachineAsset } from "../../types";
import { fetchAssets } from "../../lib/api";

export default function AssetOntologyPage() {
  const [assets, setAssets] = useState<MachineAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchAssets();
      setAssets(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">Enterprise Asset Ontology & Digital Twin</h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Reconciles noisy edge IoT stream tags against ERP asset ledgers (SAP S/4HANA) and CMMS work order tracking (ServiceNow) into a resolved PostgreSQL relational ontology.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Ontology Status: </span>
            <span className="text-emerald-400 font-semibold">4/4 RESOLVED</span>
          </div>
        </div>
      </div>

      {/* Cross-Silo Resolution Visual Explainer */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Cross-Silo Identity Resolution Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase text-cyan-400">1. Edge IoT Stream</span>
            <p className="font-mono text-zinc-200 mt-1 font-semibold">Raw Tag (e.g. CNC_04)</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Vibration, Temp, Current, RPM</p>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase text-emerald-400">2. SAP ERP System</span>
            <p className="font-mono text-zinc-200 mt-1 font-semibold">Asset ID (Milling_Unit_4)</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Depreciation, Bill-of-Materials</p>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase text-amber-400">3. ServiceNow CMMS</span>
            <p className="font-mono text-zinc-200 mt-1 font-semibold">WO Entity (ASSET-104)</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Technician logs, MTTR history</p>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-[10px] font-mono uppercase text-emerald-400">4. PlantPulse Ontology</span>
            <p className="font-mono text-white mt-1 font-semibold">Unified MachineAsset</p>
            <p className="text-[11px] text-emerald-300 mt-0.5">Real-time Financial ROI Gate</p>
          </div>
        </div>
      </div>

      {/* Resolved Machine Asset Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121215] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Resolved Machine Inventory</h2>
          <span className="text-xs font-mono text-zinc-400">{assets.length} Active Machines</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-6">Physical Machine</th>
                <th className="py-3 px-6">IoT Stream ID</th>
                <th className="py-3 px-6">SAP ERP Asset ID</th>
                <th className="py-3 px-6">ServiceNow CMMS ID</th>
                <th className="py-3 px-6">Downtime Cost</th>
                <th className="py-3 px-6">Health Score</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {assets.map((asset) => {
                const isCritical = asset.status === "CRITICAL";
                const isWarning = asset.status === "WARNING";
                return (
                  <tr key={asset.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Physical Machine */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{asset.name}</div>
                      <div className="text-[11px] text-zinc-500">{asset.line}</div>
                    </td>

                    {/* IoT Stream ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded w-fit border border-cyan-800/40">
                        <Cpu className="w-3 h-3" />
                        <span>{asset.iot_stream_id}</span>
                      </div>
                    </td>

                    {/* SAP ERP */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        {asset.erp_asset_id}
                      </span>
                    </td>

                    {/* ServiceNow */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        {asset.cmms_asset_id}
                      </span>
                    </td>

                    {/* Downtime Cost / Hour */}
                    <td className="py-4 px-6 font-mono text-zinc-200">
                      ${asset.downtime_cost_per_hour?.toLocaleString()}/hr
                    </td>

                    {/* Health Score */}
                    <td className="py-4 px-6 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              asset.health_score > 90
                                ? "bg-emerald-500"
                                : asset.health_score > 70
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${asset.health_score}%` }}
                          />
                        </div>
                        <span className="font-semibold text-white">{asset.health_score?.toFixed(1)}%</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold uppercase ${
                          isCritical
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : isWarning
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
