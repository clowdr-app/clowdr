# Clowdr: Hasura

We use the Hasura GraphQL engine to power the interface between the frontend
and all of our backend services.

## Pre-requisites

1. [Docker Compose](https://docs.docker.com/compose/)

## Setting Up

1. `cp hasura/.env.example hasura/.env.local`
1. `cp hasura/config.yaml.example hasura/config.yaml`
1. Set the value of the `...ADMIN_SECRET` and `EVENT_SECRET` in both `.env.local` and `config.yaml` to random strings of your choosing that match across the two files.
1. If you are using an M1 Mac, note that Hasura's official Docker image does not yet support this platform. You will need to use a different image built by a third party. Swap `image: hasura/graphql-engine:v{version number}.cli-migrations-v2` for `image: fedormelexin/graphql-engine-arm64:v{version number}.cli-migrations-v2` in `docker-compose.yaml`, replacing the version number as appropriate.
1. Run the `Hasura Console -- Local Development` task within VSCode:
   `Terminal > Run Task`.
1. Check that the Docker Compose task ran successfully in the Task Output
   - If you get an error from this task, make sure the Docker app is running first!
1. Check that the Hasura Console task ran successfully in the Task Output
    - If you get an error message about `version check: failed to get
      version from server: failed making version api call...` try running
      the task again -- there is a race condition that can cause this.
1. Your browser should have opened a tab to the Hasura console

Now return to the main README.

## Local Development

See root ReadMe instructions for local development for which tasks to run.

**Note**: If the environment configuration for Hasura/Postgres or the Docker
Compose configuration change, then the Hasura local-dev tasks will need to
be restarted (which will also apply the changes to Docker).

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

| Env Var                          | Value                                               |
| -------------------------------- | --------------------------------------------------- |
| HASURA_GRAPHQL_ADMIN_SECRET      | A secure random value                               |
| HASURA_GRAPHQL_DATABASE_URL      | Allow Hasura to configure this                      |
| ACTION_BASE_URL                  | The Heroku Actions Service uri - no trailing slash  |
| REALTIME_BASE_URL                | The Heroku Presence Service uri - no trailing slash |
| EVENT_SECRET                     | The secret to be sent for event trigger auth        |
| HASURA_GRAPHQL_UNAUTHORIZED_ROLE | unauthenticated                                     |
