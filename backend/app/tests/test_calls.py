from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_unauthorized_call_upload():
    # Attempting to POST without a valid Admin JWT should fail
    response = client.post("/api/v1/calls/", json={
        "client_name": "Test Client",
        "employee_id": "some-uuid",
        "status": "retained"
    })
    assert response.status_code == 401