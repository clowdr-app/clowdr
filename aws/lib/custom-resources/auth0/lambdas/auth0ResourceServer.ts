import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import type { CreateResourceServer } from "auth0";
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

function createProps(Name: string | undefined): CreateResourceServer {
    return {
        name: Name,
        identifier: "hasura",
        allow_offline_access: false,
        skip_consent_for_verifiable_first_party_clients: true,
        token_lifetime: 86400,
        token_lifetime_for_web: 7200,
        signing_alg: "RS256",
        enforce_policies: false,
        token_dialect: "access_token",
    };
}

async function createOrUpdate(
    existingResourceServerId: string | null,
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

    const Name: string | undefined = event.ResourceProperties.Name;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Name, "Name property missing");

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
    const props = createProps(Name);
    const resourceserver = existingResourceServerId
        ? await auth0.updateResourceServer(
              {
                  id: existingResourceServerId,
              },
              props
          )
        : await auth0.createResourceServer(props);

    return {
        PhysicalResourceId: resourceserver.id,
        Data: {
            ResourceServerId: resourceserver.id,
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
    await auth0.deleteResourceServer({
        id: event.PhysicalResourceId,
    });
}
