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

## Quick vs. Full Setup

For contributors that _only_ want to play with the user interface, the
"Quick" version of the following instructions should get you a minimal
working setup. Just skip over the steps marked "Full Setup".

**Warning**: The Quick Setup instructions are still being debugged and may
or may not work yet!!

**Caveat**: The word "Quick" should be taken with a grain of salt. Even
this streamlined path is likely to take you a day or two.

To run your own conference on Clowdr and/or test changes that affect other
parts of the platform, follow all the steps below.

## Pre-requisites

1. [VSCode](https://code.visualstudio.com/)
   - We also recommend you install the "recommended extensions" listed in the
     `.vscode/extensions` folder. VSCode may offer to install them automatically.
   - If using Windows:
     1. Install [Git command line](https://git-scm.com/download/win) if you haven't already.
     1. Open or restart VSCode, and open a terminal with menu Terminal -> New Terminal
     1. Next to the big + sign in the right side of the terminal header, there's a dropdown with tooltip "Launch Profile...". Click it and select Git Bash.
2. [Node.js 16](https://nodejs.org/en/) (and NPM 7.8 or later)
3. [Hasura pre-requisites](hasura/README.md#Pre-requisites)
4. [Actions Service pre-requsities](services/actions/README.md#Pre-requisites)
5. [Playout service pre-requisites](services/playout/README.md#Pre-requisites)
6. [Frontend pre-requsities](frontend/README.md#Pre-requisites)

## Setting Up

1. Clone this repository
2. Initialise and update submodules:

   ```
         git submodule init
         git submodule update
   ```

3. Build `slate-transcript-editor` as follows:
   1. `cd slate-transcript-editor`
   1. Run `npm install`
   1. Run `npm run build:component`
   1. You should see the `dist` folder created.
   1. You will not need to do this again (hopefully)
4. Install npm packages:
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
5. **Full setup**: Follow the [Clowdr AWS ReadMe](aws/README.md#Setting-up)
6. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README.md#Setting-up)
7. Follow the Actions Service setup: [Clowdr Actions Service
   ReadMe](services/actions/README.md#Setting-up)
8. Follow the Playout Service setup: [Clowdr Playout Service
   ReadMe](services/playout/README.md#Setting-up)
9. Follow the Realtime Service setup: [Clowdr Realtime Service
   ReadMe](services/realtime/README.md#Setting-up)
10. Follow the Frontend setup: [Clowdr Frontend
    ReadMe](frontend/README.md#Setting-up)
11. If running this software in a production environment, you will need to insert
    rows into the `system.Configuration` table (via Hasura, select the `system`
    schema to find the `Configuration` table).
    - Fill out values for all available keys.
    - Refer to the `description` field of each key (in `system.ConfigurationKey`)
      for expected values.
12. Follow the instructions below for Auth0 setup.

### Generating shared secrets

Several setup steps require an arbitrarily selected secret value shared between services. Here are two different commands for generating 128-bit random values that you can use depending on what tools you have available:
- `openssl rand -hex 16`
- `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

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

##### [ngrok](https://ngrok.com)

The second alternative is ngrok. Ngrok is either free (with random, ephemeral subdomains) or \$8.25 per user
per month (with custom domains).

If you use the free version, you will have to perform some reconfiguration
each time you relaunch ngrok. Additionally, Google OAuth (for YouTube
integration) will not work properly, since it requires a verified domain.

We have found that ngrok can be quite flaky.

###### Ngrok Setup (paid)

TODO

###### Ngrok Setup (free)

1. Create an ngrok account and note your auth token.
1. Copy `ngrok.example.yml` to `ngrok.yml`.
1. Set the `authtoken` and `region` (`us`, `eu`, `ap`, `au`, `sa`, `jp`, `in`)
1. Remove the `hostname` line from each tunnel configuration - you will let
   ngrok pick random subdomains instead.
1. Start ngrok (`ngrok start -config=./ngrok.yaml auth actions`)

**_Every time_** you start up for online (local) development, you will need
to reconfigure Auth0 and Vonage as specified earlier. The domain format is
`<ngrok-subdomain>.ngrok.io`.

Additionally, ensure that the following env vars are set to use
localhost-based, rather than public, URLs:

- frontend
  - `SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN`
  - `SNOWPACK_PUBLIC_COMPANION_BASE_URL`
- services/realtime
  - `CORS_ORIGIN`

When using free ngrok, access the frontend via its localhost URL
(`http://localhost:3000`) rather than launching an ngrok tunnel for it. You
could also launch the frontend tunnel, but you would need to update all the
above environment variable each time the tunnel was restarted.

### Auth0 Setup

Clowdr uses Auth0 for authentication/authorization of users. Auth0 can be
bypassed during offline (local) testing.

**_You will need an Auth0 account to follow these instructions._**

**_You will need to do online testing with Auth0 for non-minor PRs to be
considered for merging._**

#### 0. Create account

1. Visit [auth0.com](https://auth0.com)
1. Click `Sign up`.
1. You may either create an Auth0 account or use an existing account with one of the other authentication providers offered.
1. Fill in company name if appropriate and click `Next`

#### 1. Configure application

1. In the left sidebar under `Applications`, click `Applications`.
1. There should be a single application named `Default Application`. If not, create a new application of type Single Page Application. Click on the application name to go to its settings page.
1. Rename the Default Application if you'd like, and make a note of the following configuration parameters:
   - Domain
   - Client ID
1. In the `Application Properties` section, for `Application Type` select `Single Page Application`.
1. Configure `Allowed Callback URLs` (comma-separated)
   (The format/suffix of these urls should not be altered. They should
   include `localhost`.)
   ```
   http://localhost:3000/auth0/,
   http://localhost:3000/auth0/logged-in,
   http://localhost:3000/auth0/email-verification/result,
   ```
   (Note that, for production, the first URL _must_ be the `auth0` address; see [the auth0 documentation on Email Templates / RedirectURLs](https://auth0.com/docs/auth0-email-services/customize-email-templates#configuring-the-redirect-to-url)).
   **Full Setup**: If you have set up Netlify, you can optionally include your Netlify app url(s) in the Allowed Callback URLs (at the end). Netlify is a platform for hosting static websites. It takes our latest React site from git, builds it and deploys it to a CDN automatically. It's not required for most users - you could host the static part of the app wherever you want. For the local development case, you're just using a server on your local machine and maybe exposing it through a tunnel.
    ```
    https://<netlify-subdomain>.netlify.app/auth0/,
    https://<netlify-subdomain>.netlify.app/auth0/logged-in,
    https://<netlify-subdomain>.netlify.app/auth0/email-verification/result
    ```
1. Configure `Allowed Logout URLs` (comma-separated)
   (The format/suffix of these urls should not be altered.)
   E.g.
   ```
   http://localhost:3000/auth0/logged-out,
   http://localhost:3000/auth0/email-verification/required/no-redirect,
   ```
   **Full Setup**: If using netlify, add these:
   ```
   https://<netlify-subdomain>.netlify.app/auth0/logged-out,
   https://<netlify-subdomain>.netlify.app/auth0/email-verification/required/no-redirect
   ```
1. Configure `Allowed Web Origins` (comma-separated)
   E.g.
   ```
   http://localhost:3000,
   ```
   **Full Setup**: If using netlify, add this:
   ```
   https://<netlify-subdomain>.netlify.app
   ```
1. **Don't forget to `Save changes`**

#### 3. Create API

1. Create an Auth0 _API_

   - In the left sidebar under `Applications`, click `APIs`
   - Click `Create API`
   - `Name` it anything you like -- e.g., `Clowdr Test API`
   - Set the `Identifier` to `hasura`
   - For `Signing Algorithm` choose `RS256`

   This may also have created another Machine-to-Machine _Application_ - this is
   okay, don't delete it.

#### 4. Create Rules

Order of the rules matters.

1. Create a new _Rule_
   - In the left sidebar under `Auth Pipeline`, click `Rules`, then `Create Rule`
   - Select `Empty rule`
   - `Name` it `Setup isNew app metadata` (or anything else, if you prefer)
   - Replace the `Script` with the code below
   - Don't forget to `Save changes`
   (This rule sets up the tracking of new user accounts so we only insert them into the db once.)
   ```js
   function (user, context, callback) {
     user.app_metadata = user.app_metadata || {};
     if (!("isNew" in user.app_metadata)) {
       user.app_metadata.isNew = true;
       auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
           .then(function(){
             callback(null, user, context);
           })
           .catch(function(err){
             callback(err);
           });
     }
     else {
       callback(null, user, context);
     }
   }
   ```
   (If you see a warning like `Heads up! If you are trying to access a service behind a firewall...` you can ignore it.)
1. Create another new _Rule_
   - Select `Empty rule`
   - `Name` it something like `Force Verified Email Before Login`
   - Replace the `Script` with the code below
   - Don't forget to `Save changes`
   This rule prevents users from logging in before they have verified their account.
   ```js
   function emailVerified(user, context, callback) {
     if (!user.email_verified) {
       return callback(new UnauthorizedError("Please verify your email before logging in."));
     } else {
       return callback(null, user, context);
     }
   }
   ```
1. Create another new _Rule_
   - Select `Empty rule`
   - `Name` it something like `Hasura JWT`
   - Replace the `Script` with the code below
   - Don't forget to `Save changes`
   This rule upgrades the access token to give it relevant roles which are then
   recognised by Clowdr's Hasura instance.
   ```js
   function (user, context, callback) {
        const namespace = configuration.HASURA_NAMESPACE;
        console.log(`Upgrading access token for ${user.user_id}`);
        context.accessToken[namespace] =
        {
            'x-hasura-default-role': 'user',
            'x-hasura-allowed-roles': ['user', 'unauthenticated'],
            'x-hasura-user-id': user.user_id,
        };

        callback(null, user, context);
   }
   ```
1. Create another new _Rule_
   - Select `Empty rule`
   - `Name` it something like `Hasura User Sync`
   - Replace the `Script` with the code below
   - Don't forget to `Save changes`
   This rule creates users in Clowdr's DB via Hasura using the Admin Secret to
   directly access the `user` table.
   ```js
   function (user, context, callback) {
       if (user.app_metadata.isNew) {
           console.log("Inserting new user");
           const userId = user.user_id;
           const email = user.email;
           const upsertUserQuery = `mutation Auth0_CreateUser($userId: String!, $email: String!) {
           insert_User(objects: {id: $userId, email: $email}, on_conflict: {constraint: user_pkey, update_columns: []}) {
               affected_rows
           }
           }`;
           const graphqlReq = { "query": upsertUserQuery, "variables": { "userId": userId, "email": email } };

           // console.log("graphqlReq", JSON.stringify(graphqlReq, null, 2));

           const sendRequest = (url, adminSecret, user, context, cb) => {
               // console.log("url", url);
               request.post({
                   headers: {'content-type' : 'application/json', 'x-hasura-admin-secret': adminSecret},
                   url:   url,
                   body:  JSON.stringify(graphqlReq)
               }, function(error, response, body){
                   // console.log("error", error);
                   // console.log("body", body);
                   body = JSON.parse(body);
                   if (!error &&
                       body.data &&
                       body.data.insert_User &&
                       typeof body.data.insert_User.affected_rows === "number"
                   ) {
                       console.log("Successfully saved to db. Marking as not new.");
                       user.app_metadata.isNew = false;
                   }
                   else {
                       console.log("body.data",
                           body.data);
                       console.log("body.data.insert_User",
                           body.data && body.data.insert_User);
                       console.log("body.data.insert_User.affected_rows",
                           body.data &&
                           body.data.insert_User &&
                           body.data.insert_User.affected_rows
                       );
                   }
                   cb(null, user, context);
               });
           };

           sendRequest(
               configuration.HASURA_URL, configuration.HASURA_ADMIN_SECRET,
               user, context,
               (_err, _user, _ctx) => {
                   if (configuration.HASURA_URL_LOCAL && configuration.HASURA_ADMIN_SECRET_LOCAL) {
                       sendRequest(
                           configuration.HASURA_URL_LOCAL, configuration.HASURA_ADMIN_SECRET_LOCAL,
                           _user, _ctx,
                           (_err2, _user2, _ctx2) => {
                               auth0.users.updateAppMetadata(_user2.user_id, _user2.app_metadata)
                                   .then(function(){
                                       if (_err) {
                                           callback(_err);
                                       }
                                       else if (_err2) {
                                           callback(_err2);
                                       }
                                       else {
                                           callback(null, _user2, _ctx2);
                                       }
                                   })
                                   .catch(function(_err3){
                                       callback(_err3);
                                   });
                           }
                       );
                   }
                   else {
                       auth0.users.updateAppMetadata(_user.user_id, _user.app_metadata)
                            .then(function(){
                                if (_err) {
                                    callback(_err);
                                }
                                else {
                                    callback(null, _user, _ctx);
                                }
                            })
                            .catch(function(_err2){
                                callback(_err2);
                            });
                   }
               }
           );
       }
       else {
           console.log("Ignoring existing user");
           callback(null, user, context);
       }
   }
   ```

#### 5. Configure Rules

Under _Settings_ on the `Rules` page, add the following key-value pairs:

| Key                 | Value                                                                                    | Notes                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HASURA_NAMESPACE    | `https://hasura.io/jwt/claims`                                                           | For Hasura, this value must always be this URL.                                                                                                           |
| HASURA_ADMIN_SECRET | The Hasura Admin Secret                                                                  | This must match the HASURA_ADMIN_SECRET specified in the actions service and Hasura env.                                                                  |
| HASURA_URL          | The full URL to the Hasura GraphQL API. E.g. `http://<public URL for Hasura>/v1/graphql` | Use Ngrok to make a `localhost` server accessible by Auth0: command `ngrok http 8080`. Hint: The Hasura Service _not_ the Hasura Console URL/port number! |

You may want to have a production and a test environment running off the same Auth0 tenant. In this case, you can optionally specify `HASURA_ADMIN_SECRET_LOCAL` and `HASURA_URL_LOCAL` in
addition to the `HASURA_ADMIN_SECRET` and `HASURA_URL` to have user records pushed to both places simultaneously.

#### 6. Turn on live logging

This is useful for debugging. Go to _Extensions_ and install `Real-time Webtask Logs`. After installing, click it and authenticate it when asked. To
see some useful logs, uncomment `console.log` statements in the _Rules_ we
created above.

#### 7. Configure "new UI experience"

In the left sidebar under _Branding_, click _Universal Login_ and set the _default look and feel_ to _**New**_.

#### 8. (Optional) Customising the login page

To customise what the Auth0 login page looks like, go to _Branding_ -> _Universal Login_ and
have fun. (Note: Always use the _**New**_ 'look and feel' for Clowdr to work
properly.)

#### 9. Configure your environment

You can now resume the frontend setup by configuring your [Frontend environment
variables](/frontend/README.md#frontend-configuration).

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
