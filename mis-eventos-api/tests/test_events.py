from datetime import datetime, timedelta, timezone

import pytest
from app.models.event import Event
from app.utils.enums import EventStatus, EventType
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession


# Helper para fechas futuras
def future_date(days=1):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

@pytest.mark.asyncio
async def test_create_event_organizer(client: AsyncClient, organizer_token: str):
    """Test que un organizador puede crear un evento"""
    response = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Evento Test",
            "description": "Descripción del evento",
            "start_date": future_date(10),
            "end_date": future_date(11),
            "location": "Online",
            "max_capacity": 100,
            "event_type": "conference"
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Evento Test"
    assert data["status"] == EventStatus.DRAFT
    assert data["available_spots"] == 100


@pytest.mark.asyncio
async def test_create_event_attendee_forbidden(client: AsyncClient, attendee_token: str):
    """Test que un asistente NO puede crear eventos"""
    response = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {attendee_token}"},
        json={
            "title": "Evento Hacker",
            "description": "Intento no autorizado",
            "start_date": future_date(10),
            "end_date": future_date(11),
            "location": "Dark Web",
            "max_capacity": 10,
            "event_type": "other"
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_events_visibility(
    client: AsyncClient, 
    organizer_token: str, 
    attendee_token: str
):
    """Test de visibilidad: Borradores solo para creador"""
    # 1. Organizador crea un borrador
    create_resp = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Borrador Secreto",
            "description": "Solo para mis ojos",
            "start_date": future_date(5),
            "end_date": future_date(6),
            "location": "Privado",
            "max_capacity": 50,
            "event_type": "workshop"
        },
    )
    assert create_resp.status_code == 201
    
    # 2. Organizador lista sus eventos (debe verlo)
    resp_org = await client.get(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {organizer_token}"}
    )
    assert resp_org.status_code == 200
    events_org = resp_org.json()
    assert any(e["title"] == "Borrador Secreto" for e in events_org)

    # 3. Asistente lista eventos (NO debe verlo)
    resp_att = await client.get(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert resp_att.status_code == 200
    events_att = resp_att.json()
    assert not any(e["title"] == "Borrador Secreto" for e in events_att)


@pytest.mark.asyncio
async def test_event_registration_flow(
    client: AsyncClient, 
    organizer_token: str, 
    attendee_token: str
):
    """Flujo completo: Publicar -> Registrar -> Validar Cupo -> Cancelar"""
    
    # 1. Crear evento
    resp = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Conferencia Pública",
            "description": "Abierta a todos",
            "start_date": future_date(20),
            "end_date": future_date(21),
            "location": "Estadio",
            "max_capacity": 2, # Cupo limitado para probar
            "event_type": "seminar"
        },
    )
    event_id = resp.json()["id"]

    # 2. Publicar evento (Update)
    update_resp = await client.put(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={"status": "published"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == EventStatus.PUBLISHED

    # 3. Asistente se registra
    reg_resp = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert reg_resp.status_code == 200
    assert reg_resp.json()["message"] == "Registro exitoso"

    # 4. Verificar cupos reducidos
    get_resp = await client.get(f"/api/v1/events/{event_id}")
    assert get_resp.json()["available_spots"] == 1

    # 5. Intentar registrarse de nuevo (debe fallar)
    reg_dup = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert reg_dup.status_code == 400
    
    # 6. Cancelar registro
    cancel_resp = await client.delete(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert cancel_resp.status_code == 200

    # 7. Verificar cupos restaurados
    get_resp_after = await client.get(f"/api/v1/events/{event_id}")
    assert get_resp_after.json()["available_spots"] == 2


@pytest.mark.asyncio
async def test_update_event_permissions(
    client: AsyncClient, 
    organizer_token: str,
    admin_token: str,
    attendee_token: str
):
    """Test permisos de edición"""
    # Crear evento
    resp = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Original",
            "description": "Desc",
            "start_date": future_date(1),
            "end_date": future_date(2),
            "location": "Loc",
            "max_capacity": 10,
            "event_type": "other"
        },
    )
    event_id = resp.json()["id"]

    # Asistente intenta editar (Forbidden)
    fail_resp = await client.put(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {attendee_token}"},
        json={"title": "Hacked"}
    )
    assert fail_resp.status_code == 403

    # Admin intenta editar (Allowed)
    admin_resp = await client.put(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"title": "Edited by Admin"}
    )
    assert admin_resp.status_code == 200
    assert admin_resp.json()["title"] == "Edited by Admin"
