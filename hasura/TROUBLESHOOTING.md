# Troubleshooting

## Hasura fails to run migrations on startup

### Symptoms

- I don't see any database tables or actions in the Hasura console
- I see an error about the key 'tables' not being found when running migrations/importing metadata

### Possible causes

This may be a result of Docker failing to correctly mount the `migrations` and `metadata` folder.

On Windows, this might be the result of Docker's WSL2 backend starting while an encrypted drive has not been unlocked. Try shutting down Docker and running `wsl --shutdown` to fully shutdown WSL. Then restart Docker and try again.

## `Hasura Console -- Local Development` task fails

### Symptoms

- I see an error message like `time="2020-11-21T20:08:14Z" level=fatal msg="version check: failed to get version from server: failed making version api call: Get \"http://localhost:8080/v1/version\": EOF" The terminal process "C:\WINDOWS\System32\cmd.exe /d /c hasura console --envfile .env.local" terminated with exit code: 1.`
- I cannot access the Hasura console after running the task

### Possible causes

There may be a race condition where the `hasura console` command is run too soon after starting the Docker container. Try running the `Hasura Console -- Local Development` task again (don't shut down the Docker container first - the task won't create a duplicate).
