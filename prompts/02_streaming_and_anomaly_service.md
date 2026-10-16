@AGENTS.md
Using the `fde-data-ontology` skill, build the real-time telemetry streaming and anomaly detection engine in `services/api`:
1. Create `app/services/telemetry_engine.py` that continuously generates realistic sensor readings (`vibration_mm_s`, `spindle_temp_c`, `motor_current_amps`, `rpm`) for all 4 machines and publishes updates via Redis pub/sub (with an in-memory async queue fallback if Redis isn't running locally).
2. Implement the two simulation endpoints:
   - `POST /api/v1/simulate/noise/{machine_id}`: Injects a 1-tick spike and logs an event showing the rolling Z-score filter rejected it as `FILTERED_NOISE`.
   - `POST /api/v1/simulate/degradation/{machine_id}`: Starts a realistic bearing wear degradation curve on the target machine that breaches the rolling anomaly window.
3. Expose `GET /api/v1/stream/telemetry` (Server-Sent Events) and `GET /api/v1/telemetry/{machine_id}/history` so the frontend gets real-time ticks and historical trends.
