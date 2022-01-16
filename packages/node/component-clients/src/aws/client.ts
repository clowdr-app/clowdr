import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { SNS } from "@aws-sdk/client-sns";
import { SSM } from "@aws-sdk/client-ssm";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import type { CredentialProvider } from "@aws-sdk/types";
import assert from "assert";
import pMemoize from "p-memoize";
import type { P } from "pino";
import { fromEnv } from "./credentialProviders";

export interface AWSClient {
    serviceName: string;
    prefix: string;
    region: string;

    credentials: CredentialProvider;

    systemsManager: SSM;
    systemsManagers: Record<string, SSM>;
    sns: SNS;

    getAWSOptionalParameter: (name: string, ignoreMissing?: boolean, region?: string) => Promise<string | undefined>;
    getAWSParameter: (name: string, region?: string) => Promise<string>;
    getSecret: (secretName: string, secretKey?: string) => Promise<string>;
    getHostUrl: () => Promise<string>;
}

export function createAWSClient(serviceName: string, logger: P.Logger): AWSClient {
    const prefixEnvVarName = `AWS_${serviceName}_PREFIX`;
    const userAccessKeyIdEnvVarName = `AWS_${serviceName}_USER_ACCESS_KEY_ID`;
    const userSecretAccessKeyEnvVarName = `AWS_${serviceName}_USER_SECRET_ACCESS_KEY`;
    const regionEnvVarName = `AWS_${serviceName}_REGION`;

    const prefix = process.env[prefixEnvVarName];
    const accessKey = process.env[userAccessKeyIdEnvVarName];
    const accessSecret = process.env[userSecretAccessKeyEnvVarName];
    const region = process.env[regionEnvVarName];

    assert(prefix, `Missing ${prefixEnvVarName} environment variable`);
    assert(accessKey, `Missing ${userAccessKeyIdEnvVarName} environment variable`);
    assert(accessSecret, `Missing ${userSecretAccessKeyEnvVarName} environment variable`);
    assert(region, `Missing ${regionEnvVarName} environment variable`);

    const credentials = fromEnv({
        envKey: userAccessKeyIdEnvVarName,
        envSecret: userSecretAccessKeyEnvVarName,
    });

    const systemsManager = new SSM({
        credentials,
        region,
    });

    const systemsManagers = {
        [region]: systemsManager,
        "us-east-1": new SSM({
            credentials,
            region: "us-east-1",
        }),
    };

    const sns = new SNS({
        credentials,
        region,
    });

    const getAWSOptionalParameter = pMemoize(
        async (
            name: string,
            ignoreMissing: boolean | undefined = true,
            overrideRegion: string | undefined = region
        ): Promise<string | undefined> => {
            try {
                const param = await systemsManagers[overrideRegion].getParameter({
                    Name: name,
                });
                return param.Parameter?.Value;
            } catch (e: any) {
                if (ignoreMissing) {
                    return undefined;
                }

                logger.error(`Missing parameter ${name}`, { errorMessage: e.message ?? e.toString() });
                throw new Error(`Missing parameter ${name}`);
            }
        }
    );

    const getAWSParameter = pMemoize(
        async (name: string, overrideRegion: string | undefined = region): Promise<string> => {
            const param = await getAWSOptionalParameter(name, false, overrideRegion);
            assert(param?.length, `${name} parameter missing`);
            return param;
        }
    );

    const createSecretsManager = async () => {
        const accessRoleARN = await getAWSParameter(`/SecretsManager/AccessRoleARNs/${serviceName}_SERVICE`);

        return new SecretsManager({
            credentials: fromTemporaryCredentials({
                masterCredentials: credentials,
                params: {
                    RoleArn: accessRoleARN,
                    DurationSeconds: 3600,
                },
                clientConfig: {
                    region,
                },
            }),
            region,
        });
    };

    const getSecret = pMemoize(
        async (secretName: string, secretKey: string | undefined = "secret"): Promise<string> => {
            const sm = await createSecretsManager();
            const secret = await sm.getSecretValue({
                SecretId: secretName,
            });
            assert(secret.SecretString, "Secret string value not found!");
            const secretVal = JSON.parse(secret.SecretString);
            return secretVal[secretKey];
        }
    );

    async function getHostUrl(): Promise<string> {
        const HOST_DOMAIN = await getAWSParameter(`${serviceName}_HOST_DOMAIN`);
        const HOST_SECURE_PROTOCOLS = await getAWSParameter(`${serviceName}_HOST_SECURE_PROTOCOLS`);
        return `${HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http"}://${HOST_DOMAIN}`;
    }

    return {
        serviceName,
        prefix,
        region,
        credentials,
        systemsManager,
        systemsManagers,
        sns,
        getAWSOptionalParameter,
        getAWSParameter,
        getSecret,
        getHostUrl,
    };
}

export async function subscribeToSNSNotifications(
    client: AWSClient,
    logger: P.Logger,
    name: string,
    arnParameterName: string,
    pathName: string,
    isOptional = false,
    overrideRegion?: string,
    clientForSNS = client
): Promise<void> {
    const HOST_SECURE_PROTOCOLS = await client.getAWSParameter("ACTIONS_HOST_SECURE_PROTOCOLS");
    const hostUrl = await client.getHostUrl();
    const TOPIC_ARN = isOptional
        ? await client.getAWSOptionalParameter(arnParameterName, undefined, overrideRegion)
        : await client.getAWSParameter(arnParameterName, overrideRegion);

    if (TOPIC_ARN) {
        const notificationUrl = new URL(hostUrl);
        notificationUrl.pathname = pathName;

        logger.info(`Subscribing to SNS topic: ${name}`);
        const subscribeResult = await clientForSNS.sns.subscribe({
            Protocol: HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
            TopicArn: TOPIC_ARN,
            Endpoint: notificationUrl.toString(),
        });
        logger.info(`Subscribed to SNS topic: ${name}`);

        if (!subscribeResult.SubscriptionArn) {
            throw new Error(`Could not subscribe to ${name}`);
        }
    } else {
        logger.warn(`Not subscribing to SNS topic: ${name} (${arnParameterName} not set)`);
    }
}
