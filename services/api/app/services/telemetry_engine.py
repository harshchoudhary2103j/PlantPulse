import asyncio
import json
import logging
import random
import time
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Set
import numpy as np
import redis.asyncio as aioredis
from sqlmodel import Session, select
from app.config import settings
from app.database import engine
from app.models import MachineAsset, TelemetryReading, SimulationLog, MaintenanceTicket

logger = logging.getLogger("plantpulse.telemetry")

class MachineState:
    def __init__(self, machine_id: str, baseline_vib: float, baseline_temp: float, baseline_curr: float, baseline_rpm: float):
        self.machine_id = machine_id
        self.baseline_vib = baseline_vib
        self.baseline_temp = baseline_temp
        self.baseline_curr = baseline_curr
        self.baseline_rpm = baseline_rpm
        
        # Telemetry history buffer (last 60 readings)
        self.history: deque = deque(maxlen=60)
        
        # Simulation flags
        self.noise_spike_injected: bool = False
        self.degradation_active: bool = False
        self.degradation_step: int = 0
        self.consecutive_anomalies: int = 0
        self.investigation_triggered: bool = False

        # Smooth recovery decay offsets
        self.recovering: bool = False
        self.recovery_offset_vib: float = 0.0
        self.recovery_offset_temp: float = 0.0
        self.recovery_offset_curr: float = 0.0

