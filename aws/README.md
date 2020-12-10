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
1. Run `cdk deploy` to deploy the Clowdr infrastructure to your account
1. Make a note of the three outputs: `AccessKeyId`, `SecretAccessKey` and `BucketId`. You will need these when setting up the actions service.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
