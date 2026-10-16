@AGENTS.md
Using the `fde-data-ontology` skill, scaffold the decoupled repository structure and database layer:
1. Create the root `docker-compose.yml` defining `db` (PostgreSQL 16 with healthcheck), `redis` (Redis 7 with healthcheck), `api-service` (`./services/api`), and `web-app` (`./services/web`), plus a root `.env.example`.
2. In `services/api`, create a clean modular FastAPI layout (`app/main.py`, `app/config.py`, `app/database.py`, `app/models.py`, `app/seed.py`, `Dockerfile`, `requirements.txt`). Support PostgreSQL via `DATABASE_URL` with an automatic fallback to local SQLite (`sqlite:///./plantpulse.db`) so local dev works both inside and outside Docker.
3. Implement `app/models.py` and `app/seed.py` to seed the 4 machines with dirty-to-clean Ontology IDs, 10 ERP spare parts, 8 historical work orders, and 6 OEM manual chunks on startup.
4. Expose `GET /health` and `GET /api/v1/assets` and verify the database seeds cleanly.
