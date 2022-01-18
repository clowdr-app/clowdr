/**
 * One might reasonably ask:
 *      Why can't this be done by the CDK Bootstrap by extending the template?
 *
 * Unfortunately, CDK bootstrap itself uses CloudFormation. Any values passed
 * in will recorded in plaintext in the CloudFormation service and logs. This
 * means it is not possible to use CDK Bootstrap to initialize sensitive
 * values into AWS Secrets Manager.
 *
 * Hence, this little initialization script.
 */

import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import prompt from "prompt";

const noUpdateCheck = process.argv.some((x) => x === "--no-update-check");

async function initializeCredentials(
    sm: SecretsManager,
    serviceName: string,
    serviceCredentialsUrl: string,
    serviceRequired: boolean,
    credentialsName: string,
    keys: string[]
) {
    console.info();
    console.info(`${serviceName} (${serviceRequired ? "required" : "optional"}):`);
    console.info(`    ${serviceCredentialsUrl}`);

    const secretName = `${credentialsName}APICredentials`;
    const existing = await sm.listSecrets({
        Filters: [
            {
                Key: "name",
                Values: [secretName],
            },
        ],
        MaxResults: 1,
    });

    let requiresUpdate = serviceRequired;
    if (existing.SecretList?.length) {
        const existingSecret = existing.SecretList[0];
        if (existingSecret.ARN) {
            const existingSecretValue = await sm.getSecretValue({
                SecretId: existingSecret.ARN,
            });
            const existingSecretData = existingSecretValue.SecretString && JSON.parse(existingSecretValue.SecretString);
            if (existingSecretData) {
                let allFound = true;

                console.log("    Existing credentials:");
                const maxKeyNameLength = keys.reduce((acc, x) => Math.max(acc, x.length), 0);
                for (const key of keys) {
                    if (!(key in existingSecretData)) {
                        allFound = false;
                        console.log(`        ${key.padEnd(maxKeyNameLength)} : [Missing]`);
                    } else {
                        console.log(`        ${key.padEnd(maxKeyNameLength)} : ${existingSecretData[key]}`);
                    }
                }

                for (const key in existingSecretData) {
                    if (!keys.includes(key)) {
                        console.log(
                            `        ${key.padEnd(maxKeyNameLength)} [Unexpected] : ${existingSecretData[key]}`
                        );
                    }
                }

                if (allFound) {
                    console.info("    All credential keys present.");
                    requiresUpdate = false;
                } else {
                    console.info("    One or more credential keys are missing.");
                }
            } else {
                console.info("    Existing credentials found but secret value is not available.");
            }
        } else {
            throw new Error(`Unable to obtain ARN of existing secret: ${secretName}.`);
        }
    }

    if (!requiresUpdate) {
        if (!noUpdateCheck) {
            const result = await prompt.get<Record<string, string>>([
                {
                    properties: {
                        answer: {
                            pattern: /^y|n$/i,
                            required: true,
                            description: "Would you like to provide these credentials? y/N",
                            default: "n",
                        },
                    },
                },
            ]);
            requiresUpdate = result.answer.toLowerCase() === "y";
        }
    } else {
        console.info("    Please provide these credentials.");
    }

    if (requiresUpdate) {
        const properties: prompt.RevalidatorSchema[] = [];
        for (const key of keys) {
            properties.push({
                name: key,
                required: true,
                minLength: 1,
            });
        }
        const result = await prompt.get<Record<string, string>>(properties);
        const secretData: Record<string, string> = {};
        for (const key of keys) {
            secretData[key] = result[key];
        }

        if (!existing.SecretList?.length) {
            await sm.createSecret({
                Name: secretName,
                SecretString: JSON.stringify(secretData),
                Description: `Management API credentials for ${serviceName} obtained from ${serviceCredentialsUrl}.`,
            });
        } else {
            await sm.putSecretValue({
                SecretId: secretName,
                SecretString: JSON.stringify(secretData),
            });
        }
    } else {
        console.info("    Skipping update.");
    }
}

async function main() {
    prompt.message = "";
    prompt.colors = false;
    prompt.start();

    console.log("AWS_PROFILE", process.env.AWS_PROFILE);

    const sm = new SecretsManager({});

    await initializeCredentials(sm, "Auth0", "https://manage.auth0.com/dashboard", true, "Auth0Management", [
        "Domain",
        "ClientID",
        "ClientSecret",
    ]);

    await initializeCredentials(
        sm,
        "DataDog",
        "https://app.datadoghq.eu/organization-settings/api-keys",
        false,
        "DataDog",
        ["APIKeyID", "APIKeySecret", "ApplicationKeyID", "ApplicationKeySecret"]
    );

    await initializeCredentials(
        sm,
        "Google Cloud",
        "https://console.cloud.google.com/apis/credentials",
        false,
        "GoogleCloudWebApplication",
        ["ClientID", "ClientSecret"]
    );

    await initializeCredentials(
        sm,
        "Hasura Cloud",
        "https://cloud.hasura.io/account-settings/access-tokens",
        false,
        "HasuraAccount",
        ["PersonalAccessToken"]
    );

    await initializeCredentials(sm, "Heroku", "https://dashboard.heroku.com/account", false, "HerokuAccount", [
        "APIKey",
    ]);

    await initializeCredentials(sm, "Netlify", "https://app.netlify.com/user/applications", false, "NetlifyAccount", [
        "PersonalAccessToken",
    ]);

    await initializeCredentials(
        sm,
        "SendGrid",
        "https://app.sendgrid.com/settings/api_keys",
        false,
        "SendGridAccount",
        ["FullAccessAPIKey"]
    );

    await initializeCredentials(sm, "Vonage", "https://tokbox.com/account/#/settings", true, "VonageAccount", [
        "AccountAPIKey",
        "AccountAPISecret",
    ]);
}

main();
