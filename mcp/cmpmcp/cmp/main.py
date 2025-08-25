import logging
import os
from typing import Annotated

import requests
from fastmcp import FastMCP
from pydantic import Field

from . import auth

logger = logging.getLogger(__name__)

mcp = FastMCP("VGS CMP MCP 💳🔒")
log_level = os.getenv("LOG_LEVEL", "INFO")
client_id = os.getenv("VGS_CLIENT_ID")
client_secret = os.getenv("VGS_CLIENT_SECRET")

logging.basicConfig(level=log_level)

environments = {
    "dev": {
        "cmp_url": "https://sandbox.vgsapi.io",
        "keycloak_url": "https://auth.verygoodsecurity.io/auth",
        "keycloak_realm": "vgs",
    },
    "sandbox": {
        "cmp_url": "https://sandbox.vgsapi.com",
        "keycloak_url": "https://auth.verygoodsecurity.com/auth",
        "keycloak_realm": "vgs",
    },
    "live": {
        "cmp_url": "https://live.vgsapi.com",
        "keycloak_url": "https://auth.verygoodsecurity.com/auth",
        "keycloak_realm": "vgs",
    },
}


@mcp.tool()
def get_card(
    card_id: Annotated[
        str,
        Field(
            description="ID of the Card to fetch",
            pattern="CRD[A-z0-9]+",
        ),
    ],
    environment: Annotated[
        str,
        Field(
            description="Environment to get access logs for.",
            default="sandbox",
        ),
    ],
):
    """
    Get a specific card by ID.

    Args:
        card_id (str): The ID of the Card to fetch.
        environment (str): The environment to fetch the card from.
    """
    token = auth.get_jwt_token(
        environments[environment]["keycloak_url"],
        environments[environment]["keycloak_realm"],
    )
    url = f"{environments[environment]['cmp_url']}/cards/{card_id}"
    headers = {
        "accept": "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
        "authorization": f"Bearer {token}",
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport="stdio")
