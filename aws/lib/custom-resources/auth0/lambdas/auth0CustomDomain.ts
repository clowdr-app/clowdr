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

async function update(
    existingId: string | null,
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    if (existingId) {
        return {
            PhysicalResourceId: existingId,
            Data: {},
        };
    }

    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const Domain: string | undefined = event.ResourceProperties.Domain;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Domain, "Domain property missing");

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
    const customDomainId = (
        await auth0.createCustomDomain({
            domain: Domain,
            type: "auth0_managed_certs",
            verification_method: "txt",
        })
    ).custom_domain_id;

    return {
        PhysicalResourceId: customDomainId,
        Data: {},
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return update(null, event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return update(event.PhysicalResourceId, event);
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
    await auth0.deleteCustomDomain({ id: event.PhysicalResourceId });
}
