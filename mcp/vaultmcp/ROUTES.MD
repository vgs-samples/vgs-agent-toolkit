Please read SETUP.md to understand how to configure your environment.

# Sample Routes

- Routes are channels that allows sending data between two endpoints - from a source to a destination.
- Routes can be inbound (Reverse HTTP Proxy) or outbound (Forward HTTP Proxy). 
- Routes have filters.
- Filters are a set of conditions that define when data should be operated on as it passes through a Route.
- Operations are a transformation of, or an action on, a stream of information.

### Sample Outbound Route

This is a sample route written in JSON which is the payload format accepted by the API

```json
{
  "data" : {
    "id" : "92718185-ee4d-4fbf-8b8d-85ff02ce87a5",
    "type" : "rule_chain",
    "attributes" : {
      "id" : "92718185-ee4d-4fbf-8b8d-85ff02ce87a5",
      "protocol" : "http",
      "source_endpoint" : "*",
      "destination_override_endpoint" : "*",
      "host_endpoint" : "your-ngrok-url.ngrok.app",
      "port" : 80,
      "ordinal" : null,
      "tags" : {
        "name" : "foo",
        "source" : "RouteContainer"
      },
      "entries" : [ {
        "id" : "92718185-ee4d-4fbf-8b8d-85ff02ce87a5",
        "phase" : "REQUEST",
        "operation" : "ENRICH",
        "token_manager" : "PERSISTENT",
        "public_token_generator" : "UUID",
        "transformer" : "JSON_PATH",
        "transformer_config" : [ "$.account_number" ],
        "transformer_config_map" : null,
        "operations" : null,
        "targets" : [ "body" ],
        "id_selector" : null,
        "classifiers" : { },
        "config" : {
          "condition" : "AND",
          "rules" : [ {
            "condition" : null,
            "rules" : null,
            "expression" : {
              "field" : "PathInfo",
              "type" : "string",
              "operator" : "matches",
              "values" : [ "/post" ]
            }
          }, {
            "condition" : null,
            "rules" : null,
            "expression" : {
              "field" : "ContentType",
              "type" : "string",
              "operator" : "equals",
              "values" : [ "application/json" ]
            }
          } ],
          "expression" : null
        }
      } ]
    }
  }
}
```

Things to note

- All IDs are UUIDs and are idempotent. This let's the client control the ID but if they supply an existing ID it will override the existing route. 
- source_endpoint is a CIDR to control access to the proxy
- destination_override_endpoint is a hostname used to create the reverse proxy behavior (setting it will result in requests being sent to that host). Defaults to * which allows forward proxy connect protocol.
- host_endpoint - for the forward proxy (when destination_override_endpoint is set to *) - will pattern match the host header to determine if this route matches. Can use a .* to match any destination. If no match then the request will be dropped.
- tags - "name" is used to display on dashboard.
- entries - Users call this "filters". Each filter will match a HTTP request's attributes (path or headers are typically used) via the rules section. In the above example it's matching requests to /post url and the Content-Type header is application/json. When the filter matches then the filter is executed. 
- transformer - JSON_PATH means we will use json path to match the payload to find entries to transform in the payload
- transformer_config - holds the json path expressions we will use to transform
- public_token_generator - format of the token generated
- token_manager - persistence engine used for the vault. Can be VOLATILE or PERSISTENT
- operation - ENRICH will replace the tokenized value with the original value from the vault database. REDACT will swap the untokenized value for a tokenized value
- phase - REQUEST or RESPONSE - the phase of the HTTP request to perform the operation on. Defaults to request.

### Sample Inbound Route

```yaml
data:
  attributes:
    created_at: '2025-06-11T02:55:13'
    destination_override_endpoint: 'https://httpbin.org'
    entries:
    - classifiers: {}
        config:
        condition: AND
        rules:
            - expression:
                field: PathInfo
                operator: matches
                type: string
                values:
                - /post
            - expression:
                field: ContentType
                operator: equals
                type: string
                values:
                - application/json
        id: 951c15f9-8bc3-4b76-94ac-32e538faf1d9
        id_selector: null
        operation: REDACT
        operations: null
        phase: REQUEST
        public_token_generator: UUID
        targets:
        - body
        token_manager: PERSISTENT
        transformer: JSON_PATH
        transformer_config:
        - $.account_number
        transformer_config_map: null
    - classifiers: {}
        config:
        condition: AND
        rules:
            - expression:
                field: PathInfo
                operator: matches
                type: string
                values:
                - /post
            - expression:
                field: ContentType
                operator: equals
                type: string
                values:
                - application/json
        id: 0a3aa555-ec1d-467d-8335-f15127d8df8b
        id_selector: null
        operation: REDACT
        operations: null
        phase: REQUEST
        public_token_generator: UUID
        targets:
        - body
        token_manager: VOLATILE
        transformer: JSON_PATH
        transformer_config:
        - $.bar
        transformer_config_map: null
        type: null
    host_endpoint: (.*)\.verygoodproxy\.io
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    ordinal: null
    port: 80
    protocol: http
    source_endpoint: '*'
    tags:
    name: sample-inbound-route
    source: RouteContainer
    updated_at: '2025-06-11T02:55:13'
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    type: rule_chain
```

