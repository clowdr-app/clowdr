# Clowdr: Hasura

We use the Hasura GraphQL engine to power the interface between the frontend and
all of our backend services.

## Pre-requisites

1. [Docker Compose](https://docs.docker.com/compose/)
1. [Hasura CLI](https://hasura.io/docs/1.0/graphql/core/hasura-cli/install-hasura-cli.html)

## Setting Up

1. Copy the `hasura/.env.example` to `hasura/.env.local`
1. From your new `.env.local`, delete the "Hasura Cloud"-specific variables
   (which are labeled accordingly in the env's comments).
   1. You won't be able to configure the `HASURA_GRAPHQL_JWT_SECRET` yet. Replace it with `XXXXX` for now.
   1. In `hasura/docker-compose.yaml`, comment out the line `HASURA_GRAPHQL_JWT_SECRET: ${HASURA_GRAPHQL_JWT_SECRET}`. We'll re-enable it once we have a JWT secret.
1. Run the `Hasura Console -- Local Development` task within VSCode
1. Check that the Docker Compose task ran successfully in the Task Output
1. Check that the Hasura Console task ran successfully in the Task Output
1. Your browser should have opened a tab to the Hasura console

## Local Development

See root ReadMe instructions for local development for which tasks to run.

If the environment configuration for Hasura/Postgres or the Docker Compose
configuration changes, then the Hasura local-dev tasks need to be restarted
(which will also apply the changes to Docker).

## Remote Deployment

We use GitHub Actions (a.k.a. Workflows) to automatically deploy new versions
to Hasura Cloud and run migrations.

| Branch  | Hasura Cloud Instance |
| ------- | --------------------- |
| develop | ci-testing            |
| staging | staging               |
| main    | production            |

## Environment Files

| Name              | Purpose                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `.env.local`      | Local development                                                              |
| `.env.ci-test`    | Hasura Console connection to Hasura Cloud for managing the CI instance         |
| `.env.staging`    | Hasura Console connection to Hasura Cloud for managing the staging instance    |
| `.env.production` | Hasura Console connection to Hasura Cloud for managing the production instance |

## Hasura Cloud Configuration

| Env Var                          | Value                                              |
| -------------------------------- | -------------------------------------------------- |
| HASURA_GRAPHQL_ADMIN_SECRET      | A secure random value                              |
| HASURA_GRAPHQL_DATABASE_URL      | Allow Hasura to configure this                     |
| ACTION_BASE_URL                  | The Heroku Actions Service uri - no trailing slash |
| EVENT_URL                        | The URL that handles event triggers                |
| EVENT_SECRET                     | The secret to be sent for event trigger auth       |
| HASURA_GRAPHQL_UNAUTHORIZED_ROLE | unauthenticated                                    |
