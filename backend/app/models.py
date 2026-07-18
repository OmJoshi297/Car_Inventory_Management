from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime, Text, func, ForeignKey
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    category = Column(String(30), nullable=False, index=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    description = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)   # primary / first photo
    image_urls = Column(Text, nullable=True)          # JSON array of all photo URLs
    color = Column(String(30), nullable=True)
    mileage = Column(Integer, default=0, nullable=False)
    is_on_sale = Column(Boolean, default=False, nullable=False)
    sale_price = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(String(50), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    vehicle_make = Column(String(50), nullable=False)
    vehicle_model = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    vehicle_make = Column(String(50), nullable=True)
    vehicle_model = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EnquiryMessage(Base):
    __tablename__ = "enquiry_messages"

    id = Column(Integer, primary_key=True, index=True)
    enquiry_id = Column(Integer, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_from_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
