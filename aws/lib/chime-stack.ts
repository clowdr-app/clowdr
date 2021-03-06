import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as sns from "@aws-cdk/aws-sns";
import * as cdk from "@aws-cdk/core";

export interface ChimeStackProps extends cdk.StackProps {
    stackPrefix: string;
}

export class ChimeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ChimeStackProps) {
        super(scope, id, props);

        const chimeActionsUser = new iam.User(this, "ChimeActionsUser", {});

        // Chime notifications
        const chimeNotificationsTopic = new sns.Topic(this, "ChimeNotifications", {});
        chimeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("chime.amazonaws.com"),
        });
        chimeNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(chimeActionsUser.userArn)],
                resources: [chimeNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("chime.amazonaws.com"));
        const chimeEventRule = new events.Rule(this, "ChimeEventRule", {
            enabled: true,
        });
        chimeEventRule.addEventPattern({
            source: ["aws.chime"],
            detailType: ["Chime Meeting State Change"],
        });
        chimeEventRule.addTarget(new targets.SnsTopic(chimeNotificationsTopic));

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: chimeActionsUser.userName,
        });

        new cdk.CfnOutput(this, "ChimeActionsUserAccessKeyId", {
            value: accessKey.ref,
        });

        new cdk.CfnOutput(this, "ChimeActionsUserSecretAccessKey", {
            value: accessKey.attrSecretAccessKey,
        });

        new cdk.CfnOutput(this, "ChimeNotificationsTopic", {
            value: chimeNotificationsTopic.topicArn,
        });
    }
}
