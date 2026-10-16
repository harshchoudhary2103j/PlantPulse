from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import SparePartInventory, OEMManualChunk, WorkOrderHistory

router = APIRouter(prefix="/api/v1", tags=["ERP Inventory & OEM Manuals"])

@router.get("/inventory", response_model=List[SparePartInventory])
def get_inventory(
    category: Optional[str] = None,
    machine_id: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Retrieve live SAP ERP spare-parts inventory stock levels, warehouse bins,
    unit costs, lead times, and reserved counts.
    """
    query = select(SparePartInventory)
    if category:
        query = query.where(SparePartInventory.category == category)
    if machine_id:
        query = query.where(SparePartInventory.compatible_machine_id == machine_id)
        
    parts = session.exec(query.order_by(SparePartInventory.sku)).all()
    return parts

@router.get("/manuals", response_model=List[OEMManualChunk])
def get_manuals(
    machine_model: Optional[str] = None,
    q: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Retrieve seeded OEM machine manual excerpts, section headers, and page references.
    """
    query = select(OEMManualChunk)
    if machine_model:
        query = query.where(OEMManualChunk.machine_model == machine_model)
    
    manuals = session.exec(query.order_by(OEMManualChunk.id)).all()
    if q:
        query_str = q.lower()
        manuals = [
            m for m in manuals
            if query_str in m.document_title.lower() or
               query_str in m.section_title.lower() or
               query_str in m.keywords.lower() or
               query_str in m.content_excerpt.lower()
        ]
    return manuals

@router.get("/work-orders/history", response_model=List[WorkOrderHistory])
def get_work_order_history(
    machine_id: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Retrieve historical ServiceNow CMMS repair work orders, technician logs,
    and actual MTTR metrics.
    """
    query = select(WorkOrderHistory)
    if machine_id:
        query = query.where(WorkOrderHistory.machine_id == machine_id)
    orders = session.exec(query.order_by(WorkOrderHistory.completed_at.desc())).all()
    return orders
