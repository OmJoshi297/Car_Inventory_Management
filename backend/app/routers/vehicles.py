import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import User, Vehicle, ActivityLog
from app.schemas import VehicleCreate, VehicleOut, VehicleUpdate, VehicleTrends

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


def _prepare_vehicle_data(data: dict) -> dict:
    """Serialize image_urls list → JSON string for DB storage."""
    if "image_urls" in data and isinstance(data["image_urls"], list):
        data["image_urls"] = json.dumps(data["image_urls"])
    return data


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def add_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new vehicle to the inventory (authenticated users)."""
    data = _prepare_vehicle_data(payload.model_dump())
    vehicle = Vehicle(**data)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
):
    """Retrieve all vehicles in the inventory."""
    return db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()


@router.get("/search", response_model=List[VehicleOut])
def search_vehicles(
    make: Optional[str] = Query(default=None, description="Filter by make"),
    model: Optional[str] = Query(default=None, description="Filter by model"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    min_price: Optional[float] = Query(default=None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(default=None, ge=0, description="Maximum price"),
    db: Session = Depends(get_db),
):
    """Search vehicles by make, model, category, or price range."""
    query = db.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make.ilike(f"%{make}%"))
    if model:
        query = query.filter(Vehicle.model.ilike(f"%{model}%"))
    if category:
        query = query.filter(Vehicle.category.ilike(f"%{category}%"))
    if min_price is not None:
        query = query.filter(Vehicle.price >= min_price)
    if max_price is not None:
        query = query.filter(Vehicle.price <= max_price)

    return query.order_by(Vehicle.price.asc()).all()


@router.get("/trends", response_model=VehicleTrends)
def get_vehicle_trends(db: Session = Depends(get_db)):
    """Retrieve trending (most selling) and on-sale vehicles."""
    # Find most selling vehicles based on ActivityLog
    # Sum the quantity purchased for each vehicle_id
    most_selling_ids = (
        db.query(ActivityLog.vehicle_id, func.sum(ActivityLog.quantity).label("total_sold"))
        .filter(ActivityLog.vehicle_id != None)
        .group_by(ActivityLog.vehicle_id)
        .order_by(func.sum(ActivityLog.quantity).desc())
        .limit(4)
        .all()
    )
    
    most_selling = []
    if most_selling_ids:
        # Fetch the vehicles in the order of sales
        id_order = {row[0]: idx for idx, row in enumerate(most_selling_ids)}
        vehicles_found = db.query(Vehicle).filter(Vehicle.id.in_(id_order.keys())).all()
        # Sort them according to the rank
        most_selling = sorted(vehicles_found, key=lambda v: id_order.get(v.id, 999))
        
    # Fallback to newest vehicles if no sales recorded yet
    if not most_selling:
        most_selling = db.query(Vehicle).order_by(Vehicle.created_at.desc()).limit(4).all()
        
    # Get vehicles currently on sale
    on_sale = (
        db.query(Vehicle)
        .filter(Vehicle.is_on_sale == True)
        .order_by(Vehicle.created_at.desc())
        .limit(4)
        .all()
    )
    
    return VehicleTrends(most_selling=most_selling, on_sale=on_sale)


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a vehicle's details (authenticated users)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = _prepare_vehicle_data(payload.model_dump(exclude_unset=True))
    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a vehicle from the inventory (Admin only)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db.delete(vehicle)
    db.commit()
