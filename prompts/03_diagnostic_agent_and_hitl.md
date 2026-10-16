@AGENTS.md
Using the `industrial-diagnostic-agent` skill, build the AI investigator and HITL Work Order microservice logic in `services/api`:
1. Create `app/agent/investigator.py` and `app/agent/tools.py` implementing the 4 deterministic tools (`get_sensor_window`, `search_maintenance_manuals`, `query_past_work_orders`, `check_parts_inventory`) and the Cost-of-Downtime ROI calculator.
2. Wire the anomaly detector so that when a sustained anomaly triggers, the agent automatically investigates, logs step-by-step tool latency in `tool_trace`, and saves a `MaintenanceTicket` in `PENDING_HUMAN_APPROVAL` status.
3. Create REST endpoints:
   - `GET /api/v1/tickets` (returns all tickets with ROI breakdown, citations, and `tool_trace`).
   - `POST /api/v1/tickets/{ticket_id}/approve` (transitions status to `APPROVED`, decrements the linked `SparePartInventory` quantity by 1 in the database, and records operator approval timestamp).
   - `GET /api/v1/inventory` and `GET /api/v1/manuals` (for the ERP Inventory & Manuals SaaS view).
