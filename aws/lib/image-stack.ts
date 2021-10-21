import type * as s3 from "@aws-cdk/aws-s3";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as cfninc from "@aws-cdk/cloudformation-include";
import * as cdk from "@aws-cdk/core";

export interface ImageStackProps extends cdk.StackProps {
    stackPrefix: string;
    bucket: s3.Bucket;
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

        new cfninc.CfnInclude(this, "ImgHandler", {
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

        new cdk.CfnOutput(this, "SecretValue", {
            value: secret.secretValue.toString(),
        });
    }
}
