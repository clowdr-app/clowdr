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

## Creating a Google Cloud project

We use a Google Cloud project to provide access to the YouTube Data API with OAuth2.

1. Create a new project in Google Cloud Platform.
1. Enable the [YouTube Data API v3](https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com)
1. Create a mew [OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials)
1. Set the _Authorised JavaScript origins_ `URIs` to the URI at which the frontend is hosted.
1. Set _Authorised redirect URIs_ `URIs` to the `<frontend uri>/googleoauth`.

# Setting Up

1. Copy the `services/actions/.env.example` to `services/actions/.env`
1. Configure your `.env` according to the [Actions Service
   Configuration](#actions-service-configuration) table below
   - **Full Setup**: You will need the outputs from running the AWS CDK
     deployment. **Quick setup**: Set all the environment variables related
     to AWS to `XXXX`.

BCP: Why not put the table here? (Or, better, put all the information in
the table into comments in the example .env file.)

BCP: Not clear whether I am supposed to continue on to do the rest of the
file or whether I stop here and return to the main README... The convention
in some other READMEs is to explicitly mention which of the later sections
to look at, in the top-level list.

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

BCP (Ross): "HASURA_ADMIN_SECRET is self-defined - easiest to keep it to
XXXXX for a dev machine"

BCP (Ross): "Should EVENT_SECRET also be left as XXX? Yes, it probably
should. Actually, the event secret is also arbitrary, but you should
probably choose something like XXXY for development. (It's useful if it's
different from the admin secret)"  
BCP: Again, this should be the default in the example file.

BCP: Also, it would be great to reorganize the example file to put all "Full
Setup only" stuff at the end.

BCP: I think this is the first time I'm seeing the word OpenShot...

BCP: I think the HOST_DOMAIN Value explanation is the first time that ngrok
has been mentioned.

BCP: Is OPENTOK_API_KEY what Vonage calls "Project API key"?

| Key                                              | Value                                                                                                                         | From CDK |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| AUTH0_API_DOMAIN                                 | `<auth0-subdomain>.auth0.com`                                                                                                 |          |
| AUTH0_AUDIENCE                                   | `hasura`                                                                                                                      |          |
| AUTH0_ISSUER_DOMAIN                              | `https://<auth0-subdomain>.auth0.com/`                                                                                        |          |
| HASURA_ADMIN_SECRET                              | Hasura admin secret (used for queries/mutations to Hasura)                                                                    |          |
| EVENT_SECRET                                     | Event trigger secret (used to verify Hasura events)                                                                           |          |
| FRONTEND_DOMAIN                                  | The domain of the frontend website (e.g. `localhost:3000` or `app.clowdr.org`)                                                |          |
| STOP_EMAILS_CONTACT_EMAIL_ADDRESS                | The email address users should contact when they received unexpected emails (e.g. `stop-emails@example.org`)                  |          |
| FAILURE_NOTIFICATIONS_EMAIL_ADDRESS              | The email address the system should send notifications when errors occurr, such as failing to process a video.                |          |
| GRAPHQL_API_SECURE_PROTOCOLS                     | Boolean. Default: true. Whether to use https/wss or not.                                                                      |          |
| GRAPHQL_API_DOMAIN                               | The domain and port of the GraphQL server                                                                                     |          |
| SENDGRID_API_KEY                                 | Your SendGrid API Key                                                                                                         |          |
| SENDGRID_SENDER                                  | Your SendGrid sender email address                                                                                            |          |
| HOST_SECURE_PROTOCOLS                            | Whether the actions service public URL uses https                                                                             |          |
| HOST_DOMAIN                                      | The public domain of the actions service (e.g. your actions ngrok URL)                                                        |          |
| AWS_PREFIX                                       | The deployment prefix you are using for your AWS deployment. Same as `clowdr/stackPrefix` in the `cdk.context.json`           |          |
| AWS_ACCESS_KEY_ID                                | The access key ID for your AWS user                                                                                           | Yes      |
| AWS_SECRET_ACCESS_KEY                            | The secret access key for your AWS user                                                                                       | Yes      |
| AWS_REGION                                       | The AWS region to operate in                                                                                                  | Yes      |
| AWS_CONTENT_BUCKET_ID                            | The S3 bucket ID for content storage                                                                                          | Yes      |
| AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN   | The IAM role to be passed to Elastic Transcoder                                                                               | Yes      |
| AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN          | The ARN of the SNS topic for Elastic Transcoder notifications                                                                 | Yes      |
| AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID            | The ID of the security group to be used for MediaLive RTMP Push inputs                                                        | Yes      |
| AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaLive notifications                                                                          | Yes      |
| AWS_MEDIALIVE_SERVICE_ROLE_ARN                   | The IAM role to be passed to MediaLive                                                                                        | Yes      |
| AWS_MEDIACONVERT_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaConvert                                                                                     | Yes      |
| AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN                | The IAM role to be passed to MediaPackage                                                                                     | Yes      |
| AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN | The ARN of the SNS topic for MediaPackage harvest job notifications                                                           | Yes      |
| AWS_TRANSCRIBE_SERVICE_ROLE_ARN                  | The IAM role to be passed to Transcribe                                                                                       | Yes      |
| AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN            | The ARN of the SNS topic for MediaConvert notifications                                                                       | Yes      |
| AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN           | The ARN of the SNS topic for transcription notifications                                                                      | Yes      |
| AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME          | The name of the Cloudfront distribution obtained from deploying the Serverless Image Handler template (e.g. `f9da4dbs83dnsl`) | No       |
| AWS_IMAGES_SECRET_VALUE                          | The value you manually entered into Secrets Manager.                                                                          | No       |
| OPENSHOT_BASE_URL                                | The base URL of the OpenShot instance                                                                                         |          |
| OPENSHOT_USERNAME                                | The username you created for your OpenShot instance                                                                           |          |
| OPENSHOT_PASSWORD                                | The password you created for your OpenShot instance                                                                           |          |
| OPENTOK_API_KEY                                  | Your Vonage Video API key                                                                                                     |          |
| OPENTOK_API_SECRET                               | Your Vonage Video API secret                                                                                                  |          |
| VONAGE_WEBHOOK_SECRET                            | A random token (your choice!) to be sent with Vonage webhook calls                                                            |          |
| GOOGLE_CLIENT_ID                                 | The OAuth Client ID from your Google Cloud Platform project                                                                   |          |
| GOOGLE_CLIENT_SECRET                             | The OAuth Client secret form your Google Cloud Platform project                                                               |          |
