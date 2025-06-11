
import logging
import os

from keycloak.realm import KeycloakRealm

import vgs.sdk.routes
import vgs.sdk.vaults_api

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


def get_jwt_token(username=None, password=None):
    client_id = os.getenv("VGS_CLIENT_ID")
    client_secret = os.getenv("VGS_CLIENT_SECRET")
    url = os.getenv("KEYCLOAK_URL")
    realm = os.getenv("KEYCLOAK_REALM")
    log.debug(
        f"Initializing KeyCloak client for url: [{url}]; realm: [{realm}]; client_id: [{client_id}], {client_secret}"
    )

    keycloak = KeyCloak(url=url, realm=realm, client_id=client_id, secret=client_secret)

    if username and password:
        log.debug(f"Acquiring keycloak token for the user [{username}]")
        jwt_token = keycloak.issue_token_for_user(username, password)
    else:
        log.debug(f"Acquiring keycloak token for the client [{client_id}]")
        jwt_token = keycloak.issue_token_for_client()

    return jwt_token