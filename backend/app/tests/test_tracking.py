from datetime import date, datetime, timedelta, timezone

from helpers import create_class, create_discipline, create_student_profile, enroll


def setup_enrollment(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    _, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enrollment = enroll(client, admin_headers, student_profile["id"], school_class["id"])
    return school_class, student_profile, enrollment


def test_create_grade_and_owner_can_view(client, admin_headers, student_headers):
    headers, _ = student_headers
    _, _, enrollment = setup_enrollment(client, admin_headers, student_headers)

    response = client.post(
        "/grades", json={"enrollment_id": enrollment["id"], "value": 8.5, "term": "1º bimestre"}, headers=admin_headers
    )
    assert response.status_code == 200

    response = client.get(f"/grades/enrollment/{enrollment['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()[0]["value"] == 8.5


def test_grade_forbidden_to_other_student(client, admin_headers, student_headers, second_student_headers):
    _, _, enrollment = setup_enrollment(client, admin_headers, student_headers)

    other_headers, _ = second_student_headers
    response = client.get(f"/grades/enrollment/{enrollment['id']}", headers=other_headers)
    assert response.status_code == 403


def test_create_grade_forbidden_for_student(client, admin_headers, student_headers):
    headers, _ = student_headers
    _, _, enrollment = setup_enrollment(client, admin_headers, student_headers)

    response = client.post(
        "/grades", json={"enrollment_id": enrollment["id"], "value": 10, "term": "1º bimestre"}, headers=headers
    )
    assert response.status_code == 403


def test_attendance_duplicate_same_date_returns_400(client, admin_headers, student_headers):
    _, _, enrollment = setup_enrollment(client, admin_headers, student_headers)

    payload = {"enrollment_id": enrollment["id"], "class_date": str(date.today()), "present": True}

    first = client.post("/attendance", json=payload, headers=admin_headers)
    assert first.status_code == 200

    second = client.post("/attendance", json=payload, headers=admin_headers)
    assert second.status_code == 400


def test_assignment_submission_flow(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])

    headers, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    response = client.post(
        "/assignments",
        json={"class_id": school_class["id"], "title": "Trabalho 1", "due_date": due_date, "accepts_submissions": True},
        headers=admin_headers,
    )
    assignment = response.json()

    submission = client.post(
        f"/assignments/{assignment['id']}/submissions",
        json={"content": "https://exemplo.com/trabalho.pdf"},
        headers=headers,
    )
    assert submission.status_code == 200

    duplicate = client.post(
        f"/assignments/{assignment['id']}/submissions",
        json={"content": "https://exemplo.com/outro.pdf"},
        headers=headers,
    )
    assert duplicate.status_code == 400


def test_submission_rejected_when_assignment_does_not_accept(client, admin_headers, student_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])

    headers, student_user = student_headers
    student_profile = create_student_profile(client, admin_headers, student_user["id"])
    enroll(client, admin_headers, student_profile["id"], school_class["id"])

    due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    response = client.post(
        "/assignments",
        json={"class_id": school_class["id"], "title": "Aviso de prazo", "due_date": due_date, "accepts_submissions": False},
        headers=admin_headers,
    )
    assignment = response.json()

    submission = client.post(
        f"/assignments/{assignment['id']}/submissions",
        json={"content": "https://exemplo.com/trabalho.pdf"},
        headers=headers,
    )
    assert submission.status_code == 400


def test_admin_cannot_submit_assignment(client, admin_headers):
    discipline = create_discipline(client, admin_headers)
    school_class = create_class(client, admin_headers, discipline["id"])
    due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    response = client.post(
        "/assignments",
        json={"class_id": school_class["id"], "title": "T", "due_date": due_date, "accepts_submissions": True},
        headers=admin_headers,
    )
    assignment = response.json()

    submission = client.post(f"/assignments/{assignment['id']}/submissions", json={"content": "x"}, headers=admin_headers)
    assert submission.status_code == 403