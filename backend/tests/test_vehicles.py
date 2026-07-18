"""
TDD Tests for Vehicle CRUD and Search endpoints.

Tests cover:
- POST /api/vehicles — add vehicle (authenticated)
- GET /api/vehicles — list all vehicles
- GET /api/vehicles/search — filter by make/model/category/price
- PUT /api/vehicles/:id — update vehicle
- DELETE /api/vehicles/:id — admin-only delete
"""
import pytest
from tests.conftest import create_user, create_vehicle, auth_headers


class TestAddVehicle:
    def test_add_vehicle_returns_201(self, client, db):
        """Authenticated user can add a vehicle and get 201 response."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.post("/api/vehicles", json={
            "make": "Honda",
            "model": "Civic",
            "year": 2023,
            "category": "Sedan",
            "price": 22000,
            "quantity": 3,
        }, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["make"] == "Honda"
        assert data["model"] == "Civic"
        assert data["year"] == 2023
        assert data["quantity"] == 3
        assert "id" in data

    def test_add_vehicle_unauthenticated_returns_403(self, client):
        """Adding a vehicle without auth should be rejected."""
        resp = client.post("/api/vehicles", json={
            "make": "BMW", "model": "M3", "year": 2022,
            "category": "Sedan", "price": 70000,
        })
        assert resp.status_code in (401, 403)

    def test_add_vehicle_negative_price_returns_422(self, client, db):
        """Price must be positive; negative price should return 422."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.post("/api/vehicles", json={
            "make": "Tesla", "model": "Model 3", "year": 2023,
            "category": "Electric", "price": -100,
        }, headers=headers)
        assert resp.status_code == 422

    def test_add_vehicle_invalid_year_returns_422(self, client, db):
        """Year must be between 1900 and 2030."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.post("/api/vehicles", json={
            "make": "Tesla", "model": "Model S", "year": 1800,
            "category": "Electric", "price": 80000,
        }, headers=headers)
        assert resp.status_code == 422


class TestListVehicles:
    def test_list_vehicles_returns_all(self, client, db):
        """GET /api/vehicles should return all vehicles as a list."""
        create_user(db)
        create_vehicle(db, make="Toyota", model="Camry")
        create_vehicle(db, make="Ford", model="F-150")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_list_vehicles_empty_returns_empty_list(self, client, db):
        """When no vehicles exist, return empty list."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.get("/api/vehicles", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_vehicles_returns_correct_fields(self, client, db):
        """Vehicle response should include all required fields."""
        create_user(db)
        create_vehicle(db)
        headers = auth_headers(client)
        resp = client.get("/api/vehicles", headers=headers)
        vehicle = resp.json()[0]
        required_fields = ["id", "make", "model", "year", "category", "price", "quantity", "created_at"]
        for field in required_fields:
            assert field in vehicle, f"Missing field: {field}"


class TestSearchVehicles:
    def test_search_by_make(self, client, db):
        """Search by make should return only matching vehicles."""
        create_user(db)
        create_vehicle(db, make="Toyota", model="Camry")
        create_vehicle(db, make="Honda", model="Accord")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?make=Toyota", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["make"] == "Toyota"

    def test_search_by_model(self, client, db):
        """Search by model should filter correctly."""
        create_user(db)
        create_vehicle(db, make="Toyota", model="Camry")
        create_vehicle(db, make="Toyota", model="Corolla")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?model=Camry", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["model"] == "Camry"

    def test_search_by_category(self, client, db):
        """Search by category should return only vehicles in that category."""
        create_user(db)
        create_vehicle(db, make="Tesla", model="Model 3", category="Electric")
        create_vehicle(db, make="Honda", model="CR-V", category="SUV")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?category=Electric", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["category"] == "Electric"

    def test_search_by_price_range(self, client, db):
        """Search with min/max price should filter by price range."""
        create_user(db)
        create_vehicle(db, make="Budget", model="Car", price=10000)
        create_vehicle(db, make="Mid", model="Car", price=30000)
        create_vehicle(db, make="Luxury", model="Car", price=80000)
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?min_price=15000&max_price=50000", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["make"] == "Mid"

    def test_search_combined_filters(self, client, db):
        """Multiple filters combined should narrow results correctly."""
        create_user(db)
        create_vehicle(db, make="Toyota", model="Camry", category="Sedan", price=25000)
        create_vehicle(db, make="Toyota", model="RAV4", category="SUV", price=35000)
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?make=Toyota&category=Sedan", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["model"] == "Camry"

    def test_search_no_match_returns_empty(self, client, db):
        """Search with no matching results returns empty list."""
        create_user(db)
        create_vehicle(db, make="Toyota")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?make=Ferrari", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_search_case_insensitive(self, client, db):
        """Search should be case-insensitive."""
        create_user(db)
        create_vehicle(db, make="Toyota")
        headers = auth_headers(client)
        resp = client.get("/api/vehicles/search?make=toyota", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1


class TestUpdateVehicle:
    def test_update_vehicle_returns_updated_data(self, client, db):
        """PUT should update the vehicle and return updated fields."""
        create_user(db)
        vehicle = create_vehicle(db, price=25000.0)
        headers = auth_headers(client)
        resp = client.put(f"/api/vehicles/{vehicle.id}", json={"price": 27500.0}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["price"] == 27500.0

    def test_update_nonexistent_vehicle_returns_404(self, client, db):
        """Updating a vehicle that doesn't exist should return 404."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.put("/api/vehicles/99999", json={"price": 1000}, headers=headers)
        assert resp.status_code == 404

    def test_partial_update_only_changes_provided_fields(self, client, db):
        """Only the provided fields should change; other fields remain intact."""
        create_user(db)
        vehicle = create_vehicle(db, make="Toyota", model="Camry", price=25000.0)
        headers = auth_headers(client)
        resp = client.put(f"/api/vehicles/{vehicle.id}", json={"price": 28000.0}, headers=headers)
        data = resp.json()
        assert data["make"] == "Toyota"   # unchanged
        assert data["model"] == "Camry"   # unchanged
        assert data["price"] == 28000.0   # updated


class TestDeleteVehicle:
    def test_admin_can_delete_vehicle(self, client, db):
        """Admin user should be able to delete a vehicle (204 No Content)."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.delete(f"/api/vehicles/{vehicle.id}", headers=headers)
        assert resp.status_code == 204

    def test_non_admin_cannot_delete_vehicle(self, client, db):
        """Regular user attempting to delete should receive 403 Forbidden."""
        create_user(db)
        vehicle = create_vehicle(db)
        headers = auth_headers(client)
        resp = client.delete(f"/api/vehicles/{vehicle.id}", headers=headers)
        assert resp.status_code == 403

    def test_delete_nonexistent_vehicle_returns_404(self, client, db):
        """Deleting a non-existent vehicle should return 404."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.delete("/api/vehicles/99999", headers=headers)
        assert resp.status_code == 404

    def test_deleted_vehicle_no_longer_appears_in_list(self, client, db):
        """After deletion, the vehicle should not appear in the vehicle list."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db)
        headers = auth_headers(client, username="admin_user", password="password123")
        client.delete(f"/api/vehicles/{vehicle.id}", headers=headers)
        resp = client.get("/api/vehicles", headers=headers)
        assert all(v["id"] != vehicle.id for v in resp.json())
