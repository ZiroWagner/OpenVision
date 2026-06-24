import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_create_camera(client: AsyncClient):
    payload = {
        "name": "Test Camera",
        "rtsp_url": "rtsp://192.168.1.100:554/stream1",
        "location": "Entrance",
    }
    response = await client.post("/api/cameras", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Camera"
    assert data["rtsp_url"] == "rtsp://192.168.1.100:554/stream1"
    assert data["location"] == "Entrance"
    assert data["status"] == "offline"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_cameras(client: AsyncClient):
    response = await client.get("/api/cameras")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_camera_not_found(client: AsyncClient):
    response = await client.get("/api/cameras/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_camera(client: AsyncClient):
    create_resp = await client.post("/api/cameras", json={
        "name": "Camera to Update",
        "rtsp_url": "rtsp://192.168.1.101:554/stream1",
    })
    camera_id = create_resp.json()["id"]

    response = await client.patch(
        f"/api/cameras/{camera_id}",
        json={"name": "Updated Camera", "status": "online"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Camera"
    assert response.json()["status"] == "online"


@pytest.mark.asyncio
async def test_delete_camera(client: AsyncClient):
    create_resp = await client.post("/api/cameras", json={
        "name": "Camera to Delete",
        "rtsp_url": "rtsp://192.168.1.102:554/stream1",
    })
    camera_id = create_resp.json()["id"]

    response = await client.delete(f"/api/cameras/{camera_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_create_event(client: AsyncClient):
    cam_resp = await client.post("/api/cameras", json={
        "name": "Event Camera",
        "rtsp_url": "rtsp://192.168.1.103:554/stream1",
    })
    camera_id = cam_resp.json()["id"]

    response = await client.post("/api/events", json={
        "camera_id": camera_id,
        "event_type": "person_detected",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["event_type"] == "person_detected"
    assert data["camera_id"] == camera_id


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/users", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123",
        "role": "viewer",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert data["role"] == "viewer"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_duplicate_user(client: AsyncClient):
    await client.post("/api/users", json={
        "name": "Duplicate",
        "email": "duplicate@example.com",
        "password": "securepassword123",
    })
    response = await client.post("/api/users", json={
        "name": "Duplicate",
        "email": "duplicate@example.com",
        "password": "securepassword123",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_alert(client: AsyncClient):
    cam_resp = await client.post("/api/cameras", json={
        "name": "Alert Camera",
        "rtsp_url": "rtsp://192.168.1.104:554/stream1",
    })
    camera_id = cam_resp.json()["id"]

    event_resp = await client.post("/api/events", json={
        "camera_id": camera_id,
        "event_type": "intrusion",
    })
    event_id = event_resp.json()["id"]

    response = await client.post("/api/alerts", json={
        "event_id": event_id,
        "alert_type": "critical",
        "channel": "telegram",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["alert_type"] == "critical"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_acknowledge_alert(client: AsyncClient):
    cam_resp = await client.post("/api/cameras", json={
        "name": "Ack Camera",
        "rtsp_url": "rtsp://192.168.1.105:554/stream1",
    })
    camera_id = cam_resp.json()["id"]

    event_resp = await client.post("/api/events", json={
        "camera_id": camera_id,
        "event_type": "test",
    })
    event_id = event_resp.json()["id"]

    alert_resp = await client.post("/api/alerts", json={
        "event_id": event_id,
        "alert_type": "info",
    })
    alert_id = alert_resp.json()["id"]

    response = await client.patch(f"/api/alerts/{alert_id}/acknowledge")
    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"
