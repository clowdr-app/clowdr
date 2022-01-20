import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as s3 from "@aws-cdk/aws-s3";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0RuleTemplatesResourceProps {
    ManagementAPICredentials: sm.ISecret;

    TemplatesS3Bucket: s3.IBucket;
}

export class Auth0RuleTemplatesResource extends Construct {
    constructor(scope: Construct, id: string, props: Auth0RuleTemplatesResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0RuleTemplatesLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0RuleTemplates.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0RuleTemplatesProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);
        props.TemplatesS3Bucket.grantRead(onEventHandler);

        new CustomResource(this, "Auth0RuleTemplatesResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                TemplatesBucketName: props.TemplatesS3Bucket.bucketName,
                TemplatesPrefix: "rules/",
            },
            resourceType: "Custom::Auth0RuleTemplates",
        });
    }
}
