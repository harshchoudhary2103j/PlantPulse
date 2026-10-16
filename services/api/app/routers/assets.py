from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import MachineAsset, AssetResponse

router = APIRouter(prefix="/api/v1/assets", tags=["Enterprise Ontology Assets"])

@router.get("", response_model=List[AssetResponse])
def get_all_assets(session: Session = Depends(get_session)):
    """
    Retrieve all resolved industrial machine assets with cross-system enterprise mappings:
    IoT Stream ID <-> SAP ERP Asset ID <-> ServiceNow CMMS ID
    """
    assets = session.exec(select(MachineAsset).order_by(MachineAsset.id)).all()
    return assets

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset_by_id(asset_id: str, session: Session = Depends(get_session)):
    asset = session.exec(select(MachineAsset).where(MachineAsset.id == asset_id)).first()
    if not asset:
        # Also try by iot_stream_id or erp_asset_id
        asset = session.exec(
            select(MachineAsset).where(
                (MachineAsset.iot_stream_id == asset_id) | 
                (MachineAsset.erp_asset_id == asset_id) |
                (MachineAsset.cmms_asset_id == asset_id)
            )
        ).first()
        
    if not asset:
        raise HTTPException(status_code=404, detail=f"Machine asset '{asset_id}' not found in Enterprise Ontology.")
    return asset
