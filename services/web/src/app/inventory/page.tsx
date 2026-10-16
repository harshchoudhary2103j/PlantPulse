"use client";

import React, { useState, useEffect } from "react";
import { 
  Boxes, 
  BookOpen, 
  Search, 
  Package, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign,
  Filter
} from "lucide-react";
import { SparePartInventory, OEMManualChunk } from "../../types";
import { fetchInventory, fetchManuals } from "../../lib/api";

export default function InventoryAndManualsPage() {
  const [inventory, setInventory] = useState<SparePartInventory[]>([]);
  const [manuals, setManuals] = useState<OEMManualChunk[]>([]);
  const [searchManualQuery, setSearchManualQuery] = useState("");
  const [partCategoryFilter, setPartCategoryFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      const [parts, docs] = await Promise.all([
        fetchInventory(),
        fetchManuals()
      ]);
      setInventory(parts);
      setManuals(docs);
    }
    load();
  }, []);

  const handleSearchManuals = async (q: string) => {
    setSearchManualQuery(q);
    const docs = await fetchManuals(q);
    setManuals(docs);
  };

  const categories = ["ALL", ...Array.from(new Set(inventory.map((i) => i.category)))];
  const filteredParts = partCategoryFilter === "ALL" 
    ? inventory 
    : inventory.filter((p) => p.category === partCategoryFilter);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">ERP Inventory & OEM Manuals</h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Direct integration with SAP S/4HANA Spare Parts Warehouse and OEM Machine Service Specifications. Approving a HITL work order automatically decrements available stock and locks parts for technician dispatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Warehouse Bins: </span>
            <span className="text-cyan-400 font-semibold">{inventory.length} Stocked</span>
          </div>
        </div>
      </div>

      {/* Section 1: Live SAP ERP Spare Parts Inventory */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>SAP ERP Spare Parts Inventory</span>
            </h2>
            <p className="text-xs text-zinc-400">Live warehouse bin locations and reservation status</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setPartCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  partCategoryFilter === cat
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121215] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-6">SKU & Item Name</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Target Asset</th>
                  <th className="py-3 px-6">Warehouse Bin</th>
                  <th className="py-3 px-6">Stock Status</th>
                  <th className="py-3 px-6">Unit Cost</th>
                  <th className="py-3 px-6 text-right">Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {filteredParts.map((part) => {
                  const isLowStock = part.stock_count <= part.min_threshold;
                  return (
                    <tr key={part.sku} className="hover:bg-zinc-800/40 transition-colors">
                      {/* SKU & Name */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-white text-xs">{part.sku}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{part.name}</div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {part.category}
                        </span>
                      </td>

                      {/* Machine */}
                      <td className="py-4 px-6 font-mono text-cyan-400">
                        {part.compatible_machine_id}
                      </td>

                      {/* Bin */}
                      <td className="py-4 px-6 font-mono text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{part.warehouse_bin}</span>
                        </div>
                      </td>

                      {/* Stock & Reserved */}
                      <td className="py-4 px-6 font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLowStock ? "text-rose-400" : "text-emerald-400"}`}>
                            {part.stock_count} in stock
                          </span>
                          {part.reserved_count > 0 && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {part.reserved_count} Reserved
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-4 px-6 font-mono text-zinc-200">
                        ${part.unit_cost?.toFixed(2)}
                      </td>

                      {/* Lead Time */}
                      <td className="py-4 px-6 font-mono text-right text-zinc-400">
                        {part.lead_time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Searchable OEM Machine Manuals */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>OEM Technical Manuals & Service Specifications</span>
            </h2>
            <p className="text-xs text-zinc-400">Seeded machine manuals queried by the AI diagnostic agent</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vibration, bearings, pressure..."
              value={searchManualQuery}
              onChange={(e) => handleSearchManuals(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manuals.map((chunk) => (
            <div
              key={chunk.id}
              className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {chunk.machine_model}
                  </span>
                  <h3 className="text-xs font-semibold text-white mt-1.5">{chunk.document_title}</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  Page {chunk.page_number}
                </span>
              </div>

              <div className="text-xs font-mono text-zinc-300 font-semibold border-b border-zinc-800/60 pb-2">
                {chunk.section_title}
              </div>

              <p className="text-xs text-zinc-400 italic leading-relaxed border-l-2 border-cyan-500/50 pl-3">
                &ldquo;{chunk.content_excerpt}&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 pt-1">
                <span>Ref: {chunk.document_ref}</span>
                <span className="text-zinc-600 truncate max-w-[180px] sm:max-w-[320px]">Tags: {chunk.keywords}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
