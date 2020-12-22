import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";
import * as s3 from "@aws-cdk/aws-s3";
import { HttpMethods } from "@aws-cdk/aws-s3";
import * as sns from "@aws-cdk/aws-sns";
import * as cdk from "@aws-cdk/core";

export class AwsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create user account to be used by the actions service
        const user = new iam.User(this, "ActionsUser", {});

        user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaLiveFullAccess"));
        user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaConvertFullAccess"));
        user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticTranscoder_FullAccess"));
        user.addToPolicy(
            new iam.PolicyStatement({
                actions: ["transcribe:*"],
                effect: iam.Effect.ALLOW,
                resources: ["*"],
            })
        );

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: user.userName,
        });

        /* S3 */

        // Create S3 bucket for content items
        const bucket = new s3.Bucket(this, "ContentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            },
        });

        bucket.grantPut(user);
        bucket.grantReadWrite(user);
        bucket.grantPublicAccess();
        bucket.addCorsRule({
            allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
            allowedOrigins: ["*"],
            exposedHeaders: ["ETag"],
            maxAge: 3000,
            allowedHeaders: ["Authorization", "x-amz-date", "x-amz-content-sha256", "content-type"],
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
        mediaLiveAccessRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));

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
        transcribeAccessRole.grantPassRole(user);
        bucket.grantReadWrite(transcribeAccessRole);

        /* Notifications and webhooks */

        // Transcoding notifications
        const transcodeNotificationsTopic = new sns.Topic(this, "TranscodeNotifications");
        transcodeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ArnPrincipal(mediaConvertAccessRole.roleArn),
        });
        transcodeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        transcodeNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: [
                    "SNS:Subscribe",
                    "SNS:ListSubscriptionsByTopic",
                    "SNS:DeleteTopic",
                    "SNS:GetTopicAttributes",
                    "SNS:Publish",
                    "SNS:RemovePermission",
                    "SNS:AddPermission",
                    "SNS:Receive",
                    "SNS:SetTopicAttributes",
                ],
                principals: [
                    new iam.ServicePrincipal("events.amazonaws.com"),
                    new iam.ArnPrincipal(mediaConvertAccessRole.roleArn),
                ],
                resources: [transcodeNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );
        transcodeNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(user.userArn)],
                resources: [transcodeNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        events.EventBus.grantPutEvents(new iam.ServicePrincipal("mediaconvert.amazonaws.com"));
        const transcodeEventRule = new events.Rule(this, "TranscodeEventRule", {
            enabled: true,
        });
        transcodeEventRule.addEventPattern({
            source: ["aws.mediaconvert"],
            detailType: ["MediaConvert Job State Change"],
        });
        transcodeEventRule.addTarget(new targets.SnsTopic(transcodeNotificationsTopic));

        const transcodeLogGroup = new logs.LogGroup(this, "TranscodeLogGroup", {});
        transcodeEventRule.addTarget(new targets.CloudWatchLogGroup(transcodeLogGroup));

        // Transcribe notifications
        const transcribeNotificationsTopic = new sns.Topic(this, "TranscribeNotifications");
        transcribeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("transcribe.amazonaws.com"),
        });
        transcribeNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(user.userArn)],
                resources: [transcribeNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        const transcribeEventRule = new events.Rule(this, "TranscribeEventRule", {
            enabled: true,
        });
        transcribeEventRule.addEventPattern({
            source: ["aws.transcribe"],
            detailType: ["Transcribe Job State Change"],
        });
        transcribeEventRule.addTarget(new targets.SnsTopic(transcribeNotificationsTopic));
        const transcribeLogGroup = new logs.LogGroup(this, "TranscribeLogGroup", {});
        transcribeEventRule.addTarget(new targets.CloudWatchLogGroup(transcribeLogGroup));

        /* Elastic Transcoder */
        const elasticTranscoderServiceRole = new iam.Role(this, "ElasticTranscoderServiceRole", {
            assumedBy: new iam.ServicePrincipal("elastictranscoder.amazonaws.com"),
        });
        elasticTranscoderServiceRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:Put*", "s3:ListBucket", "s3:*MultipartUpload*", "s3:Get*"],
                effect: iam.Effect.ALLOW,
                resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
            })
        );
        transcodeNotificationsTopic.grantPublish(elasticTranscoderServiceRole);
        elasticTranscoderServiceRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:*Delete*", "s3:*Policy*", "sns:*Remove*", "sns:*Delete*", "sns:*Permission*"],
                effect: iam.Effect.DENY,
                resources: ["*"],
            })
        );
        elasticTranscoderServiceRole.grantPassRole(user);

        /* Outputs */
        new cdk.CfnOutput(this, "BucketId", {
            value: bucket.bucketName,
        });

        // Actions service access key
        new cdk.CfnOutput(this, "AccessKeyId", {
            value: accessKey.ref,
        });

        new cdk.CfnOutput(this, "SecretAccessKey", {
            value: accessKey.attrSecretAccessKey,
        });

        // Service roles
        new cdk.CfnOutput(this, "MediaConvertServiceRoleArn", {
            value: mediaConvertAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaLiveServiceRoleArn", {
            value: mediaLiveAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "TranscribeServiceRoleArn", {
            value: transcribeAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "ElasticTranscoderServiceRoleArn", {
            value: elasticTranscoderServiceRole.roleArn,
        });

        // SNS topics
        new cdk.CfnOutput(this, "TranscodeNotificationsTopic", {
            value: transcodeNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "TranscribeNotificationsTopic", {
            value: transcribeNotificationsTopic.topicArn,
        });
    }
}
