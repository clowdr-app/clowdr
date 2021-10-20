# Clowdr: Actions Service

Express server designed to run on Heroku and serve action calls from Hasura.
Eventually this may be split into multiple microservices.

## Pre-requisities

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. **Full Setup**: Follow the AWS setup instructions in
   [aws/README.md](../../aws/README.md)
   **Quick Setup**: Copy `services/actions/.env.example` to
   `services/actions/.env`, edit the latter and set all variables starting
   with `AWS` to `XXX`.
   BCP: This will not actually work right now, but let's give it a try this way and see how much further we can get.
3. **Full Setup**: Create a [SendGrid](https://www.sendgrid.com) account and
   an API key for it.
4. Create a free [Vonage Video
   API](https://www.vonage.co.uk/communications-apis/video/) account; then
   go to `Projects > Create New Project`, choose "Custom", and make a note
   of the API key that is generated.
5. **Full Setup**: Deploy the AWS Image
   Handler as described [below](#deploying-the-image-handler).
6. **Full Setup**: Create a Google Cloud project as described
   [below](#creating-a-google-cloud-project).

## Deploying the image handler

We use the AWS `serverless-image-handler` template for processing uploaded profile images. These are the steps to deploy it:

1. Create a new secret in AWS Secrets Manager: - you can use any secret name and secret key you like.
   1. Select `Other type of secrets` and `Secret key/value`
   1. You can use any key you like, perhaps `<prefix>-image-handler`.
   1. Choose a secure random string for the value and make a note of it.
   1. Click `Next` and choose any secret name you like that will associate it with this stack and the image handler.
   1. Click `Next` again, leave automatic rotation disabled, and click `Next` again, and finally `Store`.
1. In AWS CloudFormation, create a stack:
   1. Click `Create Stack` -> `With New Resources`
   1. Select `Template is ready` and `Template Source`: `Amazon S3 URL`. Use this template:
   1. `https://solutions-reference.s3.amazonaws.com/serverless-image-handler/latest/serverless-image-handler.template`
1. Choose the Stack name to be something unique, preferably using your `STACK_PREFIX`.
1. Set the parameters as follows:
   - `CorsEnabled`: Yes
   - `CorsOrigin`: `http://localhost` if running locally, or an appropriate origin.
   - `SourceBuckets`: the name of your content bucket (i.e. `AWS_CONTENT_BUCKET_ID`. This is visible in the `Outputs` tab for your `<prefix>-main` stack in the CloudFormation console.)
   - `DeployDemoUI`: No
   - `LogRetentionPeriod`: 1
   - `EnableSignature`: Yes
   - `SecretsManagerSecret`: the name of the secret you created earlier
   - `SecretsManagerKey`: the key of the secret you created earlier
   - `EnableDefaultFallbackImage`: No
   - `AutoWebP`: Yes
1. Deploy the stack and wait for creation to complete.
1. Make a note of the `ApiEndpoint` output.

## Creating a Google Cloud project

We use a Google Cloud project to provide access to the YouTube Data API with OAuth2.

1. Create a new project in [Google Cloud Platform](https://cloud.google.com/).
1. Enable the [YouTube Data API v3](https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com)
1. Create a new [OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials)
1. Set the _Authorised JavaScript origins_ `URIs` to the URI at which the frontend is hosted.
1. Set _Authorised redirect URIs_ `URIs` to the `<frontend uri>/googleoauth`.

# Setting Up

1. Copy the `services/actions/.env.example` to `services/actions/.env`
1. Configure your `.env` according to the [Actions Service
   Configuration](#actions-service-configuration) table below
   - **Full Setup**: You will need the outputs from running the AWS CDK
     deployment. **Quick setup**: Set all the environment variables related
     to AWS to `XXXX`.
   - `ChimeActionsUserAccessKeyId`, `ChimeActionsUserSecretAccessKey`, and `ChimeNotificationsTopic` are found in the `Outputs` tab for the `<prefix>-chime` stack that was deployed in `us-east-1 (N. Virginia)`, and most of the rest of the `AWS_...` environment variable values come from the `Outputs` for the `<prefix>-main` stack deployed to the default region.
1. Use the Hasura Console to add your Sendgrid API credentials to the system configuration. Open the `system.Configuration` table and insert the following rows:
   | Key | Value |
   | ------- | ---------- |
   | `SENDGRID_API_KEY` | your SendGrid API key, as a JSON string (i.e. wrapped in double quotes) |
   | `SENDGRID_SENDER` | the 'from' email address you wish to use for emails sent by Clowdr, as a JSON string |
   | `SENDGRID_REPLYTO` | the 'reply-to' email address you wish to use for emails sent by Clowdr, as a JSON string |
   | `HOST_ORGANISATION_NAME` | Name of your organization to appear in email footers, as a JSON string |
   | `STOP_EMAILS_CONTACT_EMAIL_ADDRESS` | Contact address for emails received in error, as a JSON string |
   | `DEFAULT_FRONTEND_HOST` | Either `http://localhost:3000` or your public frontend URL, as a JSON string |
1. Run the `Actions service - GraphQL Codegen` task in VSCode to generate the GraphQL query code (Hasura must be running when you do this).

Now return to the main README.

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

BCP:

- If I haven't done the Auth0 step yet, what should I do with
  `<auth0-subdomain>`? (Ross says I will know this information later.
  But then there is an ordering problem in the instructions: I reached
  this point before I had done the Auth0 setup.)
- In general, many of these are puzzling if you don't know what they are /
  how to find them. The Value is no more informative than the Key.
- And wouldn't it be cleaner and easier to document all of these in the
  .env example file?

You will not have the information required for all environment variables yet. See the _Complete later_ column for whether you should come back and fill in a value later on.

| Key                                              | Value                                                                                                                                                                     | From CDK | Complete later |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| AUTH0_API_DOMAIN                                 | `<auth0-subdomain>.auth0.com`                                                                                                                                             |          | Yes            |
| AUTH0_AUDIENCE                                   | `hasura`                                                                                                                                                                  |          |
| AUTH0_ISSUER_DOMAIN                              | `https://<auth0-subdomain>.auth0.com/`                                                                                                                                    |          | Yes            |
| HASURA_ADMIN_SECRET                              | Hasura admin secret (used for queries/mutations to Hasura, you can choose this value freely)                                                                              |          |
| EVENT_SECRET                                     | Event trigger secret (used to verify Hasura events, you can choose this value freely)                                                                                     |          |
| FRONTEND_DOMAIN                                  | The domain of the frontend website (e.g. `localhost:3000` or `in.midspace.app`)                                                                                           |          | Yes            |
| STOP_EMAILS_CONTACT_EMAIL_ADDRESS                | The email address users should contact when they received unexpected emails (e.g. `stop-emails@example.org`)                                                              |          |
| FAILURE_NOTIFICATIONS_EMAIL_ADDRESS              | The email address the system should send notifications when errors occurr, such as failing to process a video.                                                            |          |
| GRAPHQL_API_SECURE_PROTOCOLS                     | Boolean. Default: true. Whether to use https/wss or not.                                                                                                                  |          |
| GRAPHQL_API_DOMAIN                               | The domain and port of the GraphQL server (Hasura)                                                                                                                        |          |
| HOST_SECURE_PROTOCOLS                            | Whether the actions service public URL uses https                                                                                                                         |          |
| HOST_DOMAIN                                      | The public domain of the actions service (e.g. your actions Packetriot/ngrok URL)                                                                                         |          | Yes            |
| AWS_PREFIX                                       | The deployment prefix you are using for your AWS deployment. Same as `clowdr/stackPrefix` in the `cdk.context.json`                                                       |          |
| AWS_ACCESS_KEY_ID                                | The access key ID for your AWS user                                                                                                                                       | Yes      |
| AWS_ACTIONS_USER_ACCESS_KEY_ID                   | The secret access key for your AWS user                                                                                                                                   | Yes      |
| AWS_REGION                                       | The AWS region to operate in                                                                                                                                              | Yes      |
| AWS_CONTENT_BUCKET_ID                            | The S3 bucket ID for content storage                                                                                                                                      | Yes      |
| AWS_CHIME_MANAGER_ROLE_ARN                       | The IAM role providing management access to Amazon Chime                                                                                                                  | Yes      |                |
| AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN   | The IAM role to be passed to Elastic Transcoder                                                                                                                           | Yes      |
| AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN          | The ARN of the SNS topic for Elastic Transcoder notifications                                                                                                             | Yes      |
| AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID            | The ID of the security group to be used for MediaLive RTMP Push inputs                                                                                                    | Yes      |
| AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaLive notifications                                                                                                                      | Yes      |
| AWS_MEDIALIVE_SERVICE_ROLE_ARN                   | The IAM role to be passed to MediaLive                                                                                                                                    | Yes      |
| AWS_MEDIACONVERT_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaConvert                                                                                                                                 | Yes      |
| AWS_MEDIACONVERT_API_ENDPOINT                    | The customer-specific MediaConvert endpoint                                                                                                                               | No       |
| AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaPackage                                                                                                                                 | Yes      |
| AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN | The ARN of the SNS topic for MediaPackage harvest job notifications                                                                                                       | Yes      |
| AWS_TRANSCRIBE_SERVICE_ROLE_ARN                  | The IAM role to be passed to Transcribe                                                                                                                                   | Yes      |
| AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaConvert notifications                                                                                                                   | Yes      |
| AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN           | The ARN of the SNS topic for transcription notifications                                                                                                                  | Yes      |
| AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME          | The name of the CloudFront (separate AWS service from CloudFormation!) distribution obtained from deploying the Serverless Image Handler template (e.g. `f9da4dbs83dnsl`) | No       |
| AWS_IMAGES_SECRET_VALUE                          | The value you manually entered into Secrets Manager.                                                                                                                      | No       |
| OPENTOK_API_KEY                                  | Your Vonage Video API key (project API key, displayed in multicolored box at top of Vonage project page)                                                                  |          |
| OPENTOK_API_SECRET                               | Your Vonage Video API secret, displayed in multicolored box at top of Vonage project page                                                                                 |          |
| VONAGE_WEBHOOK_SECRET                            | A random token (your choice!) to be sent with Vonage webhook calls                                                                                                        |          |
| GOOGLE_CLIENT_ID                                 | The OAuth Client ID from your Google Cloud Platform project                                                                                                               |          |
| GOOGLE_CLIENT_SECRET                             | The OAuth Client secret form your Google Cloud Platform project                                                                                                           |          |
