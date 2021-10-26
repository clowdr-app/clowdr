# Clowdr virtual conference platform

This is version 3 of Clowdr - more functional, more robust, more scalable,
and 100% open source!

If you want to contribute to Clowdr, please read our [contribution guidelines](CONTRIBUTING).

## Structure

| Folder            | Contents                                                             | ReadMe                                                 |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| aws               | Infrastructure as code for AWS                                       | [AWS Readme](aws/README.md)                            |
| frontend          | The frontend React web app                                           | [Frontend Readme](frontend/README.md)                  |
| hasura            | The Hasura GraphQL configuration, actions and seed data.             | [Hasura Readme](hasura/README.md)                      |
| services          | Micro-services                                                       |                                                        |
| services/actions  | A service that handles most Hasura actions.                          | [Actions service readme](services/actions/README.md)   |
| services/realtime | A service that handles realtime interactions like chat and presence. | [Realtime service readme](services/realtime/README.md) |
| services/playout  | A service that controls video broadcast pipelines.                   | [Playout service readme](services/playout/README.md)   |

## Quick Setup vs. Full Setup vs. Production

For contributors that _only_ want to play with the user interface, the
"Quick" version of the following instructions should get you a minimal
working setup. Just skip over the steps marked **Full Setup** or
**Production** and follow the steps marked **Quick Setup**.

**Warning**: The Quick Setup instructions are still being debugged and may
or may not work yet!!

**Caveat**: The word "Quick" should be taken with a grain of salt. Even
this streamlined path is likely to take you a day or two.

To test changes that affect other parts of the platform, skip the steps
marked **Quick Setup** and follow steps marked **Full Setup**. To deploy
Clowder publicly or run your own conference on Clowder, follow the steps
marked **Production** as well.

## Local Software Installation

