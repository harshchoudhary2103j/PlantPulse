# PlantPulse — Industrial AI Operations & Predictive Maintenance SaaS

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

> **PlantPulse** is a decoupled, enterprise-grade Industrial AI Operations and Predictive Maintenance SaaS platform. It bridges the gap between raw IoT factory telemetry, siloed ERP inventory systems, and OEM maintenance manuals using autonomous diagnostic AI agents and closed-loop Human-in-the-Loop (HITL) approval workflows.

---

## 🏭 System Architecture

PlantPulse follows a strictly decoupled service-oriented architecture containerized for 1-click cloud deployment (Railway, Render, Fly.io, AWS ECS):

```
                                 ┌────────────────────────────────────────┐
                                 │       Next.js 14 Web Frontend         │
                                 │        (services/web :3001)            │
                                 │   Linear / Samsara / Foundry SaaS UI   │
                                 └───────────────▲────────────────────────┘
                                                 │
                                                 │ Typed REST & SSE Feed
                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI API Microservice                        │
│                         (services/api :8001)                           │
│                                                                        │
│  ┌──────────────────────────┐             ┌─────────────────────────┐  │
│  │   IoT Telemetry Engine   │             │   AI Diagnostic Agent   │  │
│  │ (IsolationForest/Z-Score)│────────────►│  (Deterministic Engine) │  │
│  └─────────────▲────────────┘             └────────────┬────────────┘  │
└────────────────┼───────────────────────────────────────┼───────────────┘
                 │                                       │
         Redis Pub/Sub                           SQLModel (Async/Sync)
                 │                                       │
                 ▼                                       ▼
  ┌─────────────────────────────┐         ┌─────────────────────────────┐
  │           Redis 7           │         │        PostgreSQL 16        │
  │     (Event Broker :6380)    │         │    (Relational DB :5433)    │
  │  Real-time Telemetry Ingest │         │  Ontology, ERP, Work Orders │
  └─────────────────────────────┘         └─────────────────────────────┘
```

### Core Services
1. **`db` (PostgreSQL 16):** Persistent relational store for Enterprise Ontology, ERP Spare Parts Inventory, Historical CMMS Work Orders, OEM Maintenance Manuals, and Telemetry logs.
2. **`redis` (Redis 7):** Lightweight event broker and pub/sub stream for real-time IoT telemetry ingestion and anomaly decoupling.
3. **`api-service` (FastAPI + Async Worker):** Stateless Python 3.11 microservice providing versioned REST endpoints (`/api/v1/...`), Server-Sent Events (SSE) telemetry stream, IoT simulation workers, and the autonomous AI Diagnostic Agent.
4. **`web-app` (Next.js 14 App Router):** Enterprise B2B SaaS frontend featuring live multi-channel charts, slide-over HITL inspection drawers, command palette (`cmdk`), and real-time state synchronization.

---

## 🧩 FDE Enterprise Ontology Resolution

Industrial plants suffer from siloed data: IoT vibration sensors use streaming topic IDs (`CNC_04`), ERP systems log financial assets by internal taxonomy (`Milling_Unit_4`), and CMMS work order platforms track legacy identifiers (`ASSET-104`).

PlantPulse resolves these heterogeneous identifiers across every factory asset into a single unified ontology:

| Plant Asset Name | IoT Stream ID | ERP Asset ID | CMMS Asset ID | Criticality | Downtime Cost/hr |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Haas VF-2 Vertical Machining Center** | `CNC_04` | `Milling_Unit_4` | `ASSET-104` | Tier 1 (Critical) | $4,200 / hr |
| **Schuler 500T Hydraulic Stamping Press** | `PRESS_02` | `Hydraulic_Press_B` | `ASSET-202` | Tier 1 (Critical) | $8,500 / hr |
| **Fanuc M-20iA 6-Axis Welding Robot** | `ROBOT_09` | `Welder_Arm_09` | `ASSET-309` | Tier 2 (High) | $3,100 / hr |
| **Bosch High-Speed Flow Wrapper** | `PACK_01` | `Wrapper_Line_1` | `ASSET-401` | Tier 2 (High) | $2,400 / hr |

---

## 🤖 AI Diagnostic Agent & Deterministic Workflow

When anomalous degradation breaches rolling statistical thresholds (rejecting 1-tick transient sensor noise via rolling Z-score), the telemetry engine triggers the **Industrial Diagnostic Agent**.

The agent executes 4 deterministic enterprise tools in sequence:
1. **`get_sensor_window`**: Retrieves sliding-window telemetry (15 min) to compute rate of change (e.g. vibration slope $+1.33\text{ mm/s/min}$ and spindle temperature $+0.8\text{ }^\circ\text{C/min}$).
2. **`search_maintenance_manuals`**: Queries indexed OEM manuals for precise fault codes, shutdown thresholds, and clearance tolerances (e.g. Section 5.1, Page 112 of Haas VF-2 manual).
3. **`query_past_work_orders`**: Analyzes historical CMMS work order resolutions to calculate Mean Time To Repair (MTTR, e.g. 2.15 hours).
4. **`check_parts_inventory`**: Verifies exact ERP warehouse bin location, on-hand count, unit cost, and supplier lead time (e.g. SKU `BRG-6205-2RS`, Bin `BIN-A-12-04`).

### Financial ROI Formula
The agent calculates the precise financial ROI of proactive intervention versus catastrophic in-service failure:

