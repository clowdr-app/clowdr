import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";
import * as ml from "@aws-cdk/aws-medialive";
import * as s3 from "@aws-cdk/aws-s3";
import { HttpMethods } from "@aws-cdk/aws-s3";
import * as sns from "@aws-cdk/aws-sns";
import * as cdk from "@aws-cdk/core";

export interface AwsStackProps extends cdk.StackProps {
    stackPrefix: string;
}

export class AwsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: AwsStackProps) {
        super(scope, id, props);

        /** S3 **/
        const bucket = this.createContentS3Bucket();

        /** Shared policies **/
        const transcribeFullAccessPolicy = this.createTranscribeFullAccessPolicy();

        /** Service roles **/
        const mediaLiveServiceRole = this.createMediaLiveServiceRole(bucket);
        const mediaPackageServiceRole = this.createMediaPackageServiceRole(bucket);

        // Create user account to be used by the actions service
        const actionsUser = new iam.User(this, "ActionsUser", {});

        actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaLiveFullAccess"));
        actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaConvertFullAccess"));
        actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaPackageFullAccess"));
        actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess"));
        actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticTranscoder_FullAccess"));
        actionsUser.addManagedPolicy(transcribeFullAccessPolicy);
        actionsUser.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "cloudformation:CreateChangeSet",
                    "cloudformation:CreateStack",
                    "cloudformation:DeleteStack",
                    "cloudformation:DeleteChangeSet",
                    "cloudformation:DescribeChangeSet",
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackEvents",
                    "cloudformation:DescribeStackResources",
                    "cloudformation:ExecuteChangeSet",
                    "cloudformation:GetTemplate",
                    "cloudformation:ValidateTemplate",
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                    `arn:aws:cloudformation:${props.env?.region}:${props.env?.account}:stack/room-*/*`,
                    `arn:aws:cloudformation:${props.env?.region}:${props.env?.account}:stack/CDKToolkit/*`,
                ],
            })
        );
        actionsUser.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:*Object", "s3:ListBucket", "s3:GetBucketLocation"],
                effect: iam.Effect.ALLOW,
                resources: ["arn:aws:s3:::cdktoolkit-stagingbucket-*"],
            })
        );

        const chimeFullAccessPolicy = new iam.Policy(this, "ChimeFullAccess");
        chimeFullAccessPolicy.addStatements(
            new iam.PolicyStatement({
                actions: [
                    "chime:CreateMeeting",
                    "chime:DeleteMeeting",
                    "chime:GetMeeting",
                    "chime:ListMeetings",
                    "chime:CreateAttendee",
                    "chime:BatchCreateAttendee",
                    "chime:DeleteAttendee",
                    "chime:GetAttendee",
                    "chime:ListAttendees",
                    "chime:ListAttendeeTags",
                    "chime:ListMeetingTags",
                    "chime:ListTagsForResource",
                    "chime:TagAttendee",
                    "chime:TagMeeting",
                    "chime:TagResource",
                    "chime:UntagAttendee",
                    "chime:UntagMeeting",
                    "chime:UntagResource",
                ],
                effect: iam.Effect.ALLOW,
                resources: ["*"],
            })
        );
        const chimeManagerRole = new iam.Role(this, "ChimeManager", { assumedBy: actionsUser });
        chimeFullAccessPolicy.attachToRole(chimeManagerRole);

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: actionsUser.userName,
        });

        /* S3 */
        bucket.grantPut(actionsUser);
        bucket.grantReadWrite(actionsUser);

        /* Service Roles */
        mediaLiveServiceRole.grantPassRole(actionsUser);
        mediaPackageServiceRole.grantPassRole(actionsUser);

        // Create a role to be used by MediaConvert
        const mediaConvertAccessRole = new iam.Role(this, "MediaConvertRole", {
            assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
        });
        mediaConvertAccessRole.grantPassRole(actionsUser);
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
        transcribeAccessRole.grantPassRole(actionsUser);
        bucket.grantReadWrite(transcribeAccessRole);

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
        elasticTranscoderServiceRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:*Delete*", "s3:*Policy*", "sns:*Remove*", "sns:*Delete*", "sns:*Permission*"],
                effect: iam.Effect.DENY,
                resources: ["*"],
            })
        );
        elasticTranscoderServiceRole.grantPassRole(actionsUser);

        /* Notifications and webhooks */

        // CloudFormation notifications
        const cloudFormationNotificationsTopic = new sns.Topic(this, "CloudFormationNotifications");
        cloudFormationNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
        });
        cloudFormationNotificationsTopic.grantPublish({
            grantPrincipal: actionsUser,
        });
        cloudFormationNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
                resources: [cloudFormationNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        // Transcoding notifications
        const mediaConvertNotificationsTopic = new sns.Topic(this, "TranscodeNotifications");
        mediaConvertNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ArnPrincipal(mediaConvertAccessRole.roleArn),
        });
        mediaConvertNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        mediaConvertNotificationsTopic.addToResourcePolicy(
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
                resources: [mediaConvertNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );
        mediaConvertNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
                resources: [mediaConvertNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("mediaconvert.amazonaws.com"));
        const mediaConvertEventRule = new events.Rule(this, "TranscodeEventRule", {
            enabled: true,
        });
        mediaConvertEventRule.addEventPattern({
            source: ["aws.mediaconvert"],
            detailType: ["MediaConvert Job State Change"],
            detail: {
                userMetadata: {
                    environment: [props.stackPrefix],
                },
            },
        });
        mediaConvertEventRule.addTarget(new targets.SnsTopic(mediaConvertNotificationsTopic));

        const transcodeLogGroup = new logs.LogGroup(this, "TranscodeLogGroup", {});
        mediaConvertEventRule.addTarget(new targets.CloudWatchLogGroup(transcodeLogGroup));

        // MediaLive channel notifications
        const mediaLiveNotificationsTopic = new sns.Topic(this, "MediaLiveNotifications");
        mediaLiveNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        mediaLiveNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
                resources: [mediaLiveNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );

        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("medialive.amazonaws.com"));
        const mediaLiveEventRule = new events.Rule(this, "MediaLiveEventRule", {
            enabled: true,
        });
        mediaLiveEventRule.addEventPattern({
            source: ["aws.medialive"],
        });
        mediaLiveEventRule.addTarget(new targets.SnsTopic(mediaLiveNotificationsTopic));

        const mediaLiveLogGroup = new logs.LogGroup(this, "MediaLiveLogGroup", {});
        mediaLiveEventRule.addTarget(new targets.CloudWatchLogGroup(mediaLiveLogGroup));

        // MediaPackage harvest notifications
        const mediaPackageHarvestNotificationsTopic = new sns.Topic(this, "MediaPackageHarvestNotifications");
        mediaPackageHarvestNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        mediaPackageHarvestNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
                resources: [mediaPackageHarvestNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("mediapackage.amazonaws.com"));
        const mediaPackageHarvestEventRule = new events.Rule(this, "MediaPackageHarvestEventRule", {
            enabled: true,
        });
        mediaPackageHarvestEventRule.addEventPattern({
            source: ["aws.mediapackage"],
            detailType: ["MediaPackage HarvestJob Notification"],
        });
        mediaPackageHarvestEventRule.addTarget(new targets.SnsTopic(mediaPackageHarvestNotificationsTopic));

        // Transcribe notifications
        const transcribeNotificationsTopic = new sns.Topic(this, "TranscribeNotifications");
        transcribeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("transcribe.amazonaws.com"),
        });
        transcribeNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
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

        // Elastic Transcoder notifications
        const elasticTranscoderNotificationsTopic = new sns.Topic(this, "ElasticTranscoderNotifications");
        elasticTranscoderNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("elastictranscoder.amazonaws.com"),
        });
        elasticTranscoderNotificationsTopic.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["SNS:Subscribe"],
                principals: [new iam.ArnPrincipal(actionsUser.userArn)],
                resources: [elasticTranscoderNotificationsTopic.topicArn],
                effect: iam.Effect.ALLOW,
            })
        );
        elasticTranscoderNotificationsTopic.grantPublish(elasticTranscoderServiceRole);

        /* Elemental */
        const inputSecurityGroup = new ml.CfnInputSecurityGroup(this, "InputSecurityGroup", {
            whitelistRules: [{ cidr: "0.0.0.1/0" }],
        });

        /* Outputs */
        new cdk.CfnOutput(this, "BucketId", {
            value: bucket.bucketName,
        });

        // Actions service access key
        new cdk.CfnOutput(this, "ActionsUserAccessKeyId", {
            value: accessKey.ref,
        });

        new cdk.CfnOutput(this, "ActionsUserSecretAccessKey", {
            value: accessKey.attrSecretAccessKey,
        });

        // Service roles
        new cdk.CfnOutput(this, "ChimeManagerRoleArn", {
            value: chimeManagerRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaConvertServiceRoleArn", {
            value: mediaConvertAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaLiveServiceRoleArn", {
            value: mediaLiveServiceRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaPackageRoleArn", {
            value: mediaPackageServiceRole.roleArn,
        });

        new cdk.CfnOutput(this, "TranscribeServiceRoleArn", {
            value: transcribeAccessRole.roleArn,
        });

        new cdk.CfnOutput(this, "ElasticTranscoderServiceRoleArn", {
            value: elasticTranscoderServiceRole.roleArn,
        });

        // SNS topics
        new cdk.CfnOutput(this, "CloudFormationNotificationsTopic", {
            value: cloudFormationNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "TranscodeNotificationsTopic", {
            value: mediaConvertNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "TranscribeNotificationsTopic", {
            value: transcribeNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "ElasticTranscoderNotificationsTopic", {
            value: elasticTranscoderNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "MediaLiveNotificationsTopic", {
            value: mediaLiveNotificationsTopic.topicArn,
        });

        new cdk.CfnOutput(this, "MediaPackageHarvestNotificationsTopic", {
            value: mediaPackageHarvestNotificationsTopic.topicArn,
        });

        // Elemental
        new cdk.CfnOutput(this, "MediaLiveInputSecurityGroupId", { value: inputSecurityGroup.ref });
    }

    /**
     * @returns a publicly-accessible S3 bucket for content storage.
     */
    private createContentS3Bucket(): s3.Bucket {
        const bucket = new s3.Bucket(this, "ContentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            },
        });

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

        return bucket;
    }

    /**
     * @returns a policy that grants full access to Amazon Transcribe.
     */
    private createTranscribeFullAccessPolicy(): iam.IManagedPolicy {
        return new iam.ManagedPolicy(this, "TranscribeFullAccessPolicy", {
            description: "Full access to all Amazon Transcribe resources.",
            statements: [
                new iam.PolicyStatement({
                    actions: ["transcribe:*"],
                    effect: iam.Effect.ALLOW,
                    resources: ["*"],
                }),
            ],
        });
    }

    /**
     * @returns a service role for AWS MediaLive
     */
    private createMediaLiveServiceRole(sourceBucket: s3.Bucket): iam.Role {
        const role = new iam.Role(this, "MediaLiveRole", {
            assumedBy: new iam.ServicePrincipal("medialive.amazonaws.com"),
        });

        sourceBucket.grantReadWrite(role);

        role.addToPolicy(
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
        role.addToPolicy(
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
        role.addToPolicy(
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
        role.addToPolicy(
            new iam.PolicyStatement({
                actions: ["mediapackage:DescribeChannel"],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));

        return role;
    }

    /**
     * @returns a service role for AWS MediaPackage
     */
    private createMediaPackageServiceRole(outputBucket: s3.Bucket): iam.Role {
        const mediaPackageAccessRole = new iam.Role(this, "MediaPackageRole", {
            assumedBy: new iam.ServicePrincipal("mediapackage.amazonaws.com"),
        });
        mediaPackageAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:PutObject", "s3:ListBucket", "s3:GetBucketLocation"],
                effect: iam.Effect.ALLOW,
                resources: [outputBucket.bucketArn, `${outputBucket.bucketArn}/*`],
            })
        );

        return mediaPackageAccessRole;
    }
}
