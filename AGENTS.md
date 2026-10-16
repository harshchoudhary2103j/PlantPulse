# PlantPulse — Industrial AI Operations & Predictive Maintenance SaaS

## Architecture Philosophy (Decoupled Service-Oriented, Deployment-Ready)
PlantPulse is strictly decoupled into independent, containerized services orchestrated via `docker-compose.yml` (ready for 1-click deployment on Railway, Render, Fly.io, or AWS ECS):
1. **`db` (PostgreSQL 16):** Persistent relational store for Enterprise Ontology, ERP Spare Parts Inventory, Historical CMMS Work Orders, OEM Manual chunks, and Telemetry history.
2. **`redis` (Redis 7):** Lightweight event broker and pub/sub stream for real-time IoT telemetry ingestion and anomaly event decoupling (replaces heavy JVM Kafka while remaining production-grade).
3. **`api-service` (FastAPI + Async Worker):** Stateless Python 3.11 microservice handling REST endpoints, SSE live streams, background IoT simulation/anomaly worker, and the AI Diagnostic Agent (`services/api`).
4. **`web-app` (Next.js 14+ App Router):** Standalone enterprise B2B SaaS frontend (`services/web`) communicating strictly via typed REST and Server-Sent Events (SSE) APIs.

## Tech Stack
- **Backend Service (`services/api`):** Python 3.11, FastAPI, SQLModel (Async PostgreSQL via `asyncpg` with SQLite fallback for local testing), Redis (`redis-py`), Pydantic v2, `scikit-learn` (IsolationForest / Rolling Z-score).
- **AI Agent Engine (`services/api/agent`):** Deterministic tool-calling agent supporting live `GEMINI_API_KEY` and a zero-crash deterministic fallback engine.
- **Frontend SaaS (`services/web`):** Next.js (App Router, standalone Docker build), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Lucide Icons, `cmdk` (Command Palette).
- **Infrastructure:** Multi-stage `Dockerfile` for each service, root `docker-compose.yml`, `.env.example`, and healthcheck endpoints (`/health`).

## Engineering & Production Rules
1. **Strict Service Decoupling:** Never mix frontend and backend code. All communication happens over versioned API routes (`/api/v1/...`) with strict CORS and Pydantic schemas.
2. **Enterprise Ontology Resolution:** Every machine must display its resolved identity across siloed factory systems (`IoT Stream ID` ↔ `ERP Asset ID` ↔ `CMMS Work Order ID`).
3. **Closed-Loop HITL & Financial ROI:** The AI agent must execute 4 deterministic tools (`get_sensor_window`, `search_maintenance_manuals`, `query_past_work_orders`, `check_parts_inventory`), compute exact Cost-of-Downtime ROI, and create tickets in `PENDING_HUMAN_APPROVAL` status. Approving a ticket atomically decrements ERP inventory in PostgreSQL.
