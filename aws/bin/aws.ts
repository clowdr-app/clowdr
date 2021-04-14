#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import * as assert from "assert";
import "source-map-support/register";
import { AwsStack } from "../lib/aws-stack";
import { ChimeStack } from "../lib/chime-stack";

const app = new cdk.App();

const stackPrefix = app.node.tryGetContext("clowdr/stackPrefix");
const region = app.node.tryGetContext("clowdr/region");
const account = app.node.tryGetContext("clowdr/account");
assert(stackPrefix, "clowdr/stackName is not specified");
assert(region, "clowdr/region is not specified");
assert(account, "clowdr/account is not specified");

new AwsStack(app, `${stackPrefix}-main`, {
    env: { region, account },
    tags: { environment: stackPrefix },
    stackPrefix,
});

/* Nested stack for Chime */
new ChimeStack(app, `${stackPrefix}-chime`, {
    env: { region: "us-east-1", account },
    tags: { environment: stackPrefix },
    stackPrefix,
});

//new OpenshotStack(app, `${stackPrefix}-openshot`, { env: { region, account }, tags: { environment: stackPrefix } });
