---
name: fde-data-ontology
description: Designs decoupled PostgreSQL schemas, Redis telemetry streams, entity resolution pipelines, and IoT anomaly detection workers for dirty enterprise data.
---

# FDE Data Ontology & Streaming Telemetry Skill

## Goal
Reconcile messy industrial data across siloed enterprise systems into a unified PostgreSQL ontology and stream live telemetry via Redis/SSE.

## Instructions
1. **Entity Resolution Mapping (`MachineAsset` table):**
   Map legacy naming mismatches cleanly across 4 factory lines:
   - `CNC_04` (IoT) ↔ `Milling_Unit_4` (SAP ERP) ↔ `ASSET-104` (ServiceNow CMMS) — Haas VF-2 ($4,200/hr downtime cost)
   - `PRESS_02` (IoT) ↔ `Hydraulic_Press_B` (SAP ERP) ↔ `ASSET-202` (ServiceNow CMMS) — Schuler 500T ($8,500/hr downtime cost)
   - `ROBOT_09` (IoT) ↔ `Welder_Arm_09` (SAP ERP) ↔ `ASSET-309` (ServiceNow CMMS) — Fanuc M-20iA ($3,100/hr downtime cost)
   - `PACK_01` (IoT) ↔ `Wrapper_Line_1` (SAP ERP) ↔ `ASSET-401` (ServiceNow CMMS) — Bosch Wrapper ($2,400/hr downtime cost)
2. **Telemetry & Noise Simulation:**
   - Stream `vibration_mm_s`, `spindle_temp_c`, `motor_current_amps`, and `rpm` every 2 seconds.
   - Support two on-demand simulation triggers via API:
     - **Transient Sensor Glitch:** 1-tick spike that the rolling Z-score window marks as `FILTERED_NOISE` (does not wake the AI agent).
     - **Bearing Degradation Curve:** Progressive multi-tick vibration and thermal climb that breaches the rolling anomaly threshold and fires an `AnomalyEvent`.
