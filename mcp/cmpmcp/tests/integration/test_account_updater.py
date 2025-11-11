import os

import pytest
import requests

from cmp.auth import get_jwt_token
from cmp.main import (environments, get_real_time_account_update,
                      subscribe_to_account_updates,
                      unsubscribe_from_account_updates)

environment = os.getenv("ENVIRONMENT", "sandbox")

@pytest.fixture
def updated_card_id():
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
    response = requests.post(
        f"{environments[environment]['cmp_url']}/cards",
        json=test_payload,
        headers={
            "Authorization": f"Bearer {get_jwt_token(environments[environment]['keycloak_url'], environments[environment]['keycloak_realm'])}",
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
        },
    )
    return response.json()["data"]["id"]


# Note: access to this endpoint is conditional. VGS staff must enable your account.
@pytest.mark.skipif(
    os.getenv("VGS_CLIENT_ID") is None,
    reason="VGS_CLIENT_ID environment variable not set",
)
def test_get_real_time_account_update(updated_card_id):
    """Test real-time account update check for a specific card"""

    response = get_real_time_account_update.fn(updated_card_id, environment)
    print(f"Real-time account update response: {response}")

    # Verify response structure
    assert "data" in response
    assert "type" in response["data"]
    assert response["data"]["type"] == "card_updates"

    # Check if there are any updates
    if "attributes" in response["data"]:
        attributes = response["data"]["attributes"]
        if "updated_values" in attributes:
            print(f"Found {len(attributes['updated_values'])} updated values")
            for update in attributes["updated_values"]:
                assert "field_name" in update
                assert "old_value" in update
                assert "new_value" in update

    print("✅ Real-time account update test passed")


@pytest.mark.skipif(
    os.getenv("VGS_CLIENT_ID") is None,
    reason="VGS_CLIENT_ID environment variable not set",
)
def test_subscribe_to_account_updates(updated_card_id):
    """Test subscribing to account updates for a specific card"""

    response = subscribe_to_account_updates.fn(updated_card_id, environment)
    print(f"Subscription response: {response}")

    # Verify response structure
    assert "data" in response
    assert "type" in response["data"]
    assert response["data"]["type"] == "card_update_subscriptions"

    # Extract subscription ID for cleanup
    subscription_id = response["data"]["id"]
    print(f"Subscription created with ID: {subscription_id}")

    # Verify attributes
    if "attributes" in response["data"]:
        attributes = response["data"]["attributes"]
        assert "state" in attributes
        assert "created_at" in attributes
        assert "updated_at" in attributes


@pytest.mark.skipif(
    os.getenv("VGS_CLIENT_ID") is None,
    reason="VGS_CLIENT_ID environment variable not set",
)
def test_unsubscribe_from_account_updates(updated_card_id):
    """Test unsubscribing from account updates for a specific card"""

    # First, create a subscription
    subscription_response = subscribe_to_account_updates.fn(updated_card_id, environment)
    subscription_id = subscription_response["data"]["id"]
    print(f"Created subscription for testing: {subscription_id}")

    # Now test unsubscription
    response = unsubscribe_from_account_updates.fn(updated_card_id, environment)
    print(f"Unsubscription response: {response}")

    # Verify response structure
    assert "message" in response
    assert (
        f"Successfully unsubscribed {updated_card_id} from account updates"
        in response["message"]
    )
