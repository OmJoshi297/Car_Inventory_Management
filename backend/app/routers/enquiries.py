from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_optional_current_user, require_admin, get_current_user
from app.models import Enquiry, EnquiryMessage, User, Vehicle
from app.schemas import EnquiryCreate, EnquiryOut, EnquiryMessageCreate, EnquiryMessageOut

router = APIRouter(prefix="/api/enquiries", tags=["Enquiries"])


@router.post("", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
def create_enquiry(
    payload: EnquiryCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Create a new support chat session or retrieve an existing session for the user.
    Accessible to guests and logged-in customers.
    """
    # For registered users, locate their existing support chat session
    if current_user:
        existing = db.query(Enquiry).filter(
            Enquiry.user_id == current_user.id
        ).first()
        if existing:
            # Append message to existing thread
            new_msg = EnquiryMessage(
                enquiry_id=existing.id,
                sender_name=current_user.username,
                message=payload.message,
                is_from_admin=False
            )
            db.add(new_msg)
            db.commit()
            return existing

    # Create new support chat session thread
    enquiry = Enquiry(
        user_id=current_user.id if current_user else None,
        vehicle_id=None,
        vehicle_make=None,
        vehicle_model=None,
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # Insert first message in the thread
    first_msg = EnquiryMessage(
        enquiry_id=enquiry.id,
        sender_name=payload.name,
        message=payload.message,
        is_from_admin=False
    )
    db.add(first_msg)
    db.commit()
    return enquiry


@router.get("", response_model=List[EnquiryOut])
def get_enquiries(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Get all customer enquiry chat threads.
    Only accessible by administrators.
    """
    enquiries = db.query(Enquiry).order_by(Enquiry.created_at.desc(), Enquiry.id.desc()).all()
    return enquiries


@router.get("/my", response_model=List[EnquiryOut])
def get_my_enquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all enquiry chat threads started by the current logged-in customer.
    """
    enquiries = (
        db.query(Enquiry)
        .filter(Enquiry.user_id == current_user.id)
        .order_by(Enquiry.created_at.desc(), Enquiry.id.desc())
        .all()
    )
    return enquiries


@router.get("/{enquiry_id}/messages", response_model=List[EnquiryMessageOut])
def get_enquiry_messages(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get all messages in an enquiry chat room thread.
    Registered threads are restricted to owner or admin. Guest threads are accessible directly.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry thread not found",
        )

    # If the thread belongs to a registered customer, authenticate
    if enquiry.user_id is not None:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to view this thread",
            )
        if not current_user.is_admin and current_user.id != enquiry.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this thread",
            )

    messages = (
        db.query(EnquiryMessage)
        .filter(EnquiryMessage.enquiry_id == enquiry_id)
        .order_by(EnquiryMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("/{enquiry_id}/messages", response_model=EnquiryMessageOut, status_code=status.HTTP_201_CREATED)
def send_enquiry_message(
    enquiry_id: int,
    payload: EnquiryMessageCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Post a new message to an enquiry chat room.
    Guests can post to anonymous threads; registered threads require owner or admin.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry thread not found",
        )

    is_admin = current_user.is_admin if current_user else False

    # Check permission
    if not is_admin:
        if enquiry.user_id is not None:
            if not current_user or current_user.id != enquiry.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this thread",
                )

    sender_name = "Admin" if is_admin else (current_user.username if current_user else enquiry.name)

    msg = EnquiryMessage(
        enquiry_id=enquiry_id,
        sender_name=sender_name,
        message=payload.message,
        is_from_admin=is_admin,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enquiry(
    enquiry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Delete an enquiry thread (cascades message deletion).
    Only accessible by administrators.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found",
        )
    db.delete(enquiry)
    db.commit()
    return
