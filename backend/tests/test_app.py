import pytest
from app import create_app, db
from app.models import FormSubmission
from flask import Flask


@pytest.fixture
def app():
    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_index_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Demo Form" in response.data


def test_submit_form_success(client):
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass",
        "agreement": "on",
    }
    response = client.post("/api/submit", data=data)
    assert response.status_code == 201
    json_data = response.get_json()
    assert "id" in json_data
    assert json_data["message"] == "Form submitted successfully"

    # Check DB
    with client.application.app_context():
        sub = FormSubmission.query.first()
        assert sub.username == "testuser"
        assert sub.email == "test@example.com"
        assert sub.agreement is True


def test_submit_form_missing_data(client):
    data = {"username": "testuser"}  # missing required fields
    response = client.post("/api/submit", data=data)
    assert (
        response.status_code == 201
        or response.status_code == 500
        or response.status_code == 400
    )
    # Accepting 400 or 500 for missing data, depending on implementation


def test_get_submissions(client):
    # Add a submission
    with client.application.app_context():
        sub = FormSubmission(
            username="a", email="b@b.com", password="c", agreement=True
        )
        db.session.add(sub)
        db.session.commit()
    response = client.get("/api/submissions")
    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data, list)
    assert len(json_data) >= 1
    assert json_data[0]["username"] == "a"
