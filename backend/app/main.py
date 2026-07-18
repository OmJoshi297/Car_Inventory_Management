from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.auth import hash_password
from app.models import User
from app.routers import auth, inventory, vehicles, customers, enquiries

from sqlalchemy import text

# Create all database tables on startup
Base.metadata.create_all(bind=engine)


def run_migrations():
    """Add is_on_sale and sale_price columns to vehicles table if they don't exist."""
    db = SessionLocal()
    try:
        # Check existing columns
        cursor = db.execute(text("PRAGMA table_info(vehicles)"))
        columns = [row[1] for row in cursor.fetchall()]
        
        if "is_on_sale" not in columns:
            db.execute(text("ALTER TABLE vehicles ADD COLUMN is_on_sale BOOLEAN DEFAULT 0 NOT NULL"))
            print("🔧 Added column 'is_on_sale' to 'vehicles' table")
            
        if "sale_price" not in columns:
            db.execute(text("ALTER TABLE vehicles ADD COLUMN sale_price FLOAT"))
            print("🔧 Added column 'sale_price' to 'vehicles' table")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error running migrations: {e}")
    finally:
        db.close()


run_migrations()



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
app.include_router(customers.router)
app.include_router(enquiries.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Car Dealership API is running 🚗"}
