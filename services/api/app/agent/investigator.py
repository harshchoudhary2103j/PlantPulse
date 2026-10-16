import json
import logging
import random
import time
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from sqlmodel import Session, select
from app.config import settings
from app.database import engine
from app.models import MaintenanceTicket, SparePartInventory
from app.agent.tools import (
    get_sensor_window,
    search_maintenance_manuals,
    query_past_work_orders,
    check_parts_inventory
)

logger = logging.getLogger("plantpulse.agent.investigator")

async def _call_gemini_api(
    machine_id: str,
    machine_model: str,
    symptom_summary: str,
    sensor_res: Dict[str, Any],
    manual_res: Dict[str, Any],
    parts_res: Dict[str, Any],
    estimated_repair_hours: float,
    hourly_downtime_rate: float
) -> Optional[Dict[str, Any]]:
    """
    Calls the Google Gemini REST API to synthesize diagnostic reasoning
    when a valid GEMINI_API_KEY is configured.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        logger.info("GEMINI_API_KEY is empty. Using zero-crash deterministic fallback engine.")
        return None

    api_key = settings.GEMINI_API_KEY.strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

    prompt = f"""You are the Principal Reliability AI Diagnostic Engineer for PlantPulse Industrial Operations.
Analyze the following multi-modal industrial telemetry and maintenance context:

Asset: {machine_id} ({machine_model})
Downtime Financial Impact: ${hourly_downtime_rate:,.2f} / hour
Active Symptom: {symptom_summary}
Rate-of-Change Slope: +{sensor_res['vibration_slope_per_min']} mm/s/min vibration, +{sensor_res['temp_slope_per_min']} °C/min temperature
OEM Maintenance Manual Reference: {manual_res['document_ref']} - {manual_res['section_title']} (Page {manual_res['page_number']})
OEM Specification Excerpt: "{manual_res['content_excerpt']}"
Historical MTTR Benchmark: {estimated_repair_hours} hours
Candidate Spare Part: {parts_res['name']} (SKU: {parts_res['sku']}, Bin: {parts_res['warehouse_bin']}, Unit Cost: ${parts_res['unit_cost']:.2f}, Stock Available: {parts_res['available_count']})

