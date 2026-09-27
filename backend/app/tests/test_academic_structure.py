from helpers import create_class, create_discipline, create_student_profile, enroll


def test_create_discipline_forbidden_for_student(client, student_headers):
    headers, _ = student_headers
    response = client.post("/disciplines", json={"name": "X", "code": "X1"}, headers=headers)
    assert response.status_code == 403


def test_create_and_list_discipline(client, admin_headers):
    discipline = create_discipline(client, admin_headers)
    response = client.get("/disciplines", headers=admin_headers)
    assert response.status_code == 200
    assert any(d["id"] == discipline["id"] for d in response.json())


def test_discipline_not_found_returns_404(client, admin_headers):
    response = client.get("/disciplines/9999", headers=admin_headers)
    assert response.status_code == 404


def test_create_class_requires_valid_discipline(client, admin_headers):
    response = client.post(
        "/classes", json={"name": "Turma X", "year": "2026", "discipline_id": 9999}, headers=admin_headers
    )
    assert response.status_code == 404


def test_enrollment_duplicate_returns_400(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    _, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])

    first = client.post(
        "/enrollments", json={"student_id": student_profile["id"], "class_id": school_class["id"]}, headers=admin_headers
    )
    assert first.status_code == 200

    second = client.post(
        "/enrollments", json={"student_id": student_profile["id"], "class_id": school_class["id"]}, headers=admin_headers
    )
    assert second.status_code == 400


def test_class_detail_visible_to_enrolled_student(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    headers, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    response = client.get(f"/classes/{school_class['id']}", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["students"]) == 1


def test_class_detail_forbidden_to_unrelated_student(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    headers, _ = student_headers

    response = client.get(f"/classes/{school_class['id']}", headers=headers)
    assert response.status_code == 403