class TelemetryEngine:
    def __init__(self):
        self.machines: Dict[str, MachineState] = {
            "CNC_04": MachineState("CNC_04", baseline_vib=1.42, baseline_temp=42.5, baseline_curr=12.2, baseline_rpm=8250.0),
            "PRESS_02": MachineState("PRESS_02", baseline_vib=0.88, baseline_temp=48.2, baseline_curr=28.4, baseline_rpm=1450.0),
            "ROBOT_09": MachineState("ROBOT_09", baseline_vib=0.65, baseline_temp=38.4, baseline_curr=8.7, baseline_rpm=3100.0),
            "PACK_01": MachineState("PACK_01", baseline_vib=0.45, baseline_temp=35.1, baseline_curr=5.2, baseline_rpm=2400.0),
        }
        self.subscribers: Set[asyncio.Queue] = set()
        self.redis_client: Optional[aioredis.Redis] = None
        self.is_running: bool = False
        self._background_task: Optional[asyncio.Task] = None
        self._seed_initial_history()

    def _seed_initial_history(self):
        """Pre-populate 30 seconds of realistic normal operational history"""
        now = time.time()
        for machine_id, state in self.machines.items():
            for i in range(30, 0, -1):
                t = now - (i * 2)
                iso_ts = datetime.utcfromtimestamp(t).isoformat() + "Z"
                vib = round(state.baseline_vib + random.gauss(0, 0.08), 2)
                temp = round(state.baseline_temp + random.gauss(0, 0.25), 1)
                curr = round(state.baseline_curr + random.gauss(0, 0.15), 1)
                rpm = round(state.baseline_rpm + random.gauss(0, 15.0), 0)
                reading = {
                    "machine_id": machine_id,
                    "timestamp": iso_ts,
                    "vibration_mm_s": max(0.1, vib),
                    "spindle_temp_c": max(20.0, temp),
                    "motor_current_amps": max(1.0, curr),
                    "rpm": max(100.0, rpm),
                    "is_anomaly": False,
                    "anomaly_score": round(random.uniform(0.01, 0.12), 3),
                    "classification": "NORMAL",
                    "details": "Operational nominal baseline"
                }
                state.history.append(reading)

    async def connect_redis(self):
        try:
            self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Connected to Redis event broker successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis ({settings.REDIS_URL}): {e}. Using in-memory SSE broker.")
            self.redis_client = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        await self.connect_redis()
        self._background_task = asyncio.create_task(self._generation_loop())
        logger.info("Telemetry streaming engine background worker started.")

    async def stop(self):
        self.is_running = False
        if self._background_task:
            self._background_task.cancel()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("Telemetry streaming engine stopped.")

    async def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self.subscribers.discard(q)

    def trigger_noise_spike(self, machine_id: str) -> Dict:
        """Inject an instantaneous 1-tick electrical sensor spike"""
        if machine_id not in self.machines:
            return {"status": "error", "message": f"Machine {machine_id} not found"}
        
        state = self.machines[machine_id]
        state.noise_spike_injected = True
        logger.info(f"Triggered 1-tick sensor noise spike for {machine_id}")
        return {
            "status": "success",
            "machine_id": machine_id,
            "simulation": "TRANSIENT_SENSOR_NOISE",
            "message": "High-magnitude 1-tick spike injected. Rolling Z-filter will evaluate and reject it as noise."
        }

    def trigger_degradation(self, machine_id: str) -> Dict:
        """Initiate progressive mechanical bearing wear curve"""
        if machine_id not in self.machines:
            return {"status": "error", "message": f"Machine {machine_id} not found"}
        
        state = self.machines[machine_id]
        state.degradation_active = True
        state.degradation_step = 0
        state.consecutive_anomalies = 0
        state.investigation_triggered = False
        state.recovering = False
        state.recovery_offset_vib = 0.0
        state.recovery_offset_temp = 0.0
        state.recovery_offset_curr = 0.0
        logger.info(f"Triggered progressive bearing degradation curve for {machine_id}")
        return {
            "status": "success",
            "machine_id": machine_id,
            "simulation": "BEARING_DEGRADATION_CURVE",
            "message": "Progressive bearing wear degradation curve initiated. Anomaly detector will breach thresholds and wake the AI Diagnostic Agent."
        }

    def reset_machine(self, machine_id: str, smooth: bool = True) -> Dict:
        """
        Immediately resets the machine simulator state back to healthy baseline (NOMINAL),
        smoothly dropping vibration and temperature back to normal on the live chart.
        """
        if machine_id not in self.machines:
            return {"status": "error", "message": f"Machine {machine_id} not found"}
        
        state = self.machines[machine_id]
        
        # Calculate current elevation offsets to smoothly decay back to normal
        if smooth and state.degradation_active and len(state.history) > 0:
            last_reading = state.history[-1]
            state.recovery_offset_vib = max(0.0, last_reading.get("vibration_mm_s", state.baseline_vib) - state.baseline_vib)
            state.recovery_offset_temp = max(0.0, last_reading.get("spindle_temp_c", state.baseline_temp) - state.baseline_temp)
            state.recovery_offset_curr = max(0.0, last_reading.get("motor_current_amps", state.baseline_curr) - state.baseline_curr)
            state.recovering = True
        else:
            state.recovery_offset_vib = 0.0
            state.recovery_offset_temp = 0.0
            state.recovery_offset_curr = 0.0
            state.recovering = False

        state.degradation_active = False
        state.degradation_step = 0
        state.consecutive_anomalies = 0
        state.noise_spike_injected = False
        state.investigation_triggered = False

        # Immediately update DB asset status
        with Session(engine) as session:
            asset = session.exec(select(MachineAsset).where(MachineAsset.id == machine_id)).first()
            if asset:
                asset.status = "HEALTHY"
                asset.health_score = 98.5
                session.add(asset)
                session.commit()

        logger.info(f"[{machine_id}] Closed-loop machine recovery initiated (smooth={smooth}). Returning to healthy baseline.")
        return {
            "status": "success",
            "machine_id": machine_id,
            "message": f"Machine {machine_id} reset to healthy operational baseline (smooth decay initiated)."
        }

    def get_history(self, machine_id: str, limit: int = 50) -> List[Dict]:
        if machine_id not in self.machines:
            return []
        items = list(self.machines[machine_id].history)
        return items[-limit:]

    async def _broadcast(self, event_type: str, payload: Dict):
        message = json.dumps({"event": event_type, "data": payload})
        
        # 1. Publish to Redis if available
        if self.redis_client:
            try:
                await self.redis_client.publish("plantpulse:telemetry", message)
            except Exception as e:
                logger.error(f"Redis publish error: {e}")

        # 2. Push to local in-memory subscribers (SSE)
        dead_subscribers = []
        for q in self.subscribers:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                dead_subscribers.append(q)
            except Exception:
                dead_subscribers.append(q)

        for q in dead_subscribers:
            self.unsubscribe(q)

    def _process_reading(self, state: MachineState) -> Dict:
        now_iso = datetime.utcnow().isoformat() + "Z"
        vib = state.baseline_vib + random.gauss(0, 0.08)
        temp = state.baseline_temp + random.gauss(0, 0.25)
        curr = state.baseline_curr + random.gauss(0, 0.15)
        rpm = state.baseline_rpm + random.gauss(0, 15.0)

        classification = "NORMAL"
        is_anomaly = False
        anomaly_score = 0.05
        details = "Nominal operation within 3-sigma confidence bounds"

        # 1. Check for Noise Spike Injection (lasts exactly 1 tick)
        if state.noise_spike_injected:
            vib = state.baseline_vib + 4.2  # Spikes to ~5.6 mm/s
            temp = state.baseline_temp + 0.8
            state.noise_spike_injected = False
            classification = "FILTERED_NOISE"
            is_anomaly = False
            anomaly_score = 0.85
            details = "Transient 1-tick spike (+4.8σ) rejected by rolling median Z-score window; non-sustained."
            logger.info(f"[{state.machine_id}] 1-tick spike filtered by rolling Z-score: {details}")

        # 2. Check for Bearing Degradation Progression
        elif state.degradation_active:
            state.degradation_step += 1
            # Cap degradation progression at step 8 so telemetry sustains elevated plateau without drifting to infinity
            step = min(state.degradation_step, 8)
            vib_increase = min(3.6, 0.45 * step)
            temp_increase = min(16.0, 1.8 * step)
            curr_increase = min(4.5, 0.4 * step)
            rpm_jitter = random.gauss(-8.0 * step, 15.0)

            vib += vib_increase
            temp += temp_increase
            curr += curr_increase
            rpm += rpm_jitter

            if step >= 3:
                state.consecutive_anomalies += 1
                is_anomaly = True
                classification = "ANOMALY_TRIGGER"
                anomaly_score = min(0.99, 0.75 + (0.02 * step))
                details = f"CRITICAL ANOMALY: Sustained high-frequency vibration ({vib:.2f} mm/s) & thermal climb (+{temp_increase:.1f}°C). Breached 3-sigma envelope. Awaiting human approval."
            else:
                classification = "WARNING"
                anomaly_score = 0.45 + (0.1 * step)
                details = f"Pre-anomaly thermal and harmonic vibration slope trending upward (step {step})."

        # 3. Check for Post-Approval / Reset Smooth Recovery
        elif state.recovering:
            # Smooth exponential decay of the remaining elevated offsets back to 0.0
            state.recovery_offset_vib *= 0.52
            state.recovery_offset_temp *= 0.52
            state.recovery_offset_curr *= 0.52

            vib += state.recovery_offset_vib
            temp += state.recovery_offset_temp
            curr += state.recovery_offset_curr

            if state.recovery_offset_vib < 0.04 and state.recovery_offset_temp < 0.3:
                state.recovering = False
                state.recovery_offset_vib = 0.0
                state.recovery_offset_temp = 0.0
                state.recovery_offset_curr = 0.0
                classification = "NORMAL"
                details = "Closed-loop recovery complete. Machine returned to healthy nominal baseline."
                logger.info(f"[{state.machine_id}] Machine smoothly stabilized at nominal operational baseline.")
            else:
                classification = "RECOVERING"
                anomaly_score = round(max(0.04, state.recovery_offset_vib / 3.0), 2)
                details = f"Post-approval recovery: Telemetry smoothly dropping to baseline (Vib +{state.recovery_offset_vib:.2f} mm/s, Temp +{state.recovery_offset_temp:.1f}°C)."

        vib = max(0.1, round(vib, 2))
        temp = max(20.0, round(temp, 1))
        curr = max(1.0, round(curr, 1))
        rpm = max(100.0, round(rpm, 0))

        reading = {
            "machine_id": state.machine_id,
            "timestamp": now_iso,
            "vibration_mm_s": vib,
            "spindle_temp_c": temp,
            "motor_current_amps": curr,
            "rpm": rpm,
            "is_anomaly": is_anomaly,
            "anomaly_score": round(anomaly_score, 3),
            "classification": classification,
            "details": details
        }

        state.history.append(reading)
        return reading

    async def _generation_loop(self):
        """Continuously generate sensor readings every 2 seconds"""
        while self.is_running:
            try:
                readings = []
                for machine_id, state in self.machines.items():
                    reading = self._process_reading(state)
                    readings.append(reading)

                    # If sustained anomaly occurs, check that no active PENDING_HUMAN_APPROVAL ticket already exists
                    if reading["classification"] == "ANOMALY_TRIGGER" and not state.investigation_triggered:
                        # Guard against duplicate tickets in database
                        has_pending = False
                        try:
                            with Session(engine) as session:
                                existing_pending = session.exec(
                                    select(MaintenanceTicket).where(
                                        MaintenanceTicket.machine_id == machine_id,
                                        MaintenanceTicket.status == "PENDING_HUMAN_APPROVAL"
                                    )
                                ).first()
                                if existing_pending:
                                    has_pending = True
                        except Exception as err:
                            logger.error(f"Error checking pending tickets: {err}")

                        if not has_pending:
                            state.investigation_triggered = True
                            asyncio.create_task(self._trigger_agent_investigation(machine_id, reading))
                        else:
                            # Already has an active pending ticket; prevent duplicate agent launches
                            state.investigation_triggered = True

                # Broadcast batch of readings over SSE
                await self._broadcast("telemetry_tick", {"timestamp": datetime.utcnow().isoformat() + "Z", "readings": readings})
                
                # Update DB asset health asynchronously
                self._update_asset_db_cache(readings)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in telemetry loop: {e}", exc_info=True)

            await asyncio.sleep(2.0)

    def _update_asset_db_cache(self, readings: List[Dict]):
        try:
            with Session(engine) as session:
                for r in readings:
                    asset = session.exec(select(MachineAsset).where(MachineAsset.id == r["machine_id"])).first()
                    if asset:
                        asset.current_vibration = r["vibration_mm_s"]
                        asset.current_temp = r["spindle_temp_c"]
                        asset.current_current = r["motor_current_amps"]
                        asset.current_rpm = r["rpm"]
                        if r["classification"] == "ANOMALY_TRIGGER":
                            asset.status = "CRITICAL_ANOMALY"
                            asset.health_score = max(40.0, round(100.0 - (r["anomaly_score"] * 50.0), 1))
                        elif r["classification"] == "WARNING":
                            asset.status = "WARNING"
                            asset.health_score = max(70.0, round(100.0 - (r["anomaly_score"] * 30.0), 1))
                        elif r["classification"] == "RECOVERING":
                            asset.status = "HEALTHY"
                            asset.health_score = 92.0
                        else:
                            asset.status = "HEALTHY"
                            asset.health_score = 98.5
                        session.add(asset)
                session.commit()
        except Exception as e:
            logger.error(f"Failed to update asset DB cache: {e}")

    async def _trigger_agent_investigation(self, machine_id: str, anomaly_reading: Dict):
        """Invoke the deterministic AI Diagnostic Agent (imported lazily to avoid circular imports)"""
        try:
            logger.info(f"🚨 Sustained anomaly detected on {machine_id}! Launching AI Diagnostic Agent...")
            from app.agent.investigator import run_diagnostic_investigation
            ticket = await run_diagnostic_investigation(machine_id, anomaly_reading)
            logger.info(f"AI Diagnostic Agent created MaintenanceTicket: {ticket.id} (${ticket.net_roi_savings:,.2f} ROI) recommending SKU {ticket.recommended_part_sku}")
            # Broadcast new ticket alert to frontend via SSE
            await self._broadcast("agent_investigation_complete", {
                "ticket_id": ticket.id,
                "machine_id": machine_id,
                "title": ticket.title,
                "net_roi_savings": ticket.net_roi_savings,
                "recommended_part_sku": ticket.recommended_part_sku,
                "severity": ticket.severity,
                "status": ticket.status
            })
        except Exception as e:
            logger.error(f"Error running diagnostic agent investigation: {e}", exc_info=True)

telemetry_engine = TelemetryEngine()
