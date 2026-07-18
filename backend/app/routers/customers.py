from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import require_admin
from app.models import User
from app.schemas import UserOut

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=List[UserOut])
def get_customers(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Get all registered customer accounts (non-admin users).
    Only accessible by administrators.
    """
    customers = db.query(User).filter(User.is_admin == False).all()
    return customers


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Delete a customer account.
    Only accessible by administrators.
    """
    customer = db.query(User).filter(User.id == customer_id, User.is_admin == False).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    db.delete(customer)
    db.commit()
    return
