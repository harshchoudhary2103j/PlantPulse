import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.telemetry_engine import telemetry_engine

router = APIRouter(prefix="/api/v1", tags=["Real-time Telemetry"])

@router.get("/stream/telemetry")
async def stream_telemetry():
    """
    Server-Sent Events (SSE) live feed delivering 2-second telemetry ticks,
    anomaly notifications, and AI diagnostic agent events to the SaaS UI.
    """
    async def event_generator():
        q = await telemetry_engine.subscribe()
        try:
            # Send initial hello ping
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'service': 'PlantPulse SSE Telemetry'})}\n\n"
            while True:
                message = await q.get()
                yield f"event: telemetry\ndata: {message}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            telemetry_engine.unsubscribe(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/telemetry/{machine_id}/history")
def get_machine_telemetry_history(machine_id: str, limit: int = 50):
    """
    Retrieve recent historical sensor readings (vibration, temperature, current, RPM)
    for interactive Recharts visualization in the Command Center.
    """
    history = telemetry_engine.get_history(machine_id, limit=limit)
    if not history:
        # Check if valid machine
        if machine_id not in telemetry_engine.machines:
            raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")
    return {
        "machine_id": machine_id,
        "count": len(history),
        "data": history
    }
