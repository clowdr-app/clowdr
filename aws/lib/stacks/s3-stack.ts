import * as s3 from "@aws-cdk/aws-s3";
import { HttpMethods } from "@aws-cdk/aws-s3";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import type { Env } from "../env";

export interface S3StackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;
}

export class S3Stack extends cdk.Stack {
    public readonly bucket: s3.Bucket;

    constructor(scope: cdk.Construct, id: string, props: S3StackProps) {
        super(scope, id, props);

        /* S3 */
        this.bucket = new s3.Bucket(this, "ContentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            },
        });

        this.bucket.grantPublicAccess();

        this.bucket.addCorsRule({
            allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
            allowedOrigins: ["*"],
            exposedHeaders: ["ETag"],
            maxAge: 3000,
            allowedHeaders: ["Authorization", "x-amz-date", "x-amz-content-sha256", "content-type"],
        });
        this.bucket.addCorsRule({
            allowedHeaders: [],
            allowedMethods: [HttpMethods.GET],
            allowedOrigins: ["*"],
            exposedHeaders: [],
            maxAge: 3000,
        });

        new ssm.StringParameter(this, "/EnvVars/AWS_CONTENT_BUCKET_ID", {
            allowedPattern: ".*",
            parameterName: "CONTENT_BUCKET_ID",
            stringValue: this.bucket.bucketName,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
    }
}
