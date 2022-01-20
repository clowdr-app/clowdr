import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import type { Strategy } from "auth0";
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

function createProps(existingId: string | null, Name: string, EnabledClients: string[]) {
    const props: Record<string, any> = {
        options: {
            mfa: {
                active: true,
                return_enroll_settings: true,
            },
            passwordPolicy: "good",
            strategy_version: 2,
            brute_force_protection: true,
        },
        is_domain_connection: false,
        realms: ["Username-Password-Authentication"],
        enabled_clients: EnabledClients,
    };

    if (!existingId) {
        props.name = Name;
        props.strategy = "auth0" as Strategy;
    }

    return props;
}

async function update(
    existingId: string | null,
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

    const Name: string | undefined = event.ResourceProperties.Name;
    const EnabledClients: string[] | undefined = event.ResourceProperties.EnabledClients;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Name, "Name property missing");
    assert(EnabledClients, "Enabled Clients property missing");

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
    if (!existingId) {
        // Auth0 creates one by default that we probably want to update
        const existingConnections = (await auth0.getConnections()).filter(
            (x) =>
                x.name === "Username-Password-Authentication" ||
                (x.strategy === "auth0" && x.realms?.includes("Username-Password-Authentication"))
        );
        if (existingConnections.length > 0) {
            existingId = existingConnections[0].id ?? null;
        }
    }
    const props = createProps(existingId, Name, EnabledClients);

    const connection = await (existingId
        ? auth0.updateConnection(
              {
                  id: existingId,
              },
              props
          )
        : auth0.createConnection(props as any));

    return {
        PhysicalResourceId: connection.id,
        Data: {},
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return update(null, event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return update(event.PhysicalResourceId, event);
}

async function onDelete(_event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    // Do nothing
    //  - deleting a database connection would also delete all its users which
    //    is a very scary prospect.
    //
    // const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    // assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    // const sm = new SecretsManager({});
    // const accountCredentialsSecret = await sm.getSecretValue({
    //     SecretId: AccountCredentialsARN,
    // });
    // assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    // const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);
    // const auth0 = new ManagementClient({
    //     domain: accountCredentials.Domain,
    //     clientId: accountCredentials.ClientID,
    //     clientSecret: accountCredentials.ClientSecret,
    // });
    // await auth0.deleteConnection({
    //     id: event.PhysicalResourceId,
    // });
}
