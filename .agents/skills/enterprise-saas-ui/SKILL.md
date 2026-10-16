---
name: enterprise-saas-ui
description: Builds an industry-grade B2B SaaS frontend inspired by Linear, Vercel, Samsara, and Palantir Foundry with multi-view navigation, command palette, live telemetry, and spring physics.
---

# Enterprise Industrial SaaS Frontend Skill

## Goal
Build a polished, deployment-ready B2B SaaS web application (`services/web`) that looks like a Series-B industrial AI product (Linear meets Samsara/Palantir).

## Instructions
1. **SaaS Shell & Navigation Architecture:**
   - Collapsible left sidebar with 4 core views:
     1. **Command Center (`/`)**: Bento-grid overview with KPI ribbon (Plant OEE %, Active Alerts, Projected Savings $, MTTR), live multi-machine telemetry charts, and real-time Agent Investigation feed.
     2. **Asset Ontology & Digital Twin (`/assets`)**: Interactive table & visual mapping showing how dirty IoT tags resolve to SAP ERP and ServiceNow CMMS records, plus live health status.
     3. **Work Orders & HITL Queue (`/work-orders`)**: Kanban/list queue (`Pending Approval`, `Approved & Dispatched`, `Resolved`) with slide-over inspection drawer.
     4. **ERP Parts & Manuals (`/inventory`)**: Live spare-parts stock levels (highlighting parts reserved by approved tickets) and searchable OEM manual excerpts.
   - Global Top Bar featuring:
     - **Plant Selector Dropdown** (`Austin Gigafactory - Line B`)
     - **Interactive Simulation Trigger Bar**: Tactile buttons for `[Simulate Bearing Failure]` and `[Inject Sensor Noise]` so evaluators can test the system from anywhere.
     - **`Cmd+K` Command Palette** for instant navigation and simulation actions.
2. **Design System & Micro-Interactions:**
   - **Theme:** Crisp zinc/slate dark-first SaaS palette (`#09090B` background, `#121215` elevated surface cards, `1px solid #27272A` borders, subtle top-edge radial highlights).
   - **Typography:** `Inter` / `Geist` for UI labels; `JetBrains Mono` (`tabular-nums`) for all sensor telemetry, dollar ROI figures, latencies, and SKUs.
   - **Motion (Framer Motion):** Spring-physics drawer transitions, staggered tool-trace step reveals (`[✓] get_sensor_window (42ms)`), and optimistic UI updates with toast notifications when clicking **[Approve Work Order & Reserve Part]**.
