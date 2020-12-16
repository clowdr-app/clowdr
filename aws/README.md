# Clowdr: AWS

AWS infrastructure-as-code for the Clowdr app.

## Pre-requisites

1. An [AWS](https://aws.amazon.com/) account.
1. The [AWS CLI](https://aws.amazon.com/cli/)
   - Follow the AWS Documentation to configure the CLI with credentials for your personal admin account.
   - Using MFA? Set up [aws-mfa](https://github.com/broamski/aws-mfa) so that you can easily generate credentials.
   - Configure your `~/.aws/config` file to specify the region you want to deploy to by default.

## Setting up

1. Install the CDK CLI: `npm install -g aws-cdk`
1. `cd` into the `aws` folder
1. Install npm modules: `npm i`
1. Configure `cdk.context.json` according to [AWS Configuration](#aws-configuration) below

### Deploying the main AWS stack

The stack `<prefix>-main` deploys the main infrastructure for the Clowdr app (e.g. S3 buckets, permissions for transcode/transcribe etc.)

1. Run `cdk deploy <prefix>-main` to deploy the Clowdr infrastructure to your account
   - `<prefix>` is the value you have chosen for `clowdr/stackPrefix`
1. Make a note of the various output values. These are required as environment variables when setting up the actions service.

### Deploying the OpenShot AWS stack

The stack `<prefix>-openshot` deploys the infrastructure required for the OpenShot Cloud API. It requires some manually-created resources as inputs, so we manage its lifecycle separately from the main stack.

1. Generate a new EC2 key pair.
   - This will be used to access the OpenShot Cloud API EC2 instance.
   - Make a note of the name of the key pair.
   - Save the private key in a safe place in case you need to SSH into the OpenShot instance later.
1. Use AWS Certificate Manager to generate a certificate for a domain of your choice where the OpenShot Cloud API will be hosted.
   - Make a note of the ARN of the certificate.
1. Run `cdk deploy <prefix>-openshot` to deploy the OpenShot stack to AWS.
1. Find the deployed EC2 instance in the AWS control panel. Connect to it

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## AWS Configuration

| Key                        | Value                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| clowdr/stackPrefix         | Prefix to be prepended to stack names (choose a unique name for each development environment)          |
| clowdr/region              | Name of the AWS region to deploy to (e.g. eu-west-1)                                                   |
| clowdr/account             | ID of the AWS account to deploy to                                                                     |
| clowdr/openShotKeyPairName | Name of the key pair you created earlier. Will be used for SSH access to the OpenShot API EC2 instance |