- This route acts like a reverse proxy. 
- It has two filters, one of which will redact into persistent storage, the other into volatile.

# Larky Compute

Larky is a compute language within the proxy which can be used to perform transforms. 

Here's a sample route with Larky enabled.

```yaml
data:
  attributes:
    created_at: '2025-06-11T02:58:45'
    destination_override_endpoint: 'https://httpbin.org'
    entries:
    - classifiers: {}
        config:
        condition: AND
        rules:
            - expression:
                field: PathInfo
                operator: matches
                type: string
                values:
                - /post
            - expression:
                field: ContentType
                operator: equals
                type: string
                values:
                - application/json
        id: 951c15f9-8bc3-4b76-94ac-32e538faf1d9
        id_selector: null
        operation: REDACT
        operations:
        - name: github.com/verygoodsecurity/common/compute/larky/http/Process
            parameters:
            script: |-
                load("@stdlib//builtins", builtins="builtins")
                load("@stdlib//json", json="json")
                load("@vgs//vault", "vault")

                def process(input, ctx):
                    headers = input.headers
                    body = json.loads(str(input.body))

                    alias = headers['to-be-tokenized']

                    body['secret'] = vault.redact(alias)
                    headers.pop('to-be-tokenized')

                    input.headers = headers
                    input.body = builtins.bytes(json.dumps(body))
                    return input
        phase: REQUEST
        public_token_generator: UUID
        targets:
        - body
        token_manager: PERSISTENT
        transformer: JSON_PATH
        transformer_config:
        - $.account_number
        transformer_config_map: null
    host_endpoint: (.*)\.verygoodproxy\.io
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    ordinal: null
    port: 80
    protocol: http
    source_endpoint: '*'
    tags:
    name: sample-inbound-route
    source: RouteContainer
    updated_at: '2025-06-11T03:03:47'
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    type: rule_chain
```

You can see that we have populated the `operations` block. When this happens the parameters `transformer`, `transformer_config`, `public_token_generator`, `token_manager`, and `operation` are ignored. 

You can find more examples of Larky operations at https://github.com/vgs-samples/code-examples/tree/master/integrations/larky and https://www.verygoodsecurity.com/docs/guides/larky_overview/. 

Larky is useful if we want to perform more complicated operations.

# Testing Routes

Routes are available at a well-known endpoint that is prefixed with the Vault ID. 

curl https://$VGS_VAULT_ID.sandbox.verygoodproxy.io/post \
  -H "Content-type: application/json" \
  -d '{"bar": "bar", "account_number": "foo"}'

This example cURL request will match the above route and redact the bar and account_number values, replacing them with tokens.

The reverse proxy does not require authentication to work. 

HTTPBIN.org is a common website to use for testing the proxy because it will echo back the results. It does not however simulate production API responses so it is not perfect but it's good for verification.

When creating a cURLs to test the proxy and not using HTTPBin you should customize the cURL based on the information within the route. E.g. if the route is redacting the json field $.account_number on the url /foo with a specific content-type header then generate a cURL that matches that. Your goal is to provide curls that will exercise the applied configuration. 

If the route is an outbound route then that means we need to use cURLs forward http proxy capabilities. Here's an example of how to use the forward proxy capability of cURL

curl https://api.stripe.com/v1/payment_intents/pi_3RPA40B4A5zSmJua1kcx3aj5/confirm \
  -x $VGS_VAULT_RUNTIME_USERNAME:$VGS_VAULT_RUNTIME_PASSWORD@sandbox.verygoodproxy.io:8080 \
  --cacert frontend/config/dev-cert.pem \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "payment_method_data[card][number]=4111+1148+0532+1111&payment_method_data[card][cvc]=161"

The --cacert parameter can be replaced with -k if we do not have a certificate available that can be used. This is not a good production practice but is fine during development. The username and password should be supplied by the user but you can also check for VGS_VAULT_RUNTIME_USERNAME and VGS_VAULT_RUNTIME_PASSWORD environment variables. The proxy URL is environment dependent. 

# Environments

VGS provides different environments and the customer must specify which one they are using. Based on that you will be able to infer the URLs for both the control plane APIs and the data plane APIs

- Dev - internal, used by VGS developers only. Do not use or provide as an option unless someone specifically asks for this.
  - Vault Mgmt Server - https://api.verygoodvault.io
  - IAM Server - https://auth.verygoodsecurity.io/auth
  - Proxy Server - sandbox.verygoodproxy.io
- Sandbox - customer pre-production
  - Vault Mgmt Server - https://api.verygoodvault.com
  - IAM Server - https://auth.verygoodsecurity.com/auth
  - Proxy Server - sandbox.verygoodproxy.com
