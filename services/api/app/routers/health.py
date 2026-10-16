from fastapi import APIRouter, Depends
from sqlmodel import Session, select, text
from app.database import get_session
from app.models import MachineAsset

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health")
def health_check(session: Session = Depends(get_session)):
    db_ok = True
    try:
        session.exec(select(MachineAsset).limit(1)).first()
    except Exception as e:
        db_ok = False
        
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "plantpulse-api",
        "version": "1.0.0",
        "database": "connected" if db_ok else "error",
        "ontology_ready": True
    }
