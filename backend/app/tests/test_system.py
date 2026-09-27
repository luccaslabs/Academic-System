from helpers import create_class, create_discipline, create_student_profile, enroll


def test_search_requires_minimum_length(client, admin_headers):
    response = client.get("/search", params={"q": "a"}, headers=admin_headers)
    assert response.status_code == 400


def test_search_finds_discipline_by_name(client, admin_headers):
    create_discipline(client, admin_headers, name="Física", code="FIS101")

    response = client.get("/search", params={"q": "Física"}, headers=admin_headers)
    assert response.status_code == 200
    assert any(d["name"] == "Física" for d in response.json()["disciplines"])


def test_admin_dashboard_shape(client, admin_headers):
    response = client.get("/dashboard", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert "total_students" in body
    assert "total_teachers" in body


def test_student_dashboard_shape(client, admin_headers, student_headers):
    headers, student_user = student_headers
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    response = client.get("/dashboard", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "enrolled_classes" in body
    assert len(body["enrolled_classes"]) == 1