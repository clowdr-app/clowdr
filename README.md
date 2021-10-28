# Midspace virtual conference platform

This is version 3 of Midspace - more functional, more robust, more scalable,
and 100% open source!

If you want to contribute to Midspace, please read our [contribution guidelines](CONTRIBUTING).

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
Midspace publicly or run your own conference on Midspace, follow the steps
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
1. [Docker Desktop](https://docs.docker.com/compose/cli-command/#installing-compose-v2) - Midspace uses Docker Compose, now included in the Docker CLI.
1. **Full Setup:** [AWS CLI](https://aws.amazon.com/cli/) and [awsvault](https://github.com/99designs/aws-vault)
1. **Production:** [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) if you will be deploying Midspace publicly.

## Generate Hasura Admin Secret

The Hasura GraphQL engine will be configured with an arbitrary admin secret value, and this value is needed for configuring several other services that make up Midspace, so generate a secure secret value now and make note of it. A suggested method is a hex string representing a 128-bit value, which can be generated using one of the methods below depending on which tools are available on your system.

- `openssl rand -hex 16`
- `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

Several other setup steps require an arbitrarily selected secret value shared between services, and this method may be used for generating those values as well.

## Cloud Services

Midspace relies on various cloud services, which will need to be configured for local development as well.

1. **Full Setup but not Production:** [Set up tunnels for enabling callbacks to services running locally](docs/tunnels-setup.md)
1. [Set up user authentication](docs/auth-setup.md)
1. **Full Setup:** [Set up AWS account and Deploy AWS CloudFormation Stacks](aws/README.md)
1. [Set up video chat service](docs/video-service-setup.md)
1. **Full Setup**: Create a [SendGrid](https://www.sendgrid.com) account and an API key for it.

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
1. Install top-level and shared npm packages:
   ```
   npm i
   cd shared
     npm i
     cd ..
   ```
1. Follow the Hasura setup: [Midspace Hasura ReadMe](hasura/README.md#Setting-up)
1. Follow the Actions Service setup: [Midspace Actions Service
   ReadMe](services/actions/README.md#Setting-up)
1. Follow the Playout Service setup: [Midspace Playout Service
   ReadMe](services/playout/README.md#Setting-up)
1. Follow the Realtime Service setup: [Midspace Realtime Service
   ReadMe](services/realtime/README.md#Setting-up)
1. Follow the Frontend setup: [Midspace Frontend
   ReadMe](frontend/README.md#Setting-up)
1. Once the system is up and running, open the app in your browser, log in,
   then navigate to `https://<your-domain>/su` and follow the instructions to
   set up a superuser.
   - In a production environment, we recommend using separate
     infrequently-accessed accounts for superusers, to reduce the risk and
     impact of security breaches.
   - In a production environment, we recommend using separate accounts for
     the various privileges available to superusers. For example, keep
     accounts with the ability to create conference codes separate from
     those able to modify the set of superusers.
1. If running this software in a production environment, you will need to use
   the superuser configuration pages to initialise the System Configuration.
   - Fill out values for all available keys.
   - Refer to the `description` field of each key (in `system.ConfigurationKey`)
     for expected values.

## Local Development

Once you have finished setup, it's easy to run the entire environment with a single VSCode task: "Run All -- Local Development". This task starts PacketRiot tunnels as well as all Midspace services.

If you alter environment config, Docker Compose config, etc., then all tasks must be restarted. Tasks can be killed in VSCode using Ctrl+C or by closing the terminal window they are running in. To kill Docker containers, you will need to manually terminate the container (e.g. by pressing the stop button in Docker Desktop)

## Create a conference

When you log into Clowdr for the first time, there will be no conferences listed. You will need a demo code to create a conference, and this cannot yet be done through the Clowdr UI. To create a demo code:

1. Go to the _Data_ tab in the Hasura console.
2. Open the _conference > DemoCode_ table.
3. Open the _Insert Row_ tab. Ensure that `id` is set to _Default_ and click _Save_. There is no need to enter any values manually.
4. A code has now been created. Open the _Browse Rows_ tab and find the new row in the table.
5. Copy the `id` column of the new row. This is your demo code - you can use it to create a conference in the Midspace UI.

### Modifying the default security settings

By default, only the creator of a conference has permission to view its elements. You can give permissions to other groups of users by opening the _Content_ admin panel in Midspace. Click the yellow button with a lock icon to open the (conference-)global element security settings.

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
