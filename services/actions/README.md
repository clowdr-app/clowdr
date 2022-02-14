# Midspace: Actions Service

Express server designed to run on Heroku and serve action calls from Hasura.
Eventually this may be split into multiple microservices.

## Pre-requisites

1. **Full Setup**: Follow the AWS setup instructions in
   [aws/README.md](../../aws/README.md) if you haven't already.
1. **Full Setup**: A SendGrid account per instructions in the main README.
1. A fully configured [Vonage Video API](../../docs/video-service-setup.md) project.
1. [Hasura](../../hasura/README.md) running locally.
1. **Production**: If you will be uploading recorded videos to YouTube, you will
   need a Google Cloud account.
1. **Production**: [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

## Setting Up Actions Service Local Working Copy

1. `cd services/actions`
1. `cp .env.example .env`
1. Configure your `.env` according to the [Actions Service Configuration](#actions-service-configuration) table below
   - **Quick setup**: Set all the environment variables related to AWS to `XXXX`. BCP: This will not actually work right now, but let's give it a try this way and see how much further we can get.
   - **Full Setup**: You will need the outputs from running the AWS CDK deployment. `ChimeActionsUserAccessKeyId`, `ChimeActionsUserSecretAccessKey`, and `ChimeNotificationsTopic` are found in the `Outputs` tab for the `<prefix>-chime` stack that was deployed in `us-east-1 (N. Virginia)`, and most of the rest of the `AWS_...` environment variable values come from the `Outputs` for the `<prefix>-main` stack deployed to the default region.

Now return to the main README.

## Production: Creating a Google Cloud project

If you or your users will be uploading recorded videos to YouTube, you will need
a Google Cloud project to provide access to the YouTube Data API with OAuth2.

1. Create a new project in [Google Cloud Platform](https://cloud.google.com/).
1. Enable the [YouTube Data API v3](https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com)
1. Create a new [OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials)
1. Set the _Authorised JavaScript origins_ `URIs` to the URI at which the frontend is hosted.
1. Set _Authorised redirect URIs_ `URIs` to the `<frontend uri>/googleoauth`.

## Local Development

See root ReadMe instructions for local development for which tasks to run.

If the environment configuration changes, or for example, the `package.json`
commands change, then you will need to restart tasks for this microservice.

## Testing

We use [Jest](https://jestjs.io/docs/en/getting-started) and
[SuperTest](https://www.npmjs.com/package/supertest). SuperTest provides an easy
way to test the express server functions.

## Remote Deployment

Heroku apps are linked to the repo and pull from the branches listed below.

| Branch  | Heroku App |
| ------- | ---------- |
| develop | ci-testing |
| staging | staging    |
| main    | production |

Heroku deployment is a little tricky because this is a monorepo.

- A single heroku app will have multiple containers, one or more for each
  microservice. The root `Procfile` is what Heroku uses to identify what
  services to start and thus which scripts to run.
- The `heroku-postbuild` script in the root `package.json` overrides Heroku Node
  Buildpack's default build task so that we can build each micro-service
  independently.
- The `postinstall` script in the root `package.json` not only makes development
  installs easier, but is essential for Heroku to successfully install and
  manage packages in the root and all micro-services.

## Notes

- The `Procfile` is used by Heroku to start this service. It exists in the
  `clowdr` root directory points at the compiled `build/server.js`.

## Heroku App Configuration

Connect to Github for auto-deployment of a branch. Configure environment
variables according to [the table below](#actions-service-configuration).

## Actions Service Configuration

Note: `AWS_` values come from the outputs of your AWS CloudFormation deployment. See [`aws/README.md`](../../aws/README.md)

| Key                                              | Value                                                                                                                                                                  | Source                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| AUTH0_API_DOMAIN                                 | `<auth0-subdomain>.auth0.com`                                                                                                                                          | Auth0                    |
| AUTH0_AUDIENCE                                   | `hasura`                                                                                                                                                               | literal                  |
| AUTH0_ISSUER_DOMAIN                              | `https://<auth0-subdomain>.auth0.com/`                                                                                                                                 | Auth0                    |
| HASURA_ADMIN_SECRET                              | Hasura admin secret (used for queries/mutations to Hasura, you can choose this value freely)                                                                           | `hasura/config.yaml`     |
| EVENT_SECRET                                     | Event trigger secret (used to verify Hasura events, must match the value in `hasura/config.yaml`)                                                                      | `hasura/config.yaml`     |
| CORS_ORIGIN                                      | The domain of the frontend website; may be localhost for local development (e.g. `localhost:3000` or `in.midspace.app`)                                                | literal                  |
| STOP_EMAILS_CONTACT_EMAIL_ADDRESS                | The email address users should contact when they received unexpected emails (e.g. `stop-emails@example.org`)                                                           | arbitrary                |
| FAILURE_NOTIFICATIONS_EMAIL_ADDRESS              | The email address the system should send notifications when errors occurr, such as failing to process a video.                                                         | arbitrary                |
| GRAPHQL_API_SECURE_PROTOCOLS                     | Boolean. Default: true. Whether to use https/wss or not.                                                                                                               | literal                  |
| GRAPHQL_API_DOMAIN                               | The domain and port of the GraphQL server; may be localhost for local development (Hasura, e.g. `localhost:8080` or a Hasura Cloud domain)                             | literal or Hasura Cloud  |
| HOST_SECURE_PROTOCOLS                            | Whether the actions service public URL uses https (should be `true`)                                                                                                   | literal                  |
| HOST_DOMAIN                                      | The public domain of the actions service (e.g. your actions Packetriot/ngrok URL)                                                                                      | `pktriot.json`           |
| AWS_PREFIX                                       | The deployment prefix you are using for your AWS deployment. Same as `clowdr/stackPrefix` in the `cdk.context.json`                                                    | `aws/.env.<profile>`     |
| AWS_REGION                                       | The AWS region to operate in (e.g. `eu-west-1`)                                                                                                                        | `~/.aws/config`          |
| AWS_CHIME_ACTIONS_USER_ACCESS_KEY_ID             | The access key ID for your chime stack AWS user                                                                                                                        | CDK `chime` stack output |
| AWS_CHIME_ACTIONS_USER_SECRET_ACCESS_KEY         | The secret access key for your chime stack AWS user                                                                                                                    | CDK `chime` stack output |
| AWS_CHIME_NOTIFICATIONS_TOPIC_ARN                | The ARN of the SNS topic for Chime notifications                                                                                                                       | CDK `chime` stack output |
| AWS_ACTIONS_USER_ACCESS_KEY_ID                   | The secret access key for your main stack AWS user                                                                                                                     | CDK `main` stack output  |
| AWS_CONTENT_BUCKET_ID                            | The S3 bucket ID for content storage                                                                                                                                   | CDK `main` stack output  |
| AWS_CHIME_MANAGER_ROLE_ARN                       | The IAM role providing management access to Amazon Chime (but comes from `main` stack output!)                                                                         | CDK `main` stack output  |
| AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN   | The IAM role to be passed to Elastic Transcoder                                                                                                                        | CDK `main` stack output  |
| AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN          | The ARN of the SNS topic for Elastic Transcoder notifications                                                                                                          | CDK `main` stack output  |
| AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID            | The ID of the security group to be used for MediaLive RTMP Push inputs                                                                                                 | CDK `main` stack output  |
| AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaLive notifications                                                                                                                   | CDK `main` stack output  |
| AWS_MEDIALIVE_SERVICE_ROLE_ARN                   | The IAM role to be passed to MediaLive                                                                                                                                 | CDK `main` stack output  |
| AWS_MEDIACONVERT_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaConvert                                                                                                                              | CDK `main` stack output  |
| AWS_MEDIACONVERT_API_ENDPOINT                    | The customer-specific MediaConvert endpoint (Optional)                                                                                                                 | customer-specific        |
| AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaPackage                                                                                                                              | CDK `main` stack output  |
| AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN | The ARN of the SNS topic for MediaPackage harvest job notifications                                                                                                    | CDK `main` stack output  |
| AWS_TRANSCRIBE_SERVICE_ROLE_ARN                  | The IAM role to be passed to Transcribe                                                                                                                                | CDK `main` stack output  |
| AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaConvert notifications                                                                                                                | CDK `main` stack output  |
| AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN           | The ARN of the SNS topic for transcription notifications                                                                                                               | CDK `main` stack output  |
| AWS_PUBLIC_TRANSCRIBE_USER_ACCESS_KEY_ID             |  | CDK `main` stack output |
| AWS_PUBLIC_TRANSCRIBE_USER_SECRET_ACCESS_KEY         |  | CDK `main` stack output |
| AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME          | The name of the CloudFront (separate AWS service from CloudFormation!) distribution obtained from deploying the Serverless Image Handler stack (e.g. `f9da4dbs83dnsl`) | AWS CloudFront           |
| AWS_IMAGES_SECRET_ACCESS_ROLE_ARN                | The ARN of the role for accessing the Serverless Image Handler secret.                                                                                                 | CDK `img` stack output   |
| AWS_IMAGES_SECRET_ARN                            | The ARN of the secret for the Serverless Image Handler.                                                                                                                | CDK `img` stack output   |
| OPENTOK_API_KEY                                  | Your Vonage Video API key (project API key, displayed in multicolored box at top of Vonage project page)                                                               | Vonage Project Settings  |
| OPENTOK_API_SECRET                               | Your Vonage Video API secret, displayed in multicolored box at top of Vonage project page                                                                              | Vonage Project Settings  |
| VONAGE_WEBHOOK_SECRET                            | A random token included in the URL for Vonage webhook calls                                                                                                            | Vonage Project Settings  |
| GOOGLE_CLIENT_ID                                 | The OAuth Client ID from your Google Cloud Platform project (Only if uploading videos to YouTube)                                                                      | Google Cloud             |
| GOOGLE_CLIENT_SECRET                             | The OAuth Client secret form your Google Cloud Platform project (Only if uploading videos to YouTube)                                                                  | Google Cloud             |
