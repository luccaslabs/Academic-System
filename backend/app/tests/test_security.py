from helpers import create_discipline


def test_csrf_blocks_cookie_authenticated_mutation_without_header(client, create_admin):
    create_admin(email="admin@teste.com", password="senha12345")

    login_response = client.post("/auth/login", json={"email": "admin@teste.com", "password": "senha12345"})
    assert login_response.status_code == 200
    # cookies não são limpos de propósito, para simular um navegador autenticado por cookie

    response = client.post("/disciplines", json={"name": "Química", "code": "QUI101"})
    assert response.status_code == 403


def test_csrf_allows_mutation_with_matching_header(client, create_admin):
    create_admin(email="admin@teste.com", password="senha12345")

    login_response = client.post("/auth/login", json={"email": "admin@teste.com", "password": "senha12345"})
    csrf_token = login_response.cookies.get("csrf_token")

    response = client.post(
        "/disciplines", json={"name": "Química", "code": "QUI101"}, headers={"X-CSRF-Token": csrf_token}
    )
    assert response.status_code == 200


def test_bearer_token_requests_are_not_affected_by_csrf(client, admin_headers):
    response = client.post("/disciplines", json={"name": "Biologia", "code": "BIO101"}, headers=admin_headers)
    assert response.status_code == 200


def test_underscore_in_search_query_is_treated_literally(client, admin_headers):
    create_discipline(client, admin_headers, name="Matemática", code="MAT101")

    response = client.get("/search", params={"q": "MAT1_1"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["disciplines"] == []