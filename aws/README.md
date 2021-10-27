# Midspace: AWS

AWS infrastructure-as-code for the Midspace app.

You must set up AWS even when running a local development environment, as Midspace uses some AWS services (e.g. MediaLive) that cannot be simulated locally.

## Pre-requisites

1. An [AWS](https://aws.amazon.com/) account.
   - Are you administrating the AWS account? Read [AWS Setup](../docs/aws-setup.md) first.
   - If you are using an AWS account administered by someone else, they should read the above article and provide you with credentials.
1. The [AWS CLI](https://aws.amazon.com/cli/) and an appropriate system for managing your credentials securely, like [`aws-vault`](https://github.com/99designs/aws-vault).
   - We strongly recommended to follow the secure setup outlined below.

## AWS CLI Setup and Authentication

We strongly recommended to use `aws-vault` to securely manage AWS credentials on your development machine.

If your AWS account uses the [recommended setup](../docs/aws-setup.md), the system will work as follows:

- You have AWS SSO credentials that allow you to administer the AWS account where you will be deploying Midspace.
- The SSO configuration (username + login URL) will be stored in `~/.aws/config`.
- When credentials are needed, `aws-vault` is used to log in via AWS SSO and retrieve a set of temporary credentials.
- These temporary credentials are stored securely (method depends on your operating system), and `aws-vault` can supply them to the AWS CLI/CDK when needed.

You may wish to deploy multiple instances of Midspace (e.g. personal sandbox, staging, production). For each instance, you must create a different named profile in the AWS CLI config. Each profile must have a corresponding `.env.<profile>` env file that contains any instance-specific deployment configuration.

To configure a single profile/instance, follow these steps:

1. Install [`aws-vault`](https://github.com/99designs/aws-vault).
   - On macOS, you can use `brew install aws-vault`.
   - On Windows, you can use `choco install aws-vault` or download the executable and place it in a folder that is listed in the `PATH` environment variable.
1. Request (or generate, if you are an administrator) the SSO credentials to gain access to the AWS account where you want to deploy Midspace.

   - If you are deploying to a sub-account of a larger organisation, your administrator should do this for you.
   - If you do not have an SSO user yet, you will receive an email from AWS inviting you to set it up.
   - Else, the permissions can simply be added to your existing SSO user.
   - You should receive the following details:
     - `sso_start_url`: this is the URL where you log into your organisation's AWS SSO. It takes the form `https://<myorg>.awsapps.com/start`
     - `sso_region`: e.g. `eu-west-1`
     - `sso_account_id`: the numeric ID of the AWS account your SSO user has been granted access to.

1. Using these credentials, add a named profile to [`~/.aws/config`](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html). In this case, we're using the name `sandbox`, but you can choose whatever you like.

   - For example:

     ```ini
     [profile sandbox]
     credential_process = /opt/homebrew/bin/aws-vault exec sandbox-internal --json
     region = eu-west-1

     [profile sandbox-internal]
     sso_start_url = https://myorg.awsapps.com/start
     sso_region = eu-west-1
     region = eu-west-1
     sso_account_id = 123456789000
     sso_role_name = AWSAdministratorAccess
     ```

   - The path to `aws-vault` may be different, depending on your installation method.
   - You will need to modify this configuration to match your personal credentials. The `sso_start_url` will be in the AWS Single Sign-On invitation email you received, and the `sso_account_id` is in your AWS account settings page after you've logged in.
   - The example `sandbox-internal` profile contains the actual SSO configuration. The `sandbox` profile is a wrapper that allows the AWS CLI to automatically call out to `aws-vault` to retrieve the credentials ([see AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html)).
   - The AWS resources will be deployed to the region specified in the profile you use.

1. Test that your named profile is configured properly by using `aws-vault` to log into your AWS account. Run `aws-vault login sandbox-internal` (replacing `sandbox-internal` with the name you chose for your profile) - this should open a web browser and allow you to log in to AWS.
1. You can now run AWS CLI commands like so:
   - `aws s3 ls --profile sandbox`: Uses the AWS CLI directly. AWS CLI calls out to the `credential_process` (in our case, `aws-vault`) to retrieve the needed credentials.
   - `aws-vault exec sandbox-internal -- aws s3 ls`: Uses `aws-vault` to retrieve the credentials and pass them into the AWS CLI.

<details>
<summary>An insecure method</summary>

If you just want to get up and running as quickly as possible, and you do not care about security at all, you don't need to use the SSO setup outlined above. Note that the method outlined below will store long-term credentials on your local disk.

1. Create an IAM user with `AdministratorAccess` or similar permissions.

   - You will use this IAM user to deploy your infrastructure, so it needs to be able to perform all of the required actions (e.g. creating S3 buckets, modifying IAM users, CloudFormation and so on.)
   - It is _strongly_ recommended to enable MFA for this user.

1. Create an access key for the IAM user.
1. Follow the AWS CLI documentation to configure your `~/.aws/credentials` file with the access key.

   - If you are using MFA, you can use [`aws-mfa`](https://github.com/broamski/aws-mfa) to easily generate temporary credentials from your access key.
   - Using `aws-mfa`, you can specify (for example) a `sandbox-long-term` profile if you want the profile to be called `sandbox` when you actually use it.

1. Configure your `~/.aws/config` file to specify the region you want to
   deploy to by default.

</details>

## Setting up local env files

1. `cd` into the `aws` folder
1. Install npm modules: `npm i`
1. `cp env.sandbox.example env.sandbox` and fill in environment variable values following the instructions in comments `env.sandbox`. It is recommended to generate a secure random `VONAGE_API_KEY`.
1. Optional Configure additional env files for each instance of Midspace you want to deploy (e.g. personal sandbox, staging, production).
   - The env file must be named `.env.<profile>`, where `<profile>` is the name of an AWS profile that you configured.
   - You can deploy multiple Midspace instances to the same AWS account by setting a different `STACK_PREFIX` in the corresponding env file. This is, however, not recommended.
1. Bootstrap your AWS account by running the `AWS -- Bootstrap account` VSCode task.

## Deploying the main AWS CloudFormation stacks

**Info:** The stack `<prefix>-main` contains the main infrastructure for the Midspace app (e.g. S3 buckets, permissions for transcode/transcribe etc.). The stack `<prefix>-chime` contains AWS infrastructure needed in `us-east-1` to communicate with the Chime control plane.

1. Run the `AWS -- Deploy stacks` VSCode task to deploy the Midspace infrastructure to your account. You will be asked for the name of the AWS profile you want to deploy to.
1. Make a note of the various output values. These are required as environment variables when setting up the actions service and other services. They can be viewed later by logging in to AWS CloudFormation, clicking the stack in question, and then clicking the Outputs tab.

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
1. Choose the Stack name to be something unique, preferably using your `STACK_PREFIX` from i.e. `aws/.env.sandbox` or the relevant environment file.
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

## Useful commands

- VSCode task: `AWS -- Bootstrap account` - bootstraps the chosen profile so that it is ready for CDK deployments.
- VSCode task: `AWS -- Deploy stacks` - deploy all stacks to the chosen profile.
