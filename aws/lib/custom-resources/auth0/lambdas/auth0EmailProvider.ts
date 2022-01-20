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
    const SendGridAPISecretARN = event.ResourceProperties.SendGridAPISecretARN;
    const DefaultFromAddress: string | undefined = event.ResourceProperties.DefaultFromAddress;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(SendGridAPISecretARN, "SendGrid API Secret ARN property missing");
    assert(DefaultFromAddress, "Default From Address property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const apiSecretSecret = await sm.getSecretValue({
        SecretId: SendGridAPISecretARN,
    });
    assert(apiSecretSecret.SecretString, "SendGrid API Secret secret string missing.");
    const apiSecretBlob = JSON.parse(apiSecretSecret.SecretString);
    const apiSecret = apiSecretBlob.APIKey ?? apiSecretBlob.FullAccessAPIKey;

    const auth0 = new ManagementClient({
        domain: accountCredentials.Domain,
        clientId: accountCredentials.ClientID,
        clientSecret: accountCredentials.ClientSecret,
    });
    try {
        await auth0.configureEmailProvider({
            name: "sendgrid",
            enabled: true,
            default_from_address: DefaultFromAddress,
            credentials: {
                api_key: apiSecret,
            },
        });
    } catch (e: any) {
        if (e.toString().includes("An email provider is already configured: sendgrid")) {
            await auth0.updateEmailProvider(
                {},
                {
                    name: "sendgrid",
                    enabled: true,
                    default_from_address: DefaultFromAddress,
                    credentials: {
                        api_key: apiSecret,
                    },
                }
            );
        } else {
            throw e;
        }
    }

    return {
        PhysicalResourceId: "sendgrid",
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
    await auth0.deleteEmailProvider();
}