1. [VSCode](https://code.visualstudio.com/)
   - We also recommend you install the "recommended extensions" listed in the
     `.vscode/extensions` folder. VSCode may offer to install them automatically.
   - If using Windows:
     1. Install [Git command line](https://git-scm.com/download/win) if you haven't already.
     1. Open or restart VSCode, and open a terminal with menu Terminal -> New Terminal
     1. Next to the big + sign in the right side of the terminal header, there's a dropdown with tooltip "Launch Profile...". Click it and select Git Bash.
1. [Node.js 16](https://nodejs.org/en/) (and NPM 7.8 or later)
1. [Docker Desktop](https://docs.docker.com/compose/cli-command/#installing-compose-v2) - Clowdr uses Docker Compose, now included in the Docker CLI.
1. **Full Setup:** [AWS CLI](https://aws.amazon.com/cli/)
1. **Production:** [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) if you will be deploying Clowdr publicly.

## Generate Hasura Admin Secret

The Hasura GraphQL engine will be configured with an arbitrary admin secret value, and this value is needed for configuring several other services that make up Clowdr, so generate a secure secret value now and make note of it. A suggested method is a hex string representing a 128-bit value, which can be generated using one of the methods below depending on which tools are available on your system.

- `openssl rand -hex 16`
- `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

Several other setup steps require an arbitrarily selected secret value shared between services, and this method may be used for generating those values as well.

## Cloud Services

Clowdr relies on various cloud services, which will need to be configured for local development as well.

1. **Full setup but not Production**: PacketRiot for enabling callbacks to services running locally
1. [Auth0](docs/auth0-setup.md) for user authentication
1. [Actions Service pre-requsities](services/actions/README.md#Pre-requisites) - Not the entire Actions Service setup just yet, only the Prerequisites.

## Setting Up Local Working Copy

1. Clone this repository
1. Initialise and update submodules:
   ```
         git submodule init
         git submodule update
   ```
1. Build `slate-transcript-editor` as follows:
   1. `cd slate-transcript-editor`
   1. Run `npm install`
   1. Run `npm run build:component`
   1. You should see the `dist` folder created.
   1. You will not need to do this again (hopefully)
1. Install npm packages:
   ```
   npm i
   cd frontend
     npm i
     cd ..
   cd services/actions
     npm i
     cd ../..
   cd services/playout
     npm i
     cd ../..
   cd services/realtime
     npm i
     cd ../..
   cd shared
     npm i
     cd ..
   ```
   **Full Setup**: Also this one:
   ```
   cd aws
     npm i
     cd ..
   ```
1. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README.md#Setting-up)
1. Follow the Actions Service setup: [Clowdr Actions Service
   ReadMe](services/actions/README.md#Setting-up)
1. Follow the Playout Service setup: [Clowdr Playout Service
   ReadMe](services/playout/README.md#Setting-up)
1. Follow the Realtime Service setup: [Clowdr Realtime Service
   ReadMe](services/realtime/README.md#Setting-up)
1. Follow the Frontend setup: [Clowdr Frontend
   ReadMe](frontend/README.md#Setting-up)
1. If running this software in a production environment, you will need to insert
   rows into the `system.Configuration` table (via Hasura, select the `system`
   schema to find the `Configuration` table).
   - Fill out values for all available keys.
   - Refer to the `description` field of each key (in `system.ConfigurationKey`)
     for expected values.

### Expose local services at a public URL

When you run Clowdr locally, many parts of the system rely on exposing local
services at a public URL. For example:

- The actions service needs to receive SNS notifications from AWS and
  webhooks from Vonage.
- The Hasura service needs to receive GraphQL queries from Auth0.
- The frontend much prefers to be served over HTTPS.

Whenever your public URLs change, you will need to do the following:

1. Copy the auth URL (`http://<hasura-domain>/v1/graphql`) into the
   `HASURA_URL` Auth0 _Rule Configuration_ as shown in step 5.
1. You will also need to set the actions URL
   (`http://<actions-domain>/vonage/sessionMonitoring/<VONAGE_WEBHOOK_SECRET>`)
   into the Vonage Session Monitoring URL. You can find this in the _Project
   Settings_ for your Vonage Video API project.
1. You will also need to set the actions URL
   (`http://<actions-domain>/vonage/archiveMonitoring/<VONAGE_WEBHOOK_SECRET>`)
   into the Vonage Archive Monitoring URL. You can find this in the _Project
   Settings_ for your Vonage Video API project.

   When configuring this, you should also input your S3 access key/secret so
   that Vonage can store the recording in S3. Without this recordings will only
   be stored temporarily in Vonage and won't be accessible from the app.

   You can use the `VonageUserAccessKeyId` and `VonageUserSecretAccessKey` outputs
   from the AWS deployment to configure the S3 connection. For extra security, you
   can set the `VONAGE_API_KEY` env var and redeploy the AWS stack.

1. Reconfigure any local environment variables that point at the URL or
   domain of the frontend, actions service or Hasura service.

There are a couple of services that make it easy to do this: Packetriot and
Ngrok. You only need one of them. We recommend Packetriot unless you have
a particular reason to use ngrok.

##### [Packetriot](https://packetriot.com)

Packetriot costs \$5 per month. This gets you five tunnels that support five
ports each - i.e. five users. You can configure a custom domain, so Google
OAuth will work.

###### Packetriot Setup (administrator)

1. Create a Packetriot account
1. [Download the client](https://docs.packetriot.com/quickstart/) and ensure
   it is on your `PATH`.
1. Follow the Packetriot instructions to verify your domain and set up an
   appropriate A/CNAME record.
1. In the root of the repository, run `pktriot --config pktriot.json configure --url`. Follow the instructions to authenticate and create a
   new tunnel. This will create a `pktriot.json` file with the credentials
   for a tunnel.
1. Add the following property to the JSON object, substituting your desired
   credentials.
   ```json
   "https": [
         {
               "domain": "<custom-frontend-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3000,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-hasura-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 8080,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-actions-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3001,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-playout-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3003,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         }
      ]
   ```
1. Run `pktriot start --config pktriot.json` to start the tunnel.
1. Configure Auth0 and Vonage using your custom domain

To create a (persistent) tunnel for one of your team members, repeat the
penultimate two steps (with a different filename) and send the generated
JSON config to the team member.

###### Packetriot Setup (team member)

1. Download the [pktriot client](https://docs.packetriot.com/quickstart/)
   and ensure it is on your `PATH`.
1. Request configuration file from your Packetriot administrator.
1. Put it in a file called `pktriot.json` in the root of the repository.
1. Launch by running the _Packetriot_ task or running
   `pktriot start --config pktriot.json`

Note: it may take a little while for Packetriot to acquire certificates initially.

## Local Development

Once you have finished setup, it's easy to run the entire environment with a single VSCode task: "Run All -- Local Development". This task starts PacketRiot tunnels as well as all Midspace services.

If you alter environment config, Docker Compose config, etc., then all tasks must be restarted. Tasks can be killed in VSCode using Ctrl+C or by closing the terminal window they are running in. To kill Docker containers, you will need to manually terminate the container (e.g. by pressing the stop button in Docker Desktop)

## Create a conference

When you log into Clowdr for the first time, there will be no conferences listed. You will need a demo code to create a conference, and this cannot yet be done through the Clowdr UI. To create a demo code:

1. Go to the _Data_ tab in the Hasura console.
2. Open the _conference > DemoCode_ table.
3. Open the _Insert Row_ tab. Ensure that `id` is set to _Default_ and click _Save_. There is no need to enter any values manually.
4. A demo code has now been created. Open the _Browse Rows_ tab and find the new row in the table.
5. Copy the `id` column of the new row. This is your demo code - you can use it to create a conference in the Clowdr UI.

### Modifying the default security settings

By default, only the creator of a conference has permission to view its elements. You can give permissions to other groups of users by opening the _Content_ admin panel in Clowdr. Click the yellow button with a lock icon to open the (conference-)global element security settings.

You probably want to at least add an entry for 'Organiser' permissions with the 'Organisers' group.

## Formatting

This repository uses Prettier for auto-formatting and checks for both pushes and
PRs. You may need to configure your editor to use Prettier (for example, by using the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode))

## Notes

- The various `Procfile`s are used by Heroku to determine what services to run.
- In production deployments, you will want to regularly clear out old Hasura event logs or you will encounter performance issues. There is a stored procedure `public.truncate_hasura_logs` to clear out logs older than a week. You could, for example, deploy a Cron To Go task in Heroku that calls `psql $DATABASE_URL -c "CALL public.truncate_hasura_logs()"`.

## GitHub Actions Configuration (/Secrets)

If you want to configure the GitHub actions for CI, you will need to set the following secrets:

| Secret                       | Value                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| HASURA_ADMIN_SECRET          | The value of Hasura Cloud                                                 |
| HASURA_ENDPOINT              | The GraphQL API URL from Hasura Cloud but without the `/v1/graphql` path. |
| ACTION_BASE_URL              | As-per the Hasura Cloud environment variable.                             |
| REALTIME_BASE_URL            | As-per the Hasura Cloud environment variable.                             |
| HASURA_PERSONAL_ACCESS_TOKEN | The value from Hasura Cloud                                               |
| HASURA_PROJECT_ID            | The value from Hasura Cloud                                               |

**_Note:_**: The `HASURA_ENDPOINT` changes when if rename your project inside
Hasura Cloud.
