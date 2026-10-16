export interface MachineAsset {
  id: string;
  name: string;
  iot_stream_id: string;
  erp_asset_id: string;
  cmms_asset_id: string;
  model: string;
  line: string;
  downtime_cost_per_hour: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL" | "MAINTENANCE";
  health_score: number;
  current_vibration: number;
  current_temp: number;
  current_current: number;
  current_rpm: number;
  updated_at: string;
}

export interface TelemetryReading {
  machine_id: string;
  timestamp: string;
  vibration_mm_s: number;
  spindle_temp_c: number;
  motor_current_amps: number;
  rpm: number;
  is_anomaly: boolean;
  anomaly_score: number;
  classification: "NORMAL" | "FILTERED_NOISE" | "WARNING" | "ANOMALY_TRIGGER";
  details: string;
}

export interface ToolTraceStep {
  step_name: string;
  tool_input: Record<string, any>;
  tool_output_summary: string;
  latency_ms: number;
  timestamp: string;
}

export interface MaintenanceTicket {
  id: string;
  machine_id: string;
  status: "PENDING_HUMAN_APPROVAL" | "APPROVED" | "DISPATCHED" | "RESOLVED";
  title: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  detected_symptom: string;
  suspected_root_cause: string;
  recommended_action: string;
  cited_manual_title: string;
  cited_manual_section: string;
  cited_manual_page: number;
  manual_excerpt: string;
  recommended_part_sku: string;
  part_sku_name: string;
  part_unit_cost: number;
  estimated_repair_hours: number;
  hourly_downtime_rate: number;
  planned_downtime_cost: number;
  unplanned_catastrophic_cost: number;
  net_roi_savings: number;
  tool_trace: string; // JSON encoded ToolTraceStep[]
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface SparePartInventory {
  sku: string;
  name: string;
  category: string;
  compatible_machine_id: string;
  warehouse_bin: string;
  stock_count: number;
  reserved_count: number;
  unit_cost: number;
  lead_time: string;
  min_threshold: number;
  supplier: string;
  updated_at: string;
}

export interface OEMManualChunk {
  id: string;
  machine_model: string;
  document_title: string;
  document_ref: string;
  section_title: string;
  page_number: number;
  keywords: string;
  content_excerpt: string;
}

export interface WorkOrderHistory {
  id: string;
  machine_id: string;
  title: string;
  symptom: string;
  root_cause: string;
  resolution: string;
  technician_name: string;
  duration_hours: number;
  cost_total: number;
  part_sku_used: string;
  created_at: string;
  completed_at: string;
}
