import os
from unittest.mock import MagicMock, patch

import pytest

from cmp.main import (create_network_token, environments,
                      fetch_network_token_cryptogram, get_card)


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


@pytest.fixture
def mock_network_token_response():
    """Mock successful network token response"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "type": "network_tokens",
            "id": "NTKu5rM55z4PNMLW9Rqrhd466",
            "attributes": {
                "payment_account_reference": "V0010013025209632906568838169",
                "network_token": 5580043943638177,
                "last4": 8177,
                "bin": 558004,
                "exp_month": 4,
                "exp_year": 26,
                "created_at": "2025-01-10T17:56:12.783411",
                "updated_at": "2025-01-10T17:56:12.783429",
                "state": "active",
            },
        }
    }
    mock_response.raise_for_status.return_value = None
    return mock_response


@pytest.fixture
def mock_cryptogram_response():
    """Mock successful cryptogram response"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "id": "NTK6j75fBx46Lzd3G3aVkfGQF",
            "type": "network_tokens",
            "attributes": {
                "bin": "411321",
                "created_at": "2025-01-17T12:53:17.94829",
                "cryptogram": {
                    "eci": "07",
                    "type": "TAVV",
                    "value": "JWrMYLqNQjmEHQDAZbSx+A==",
                },
                "exp_month": 9,
                "exp_year": 27,
                "last4": "2304",
                "network_token": "4113216317012304",
                "payment_account_reference": "V4243058293132582787411225618",
                "state": "active",
                "updated_at": "2025-01-17T12:53:17.948293",
            },
        },
        "metadata": {
            "observability": {
                "client_id": "ACoKRUTV7-config-ci-5I76w",
                "fingerprint": "4GqVMr6PvdWHn5qfb66TquParUHsTiFsjJCFaDpVed8KbAmz4bSftQeNQBb",
                "account_id": "37199757-3a4f-418f-bcf4-4119d1dbd39e",
                "trace_id": "f2046b6548e7dbe5793adee1f4a13c63",
                "vault_id": "tntipby064g",
            }
        },
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


def test_create_network_token(
    mock_env_vars, mock_jwt_token, mock_network_token_response
):
    with patch("cmp.main.requests.post") as mock_requests_post, patch(
        "cmp.main.auth.get_jwt_token"
    ) as mock_get_jwt_token:
        mock_get_jwt_token.return_value = mock_jwt_token
        mock_requests_post.return_value = mock_network_token_response
        response = create_network_token.fn("CRD123456789", "sandbox")
        assert response == mock_network_token_response.json.return_value


def test_fetch_network_token_cryptogram(
    mock_env_vars, mock_jwt_token, mock_cryptogram_response
):
    with patch("cmp.main.requests.post") as mock_requests_post, patch(
        "cmp.main.auth.get_jwt_token"
    ) as mock_get_jwt_token:
        mock_get_jwt_token.return_value = mock_jwt_token
        mock_requests_post.return_value = mock_cryptogram_response
        response = fetch_network_token_cryptogram.fn("CRD123456789", "sandbox")
        assert response == mock_cryptogram_response.json.return_value
