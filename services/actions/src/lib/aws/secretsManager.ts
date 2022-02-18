import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import pMemoize from "p-memoize";
import { SecretsManager } from "./awsClient";

export const getImagesSecretValue: () => Promise<string> = pMemoize(
    async function requestImagesSecretValue() {
        assert(process.env.AWS_IMAGES_SECRET_ARN, "AWS_IMAGES_SECRET_ARN not provided.");
        const response = await SecretsManager.send(
            new GetSecretValueCommand({
                SecretId: process.env.AWS_IMAGES_SECRET_ARN,
            })
        );

        const secretValue = response.SecretString;
        assert(secretValue);

        const secretJson = JSON.parse(secretValue);

        assert(secretJson["secret"]);
        return secretJson["secret"];
    }
);
