import type * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { RetentionDays } from "@aws-cdk/aws-logs";
import type * as s3 from "@aws-cdk/aws-s3";
import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";
import * as path from "path";
import type { VonageProjectResource } from "./vonageProject";

export interface VonageArchiveToS3ResourceProps {
    VonageProject: VonageProjectResource;
    AccessKey: iam.CfnAccessKey;
    Bucket: s3.Bucket;
}

export class VonageArchiveToS3Resource extends Construct {
    constructor(scope: Construct, id: string, props: VonageArchiveToS3ResourceProps) {
        super(scope, id);

        const onEventHandler = new NodejsFunction(this, "VonageArchiveToS3LambdaFunction-onEvent", {
            handler: "onEvent",
            entry: path.join(__dirname, "./lambdas/vonageArchiveToS3.ts"),
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
        });

        const provider = new customResources.Provider(this, "VonageArchiveToS3Provider", {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY,
        });

        props.VonageProject.projectAPICredentials.grantRead(onEventHandler);

        new CustomResource(this, "VonageArchiveToS3Resource", {
            serviceToken: provider.serviceToken,
            properties: {
                ProjectCredentialsARN: props.VonageProject.projectAPICredentials.secretArn,
                AccessKey: props.AccessKey.ref,
                SecretKey: props.AccessKey.attrSecretAccessKey,
                BucketName: props.Bucket.bucketName,
            },
            resourceType: "Custom::Vonage::ArchiveToS3",
        });
    }
}
