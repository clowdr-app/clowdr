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
    const NewAPIKeyCredentialsARN = event.ResourceProperties.NewAPIKeyCredentialsARN;

    const Name: string | undefined = event.ResourceProperties.Name;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(NewAPIKeyCredentialsARN, "New API Key Credentials ARN property missing");
    assert(Name, "Name property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const scopes = ["mail.send"];

    sendgrid.setApiKey(accountCredentials.FullAccessAPIKey);
    if (!existingKeyId) {
        const data = {
            name: Name,
            scopes,
        };
        const [response, body] = await sendgrid.request({
            url: "/v3/api_keys",
            method: "POST",
            headers: {},
            body: data,
        });
        if (response.statusCode !== 201) {
            throw new Error(
                `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(
                    response.body,
                    null,
                    2
                )}`
            );
        }
        const newAPIKey: string = body.api_key;
        const newAPIKeyId: string = body.api_key_id;
        await sm.putSecretValue({
            SecretId: NewAPIKeyCredentialsARN,
            SecretString: JSON.stringify({
                APIKey: newAPIKey,
            }),
        });

        return {
            PhysicalResourceId: newAPIKeyId,
            Data: {},
        };
    } else {
        const data = {
            name: Name,
            scopes,
        };
        const [response] = await sendgrid.request({
            url: `/v3/api_keys/${existingKeyId}`,
            method: "PUT",
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

        return {
            PhysicalResourceId: existingKeyId,
            Data: {},
        };
    }
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return update(null, event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return update(event.PhysicalResourceId, event);
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const NewAPIKeyCredentialsARN = event.ResourceProperties.NewAPIKeyCredentialsARN;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(NewAPIKeyCredentialsARN, "New API Key Credentials ARN property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    sendgrid.setApiKey(accountCredentials.FullAccessAPIKey);
    const [response] = await sendgrid.request({
        url: `/v3/api_keys/${event.PhysicalResourceId}`,
        method: "DELETE",
        headers: {},
    });
    if (response.statusCode !== 204) {
        throw new Error(
            `SendGrid returned an error status code: ${response.statusCode}: ${JSON.stringify(response.body, null, 2)}`
        );
    }
}
