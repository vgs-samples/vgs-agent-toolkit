import pytest
from unittest.mock import patch
from main import mcp


class TestMCPConfiguration:
    """Test MCP configuration and setup."""
    
    def test_mcp_name(self):
        """Test MCP is configured with correct name."""
        assert mcp.name == "VGS MCP UI Demo 🚀🔒"
    
    def test_mcp_stateless_http(self):
        """Test MCP is configured as stateless HTTP."""
        # Check if the stateless_http attribute exists, if not skip this test
        if hasattr(mcp, 'stateless_http'):
            assert mcp.stateless_http is True
        else:
            pytest.skip("stateless_http attribute not available in this version")


# Configure pytest for async tests
pytest_plugins = ["pytest_asyncio"]

if __name__ == "__main__":
    pytest.main([__file__]) 