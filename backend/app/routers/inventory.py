from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from typing import List
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import User, Vehicle, ActivityLog
from app.schemas import InventoryResponse, PurchaseRequest, RestockRequest, ActivityLogOut

router = APIRouter(prefix="/api/vehicles", tags=["Inventory"])


@router.post("/{vehicle_id}/purchase", response_model=InventoryResponse)
def purchase_vehicle(
    vehicle_id: int,
    payload: PurchaseRequest = PurchaseRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Purchase a vehicle, decreasing its quantity by the requested amount.
    Fails with 400 if insufficient stock.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if vehicle.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is out of stock",
        )
    if vehicle.quantity < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {vehicle.quantity}",
        )

    vehicle.quantity -= payload.quantity

    # Log the purchase
    log_entry = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        vehicle_id=vehicle.id,
        vehicle_make=vehicle.make,
        vehicle_model=vehicle.model,
        quantity=payload.quantity,
        total_price=vehicle.price * payload.quantity
    )
    db.add(log_entry)

    db.commit()
    db.refresh(vehicle)

    return InventoryResponse(
        message=f"Successfully purchased {payload.quantity} unit(s) of {vehicle.make} {vehicle.model}",
        vehicle_id=vehicle.id,
        new_quantity=vehicle.quantity,
    )


@router.post("/{vehicle_id}/restock", response_model=InventoryResponse)
def restock_vehicle(
    vehicle_id: int,
    payload: RestockRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Restock a vehicle, increasing its quantity (Admin only).
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    vehicle.quantity += payload.quantity
    db.commit()
    db.refresh(vehicle)

    return InventoryResponse(
        message=f"Successfully restocked {payload.quantity} unit(s) of {vehicle.make} {vehicle.model}",
        vehicle_id=vehicle.id,
        new_quantity=vehicle.quantity,
    )


@router.get("/purchases/logs", response_model=List[ActivityLogOut])
def get_purchase_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get purchase logs.
    Admins get all logs. Customers get only their own logs.
    """
    if current_user.is_admin:
        logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc()).all()
    else:
        logs = (
            db.query(ActivityLog)
            .filter(ActivityLog.user_id == current_user.id)
            .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
            .all()
        )
    return logs
