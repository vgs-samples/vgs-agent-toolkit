import os
from unittest.mock import MagicMock, patch

import pytest
from cmp.main import environments, get_card


@pytest.fixture
def mock_env_vars():
    """Mock environment variables"""
    with patch.dict(
        os.environ,
        {"VGS_CLIENT_ID": "test_client_id", "VGS_CLIENT_SECRET": "test_client_secret"},
    ):
        yield


@pytest.fixture
def mock_jwt_token():
    """Mock JWT token"""
    return "mock_jwt_token_12345"


@pytest.fixture
def mock_response():
    """Mock successful API response"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "id": "CRD123456789",
            "type": "card",
            "attributes": {
                "card_number": "4111111111111111",
                "expiry_month": "12",
                "expiry_year": "2025",
            },
        }
    }
    mock_response.raise_for_status.return_value = None
    return mock_response


def test_get_card(mock_env_vars, mock_jwt_token, mock_response):
    with patch("cmp.main.requests.get") as mock_requests_get, patch(
        "cmp.main.auth.get_jwt_token"
    ) as mock_get_jwt_token:
        mock_get_jwt_token.return_value = mock_jwt_token
        mock_requests_get.return_value = mock_response
        response = get_card.fn("CRD123456789", "sandbox")
        assert response == mock_response.json.return_value
