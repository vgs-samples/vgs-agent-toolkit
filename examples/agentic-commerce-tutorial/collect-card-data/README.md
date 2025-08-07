# VGS Agentic Card Collection Sample App

This is a sample application demonstrating how to securely collect card data using VGS Collect in an agentic commerce system. The app follows the [VGS documentation](https://docs.verygoodsecurity.com/agentic-commerce/) for implementing PCI-compliant card collection.

## Features

- ✅ Secure card data collection using VGS Collect
- ✅ PCI-compliant hosted fields
- ✅ JWT authentication with service account
- ✅ Card object creation with PAN and CVC aliases
- ✅ Modern, responsive UI with Bootstrap
- ✅ Error handling and user feedback
- ✅ Ready for production use

## Prerequisites

1. **VGS Account**: You need a VGS account with a Vault
2. **Service Account**: Create a client-side service account with `cards:write` & `network-tokens:write` scopes
3. **Node.js**: Version 14 or higher

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your VGS credentials:

```bash
cp env.example .env
```

Edit `.env` and add your VGS service account credentials:

```env
VGS_CLIENT_ID=your-client-id
VGS_CLIENT_SECRET=your-client-secret
```

### 3. Update Vault Configuration

In `public/script.js`, update the Vault ID and environment:

```javascript
const VAULT_ID = "your-vault-id"; // Replace with your actual Vault ID
const ENVIRONMENT = "sandbox"; // or "live" for production
```

### 4. Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3030`

## How It Works

### Backend (server.js)

1. **JWT Generation**: The server generates short-lived JWTs using your service account credentials
2. **Token Endpoint**: Provides `/get-collect-token` endpoint for frontend authentication
3. **Static File Serving**: Serves the frontend files from the `public` directory

### Frontend (public/)

1. **VGS Collect Integration**: Uses VGS Collect library for secure form fields
2. **Form Fields**: Implements cardholder name, card number, expiration, and CVC fields
3. **Card Creation**: Calls `form.createCard()` with JWT authentication
4. **Result Display**: Shows card object details including PAN and CVC aliases

## Service Account Setup

Follow these steps to create your service account:

1. Navigate to **Vault > Organization > Service Accounts** in your VGS Dashboard
2. Click **Create New**
3. Select your Vault
4. Add the following scopes:
   - `cards:write`
   - `network-tokens:write`
5. Save the client ID and client secret for your `.env` file

## Card Object Response

When a card is successfully created, you'll receive a card object with:

```json
{
  "data": {
    "id": "CRDecqZp3xRgXU3TFmtcDdzQs",
    "type": "cards",
    "attributes": {
      "pan_alias": "tok_abcdefghijklmnop",
      "cvc_alias": "tok_zbcdefgh",
      "cvc_status": "active",
      "bin": "411111",
      "first8": "41111111",
      "last4": "1111",
      "exp_month": 5,
      "exp_year": 28,
      "card_fingerprint": "6TeSCB16LtyifEAmY2goxYfSk5sALriXpefzzxh29xhu",
      "capabilities": [
        "network-tokens",
        "card-updates"
      ],
      "created_at": "2025-08-01T00:00:00Z",
      "updated_at": "2025-08-01T00:00:00Z"
    },
    "meta": {
      "token_type": "pan"
    }
  }
}
```

## Key Components

- **Card ID**: Main identifier for the card object
- **PAN Alias**: Token representing the card number (can be used with VGS Outbound Proxy)
- **CVC Alias**: Token representing the CVC (valid for 1 hour, considered SAD)
- **Expiration Date**: Required for PSP tokens and payments

## Security Features

- ✅ **PCI Compliance**: Raw PAN/CVC never exposed to your systems
- ✅ **JWT Authentication**: Short-lived tokens for secure access
- ✅ **Hosted Fields**: VGS-managed input fields
- ✅ **Alias Tokens**: Secure representation of sensitive data

## Testing

Use these test card numbers:

- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

## Next Steps

After collecting card data, you can:

1. **Provision PSP Tokens**: Use the card object for payment processing
2. **Create Network Tokens**: Generate network tokens for enhanced security
3. **Implement Account Updater**: Keep card data current with VGS Account Updater

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify your service account credentials in `.env`
2. **Vault ID Errors**: Ensure your Vault ID is correct in `script.js`
3. **CORS Issues**: The server includes CORS headers, but check browser console for errors
4. **Form Not Loading**: Verify the VGS Collect library is loading properly

### Debug Mode

Check the browser console for detailed error messages and card object details.

## Production Considerations

- Use `ENVIRONMENT = "live"` for production
- Implement proper error handling and logging
- Add rate limiting and security headers
- Use HTTPS in production
- Consider implementing webhook notifications for card updates

## Resources

- [VGS Agentic Commerce Documentation](https://docs.verygoodsecurity.com/agentic-commerce/collect-card-data-from-user)
- [VGS Collect Documentation](https://www.verygoodsecurity.com/docs/collect)
- [VGS API Documentation](https://www.verygoodsecurity.com/docs/api) 