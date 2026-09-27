from helpers import create_class, create_discipline, create_student_profile, enroll


def test_general_notice_visible_to_all_and_creates_notifications(client, admin_headers, student_headers):
    headers, _ = student_headers

    response = client.post("/notices", json={"title": "Aviso geral", "content": "Conteúdo do aviso"}, headers=admin_headers)
    assert response.status_code == 200

    listing = client.get("/notices", headers=headers)
    assert listing.status_code == 200
    assert any(n["title"] == "Aviso geral" for n in listing.json())

    notifications = client.get("/notifications", headers=headers)
    assert notifications.status_code == 200
    assert any(n["reference_type"] == "notice" for n in notifications.json())


def test_class_notice_hidden_from_unrelated_student(client, admin_headers, student_headers, second_student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])

    headers, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    notice_response = client.post(
        "/notices",
        json={"title": "Aviso da turma", "content": "Só para a turma", "class_id": school_class["id"]},
        headers=admin_headers,
    )
    notice = notice_response.json()

    enrolled_view = client.get(f"/notices/{notice['id']}", headers=headers)
    assert enrolled_view.status_code == 200

    other_headers, _ = second_student_headers
    unrelated_view = client.get(f"/notices/{notice['id']}", headers=other_headers)
    assert unrelated_view.status_code == 403


def test_mark_notification_as_read(client, admin_headers, student_headers):
    headers, _ = student_headers

    client.post("/notices", json={"title": "Aviso", "content": "Texto"}, headers=admin_headers)

    notifications = client.get("/notifications", headers=headers).json()
    notification_id = notifications[0]["id"]

    response = client.put(f"/notifications/{notification_id}/read", headers=headers)
    assert response.status_code == 200
    assert response.json()["read"] is True


def test_cannot_mark_others_notification_as_read(client, admin_headers, student_headers, second_student_headers):
    headers, _ = student_headers
    other_headers, _ = second_student_headers

    client.post("/notices", json={"title": "Aviso", "content": "Texto"}, headers=admin_headers)

    notifications = client.get("/notifications", headers=headers).json()
    notification_id = notifications[0]["id"]

    response = client.put(f"/notifications/{notification_id}/read", headers=other_headers)
    assert response.status_code == 404