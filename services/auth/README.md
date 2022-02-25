# Auth service

This service provides user authentication in concert with a third party authentication service.

## Setting up

1. `cd services/auth`
1. `cp .env.example .env`
1. Configure your `.env` according to the [Env vars](#env-vars) table below.
1. You should have already configured and started the Docker services. Open [http://localhost:15672](http://localhost:15672) in a web browser and log in with the default username and password, both `admin`.
1. Now, create the user that the auth service will use to access RabbitMQ. Go to the Admin tab and add a new user with username `services/auth` and password `1234`. Click the username of the newly-created user, and then click the Set Permission button. This gives the user unrestricted read/write access.
    - You can choose a different username and password, but you will need to update the RABBITMQ_USERNAME and RABBITMQ_PASSWORD in .env to match.


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
| RABBITMQ_USERNAME   |                                                               | `services/auth`          |
| RABBITMQ_PASSWORD   |                                                               | `1234`                   |