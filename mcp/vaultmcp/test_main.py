import asyncio
import importlib
import importlib.util
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def patch_external_deps(monkeypatch):
    monkeypatch.setattr("vgs.sdk.vaults_api", MagicMock())
    monkeypatch.setattr(
        "vaultclient.get_jwt_token", MagicMock(return_value="fake-token")
    )
    monkeypatch.setattr("vgs.sdk.serializers", MagicMock())
    monkeypatch.setattr("requests.post", MagicMock())
    monkeypatch.setattr("requests.get", MagicMock())
    # Only patch vgscli.access_logs if it exists
    vgscli_spec = importlib.util.find_spec("vgscli")
    if vgscli_spec is not None:
        import vgscli

        if hasattr(vgscli, "access_logs"):
            monkeypatch.setattr("vgscli.access_logs", MagicMock())
    yield


def import_main():
    import main

    importlib.reload(main)
    return main


def test_environments_dict():
    main = import_main()
    assert "sandbox" in main.environments
    assert "dev" in main.environments
    assert "live" in main.environments
    sandbox = main.environments["sandbox"]
    assert sandbox["vault_mgmt_url"].startswith("https://")


def test_fastmcp_instance():
    main = import_main()
    assert hasattr(main, "mcp")
    assert main.mcp is not None
    assert main.mcp.__class__.__name__ == "FastMCP"


def test_tools_registered():
    main = import_main()
    tools = asyncio.run(main.mcp.get_tools())
    assert isinstance(tools, dict)
    assert len(tools) > 0


def test_create_audits_api(monkeypatch):
    main = import_main()
    fake_api = object()
    monkeypatch.setattr(main, "get_jwt_token", lambda url, realm: "token")
    monkeypatch.setattr(main, "create_audits_api_int", lambda *a, **kw: fake_api)
    result = main.create_audits_api("vaultid", "sandbox")
    assert result is fake_api


def test_get_access_logs(monkeypatch):
    fake_logs = [[{"log": 1}], [{"log": 2}]]
    fake_access_logs = MagicMock()
    fake_access_logs.prepare_filter.return_value = {"filter": "val"}

    class FakeSerializers:
        @staticmethod
        def wrap_records(x):
            return x

        @staticmethod
        def format_logs(x, y=None):
            return x

    fake_serializers = FakeSerializers()
    monkeypatch.setattr("vgscli.access_logs", fake_access_logs)
    monkeypatch.setattr("vgs.sdk.serializers", fake_serializers)
    # Now import main so it uses the patched serializers
    main = import_main()
    # Patch fetch_logs in main.access_logs to return fake_logs
    monkeypatch.setattr(main.access_logs, "fetch_logs", lambda *a, **kw: fake_logs)
    # Patch main.create_audits_api to return a dummy object
    monkeypatch.setattr(main, "create_audits_api", lambda vault_id, env: object())
    logs = list(main.get_access_logs.fn("tnttest", 10, None, "sandbox"))
    assert logs == fake_logs


def test_create_route(monkeypatch):
    main = import_main()
    fake_api = MagicMock()
    fake_api.routes.update.return_value = "updated!"
    monkeypatch.setattr("vgs.sdk.vaults_api.create_api", lambda *a, **kw: fake_api)
    result = main.create_route.fn("tnttest", "routeid", {"foo": "bar"}, "sandbox")
    assert result == "updated!"


def test_delete_route(monkeypatch):
    main = import_main()
    fake_api = MagicMock()
    fake_api.routes.delete.return_value = None
    monkeypatch.setattr("vgs.sdk.vaults_api.create_api", lambda *a, **kw: fake_api)
    result = main.delete_route.fn("tnttest", "routeid", "sandbox")
    assert result == "Route routeid deleted"


def test_get_route(monkeypatch):
    main = import_main()
    fake_api = MagicMock()
    fake_api.routes.get.return_value = {"route": "data"}
    monkeypatch.setattr("vgs.sdk.vaults_api.create_api", lambda *a, **kw: fake_api)
    result = main.get_route.fn("tnttest", "routeid", "sandbox")
    assert result == {"route": "data"}


def test_update_route(monkeypatch):
    main = import_main()
    fake_api = MagicMock()
    fake_api.routes.update.return_value = {"updated": True}
    monkeypatch.setattr("vgs.sdk.vaults_api.create_api", lambda *a, **kw: fake_api)
    result = main.update_route.fn("tnttest", "routeid", {"foo": "bar"}, "sandbox")
    assert result == {"updated": True}


def test_get_routes(monkeypatch):
    main = import_main()
    fake_api = MagicMock()
    fake_api.routes.list.return_value.body = {"data": [1, 2, 3]}
    monkeypatch.setattr("vgs.sdk.vaults_api.create_api", lambda *a, **kw: fake_api)
    result = main.get_routes.fn("tnttest", "sandbox")
    assert result == [1, 2, 3]


def test_enable_debug_logs(monkeypatch):
    main = import_main()
    fake_response = MagicMock()
    fake_response.json.return_value = {"ok": True}
    fake_response.raise_for_status.return_value = None
    monkeypatch.setattr("requests.post", lambda *a, **kw: fake_response)
    result = main.enable_debug_logs.fn("tnttest", "sandbox")
    assert result == {"ok": True}


def test_get_access_log_details_by_request_id(monkeypatch):
    main = import_main()
    fake_response = MagicMock()
    fake_response.json.return_value = {"log": "details"}
    fake_response.raise_for_status.return_value = None
    monkeypatch.setattr("requests.get", lambda *a, **kw: fake_response)
    result = main.get_access_log_details_by_request_id.fn("tnttest", "reqid", "sandbox")
    assert result == {"log": "details"}
