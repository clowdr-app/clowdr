# Presence Counters service

## Notes

1. Install NPM modules
1. This app is based on Heroku, Websockets using Sockets.io, and Redis
1. You'll want to run Redis locally. On Windows, under WSL.
   `sudo apt-get install redis-server`
   - [Windows 10](https://redislabs.com/blog/redis-on-windows-10/)

## Heroku

1. We need "sticky sessions" to make websockets work: `heroku features:enable http-session-affinity --app APP_NAME`
1. We need Heroku Redis for maintaining state: `heroku addons:create heroku-redis:premium-0 --app APP_NAME`
1. We need Heroku Multiprocfile to handle our monorepo:
   - `heroku buildpacks:add -a APP_NAME heroku-community/multi-procfile`
   - `heroku config:set -a APP_NAME PROCFILE=services/presence/PROCFILE`

## Env vars

| Name             | Purpose                                                       | Example                  |
| ---------------- | ------------------------------------------------------------- | ------------------------ |
| REDIS_URL        | The URI to your redis server. Heroku sets this automatically. | `redis://localhost:6379` |
| AUTH0_API_DOMAIN | As per other parts of Clowdr.                                 |
