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

async function putConfiguration(
    event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent
) {
    const ProjectCredentialsARN = event.ResourceProperties.ProjectCredentialsARN;
    const AccessKey = event.ResourceProperties.AccessKey;
    const SecretKey = event.ResourceProperties.SecretKey;
    const BucketName = event.ResourceProperties.BucketName;

    assert(ProjectCredentialsARN, "Project Credentials ARN property missing");
    assert(AccessKey, "Access Key property missing");
    assert(SecretKey, "Secret Key property missing");
    assert(BucketName, "Bucket property missing");

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

    const response = await axios.put(
        `https://api.opentok.com/v2/project/${projectCredentials.ProjectAPIKey}/archive/storage`,
        {
            type: "s3",
            config: {
                accessKey: AccessKey,
                secretKey: SecretKey,
                bucket: BucketName,
            },
            fallback: "none",
        },
        {
            responseType: "json",
            headers: {
                "X-OPENTOK-AUTH": jwt.compact(),
            },
        }
    );
    if (response.status === 200) {
        return { PhysicalResourceId: response.data.config.bucket };
    } else {
        throw new Error(`Vonage API returned an error status: ${response.status}`);
    }
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return putConfiguration(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return putConfiguration(event);
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

    const response = await axios.delete(
        `https://api.opentok.com/v2/project/${projectCredentials.ProjectAPIKey}/archive/storage`,
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
