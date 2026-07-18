from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.auth import hash_password
from app.models import User
from app.routers import auth, inventory, vehicles

# Create all database tables on startup
Base.metadata.create_all(bind=engine)


def seed_admin():
    """Seed a default admin account if none exists."""
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.is_admin == True).first()
        if not admin_exists:
            admin = User(
                username="admin",
                email="admin@dealership.com",
                hashed_password=hash_password("admin123"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin seeded: username=admin, password=admin123")
    finally:
        db.close()


seed_admin()

app = FastAPI(
    title="Car Dealership Inventory API",
    description="RESTful API for managing a car dealership inventory with JWT authentication.",
    version="1.0.0",
)

# Allow frontend dev server origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(inventory.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Car Dealership API is running 🚗"}
