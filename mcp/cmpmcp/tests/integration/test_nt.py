import os

import pytest
import requests

from cmp.auth import get_jwt_token
from cmp.main import (create_network_token, environments,
                      fetch_network_token_cryptogram, get_card)


@pytest.fixture
def test_card_id():
    # see https://docs.verygoodsecurity.com/card-management/testing/create-card#method-3a--network-token-provisioning-for-visamastercard-cards-with-networks
    test_payload = {
        "data": {
            "attributes": {
                "pan": "4622943123111560",
                "cvc": "123",
                "exp_month": 4,
                "exp_year": 28,
            }
        }
    }
    response = requests.get(f"{environments['sandbox']['cmp_url']}/cards")
    return response.json()["data"]["id"]


@pytest.mark.skipif(
    os.getenv("VGS_CLIENT_ID") is None,
    reason="VGS_CLIENT_ID environment variable not set",
)
def test_create_network_token():
    response = create_network_token.fn("CRDj4BWv1xR3qSkzZK879dCT4", "sandbox")
    print(response)


@pytest.mark.skipif(
    os.getenv("VGS_CLIENT_ID") is None,
    reason="VGS_CLIENT_ID environment variable not set",
)
def test_fetch_network_token_cryptogram():
    response = fetch_network_token_cryptogram.fn("CRDj4BWv1xR3qSkzZK879dCT4", "sandbox")
    print(response)
