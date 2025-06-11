# server.py
import logging

from fastmcp import FastMCP
import json
from typing import Annotated

import vgs.sdk.vaults_api
from pydantic import Field
from vaultclient import get_jwt_token
from vgs.sdk.account_mgmt import AccountMgmtAPI
from vgs.sdk.vault_mgmt import VaultMgmtAPI
from vgscli.auth import handshake, token_util
from vgscli.cli import create_account_mgmt_api, create_vault_mgmt_api

logger = logging.getLogger(__name__)

mcp = FastMCP("Demo 🚀")


def create_vault_mgmt_api():
    environment = "dev"  # prod
    root_url = "https://api.verygoodvault.io"

    handshake({}, environment)
    access_token = token_util.get_access_token()

    return VaultMgmtAPI(access_token, root_url)


@mcp.tool()
def create_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
        ),
    ],
    payload: Annotated[
        str | dict,
        Field(
            description="Payload to create or update the route. This must be a valid JSON dict or string representation of a JSON dict."
        ),
    ],
):
    token = get_jwt_token()
    environment = "dev"  # prod
    if isinstance(payload, str):
        payload = json.loads(payload)
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environment, token
    )

    logger.info("ready to create route")
    logger.info(payload)
    logger.info("check da payload ^^")
    return vault_management_api.routes.update(route_id, body=payload)


@mcp.tool()
def delete_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
        ),
    ],
):
    token = get_jwt_token()
    environment = "dev"  # prod
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environment, token
    )
    vault_management_api.routes.delete(route_id)
    return f"Route {route_id} deleted"


@mcp.tool()
def get_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
        ),
    ],
):
    token = get_jwt_token()
    environment = "dev"  # prod
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environment, token
    )
    return vault_management_api.routes.get(route_id)


@mcp.tool()
def update_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
        ),
    ],
    payload: Annotated[
        str | dict,
        Field(
            description="Payload to create or update the route. This must be a valid JSON dict or string representation of a JSON dict."
        ),
    ],
):
    token = get_jwt_token()
    environment = "dev"  # prod
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environment, token
    )
    return vault_management_api.routes.update(route_id, body=payload)


@mcp.tool()
def get_routes(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z]+",
        ),
    ],
):
    token = get_jwt_token()
    environment = "dev"  # prod
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environment, token
    )
    return vault_management_api.routes.list().body["data"]


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport="stdio")
