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

new AwsStack(app, `${stackPrefix}-main`, {
    tags: { environment: stackPrefix },
    stackPrefix,
});

/* Nested stack for Chime */
new ChimeStack(app, `${stackPrefix}-chime`, {
    env: { region: "us-east-1" },
    tags: { environment: stackPrefix },
    stackPrefix,
});
