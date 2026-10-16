@AGENTS.md
Using the `enterprise-saas-ui` skill, build the industry-level Next.js B2B SaaS frontend in `services/web` (including a production `Dockerfile`):
1. Build the enterprise SaaS application shell with a collapsible sidebar (`Command Center`, `Asset Ontology`, `Work Orders & HITL`, `ERP Inventory & Manuals`), top KPI bar, Plant Selector, `Cmd+K` shortcut menu, and the global Simulation Trigger buttons (`[Simulate Bearing Failure]` & `[Inject Sensor Noise]`).
2. Build the **Command Center** view with live streaming Recharts telemetry graphs, real-time noise-filter status logs, and an animated **Agent Observability Trace** panel.
3. Build the **Slide-Over HITL Work Order Drawer** displaying the side-by-side Financial ROI visual bar (`Planned Repair Cost` vs. `Catastrophic Unplanned Cost`), OEM manual citations, ERP part stock status, and a tactile **[Approve & Dispatch Technician]** button that calls `POST /api/v1/tickets/{id}/approve` and updates stock counts live.
4. Build the **Asset Ontology**, **Work Orders Queue**, and **ERP Inventory** views so every sidebar tab is a fully functional, data-driven SaaS screen.
5. Start both `services/api` and `services/web`, verify all endpoints and UI flows in the browser, and ensure `docker-compose up --build` is completely configured.
