# server.py
import json
import logging
from typing import Annotated
import os

import requests
import vgs.sdk.vaults_api
from fastmcp import FastMCP
from pydantic import Field
from vaultclient import get_jwt_token
from vgs.sdk import serializers
from vgscli import access_logs
from vgscli.audits_api import create_api as create_audits_api_int

logger = logging.getLogger(__name__)

mcp = FastMCP("VGS Proxy + Vault Demo 🚀🔒")

client_id = os.getenv("VGS_CLIENT_ID")
client_secret = os.getenv("VGS_CLIENT_SECRET")

environments = {
    "dev": {
        "vault_mgmt_url": "https://api.verygoodvault.io",
        "logs_url": "https://api.verygoodsecurity.io",
        "keycloak_url": "https://auth.verygoodsecurity.io/auth",
        "keycloak_realm": "vgs",
        "infra_env": "dev",
    },
    "sandbox": {
        "vault_mgmt_url": "https://api.sandbox.verygoodsecurity.com",
        "logs_url": "https://api.sandbox.verygoodsecurity.com",
        "keycloak_url": "https://auth.verygoodsecurity.com/auth",
        "keycloak_realm": "vgs",
        "infra_env": "prod",
    },
    "live": {
        "vault_mgmt_url": "https://api.live.verygoodsecurity.com",
        "logs_url": "https://api.live.verygoodsecurity.com",
        "keycloak_url": "https://auth.verygoodsecurity.com/auth",
        "keycloak_realm": "vgs",
        "infra_env": "prod",
    },
}


def create_audits_api(vault_id, environment):
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    logger.info("creating audits api")
    return create_audits_api_int(None, vault_id, environment, token)


@mcp.tool()
def get_access_logs(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to get access logs for.", pattern="tnt[A-z0-9]+"
        ),
    ],
    tail: Annotated[
        int,
        Field(description="Number of logs to return. Defaults to 100.", default=100),
    ],
    since: Annotated[
        int,
        Field(
            description="Only show logs newer than a specific duration. Must be a specific RFC 3339 date.",
            default=None,
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
    filters = access_logs.prepare_filter(
        {
            "tenant_id": vault_id,
            "protocol": "http",
            "from": since,
        }
    )
    logger.info("ready to get access logs")

    audits_api = create_audits_api(vault_id, environment)
    logger.info("got access logs key")

    for res in access_logs.fetch_logs(audits_api, filters, tail):

        logger.info("got access logs and formatting")
        yield serializers.format_logs(serializers.wrap_records(res), "json")


@mcp.tool()
def create_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z0-9]+",
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
    environment: Annotated[
        str,
        Field(
            description="Environment to get access logs for.",
            default="sandbox",
        ),
    ],
):
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    if isinstance(payload, str):
        payload = json.loads(payload)
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environments[environment]["infra_env"], token
    )
    logger.info("ready to create route")
    logger.info(payload)
    return vault_management_api.routes.update(route_id, body=payload)


@mcp.tool()
def delete_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z0-9]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
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
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environments[environment]["infra_env"], token
    )
    vault_management_api.routes.delete(route_id)
    return f"Route {route_id} deleted"


@mcp.tool()
def get_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z0-9]+",
        ),
    ],
    route_id: Annotated[
        str,
        Field(
            description="ID of the route to create or update. This must be a valid UUID."
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
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environments[environment]["infra_env"], token
    )
    return vault_management_api.routes.get(route_id)


@mcp.tool()
def update_route(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z0-9]+",
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
    environment: Annotated[
        str,
        Field(
            description="Environment to get access logs for.",
            default="sandbox",
        ),
    ],
):
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environments[environment]["infra_env"], token
    )
    return vault_management_api.routes.update(route_id, body=payload)


@mcp.tool()
def get_routes(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to create or update the route in.",
            pattern="tnt[A-z0-9]+",
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
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    vault_management_api = vgs.sdk.vaults_api.create_api(
        None, vault_id, environments[environment]["infra_env"], token
    )
    return vault_management_api.routes.list().body["data"]


@mcp.tool()
def enable_debug_logs(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to enable debug logs for.", pattern="tnt[A-z0-9]+"
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
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    url = f"{environments[environment]['logs_url']}/log-settings"
    headers = {
        "accept": "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
        "authorization": f"Bearer {token}",
        "vgs-tenant": vault_id,
    }
    payload = {
        "data": {
            "attributes": {
                "secure_logs_recording_enabled": True,
                "secure_logs_recording_time": 3600,
            },
            "type": "log-settings",
        }
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()


@mcp.tool()
def get_access_log_details_by_request_id(
    vault_id: Annotated[
        str,
        Field(
            description="ID of the Vault to get access log for.", pattern="tnt[A-z0-9]+"
        ),
    ],
    request_id: Annotated[str, Field(description="Request ID to fetch logs for.")],
    environment: Annotated[
        str,
        Field(
            description="Environment to get access logs for.",
            default="sandbox",
        ),
    ],
):
    """
    Get a specific access log by request ID.
    This is useful for debugging a specific request. If debug logs are enabled then the payloads will be available in the response. 
    Additionally you'll be able to see which routes and filters were matched and executed.

    Args:
        vault_id (str): The ID of the Vault to get access log for.
        request_id (str): The ID of the request to fetch logs for.
    """
    token = get_jwt_token(environments[environment]["keycloak_url"], environments[environment]["keycloak_realm"])
    url = f"{environments[environment]['logs_url']}/logs?filter[logs][requestId]={request_id}"
    headers = {
        "accept": "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
        "authorization": f"Bearer {token}",
        "vgs-tenant": vault_id,
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport="stdio")
