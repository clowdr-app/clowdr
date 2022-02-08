# Caches service

This service caches API requests to reduce latency and reduce database load.

## Setting up

1. `cd services/caches`
1. `cp .env.example .env`
1. Configure your `.env` according to the [Env vars](#env-vars) table below.

Now return to the main README.

## Env vars

| Name                | Purpose                                                       | Example                  |
| ------------------- | ------------------------------------------------------------- | ------------------------ |
| REDIS_URL           | The URI to your redis server. Heroku sets this automatically. | `redis://localhost:6379` |
| REDIS_KEY           |                                                               | `socket.io`              |
| AUTH0_API_DOMAIN    | As per other parts of Midspace; see `services/actions/.env`   | `dev-xxxxx.us.auth0.com` |
| CORS_ORIGIN         | As per other parts of Midspace; see `services/actions/.env`   |                          |
| HASURA_ADMIN_SECRET | As per other parts of Midspace; see `services/actions/.env`   |                          |
| GRAPHQL_API_SECURE_PROTOCOLS | As per other parts of Midspace; see `services/actions/.env` |                   |
| GRAPHQL_API_DOMAIN  | As per other parts of Midspace; see `services/actions/.env`   |                          |
| EVENT_SECRET        | As per other parts of Midspace; see `services/actions/.env`   |                          |
| RABBITMQ_USERNAME   |                                                               | `services/caches`        |
| RABBITMQ_PASSWORD   |                                                               | `1234`                   |