import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as sm from "@aws-cdk/aws-secretsmanager";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";
import type { VonageProjectResource } from "./vonageProject";

export interface VonageArchiveMonitorResourceProps {
    VonageProject: VonageProjectResource;
    WebhookSecret: sm.Secret;
    /** The webhook secret will be automatically appended */
    MonitoringURL: string;
}

export class VonageArchiveMonitorResource extends Construct {
    constructor(scope: Construct, id: string, props: VonageArchiveMonitorResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "VonageArchiveMonitorLambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/vonageArchiveMonitor.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "VonageArchiveMonitorProvider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.VonageProject.projectAPICredentials.grantRead(onEventHandler);
        props.WebhookSecret.grantRead(onEventHandler);

        // In order for initialization to work the callback url(s) need to be
        // available because Vonage is going to ping them to check they work (a
        // rather annoying thing for it to do really...)
        //
        // Anyway, as a result, we run PacketRiot in the background during CDK
        // deployment. Strangely, PacketRiot responds with a 200 response even
        // if there is no service running on the target port. This makes running
        // PacketRiot both a sufficient and a convenient solution.
        new CustomResource(this, "VonageArchiveMonitorResource", {
            serviceToken: provider.serviceToken,
            properties: {
                ProjectCredentialsARN: props.VonageProject.projectAPICredentials.secretArn,
                WebhookSecretARN: props.WebhookSecret.secretArn,
                MonitoringURL: props.MonitoringURL,
            },
            resourceType: "Custom::Vonage::ArchiveMonitor",
        });
    }
}
