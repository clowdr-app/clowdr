import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0ClientResourceProps {
    Name: string;
    ManagementAPICredentials: sm.ISecret;
    FrontendHosts: string[];
}

export class Auth0ClientResource extends Construct {
    public readonly auth0ClientId: string;
    public readonly auth0ClientAPICredentials: sm.Secret;

    constructor(scope: Construct, id: string, props: Auth0ClientResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0ClientLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0Client.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0ClientProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);

        this.auth0ClientAPICredentials = new sm.Secret(this, "Auth0ClientAPICredentials", {
            secretName: "/Auth0Client/ClientAPICredentials",
        });
        this.auth0ClientAPICredentials.grantRead(onEventHandler);
        this.auth0ClientAPICredentials.grantWrite(onEventHandler);

        const resource = new CustomResource(this, "Auth0ClientResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                Auth0ClientCredentialsARN: this.auth0ClientAPICredentials.secretArn,
                Name: props.Name,
                AllowedLogoutUrls: props.FrontendHosts.flatMap((host) => [
                    `${host}/auth0/email-verification`,
                    `${host}/auth0/email-verification/result`,
                    `${host}/auth0/logged-out`,
                ]),
                Callbacks: props.FrontendHosts.flatMap((host) => [
                    `${host}/auth0/email-verification`,
                    `${host}/auth0/email-verification/result`,
                    `${host}/auth0/logged-in`,
                ]),
                AllowedOrigins: props.FrontendHosts,
                WebOrigins: props.FrontendHosts,
            },
            resourceType: "Custom::Auth0Client",
        });

        this.auth0ClientId = resource.getAttString("ClientId");
    }
}
