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
        const mediaConvertServiceRole = this.createMediaConvertServiceRole(bucket);
        const transcribeServiceRole = this.createTranscribeServiceRole(bucket);
        const elasticTranscoderServiceRole = this.createElasticTranscoderServiceRole(bucket);

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

        const chimeManagerRole = this.createChimeManagerRole(actionsUser);

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: actionsUser.userName,
        });

        /* S3 */
        bucket.grantPut(actionsUser);
        bucket.grantReadWrite(actionsUser);

        /* Service Roles */
        mediaLiveServiceRole.grantPassRole(actionsUser);
        mediaPackageServiceRole.grantPassRole(actionsUser);
        mediaConvertServiceRole.grantPassRole(actionsUser);
        transcribeServiceRole.grantPassRole(actionsUser);
        elasticTranscoderServiceRole.grantPassRole(actionsUser);

        /* Notifications and webhooks */
        const cloudFormationNotificationsTopic = this.createCloudFormationNotificationTopic();
        const mediaConvertNotificationsTopic = this.createMediaConvertNotificationTopic();
        const mediaLiveNotificationsTopic = this.createMediaLiveNotificationTopic();
        const mediaPackageHarvestNotificationsTopic = this.createMediaPackageHarvestNotificationTopic();
        const transcribeNotificationsTopic = this.createTranscribeNotificationTopic();
        const elasticTranscoderNotificationsTopic =
            this.createElasticTranscoderNotificationTopic(elasticTranscoderServiceRole);

        this.createAndAddSubscriptionPolicy(actionsUser.node.id, actionsUser, [
            cloudFormationNotificationsTopic,
            mediaConvertNotificationsTopic,
            mediaLiveNotificationsTopic,
            mediaPackageHarvestNotificationsTopic,
            transcribeNotificationsTopic,
            elasticTranscoderNotificationsTopic,
        ]);

        this.addMediaConvertEventRule(mediaConvertNotificationsTopic, props.stackPrefix);

        // MediaLive channel notifications
        mediaLiveNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });

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
        mediaPackageHarvestNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
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
        transcribeNotificationsTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("transcribe.amazonaws.com"),
        });

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
            value: mediaConvertServiceRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaLiveServiceRoleArn", {
            value: mediaLiveServiceRole.roleArn,
        });

        new cdk.CfnOutput(this, "MediaPackageRoleArn", {
            value: mediaPackageServiceRole.roleArn,
        });

        new cdk.CfnOutput(this, "TranscribeServiceRoleArn", {
            value: transcribeServiceRole.roleArn,
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

    /**
     * @returns a service role for AWS MediaConvert
     */
    private createMediaConvertServiceRole(bucket: s3.Bucket): iam.Role {
        const mediaConvertAccessRole = new iam.Role(this, "MediaConvertRole", {
            assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
        });
        bucket.grantReadWrite(mediaConvertAccessRole);
        mediaConvertAccessRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["apigateway:*"],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
            })
        );

        return mediaConvertAccessRole;
    }

    /**
     * @returns a service role for Amazon Transcribe
     */
    private createTranscribeServiceRole(bucket: s3.Bucket): iam.Role {
        const transcribeAccessRole = new iam.Role(this, "TranscribeRole", {
            assumedBy: new iam.ServicePrincipal("transcribe.amazonaws.com"),
        });
        bucket.grantReadWrite(transcribeAccessRole);

        return transcribeAccessRole;
    }

    /**
     * @returns a service role for Elastic Transcode.
     */
    private createElasticTranscoderServiceRole(bucket: s3.Bucket): iam.Role {
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

        return elasticTranscoderServiceRole;
    }

    /**
     * @param assumedBy the principal that can assume the created role.
     * @returns a role that has full access to Chime resources.
     */
    private createChimeManagerRole(assumedBy: iam.IPrincipal): iam.IRole {
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
        const chimeManagerRole = new iam.Role(this, "ChimeManager", { assumedBy });
        chimeFullAccessPolicy.attachToRole(chimeManagerRole);

        return chimeManagerRole;
    }

    /**
     * @summary Create and attach a policy allowing the identity to subscribe to the listed topics.
     * @param id A scope-unique id for this policy.
     */
    private createAndAddSubscriptionPolicy(id: string, identity: iam.IIdentity, topics: sns.Topic[]): void {
        const policy = new iam.ManagedPolicy(this, `SNSAllowSubscription${id}Policy`, {
            statements: [
                new iam.PolicyStatement({
                    actions: ["SNS:Subscribe"],
                    effect: iam.Effect.ALLOW,
                    principals: [identity],
                    resources: topics.map((topic) => topic.topicArn),
                }),
            ],
        });
        identity.addManagedPolicy(policy);
    }

    /**
     * @returns an SNS topic that can receive notifications from CloudFormation.
     */
    private createCloudFormationNotificationTopic(): sns.Topic {
        const topic = new sns.Topic(this, "CloudFormationNotifications");
        topic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
        });
        return topic;
    }

    /**
     * @returns an SNS topic for MediaConvert notifications.
     */
    private createMediaConvertNotificationTopic(): sns.Topic {
        return new sns.Topic(this, "TranscodeNotifications");
    }

    /**
     * @returns an SNS topic for MediaLive notifications.
     */
    private createMediaLiveNotificationTopic(): sns.Topic {
        return new sns.Topic(this, "MediaLiveNotifications");
    }

    /**
     * @returns an SNS topic for MediaPackage notifications.
     */
    private createMediaPackageHarvestNotificationTopic(): sns.Topic {
        return new sns.Topic(this, "MediaPackageHarvestNotifications");
    }

    /**
     * @returns an SNS topic for Amazon Transcribe notifications.
     */
    private createTranscribeNotificationTopic(): sns.Topic {
        return new sns.Topic(this, "TranscribeNotifications");
    }

    /**
     * @param elasticTranscoderServiceRole a role to be granted permission to publish to the created topic.
     * @returns an SNS topic for Elastic Transcoder pipeline notifications.
     */
    private createElasticTranscoderNotificationTopic(elasticTranscoderServiceRole: iam.IPrincipal): sns.Topic {
        const topic = new sns.Topic(this, "ElasticTranscoderNotifications");
        topic.grantPublish(elasticTranscoderServiceRole);
        return topic;
    }

    private addMediaConvertEventRule(target: sns.ITopic, stackPrefix: string): void {
        target.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("mediaconvert.amazonaws.com"));
        const rule = new events.Rule(this, "TranscodeEventRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.mediaconvert"],
            detailType: ["MediaConvert Job State Change"],
            detail: {
                userMetadata: {
                    environment: [stackPrefix],
                },
            },
        });
        rule.addTarget(new targets.SnsTopic(target));
        const logGroup = new logs.LogGroup(this, "TranscodeLogGroup", {});
        rule.addTarget(new targets.CloudWatchLogGroup(logGroup));
    }
}
