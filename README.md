# clowdr

Version 3 of Clowdr - this time it's scalable.

## Structure

| Folder           | Contents                                                         | ReadMe                                 |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------- |
| frontend         | The frontend React web app                                       | [ReadMe here](frontend/README)         |
| hasura           | The Hasura GraphQL configuration, actions and seed data.         | [ReadMe here](hasura/README)           |
| services         | Micro-services                                                   |                                        |
| services/actions | At the moment, a "general" service for handling any/all actions. | [ReadMe here](services/actions/README) |

## Pre-requisites

1. [VSCode](https://code.visualstudio.com/)
   - We also recommend you install the "recommended extensions" listed in the `.vscode/extensions` folder.
1. [Node.js](https://nodejs.org/en/) (and NPM)
1. [Hasura pre-requisites](hasura/README#Pre-requisites)
1. [Actions Service pre-requsities](services/actions/README#Pre-requisites)
1. [Frontend pre-requsities](frontend/README#Pre-requisites)

## Setting Up

1. Clone this repository
1. Install npm packages.

   This will also install dependencies in subdirectories.

   ```
   clowdr> npm i
   ```

1. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README#Setting-up)
1. Follow the Actions Service setup: [Clowdr Actions Service ReadMe](services/actions/README#Setting-up)
1. Follow the Frontend setup: [Clowdr Frontend ReadMe](frontend/README#Setting-up)

## Local Development

1. Run the VSCode task "Run All -- Local Development"
   - If you followed the setup, this should start everything you need.
1. Most of the time, this will auto-watch for changes. But if you alter
   environment config, Docker Compose config, etc then all tasks must be
   restarted.

## Formatting

This repository uses Prettier for auto-formatting and checks for both pushes and PRs.

## Notes

- The `Procfile` is used by Heroku to determine what services to run. We can add
  more microservices to it in future.

## GitHub Actions Configuration (/Secrets)

| Secret                       | Value                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| HASURA_ADMIN_SECRET          | The value of Hasura Cloud                                                 |
| HASURA_ENDPOINT              | The GraphQL API URL from Hasura Cloud but without the `/v1/graphql` path. |
| ACTION_BASE_URL              | As-per the Hasura Cloud environment variable.                             |
| HASURA_PERSONAL_ACCESS_TOKEN | The value from Hasura Cloud                                               |
| HASURA_PROJECT_ID            | The value from Hasura Cloud                                               |

**_Note:_**: The `HASURA_ENDPOINT` changes when if rename your project inside Hasura Cloud.
