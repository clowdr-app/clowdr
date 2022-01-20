import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0RuleParameterResourceProps {
    ManagementAPICredentials: sm.ISecret;

    Key: string;
    Value: sm.ISecret | string;
}

export class Auth0RuleParameterResource extends Construct {
    constructor(scope: Construct, id: string, props: Auth0RuleParameterResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0RuleParameterLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0RuleParameter.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0RuleParameterProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);
        if (!(typeof props.Value === "string")) {
            props.Value.grantRead(onEventHandler);
        }

        new CustomResource(this, "Auth0RuleParameterResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                Key: props.Key,
                SecretValueARN: typeof props.Value === "string" ? undefined : props.Value.secretArn,
                Value: typeof props.Value === "string" ? props.Value : undefined,
            },
            resourceType: "Custom::Auth0RuleParameter",
        });
    }
}
