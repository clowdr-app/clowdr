import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface SendGridWebhooksResourceProps {
    AccountAPICredentials: sm.ISecret;

    URL: string;
}

export class SendGridWebhooksResource extends Construct {
    public readonly VerificationKey: sm.ISecret;

    constructor(scope: Construct, id: string, props: SendGridWebhooksResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "SendGridWebhooksLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/sendgridWebhooks.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "SendGridWebhooksProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.AccountAPICredentials.grantRead(onEventHandler);

        this.VerificationKey = new sm.Secret(this, "VerificationKey", {
            secretName: "SENDGRID_WEBHOOK_PUBLIC_KEY",
            secretStringBeta1: sm.SecretStringValueBeta1.fromUnsafePlaintext("Uninitialized"),
        });
        this.VerificationKey.grantWrite(onEventHandler);

        new CustomResource(this, "SendGridWebhooksResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.AccountAPICredentials.secretArn,
                VerificationKeyARN: this.VerificationKey.secretArn,
                URL: props.URL,
            },
            resourceType: "Custom::SendGridWebhooks",
        });
    }
}
