# VGS AI Web Form Demo

A combined project that demonstrates form handling with a Flask backend and headless form testing using Puppeteer.

This project can be used to see how an [MCP](https://modelcontextprotocol.io/introduction) server can be used with an AI agent to perform a deterministic payment request on a website while keeping the agent out of PCI scope by using VGS to route the request, allowing the agent to operate on tokenized payment credentials rather than PAN and CVV data. 

Visit the [VGS proxy docs](https://www.verygoodsecurity.com/docs/vault/concepts/proxies-and-routing-data) to learn more about how routing data via VGS works. 

# Pre-requisites

For this demo we will use python, docker, node, [cursor](https://www.cursor.com/) or [windsurf](https://www.windsurf.com/) and [VGS](https://www.verygoodsecurity.com/). We will assume that you have these setup for this demo.

# Components

This project is made up of several components:

## Backend

The backend is a mocked example of a merchant's website. It hosts an API endpoint, and a webpage that contains a Stripe collect form that can be submitted and will store the result of the payment in a database.

We need to setup a `.env` file before we start, here's a sample one using some test values to get you started

```
HTTPS_PROXY_USERNAME=US9R2M2Bf9QJv47hziu4G3GS
HTTPS_PROXY_PASSWORD=a2accde2-940e-4a09-bb59-edbe6ce08321
TENANT_ID=tntonm7yolo
SANDBOX_URL="sandbox.verygoodproxy.com"
PROXY_PORT="8080"
TLS_PROXY_PORT="8443"
DATA_ENV="sandbox"
HEADLESS=false
RECORD_VIDEO=true
DISPLAY=:99
CERT_PATH=./config/sandbox-cert.pem
# CERT_PATH=./config/dev-cert.pem
# FORM_URL=http://localhost:11337
# FORM_URL=http://backend:11337
FORM_URL=https://vgs.ngrok.app
STRIPE_PUBLIC_KEY=pk_test_51ROLnRB4A5zSmJuaEXkagqOZbk3aHnezfNoEc87BcTTV9RK3VN8o8Y9HKskPB5Hf5heg818XqNHYhGKairPoA6PT00NkTyFneH
STRIPE_SECRET_KEY=sk_test_51ROLnRB4A5zSmJuaqu4fTblhaazLdQVQVxCSQUJToOw1HWxLjeE9mBUJovOYIKqcDjf7BK29hYoBX0muZ3Lmz89k00XoojwdHT
RECAPTCHA_TOKEN=0d1f1c9730e87cf884bbef066f6492e8
```

_**Note**, you will want to customize most of these settings for your own environment but for test purposes these should work out of the box. All these test values are OK to expose publicy for this demo._ 

Starting the backend service is pretty simple, just run

```sh
docker compose up backend
```

We've configured the service with a Stripe private and public key, in a production setup you would replace these with your own keys.

For the purposes of this demo we will need to expose this server via ngrok. A paid subscription will make this easier for you since you but you can do this with an unpaid subscription too. However, each time the server is exposed to the internet with ngrok on a free subscription it receives a unique host name and this will need to be input into the VGS proxy so that it knows where to route the request once it is received. 

You can run ngrok like this

```sh
brew install ngrok
ngrok config add-authtoken your-auth-token  # only if you have a paid subscription
ngrok http 11337 --url https://your-host.ngrok.app  # only pass --url if you have a paid subscription
```

### Configuring VGS

You will need to configure VGS to route traffic and rewrite the token going to Stripe. We can use the VGS CLI for this purpose, or you can copy the routes into the dashboard UI. 

_**Note**: You will need your Vault ID to make this work, please replace with your own vault._

#### Configuring VGS Proxy via CLI

```sh
export VGS_VAULT_ID=tntonm7yolo
# install cli if you don't already have it
pip install vgs-cli
vgs login
vgs apply routes --vault=$VGS_VAULT_ID -f vgs-proxy-routes/outbound-to-stripe-api.yaml
vgs apply routes --vault=$VGS_VAULT_ID -f vgs-proxy-routes/outbound-to-stripe-js.yaml
# note, you will need to replace "your-ngrok-url.ngrok.app" with your own server's endpoint. 
# sed -i '' 's/your-ngrok-url\.ngrok\.app/vgs.ngrok.app/g' vgs-proxy-routes/outbound-to-backend.yaml
vgs apply routes --vault=$VGS_VAULT_ID -f vgs-proxy-routes/outbound-to-backend.yaml
```

#### Configuring VGS Proxy via MCP

```prompt
delete all routes for vault tntonm7yolo and then apply the routes from @vgs-proxy-routes . for the outbound to backend route use the hostname vgs.ngrok.app
```

#### Configuring VGS Proxy via Dashboard

1. Replace the string "your-ngrok-url.ngrok" with your URL in the file vgs-proxy-routes/outbound-to-backend.js
2. Go to https://dashboard.verygoodsecurity.io and find your Vault
3. On the Routes page, upload your routes.


OK, we're configured, let's move on to testing the MCP server!

## MCP Server

The mcp-server module is the same implementation as the frontend module but exposed via an MCP server which allows an AI agent to invoke the methods. It exposes a single method called `submit_stripe_payment` which can be called from the agent by configuring the mcp server and then calling it using a prompt usch as "Submit a payment to Stripe". 

### Building the MCP Server

```sh
pushd mcp-server && npm run build && popd && docker compose build mcp-server
```

### Configuring the MCP Server

The MCP server can be configured using a standard MCP configuration like this

```json
{
  "mcpServers": {
    "vgs-ai-demo": {
      "transport": "stdio",
      "command": "docker compose -f /Users/marshall/code/vgs/vgs-ai-demo/examples/secure-data-mcp-example/docker-compose.yaml run -T mcp-server",
      "env": {
        "HTTPS_PROXY_USERNAME": "US9R2M2Bf9QJv47hziu4G3GS",
        "HTTPS_PROXY_PASSWORD": "a2accde2-940e-4a09-bb59-edbe6ce08321",
        "TENANT_ID": "tntonm7yolo",
        "SANDBOX_URL": "sandbox.verygoodproxy.com",
        "PROXY_PORT": "8080",
        "TLS_PROXY_PORT": "8443"
      }
    }
  }
}
```

_**Note:** here that we're providing dummy credentials which can be used for the purposes of this demo. You can generate your own credentials by going to the [VGS dashboard](https://dashboard.verygoodsecurity.com/) and generating a pair of access credentials._

Additionally, the MCP server requires you to provide an absolute path when running from your filesystem. Assuming your username is not "marshall", you will need to replace this with the path of your repo. Use a command like `pwd` to figure out what this is. 

This configuration can be placed in `.cursor/mcp.json` and you will need to check the cursor settings panel to verify that the MCP configuration is parsed correctly and the server is running before invoking the prompt.

_**Note**: you will need some tokenized values to run this demo, we've included the command we used. You will need to replace this with your credentials if you want to use your own vault but we've included some test credentials for convenience._

```sh
curl https://api.sandbox.verygoodvault.com/aliases \
  -H "Content-Type: application/json" \
  -u US9R2M2Bf9QJv47hziu4G3GS:a2accde2-940e-4a09-bb59-edbe6ce08321 \
  -d '{
    "data": [{
        "value": "4111111111111111",
        "format": "FPE_SIX_T_FOUR"
    },{
        "value": "123",
        "format": "NUM_LENGTH_PRESERVING",
        "storage": "VOLATILE"
    }]
  }'
```

Once you have the aliased values returned, you're now ready to ask the agent to perform a payment

Use a prompt like this

> please submit the stripe payment using pan 4111110824521111, cvv 193, expiration 10/26, name bob sagat, postal code 90210

You should see the agent invoke the MCP server, which in turn will complete the Stripe form via the VGS proxy and then submit the successful payment to the backend.

> I will submit the Stripe payment using:
>
> PAN: 4111110824521111
>
> CVV: 193
>
> Expiration: 12/34
>
> Name: Test User
>
> Postal Code: 12345
>
> Proceeding now.
>
> The Stripe payment was submitted successfully using the provided PAN (4111110824521111) and CVV (193).
>
> If you need to test with other card details or want to see more information about the result, just let me know!

## Frontend

_**Note:** You will only need to do this during local development._

The frontend is a web scraping service that will use the VGS proxy to scrape the webpage and perform a payment using a dummy card number. This module is used an a reference example to demonstrate how to scrape the web form without having an MCP server in the middle. 

You can test this out by running `docker compose exec frontend node src/stripeTester.js`

