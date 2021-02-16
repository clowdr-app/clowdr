# Clowdr virtual conference platform

This is version 3 of Clowdr - more functional, more robust, more scalable!

If you want to contribute to Clowdr, please read our [contribution guidelines](CONTRIBUTING).

## Structure

| Folder           | Contents                                                         | ReadMe                                    |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| frontend         | The frontend React web app                                       | [ReadMe here](frontend/README.md)         |
| hasura           | The Hasura GraphQL configuration, actions and seed data.         | [ReadMe here](hasura/README.md)           |
| services         | Micro-services                                                   |                                           |
| services/actions | At the moment, a "general" service for handling any/all actions. | [ReadMe here](services/actions/README.md) |

# Quick Setup 

For contributors that _only_ want to play with the user interface, the
following abbreviated instructions should get you a minimal working setup.



# Full Setup

To run your own conferences on Clowdr and/or test changes that affect other
parts of the platform, here are the steps to bring up a fully functional
local instance. 

## Pre-requisites

1. [VSCode](https://code.visualstudio.com/)
   - We also recommend you install the "recommended extensions" listed in the
     `.vscode/extensions` folder.
1. [Node.js](https://nodejs.org/en/) (and NPM)
1. [Hasura pre-requisites](hasura/README.md#Pre-requisites)
1. [Actions Service pre-requsities](services/actions/README.md#Pre-requisites)
1. [Frontend pre-requsities](frontend/README.md#Pre-requisites)

## Setting Up

1. Clone this repository
1. Initialise/update submodules
BCP: How do I do that??
1. Enter and build `react-transcript-editor`:
   1. Run `npm install`
   1. Run `npm run build:component`
   1. You should see the `dist` folder created.
   1. You will not need to do this again (hopefully)
1. Install npm packages.

   This will also install dependencies in subdirectories.

   ```
   clowdr> npm i
   ```

1. Follow the AWS setup: [Clowdr AWS ReadMe](aws/README.md#Setting-up)
1. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README.md#Setting-up)
1. Follow the Actions Service setup: [Clowdr Actions Service
   ReadMe](services/actions/README.md#Setting-up)
1. Follow the Frontend setup: [Clowdr Frontend
   ReadMe](frontend/README.md#Setting-up)
1. Follow the Auth0 setup below

### Auth0 Setup

Clowdr uses Auth0 for authentication/authorization of users. Auth0 can be
bypassed during offline (local) testing.

**_You will need an Auth0 account to follow these instructions._**

**_You will need to do online testing with Auth0 for non-minor PRs to be
considered for merging._**

#### 1. Create Application

1. Create an _Application_ in Auth0
   - Name it anything you like (e.g. Clowdr Test)
   - When asked, select `Single Page Web Applications`
1. Make a note of the following configuration parameters. They will be used
   later in these instructions.
   - Domain
   - Client ID

#### 2. Configure Application

Now, configure the application in the _Settings_ tab.

1. Configure `Allowed Callback URLs` (comma-separated)
   (The format/suffix of these urls should not be altered.)

   For example, you should include `localhost` and optionally your Netlify app url(s), if you have set up Netlify:

   - `http://localhost:3000/auth0/`
   - `https://<netlify-subdomain>.netlify.app/auth0/`
   - `http://localhost:3000/auth0/logged-in`
   - `https://<netlify-subdomain>.netlify.app/auth0/logged-in`
   - `http://localhost:3000/auth0/email-verification/result`
   - `https://<netlify-subdomain>.netlify.app/auth0/email-verification/result`

   FOR PRODUCTION: The first URL MUST be the `auth0` address
   (See [the auth0 documentation on Email Templates / Redirect URLs](https://auth0.com/docs/auth0-email-services/customize-email-templates#configuring-the-redirect-to-url)).

1. Configure `Allowed Logout URLs` (comma-separated)
   (The format/suffix of these urls should not be altered.)

   E.g.

   - `http://localhost:3000/auth0/logged-out`
   - `http://localhost:3000/auth0/email-verification/required/no-redirect`
   - `https://<netlify-subdomain>.netlify.app/auth0/logged-out`
   - `https://<netlify-subdomain>.netlify.app/auth0/email-verification/required/no-redirect`

1. Configure `Allowed Web Origins` (comma-separated)

   E.g.

   - `http://localhost:3000`
   - `https://<netlify-subdomain>.netlify.app`

1. **Don't forget to `Save changes`**

#### 3. Create API

1. Create an _API_

   - `Name` it anything you like e.g. Clowdr Test API
   - Set the `Identifier` to `hasura`
   - `Signing Algorithm`: `RS256`

   This may also have created another Machine-to-Machine _Application_ - this is
   okay, don't delete it.

#### 4. Create Rules

Order of the rules matters.

1. Create a new _Rule_

   - Select `Empty rule`
   - `Name` it something like `Setup isNew app meatdata`
   - Replace the `Script` with the code from `Setup isNew app metadata` below
   - Don't forget to `Save changes`

   This rule sets up the tracking of new user accounts so we only insert them into the db once.

1. Create a new _Rule_

   - Select `Empty rule`
   - `Name` it something like `Force Verified Email Before Login`
   - Replace the `Script` with the code from `Force Verified Email Before Login Rule` below
   - Don't forget to `Save changes`

   This rule prevents users from logging in before they have verified their account.

1. Create a new _Rule_

   - Select `Empty rule`
   - `Name` it something like `Hasura JWT`
   - Replace the `Script` with the code from `Hasura JWT Rule` below
   - Don't forget to `Save changes`

   This rule upgrades the access token to give it relevant roles which are then
   recognised by Clowdr's Hasura instance.

1. Create a new _Rule_

   - Select `Empty rule`
   - `Name` it something like `Hasura User Sync`
   - Replace the `Script` with the code from `Hasura User Sync Rule` below
   - Don't forget to `Save changes`

   This rule creates users in Clowdr's DB via Hasura using the Admin Secret to
   directly access the `user` table. It also sets the `lastLoggedInAt` field
   every time a user logs in.

   _Note: `lastLoggedInAt` defaults to `now()` hence why updating it with a
   blank value when there is a constraint conflict results in it reflecting the
   last logged in time._

##### Setup isNew app metadata

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

##### Force Verified Email Before Login Rule

```js
function emailVerified(user, context, callback) {
  if (!user.email_verified) {
    return callback(new UnauthorizedError("Please verify your email before logging in."));
  } else {
    return callback(null, user, context);
  }
}
```

##### Hasura JWT Rule

```js
function (user, context, callback) {
  const namespace = configuration.HASURA_NAMESPACE;
  console.log(`Upgrading access token for ${user.user_id}`);
  const magicToken = context.request && context.request.query && context.request.query["magic-token"];
  const confSlug = context.request && context.request.query && context.request.query["conference-slug"];
  context.accessToken[namespace] =
    {
      'x-hasura-default-role': 'user',
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-user-id': user.user_id,
      'x-hasura-magic-token': magicToken,
      'x-hasura-conference-slug': confSlug,
    };
  callback(null, user, context);
}
```

##### Hasura User Sync Rule

```js
function (user, context, callback) {
    if (user.app_metadata.isNew) {
        console.log("Inserting new user");
        const userId = user.user_id;
        const given_name = user.given_name && user.given_name.length > 0 ? user.given_name : "<Unknown>";
        const family_name = user.family_name && user.family_name.length > 0 ? user.family_name : "<Unknown>";
        const email = user.email;
        const upsertUserQuery = `mutation Auth0_CreateUser($userId: String!, $firstName: String!, $lastName: String!, $email: String!) {
        insert_User(objects: {id: $userId, firstName: $firstName, lastName: $lastName, email: $email}, on_conflict: {constraint: user_pkey, update_columns: []}) {
            affected_rows
        }
        }`;
        const graphqlReq = { "query": upsertUserQuery, "variables": { "userId": userId, "firstName": given_name, "lastName": family_name, "email": email } };

        // console.log("url", url);
        // console.log("graphqlReq", JSON.stringify(graphqlReq, null, 2));

        const sendRequest = (url, adminSecret) => {
            request.post({
                headers: {'content-type' : 'application/json', 'x-hasura-admin-secret': adminSecret},
                url:   url,
                body:  JSON.stringify(graphqlReq)
            }, function(error, response, body){
                console.log(body);
                if (!error) {
                  user.app_metadata.isNew = false;
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
            });
        };

        sendRequest(configuration.HASURA_URL, configuration.HASURA_ADMIN_SECRET);
        if (configuration.HASURA_URL_LOCAL && configuration.HASURA_ADMIN_SECRET_LOCAL) {
            sendRequest(configuration.HASURA_URL_LOCAL, configuration.HASURA_ADMIN_SECRET_LOCAL);
        }
    }
    else {
        console.log("Ignoring existing new user");
        callback(null, user, context);
    }
}
```

#### 5. Configure Rules

Under _Rule Settings_ add the following key-value pairs:

| Key                 | Value                                                                                       | Notes                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HASURA_NAMESPACE    | `https://hasura.io/jwt/claims`                                                              | For Hasura, this value must always be this URL.                                                                                                           |
| HASURA_ADMIN_SECRET | The Hasura Admin Secret                                                                     | For local testing, see Hasura Environment Variables.                                                                                                      |
| HASURA_URL          | The full URL to the Hasura GraphQL API. E.g. `http://<ngrok-subdomain>.ngrok.io/v1/graphql` | Use Ngrok to make a `localhost` server accessible by Auth0: command `ngrok http 8080`. Hint: The Hasura Service _not_ the Hasura Console URL/port number! |

You can optionally use `HASURA_ADMIN_SECRET_LOCAL` and `HASURA_URL_LOCAL` in addition to the non-local versions to have
user records pushed to both services simultaneously (useful in testing environments).

#### 6. Turn on live logging

This is useful for debugging. Go to _Extensions_ and install `Real-time Webtask Logs`. After installing, click it and authenticate it when asked. To see some
useful logs, uncomment `console.log` statements in the _Rules_ we created above.

#### 7. Configure Hasura

1. Generate your JWT Secret key using [Hasura's tool -
   https://hasura.io/jwt-config/](https://hasura.io/jwt-config/)
   - Select Auth0
   - Enter your Auth0 Domain
1. Copy your key into your local `hasura/.env.local` file
   - e.g. `HASURA_GRAPHQL_JWT_SECRET='your key goes in here'`
   - **Don't forget the wrapping single quotes!**
1. Uncomment the `HASURA_GRAPHQL_JWT_SECRET: ${HASURA_GRAPHQL_JWT_SECRET}` line in `hasura/docker-compose.yaml`
   - Don't forget to restart the `Hasura Console -- Local Development` task!
1. Optionally: Copy your key into Hasura Cloud Environment configuration
   - No need for the wrapping single quotes - Hasura's UI will handle that for
     you.

#### 8. Use ngrok for online (local) testing

**_Every time_** you start up for online (local) development, you will need to
start ngrok (`ngrok start --config=ngrok.yaml auth actions`) and copy the auth URL
(`http://<ngrok-subdomain>.ngrok.io/v1/graphql`) into the `HASURA_URL` Auth0
_Rule Configuration_ as shown in step 5.

You will also need to set the actions URL (`http://<ngrok-subdomain>.ngrok.io/vonage/sessionMonitoring/<VONAGE_WEBHOOK_SECRET>`)
into the Vonage Session Monitoring URL. You can find this in the _Project Settings_ for your Vonage Video
API project.

If you have a paid ngrok account, you can create a persistent public URL and avoid having to do this.

#### 9. Configure "new UI experience"

Under _Universal Login_ settings, set the _default look and feel_ to _**New**_.

#### 9. (Optional) Customising the login page

To customise what the Auth0 login page looks like, go to _Universal Login_ and
have fun. (Note: Always use the _**New**_ 'look and feel' for Clowdr to work
properly.)

#### 10. Configure your environment

You can now resume the frontend setup by configuring your [Frontend environment
variables](/frontend/README.md#frontend-configuration).

## Local Development

1. Run the VSCode task "Run All -- Local Development"
   - If you followed the setup, this should start everything you need.
1. Most of the time, this will auto-watch for changes. But if you alter
   environment config, Docker Compose config, etc then all tasks must be
   restarted.

## Formatting

This repository uses Prettier for auto-formatting and checks for both pushes and
PRs.

## Notes

- The `Procfile` is used by Heroku to determine what services to run. We can add
  more microservices to it in future.

## GitHub Actions Configuration (/Secrets)

| Secret                       | Value                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| HASURA_ADMIN_SECRET          | The value of Hasura Cloud                                                 |
| HASURA_ENDPOINT              | The GraphQL API URL from Hasura Cloud but without the `/v1/graphql` path. |
| ACTION_BASE_URL              | As-per the Hasura Cloud environment variable.                             |
| HASURA_PERSONAL_ACCESS_TOKEN | The value from Hasura Cloud                                               |
| HASURA_PROJECT_ID            | The value from Hasura Cloud                                               |

**_Note:_**: The `HASURA_ENDPOINT` changes when if rename your project inside
Hasura Cloud.
