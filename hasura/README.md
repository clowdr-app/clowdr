# Midspace: Hasura

We use the Hasura GraphQL engine to power the interface between the frontend
and all of our backend services.

## Pre-requisites

1. [Docker Compose](https://docs.docker.com/compose/)
1. **Full Setup**: A SendGrid account per instructions in the main README.

## Setting Up

1. Add a line to `hasura/config.yaml` with the Hasura admin secret value generated at the beginning of this setup process, i.e.: `admin_secret: XXXXX` *Make sure you do not commit this to version control!*
1. `cp hasura/.env.example hasura/.env.local`
1. In `hasura/.env.local` set the value of `HASURA_GRAPHQL_ADMIN_SECRET` to the admin secret as well. Set the value of `EVENT_SECRET` to another secure random value.
1. If you are using an M1 Mac, note that Hasura's official Docker image does not yet support this platform. You will need to use a different image built by a third party. Swap `image: hasura/graphql-engine:v{version number}.cli-migrations-v2` for `image: fedormelexin/graphql-engine-arm64:v{version number}.cli-migrations-v2` in `docker-compose.yaml`, replacing the version number as appropriate.
1. Run the `Hasura Console -- Local Development` task within VSCode:
   `Terminal > Run Task`.
1. Check that the Docker Compose task ran successfully in the Task Output
   - If you get an error from this task, make sure the Docker app is running first!
1. Check that the Hasura Console task ran successfully in the Task Output
    - If you get an error message about `version check: failed to get
      version from server: failed making version api call...` try running
      the task again -- there is a race condition that can cause this.
1. Your browser should have opened a tab to the [Hasura Console](http://localhost:9695/console/). Open the `system.Configuration` table (click the DATA tab at top, expand the `system` schema on the left, and click the `Configuration` table) and insert the rows listed below. **Production**: If running Midspace in a production environment, you will need to insert rows into the `system.Configuration` table for all available keys, not just those listed here. Refer to the `description` field of each key (in `system.ConfigurationKey`) for expected values for the remaining keys.
   | Key | Value |
   | ------- | ---------- |
   | `SENDGRID_API_KEY` | your SendGrid API key, as a JSON string (i.e. wrapped in double quotes) |
   | `SENDGRID_SENDER` | the 'from' email address you wish to use for emails sent by Midspace, as a JSON string |
   | `SENDGRID_REPLYTO` | the 'reply-to' email address you wish to use for emails sent by Midspace, as a JSON string |
   | `HOST_ORGANISATION_NAME` | Name of your organization to appear in email footers, as a JSON string |
   | `STOP_EMAILS_CONTACT_EMAIL_ADDRESS` | Contact address for emails received in error, as a JSON string |
   | `DEFAULT_FRONTEND_HOST` | Either `http://localhost:3000` or your public frontend URL, as a JSON string |

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
