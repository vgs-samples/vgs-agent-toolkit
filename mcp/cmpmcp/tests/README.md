# VGS CMP MCP Integration Tests

This directory contains integration tests for the VGS CMP MCP server. These tests make actual API calls to the VGS sandbox environment and require valid credentials.

## Test Structure

- **`unit/*.py`** - Unit tests with mocked responses (always run)
- **`integration/*.py`** - Integration tests that hit the actual VGS API (only run when credentials are provided)

## Running Integration Tests

### Prerequisites

1. **VGS Account**: You need a VGS account with CMP access
2. **Environment Variables**: Set the following environment variables:

```bash
export VGS_CLIENT_ID="your_client_id"
export VGS_CLIENT_SECRET="your_client_secret"
```

### Running All Tests

```bash
uv run python -m pytest -sv
```

## Troubleshooting

### Common Issues

1. **Authentication Errors (401/403)**
   - Verify `VGS_CLIENT_ID` and `VGS_CLIENT_SECRET` are correct
   - Check that your account has CMP access
   - Ensure credentials haven't expired

3. **Network Token Not Provisioned (424)**
   - The account may not have the network tokens capability enabled
   - Check your VGS account configuration
   - Contact VGS support if needed

For detailed API information, refer to:
- [VGS Network Tokens API](https://docs.verygoodsecurity.com/card-management/api/network-tokens)
- [VGS CMP API](https://docs.verygoodsecurity.com/card-management/api)
- [VGS Testing Guide](https://docs.verygoodsecurity.com/card-management/network-tokens/testing-guide)
