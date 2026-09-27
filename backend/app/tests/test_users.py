def test_get_me_returns_current_user(client, student_headers):
    headers, user = student_headers
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == user["email"]


def test_get_me_without_auth_returns_401(client):
    response = client.get("/users/me")
    assert response.status_code == 401


def test_update_me_changes_name(client, student_headers):
    headers, _ = student_headers
    response = client.put("/users/me", json={"name": "Nome Atualizado"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Nome Atualizado"


def test_list_users_forbidden_for_student(client, student_headers):
    headers, _ = student_headers
    response = client.get("/users", headers=headers)
    assert response.status_code == 403


def test_list_users_allowed_for_admin(client, admin_headers, student_headers):
    response = client.get("/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 2


def test_admin_cannot_change_own_role(client, admin_headers):
    me = client.get("/users/me", headers=admin_headers).json()
    response = client.put(f"/users/{me['id']}/role", json={"role": "student"}, headers=admin_headers)
    assert response.status_code == 400


def test_admin_cannot_delete_own_account(client, admin_headers):
    me = client.get("/users/me", headers=admin_headers).json()
    response = client.delete(f"/users/{me['id']}", headers=admin_headers)
    assert response.status_code == 400


def test_admin_can_change_other_user_role(client, admin_headers, student_headers):
    _, student_user = student_headers
    response = client.put(f"/users/{student_user['id']}/role", json={"role": "teacher"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "teacher"


def test_update_role_rejects_invalid_role(client, admin_headers, student_headers):
    _, student_user = student_headers
    response = client.put(f"/users/{student_user['id']}/role", json={"role": "superadmin"}, headers=admin_headers)
    assert response.status_code == 422