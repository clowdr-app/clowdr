import { createAWSClient } from "@midspace/component-clients/aws/client";
import assert from "assert";
import { logger } from "./logger";

assert(process.env.SERVICE_NAME, "Missing SERVICE_NAME environment variable");

const awsClient = createAWSClient(process.env.SERVICE_NAME, logger);

export { awsClient };
