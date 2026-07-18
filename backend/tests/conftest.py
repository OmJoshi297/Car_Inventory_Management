"""
Pytest fixtures shared across all test modules.
Uses a separate in-memory SQLite database for tests (does not touch the production DB).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.auth import hash_password
from app.models import User, Vehicle

# ─── Test Database (in-file, isolated per test session) ───────────────────────
TEST_DATABASE_URL = "sqlite:///./test_dealership.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db():
    """Yield a fresh DB session and roll back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Clear tables before each test
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """TestClient with DB dependency overridden to use the test database."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── Shared Helpers ────────────────────────────────────────────────────────────

def create_user(db, username="testuser", email="test@example.com", password="password123", is_admin=False):
    """Helper: create and persist a user."""
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_vehicle(db, **kwargs):
    """Helper: create and persist a vehicle with sensible defaults."""
    defaults = {
        "make": "Toyota",
        "model": "Camry",
        "year": 2022,
        "category": "Sedan",
        "price": 25000.0,
        "quantity": 5,
        "description": "A reliable sedan",
        "color": "Silver",
        "mileage": 0,
    }
    defaults.update(kwargs)
    vehicle = Vehicle(**defaults)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def login(client, username="testuser", password="password123"):
    """Helper: log in and return the bearer token."""
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    return resp.json()["access_token"]


def auth_headers(client, username="testuser", password="password123"):
    """Helper: return Authorization header dict."""
    token = login(client, username, password)
    return {"Authorization": f"Bearer {token}"}
