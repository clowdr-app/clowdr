import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import { HttpMethods } from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

export class AwsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const user = new iam.User(this, "ActionsUser", {});

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

        const accessKey = new iam.CfnAccessKey(this, "accessKey", {
            userName: user.userName,
        });

        new cdk.CfnOutput(this, "BucketId", {
            value: bucket.bucketName,
        });

        new cdk.CfnOutput(this, "AccessKeyId", {
            value: accessKey.ref,
        });

        new cdk.CfnOutput(this, "SecretAccessKey", {
            value: accessKey.attrSecretAccessKey,
        });
    }
}
