import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production-use")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("COOKIE_SAMESITE", "lax")

import pytest
from fastapi.testclient import TestClient
from pwdlib import PasswordHash
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.core.rate_limiter import limiter
from app.database.connection import Base, get_db
from app.main import app as fastapi_app
from app.models.user import User

from helpers import login_bearer, register_user


password_hash = PasswordHash.recommended()


@pytest.fixture()
def db_session():

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(bind=engine)

    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = testing_session()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session):

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db

    with TestClient(fastapi_app) as test_client:
        yield test_client

    fastapi_app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture()
def create_admin(db_session):

    def _create(email="admin@teste.com", password="senha12345", name="Admin Teste"):
        admin = User(
            name=name,
            email=email,
            password_hash=password_hash.hash(password),
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        return admin

    return _create


@pytest.fixture()
def admin_headers(client, create_admin):
    create_admin(email="admin@teste.com", password="senha12345")
    return login_bearer(client, "admin@teste.com", "senha12345")


@pytest.fixture()
def student_headers(client):
    user = register_user(client, "Aluno Um", "aluno1@teste.com", "senha12345")
    headers = login_bearer(client, "aluno1@teste.com", "senha12345")
    return headers, user


@pytest.fixture()
def second_student_headers(client):
    user = register_user(client, "Aluno Dois", "aluno2@teste.com", "senha12345")
    headers = login_bearer(client, "aluno2@teste.com", "senha12345")
    return headers, user


@pytest.fixture()
def teacher_setup(client, admin_headers):

    user = register_user(client, "Professor Um", "professor1@teste.com", "senha12345")

    response = client.put(f"/users/{user['id']}/role", json={"role": "teacher"}, headers=admin_headers)
    assert response.status_code == 200

    headers = login_bearer(client, "professor1@teste.com", "senha12345")

    return headers, user