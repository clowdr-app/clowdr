import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface SendGridAPIKeyResourceProps {
    AccountAPICredentials: sm.ISecret;

    Name: string;
    NewAPIKeyCredentials: sm.ISecret;
}

export class SendGridAPIKeyResource extends Construct {
    constructor(scope: Construct, id: string, props: SendGridAPIKeyResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "SendGridAPIKeyLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/sendgridAPIKey.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "SendGridAPIKeyProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.AccountAPICredentials.grantRead(onEventHandler);
        props.NewAPIKeyCredentials.grantWrite(onEventHandler);

        new CustomResource(this, "SendGridAPIKeyResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.AccountAPICredentials.secretArn,
                NewAPIKeyCredentialsARN: props.NewAPIKeyCredentials.secretArn,
                Name: props.Name,
            },
            resourceType: "Custom::SendGridAPIKey",
        });
    }
}
