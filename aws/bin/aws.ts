#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "dotenv/config";
import "source-map-support/register";
import { AwsStack } from "../lib/aws-stack";
import { ChimeStack } from "../lib/chime-stack";
import { env } from "../lib/env";
import { ImageStack } from "../lib/image-stack";
import { S3Stack } from "../lib/s3-stack";
import { VonageStack } from "../lib/vonage-stack";

const app = new cdk.App();

const s3Stack = new S3Stack(app, `${env.STACK_PREFIX}-s3`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    vars: env,
});

const vonageStack = new VonageStack(app, `${env.STACK_PREFIX}-vonage`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    vars: env,
    bucket: s3Stack.bucket,
});

const awsStack = new AwsStack(app, `${env.STACK_PREFIX}-main`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    vars: env,
    vonageWebhookSecret: vonageStack.webhookSecret,
    bucket: s3Stack.bucket,
});

new ImageStack(app, `${env.STACK_PREFIX}-img`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    bucket: s3Stack.bucket,
    actionsUser: awsStack.actionsUser,
});

new ChimeStack(app, `${env.STACK_PREFIX}-chime`, {
    env: { region: "us-east-1" },
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
});
