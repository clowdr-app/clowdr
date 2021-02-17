# Clowdr: Hasura

We use the Hasura GraphQL engine to power the interface between the frontend
and all of our backend services.

## Pre-requisites

1. [Docker Compose](https://docs.docker.com/compose/)
1. [Hasura CLI](https://hasura.io/docs/1.0/graphql/core/hasura-cli/install-hasura-cli.html)

## Setting Up

1. `cp hasura/.env.example hasura/.env.local`
1. In this new `.env.local`, delete the "Hasura Cloud"-specific variables
   (which are labeled accordingly in the env's comments).
BCP: Why not comment them out in the example file?
   1. You won't be able to configure the `HASURA_GRAPHQL_JWT_SECRET` yet. Replace it with `XXXXX` for now.
BCP: Why not just make the value be XXX in the example file?
BCP: And anyway, why are we fiddling with it at all at this point?  If we're
going to find out the correct value later, why not just fill it in then?
   1. In `hasura/docker-compose.yaml`, comment out the line `HASURA_GRAPHQL_JWT_SECRET: ${HASURA_GRAPHQL_JWT_SECRET}`. We'll re-enable it once we have a JWT secret.
BCP: Should the previous line be outdented?
BCP: Is # the comment syntax for YAML?
BCP: Maybe it would be simpler to provide an `.example` for this instead of
editing what's there (and potentially committing the edit to the main repo!)
1. Run the `Hasura Console -- Local Development` task within VSCode
   (`Terminal > Run Task`)
1. Check that the Docker Compose task ran successfully in the Task Output
1. Check that the Hasura Console task ran successfully in the Task Output
1. Your browser should have opened a tab to the Hasura console

BCP: Not clear whether I am supposed to continue on to do the rest of the
file or whether I stop here and return to the main README...

## Local Development

See root ReadMe instructions for local development for which tasks to run.

BCP: Is this a recursive call for something to do now, or just a reminder
that there will be some things to do later?

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

| Env Var                          | Value                                              |
| -------------------------------- | -------------------------------------------------- |
| HASURA_GRAPHQL_ADMIN_SECRET      | A secure random value                              |
| HASURA_GRAPHQL_DATABASE_URL      | Allow Hasura to configure this                     |
| ACTION_BASE_URL                  | The Heroku Actions Service uri - no trailing slash |
| EVENT_SECRET                     | The secret to be sent for event trigger auth       |
| HASURA_GRAPHQL_UNAUTHORIZED_ROLE | unauthenticated                                    |
