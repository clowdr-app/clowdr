import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0TenantResourceProps {
    ManagementAPICredentials: sm.ISecret;

    Name: string;
    EnabledLocales: string[];
    PictureURL: string;
    SupportEmail: string;
    SupportURL: string;
    UniversalLoginTheme: {
        colors: {
            page_background: string;
            primary: string;
        };
    };
    EnableCustomDomain: boolean;
}

export class Auth0TenantResource extends Construct {
    constructor(scope: Construct, id: string, props: Auth0TenantResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0TenantLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0Tenant.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0TenantProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);

        new CustomResource(this, "Auth0TenantResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                Name: props.Name,
                EnabledLocales: props.EnabledLocales,
                PictureURL: props.PictureURL,
                SupportEmail: props.SupportEmail,
                SupportURL: props.SupportURL,
                UniversalLoginTheme: props.UniversalLoginTheme,
                EnableCustomDomain: props.EnableCustomDomain,
            },
            resourceType: "Custom::Auth0Tenant",
        });
    }
}
