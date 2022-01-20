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

async function update(event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const SecretValueARN = event.ResourceProperties.SecretValueARN;

    const Key: string | undefined = event.ResourceProperties.Key;
    const Value: string | undefined = event.ResourceProperties.Value;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Key, "Key property missing");
    assert(SecretValueARN || Value, "Value and Secret Value properties missing. Specify one.");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    let value: string;
    if (Value) {
        value = Value;
    } else if (SecretValueARN) {
        const secretValueSecret = await sm.getSecretValue({
            SecretId: SecretValueARN,
        });
        assert(secretValueSecret.SecretString, "Secret Value secret string missing.");
        value = JSON.parse(secretValueSecret.SecretString).secret;
    } else {
        throw new Error("No value available!");
    }

    const auth0 = new ManagementClient({
        domain: accountCredentials.Domain,
        clientId: accountCredentials.ClientID,
        clientSecret: accountCredentials.ClientSecret,
    });
    await auth0.setRulesConfig(
        {
            key: Key,
        },
        {
            value,
        }
    );

    return {
        PhysicalResourceId: Key,
        Data: {},
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return update(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return update(event);
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

    const Key: string | undefined = event.ResourceProperties.Key;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Key, "Key property missing");

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
    await auth0.deleteRulesConfig({
        key: Key,
    });
}
