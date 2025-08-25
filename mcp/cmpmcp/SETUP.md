# Pre-requisites

Before a customer can begin using routes we need some things to be done. 

If they do not yet have a vault they must go to https://dashboard.verygoodsecurity.com and create one. We will need the vault ID and the organization ID, both of which are available via the dashboard. 

Set some common environment variables VGS_VAULT_ID and VGS_ORGANIZATION_ID.

They must also create a service account and provide you with the VGS_CLIENT_ID and VGS_CLIENT_SECRET values. The service account is used for the control plane (setup and configuration) of VGS. 

As part of creating the service account they must ensure that it has the following scopes. 

- cards:read
- network-tokens:write
- network-tokens:read

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
    - name: cards:read
    - name: network-tokens:write
    - name: network-tokens:read
```

2. Apply the request and receive the credential

`vgs apply service-account -O $VGS_ORGANIZATION_ID -f service_account.yaml`

Once we have this credential you can get the user to place this information as environment variables into the MCP configuration as VGS_CLIENT_ID and VGS_CLIENT_SECRET.
