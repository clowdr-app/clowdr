# Clowdr: Actions Service

Express server designed to run on Heroku and serves action calls from Hasura.
Eventually this may be split into multiple microservices.

## Pre-requisities

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
1. You have followed the AWS setup instructions in [aws/README.md](../../aws/README.md)
1. You have created a [SendGrid](https://www.sendgrid.com) account and an API key for it.
1. You have create a [Vonage Video API](https://www.vonage.co.uk/communications-apis/video/) account and an API key for it.
1. You have deployed the [Image Handler](#deploying-the-image-handler) stack.

## Deploying the image handler

We use the AWS `serverless-image-handler` template for processing uploaded profile images. These are the steps to deploy it:

1. Create a new secret in AWS Secrets Manager - you can use any secret name and secret key you like. Choose a secure random string and make a note of it.
1. In AWS CloudFormation, create a stack from the template `https://solutions-reference.s3.amazonaws.com/serverless-image-handler/latest/serverless-image-handler.template`
1. Choose the Stack name to be something unique, preferably using your `AWS_PREFIX`.
1. Set the parameters as follows:

- `CorsEnabled`: Yes
- `CorsOrigin`: `http://localhost` if running locally, or an appropriate origin.
- `SourceBuckets`: the name of your content bucket (i.e. `AWS_CONTENT_BUCKET_ID`)
- `DeployDemoUI`: No
- `LogRetentionPeriod`: 1
- `EnableSignature`: Yes
- `SecretsManagerSecret`: the name of the secret you created earlier
- `SecretsManagerKey`: the key of the secret you created earlier
- `EnableDefaultFallbackImage`: No
- `AutoWebP`: Yes

1. Deploy the stack and wait for creation to copmlete.
1. Make a note of the `ApiEndpoint` output.

## Setting Up

1. Copy the `services/actions/.env.example` to `services/actions/.env`
1. Configure your `.env` according to the [Actions Service
   Configuration](#actions-service-configuration) table below
   - You will need the outputs from running the AWS CDK deployment

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

- The `package.json` in the `clowdr` root directory uses an NPM post-install
  hook to install dependencies in this directory too.
  - This is also necessary for the Heroku build
- The `Procfile` is used by Heroku to start this service. It exists in the
  `clowdr` root directory points at the compiled `build/server.js`.

## Heroku App Configuration

Connect to Github for auto-deployment of a branch. Configure environment
variables according to [the table below](#actions-service-configuration).

## Actions Service Configuration

Note: `AWS_` values come from the outputs of your AWS deployment. See [`aws/README.md`](../../aws/README.md)

| Key                                            | Value                                                                                                               | From CDK |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| AUTH0_API_DOMAIN                               | `<auth0-subdomain>.auth0.com`                                                                                       |          |
| AUTH0_AUDIENCE                                 | `hasura`                                                                                                            |          |
| AUTH0_ISSUER_DOMAIN                            | `https://<auth0-subdomain>.auth0.com/`                                                                              |          |
| HASURA_ADMIN_SECRET                            | Hasura admin secret (used for queries/mutations to Hasura)                                                          |          |
| EVENT_SECRET                                   | Event trigger secret (used to verify Hasura events)                                                                 |          |
| FRONTEND_DOMAIN                                | The domain of the frontend website (e.g. `localhost:3000` or `app.clowdr.org`)                                      |          |
| STOP_EMAILS_CONTACT_EMAIL_ADDRESS              | The email address users should contact when they received unexpected emails (e.g. `stop-emails@example.org`)        |          |
| FAILURE_NOTIFICATIONS_EMAIL_ADDRESS            | The email address the system should send notifications when errors occurr, such as failing to process a video.      |          |
| GRAPHQL_API_SECURE_PROTOCOLS                   | Boolean. Default: true. Whether to use https/wss or not.                                                            |          |
| GRAPHQL_API_DOMAIN                             | The domain and port of the GraphQL server                                                                           |          |
| SENDGRID_API_KEY                               | Your SendGrid API Key                                                                                               |          |
| SENDGRID_SENDER                                | Your SendGrid sender email address                                                                                  |          |
| HOST_SECURE_PROTOCOLS                          | Whether the actions service public URL uses https                                                                   |          |
| HOST_DOMAIN                                    | The public domain of the actions service (e.g. your actions ngrok URL)                                              |          |
| AWS_PREFIX                                     | The deployment prefix you are using for your AWS deployment. Same as `clowdr/stackPrefix` in the `cdk.context.json` |          |
| AWS_ACCESS_KEY_ID                              | The access key ID for your AWS user                                                                                 | Yes      |
| AWS_SECRET_ACCESS_KEY                          | The secret access key for your AWS user                                                                             | Yes      |
| AWS_REGION                                     | The AWS region to operate in                                                                                        | Yes      |
| AWS_CONTENT_BUCKET_ID                          | The S3 bucket ID for content storage                                                                                | Yes      |
| AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN | The IAM role to be passed to Elastic Transcoder                                                                     | Yes      |
| AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN        | The ARN of the SNS topic for Elastic Transcoder notifications                                                       | Yes      |
| AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID          | The ID of the security group to be used for MediaLive RTMP Push inputs                                              | Yes      |
| AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN          | The ARN of the SNS topic for MediaLive notifications                                                                | Yes      |
| AWS_MEDIALIVE_SERVICE_ROLE_ARN                 | The IAM role to be passed to MediaLive                                                                              | Yes      |
| AWS_MEDIACONVERT_SERVICE_ROLE_ARN              | The IAM role to be passed to MediaConvert                                                                           | Yes      |
| AWS_TRANSCRIBE_SERVICE_ROLE_ARN                | The IAM role to be passed to Transcribe                                                                             | Yes      |
| AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN          | The ARN of the SNS topic for MediaConvert notifications                                                             | Yes      |
| AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN         | The ARN of the SNS topic for transcription notifications                                                            | Yes      |
| AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME        | The name of the Cloudfront distribution obtained from deploying the Serverless Image Handler template               | No       |
| AWS_IMAGES_SECRET_VALUE                        | The value you manually entered into Secrets Manager.                                                                | No       |
| OPENSHOT_BASE_URL                              | The base URL of the OpenShot instance                                                                               |          |
| OPENSHOT_USERNAME                              | The username you created for your OpenShot instance                                                                 |          |
| OPENSHOT_PASSWORD                              | The password you created for your OpenShot instance                                                                 |          |
| OPENTOK_API_KEY                                | Your Vonage Video API key                                                                                           |          |
| OPENTOK_API_SECRET                             | Your Vonage Video API secret                                                                                        |          |
| VONAGE_WEBHOOK_SECRET                          | A random token (your choice!) to be sent with Vonage webhook calls                                                  |          |
| AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME        | The `ApiEndpoint` output from your Serverless Image Handler stack                                                   |          |
| AWS_IMAGES_SECRET_VALUE                        | The secret created for your Serverless Image Handler                                                                |          |
