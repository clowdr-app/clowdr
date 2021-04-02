# Clowdr: Playout Service

The playout service controls the video broadcast pipelines for Clowdr. Currently, it can deploy and tear down the AWS infrastructure at the correct times. In future, it will be extended to handle schedule sync.

It is built with Nest.js and the AWS CDK.

## Pre-requisites

None.

## Setting Up

1. Copy the `services/playout/.env.example` to `services/playout/.env`
1. Configure your `.env` file according to the embedded instructions. You will need various outputs from the AWS CDK deployment.
1. Run the `Playout service - GraphQL Codegen` task in VSCode to generate the GraphQL query code (Hasura must be running when you do this).

Now return to the main README.

## Local Development

See root ReadMe instructions for local development for which tasks to run.

If the environment configuration changes, or for example, the `package.json`
commands change, then you will need to restart tasks for this microservice.

## Testing

This service uses the recommended Nest.js test framework, Jest. Run `npm run test` to execute tests.
