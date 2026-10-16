---
name: industrial-diagnostic-agent
description: Builds the AI diagnostic investigator, deterministic enterprise tools, Cost-of-Downtime ROI calculator, observability trace logger, and HITL approval workflow.
---

# Industrial Diagnostic Agent Skill

## Goal
Investigate factory machine alerts using deterministic tools, cite OEM manuals, calculate financial ROI, log tool latencies, and draft maintenance work orders.

## Instructions
1. **Required Deterministic Tools:**
   - `get_sensor_window(machine_id, minutes)`: Computes baseline vs. current telemetry delta and rate-of-change slope.
   - `search_maintenance_manuals(machine_model, symptom)`: Queries seeded OEM manual chunks and returns exact document title, section, and page number.
   - `query_past_work_orders(machine_id)`: Finds historical technician repair logs and MTTR (Mean Time To Repair) for matching symptoms.
   - `check_parts_inventory(part_sku)`: Queries ERP inventory table for warehouse bin, stock count, unit cost ($), and lead time.
2. **Financial Cost-of-Downtime Calculator:**
   - `planned_downtime_cost = (estimated_repair_hours * hourly_downtime_rate) + part_unit_cost`
   - `unplanned_catastrophic_cost = (failure_probability * catastrophic_hours * hourly_downtime_rate) + emergency_freight_cost`
   - `net_roi_savings = unplanned_catastrophic_cost - planned_downtime_cost`
3. **Observability Trace:**
   Every ticket must store a JSON `tool_trace` array containing `step_name`, `tool_input`, `tool_output_summary`, `latency_ms`, and `timestamp` so the SaaS UI can render an interactive observability timeline.
