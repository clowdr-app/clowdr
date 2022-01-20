import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import { ManagementClient } from "auth0";
import type {
    CdkCustomResourceEvent,
    CloudFormationCustomResourceCreateEvent,
    CloudFormationCustomResourceDeleteEvent,
    CloudFormationCustomResourceUpdateEvent,
    Context,
} from "aws-lambda";

export async function onEvent(event: CdkCustomResourceEvent, context: Context) {
    switch (event.RequestType) {
        case "Create":
            return onCreate(event, context);
        case "Update":
            return onUpdate(event, context);
        case "Delete":
            return onDelete(event, context);
    }
}

function createProps(
    Name: string | undefined,
    AllowedLogoutUrls: string[] | undefined,
    Callbacks: string[] | undefined,
    AllowedOrigins: string[] | undefined,
    WebOrigins: string[] | undefined
) {
    return {
        name: Name,
        is_token_endpoint_ip_header_trusted: false,
        is_first_party: true,
        oidc_conformant: true,
        sso_disabled: false,
        cross_origin_auth: false,
        refresh_token: {
            expiration_type: "expiring",
            leeway: 60,
            token_lifetime: 2592000,
            idle_token_lifetime: 86400,
            infinite_token_lifetime: false,
            infinite_idle_token_lifetime: false,
            rotation_type: "rotating",
        },
        allowed_clients: [],
        allowed_logout_urls: AllowedLogoutUrls,
        callbacks: Callbacks,
        native_social_login: {
            apple: {
                enabled: false,
            },
            facebook: {
                enabled: false,
            },
        },
        allowed_origins: AllowedOrigins,
        jwt_configuration: {
            alg: "RS256",
            lifetime_in_seconds: 86400,
        },
        client_aliases: [],
        token_endpoint_auth_method: "none",
        app_type: "spa",
        grant_types: ["authorization_code", "implicit", "refresh_token"],
        web_origins: WebOrigins,
        custom_login_page_on: true,
    };
}

async function createOrUpdate(
    existingClientId: string | null,
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const Auth0ClientCredentialsARN = event.ResourceProperties.Auth0ClientCredentialsARN;

    const Name: string | undefined = event.ResourceProperties.Name;
    const AllowedLogoutUrls: string[] | undefined = event.ResourceProperties.AllowedLogoutUrls;
    const Callbacks: string[] | undefined = event.ResourceProperties.Callbacks;
    const AllowedOrigins: string[] | undefined = event.ResourceProperties.AllowedOrigins;
    const WebOrigins: string[] | undefined = event.ResourceProperties.WebOrigins;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Auth0ClientCredentialsARN, "Auth0 Client Credentials ARN property missing");
    assert(Name, "Name property missing");
    assert(AllowedLogoutUrls, "Allowed Logout URLs property missing");
    assert(Callbacks, "Allowed Logout URLs property missing");
    assert(AllowedOrigins, "Allowed Logout URLs property missing");
    assert(WebOrigins, "Allowed Logout URLs property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const auth0 = new ManagementClient({
        domain: accountCredentials.Domain,
        clientId: accountCredentials.ClientID,
        clientSecret: accountCredentials.ClientSecret,
    });
    const props = createProps(Name, AllowedLogoutUrls, Callbacks, AllowedOrigins, WebOrigins);
    const client = existingClientId
        ? await auth0.updateClient(
              {
                  client_id: existingClientId,
              },
              props
          )
        : await auth0.createClient(props);

    await sm.putSecretValue({
        SecretId: Auth0ClientCredentialsARN,
        SecretString: JSON.stringify({
            ClientId: client.client_id,
            ClientSecret: client.client_secret,
        }),
    });

    return {
        PhysicalResourceId: client.client_id,
        Data: {
            ClientId: client.client_id,
        },
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return createOrUpdate(null, event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return createOrUpdate(event.PhysicalResourceId, event);
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const auth0 = new ManagementClient({
        domain: accountCredentials.Domain,
        clientId: accountCredentials.ClientID,
        clientSecret: accountCredentials.ClientSecret,
    });
    await auth0.deleteClient({
        client_id: event.PhysicalResourceId,
    });
}
