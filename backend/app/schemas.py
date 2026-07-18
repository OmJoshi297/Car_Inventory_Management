import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Vehicle Schemas ───────────────────────────────────────────────────────────

VEHICLE_CATEGORIES = ["Sedan", "SUV", "Truck", "Coupe", "Van", "Electric", "Convertible", "Pickup"]


class VehicleCreate(BaseModel):
    make: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1900, le=2030)
    category: str = Field(..., description=f"One of: {VEHICLE_CATEGORIES}")
    price: float = Field(..., gt=0)
    quantity: int = Field(default=1, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = Field(default=None, description="List of photo URLs")
    color: Optional[str] = None
    mileage: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def sync_primary_image(self):
        """Ensure image_url is always set to the first image_urls entry."""
        if self.image_urls and len(self.image_urls) > 0:
            self.image_url = self.image_urls[0]
        elif self.image_url and not self.image_urls:
            self.image_urls = [self.image_url]
        return self


class VehicleUpdate(BaseModel):
    make: Optional[str] = Field(default=None, min_length=1, max_length=50)
    model: Optional[str] = Field(default=None, min_length=1, max_length=50)
    year: Optional[int] = Field(default=None, ge=1900, le=2030)
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    color: Optional[str] = None
    mileage: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def sync_primary_image(self):
        if self.image_urls and len(self.image_urls) > 0:
            self.image_url = self.image_urls[0]
        elif self.image_url and not self.image_urls:
            self.image_urls = [self.image_url]
        return self


class VehicleOut(BaseModel):
    id: int
    make: str
    model: str
    year: int
    category: str
    price: float
    quantity: int
    description: Optional[str]
    image_url: Optional[str]
    image_urls: Optional[List[str]] = None
    color: Optional[str]
    mileage: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("image_urls", mode="before")
    @classmethod
    def parse_image_urls(cls, v):
        """Parse JSON string from DB into a Python list."""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        try:
            return json.loads(v)
        except (json.JSONDecodeError, TypeError):
            return None


# ─── Inventory Schemas ─────────────────────────────────────────────────────────

class PurchaseRequest(BaseModel):
    quantity: int = Field(default=1, ge=1)


class RestockRequest(BaseModel):
    quantity: int = Field(..., ge=1)


class InventoryResponse(BaseModel):
    message: str
    vehicle_id: int
    new_quantity: int


class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: str
    vehicle_id: Optional[int] = None
    vehicle_make: str
    vehicle_model: str
    quantity: int
    total_price: float
    created_at: datetime

    model_config = {"from_attributes": True}
