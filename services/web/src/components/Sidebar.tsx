"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Layers, 
  ClipboardCheck, 
  Boxes, 
  Cpu, 
  ChevronRight,
  ShieldCheck,
  Zap,
  X
} from "lucide-react";

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Command Center",
      href: "/",
      icon: Activity,
      badge: "LIVE",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      name: "Asset Ontology",
      href: "/assets",
      icon: Layers,
      description: "Resolved Digital Twin"
    },
    {
      name: "Work Orders & HITL",
      href: "/work-orders",
      icon: ClipboardCheck,
      badge: "APPROVAL",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    {
      name: "ERP Inventory & Manuals",
      href: "/inventory",
      icon: Boxes,
      description: "Spare Parts & OEM Specs"
    },
  ];

  const content = (
    <div className="flex flex-col justify-between h-full bg-[#0C0C0E] w-64 border-r border-[#27272A] select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#27272A]/70">
          <Link href="/" onClick={onCloseMobile} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden group-hover:border-emerald-500/60 transition-colors">
              <Cpu className="w-4 h-4 text-emerald-400 relative z-10" />
              <div className="absolute inset-0 bg-emerald-400/10 blur-sm" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white">PlantPulse</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">B2B</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium -mt-0.5">Industrial AI Ops</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile} 
                className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Factory Control
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-zinc-800/80 text-white border border-zinc-700/60 shadow-sm shadow-black/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100 text-zinc-400" : ""}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[#27272A]/70 space-y-2">
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-zinc-300">Agent Guardrail</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">ACTIVE</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Deterministic tool calls require Human-in-the-Loop authorization before inventory dispatch.
          </p>
        </div>

        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-zinc-500 font-mono">
          <span>Austin Gigafactory</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Zap className="w-3 h-3 text-amber-400" />
            Line B
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0 z-20">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
