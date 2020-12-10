#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { AwsStack } from "../lib/aws-stack";

const app = new cdk.App();
new AwsStack(app, "AwsStack");
