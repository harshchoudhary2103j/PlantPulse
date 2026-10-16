from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select
from app.services.telemetry_engine import telemetry_engine
from app.database import engine
from app.models import MachineAsset, SimulationLog

router = APIRouter(prefix="/api/v1/simulate", tags=["IoT Simulation Engine"])

@router.post("/noise/{machine_id}")
def simulate_sensor_noise(machine_id: str):
    """
    Injects a transient 1-tick electrical spike into the machine's telemetry stream.
    Demonstrates how the rolling Z-score statistical filter marks it as FILTERED_NOISE
    without raising false alarms or triggering the AI Agent.
    """
    res = telemetry_engine.trigger_noise_spike(machine_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))

    # Log simulation event
    with Session(engine) as session:
        log = SimulationLog(
            machine_id=machine_id,
            event_type="NOISE_SPIKE_INJECTED",
            details="Injected transient +4.8-sigma spike. Handled by rolling Z-score filter."
        )
        session.add(log)
        session.commit()

    return res

@router.post("/degradation/{machine_id}")
def simulate_bearing_degradation(machine_id: str):
    """
    Starts a progressive mechanical bearing wear degradation curve.
    Vibration and spindle temperature continuously escalate across ticks,
    breaching the rolling 3-sigma threshold, firing an AnomalyEvent, and invoking
    the AI Diagnostic Agent to execute the 4 deterministic tools.
    """
    res = telemetry_engine.trigger_degradation(machine_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))

    # Log simulation event
    with Session(engine) as session:
        log = SimulationLog(
            machine_id=machine_id,
            event_type="DEGRADATION_TRIGGERED",
            details="Initiated multi-step bearing degradation curve. Anomaly detection active."
        )
        session.add(log)
        session.commit()

    return res

@router.post("/reset/{machine_id}")
def reset_machine_simulation(machine_id: str):
    """
    Resets the machine telemetry and state back to nominal healthy baseline (smooth decay).
    """
    res = telemetry_engine.reset_machine(machine_id, smooth=True)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))

    # Log reset event
    with Session(engine) as session:
        log = SimulationLog(
            machine_id=machine_id,
            event_type="MACHINE_RESET",
            details="Simulator reset to nominal baseline. Live telemetry smoothly normalized."
        )
        session.add(log)
        session.commit()

    return res
