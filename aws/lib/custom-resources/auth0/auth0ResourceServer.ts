import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface Auth0ResourceServerResourceProps {
    Name: string;
    ManagementAPICredentials: sm.ISecret;
}

export class Auth0ResourceServerResource extends Construct {
    public readonly auth0ResourceServerId: string;

    constructor(scope: Construct, id: string, props: Auth0ResourceServerResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "Auth0ResourceServerLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/auth0ResourceServer.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "Auth0ResourceServerProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.ManagementAPICredentials.grantRead(onEventHandler);

        const resource = new CustomResource(this, "Auth0ResourceServerResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: props.ManagementAPICredentials.secretArn,
                Name: props.Name,
            },
            resourceType: "Custom::Auth0ResourceServer",
        });

        this.auth0ResourceServerId = resource.getAttString("ClientId");
    }
}
