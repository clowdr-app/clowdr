import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";

export interface VonageProjectResourceProps {
    Name: string;
}

export class VonageProjectResource extends Construct {
    public readonly vonageProjectId: string;
    public readonly projectAPICredentials: sm.Secret;

    constructor(scope: Construct, id: string, props: VonageProjectResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "VonageProjectLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/vonageProject.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "VonageProjectProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        const accountAPICredentials = sm.Secret.fromSecretNameV2(
            this,
            "VonageAccountAPICredentials",
            "VonageAccountAPICredentials"
        );
        accountAPICredentials.grantRead(onEventHandler);

        this.projectAPICredentials = new sm.Secret(this, "VonageProjectAPICredentials", {
            secretName: "/VonageProject/ProjectAPICredentials",
        });
        this.projectAPICredentials.grantRead(onEventHandler);
        this.projectAPICredentials.grantWrite(onEventHandler);

        const resource = new CustomResource(this, "VonageProjectResource", {
            serviceToken: provider.serviceToken,
            properties: {
                AccountCredentialsARN: accountAPICredentials.secretArn,
                ProjectCredentialsARN: this.projectAPICredentials.secretArn,
                Name: props.Name,
            },
            resourceType: "Custom::Vonage::Project",
        });

        this.vonageProjectId = resource.getAttString("ProjectId");
    }
}
