import * as iam from "@aws-cdk/aws-iam";
import type * as s3 from "@aws-cdk/aws-s3";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as cdk from "@aws-cdk/core";
import { VonageArchiveMonitorResource } from "../custom-resources/vonage/vonageArchiveMonitor";
import { VonageArchiveToS3Resource } from "../custom-resources/vonage/vonageArchiveToS3";
import { VonageProjectResource } from "../custom-resources/vonage/vonageProject";
import { VonageSessionMonitorResource } from "../custom-resources/vonage/vonageSessionMonitor";
import type { Env } from "../env";

export interface VonageStackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;
    bucket: s3.Bucket;
}

export class VonageStack extends cdk.Stack {
    public webhookSecret: sm.Secret;

    constructor(scope: cdk.Construct, id: string, props: VonageStackProps) {
        super(scope, id, props);

        this.webhookSecret = new sm.Secret(this, "VonageWebhookSecret", {
            secretName: "VonageWebhookSecret",
            description: "Secret for the Vonage webhook",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });

        const project = new VonageProjectResource(this, "VonageProject", {
            Name: `midspace-${props.stackPrefix}`,
        });

        new VonageSessionMonitorResource(this, "VonageSessionMonitor", {
            VonageProject: project,
            WebhookSecret: this.webhookSecret,
            MonitoringURL: `${props.vars.ACTIONS_HOST_SECURE_PROTOCOLS ? "https" : "http"}://${
                props.vars.ACTIONS_HOST_DOMAIN
            }/vonage/sessionMonitoring/`,
        });

        new VonageArchiveMonitorResource(this, "VonageArchiveMonitor", {
            VonageProject: project,
            WebhookSecret: this.webhookSecret,
            MonitoringURL: `${props.vars.ACTIONS_HOST_SECURE_PROTOCOLS ? "https" : "http"}://${
                props.vars.ACTIONS_HOST_DOMAIN
            }/vonage/archiveMonitoring/`,
        });

        const vonageUser = new iam.User(this, "VonageUser", {});
        const vonageUserAccessKey = new iam.CfnAccessKey(this, "VonageUserAccessKey", {
            userName: vonageUser.userName,
        });

        props.bucket.grantPut(vonageUser, `${project.vonageProjectId}/*`);
        props.bucket.grantRead(vonageUser, `${project.vonageProjectId}/*`);

        new VonageArchiveToS3Resource(this, "VonageArchiveToS3", {
            VonageProject: project,
            AccessKey: vonageUserAccessKey,
            Bucket: props.bucket,
        });

        this.createOutput("VonageUserAccessKeyId", vonageUserAccessKey.ref);
        this.createOutput("VonageUserSecretAccessKey", vonageUserAccessKey.attrSecretAccessKey);
    }

    private createOutput(id: string, value: string): void {
        new cdk.CfnOutput(this, id, {
            value,
        });
    }
}
