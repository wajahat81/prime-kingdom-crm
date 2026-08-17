from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_commission_calculation_unauthorized():
    response = client.post("/api/v1/commissions/", json={
        "employee_id": "uuid",
        "total_retained_calls": 100,
        "month": "2026-08"
    })
    assert response.status_code == 401