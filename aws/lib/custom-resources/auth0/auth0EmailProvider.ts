import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0EmailProviderResourceProps {
    ManagementAPICredentials: sm.ISecret;

    SendGridAPISecret: sm.ISecret;
    DefaultFromAddress: string;
}

export class Auth0EmailProviderResource extends Construct {
    constructor(scope: Construct, id: string, props: Auth0EmailProviderResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0EmailProviderLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0EmailProvider.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0EmailProviderProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);
        props.SendGridAPISecret.grantRead(onEventHandler);

        new CustomResource(this, "Auth0EmailProviderResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                SendGridAPISecretARN: props.SendGridAPISecret.secretArn,
                DefaultFromAddress: props.DefaultFromAddress,
            },
            resourceType: "Custom::Auth0EmailProvider",
        });
    }
}
