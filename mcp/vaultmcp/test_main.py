import pytest
import importlib
import asyncio
from unittest.mock import patch, MagicMock

@pytest.fixture(autouse=True)
def patch_external_deps(monkeypatch):
    monkeypatch.setattr('vgs.sdk.vaults_api', MagicMock())
    monkeypatch.setattr('vaultclient.get_jwt_token', MagicMock(return_value='fake-token'))
    monkeypatch.setattr('vgs.sdk.serializers', MagicMock())
    yield

def import_main():
    import main
    importlib.reload(main)
    return main

def test_environments_dict():
    main = import_main()
    assert 'sandbox' in main.environments
    assert 'dev' in main.environments
    assert 'live' in main.environments
    sandbox = main.environments['sandbox']
    assert sandbox['vault_mgmt_url'].startswith('https://')

def test_fastmcp_instance():
    main = import_main()
    assert hasattr(main, 'mcp')
    assert main.mcp is not None
    assert main.mcp.__class__.__name__ == 'FastMCP'

def test_tools_registered():
    main = import_main()
    tools = asyncio.run(main.mcp.get_tools())
    assert isinstance(tools, dict)
    assert len(tools) > 0

def test_create_audits_api(monkeypatch):
    main = import_main()
    fake_api = object()
    monkeypatch.setattr(main, 'get_jwt_token', lambda url, realm: 'token')
    monkeypatch.setattr(main, 'create_audits_api_int', lambda *a, **kw: fake_api)
    result = main.create_audits_api('vaultid', 'sandbox')
    assert result is fake_api 