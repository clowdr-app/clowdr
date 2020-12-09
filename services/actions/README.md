# Clowdr: Actions Service

Express server designed to run on Heroku and serves action calls from Hasura.
Eventually this may be split into multiple microservices.

## Pre-requisities

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
1. [AWS](https://aws.amazon.com/)

## Setting Up

1. Copy the `services/actions/.env.example` to `services/actions/.env`
1. Create an AWS user with admin access. Generate a new access key for this user - you will need the access key ID and secret key in the next step.

- TODO: limit permissions for this user

1. Configure your `.env` according to the [Actions Service
   Configuration](#actions-service-configuration) table below

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

| Key                               | Value                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| AUTH0_API_DOMAIN                  | `<auth0-subdomain>.auth0.com`                                                                                |
| AUTH0_AUDIENCE                    | `hasura`                                                                                                     |
| AUTH0_ISSUER_DOMAIN               | `https://<auth0-subdomain>.auth0.com/`                                                                       |
| HASURA_ADMIN_SECRET               | Hasura admin secret (used for queries/mutations to Hasura)                                                   |
| EVENT_SECRET                      | Event trigger secret (used to verify Hasura events)                                                          |
| FRONTEND_DOMAIN                   | The domain of the frontend website (e.g. `localhost:3000` or `app.clowdr.org`)                               |
| STOP_EMAILS_CONTACT_EMAIL_ADDRESS | The email address users should contact when they received unexpected emails (e.g. `stop-emails@example.org`) |
| GRAPHQL_API_SECURE_PROTOCOLS      | Boolean. Default: true. Whether to use https/wss or not.                                                     |
| GRAPHQL_API_DOMAIN                | The domain and port of the GraphQL server                                                                    |
| AWS_ACCESS_KEY_ID                 | The access key ID for your AWS user                                                                          |
| AWS_SECRET_ACCESS_KEY             | The secret access key for your AWS user                                                                      |
| AWS_REGION                        | The AWS region to operate in                                                                                 |
| SENDGRID_API_KEY                  | Your SendGrid API Key                                                                                        |
| SENDGRID_SENDER                   | Your SendGrid sender email address                                                                           |