$$\text{Planned Cost} = (\text{MTTR} \times \text{Hourly Downtime Rate}) + \text{Part Cost}$$
$$\text{Catastrophic Cost} = (\text{MTTR} \times 4.5 \times \text{Hourly Downtime Rate}) + (\text{Part Cost} \times 1.5) + \text{Secondary Damage Reserve}$$
$$\text{Net ROI Savings} = \text{Catastrophic Cost} - \text{Planned Cost}$$

*Example on CNC_04:*
- Planned Proactive Cost: $(2.15\text{h} \times \$4,200) + \$145 = \mathbf{\$9,175}$
- Catastrophic Cost: $(9.675\text{h} \times \$4,200) + \$217.50 + \$25,000 = \mathbf{\$65,868}$
- **Net Avoided Downtime ROI:** $\mathbf{\$56,693}$

### Closed-Loop HITL Approval & Inventory Decrement
The agent never mutates ERP records autonomously. It creates a ticket in `PENDING_HUMAN_APPROVAL` status. When an authorized plant engineer clicks **[Approve & Dispatch Technician]**:
1. The ticket transitions atomically to `APPROVED`.
2. The ERP spare part stock count is decremented by 1 (`BRG-6205-2RS` reserved stock updated).
3. A CMMS work order dispatch payload is logged with operator signature and timestamp.

---

## 🚀 Quickstart & Deployment

### Option 1: One-Command Docker Deployment (Recommended)

To spin up all 4 containerized services (PostgreSQL, Redis, FastAPI, Next.js):

```bash
# From the repository root:
docker-compose up --build
```

Access the services:
- **Web App Dashboard:** [http://localhost:3001](http://localhost:3001)
- **FastAPI API & Swagger UI:** [http://localhost:8001/docs](http://localhost:8001/docs)
- **API Health Check:** [http://localhost:8001/health](http://localhost:8001/health)

---

### Option 2: Local Development Setup

#### 1. Backend Service (`services/api`)
```bash
cd services/api

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows (or 'source venv/bin/activate' on Linux/macOS)

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend (defaults to SQLite fallback if PostgreSQL is not active)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

#### 2. Frontend SaaS Service (`services/web`)
```bash
cd services/web

# Install npm packages
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🧪 Interactive Simulation Verification

PlantPulse includes active simulation hooks to demonstrate the difference between transient sensor spikes and progressive machine degradation:

### 1. Inject Sensor Noise (Transient Spike)
Click **[Inject Sensor Noise]** or execute:
```bash
curl -X POST http://localhost:8001/api/v1/simulate/noise/CNC_04
```
**Expected Result:** The rolling Z-score filter flags the single-sample spike as transient non-sustained noise (+4.8σ). It logs to the event stream as `FILTERED_NOISE` and avoids generating false alarms or work orders.

### 2. Simulate Bearing Degradation Curve
Click **[Simulate Bearing Failure]** or execute:
```bash
curl -X POST http://localhost:8001/api/v1/simulate/degradation/CNC_04
```
**Expected Result:**
1. Progressively elevates vibration velocity and spindle temperature over consecutive ticks.
2. Anomaly detector confirms sustained deviation and launches the **Industrial Diagnostic Agent**.
3. Diagnostic agent executes all 4 tools, extracts manual citations, calculates $56,693 ROI, and creates a `PENDING_HUMAN_APPROVAL` ticket.
4. Opening the ticket in the dashboard displays the **HitlDrawer** with full agent execution trace, millisecond latencies, and OEM manual citations.
5. Clicking **[Approve & Dispatch Technician]** transitions the ticket to `APPROVED` and decrements warehouse stock.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, database connection, and ontology readiness |
| `GET` | `/api/v1/assets` | Resolved machine assets across IoT, ERP, and CMMS identifiers |
| `GET` | `/api/v1/stream/telemetry` | Server-Sent Events (SSE) live multi-machine telemetry feed |
| `GET` | `/api/v1/telemetry/{machine_id}/history` | Historical sliding-window telemetry points |
| `GET` | `/api/v1/tickets` | Maintenance tickets with agent traces and ROI breakdown |
| `POST` | `/api/v1/tickets/{id}/approve` | HITL approval endpoint (atomically decrements ERP inventory) |
| `GET` | `/api/v1/inventory` | Real-time spare parts stock counts, costs, and warehouse bins |
| `GET` | `/api/v1/manuals` | Indexed OEM manual chunks with full-text search |
| `POST` | `/api/v1/simulate/noise/{machine_id}` | Injects single-sample sensor spike |
| `POST` | `/api/v1/simulate/degradation/{machine_id}` | Injects progressive bearing degradation wear curve |
| `POST` | `/api/v1/simulate/reset/{machine_id}` | Resets machine telemetry to nominal baseline |

---

## 🔒 Security & Production Engineering Standards
- **Strict Decoupling:** API and Web frontend are physically separated into distinct Docker build contexts with environment-driven API URLs (`NEXT_PUBLIC_API_URL`).
- **Resilient AI Execution:** The diagnostic investigator features a zero-crash deterministic fallback engine that guarantees ticket creation, manual citation, and ROI computation even without third-party LLM API connectivity.
- **Atomic Operations:** Human approvals execute within an atomic transaction boundary to ensure ERP stock decrements never desync from ticket lifecycle state.
