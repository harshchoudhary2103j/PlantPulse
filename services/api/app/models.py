from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field
from pydantic import BaseModel

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# -------------------------------------------------------------
# Database Models
# -------------------------------------------------------------

class MachineAsset(SQLModel, table=True):
    __tablename__ = "machine_assets"
    
    id: str = Field(primary_key=True) # e.g. CNC_04
    name: str
    iot_stream_id: str = Field(index=True) # e.g. CNC_04
    erp_asset_id: str = Field(index=True) # e.g. Milling_Unit_4 (SAP)
    cmms_asset_id: str = Field(index=True) # e.g. ASSET-104 (ServiceNow)
    model: str # e.g. Haas VF-2
    line: str # e.g. Line A - Precision Milling
    downtime_cost_per_hour: float # e.g. 4200.0
    status: str = Field(default="HEALTHY") # HEALTHY, WARNING, CRITICAL, MAINTENANCE
    health_score: float = Field(default=98.5) # 0-100
    current_vibration: float = Field(default=1.4)
    current_temp: float = Field(default=42.0)
    current_current: float = Field(default=12.2)
    current_rpm: float = Field(default=8200.0)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SparePartInventory(SQLModel, table=True):
    __tablename__ = "spare_part_inventory"
    
    sku: str = Field(primary_key=True) # e.g. BRG-6205-2RS
    name: str
    category: str
    compatible_machine_id: str = Field(index=True)
    warehouse_bin: str
    stock_count: int = Field(default=10)
    reserved_count: int = Field(default=0)
    unit_cost: float
    lead_time: str
    min_threshold: int = Field(default=2)
    supplier: str
    updated_at: datetime = Field(default_factory=utc_now)


class WorkOrderHistory(SQLModel, table=True):
    __tablename__ = "work_order_history"
    
    id: str = Field(primary_key=True) # e.g. WO-2024-8921
    machine_id: str = Field(index=True)
    title: str
    symptom: str
    root_cause: str
    resolution: str
    technician_name: str
    duration_hours: float
    cost_total: float
    part_sku_used: str
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime = Field(default_factory=utc_now)


class OEMManualChunk(SQLModel, table=True):
    __tablename__ = "oem_manual_chunks"
    
    id: str = Field(primary_key=True) # e.g. DOC-HAAS-01
    machine_model: str = Field(index=True) # e.g. Haas VF-2
    document_title: str
    document_ref: str
    section_title: str
    page_number: int
    keywords: str
    content_excerpt: str


class MaintenanceTicket(SQLModel, table=True):
    __tablename__ = "maintenance_tickets"
    
    id: str = Field(primary_key=True) # e.g. TICK-2026-0042
    machine_id: str = Field(index=True)
    status: str = Field(default="PENDING_HUMAN_APPROVAL") # PENDING_HUMAN_APPROVAL, APPROVED, DISPATCHED, RESOLVED
    title: str
    severity: str = Field(default="CRITICAL") # CRITICAL, WARNING, INFO
    detected_symptom: str
    suspected_root_cause: str
    recommended_action: str
    cited_manual_title: str
    cited_manual_section: str
    cited_manual_page: int
    manual_excerpt: str
    recommended_part_sku: str
    part_sku_name: str
    part_unit_cost: float
    estimated_repair_hours: float
    hourly_downtime_rate: float
    planned_downtime_cost: float
    unplanned_catastrophic_cost: float
    net_roi_savings: float
    tool_trace: str # JSON string of tool execution steps
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)


class TelemetryReading(SQLModel, table=True):
    __tablename__ = "telemetry_readings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    machine_id: str = Field(index=True)
    vibration_mm_s: float
    spindle_temp_c: float
    motor_current_amps: float
    rpm: float
    is_anomaly: bool = Field(default=False)
    anomaly_score: float = Field(default=0.0)
    classification: str = Field(default="NORMAL") # NORMAL, FILTERED_NOISE, ANOMALY_TRIGGER
    timestamp: datetime = Field(default_factory=utc_now, index=True)


class SimulationLog(SQLModel, table=True):
    __tablename__ = "simulation_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    machine_id: str = Field(index=True)
    event_type: str # NOISE_SPIKE_INJECTED, NOISE_FILTERED, DEGRADATION_TRIGGERED, ANOMALY_DETECTED
    details: str
    timestamp: datetime = Field(default_factory=utc_now, index=True)


# -------------------------------------------------------------
# Pydantic Schemas / DTOs
# -------------------------------------------------------------

class AssetResponse(BaseModel):
    id: str
    name: str
    iot_stream_id: str
    erp_asset_id: str
    cmms_asset_id: str
    model: str
    line: str
    downtime_cost_per_hour: float
    status: str
    health_score: float
    current_vibration: float
    current_temp: float
    current_current: float
    current_rpm: float
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketApprovalRequest(BaseModel):
    operator_name: Optional[str] = "Plant Chief Engineer (Austin Line B)"
    notes: Optional[str] = "Approved preventative bearing replacement based on AI diagnosis."


class ToolTraceStep(BaseModel):
    step_name: str
    tool_input: Dict[str, Any]
    tool_output_summary: str
    latency_ms: float
    timestamp: str
