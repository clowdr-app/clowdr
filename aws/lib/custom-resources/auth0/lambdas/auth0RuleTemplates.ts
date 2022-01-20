import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
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
import path from "path";
import type { Readable } from "stream";

interface TemplateMetadata {
    enabled: true;
    script: string;
    name: string;
    order: number;
    stage: "login_success";
}

async function getObject(s3: S3Client, Bucket: string, Key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const getObjectCommand = new GetObjectCommand({ Bucket, Key });

        s3.send(getObjectCommand).then((response) => {
            try {
                // Store all of data chunks returned from the response data stream
                // into an array then use Array#join() to use the returned contents as a String
                const responseDataChunks: any[] = [];

                // Handle an error while streaming the response body
                (response.Body as Readable | undefined)?.once("error", (err: any) => reject(err));

                // Attach a 'data' listener to add the chunks of data to our array
                // Each chunk is a Buffer instance
                (response.Body as Readable | undefined)?.on("data", (chunk: any) => responseDataChunks.push(chunk));

                // Once the stream has no more data, join the chunks into a string and return the string
                (response.Body as Readable | undefined)?.once("end", () => resolve(responseDataChunks.join("")));
            } catch (err: any) {
                // Handle the error or throw
                return reject(err);
            }
        });
    });
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

async function sync(event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;
    const TemplatesBucketName = event.ResourceProperties.TemplatesBucketName;
    const TemplatesPrefix = event.ResourceProperties.TemplatesPrefix;

    assert(TemplatesBucketName, "Templates Bucket Name property missing.");
    assert(TemplatesPrefix, "Templates Prefix property missing.");

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

    const s3 = new S3Client({});
    const templateObjects = await s3.send(
        new ListObjectsV2Command({
            Bucket: TemplatesBucketName,
            Prefix: TemplatesPrefix,
        })
    );
    console.info("Template objects", templateObjects);

    const existingRules = await auth0.getRules();

    const templateMetadataObjects = templateObjects.Contents?.filter((x) => x.Key?.endsWith(".json")) ?? [];
    const ruleIds: string[] = [];
    for (const templateMetadataObject of templateMetadataObjects) {
        const templateMetadataObjectKey = templateMetadataObject.Key as string;
        const templateMetadataContents = await getObject(s3, TemplatesBucketName, templateMetadataObjectKey);
        console.info(`${templateMetadataObjectKey} template metadata`, templateMetadataContents);
        const templateMetadata: TemplateMetadata = JSON.parse(templateMetadataContents);

        templateMetadata.script = await getObject(
            s3,
            TemplatesBucketName,
            path.posix.join(path.posix.dirname(templateMetadataObjectKey), templateMetadata.script)
        );
        console.info(`${templateMetadataObjectKey} template script`, templateMetadata.script);

        const existingRule = existingRules.find((x) => x.name === templateMetadata.name);
        if (existingRule) {
            const newRule = await auth0.updateRule(
                {
                    id: existingRule.id,
                } as any,
                templateMetadata
            );
            if (newRule.id) {
                ruleIds.push(newRule.id);
            }
        } else {
            const newRule = await auth0.createRule(templateMetadata);
            if (newRule.id) {
                ruleIds.push(newRule.id);
            }
        }
    }

    return {
        PhysicalResourceId: ruleIds.join(";"),
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return sync(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return sync(event);
}

async function onDelete(event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

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
    const ids = event.PhysicalResourceId.split(";");
    for (const id of ids) {
        try {
            await auth0.deleteRule({
                id,
            });
        } catch (e: any) {
            if (!e.toString().toLowerCase().includes("not found")) {
                throw e;
            }
        }
    }

    return;
}
