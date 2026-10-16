"use client";

import React, { useState } from "react";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";
import { CommandPalette } from "../components/CommandPalette";
import { MachineProvider } from "../lib/MachineContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(true);

  return (
    <html lang="en" className="dark">
      <head>
        <title>PlantPulse — Industrial AI Operations & Predictive Maintenance</title>
        <meta
          name="description"
          content="Deployment-ready B2B Industrial AI SaaS platform reconciling IoT telemetry, ERP inventory, and CMMS work orders with closed-loop HITL diagnostics."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#09090B] text-zinc-100 flex min-h-screen font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <MachineProvider>
          {/* Responsive Sidebar (Static on desktop, Drawer on mobile/tablet) */}
          <Sidebar 
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopNav
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
              isSseConnected={isSseConnected}
            />

            <main className="flex-1 p-3 sm:p-6 overflow-y-auto min-w-0">
              {children}
            </main>
          </div>

          {/* Global Command Palette */}
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
        </MachineProvider>
      </body>
    </html>
  );
}
