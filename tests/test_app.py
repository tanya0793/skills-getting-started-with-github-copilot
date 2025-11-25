import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert all('description' in v and 'schedule' in v and 'participants' in v for v in data.values())


def test_signup_and_unregister():
    # Pick an activity
    response = client.get("/activities")
    activities = response.json()
    activity_name = next(iter(activities.keys()))
    test_email = "pytest@mergington.edu"

    # Sign up
    signup_url = f"/activities/{activity_name}/signup?email={test_email}"
    signup_response = client.post(signup_url)
    assert signup_response.status_code == 200
    assert "message" in signup_response.json()

    # Check participant added
    response = client.get("/activities")
    participants = response.json()[activity_name]["participants"]
    assert test_email in participants

    # Unregister
    unregister_url = f"/activities/{activity_name}/unregister?email={test_email}"
    unregister_response = client.post(unregister_url)
    assert unregister_response.status_code == 200
    assert "message" in unregister_response.json()

    # Check participant removed
    response = client.get("/activities")
    participants = response.json()[activity_name]["participants"]
    assert test_email not in participants
