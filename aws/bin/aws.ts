#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import assert from "assert";
import "dotenv/config";
import "source-map-support/register";
import { AwsStack } from "../lib/aws-stack";
import { ChimeStack } from "../lib/chime-stack";

assert(process.env.DOTENV_CONFIG_PATH, "Must specify DOTENV_CONFIG_PATH");
const app = new cdk.App();
const stackPrefix = process.env.STACK_PREFIX || "dev";
const vonageApiKey = process.env.VONAGE_API_KEY || null;

new AwsStack(app, `${stackPrefix}-main`, {
    tags: { environment: stackPrefix },
    stackPrefix,
    vonageApiKey,
});

/* Nested stack for Chime */
new ChimeStack(app, `${stackPrefix}-chime`, {
    env: { region: "us-east-1" },
    tags: { environment: stackPrefix },
    stackPrefix,
});
