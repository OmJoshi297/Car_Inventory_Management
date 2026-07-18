"""
TDD Tests for Authentication endpoints.

Tests cover:
- User registration (success, duplicate username, duplicate email, short password)
- User login (success, wrong password, unknown user)
- Token-protected endpoint enforcement
"""
import pytest
from tests.conftest import create_user, auth_headers


class TestRegister:
    def test_register_new_user_returns_201(self, client):
        """Registering a valid new user should return HTTP 201 with user details."""
        resp = client.post("/api/auth/register", json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "alice"
        assert data["email"] == "alice@example.com"
        assert data["is_admin"] is False
        assert "id" in data
        assert "hashed_password" not in data  # password must NOT be exposed

    def test_register_duplicate_username_returns_400(self, client, db):
        """Registering with an already-taken username should return HTTP 400."""
        create_user(db, username="bob", email="bob@example.com")
        resp = client.post("/api/auth/register", json={
            "username": "bob",
            "email": "different@example.com",
            "password": "password123",
        })
        assert resp.status_code == 400
        assert "Username already taken" in resp.json()["detail"]

    def test_register_duplicate_email_returns_400(self, client, db):
        """Registering with an already-registered email should return HTTP 400."""
        create_user(db, username="carol", email="carol@example.com")
        resp = client.post("/api/auth/register", json={
            "username": "carol2",
            "email": "carol@example.com",
            "password": "password123",
        })
        assert resp.status_code == 400
        assert "Email already registered" in resp.json()["detail"]

    def test_register_short_password_returns_422(self, client):
        """Password shorter than 6 characters should return HTTP 422 (validation error)."""
        resp = client.post("/api/auth/register", json={
            "username": "dave",
            "email": "dave@example.com",
            "password": "123",
        })
        assert resp.status_code == 422

    def test_register_missing_fields_returns_422(self, client):
        """Missing required fields should return HTTP 422."""
        resp = client.post("/api/auth/register", json={"username": "eve"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_valid_credentials_returns_token(self, client, db):
        """Login with correct credentials should return a JWT access token."""
        create_user(db, username="frank", email="frank@example.com", password="mypassword")
        resp = client.post("/api/auth/login", json={
            "username": "frank",
            "password": "mypassword",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "frank"

    def test_login_wrong_password_returns_401(self, client, db):
        """Login with wrong password should return HTTP 401."""
        create_user(db, username="grace", email="grace@example.com", password="correctpass")
        resp = client.post("/api/auth/login", json={
            "username": "grace",
            "password": "wrongpass",
        })
        assert resp.status_code == 401
        assert "Invalid username or password" in resp.json()["detail"]

    def test_login_nonexistent_user_returns_401(self, client):
        """Login with a username that doesn't exist should return HTTP 401."""
        resp = client.post("/api/auth/login", json={
            "username": "ghost",
            "password": "anypass",
        })
        assert resp.status_code == 401

    def test_login_returns_admin_flag(self, client, db):
        """Login response should correctly reflect the is_admin flag."""
        create_user(db, username="admin2", email="admin2@example.com", password="adminpass", is_admin=True)
        resp = client.post("/api/auth/login", json={"username": "admin2", "password": "adminpass"})
        assert resp.status_code == 200
        assert resp.json()["user"]["is_admin"] is True


class TestTokenProtection:
    def test_unauthenticated_request_to_protected_endpoint_returns_403(self, client):
        """Requests to protected endpoints without a token should be rejected."""
        resp = client.get("/api/vehicles/purchases/logs")
        assert resp.status_code in (401, 403)

    def test_invalid_token_returns_401(self, client):
        """An invalid/tampered token should be rejected."""
        resp = client.get(
            "/api/vehicles/purchases/logs",
            headers={"Authorization": "Bearer totally-invalid-token"},
        )
        assert resp.status_code == 401

    def test_valid_token_grants_access(self, client, db):
        """A valid token should grant access to protected endpoints."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/purchases/logs", headers=headers)
        assert resp.status_code == 200
