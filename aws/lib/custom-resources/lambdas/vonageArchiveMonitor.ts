import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import type {
    CdkCustomResourceEvent,
    CloudFormationCustomResourceCreateEvent,
    CloudFormationCustomResourceDeleteEvent,
    CloudFormationCustomResourceUpdateEvent,
    Context,
} from "aws-lambda";
import axios from "axios";
import { randomUUID } from "crypto";
import njwt from "njwt";

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

async function putCallbacks(event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent) {
    const ProjectCredentialsARN = event.ResourceProperties.ProjectCredentialsARN;
    const WebhookSecretARN = event.ResourceProperties.WebhookSecretARN;
    const MonitoringURL = event.ResourceProperties.MonitoringURL;

    assert(ProjectCredentialsARN, "Project Credentials ARN property missing");
    assert(WebhookSecretARN, "Webhook Secret ARN property missing");
    assert(MonitoringURL, "Monitoring URL property missing");

    const sm = new SecretsManager({});

    const projectCredentialsSecret = await sm.getSecretValue({
        SecretId: ProjectCredentialsARN,
    });
    assert(projectCredentialsSecret.SecretString, "Project credentials secret string missing.");
    const projectCredentials = JSON.parse(projectCredentialsSecret.SecretString);

    const webhookSecret = await sm.getSecretValue({
        SecretId: WebhookSecretARN,
    });
    assert(webhookSecret.SecretString, "Webhook secret string missing.");
    const webhookSecretValue = JSON.parse(webhookSecret.SecretString).secret;

    const claims = {
        iss: projectCredentials.ProjectAPIKey,
        ist: "project",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.ceil(180 + Date.now() / 1000),
        jti: randomUUID(),
    };
    const jwt = njwt.create(claims, projectCredentials.ProjectAPISecret, "HS256");

    async function createCallback(group: "archive", event: "status") {
        // This API call is completely undocumented and was reversed engineered by Ed on 2022-01-17 04:19 UTC.
        // Who knows how long it might or might not keep working for...
        const response = await axios.post(
            `https://api.opentok.com/v2/project/${projectCredentials.ProjectAPIKey}/callback`,
            {
                group,
                event,
                url: MonitoringURL + webhookSecretValue,
            },
            {
                responseType: "json",
                headers: {
                    "X-OPENTOK-AUTH": jwt.compact(),
                },
            }
        );
        if (response.status === 200) {
            return response.data.id;
        } else {
            throw new Error(`Vonage API returned an error status: ${response.status}`);
        }
    }

    try {
        const callback1 = await createCallback("archive", "status");

        return {
            PhysicalResourceId: callback1.toString(),
            Data: {
                Callback1Id: callback1,
            },
        };
    } catch (e: any) {
        if (e.toString().includes("status code 400")) {
            throw new Error(
                "Unable to configure Vonage archive monitoring callback. Status code 400. This usually means that Vonage tried to ping the callback url and found it couldn't reach it. It is sufficient to just run PacketRiot for the relevant domain."
            );
        }
        throw e;
    }
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return putCallbacks(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    // It is known by experiment by Ed on 2022-01-17 04:19 UTC, that putting new callbacks
    // for the same group and event will replace the existing callback.
    return putCallbacks(event);
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const ProjectCredentialsARN = event.ResourceProperties.ProjectCredentialsARN;

    assert(ProjectCredentialsARN, "Project Credentials ARN property missing");

    const sm = new SecretsManager({});
    const projectCredentialsSecret = await sm.getSecretValue({
        SecretId: ProjectCredentialsARN,
    });
    assert(projectCredentialsSecret.SecretString, "Project credentials secret string missing.");
    const projectCredentials = JSON.parse(projectCredentialsSecret.SecretString);

    const claims = {
        iss: projectCredentials.ProjectAPIKey,
        ist: "project",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.ceil(180 + Date.now() / 1000),
        jti: randomUUID(),
    };
    const jwt = njwt.create(claims, projectCredentials.ProjectAPISecret, "HS256");

    async function deleteCallback(callbackId: string) {
        // This API call is completely undocumented and was reversed engineered by Ed on 2022-01-17 04:19 UTC.
        // Who knows how long it might or might not keep working for...
        const response = await axios.delete(
            `https://api.opentok.com/v2/project/${projectCredentials.ProjectAPIKey}/callback/${callbackId}`,
            {
                responseType: "json",
                headers: {
                    "X-OPENTOK-AUTH": jwt.compact(),
                },
            }
        );
        if (response.status !== 204) {
            throw new Error(`Vonage API returned an error status: ${response.status}`);
        }
    }

    const callbackIds = event.PhysicalResourceId.split("-");
    await Promise.all(callbackIds.map((id) => deleteCallback(id)));
}
