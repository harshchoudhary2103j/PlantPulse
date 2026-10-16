import { MachineAsset, MaintenanceTicket, SparePartInventory, OEMManualChunk, WorkOrderHistory } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function fetchAssets(): Promise<MachineAsset[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/assets`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch assets");
    return await res.json();
  } catch (err) {
    console.error("API error fetching assets:", err);
    return [];
  }
}

export async function fetchTickets(): Promise<MaintenanceTicket[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/tickets`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch tickets");
    return await res.json();
  } catch (err) {
    console.error("API error fetching tickets:", err);
    return [];
  }
}

export async function approveTicket(ticketId: string, operatorName: string = "Plant Chief Engineer (Austin Line B)") {
  const res = await fetch(`${API_BASE}/api/v1/tickets/${ticketId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operator_name: operatorName }),
  });
  if (!res.ok) throw new Error("Failed to approve ticket");
  return await res.json();
}

export async function fetchInventory(): Promise<SparePartInventory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/inventory`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch inventory");
    return await res.json();
  } catch (err) {
    console.error("API error fetching inventory:", err);
    return [];
  }
}

export async function fetchManuals(q?: string): Promise<OEMManualChunk[]> {
  try {
    const url = q ? `${API_BASE}/api/v1/manuals?q=${encodeURIComponent(q)}` : `${API_BASE}/api/v1/manuals`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch manuals");
    return await res.json();
  } catch (err) {
    console.error("API error fetching manuals:", err);
    return [];
  }
}

export async function fetchWorkOrders(): Promise<WorkOrderHistory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/work-orders/history`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch work orders");
    return await res.json();
  } catch (err) {
    console.error("API error fetching work orders:", err);
    return [];
  }
}

export async function fetchTelemetryHistory(machineId: string, limit: number = 40) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/telemetry/${machineId}/history?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch history");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(`API error fetching telemetry for ${machineId}:`, err);
    return [];
  }
}

export async function simulateNoise(machineId: string) {
  const res = await fetch(`${API_BASE}/api/v1/simulate/noise/${machineId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to inject noise");
  return await res.json();
}

export async function simulateDegradation(machineId: string) {
  const res = await fetch(`${API_BASE}/api/v1/simulate/degradation/${machineId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to simulate degradation");
  return await res.json();
}

export async function resetSimulation(machineId: string) {
  const res = await fetch(`${API_BASE}/api/v1/simulate/reset/${machineId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset simulation");
  return await res.json();
}
