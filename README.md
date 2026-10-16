# PlantPulse — Industrial AI Operations & Predictive Maintenance SaaS

[![Live Production](https://img.shields.io/badge/Production-Live%20on%20Vercel-black?style=for-the-badge&logo=vercel)](https://plant-pulse-gilt.vercel.app/)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-46E3B7?style=for-the-badge&logo=render)](https://plantpulse-7to5.onrender.com/health)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

> **PlantPulse** is a decoupled, enterprise-grade Industrial AI Operations and Predictive Maintenance SaaS platform. It bridges the gap between raw IoT factory telemetry, siloed ERP inventory systems, and OEM maintenance manuals using autonomous diagnostic AI agents and closed-loop Human-in-the-Loop (HITL) approval workflows.

---

## 🌐 Live Production Deployments

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend SaaS Dashboard** | **Vercel** | [https://plant-pulse-gilt.vercel.app/](https://plant-pulse-gilt.vercel.app/) | ![Live](https://img.shields.io/badge/Status-Operational-10B981?style=flat-square) |
| **Backend API Service** | **Render** | [https://plantpulse-7to5.onrender.com](https://plantpulse-7to5.onrender.com) | ![Live](https://img.shields.io/badge/Status-Operational-10B981?style=flat-square) |
| **Interactive API Documentation** | **Swagger UI** | [https://plantpulse-7to5.onrender.com/docs](https://plantpulse-7to5.onrender.com/docs) | ![Swagger](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-009688?style=flat-square) |
| **Health & Readiness Check** | **Render** | [https://plantpulse-7to5.onrender.com/health](https://plantpulse-7to5.onrender.com/health) | `{"status":"healthy"}` |

---

## 🏭 System Architecture

PlantPulse follows a strictly decoupled service-oriented architecture containerized for 1-click cloud deployment (Render, Vercel, Railway, Docker Compose):

```
                                 ┌────────────────────────────────────────┐
                                 │     Next.js 14 Web Frontend (Vercel)   │
                                 │       https://plant-pulse-gilt.vercel.app│
                                 │   Linear / Samsara / Foundry SaaS UI   │
                                 └───────────────▲────────────────────────┘
                                                 │
                                                 │ Typed REST & SSE Live Stream
                                                 ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                   FastAPI API Microservice (Render Docker)                     │
│                     https://plantpulse-7to5.onrender.com                       │
│                                                                                │
│  ┌──────────────────────────┐                     ┌─────────────────────────┐  │
│  │   IoT Telemetry Engine   │                     │   AI Diagnostic Agent   │  │
│  │ (Rolling Z-Score / 3σ)   │────────────────────►│  (Gemini + Tool Engine) │  │
│  └─────────────▲────────────┘                     └────────────┬────────────┘  │
└────────────────┼───────────────────────────────────────────────┼───────────────┘
                 │                                               │
         In-Memory / Redis                               SQLModel (WAL Mode)
                 │                                               │
                 ▼                                               ▼
  ┌─────────────────────────────┐                 ┌─────────────────────────────┐
  │   Event Broker & Telemetry  │                 │   PostgreSQL 16 / SQLite    │
  │     (Pub/Sub SSE Stream)    │                 │ (Enterprise Ontology Store) │
  │   2-second Real-time Ticks  │                 │  Ontology, ERP, Work Orders │
  └─────────────────────────────┘                 └─────────────────────────────┘
```

### Core Architecture Components
1. **`web-app` (Next.js 14 App Router on Vercel):**
   - High-density dark-mode B2B interface inspired by Linear, Samsara, and Palantir Foundry.
   - Fully responsive design: adaptive 2-column card wrapping on tablets/laptops and 4-column executive view on ultra-wide viewports.
   - Built-in **Web Audio API Acoustic Synthesizer** generating realistic physical motor rumble and electrical sensor noise.
   - Slide-over HITL authorization drawer, interactive Recharts telemetry line charts, and global Cmd+K command palette.
2. **`api-service` (FastAPI Microservice on Render):**
   - Stateless Python 3.11 service with versioned REST endpoints (`/api/v1/...`).
   - Server-Sent Events (`/api/v1/stream/telemetry`) streaming live multi-machine vibrations, temperatures, currents, and RPM.
   - Rolling Z-score transient electrical noise filter and 3-sigma sustained degradation anomaly detector.
   - Deterministic 4-tool autonomous AI investigator with zero-crash fallback and live Google Gemini support.
3. **`db` (PostgreSQL 16 with SQLite WAL Fallback):**
   - Automatic database creation and idempotent enterprise ontology seeding on startup.
   - Atomic transactions decrementing ERP inventory upon human work order approvals.

---

## 🧩 FDE Enterprise Ontology Resolution

In real manufacturing plants, siloed systems use disjointed naming conventions: edge vibration sensors broadcast raw stream tags (`CNC_04`), ERP databases record capitalization assets (`Milling_Unit_4`), and ServiceNow CMMS systems track legacy tickets (`ASSET-104`).

PlantPulse reconciles these siloed identities into a single resolved entity:

| Machine Name | IoT Stream ID | SAP ERP Asset ID | ServiceNow CMMS ID | Criticality | Downtime Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Haas VF-2 Vertical Machining Center** | `CNC_04` | `Milling_Unit_4` | `ASSET-104` | Tier 1 (Critical) | **$4,200 / hr** |
| **Schuler 500T Hydraulic Stamping Press** | `PRESS_02` | `Hydraulic_Press_B` | `ASSET-202` | Tier 1 (Critical) | **$8,500 / hr** |
| **Fanuc M-20iA 6-Axis Welding Robot** | `ROBOT_09` | `Welder_Arm_09` | `ASSET-309` | Tier 2 (High) | **$3,100 / hr** |
| **Bosch High-Speed Flow Wrapper** | `PACK_01` | `Wrapper_Line_1` | `ASSET-401` | Tier 2 (High) | **$2,400 / hr** |

---

## 🔊 Web Audio API Acoustic Sound Simulator

PlantPulse includes a client-side Web Audio API synthesizer that provides real-time acoustic feedback for factory operations:

- **Electrical Sensor Noise:** Synthesizes a 60Hz/120Hz electrical mains buzz hum combined with a 2800Hz bandpass static spark crackle when you click **[Inject Sensor Noise]** or **[Play Noise Audio]**.
- **Mechanical Bearing Failure Rumble:** Synthesizes a low-frequency sawtooth motor rumble with a 16Hz wobble LFO and metallic friction grinding when clicking **[Simulate Bearing Failure]**.
- **Anomaly Warning Ping:** Dual-tone frequency ping (880Hz → 660Hz) when an anomaly is confirmed.
- **HITL Approval Chime:** C-Major ascending triad chord (`C5` → `E5` → `G5`) upon operator work order authorization.
- **Audio Control:** Top navigation bar toggle with mute state persistence and automatic `AudioContext` unlocking on user interaction.

---

## 🤖 Autonomous AI Diagnostic Agent

When sustained mechanical degradation breaches statistical thresholds, PlantPulse launches the **Industrial Diagnostic Agent**.

The agent executes 4 deterministic enterprise tools in sequence:
1. **`get_sensor_window`**: Extracts sliding-window telemetry to compute rate of change (e.g. vibration slope $+1.33\text{ mm/s/min}$ and thermal escalation $+0.8\text{ }^\circ\text{C/min}$).
2. **`search_maintenance_manuals`**: Semantic search across indexed OEM technical manuals for exact fault codes and torque specs (e.g. Haas VF-2 Spindle Manual, Section 5.1, Page 112).
3. **`query_past_work_orders`**: Historical CMMS order regression to benchmark Mean Time To Repair (MTTR, e.g. 2.15 hours).
4. **`check_parts_inventory`**: Real-time warehouse bin verification, on-hand stock counts, and replacement part pricing (e.g. SKU `SPN-CER-7014`, Bin `BIN-A-14-01`).

### Cost-of-Downtime ROI Calculation
The agent computes the exact financial return of proactive maintenance versus catastrophic line failure:

$$\text{Planned Cost} = (\text{MTTR} \times \text{Hourly Downtime Rate}) + \text{Part Cost}$$
$$\text{Catastrophic Cost} = (\text{MTTR} \times 4.5 \times \text{Hourly Downtime Rate}) + (\text{Part Cost} \times 1.5) + \text{Secondary Damage Reserve}$$
$$\text{Net ROI Savings} = \text{Catastrophic Cost} - \text{Planned Cost}$$

*Real Example on CNC_04:*
- Planned Proactive MTTR: $(2.15\text{h} \times \$4,200) + \$1,480 = \mathbf{\$10,510}$
- Avoided Catastrophic Failure: $(9.675\text{h} \times \$4,200) + \$2,220 + \$25,000 = \mathbf{\$67,855}$
- **Net Avoided Downtime ROI:** $\mathbf{+\$57,345}$

### Closed-Loop Human-in-the-Loop (HITL) Gate
The agent is guardrailed against autonomous mutations. Every diagnosis creates a ticket in `PENDING_HUMAN_APPROVAL` status. When an engineer clicks **[Approve Work Order & Reserve Part]**:
1. Ticket status atomically transitions to `APPROVED`.
2. ERP spare part stock count is decremented in PostgreSQL/SQLite.
3. CMMS dispatch log is generated with operator signature and timestamp.
4. The machine telemetry smoothly returns to baseline nominal operations.

---

## 💻 Local Quickstart

### Option 1: Docker Compose (All 4 Services)
```bash
git clone https://github.com/harshchoudhary2103j/PlantPulse.git
cd PlantPulse

# Start PostgreSQL, Redis, FastAPI, and Next.js
docker-compose up --build
```
Access the application:
- **Web App Dashboard:** [http://localhost:3001](http://localhost:3001)
- **FastAPI Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

### Option 2: Bare Metal Local Development

#### 1. Backend Service (`services/api`)
```bash
cd services/api

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows (or 'source venv/bin/activate' on Linux/macOS)

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 2. Frontend SaaS Service (`services/web`)
```bash
cd services/web

# Install packages
npm install

# Start Next.js development server
npm run dev
```
Open [http://localhost:3001](http://localhost:3001).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` / `/healthz` | Service health, database connection status, and ontology readiness |
| `GET` | `/api/v1/assets` | Resolved machine assets across IoT, ERP, and CMMS identifiers |
| `GET` | `/api/v1/stream/telemetry` | Server-Sent Events (SSE) live multi-machine telemetry stream |
| `GET` | `/api/v1/telemetry/{machine_id}/history` | Historical sliding-window telemetry points |
| `GET` | `/api/v1/tickets` | Maintenance tickets with latency traces and financial ROI |
| `POST` | `/api/v1/tickets/{id}/approve` | HITL approval endpoint (atomically decrements ERP inventory) |
| `GET` | `/api/v1/inventory` | Real-time spare parts stock counts, costs, and warehouse bins |
| `GET` | `/api/v1/manuals` | Indexed OEM manual chunks with keyword query search |
| `POST` | `/api/v1/simulate/noise/{machine_id}` | Injects single-sample electrical sensor spike |
| `POST` | `/api/v1/simulate/degradation/{machine_id}` | Injects progressive mechanical bearing wear curve |
| `POST` | `/api/v1/simulate/reset/{machine_id}` | Resets machine simulator to nominal baseline |

---

## ☁️ Cloud Deployment Blueprints

- **Render Blueprint ([render.yaml](render.yaml)):** Pre-configured multi-service blueprint for `plantpulse-api` (Docker container with `/health` checks) and `plantpulse-web`.
- **Vercel Blueprint ([services/web/vercel.json](services/web/vercel.json)):** Production preset for Next.js App Router edge deployment with `NEXT_PUBLIC_API_URL` environment injection.
