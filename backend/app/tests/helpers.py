def register_user(client, name, email, password):
    response = client.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert response.status_code == 200
    return response.json()


def login_bearer(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


def create_discipline(client, admin_headers, name="Matemática", code="MAT101"):
    response = client.post("/disciplines", json={"name": name, "code": code}, headers=admin_headers)
    assert response.status_code == 200
    return response.json()


def create_class(client, admin_headers, discipline_id, name="Turma A", year="2026"):
    response = client.post(
        "/classes",
        json={"name": name, "year": year, "discipline_id": discipline_id},
        headers=admin_headers,
    )
    assert response.status_code == 200
    return response.json()


def create_teacher_profile(client, admin_headers, user_id, registration="PROF001"):
    response = client.post(
        "/teachers", json={"user_id": user_id, "registration": registration}, headers=admin_headers
    )
    assert response.status_code == 200
    return response.json()


def create_student_profile(client, admin_headers, user_id, registration="ALU001"):
    response = client.post(
        "/students", json={"user_id": user_id, "registration": registration}, headers=admin_headers
    )
    assert response.status_code == 200
    return response.json()


def enroll(client, admin_headers, student_id, class_id):
    response = client.post(
        "/enrollments", json={"student_id": student_id, "class_id": class_id}, headers=admin_headers
    )
    assert response.status_code == 200
    return response.json()