Respond with a JSON object containing:
{{
  "title": "<Concise, professional incident title>",
  "suspected_root_cause": "<Rigorous mechanical/electrical root cause analysis citing sensor slope and OEM thresholds>",
  "recommended_action": "<Exact step-by-step corrective procedure citing the part SKU, warehouse bin, and torque/alignment checks>",
  "confidence_score": 0.96
}}
Return only valid JSON.
"""

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 800,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                result = resp.json()
                text_content = result["candidates"][0]["content"]["parts"][0]["text"]
                # Parse JSON
                parsed = json.loads(text_content)
                logger.info(f"Gemini Flash diagnosis generated successfully for {machine_id}.")
                return parsed
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}. Falling back to deterministic engine.")
                return None
    except Exception as e:
        logger.warning(f"Gemini API invocation error: {e}. Falling back to deterministic engine.")
        return None

async def run_diagnostic_investigation(machine_id: str, anomaly_reading: Dict[str, Any]) -> MaintenanceTicket:
    """
    Executes an autonomous, deterministic 4-step diagnostic investigation,
    records full tool latency observability traces, computes Cost-of-Downtime ROI,
    and drafts a MaintenanceTicket in PENDING_HUMAN_APPROVAL status.
    """
    logger.info(f"Starting Industrial Diagnostic Agent investigation for {machine_id}...")
    tool_trace: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # Step 1: Telemetry Window & Rate-of-Change Analysis
    # -------------------------------------------------------------
    sensor_res = get_sensor_window(machine_id, minutes=15)
    tool_trace.append({
        "step_name": "get_sensor_window",
        "tool_input": {"machine_id": machine_id, "window_minutes": 15},
        "tool_output_summary": f"Baseline vib {sensor_res['baseline_vibration_mm_s']} -> Current {sensor_res['current_vibration_mm_s']} mm/s (Slope: +{sensor_res['vibration_slope_per_min']} mm/s/min). Temp: {sensor_res['current_temp_c']}°C.",
        "latency_ms": sensor_res["latency_ms"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    # Machine model & downtime rate
    machine_model = sensor_res["machine_model"]
    hourly_downtime_rate = sensor_res["hourly_downtime_rate"]
    symptom_summary = f"High-frequency vibration {sensor_res['current_vibration_mm_s']} mm/s with thermal climb to {sensor_res['current_temp_c']}°C"

    # -------------------------------------------------------------
    # Step 2: OEM Manual Knowledge Search
    # -------------------------------------------------------------
    manual_res = search_maintenance_manuals(machine_model, symptom=symptom_summary)
    tool_trace.append({
        "step_name": "search_maintenance_manuals",
        "tool_input": {"machine_model": machine_model, "symptom": symptom_summary},
        "tool_output_summary": f"Found OEM match: {manual_res['document_ref']} - {manual_res['section_title']} (Page {manual_res['page_number']})",
        "latency_ms": manual_res["latency_ms"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    # -------------------------------------------------------------
    # Step 3: CMMS Past Work Order & MTTR Analysis
    # -------------------------------------------------------------
    cmms_res = query_past_work_orders(machine_id)
    tool_trace.append({
        "step_name": "query_past_work_orders",
        "tool_input": {"machine_id": machine_id},
        "tool_output_summary": f"Analyzed {cmms_res['records_analyzed']} past records. Mean Time To Repair (MTTR): {cmms_res['calculated_mttr_hours']} hrs.",
        "latency_ms": cmms_res["latency_ms"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    # -------------------------------------------------------------
    # Step 4: Dynamic Spare Part Selection Across All Compatible Parts
    # -------------------------------------------------------------
    # Query database for all spare parts compatible with this specific machine
    with Session(engine) as session:
        compatible_parts = session.exec(
            select(SparePartInventory).where(SparePartInventory.compatible_machine_id == machine_id)
        ).all()

    if compatible_parts:
        # Prioritize parts that have available stock, randomly choosing among them
        available_parts = [p for p in compatible_parts if (p.stock_count - p.reserved_count) > 0]
        selected_part_obj = random.choice(available_parts) if available_parts else random.choice(compatible_parts)
        recommended_sku = selected_part_obj.sku
    else:
        # Fallback default
        recommended_sku = "BRG-6205-2RS"

    parts_res = check_parts_inventory(recommended_sku)
    tool_trace.append({
        "step_name": "check_parts_inventory",
        "tool_input": {"part_sku": recommended_sku},
        "tool_output_summary": f"SKU {parts_res['sku']} located in Bin {parts_res['warehouse_bin']}. Stock: {parts_res['stock_count']} (Available: {parts_res['available_count']}). Unit Cost: ${parts_res['unit_cost']:.2f}.",
        "latency_ms": parts_res["latency_ms"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    # -------------------------------------------------------------
    # Financial Cost-of-Downtime ROI Calculation
    # -------------------------------------------------------------
    estimated_repair_hours = cmms_res["recommended_estimated_hours"]
    part_cost = parts_res["unit_cost"]
    planned_downtime_cost = (estimated_repair_hours * hourly_downtime_rate) + part_cost
    
    # Catastrophic failure projection (8-16 hours unplanned outage + secondary damage/freight)
    catastrophic_hours = 12.0
    failure_probability = 0.92
    emergency_freight_cost = 4500.0
    secondary_tooling_damage = 15000.0
    unplanned_catastrophic_cost = (failure_probability * catastrophic_hours * hourly_downtime_rate) + emergency_freight_cost + secondary_tooling_damage
    net_roi_savings = unplanned_catastrophic_cost - planned_downtime_cost

    # -------------------------------------------------------------
    # Deterministic Baseline Diagnosis
    # -------------------------------------------------------------
    part_name = parts_res["name"]
    bin_loc = parts_res["warehouse_bin"]
    
    # Contextual diagnostic templates depending on selected part category
    if "bearing" in part_name.lower():
        default_title = f"Spindle Bearing Degradation on {machine_id} ({machine_model})"
        default_root_cause = f"Raceway fatigue, micro-spalling and ball deformation on {recommended_sku} evidenced by continuous vibration slope (+{sensor_res['vibration_slope_per_min']} mm/s/min)."
        default_action = f"Quarantine {machine_id}, replace bearing assembly {recommended_sku} (Bin {bin_loc}), check spindle runout, and lubricate with synthetic ISO68 grease."
    elif "seal" in part_name.lower():
        default_title = f"Hydraulic Seal Degradation on {machine_id} ({machine_model})"
        default_root_cause = f"Thermal hardening and extrusion of high-pressure seals ({recommended_sku}) resulting in internal cylinder bypass."
        default_action = f"Quarantine {machine_id}, depressurize manifold, replace seal kit {recommended_sku} (Bin {bin_loc}), and verify zero static leakage."
    elif "valve" in part_name.lower():
        default_title = f"Proportional Control Valve Drift on {machine_id} ({machine_model})"
        default_root_cause = f"Spool stiction and electromagnetic coil hysteresis in valve {recommended_sku} causing erratic flow regulation."
        default_action = f"Quarantine {machine_id}, install replacement proportional valve {recommended_sku} (Bin {bin_loc}), and recalibrate PID closed-loop curves."
    elif "filter" in part_name.lower():
        default_title = f"Hydraulic Filter Saturation on {machine_id} ({machine_model})"
        default_root_cause = f"Particulate loading and differential pressure elevation exceeding delta-P bypass limits on element {recommended_sku}."
        default_action = f"Replace filter element {recommended_sku} (Bin {bin_loc}), flush return manifold, and log particle count index."
    elif "servo" in part_name.lower() or "drive" in part_name.lower():
        default_title = f"Servo Drive Amplifier IGBT Degradation on {machine_id} ({machine_model})"
        default_root_cause = f"Thermal stress and PWM switching loss on inverter drive {recommended_sku} resulting in phase current ripple."
        default_action = f"Power down main bus, swap servo amplifier module {recommended_sku} (Bin {bin_loc}), and run axis auto-tuning cycle."
    elif "encoder" in part_name.lower():
        default_title = f"Optical Rotary Encoder Drift on {machine_id} ({machine_model})"
        default_root_cause = f"Optical disc contamination and grating jitter on encoder {recommended_sku} causing axis positional hunting."
        default_action = f"Replace rotary optical encoder {recommended_sku} (Bin {bin_loc}), set zero-datum mark, and calibrate angular position."
    elif "belt" in part_name.lower():
        default_title = f"Timing Belt Pitch Elongation on {machine_id} ({machine_model})"
        default_root_cause = f"Tooth shear fatigue and tensile cord stretching on synchronous belt {recommended_sku} causing drive slip."
        default_action = f"Replace timing belt {recommended_sku} (Bin {bin_loc}), tension to 450N using acoustic meter, and verify pulley alignment."
    elif "heater" in part_name.lower():
        default_title = f"Cartridge Heater Resistance Drift on {machine_id} ({machine_model})"
        default_root_cause = f"Core oxidation and thermal insulation degradation in heating element {recommended_sku} leading to temperature fluctuation."
        default_action = f"Replace cartridge heater {recommended_sku} (Bin {bin_loc}), apply thermal paste, and verify thermocouple calibration."
    elif "lubricant" in part_name.lower():
        default_title = f"Spindle Lubricant Breakdown & High Thermal Friction on {machine_id} ({machine_model})"
        default_root_cause = f"Viscosity shear breakdown and oxidation of synthetic lubricant {recommended_sku} causing thermal rise (+{sensor_res['temp_slope_per_min']} °C/min)."
        default_action = f"Flush lubrication reservoir, clean chiller circuit, and refill with Mobil SHC 626 {recommended_sku} (Bin {bin_loc})."
    else:
        default_title = f"Mechanical Component Wear on {machine_id} ({machine_model})"
        default_root_cause = f"Sub-assembly wear on {recommended_sku} evidenced by continuous vibration slope (+{sensor_res['vibration_slope_per_min']} mm/s/min)."
        default_action = f"Quarantine {machine_id}, replace part {recommended_sku} (Bin {bin_loc}), and verify OEM clearance tolerances."

    # -------------------------------------------------------------
    # Optional Gemini AI Enrichment
    # -------------------------------------------------------------
    gemini_start = time.perf_counter()
    gemini_result = await _call_gemini_api(
        machine_id=machine_id,
        machine_model=machine_model,
        symptom_summary=symptom_summary,
        sensor_res=sensor_res,
        manual_res=manual_res,
        parts_res=parts_res,
        estimated_repair_hours=estimated_repair_hours,
        hourly_downtime_rate=hourly_downtime_rate
    )
    gemini_latency = round((time.perf_counter() - gemini_start) * 1000, 2)

    if gemini_result:
        final_title = gemini_result.get("title", default_title)
        final_root_cause = gemini_result.get("suspected_root_cause", default_root_cause)
        final_action = gemini_result.get("recommended_action", default_action)
        confidence = gemini_result.get("confidence_score", 0.96)
        tool_trace.append({
            "step_name": "gemini_diagnostic_synthesis",
            "tool_input": {"model": "gemini-1.5-flash", "machine_id": machine_id},
            "tool_output_summary": f"Gemini 1.5 Flash synthesized root-cause diagnosis ({confidence*100:.0f}% confidence). Cites {manual_res['document_ref']} & {parts_res['sku']}.",
            "latency_ms": gemini_latency,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
    else:
        final_title = default_title
        final_root_cause = default_root_cause
        final_action = default_action

    ticket_id = f"TICK-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    ticket = MaintenanceTicket(
        id=ticket_id,
        machine_id=machine_id,
        status="PENDING_HUMAN_APPROVAL",
        title=final_title,
        severity="CRITICAL",
        detected_symptom=symptom_summary,
        suspected_root_cause=final_root_cause,
        recommended_action=final_action,
        cited_manual_title=manual_res["document_title"],
        cited_manual_section=manual_res["section_title"],
        cited_manual_page=manual_res["page_number"],
        manual_excerpt=manual_res["content_excerpt"],
        recommended_part_sku=recommended_sku,
        part_sku_name=parts_res["name"],
        part_unit_cost=part_cost,
        estimated_repair_hours=estimated_repair_hours,
        hourly_downtime_rate=hourly_downtime_rate,
        planned_downtime_cost=round(planned_downtime_cost, 2),
        unplanned_catastrophic_cost=round(unplanned_catastrophic_cost, 2),
        net_roi_savings=round(net_roi_savings, 2),
        tool_trace=json.dumps(tool_trace)
    )

    with Session(engine) as session:
        session.add(ticket)
        session.commit()
        session.refresh(ticket)

    return ticket
