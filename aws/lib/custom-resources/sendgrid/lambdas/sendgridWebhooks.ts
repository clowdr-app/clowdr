import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import sendgrid from "@sendgrid/client";
import assert from "assert";
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
    existingKeyId: string | null,
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const VerificationKeyARN = event.ResourceProperties.VerificationKeyARN;

    const URL: string | undefined = event.ResourceProperties.URL;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(VerificationKeyARN, "Verification Key Credentials ARN property missing");
    assert(URL, "URL property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    sendgrid.setApiKey(accountCredentials.FullAccessAPIKey);

    {
        const data = {
            enabled: true,
            url: URL,
            group_resubscribe: false,
            delivered: true,
            group_unsubscribe: false,
            spam_report: false,
            bounce: true,
            deferred: true,
            unsubscribe: false,
            processed: true,
            open: false,
            click: false,
            dropped: true,
        };
        const [response] = await sendgrid.request({
            url: "/v3/user/webhooks/event/settings",
            method: "PATCH",
            headers: {},
            body: data,
        });
        if (response.statusCode !== 200) {
            throw new Error(
                `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(
                    response.body,
                    null,
                    2
                )}`
            );
        }
    }

    {
        const data = {
            enabled: true,
        };
        const [response, body] = await sendgrid.request({
            url: "/v3/user/webhooks/event/settings/signed",
            method: "PATCH",
            headers: {},
            body: data,
        });
        if (response.statusCode !== 200) {
            throw new Error(
                `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(
                    response.body,
                    null,
                    2
                )}`
            );
        }
        const public_key = body.public_key;

        await sm.putSecretValue({
            SecretId: VerificationKeyARN,
            SecretString: JSON.stringify({
                PublicKey: public_key,
            }),
        });
    }

    return {
        PhysicalResourceId: "webhook",
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

    sendgrid.setApiKey(accountCredentials.FullAccessAPIKey);

    {
        const [response] = await sendgrid.request({
            url: "/v3/user/webhooks/event/settings",
            method: "PATCH",
            headers: {},
            body: {
                enabled: false,
                url: "https://example.org",
                group_resubscribe: false,
                delivered: false,
                group_unsubscribe: false,
                spam_report: false,
                bounce: false,
                deferred: false,
                unsubscribe: false,
                processed: false,
                open: false,
                click: false,
                dropped: false,
            },
        });
        if (response.statusCode !== 200) {
            throw new Error(
                `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(
                    response.body,
                    null,
                    2
                )}`
            );
        }
    }

    {
        const [response] = await sendgrid.request({
            url: "/v3/user/webhooks/event/settings/signed",
            method: "PATCH",
            headers: {},
            body: {
                enabled: false,
            },
        });
        if (response.statusCode !== 200) {
            throw new Error(
                `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(
                    response.body,
                    null,
                    2
                )}`
            );
        }
    }
}
