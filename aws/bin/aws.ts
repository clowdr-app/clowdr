#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "dotenv/config";
import "source-map-support/register";
import { env } from "../lib/env";
import { Auth0Stack } from "../lib/stacks/auth0-stack";
import { AwsStack } from "../lib/stacks/aws-stack";
import { ChimeStack } from "../lib/stacks/chime-stack";
import { HasuraStack } from "../lib/stacks/hasura-stack";
import { ImageStack } from "../lib/stacks/image-stack";
import { S3Stack } from "../lib/stacks/s3-stack";
import { SendGridStack } from "../lib/stacks/sendgrid-stack";
import { VonageStack } from "../lib/stacks/vonage-stack";

const app = new cdk.App();

// TODO: DataDog

/* TODO: Heroku
    - Actions Service
        - Domain:
        - Add-ons:
            - Heroku Postgres
            - Heroku Redis
            - CloudAMQP
            - Cron2Go
        - Buildpacks:
        - Env vars:
        - Metrics/Alerts:
        - Git:
        - Dynos:
        - Initial deployment?
    - Auth Service
        - Add-on attachments:
            - Heroku Redis (Referred from Actions)
            - CloudAMQP (Referred from Actions)
    - Caches Service
        - Add-on attachments:
            - Heroku Redis (Referred from Actions)
            - CloudAMQP (Referred from Actions)
    - Playout Service
    - Realtime Service
        - Add-on attachments:
            - Heroku Redis (Referred from Actions)
            - CloudAMQP (Referred from Actions)
            - Cron2Go
*/

/* TODO: Hasura
    - Apps
    - GitHub CI
    - Heroku integration
    - DataDog integration
    - Env var
    - (Custom?) Endpoint
*/

/* TODO: Netlify
    - Sites
    - Env vars
    - Deploys
        - Main or branches or PRs
*/

const sendgridStack = env.SENDGRID_AVAILABLE
    ? new SendGridStack(app, `${env.STACK_PREFIX}-sendgrid`, {
          tags: { environment: env.STACK_PREFIX },
          stackPrefix: env.STACK_PREFIX,
          vars: env,
          ActionsServiceEndpoint: `${env.ACTIONS_HOST_SECURE_PROTOCOLS ? "https" : "http"}://${
              env.ACTIONS_HOST_DOMAIN
          }`,
      })
    : undefined;

const hasuraStack = new HasuraStack(app, `${env.STACK_PREFIX}-hasura`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    vars: env,
});

new Auth0Stack(app, `${env.STACK_PREFIX}-auth0`, {
    tags: { environment: env.STACK_PREFIX },
    stackPrefix: env.STACK_PREFIX,
    vars: env,
    FrontendHosts: env.FRONTEND_HOSTS, // TODO: Add the Netlify-provided host to the list
    CustomDomain: env.AUTH0_CUSTOM_DOMAIN,
    SendGridAPISecret: sendgridStack?.auth0SendGridAPICredentials,
    HasuraAdminSecret: hasuraStack.adminSecret,
    GraphQLEndpointURL: hasuraStack.endpointURL,
});

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
    hasuraAdminSecret: hasuraStack.adminSecret,
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
