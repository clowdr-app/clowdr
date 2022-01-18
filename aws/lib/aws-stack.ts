import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";
import * as ml from "@aws-cdk/aws-medialive";
import type * as s3 from "@aws-cdk/aws-s3";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as sns from "@aws-cdk/aws-sns";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import type { Env } from "./env";

export interface AwsStackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;
    vonageWebhookSecret: sm.Secret;
    bucket: s3.Bucket;
}

export class AwsStack extends cdk.Stack {
    public readonly actionsUser: iam.User;

    constructor(scope: cdk.Construct, id: string, props: AwsStackProps) {
        super(scope, id, props);

        /* IAM */

        // Managed policies
        const transcribeFullAccessPolicy = this.createTranscribeFullAccessPolicy();
        const transcribeWebsocketStreamingPolicy = this.createTranscribeWebsocketStreamingPolicy();
        const channelStackAdministratorPolicy = this.createChannelStackAdministratorPolicy();

        // IAM user
        this.actionsUser = new iam.User(this, "ActionsUser", {});
        const authServiceUser = new iam.User(this, "Service-AuthUser", {});
        const cachesServiceUser = new iam.User(this, "Service-CachesUser", {});
        const playoutServiceUser = new iam.User(this, "Service-PlayoutUser", {});
        const realtimeServiceUser = new iam.User(this, "Service-RealtimeUser", {});
        const ddProxyServiceUser = new iam.User(this, "Service-DDProxyUser", {});
        const publicTranscribeUser = new iam.User(this, "PublicTranscribeUser", {});

        // Service roles
        const mediaLiveServiceRole = this.createMediaLiveServiceRole(props.bucket);
        const mediaPackageServiceRole = this.createMediaPackageServiceRole(props.bucket);
        const mediaConvertServiceRole = this.createMediaConvertServiceRole(props.bucket);
        const transcribeServiceRole = this.createTranscribeServiceRole(props.bucket);
        const elasticTranscoderServiceRole = this.createElasticTranscoderServiceRole(props.bucket);

        const actionsServiceSecretsRole = new iam.Role(this, "ActionsServiceSecretsAccessRole", {
            assumedBy: this.actionsUser,
            description: "Has access to secrets used by the Actions Service.",
        });
        const authServiceSecretsRole = new iam.Role(this, "AuthServiceSecretsAccessRole", {
            assumedBy: authServiceUser,
            description: "Has access to secrets used by the Auth Service.",
        });
        const cachesServiceSecretsRole = new iam.Role(this, "CachesServiceSecretsAccessRole", {
            assumedBy: cachesServiceUser,
            description: "Has access to secrets used by the Caches Service.",
        });
        const playoutServiceSecretsRole = new iam.Role(this, "PlayoutServiceSecretsAccessRole", {
            assumedBy: playoutServiceUser,
            description: "Has access to secrets used by the Playout Service.",
        });
        const realtimeServiceSecretsRole = new iam.Role(this, "RealtimeServiceSecretsAccessRole", {
            assumedBy: realtimeServiceUser,
            description: "Has access to secrets used by the Realtime Service.",
        });
        const ddProxyServiceSecretsRole = new iam.Role(this, "DDProxyServiceSecretsAccessRole", {
            assumedBy: ddProxyServiceUser,
            description: "Has access to secrets used by the DataDog Proxy Service.",
        });

        // IAM User Access Keys
        const actionsUserAccessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: this.actionsUser.userName,
        });
        const publicTranscribeUserAccessKey = new iam.CfnAccessKey(this, "PublicTranscribeUserAccessKey", {
            userName: publicTranscribeUser.userName,
        });
        const authServiceUserAccessKey = new iam.CfnAccessKey(this, "Service-AuthUserAccessKey", {
            userName: authServiceUser.userName,
        });
        const cachesServiceUserAccessKey = new iam.CfnAccessKey(this, "Service-CachesUserAccessKey", {
            userName: cachesServiceUser.userName,
        });
        const playoutServiceUserAccessKey = new iam.CfnAccessKey(this, "Service-PlayoutUserAccessKey", {
            userName: playoutServiceUser.userName,
        });
        const realtimeServiceUserAccessKey = new iam.CfnAccessKey(this, "Service-RealtimeUserAccessKey", {
            userName: realtimeServiceUser.userName,
        });
        const ddProxyServiceUserAccessKey = new iam.CfnAccessKey(this, "Service-DDProxyUserAccessKey", {
            userName: ddProxyServiceUser.userName,
        });

        // Attach policies
        this.actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));
        authServiceUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));
        cachesServiceUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));
        playoutServiceUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));
        realtimeServiceUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));
        ddProxyServiceUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));

        this.actionsUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaLiveFullAccess")
        );
        this.actionsUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaConvertFullAccess")
        );
        this.actionsUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElementalMediaPackageFullAccess")
        );
        this.actionsUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess"));
        this.actionsUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticTranscoder_FullAccess")
        );
        this.actionsUser.addManagedPolicy(transcribeFullAccessPolicy);
        this.actionsUser.addManagedPolicy(channelStackAdministratorPolicy);

        publicTranscribeUser.addManagedPolicy(transcribeWebsocketStreamingPolicy);

        const chimeManagerRole = this.createChimeManagerRole(this.actionsUser);

        /* S3 */
        props.bucket.grantPut(this.actionsUser);
        props.bucket.grantReadWrite(this.actionsUser);

        /* Service Roles */
        mediaLiveServiceRole.grantPassRole(this.actionsUser);
        mediaPackageServiceRole.grantPassRole(this.actionsUser);
        mediaConvertServiceRole.grantPassRole(this.actionsUser);
        transcribeServiceRole.grantPassRole(this.actionsUser);
        elasticTranscoderServiceRole.grantPassRole(this.actionsUser);

        /* Notifications and webhooks */
        const cloudFormationNotificationsTopic = this.createCloudFormationNotificationTopic();
        const mediaConvertNotificationsTopic = this.createMediaConvertNotificationTopic();
        const mediaLiveNotificationsTopic = this.createMediaLiveNotificationTopic();
        const mediaPackageHarvestNotificationsTopic = this.createMediaPackageHarvestNotificationTopic();
        const transcribeNotificationsTopic = this.createTranscribeNotificationTopic();
        const elasticTranscoderNotificationsTopic =
            this.createElasticTranscoderNotificationTopic(elasticTranscoderServiceRole);

        const ssmParameterNotificationsTopic = new sns.Topic(this, "SSMParameterNotifications");
        const secretsManagerNotificationsTopic = new sns.Topic(this, "SecretsManagerNotifications");

        this.createAndAddSubscriptionPolicy(this.actionsUser.node.id, this.actionsUser, [
            cloudFormationNotificationsTopic,
            mediaConvertNotificationsTopic,
            mediaLiveNotificationsTopic,
            mediaPackageHarvestNotificationsTopic,
            transcribeNotificationsTopic,
            elasticTranscoderNotificationsTopic,
            ssmParameterNotificationsTopic,
            secretsManagerNotificationsTopic,
        ]);
        this.createAndAddSubscriptionPolicy(authServiceUser.node.id, authServiceUser, [ssmParameterNotificationsTopic]);
        this.createAndAddSubscriptionPolicy(cachesServiceUser.node.id, cachesServiceUser, [
            ssmParameterNotificationsTopic,
            secretsManagerNotificationsTopic,
        ]);
        this.createAndAddSubscriptionPolicy(playoutServiceUser.node.id, playoutServiceUser, [
            ssmParameterNotificationsTopic,
            secretsManagerNotificationsTopic,
        ]);
        this.createAndAddSubscriptionPolicy(realtimeServiceUser.node.id, realtimeServiceUser, [
            ssmParameterNotificationsTopic,
            secretsManagerNotificationsTopic,
        ]);
        this.createAndAddSubscriptionPolicy(ddProxyServiceUser.node.id, ddProxyServiceUser, [
            ssmParameterNotificationsTopic,
            secretsManagerNotificationsTopic,
        ]);

        cloudFormationNotificationsTopic.grantPublish(this.actionsUser);

        this.addMediaConvertEventRule(mediaConvertNotificationsTopic, props.stackPrefix);
        this.addMediaLiveEventRule(mediaLiveNotificationsTopic);
        this.addMediaPackageEventRule(mediaPackageHarvestNotificationsTopic);
        this.addTranscribeEventRule(transcribeNotificationsTopic);
        this.addSSMParametersUpdatedEventRule(ssmParameterNotificationsTopic);
        this.addSecretsManagerSecretUpdatedEventRule(secretsManagerNotificationsTopic);

        /* MediaLive */
        const inputSecurityGroup = new ml.CfnInputSecurityGroup(this, "InputSecurityGroup", {
            whitelistRules: [{ cidr: "0.0.0.1/0" }],
        });

        /* Secrets */
        props.vonageWebhookSecret.grantRead(actionsServiceSecretsRole);

        /* Output Parameters / Secrets */

        new ssm.StringParameter(this, "/EnvVars/AUTH0_API_DOMAIN", {
            allowedPattern: ".*",
            parameterName: "AUTH0_API_DOMAIN",
            stringValue: props.vars.AUTH0_API_DOMAIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "/EnvVars/AUTH0_AUDIENCE", {
            allowedPattern: ".*",
            parameterName: "AUTH0_AUDIENCE",
            stringValue: props.vars.AUTH0_AUDIENCE,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AUTH0_ISSUER_DOMAIN", {
            allowedPattern: ".*",
            parameterName: "AUTH0_ISSUER_DOMAIN",
            stringValue: props.vars.AUTH0_ISSUER_DOMAIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        // TODO: The Redis URL may contain authentication parameters, which is annoying
        //       because it means this needs to be secret
        // TODO: Other secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
        // new ssm.StringParameter(this, "/EnvVars/ACTIONS_REDIS_URL", {
        //     allowedPattern: ".*",
        //     parameterName: "ACTIONS_REDIS_URL",
        //     stringValue: props.vars.ACTIONS_REDIS_URL,
        //     tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        // });
        // TODO: How do we update this? Manually?
        // const redisURLSecret = new sm.Secret(this, "ACTIONS_REDIS_URL", {
        //     secretName: "ACTIONS_REDIS_URL",
        //     description: "Sensitive connection URL for Redis for the Actions service",
        //     generateSecretString: {
        //         secretStringTemplate: JSON.stringify({ url: "" }),
        //         generateStringKey: "password",
        //     },
        // });

        const actionsEventSecret = new sm.Secret(this, "ACTIONS_EVENT_SECRET", {
            secretName: "ACTIONS_EVENT_SECRET",
            description: "Secret for Hasura calls to the Actions service",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        actionsEventSecret.grantRead(actionsServiceSecretsRole);

        const authEventSecret = new sm.Secret(this, "AUTH_EVENT_SECRET", {
            secretName: "AUTH_EVENT_SECRET",
            description: "Secret for Hasura calls to the Auth service",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        authEventSecret.grantRead(authServiceSecretsRole);

        const cachesEventSecret = new sm.Secret(this, "CACHES_EVENT_SECRET", {
            secretName: "CACHES_EVENT_SECRET",
            description: "Secret for Hasura calls to the Caches service",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        cachesEventSecret.grantRead(cachesServiceSecretsRole);

        const playoutEventSecret = new sm.Secret(this, "PLAYOUT_EVENT_SECRET", {
            secretName: "PLAYOUT_EVENT_SECRET",
            description: "Secret for Hasura calls to the Playout service",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        playoutEventSecret.grantRead(playoutServiceSecretsRole);

        const realtimeEventSecret = new sm.Secret(this, "REALTIME_EVENT_SECRET", {
            secretName: "REALTIME_EVENT_SECRET",
            description: "Secret for Hasura calls to the Realtime service",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        realtimeEventSecret.grantRead(realtimeServiceSecretsRole);

        new ssm.StringParameter(this, "/EnvVars/ACTIONS_CORS_ORIGIN", {
            allowedPattern: ".*",
            parameterName: "ACTIONS_CORS_ORIGIN",
            stringValue: props.vars.ACTIONS_CORS_ORIGIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/ACTIONS_HOST_SECURE_PROTOCOLS", {
            allowedPattern: ".*",
            parameterName: "ACTIONS_HOST_SECURE_PROTOCOLS",
            stringValue: props.vars.ACTIONS_HOST_SECURE_PROTOCOLS.toString(),
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/ACTIONS_HOST_DOMAIN", {
            allowedPattern: ".*",
            parameterName: "ACTIONS_HOST_DOMAIN",
            stringValue: props.vars.ACTIONS_HOST_DOMAIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        if (props.vars.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS) {
            new ssm.StringParameter(this, "/EnvVars/FAILURE_NOTIFICATIONS_EMAIL_ADDRESS", {
                allowedPattern: ".*",
                parameterName: "FAILURE_NOTIFICATIONS_EMAIL_ADDRESS",
                stringValue: props.vars.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
                tier: ssm.ParameterTier.INTELLIGENT_TIERING,
            });
        }

        const hasuraAdminSecret = new sm.Secret(this, "HASURA_ADMIN_SECRET", {
            secretName: "HASURA_ADMIN_SECRET",
            description: "Secret for Hasura Admin calls",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });
        hasuraAdminSecret.grantRead(actionsServiceSecretsRole);
        hasuraAdminSecret.grantRead(authServiceSecretsRole);
        hasuraAdminSecret.grantRead(cachesServiceSecretsRole);
        hasuraAdminSecret.grantRead(playoutServiceSecretsRole);
        hasuraAdminSecret.grantRead(realtimeServiceSecretsRole);

        new ssm.StringParameter(this, "/EnvVars/GRAPHQL_API_SECURE_PROTOCOLS", {
            allowedPattern: ".*",
            parameterName: "GRAPHQL_API_SECURE_PROTOCOLS",
            stringValue: props.vars.GRAPHQL_API_SECURE_PROTOCOLS,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/GRAPHQL_API_DOMAIN", {
            allowedPattern: ".*",
            parameterName: "GRAPHQL_API_DOMAIN",
            stringValue: props.vars.GRAPHQL_API_DOMAIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "/EnvVars/AWS_CONTENT_BUCKET_ID", {
            allowedPattern: ".*",
            parameterName: "CONTENT_BUCKET_ID",
            stringValue: props.bucket.bucketName,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        // Service roles
        new ssm.StringParameter(this, "/EnvVars/AWS_CHIME_MANAGER_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "CHIME_MANAGER_ROLE_ARN",
            stringValue: chimeManagerRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "/EnvVars/AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "ELASTIC_TRANSCODER_SERVICE_ROLE_ARN",
            stringValue: elasticTranscoderServiceRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIACONVERT_SERVICE_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "MEDIACONVERT_SERVICE_ROLE_ARN",
            stringValue: mediaConvertServiceRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "MEDIAPACKAGE_SERVICE_ROLE_ARN",
            stringValue: mediaPackageServiceRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_TRANSCRIBE_SERVICE_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "TRANSCRIBE_SERVICE_ROLE_ARN",
            stringValue: transcribeServiceRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIALIVE_SERVICE_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "MEDIALIVE_SERVICE_ROLE_ARN",
            stringValue: mediaLiveServiceRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/ActionsService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/ACTIONS_SERVICE",
            stringValue: actionsServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/AuthService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/AUTH_SERVICE",
            stringValue: authServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/CachesService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/CACHES_SERVICE",
            stringValue: cachesServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/PlayoutService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/PLAYOUT_SERVICE",
            stringValue: playoutServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/RealtimeService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/REALTIME_SERVICE",
            stringValue: realtimeServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "SecretsManager/AccessRoleARNs/DDProxyService", {
            allowedPattern: ".*",
            parameterName: "/SecretsManager/AccessRoleARNs/DDPROXY_SERVICE",
            stringValue: ddProxyServiceSecretsRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        // SNS topics
        new ssm.StringParameter(this, "/EnvVars/AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN",
            stringValue: elasticTranscoderNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN",
            stringValue: mediaPackageHarvestNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "MEDIALIVE_NOTIFICATIONS_TOPIC_ARN",
            stringValue: mediaLiveNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN",
            stringValue: cloudFormationNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "TRANSCODE_NOTIFICATIONS_TOPIC_ARN",
            stringValue: mediaConvertNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN",
            stringValue: transcribeNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_SSM_PARAMETER_STORE_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "PARAMETER_STORE_NOTIFICATIONS_TOPIC_ARN",
            stringValue: ssmParameterNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_SECRETS_MANAGER_NOTIFICATIONS_TOPIC_ARN", {
            allowedPattern: ".*",
            parameterName: "SECRETS_MANAGER_NOTIFICATIONS_TOPIC_ARN",
            stringValue: secretsManagerNotificationsTopic.topicArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        // MediaLive
        new ssm.StringParameter(this, "/EnvVars/AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID", {
            allowedPattern: ".*",
            parameterName: "MEDIALIVE_INPUT_SECURITY_GROUP_ID",
            stringValue: inputSecurityGroup.ref,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "/EnvVars/AWS_PUBLIC_TRANSCRIBE_REGION", {
            allowedPattern: ".*",
            parameterName: "PUBLIC_TRANSCRIBE_REGION",
            stringValue: this.region,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        /* Outputs */

        // IAM
        this.createOutput("ActionsUserAccessKeyId", actionsUserAccessKey.ref);
        this.createOutput("ActionsUserSecretAccessKey", actionsUserAccessKey.attrSecretAccessKey);

        this.createOutput("AuthServiceUserAccessKey", authServiceUserAccessKey.ref);
        this.createOutput("AuthServiceUserSecretAccessKey", authServiceUserAccessKey.attrSecretAccessKey);

        this.createOutput("CachesServiceUserAccessKey", cachesServiceUserAccessKey.ref);
        this.createOutput("CachesServiceUserSecretAccessKey", cachesServiceUserAccessKey.attrSecretAccessKey);

        this.createOutput("PlayoutServiceUserAccessKey", playoutServiceUserAccessKey.ref);
        this.createOutput("PlayoutServiceUserSecretAccessKey", playoutServiceUserAccessKey.attrSecretAccessKey);

        this.createOutput("RealtimeServiceUserAccessKey", realtimeServiceUserAccessKey.ref);
        this.createOutput("RealtimeServiceUserSecretAccessKey", realtimeServiceUserAccessKey.attrSecretAccessKey);

        this.createOutput("DDProxyServiceUserAccessKey", ddProxyServiceUserAccessKey.ref);
        this.createOutput("DDProxyServiceUserSecretAccessKey", ddProxyServiceUserAccessKey.attrSecretAccessKey);

        this.createOutput("PublicTranscribeUserAccessKeyId", publicTranscribeUserAccessKey.ref);
        this.createOutput("PublicTranscribeUserSecretAccessKey", publicTranscribeUserAccessKey.attrSecretAccessKey);
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
     * @returns a policy that grants websocket streaming to Amazon Transcribe.
     */
    private createTranscribeWebsocketStreamingPolicy(): iam.IManagedPolicy {
        return new iam.ManagedPolicy(this, "TranscribeWebsocketStreaming", {
            description: "Websocket streaming access for all Amazon Transcribe resources.",
            statements: [
                new iam.PolicyStatement({
                    actions: ["transcribe:StartStreamTranscriptionWebSocket"],
                    effect: iam.Effect.ALLOW,
                    resources: ["*"],
                }),
            ],
        });
    }

    private createChannelStackAdministratorPolicy(): iam.IManagedPolicy {
        return new iam.ManagedPolicy(this, "ChannelStackAdministratorPolicy", {
            description: "Full access to create/destroy/introspect channel stacks with Cfn/CDK.",
            statements: [
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
                        `arn:aws:cloudformation:${this.region}:${this.account}:stack/room-*/*`,
                        `arn:aws:cloudformation:${this.region}:${this.account}:stack/CDKToolkit/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    actions: ["s3:*Object", "s3:ListBucket", "s3:GetBucketLocation"],
                    effect: iam.Effect.ALLOW,
                    resources: ["arn:aws:s3:::cdktoolkit-stagingbucket-*"],
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

    private addMediaLiveEventRule(target: sns.ITopic): void {
        target.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });

        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("medialive.amazonaws.com"));
        const rule = new events.Rule(this, "MediaLiveEventRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.medialive"],
        });
        rule.addTarget(new targets.SnsTopic(target));
        const logGroup = new logs.LogGroup(this, "MediaLiveLogGroup", {});
        rule.addTarget(new targets.CloudWatchLogGroup(logGroup));
    }

    private addMediaPackageEventRule(mediaPackageHarvestNotificationTopic: sns.ITopic): void {
        mediaPackageHarvestNotificationTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("mediapackage.amazonaws.com"));
        const rule = new events.Rule(this, "MediaPackageHarvestEventRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.mediapackage"],
            detailType: ["MediaPackage HarvestJob Notification"],
        });
        rule.addTarget(new targets.SnsTopic(mediaPackageHarvestNotificationTopic));
    }

    private addTranscribeEventRule(transcribeNotificationTopic: sns.ITopic): void {
        transcribeNotificationTopic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("transcribe.amazonaws.com"));
        const rule = new events.Rule(this, "TranscribeEventRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.transcribe"],
            detailType: ["Transcribe Job State Change"],
        });
        rule.addTarget(new targets.SnsTopic(transcribeNotificationTopic));
        const transcribeLogGroup = new logs.LogGroup(this, "TranscribeLogGroup", {});
        rule.addTarget(new targets.CloudWatchLogGroup(transcribeLogGroup));
    }

    private addSSMParametersUpdatedEventRule(topic: sns.ITopic): void {
        topic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("ssm.amazonaws.com"));
        const rule = new events.Rule(this, "ParameterChangedRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.ssm"],
            detailType: ["Parameter Store Change"],
            detail: {
                operation: ["Create", "Update", "Delete"],
            },
        });
        rule.addTarget(new targets.SnsTopic(topic));
        const logGroup = new logs.LogGroup(this, "ParameterStoreLogGroup");
        rule.addTarget(new targets.CloudWatchLogGroup(logGroup));
    }

    private addSecretsManagerSecretUpdatedEventRule(topic: sns.ITopic): void {
        topic.grantPublish({
            grantPrincipal: new iam.ServicePrincipal("events.amazonaws.com"),
        });
        events.EventBus.grantAllPutEvents(new iam.ServicePrincipal("secretsmanager.amazonaws.com"));
        const rule = new events.Rule(this, "SecretChangedRule", {
            enabled: true,
        });
        rule.addEventPattern({
            source: ["aws.secretsmanager"],
            detailType: ["AWS API Call via CloudTrail"],
        });
        rule.addTarget(new targets.SnsTopic(topic));
        const logGroup = new logs.LogGroup(this, "SecretsManagerLogGroup");
        rule.addTarget(new targets.CloudWatchLogGroup(logGroup));
    }

    private createOutput(id: string, value: string): void {
        new cdk.CfnOutput(this, id, {
            value,
        });
    }
}
