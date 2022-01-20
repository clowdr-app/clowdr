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
import crypto from "crypto";
import path from "path";
import type { Readable } from "stream";

type TemplateMetadata = {
    name: string;
    enabled: boolean;
} & (
    | {
          url: string;
      }
    | {
          html: string;
      }
);

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
    const Auth0ClientId = event.ResourceProperties.Auth0ClientId;

    assert(TemplatesBucketName, "Templates Bucket Name property missing.");
    assert(TemplatesPrefix, "Templates Prefix property missing.");
    assert(Auth0ClientId, "Auth0 Client Id property missing.");

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

    const templateMetadataObjects = templateObjects.Contents?.filter((x) => x.Key?.endsWith(".json")) ?? [];
    const contentsHash = crypto.createHash("SHA256");
    const updatedTenantProperties = {
        error_page: {
            html: "",
            show_log_link: false,
            url: "",
        },
        change_password: {
            enabled: false,
            html: "",
        },
    };
    const updatedClientProperties = {
        custom_login_page_on: false,
        custom_login_page: "",
    };
    for (const templateMetadataObject of templateMetadataObjects) {
        const templateMetadataObjectKey = templateMetadataObject.Key as string;
        const templateMetadataContents = await getObject(s3, TemplatesBucketName, templateMetadataObjectKey);
        console.info(`${templateMetadataObjectKey} template metadata`, templateMetadataContents);
        const templateMetadata: TemplateMetadata = JSON.parse(templateMetadataContents);
        contentsHash.update(JSON.stringify(templateMetadata));

        if (templateMetadata.enabled) {
            if ("html" in templateMetadata) {
                templateMetadata.html = await getObject(
                    s3,
                    TemplatesBucketName,
                    path.posix.join(path.posix.dirname(templateMetadataObjectKey), templateMetadata.html)
                );

                console.info(`${templateMetadataObjectKey} template body`, templateMetadata.html);
                contentsHash.update(templateMetadata.html);
            }

            if (templateMetadataObjectKey === "login" && "html" in templateMetadata) {
                updatedClientProperties.custom_login_page = templateMetadata.html;
                updatedClientProperties.custom_login_page_on = true;
            } else if (templateMetadataObjectKey === "error_page") {
                if ("html" in templateMetadata) {
                    updatedTenantProperties.error_page.html = templateMetadata.html;
                }

                if ("url" in templateMetadata) {
                    updatedTenantProperties.error_page.url = templateMetadata.url;
                }
            } else if (templateMetadataObjectKey === "password_reset") {
                if ("html" in templateMetadata) {
                    updatedTenantProperties.change_password.html = templateMetadata.html;
                    updatedTenantProperties.change_password.enabled = true;
                }
            }
        }
    }
    await auth0.updateClient(
        {
            client_id: Auth0ClientId,
        },
        updatedClientProperties
    );
    await auth0.updateTenantSettings(updatedTenantProperties);

    return {
        PhysicalResourceId: contentsHash.digest().toString("base64"),
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return sync(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return sync(event);
}

async function onDelete(_event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    return;
}
