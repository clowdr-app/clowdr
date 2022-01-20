import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0DatabaseConnectionResourceProps {
    ManagementAPICredentials: sm.ISecret;

    Name: string;
    EnabledClients: string[];
}

export class Auth0DatabaseConnectionResource extends Construct {
    constructor(scope: Construct, id: string, props: Auth0DatabaseConnectionResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0DatabaseConnectionLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0DatabaseConnection.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0DatabaseConnectionProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);

        new CustomResource(this, "Auth0DatabaseConnectionResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                Name: props.Name,
                EnabledClients: props.EnabledClients,
            },
            resourceType: "Custom::Auth0DatabaseConnection",
        });
    }
}
