# clowdr

Version 3 of Clowdr - this time it's scalable.

## Structure

| Folder | Contents                                                 | ReadMe                       |
| ------ | -------------------------------------------------------- | ---------------------------- |
| hasura | The Hasura GraphQL configuration, actions and seed data. | [ReadMe here](hasura/README) |

## Pre-requisites

1. [VSCode](https://code.visualstudio.com/)
    - We also recommend you install the "recommended extensions" listed in the `.vscode/extensions` folder.
1. [Node.js](https://nodejs.org/en/) (and NPM)
1. [Hasura pre-requisites](hasura/README#Pre-requisites)
1. [Actions Service pre-requsities](services/actions/README#Pre-requisites)

## Setting Up

1. Clone this repository
1. Install npm packages.

    This will also install dependencies in subdirectories.

    ```
    clowdr> npm i
    ```

1. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README#Setting-up)
1. Follow the Actions Service setup: [Clowdr Actions Service ReadMe](services/actions/README#Setting-up)

## Formatting

This repository uses Prettier for auto-formatting and checks for both pushes and PRs.

## Notes

-   The `Procfile` is used by Heroku to determine what services to run. We can add
    more microservices to it in future.
