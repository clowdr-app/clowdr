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

interface VonageProjectDetails {
    id: string;
    secret: string;
    status: "ACTIVE" | "SUSPENDED";
    name: string;
    environment: "standard" | "enterprise";
    createdAt: number;
}

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

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const ProjectCredentialsARN = event.ResourceProperties.ProjectCredentialsARN;
    const Name = event.ResourceProperties.Name;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(ProjectCredentialsARN, "Project Credentials ARN property missing");
    assert(Name, "Name property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const claims = {
        iss: accountCredentials.AccountAPIKey,
        ist: "account",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.ceil(180 + Date.now() / 1000),
        jti: randomUUID(),
    };
    const jwt = njwt.create(claims, accountCredentials.AccountAPISecret, "HS256");
    const response = await axios.post(
        "https://api.opentok.com/v2/project",
        {
            name: Name,
        },
        {
            responseType: "json",
            headers: {
                "X-OPENTOK-AUTH": jwt.compact(),
            },
        }
    );
    if (response.status === 200) {
        const result: VonageProjectDetails = response.data;

        await sm.putSecretValue({
            SecretId: ProjectCredentialsARN,
            SecretString: JSON.stringify({
                ProjectAPIKey: result.id,
                ProjectAPISecret: result.secret,
            }),
        });

        return {
            PhysicalResourceId: result.id,
            Data: {
                ProjectId: result.id,
            },
        };
    } else {
        throw new Error(`Vonage API returned an error status: ${response.status}`);
    }
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    throw new Error(
        `Updating a Vonage Project resource is not possible. Ensure a delete and re-create is performed. Physical resource id: ${event.PhysicalResourceId}`
    );
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const PhysicalResourceId = event.PhysicalResourceId;

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(PhysicalResourceId, "Physical Resource ID property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const claims = {
        iss: accountCredentials.AccountAPIKey,
        ist: "account",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.ceil(180 + Date.now() / 1000),
        jti: randomUUID(),
    };
    const jwt = njwt.create(claims, accountCredentials.AccountAPISecret, "HS256");
    const response = await axios.delete(`https://api.opentok.com/v2/project/${PhysicalResourceId}`, {
        responseType: "json",
        headers: {
            "X-OPENTOK-AUTH": jwt.compact(),
        },
    });
    if (response.status !== 204) {
        throw new Error(`Vonage API returned an error status: ${response.status}`);
    }
}
