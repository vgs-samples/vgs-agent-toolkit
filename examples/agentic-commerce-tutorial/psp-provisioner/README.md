# PSP Token Provisioner

This application demonstrates how to provision PSP (Payment Service Provider) tokens using VGS Outbound Proxy. It follows the [VGS documentation](https://docs.verygoodsecurity.com/agentic-commerce/provisioning-psp-tokens-for-payments) for securely sharing card data with payment processors.

## Features

- ✅ **VGS Outbound Proxy Integration**: Secure communication with PSP APIs
- ✅ **Stripe Integration**: Provision Stripe Payment Methods
- ✅ **Certificate Management**: Automatic VGS certificate handling
- ✅ **Modern UI**: Bootstrap-based responsive interface
- ✅ **Error Handling**: Comprehensive error handling and validation
- ✅ **Configuration Status**: Real-time configuration checking

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   VGS Outbound   │    │   Stripe API    │
│   (Browser)     │    │     Proxy        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Backend       │───▶│   PAN/CVC        │───▶│   Payment       │
│   (Node.js)     │    │   Aliases        │    │   Method        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

1. **VGS Vault**: Configured with outbound routes
2. **VGS Access Credentials**: Username/password for outbound proxy
3. **VGS Certificate**: Downloaded from VGS documentation
4. **Stripe Account**: For PSP token provisioning
5. **Node.js**: Version 14 or higher

## Setup Instructions

### 1. Install Dependencies

```bash
cd vic/psp-provisioner
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp env.example .env
```

Edit `.env` with your actual credentials:

```env
# VGS Configuration
VGS_VAULT_ID=tntonm7yolo
VGS_USERNAME=your-vault-username
VGS_PASSWORD=your-vault-password
VGS_ENVIRONMENT=sandbox

# PSP Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Server Configuration
PORT=3031
```

### 3. Download VGS Certificates

Download the VGS certificates from the [VGS documentation](https://docs.verygoodsecurity.com/docs/outbound-proxy#certificates):

- **Sandbox**: `outbound-route-sandbox.pem`
- **Live**: `outbound-route-live.pem`

Place these files in the project root directory.

### 4. Configure VGS Outbound Routes

In your VGS Dashboard:

1. Navigate to **Vault > Routes**
2. Create an outbound route for Stripe API
3. Configure the route to allow requests to `api.stripe.com`
4. Or use the Route Templates in **Addons > Route Templates**

### 5. Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3031`

## How It Works

### Backend (server.js)

1. **VGS Outbound Proxy**: Configures tunnel for secure communication
2. **Certificate Management**: Uses VGS certificates for SSL/TLS
3. **PSP Integration**: Communicates with Stripe API through VGS proxy
4. **Token Provisioning**: Creates PSP tokens using card aliases

### Frontend (public/)

1. **Configuration Check**: Verifies server and VGS setup
2. **Card Object Input**: Accepts card objects from collection app
3. **PSP Selection**: Choose payment provider (Stripe)
4. **Token Provisioning**: Sends requests to backend for token creation

## VGS Outbound Proxy Configuration

The application uses the VGS Outbound Proxy to securely communicate with PSP APIs:

```javascript
function getProxyAgent() {
    const vgs_outbound_url = `${VAULT_ID}.${ENVIRONMENT}.verygoodproxy.com`;
    return tunnel.httpsOverHttps({
        proxy: {
            servername: vgs_outbound_url,
            host: vgs_outbound_url,
            port: 8443,
            proxyAuth: `${VGS_USERNAME}:${VGS_PASSWORD}`
        },
    });
}
```

## Stripe Integration

The app provisions Stripe Payment Methods using the VGS Outbound Proxy:

```javascript
// Card data is sent as aliases
card: {
    number: cardObject.attributes.pan_alias,    // VGS PAN alias
    cvc: cardObject.attributes.cvc_alias,       // VGS CVC alias
    exp_month: cardObject.attributes.exp_month,
    exp_year: cardObject.attributes.exp_year,
}
```

## API Endpoints

### POST `/provision-psp-token`

Provisions a PSP token using a card object.

**Request Body:**
```json
{
  "cardObject": {
    "data": {
      "id": "CRDecqZp3xRgXU3TFmtcDdzQs",
      "attributes": {
        "pan_alias": "tok_abcdefghijklmnop",
        "cvc_alias": "tok_zbcdefgh",
        "exp_month": 5,
        "exp_year": 28
      }
    }
  },
  "pspProvider": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "psp_token": "pm_1234567890abcdef",
  "payment_method": {
    "id": "pm_1234567890abcdef",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "1111",
      "exp_month": 5,
      "exp_year": 2028
    }
  },
  "card_id": "CRDecqZp3xRgXU3TFmtcDdzQs"
}
```

### GET `/config`

Returns current VGS configuration status.

### GET `/health`

Health check endpoint.

## Testing

### 1. Get a Card Object

First, use the card collection app to create a card object, or use the sample provided in the UI.

### 2. Provision PSP Token

1. Open the PSP Provisioner app
2. Paste the card object JSON
3. Select "Stripe" as the PSP provider
4. Click "Provision PSP Token"

### 3. Verify Results

The app will display:
- PSP Token ID
- Payment Method details
- Card information
- Full API response

## Security Features

- ✅ **VGS Outbound Proxy**: All sensitive data goes through VGS
- ✅ **Certificate Validation**: SSL/TLS certificate verification
- ✅ **Alias Tokens**: PAN and CVC are never exposed in plain text
- ✅ **Authentication**: VGS credentials for proxy access
- ✅ **Error Handling**: Secure error messages without data leakage

## Troubleshooting

### Common Issues

1. **Certificate Errors**: Ensure VGS certificates are downloaded and in the correct location
2. **Authentication Errors**: Verify VGS username/password in `.env`
3. **Outbound Route Errors**: Check VGS dashboard for proper route configuration
4. **Stripe API Errors**: Verify Stripe secret key and account status

### Debug Steps

1. Check configuration status in the UI
2. Verify VGS outbound routes in dashboard
3. Test with sample card object
4. Check server logs for detailed error messages

## Production Considerations

- Use `VGS_ENVIRONMENT=live` for production
- Download live environment certificates
- Implement proper logging and monitoring
- Add rate limiting and security headers
- Use HTTPS in production
- Consider implementing webhook notifications

## Integration with Card Collection App

This app works seamlessly with the card collection app:

1. **Collect Card**: Use the card collection app to create card objects
2. **Provision Token**: Use this app to provision PSP tokens
3. **Use for Payments**: Use the PSP tokens for actual payments

## Resources

- [VGS Outbound Proxy Documentation](https://docs.verygoodsecurity.com/docs/outbound-proxy)
- [VGS Agentic Commerce Documentation](https://docs.verygoodsecurity.com/agentic-commerce/provisioning-psp-tokens-for-payments)
- [Stripe Payment Methods API](https://stripe.com/docs/api/payment_methods)
- [VGS Certificates](https://docs.verygoodsecurity.com/docs/outbound-proxy#certificates) 