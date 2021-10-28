# Realtime service

This service is based on Heroku, Websockets using Sockets.io, and Redis. It provides presence information, chat and other realtime communication services for Midspace.

## Prerequisites

1. [Auth0 Setup](../../docs/auth-setup.md)
1. [Hasura Setup](../../hasura/README.md)

## Setting up

1. `cd services/realtime`
1. Install npm packages: `npm i`
1. `cp .env.example .env`
1. Replace the placeholder values in `.env` for the environment variables listed in the table at the bottom of this page.
1. You should have already configured and started the Docker services. Open [http://localhost:15672](http://localhost:15672) in a web browser and log in with the default username and password, both `admin`.
1. Now, create the user that the realtime service will use to access RabbitMQ. Go to the _Admin_ tab and add a new user with username `services/realtime` and password `1234`. Click the username of the newly-created user, and then click the _Set Permission_ button. This gives the user unrestricted read/write access.
   - You can choose a different username and password, but you will need to update the `RABBITMQ_USERNAME` and `RABBITMQ_PASSWORD` in `.env` to match.

## Production: Heroku

1. We need "sticky sessions" to make websockets work: `heroku features:enable http-session-affinity --app APP_NAME`
1. We need Heroku Redis for maintaining state: `heroku addons:create heroku-redis:premium-0 --app APP_NAME`
1. We need Heroku Multiprocfile to handle our monorepo:
   - `heroku buildpacks:add -a APP_NAME heroku-community/multi-procfile`
   - `heroku config:set -a APP_NAME PROCFILE=services/realtime/PROCFILE`

## Env vars

| Name                | Purpose                                                       | Example                  |
| ------------------- | ------------------------------------------------------------- | ------------------------ |
| REDIS_URL           | The URI to your redis server. Heroku sets this automatically. | `redis://localhost:6379` |
| AUTH0_API_DOMAIN    | As per other parts of Midspace.                               |                          |
| SECRET_FOR_SUMMARY  | same as PRESENCE_SUMMARY_SECRET in hasura/.env                |                          |
| SECRET_FOR_FLUSHING | same as PRESENCE_FLUSH_SECRET in hasura/.env                  |                          |
