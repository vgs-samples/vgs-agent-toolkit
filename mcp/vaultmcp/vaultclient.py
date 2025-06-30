import logging
import os

import vgs.sdk.routes
import vgs.sdk.vaults_api
from keycloak.realm import KeycloakRealm

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger()


class KeyCloak:
    def __init__(self, url, realm, client_id, secret):
        realm = KeycloakRealm(server_url=url, realm_name=realm)
        self.client = realm.open_id_connect(client_id=client_id, client_secret=secret)

    def issue_token_for_client(self):
        token = self.client.client_credentials()
        return token["access_token"]

    def issue_token_for_user(self, username, password):
        token = self.client.password_credentials(username, password)
        return token["access_token"]


def get_jwt_token(url: str, realm: str):
    client_id = os.getenv("VGS_CLIENT_ID")
    client_secret = os.getenv("VGS_CLIENT_SECRET")
    log.debug(
        f"Initializing KeyCloak client for url: [{url}]; realm: [{realm}]; client_id: [{client_id}], {client_secret}"
    )

    keycloak = KeyCloak(url=url, realm=realm, client_id=client_id, secret=client_secret)

    log.debug(f"Acquiring keycloak token for the client [{client_id}]")
    jwt_token = keycloak.issue_token_for_client()

    return jwt_token
