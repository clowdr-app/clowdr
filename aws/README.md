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

### Connecting to the OpenShot instance for manual setup

The OpenShot AWS infrastructure is structured to ensure that the OpenShot instance is only accessible via HTTPS on port 443. To achieve this, we put the OpenShot instance into an private VPC subnet. We then spin up an Application Load Balancer and use it to proxy the HTTP (port 80) endpoint on the OpenShot instance to a public HTTPS (port 443) endpoint.

However, we also need to access the OpenShot instance via SSH for some manual configuration tasks. To do this, we spin up a 'bastion host' in the public subnet. This is a small instance that simply acts as an SSH jump box into the private subnet.

Instead of keeping a permanent list of known keys on the bastion host, we use EC2 Instance Connect to connect to the bastion and then SSH Agent Forwarding to use our pre-created key pair (see above) to jump into the OpenShot instance.

We won't detail SSH Agent Forwarding in much detail here. The recommended setup for Windows users is to use KeePass and KeeAgent as an SSH agent, and Windows' built-in OpenSSH as SSH client. PuTTY will also work.

1. Generate a temporary key pair by running `ssh-keygen -t rsa -f temp`
1. Push the temporary public key to the bastion host by running `aws ec2-instance-connect send-ssh-public-key --instance-id <bastion host instance ID> --availability-zone <e.g. eu-west-1a> --instance-os-user ec2-user --ssh-public-key file://temp.pub`
   - The instance can be retrieved either from the EC2 console or from the CDK output
1. Now you have 60 seconds to connect to the bastion host before the public key is erased. Run `ssh -i temp ec2-user@<bastion host DNS name> -A`
   - `-A` enables agent forwarding
   - The host DNS name can be retrieved either from the EC2 console or from the CDK output
1. Last, we can connect to the OpenShot instance itself. Run `ssh ubuntu@<OpenShot instance private DNS>` at the bastion host terminal.
   - The OpenShot instance private DNS name can be retrieved either from the EC2 console or from the CDK output

### Setting up the OpenShot instance

To set up the OpenShot instance, we need to run through a wizard at the terminal. Once you are connected to the instance, run `config-openshot-cloud` [as per the OpenShot Cloud API documentation](https://cloud.openshot.org/doc/getting_started.html).

Choose the following options:

- Role: both
- Cloud username: cloud-admin
- Cloud password: choose a secure password and make a note of it
- AWS Access Key ID: `OpenShotAccessKeyId` from the CDK output
- AWS Secret Access Key: `OpenShotSecretAccessKey` from the CDK output
- AWS SQS Queue: `OpenShotAPIExportQueueName` from the CDK output
- AWS Region: the region you are deploying to (e.g. `eu-west-1`)
- Cloud API Public URL: `OpenShotLoadBalancerDnsName` from the CDK output

You can test that the instance is running by going to `https://<load balancer DNS name>/doc/`. Just accept the certificate error for this test.

Now point the domain for which you generated the certificate at the load balancer. This step will vary depending on how your DNS is set up.

Go to `https://<your domain>/cloud-admin/` and log in with the username and password created above. Use the admin panel to create a new user account with API-only access.

## SSH Tips

You can create an SSH config file to make it easier to connect to the OpenShot instance. For example:

```
Host clowdr_bastion
	HostName <bastion instance DNS name>
	User ec2-user
	IdentityFile ~/temp
	ForwardAgent yes

Host clowdr_openshot
	HostName <OpenShot instance private DNS name>
	ProxyJump clowdr_bastion
	User ubuntu
```

If you are using Windows, you currently need to [patch SSH](https://github.com/microsoft/vscode-remote-release/issues/18#issuecomment-507258777) for this to work.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## AWS Configuration

| Key                           | Value                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| clowdr/stackPrefix            | Prefix to be prepended to stack names (choose a unique name for each development environment)          |
| clowdr/region                 | Name of the AWS region to deploy to (e.g. eu-west-1)                                                   |
| clowdr/account                | ID of the AWS account to deploy to                                                                     |
| clowdr/openShotKeyPairName    | Name of the key pair you created earlier. Will be used for SSH access to the OpenShot API EC2 instance |
| clowdr/openShotCertificateArn | ARN of the certificate you created for your domain that will host the OpenShot API.                    |