- Live - customer production in US
  - Vault Mgmt Server - https://api.verygoodvault.com
  - IAM Server - https://auth.verygoodsecurity.com/auth
  - Proxy Server - live.verygoodproxy.com
- Live EU - customer production in EU
  - Vault Mgmt Server - https://api.verygoodvault.com
  - IAM Server - https://auth.verygoodsecurity.com/auth
  - Proxy Server - live-eu-1.verygoodproxy.com
- Live AP - customer production in AP
  - Vault Mgmt Server - https://api.verygoodvault.com
  - IAM Server - https://auth.verygoodsecurity.com/auth
  - Proxy Server - live-ap-1.verygoodproxy.com
  
When selecting a default environment use Sandbox. Assume the customer is testing unless they tell you otherwise. 

# Request Logs

When sending a request through the proxy it will generate an access log entry. These can be accessed using the get_access_logs method. Access logs sometimes take a minute or two to come through if there's a lot of load on the system so you may need to look for them a couple times. 

If you are running a request in a pre-production (sandbox) environment then you will be able to get debug logging details. Debug logs can be enabled for an hour at a time and will allow recording of the payload passing through the proxy for detailed debugging and analysis. Once debug logs are enabled you can use the get_access_log_details_by_request_id method which will return the payloads with both pre and post request and response payloads so you can see exactly what happened within the request. 

# Route serialization

The route API speaks JSON. However, JSON is harder for humans to read so VGS prefers using YAML to serialize and present to customers. If your human is using the CLI or dashboard to manage routes it will provide it to them in YAML format by default so you should also default to using YAML for consistency. 

There's several ways of serializing routes and you will need to be prepared to deal with routes in slightly different formats. The differences are just around the wrapper of the route config and the details of the route are identical in all cases. 

### Format 1 - Default YAML 

This format is used by the CLI and dashboard. It wraps the routes in a collection and adds a version identifier. It looks like this

```yaml
data: 
  - attributes:
        # route definition goes here
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    type: rule_chain
version: 1
```

Note that the ID is duplicated from the main attribute into the top level ID element. This is to help provide a hint to the CLI. 

### Format 2 - RAW Payload

This format is used in this document and has no wrapper around the payload. It looks like this

```yaml
data:
  attributes:
    id: 329b393f-da0d-4c91-ae37-edf06dff318f
    type: rule_chain
    # route definition goes here

```

### Format 3 - CRD Style

This format is supported by the CLI for future use but not by other tooling yet. If you see this then these intructions should help translate into format 2 which is what you should use. This is a client side wrapper but doesn't change how the API will receive the data.

```yaml
apiVersion: vault.vgs.io/v1
kind: HttpRoute
metadata:
  name: your-name-here
  labels:
    vgs.io/vaultId: your-vault-id-here
spec:
  id: 7478d3b7-beef-cafe-0000-000000000000
  type: rule_chain
  attributes:
    id: 7478d3b7-beef-cafe-0000-000000000000
    host_endpoint: httpbin.org
    # route definition goes here
```

# AI Assistant Instructions: Creating and Testing Inbound Routes

To autonomously create and verify an inbound route that redacts fields with persistent and volatile storage, follow these steps:

1. **Delete Existing Routes**
   - List all routes for the target vault.
   - Delete each route to ensure a clean state.

2. **Create the Inbound Route**
   - Use the following configuration as a template:
     - `protocol`: http
     - `source_endpoint`: "*"
     - `destination_override_endpoint`: "https://httpbin.org"
     - `host_endpoint`: "(.*)\.verygoodproxy\.io" (double-escape backslashes in JSON)
     - `port`: 80
     - `tags.name`: a descriptive name (e.g., "sample-inbound-route")
     - `entries`: two filters:
       - One with `operation`: REDACT, `token_manager`: PERSISTENT, `transformer_config`: ["$.account_number"]
       - One with `operation`: REDACT, `token_manager`: VOLATILE, `transformer_config`: ["$.bar"]
     - Both entries should match POST requests to `/post` with `Content-Type: application/json`.

3. **Test the Route**
   - Use curl to send a POST request to the proxy endpoint:
     ```sh
     curl https://<vault_id>.sandbox.verygoodproxy.io/post -H "Content-type: application/json" -d '{"bar": "bar", "account_number": "foo"}'
     ```
   - Replace `<vault_id>` with the actual vault ID.

4. **Verify the Output**
   - The response from httpbin.org should show both `bar` and `account_number` fields replaced with tokens (e.g., values starting with `tok_`).
   - This confirms that the route is redacting both fields as intended, using the correct storage settings.

5. **Troubleshooting**
   - If you receive a 400 error on route creation, check for JSON encoding issues (especially with regex backslashes).
   - Ensure all required fields are present and correctly formatted.

---

These steps allow the AI assistant to autonomously manage, test, and verify inbound routes for data redaction and proxying to httpbin.org.