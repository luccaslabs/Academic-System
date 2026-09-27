from datetime import datetime, timedelta, timezone

from helpers import create_class, create_discipline, create_student_profile, enroll


def test_create_and_list_general_event(client, admin_headers, student_headers):
    headers, _ = student_headers
    event_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()

    response = client.post(
        "/calendar", json={"title": "Prova geral", "event_type": "exam", "event_date": event_date}, headers=admin_headers
    )
    assert response.status_code == 200

    listing = client.get("/calendar", headers=headers)
    assert listing.status_code == 200
    assert any(e["title"] == "Prova geral" for e in listing.json())


def test_class_event_hidden_from_unrelated_student(client, admin_headers, student_headers, second_student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])

    headers, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    event_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()

    event_response = client.post(
        "/calendar",
        json={"title": "Prova da turma", "event_type": "exam", "event_date": event_date, "class_id": school_class["id"]},
        headers=admin_headers,
    )
    event = event_response.json()

    other_headers, _ = second_student_headers
    response = client.get(f"/calendar/{event['id']}", headers=other_headers)
    assert response.status_code == 403


def test_invalid_event_type_returns_422(client, admin_headers):
    event_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

    response = client.post(
        "/calendar", json={"title": "X", "event_type": "feriado", "event_date": event_date}, headers=admin_headers
    )
    assert response.status_code == 422