import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import { HttpMethods } from "@aws-cdk/aws-s3";
import * as sns from "@aws-cdk/aws-sns";
import * as subs from "@aws-cdk/aws-sns-subscriptions";
import * as cdk from "@aws-cdk/core";

export class AwsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create user account to be used by the actions service
        const user = new iam.User(this, "ActionsUser", {});

        user.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "AWSElementalMediaLiveFullAccess"
            )
        );
        user.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "AWSElementalMediaConvertFullAccess"
            )
        );

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: user.userName,
        });

        /* S3 */

        // Create S3 bucket for content items
        const bucket = new s3.Bucket(this, "ContentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        bucket.grantPut(user);
        bucket.grantReadWrite(user);
        bucket.addCorsRule({
            allowedMethods: [
                HttpMethods.GET,
                HttpMethods.PUT,
                HttpMethods.POST,
            ],
            allowedOrigins: ["*"],
            exposedHeaders: ["ETag"],
            maxAge: 3000,
            allowedHeaders: [
                "Authorization",
                "x-amz-date",
                "x-amz-content-sha256",
                "content-type",
            ],
        });
        bucket.addCorsRule({
            allowedHeaders: [],
            allowedMethods: [HttpMethods.GET],
            allowedOrigins: ["*"],
            exposedHeaders: [],
            maxAge: 3000,
        });

        /* Service Roles */

        // Create a role to be used by the MediaLive service when performing actions
        const mediaLiveAccessRole = new iam.Role(this, "MediaLiveRole", {
            assumedBy: new iam.ServicePrincipal("medialive.amazonaws.com"),
        });

        // Allow the actions user to pass the MediaLiveRole to MediaLive
        mediaLiveAccessRole.grantPassRole(user);
        bucket.grantReadWrite(mediaLiveAccessRole);

        mediaLiveAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "mediastore:ListContainers",
                    "mediastore:PutObject",
                    "mediastore:GetObject",
                    "mediastore:DeleteObject",
                    "mediastore:DescribeObject",
                ],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );
        mediaLiveAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups",
                ],
                resources: ["arn:aws:logs:*:*:*"],
                effect: iam.Effect.ALLOW,
            })
        );
        mediaLiveAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "mediaconnect:ManagedDescribeFlow",
                    "mediaconnect:ManagedAddOutput",
                    "mediaconnect:ManagedRemoveOutput",
                ],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );
        mediaLiveAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["mediapackage:DescribeChannel"],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );
        mediaLiveAccessRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "AmazonSSMReadOnlyAccess"
            )
        );

        // Create a role to be used by MediaConvert
        const mediaConvertAccessRole = new iam.Role(this, "MediaConvertRole", {
            assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
        });
        mediaConvertAccessRole.grantPassRole(user);
        bucket.grantReadWrite(mediaConvertAccessRole);

        mediaConvertAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["apigateway:*"],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );

        // Create a role to be used by Transcribe
        const transcribeAccessRole = new iam.Role(this, "TranscribeRole", {
            assumedBy: new iam.ServicePrincipal("transcribe.amazonaws.com"),
        });

        /* Notifications and webhooks */

        // Transcoding notifications
        const transcodeNotificationsTopic = new sns.Topic(
            this,
            "TranscodeNotifications"
        );
        transcodeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        transcodeNotificationsTopic.addSubscription(
            new subs.UrlSubscription(
                this.node.tryGetContext("clowdr/transcodeWebhookUrl")
            )
        );

        const transcodeEventBus = new events.EventBus(
            this,
            "TranscodeEventBus",
            {
                eventBusName: "TranscodeEvents",
            }
        );
        new events.CfnArchive(this, "TranscodeEventArchive", {
            sourceArn: transcodeEventBus.eventBusArn,
        });
        const transcodeEventRule = new events.Rule(this, "TranscodeEventRule", {
            enabled: true,
            eventBus: transcodeEventBus,
        });
        transcodeEventRule.addEventPattern({
            source: ["aws.mediaconvert"],
            detailType: ["MediaConvert Job State Change"],
        });
        transcodeEventRule.addTarget(
            new targets.SnsTopic(transcodeNotificationsTopic)
        );

        mediaConvertAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["events:PutEvents"],
                resources: [transcodeEventBus.eventBusArn],
                effect: iam.Effect.ALLOW,
            })
        );

        // Transcribe notifications
        const transcribeNotificationsTopic = new sns.Topic(
            this,
            "TranscribeNotifications"
        );
        transcribeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal(
                "transcribe.amazonaws.com"
            ),
        });
        transcribeNotificationsTopic.addSubscription(
            new subs.UrlSubscription(
                this.node.tryGetContext("clowdr/transcribeWebhookUrl")
            )
        );

        const transcribeEventBus = new events.EventBus(
            this,
            "TranscribeEventBus",
            {
                eventBusName: "TranscribeEvents",
            }
        );
        new events.CfnArchive(this, "TranscribeEventArchive", {
            sourceArn: transcribeEventBus.eventBusArn,
        });
        const transcribeEventRule = new events.Rule(
            this,
            "TranscribeEventRule",
            {
                enabled: true,
                eventBus: transcribeEventBus,
            }
        );
        transcribeEventRule.addEventPattern({
            source: ["aws.transcribe"],
            detailType: ["Transcribe Job State Change"],
        });
        transcribeEventRule.addTarget(
            new targets.SnsTopic(transcribeNotificationsTopic)
        );

        transcribeAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["events:PutEvents"],
                resources: [transcribeEventBus.eventBusArn],
                effect: iam.Effect.ALLOW,
            })
        );

        // Outputs
        new cdk.CfnOutput(this, "BucketId", {
            value: bucket.bucketName,
        });

        new cdk.CfnOutput(this, "AccessKeyId", {
            value: accessKey.ref,
        });

        new cdk.CfnOutput(this, "SecretAccessKey", {
            value: accessKey.attrSecretAccessKey,
        });

        new cdk.CfnOutput(this, "MediaLiveServiceRoleArn", {
            value: mediaLiveAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaConvertServiceRoleArn", {
            value: mediaConvertAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "TranscodeNotificationsTopic", {
            value: transcodeNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "TranscribeNotificationsTopic", {
            value: transcribeNotificationsTopic.topicArn,
        });
    }
}
