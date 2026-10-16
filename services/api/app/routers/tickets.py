from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import MaintenanceTicket, SparePartInventory, TicketApprovalRequest

router = APIRouter(prefix="/api/v1/tickets", tags=["HITL Work Order Tickets"])

@router.get("", response_model=List[MaintenanceTicket])
def get_all_tickets(session: Session = Depends(get_session)):
    """
    Retrieve all maintenance tickets with financial ROI breakdown, OEM manual citations,
    and granular JSON tool_trace observability logs.
    """
    tickets = session.exec(select(MaintenanceTicket).order_by(MaintenanceTicket.created_at.desc())).all()
    return tickets

@router.get("/{ticket_id}", response_model=MaintenanceTicket)
def get_ticket_by_id(ticket_id: str, session: Session = Depends(get_session)):
    ticket = session.exec(select(MaintenanceTicket).where(MaintenanceTicket.id == ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket

@router.post("/{ticket_id}/approve")
def approve_ticket(
    ticket_id: str, 
    body: Optional[TicketApprovalRequest] = None, 
    session: Session = Depends(get_session)
):
    """
    Human-in-the-Loop (HITL) Closed-Loop Action:
    1. Transitions ticket from PENDING_HUMAN_APPROVAL to APPROVED.
    2. Atomically decrements the linked SparePartInventory stock by 1 and records reservation.
    3. Records operator approval signature and timestamp.
    """
    ticket = session.exec(select(MaintenanceTicket).where(MaintenanceTicket.id == ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    if ticket.status == "APPROVED":
        return {
            "status": "already_approved",
            "message": f"Ticket {ticket_id} has already been approved.",
            "ticket": ticket
        }

    operator_name = body.operator_name if body else "Plant Chief Engineer (Austin Line B)"
    ticket.status = "APPROVED"
    ticket.approved_by = operator_name
    ticket.approved_at = datetime.utcnow()
    session.add(ticket)

    # Decrement ERP spare part inventory
    part = session.exec(
        select(SparePartInventory).where(SparePartInventory.sku == ticket.recommended_part_sku)
    ).first()

    part_decremented = False
    new_stock = None
    if part:
        if part.stock_count > 0:
            part.stock_count -= 1
            part.reserved_count += 1
            part.updated_at = datetime.utcnow()
            session.add(part)
            part_decremented = True
            new_stock = part.stock_count

    session.commit()
    session.refresh(ticket)

    # Closed-Loop Lifecycle Action:
    # As soon as the human operator approves the ticket, immediately reset the machine simulator
    # in telemetry_engine.py back to healthy baseline (smoothly dropping vibration and temperature).
    from app.services.telemetry_engine import telemetry_engine
    telemetry_engine.reset_machine(ticket.machine_id, smooth=True)

    return {
        "status": "success",
        "message": f"Ticket {ticket_id} approved. Work order dispatched and {ticket.machine_id} simulator reset to healthy baseline.",
        "ticket_id": ticket.id,
        "ticket_status": ticket.status,
        "approved_by": ticket.approved_by,
        "approved_at": ticket.approved_at.isoformat() + "Z",
        "part_sku": ticket.recommended_part_sku,
        "part_inventory_decremented": part_decremented,
        "remaining_stock": new_stock,
        "machine_reset": True
    }
