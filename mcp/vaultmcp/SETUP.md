# Pre-requisites

Before a customer can begin using routes we need some things to be done. 

If they do not yet have a vault they must go to https://dashboard.verygoodsecurity.com and create one. We will need the vault ID and the organization ID, both of which are available via the dashboard. 

Set some common environment variables VGS_VAULT_ID and VGS_ORGANIZATION_ID.

They must also create a service account and provide you with the VGS_CLIENT_ID and VGS_CLIENT_SECRET values. The service account is used for the control plane (setup and configuration) of VGS. 

As part of creating the service account they must ensure that it has the following scopes. 

- access-logs:read
- access-logs:write
- routes:read
- routes:write

You can help the user create this service account using the VGS CLI which can be installed by calling `pip install vgs-cli`.

After the cli is installed they can perform an interactive login using `vgs login`. 

Once that's done the service account creation is a two step process as documented at https://www.verygoodsecurity.com/docs/vgs-cli/commands/#service-account

1. Create the request payload

`vgs generate service-account -t vgs-cli --vault=$VGS_VAULT_ID > service_account.yaml`

Now edit `service_account.yaml` and ensure it has the scopes from above

```yaml
apiVersion: 1.0.0
kind: ServiceAccount
data:
  name: vgs-cli
  vaults:
    - tntasd123
  scopes:
    - name: access-logs:read
    - name: access-logs:write  # this is not exposed to our users, we need to omit this for now. this is for enabling secure debug
    - name: vaults:write
    - name: routes:read
    - name: routes:write
```

2. Apply the request and receive the credential

`vgs apply service-account -O $VGS_ORGANIZATION_ID -f service_account.yaml`

Once we have this credential you can get the user to place this information as environment variables into the MCP configuration as VGS_CLIENT_ID and VGS_CLIENT_SECRET.

We will also need runtime credentials for the data plane which can be provisioned like this

`vgs generate access-credentials --vault $VGS_VAULT_ID`

The response from this will look like

```yaml
apiVersion: 1.0.0
kind: AccessCredentials
data:
  attributes:
    active: true
    createdAt: '2025-06-11T17:34:14.694700065'
    id: US3bapFEeGq2g1TYSeRYMojV
    key: US3bapFEeGq2g1TYSeRYMojV
    secret: e201ca62-9ab2-46a2-948c-2cefb2eac49v
  id: US3bapFEeGq2g1TYSeRYMojS
  type: credentials
```

The `key` should be mapped to `VGS_VAULT_RUNTIME_USERNAME` and `secret` should be mapped to `VGS_VAULT_RUNTIME_PASSWORD` environment variables.

Once we have these credentials and variables setup everything should be ready for the user to begin configuring VGS. The above is usually a one-time setup. 
