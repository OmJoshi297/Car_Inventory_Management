"""
TDD Tests for Inventory endpoints: purchase and restock.

Tests cover:
- POST /api/vehicles/:id/purchase — decrements quantity, out-of-stock guard
- POST /api/vehicles/:id/restock — increments quantity (admin only)
"""
import pytest
from tests.conftest import create_user, create_vehicle, auth_headers


class TestPurchaseVehicle:
    def test_purchase_decrements_quantity(self, client, db):
        """Purchasing a vehicle should decrease its quantity by 1."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=5)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_quantity"] == 4
        assert "Successfully purchased" in data["message"]

    def test_purchase_multiple_units(self, client, db):
        """Purchasing multiple units at once should decrement by the requested amount."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=10)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 3}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["new_quantity"] == 7

    def test_purchase_out_of_stock_returns_400(self, client, db):
        """Purchasing a vehicle with quantity=0 should return HTTP 400."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=0)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        assert resp.status_code == 400
        assert "out of stock" in resp.json()["detail"].lower()

    def test_purchase_insufficient_stock_returns_400(self, client, db):
        """Requesting more units than available should return 400."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=2)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 5}, headers=headers)
        assert resp.status_code == 400
        assert "Insufficient stock" in resp.json()["detail"]

    def test_purchase_until_zero(self, client, db):
        """Purchasing all remaining stock should reduce quantity to exactly 0."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=1)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["new_quantity"] == 0

    def test_purchase_nonexistent_vehicle_returns_404(self, client, db):
        """Purchasing a vehicle that doesn't exist should return 404."""
        create_user(db)
        headers = auth_headers(client)
        resp = client.post("/api/vehicles/99999/purchase", json={"quantity": 1}, headers=headers)
        assert resp.status_code == 404

    def test_purchase_unauthenticated_returns_403(self, client, db):
        """Purchasing without authentication should be rejected."""
        vehicle = create_vehicle(db)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1})
        assert resp.status_code in (401, 403)

    def test_purchase_zero_quantity_returns_422(self, client, db):
        """Attempting to purchase 0 units should fail validation (422)."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=5)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 0}, headers=headers)
        assert resp.status_code == 422

    def test_sequential_purchases_decrement_correctly(self, client, db):
        """Multiple sequential purchases should correctly accumulate decrements."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=5)
        headers = auth_headers(client)
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers)
        assert resp.json()["new_quantity"] == 2


class TestRestockVehicle:
    def test_admin_can_restock(self, client, db):
        """Admin should be able to restock a vehicle, increasing quantity."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db, quantity=2)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.post(f"/api/vehicles/{vehicle.id}/restock", json={"quantity": 10}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_quantity"] == 12
        assert "Successfully restocked" in data["message"]

    def test_non_admin_cannot_restock(self, client, db):
        """Regular user attempting to restock should receive 403 Forbidden."""
        create_user(db)
        vehicle = create_vehicle(db, quantity=2)
        headers = auth_headers(client)
        resp = client.post(f"/api/vehicles/{vehicle.id}/restock", json={"quantity": 10}, headers=headers)
        assert resp.status_code == 403

    def test_restock_nonexistent_vehicle_returns_404(self, client, db):
        """Restocking a vehicle that doesn't exist should return 404."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.post("/api/vehicles/99999/restock", json={"quantity": 5}, headers=headers)
        assert resp.status_code == 404

    def test_restock_zero_quantity_returns_422(self, client, db):
        """Restocking with 0 quantity should fail validation."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.post(f"/api/vehicles/{vehicle.id}/restock", json={"quantity": 0}, headers=headers)
        assert resp.status_code == 422

    def test_restock_unauthenticated_returns_403(self, client, db):
        """Restock without authentication should be rejected."""
        vehicle = create_vehicle(db)
        resp = client.post(f"/api/vehicles/{vehicle.id}/restock", json={"quantity": 5})
        assert resp.status_code in (401, 403)

    def test_restock_out_of_stock_vehicle(self, client, db):
        """Admin can restock a vehicle that was at zero quantity."""
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db, quantity=0)
        headers = auth_headers(client, username="admin_user", password="password123")
        resp = client.post(f"/api/vehicles/{vehicle.id}/restock", json={"quantity": 5}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["new_quantity"] == 5


class TestPurchaseLogs:
    def test_purchase_creates_activity_log(self, client, db):
        """A successful purchase should create an activity log entry."""
        create_user(db, username="customer_test", email="cust@example.com")
        vehicle = create_vehicle(db, make="Tesla", model="Model S", price=80000, quantity=5)
        headers = auth_headers(client, username="customer_test", password="password123")

        # Purchase 2 units
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 2}, headers=headers)
        assert resp.status_code == 200

        # Fetch logs
        resp_logs = client.get("/api/vehicles/purchases/logs", headers=headers)
        assert resp_logs.status_code == 200
        logs = resp_logs.json()
        assert len(logs) == 1
        log = logs[0]
        assert log["username"] == "customer_test"
        assert log["vehicle_make"] == "Tesla"
        assert log["vehicle_model"] == "Model S"
        assert log["quantity"] == 2
        assert log["total_price"] == 160000.0

    def test_customer_only_sees_own_logs(self, client, db):
        """A customer should only see logs for their own purchases, not other customers."""
        create_user(db, username="user_a", email="usera@example.com")
        create_user(db, username="user_b", email="userb@example.com")
        vehicle = create_vehicle(db, quantity=5)

        # User A purchases
        headers_a = auth_headers(client, username="user_a", password="password123")
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers_a)

        # User B purchases
        headers_b = auth_headers(client, username="user_b", password="password123")
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 2}, headers=headers_b)

        # User A checks logs
        resp_a = client.get("/api/vehicles/purchases/logs", headers=headers_a)
        logs_a = resp_a.json()
        assert len(logs_a) == 1
        assert logs_a[0]["quantity"] == 1
        assert logs_a[0]["username"] == "user_a"

        # User B checks logs
        resp_b = client.get("/api/vehicles/purchases/logs", headers=headers_b)
        logs_b = resp_b.json()
        assert len(logs_b) == 1
        assert logs_b[0]["quantity"] == 2
        assert logs_b[0]["username"] == "user_b"

    def test_admin_sees_all_logs(self, client, db):
        """An admin user should be able to see all purchase logs across all customers."""
        create_user(db, username="user_a", email="usera@example.com")
        create_user(db, username="user_b", email="userb@example.com")
        create_user(db, username="admin_user", email="admin@example.com", is_admin=True)
        vehicle = create_vehicle(db, quantity=5)

        # User A purchases
        headers_a = auth_headers(client, username="user_a", password="password123")
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 1}, headers=headers_a)

        # User B purchases
        headers_b = auth_headers(client, username="user_b", password="password123")
        client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 2}, headers=headers_b)

        # Admin checks logs
        headers_admin = auth_headers(client, username="admin_user", password="password123")
        resp_admin = client.get("/api/vehicles/purchases/logs", headers=headers_admin)
        logs_admin = resp_admin.json()
        assert len(logs_admin) == 2
        # Verify ordering (latest first)
        assert logs_admin[0]["username"] == "user_b"
        assert logs_admin[1]["username"] == "user_a"

    def test_logs_unauthenticated_returns_403(self, client, db):
        """Unauthenticated access to logs endpoint should return 401 or 403."""
        resp = client.get("/api/vehicles/purchases/logs")
        assert resp.status_code in (401, 403)
