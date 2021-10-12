# AWS Setup

This article outlines our recommended approach to setting up your AWS Organization.

## Production environments

In a production environment, it's important to set up your AWS account correctly for security.

We do not document the process in detail here because it is a) likely to change over time and b) subject to your own organisational preferences. However, we do outline a basic recommended setup.

- Structure your AWS organization to separate concerns between different accounts.
  - Administrative accounts, production infrastructure accounts and developer sandboxes should be isolated.
  - Do not deploy any infrastructure in the root/management account.
  - Consider using AWS Control Tower and Customizations for AWS Control Tower to enforce organisation-wide policies.
    - Note: in future we may provide ready-made SCP policies.
  - You should only deploy one Midspace instance per AWS account. You will probably want to create a sandbox account for each developer on your team.
  - You may find this guide useful: _[How to configure a production-grade AWS account structure using Gruntwork AWS Landing Zone](https://gruntwork.io/guides/foundations/how-to-configure-production-grade-aws-account-structure/#what-is-an-aws-account-structure)_
- Use AWS SSO, and not IAM users.
  - Some of your users will have highly privileged access to AWS. Create separate AWS SSO users for their admin activities and development work.
    - This ensure that development work happens in a relatively low-privilege context.
  - Make sure to configure and note your _User Portal URL_. This is where you log in and is also referred to as the `sso_start_url`.
  - Enforce MFA for user login.
- Avoid some common user-related pitalls.
  - Do not create IAM users with access keys and issue those credentials to your users.
    - If you decide to do this, avoid attaching policies directly to the user. Use roles instead.
  - Do not use root users for day-to-day work.

### Creating a new user

- Create an SSO user in the AWS SSO dashboard.
  - It should be assigned the `AWSAdministratorAccess` permission set on the accounts the user wants to deploy Midspace to.
  - The user will be automatically invited to set up their SSO user.
- Issue the following details to the user:
  - `sso_start_url`: your AWS SSO login URL. It takes the form `https://<myorg>.awsapps.com/start`.
  - `sso_region`: e.g. `eu-west-1`.
  - `sso_account_id`: the numeric ID of the AWS account your SSO user has been granted access to.

## Developer sandbox

If you are administrating your own AWS account and you are certain that you will never deploy a production instance, you can consider a cut-down account setup.

- Do not use AWS Organizations - just use the management account for everything.
- Create an IAM user with the `AdministratorAccess` policy attached and use it for all day-to-day tasks.
- Do not use the root user (unless absolutely necessary).
- We still recommend setting up AWS SSO for login (as above).
