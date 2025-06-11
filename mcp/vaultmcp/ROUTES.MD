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

curl https://tntipby064g.sandbox.verygoodproxy.io/post -H "Content-type: application/json" -d '{"bar": "bar", "account_number": "foo"}'

This example cURL request will match the above route and redact the bar and account_number values, replacing them with tokens.

The reverse proxy does not require authentication to work. 

HTTPBIN.org is a common website to use for testing the proxy because it will echo back the results. It does not however simulate production API responses so it is not perfect but it's good for verification