# Midspace: AWS

AWS infrastructure-as-code for the Midspace app.

## Pre-requisites

1. An [AWS](https://aws.amazon.com/) account.
   - See [Setting up AWS](#setting-up-aws).
1. The [AWS CLI](https://aws.amazon.com/cli/)
   - Configure the CLI with your AWS credentials. See [Setting up AWS](#aws-cli-setup).
1. Install [aws-vault](https://github.com/99designs/aws-vault).
   - This is a utility which allows you to log in, generate temporary credentials, store them securely and pass them into other applications.
   - On macOS, install with `brew install aws-vault`.

## Setting up

1. `cd` into the `aws` folder
1. Install npm modules: `npm i`
1. Configure an env file for each instance of Midspace you want to deploy (e.g. personal sandbox, staging, production).
   - The env file must be named `.env.<profile>`, where `<profile>` is the name of an AWS profile that you configured.
   - You can deploy multiple Midspace instances to the same AWS account by setting a different `STACK_PREFIX` in the corresponding env file.
1. Bootstrap your AWS account by running the `Bootstrap AWS account` VSCode task.

### Deploying the main AWS stacks

The stack `<prefix>-main` deploys the main infrastructure for the Clowdr app (e.g. S3 buckets, permissions for transcode/transcribe etc.)

The stack `<prefix>-chime` deploys AWS infrastructure needed in `us-east-1` to communicate with the Chime control plane.

1. Run the `Deploy to AWS` VSCode task to deploy the Midspace infrastructure to your account. You will be asked
1. Make a note of the various output values. These are required as environment variables when setting up the actions service.

## Setting up AWS

There are many ways to set up an AWS account, and the choices you make are critical for security. If you plan to run a 'production' Midspace instance, we highly recommend that you do your own research. Here are some suggestions:

- A useful template for structuring AWS accounts: _[How to configure a production-grade AWS account structure using Gruntwork AWS Landing Zone](https://gruntwork.io/guides/foundations/how-to-configure-production-grade-aws-account-structure/#what-is-an-aws-account-structure)_
- If you choose to use IAM users + assume role + a bastion account, you should use something like [aws-vault](https://github.com/99designs/aws-vault) to increase the security of credential storage.
- You may also choose to use AWS SSO (our recommended method). This avoids storing any long-term credentials on disk.
  - We recommend using separate AWS SSO accounts for admin activities and development work. This ensure that you are doing development work in a relatively low-privilege context.
- Make use of AWS Organizations, and consider using AWS Control Tower.
- Do not deploy any infrastructure in the root/management account.
- Do not use root users for day-to-day work.
- MFA is absolutely critical. Make sure it is enforced.

## AWS CLI Setup

You may wish to deploy multiple instances of Midspace (e.g. personal sandbox, staging, production). Each instance must be associated with a different named profile in the AWS CLI config.

### Method 1 (recommended)

This method is strongly recommended because it only ever stores temporary credentials on your local disk.

1. Set up AWS SSO for your AWS Organization.

   - If you are using a sub-account of a larger organisation, this should have been done for you. You should request SSO login details from your administrator.
   - Make sure to configure and note your _User Portal URL_. This is where you log in and is also referred to as the `sso_start_url`.
   - Note: in future we plan to provide ready-made SCP policies to help you set this up securely.
   - Each SSO user should have the `AWSAdministratorAccess` permission set on the accounts it can deploy Midspace to.

1. Add a named profile to [`~/.aws/config`](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) for your SSO user. For example:

   ```ini
   [profile sandbox]
   sso_start_url = https://midspace.awsapps.com/start
   sso_region = eu-west-1
   region = eu-west-1
   sso_account_id = 123456789000
   sso_role_name = AWSAdministratorAccess
   ```

   You will need to modify this example configuration to match your desired setup. The `sso_start_url` will be in the AWS Single Sign-On invitation email you received, and the `sso_account_id` is in your AWS account settings page after you've logged in.

1. Test that your named profile is configured properly by using `aws-vault` to log into your AWS account. Run `aws-vault login sandbox` (replacing `sandbox` with the name you chose for your profile) - this should open a web browser and allow you to log in to AWS.
1. You can now run AWS CLI commands like so: `aws-vault exec sandbox -- aws s3 ls`.

### Method 2 (not recommended)

This method is not recommended because it stores long-term credentials on your local disk.

1. Create an IAM user with `AdministratorAccess` or similar permissions.

   - You will use this IAM user to deploy your infrastructure, so it needs to be able to perform all of the required actions (e.g. creating S3 buckets, modifying IAM users, CloudFormation and so on.)
   - It is _strongly_ recommended to enable MFA for this user.

1. Follow the AWS CLI documentation to configure your `~/.aws/credentials` file for this IAM user.

   - If you are using MFA, set up
     [aws-mfa](https://github.com/broamski/aws-mfa) so that you can easily
     generate credentials.
   - With aws-mfa, you can specify (for example) a `sandbox-long-term` profile if you want the profile to be called `sandbox` when you actually use it.

1. Configure your `~/.aws/config` file to specify the region you want to
   deploy to by default.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
