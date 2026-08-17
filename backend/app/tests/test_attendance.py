from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_attendance_status_unauthorized():
    response = client.get("/api/v1/attendance/status")
    assert response.status_code == 401