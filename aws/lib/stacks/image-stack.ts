import * as iam from "@aws-cdk/aws-iam";
import type * as s3 from "@aws-cdk/aws-s3";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cfninc from "@aws-cdk/cloudformation-include";
import * as cdk from "@aws-cdk/core";

export interface ImageStackProps extends cdk.StackProps {
    stackPrefix: string;
    bucket: s3.Bucket;
    actionsUser: iam.User;
}

export class ImageStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ImageStackProps) {
        super(scope, id, props);

        /* Serverless image handler */
        const secret = new sm.Secret(this, "ServerlessImageHandlerSecret", {
            description: "Secret for the ServerlessImageHandler",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });

        const secretRole = new iam.Role(this, "ImgHandlerSecretAccessRole", {
            assumedBy: props.actionsUser,
            description: "Has access to the secret used by the Serverless Image Handler.",
        });

        secret.grantRead(secretRole);

        const imgHandler = new cfninc.CfnInclude(this, "ImgHandler", {
            templateFile: "vendor/serverless-image-handler.template",
            parameters: {
                CorsEnabled: "Yes",
                CorsOrigin: "http://localhost",
                SourceBuckets: props.bucket.bucketName,
                DeployDemoUI: "No",
                LogRetentionPeriod: "1",
                EnableSignature: "Yes",
                SecretsManagerSecret: secret.secretName,
                SecretsManagerKey: "secret",
                EnableDefaultFallbackImage: "No",
                AutoWebP: "Yes",
            },
        });

        const cloudfrontDomainName = imgHandler.getResource("ImageHandlerDistribution").getAtt("DomainName").toString();
        new ssm.StringParameter(this, "/EnvVars/AWS_IMAGES_CLOUDFRONT_DOMAIN_NAME", {
            allowedPattern: ".*",
            parameterName: "IMAGES_CLOUDFRONT_DOMAIN_NAME",
            stringValue: cloudfrontDomainName,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new ssm.StringParameter(this, "/EnvVars/AWS_IMAGES_SECRET_ARN", {
            allowedPattern: ".*",
            parameterName: "IMAGES_SECRET_ARN",
            stringValue: secret.secretArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/AWS_IMAGES_SECRET_ACCESS_ROLE_ARN", {
            allowedPattern: ".*",
            parameterName: "IMAGES_SECRET_ACCESS_ROLE_ARN",
            stringValue: secretRole.roleArn,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
    }
}
