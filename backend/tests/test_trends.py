import pytest
from tests.conftest import create_user, create_vehicle, auth_headers


class TestVehicleSalesAndTrends:
    def test_add_vehicle_on_sale_validation(self, client, db):
        """Validate adding a vehicle with sale properties."""
        create_user(db)
        headers = auth_headers(client)

        # Successful creation of on-sale vehicle
        resp = client.post("/api/vehicles", json={
            "make": "Toyota",
            "model": "Supra",
            "year": 2023,
            "category": "Coupe",
            "price": 55000,
            "quantity": 2,
            "is_on_sale": True,
            "sale_price": 50000
        }, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["is_on_sale"] is True
        assert data["sale_price"] == 50000

        # Fails validation: sale price >= original price
        resp2 = client.post("/api/vehicles", json={
            "make": "Toyota",
            "model": "Supra",
            "year": 2023,
            "category": "Coupe",
            "price": 55000,
            "quantity": 2,
            "is_on_sale": True,
            "sale_price": 56000
        }, headers=headers)
        assert resp2.status_code == 422

        # Fails validation: is_on_sale is true but sale_price is missing
        resp3 = client.post("/api/vehicles", json={
            "make": "Toyota",
            "model": "Supra",
            "year": 2023,
            "category": "Coupe",
            "price": 55000,
            "quantity": 2,
            "is_on_sale": True
        }, headers=headers)
        assert resp3.status_code == 422

    def test_trends_endpoint_returns_data(self, client, db):
        """GET /api/vehicles/trends should return trends even without sales (fallback to newest)."""
        create_user(db)
        create_vehicle(db, make="Toyota", model="Camry", year=2021)
        create_vehicle(db, make="Honda", model="Accord", year=2022, is_on_sale=True, sale_price=20000)

        resp = client.get("/api/vehicles/trends")
        assert resp.status_code == 200
        data = resp.json()
        assert "most_selling" in data
        assert "on_sale" in data
        
        # fallback is active, should show both
        assert len(data["most_selling"]) == 2
        # on_sale list should contain the Accord
        assert len(data["on_sale"]) == 1
        assert data["on_sale"][0]["model"] == "Accord"

    def test_purchase_on_sale_vehicle_calculates_discounted_total(self, client, db):
        """Purchasing an on-sale vehicle should compute logs with the discounted sale price."""
        user = create_user(db)
        vehicle = create_vehicle(db, make="BMW", model="M3", price=70000, is_on_sale=True, sale_price=65000, quantity=5)
        headers = auth_headers(client)

        # Purchase 2 units
        resp = client.post(f"/api/vehicles/{vehicle.id}/purchase", json={"quantity": 2}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["new_quantity"] == 3

        # Check logs
        log_resp = client.get("/api/vehicles/purchases/logs", headers=headers)
        assert log_resp.status_code == 200
        logs = log_resp.json()
        assert len(logs) == 1
        # Discounted total should be: 65000 * 2 = 130000 (not 70000 * 2 = 140000)
        assert logs[0]["total_price"] == 130000

    def test_trends_ranks_most_selling_correctly(self, client, db):
        """Trends endpoint should rank the vehicles based on sales volume."""
        user = create_user(db)
        headers = auth_headers(client)

        v1 = create_vehicle(db, make="Toyota", model="Camry", quantity=10)
        v2 = create_vehicle(db, make="Honda", model="Accord", quantity=10)
        v3 = create_vehicle(db, make="Tesla", model="Model 3", quantity=10)

        # v2 gets 3 sales, v3 gets 1 sale, v1 gets 0 sales
        client.post(f"/api/vehicles/{v2.id}/purchase", json={"quantity": 3}, headers=headers)
        client.post(f"/api/vehicles/{v3.id}/purchase", json={"quantity": 1}, headers=headers)

        # Query trends
        resp = client.get("/api/vehicles/trends")
        assert resp.status_code == 200
        data = resp.json()
        
        # should order by: v2 (3 sales), then v3 (1 sale), then fallback ones
        assert data["most_selling"][0]["id"] == v2.id
        assert data["most_selling"][1]["id"] == v3.id
