# VGS CMP MCP Integration Tests

This directory contains integration tests for the VGS CMP MCP server. These tests make actual API calls to the VGS sandbox environment and require valid credentials.

## Test Structure

- **`test_main.py`** - Unit tests with mocked responses (always run)
- **`test_integration.py`** - Integration tests that hit the actual VGS API (only run when credentials are provided)

## Running Integration Tests

### Prerequisites

1. **VGS Account**: You need a VGS account with CMP access
2. **Environment Variables**: Set the following environment variables:

```bash
export VGS_CLIENT_ID="your_client_id"
export VGS_CLIENT_SECRET="your_client_secret"
export VGS_TEST_CARD_ID="CRD123456789"  # Optional: specific test card ID
```

### Running All Tests

```bash
# Run unit tests only (always works)
uv run python -m pytest tests/test_main.py -v

# Run integration tests only (requires credentials)
uv run python -m pytest tests/test_integration.py -v

# Run all tests (integration tests will be skipped if no credentials)
uv run python -m pytest tests/ -v
```

### Running Specific Integration Tests

```bash
# Test network token creation
uv run python -m pytest tests/test_integration.py::TestNetworkTokenIntegration::test_create_network_token_integration -v

# Test cryptogram fetching
uv run python -m pytest tests/test_integration.py::TestNetworkTokenIntegration::test_fetch_network_token_cryptogram_integration -v

# Test complete lifecycle
uv run python -m pytest tests/test_integration.py::TestNetworkTokenIntegration::test_network_token_lifecycle_integration -v

# Test environment validation
uv run python -m pytest tests/test_integration.py::TestEnvironmentValidation -v
```

## Test Card Requirements

For the integration tests to work, you need a valid card ID in your VGS account. You can:

1. **Use an existing card**: Set `VGS_TEST_CARD_ID` to an existing card ID
2. **Create a test card**: Use the VGS dashboard or API to create a test card
3. **Use the VGS testing guide**: Follow the [VGS Testing Guide](https://docs.verygoodsecurity.com/card-management/network-tokens/testing-guide) to create test cards

## What the Integration Tests Verify

### Network Token Creation
- ✅ API endpoint accessibility
- ✅ Authentication and authorization
- ✅ Response structure validation
- ✅ Required fields presence

### Cryptogram Fetching
- ✅ API endpoint accessibility
- ✅ Authentication and authorization
- ✅ Response structure validation
- ✅ Cryptogram data structure
- ✅ Metadata presence

### Lifecycle Testing
- ✅ Complete workflow: create token → fetch cryptogram → verify association
- ✅ Data consistency across API calls
- ✅ Error handling for invalid requests

### Environment Validation
- ✅ Credential validation
- ✅ JWT token generation
- ✅ Environment configuration

## Troubleshooting

### Common Issues

1. **Authentication Errors (401/403)**
   - Verify `VGS_CLIENT_ID` and `VGS_CLIENT_SECRET` are correct
   - Check that your account has CMP access
   - Ensure credentials haven't expired

2. **Card Not Found (404)**
   - Verify `VGS_TEST_CARD_ID` is correct
   - Check that the card exists in your VGS account
   - Ensure you're using the correct environment (sandbox vs live)

3. **Network Token Not Provisioned (424)**
   - The card may not have network tokens enabled
   - Check your VGS account configuration
   - Contact VGS support if needed

### Debug Mode

To see detailed API responses, you can modify the test files to print response data:

```python
print(f"Response: {response}")
print(f"Status Code: {response.status_code}")
```

## Security Notes

- **Never commit credentials** to version control
- **Use environment variables** for sensitive data
- **Test in sandbox** before using live credentials
- **Rotate credentials** regularly
- **Monitor API usage** for unexpected activity

## API Documentation

For detailed API information, refer to:
- [VGS Network Tokens API](https://docs.verygoodsecurity.com/card-management/api/network-tokens)
- [VGS CMP API](https://docs.verygoodsecurity.com/card-management/api)
- [VGS Testing Guide](https://docs.verygoodsecurity.com/card-management/network-tokens/testing-guide)
