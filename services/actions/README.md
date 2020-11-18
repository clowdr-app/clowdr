# Clowdr: Actions Service

Runs on Heroku and serves action calls from Hasura. Eventually this may be split
into multiple microservices.

## Pre-requisities

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

## Setting Up

1. TODO

## Notes

-   The `package.json` in the `clowdr` root directory uses an NPM post-install
    hook to install dependencies in this directory too.
    -   This is also necessary for the Heroku build
-   The `Procfile` is used by Heroku to start this service. It exists in the
    `clowdr` root directory points at the compiled `build/server.js`.
