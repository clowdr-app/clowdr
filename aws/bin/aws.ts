#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import * as assert from "assert";
import "source-map-support/register";
import { AwsStack } from "../lib/aws-stack";

const app = new cdk.App();

const stackName = app.node.tryGetContext("clowdr/stackName");
assert(stackName, "clowdr/stackName is not specified");

new AwsStack(app, stackName);
