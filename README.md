# Clowdr virtual conference platform

This is version 3 of Clowdr - more functional, more robust, more scalable,
and 100% open source!

If you want to contribute to Clowdr, please read our [contribution guidelines](CONTRIBUTING).

## Structure

| Folder           | Contents                                                         | ReadMe                                    |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| frontend         | The frontend React web app                                       | [ReadMe here](frontend/README.md)         |
| hasura           | The Hasura GraphQL configuration, actions and seed data.         | [ReadMe here](hasura/README.md)           |
| services         | Micro-services                                                   |                                           |
| services/actions | At the moment, a "general" service for handling any/all actions. | [ReadMe here](services/actions/README.md) |

## Quick vs. Full Setup

For contributors that _only_ want to play with the user interface, the
"Quick" version of the following instructions should get you a minimal
working setup. Just skip over the steps marked "Full Setup".

To run your own conference on Clowdr and/or test changes that affect other
parts of the platform, follow all the steps below.

## Pre-requisites

1. [VSCode](https://code.visualstudio.com/)
   - We also recommend you install the "recommended extensions" listed in the
     `.vscode/extensions` folder.
     BCP: Will VSCode automatically offer to install them? Or do people need
     to do something special / manual? (I see I have them installed, but
     I don't think I did anything except maybe say yes to a question.)
2. [Node.js](https://nodejs.org/en/) (and NPM)
3. [Hasura pre-requisites](hasura/README.md#Pre-requisites)
4. [Actions Service pre-requsities](services/actions/README.md#Pre-requisites)
5. [Frontend pre-requsities](frontend/README.md#Pre-requisites)

## Setting Up

1. Clone this repository
2. Initialise and update submodules:

```
      git submodule init
      git submodule update
```

3. Build `react-transcript-editor` as follows:
   BCP: Should this be slate-transcript-editor?? (Answer: Ross is working
   on this bit; for now, just skip.)
   1. `cd slate-transcript-editor`
   1. Run `npm install`
   1. Run `npm run build:component`
   1. You should see the `dist` folder created.
   1. You will not need to do this again (hopefully)
4. Run `npm i` to install npm packages. This will also install dependencies in subdirectories.
5. **Full setup**: Follow the [Clowdr AWS ReadMe](aws/README.md#Setting-up)
6. Follow the Hasura setup: [Clowdr Hasura ReadMe](hasura/README.md#Setting-up)
   BCP: Is there a good reason for splitting the instructions in this file into separate Pre-Requisites and Setup steps? This creates a lot of bouncing around between README files and adds to the sense of overwhelm.
7. Follow the Actions Service setup: [Clowdr Actions Service
   ReadMe](services/actions/README.md#Setting-up)
8. Follow the Frontend setup: [Clowdr Frontend
   ReadMe](frontend/README.md#Setting-up)
9. Follow the instructions below for Auth0 setup.

### Auth0 Setup

Clowdr uses Auth0 for authentication/authorization of users. Auth0 can be
bypassed during offline (local) testing.

**_You will need an Auth0 account to follow these instructions._**

**_You will need to do online testing with Auth0 for non-minor PRs to be
considered for merging._**

#### 1. Create Application

1. Visit [auth0.com](https://auth0.com)
1. Click `Sign up` and create an account
1. On the "Welcome to Auth0" screen, just click `Next`
1. Fill in company name if appropriate and click `Next`
1. Click `Applications` in the left sidebar and then `Create application`
   - Name it anything you like (e.g. Clowdr Test)
   - Choose `Single Page Web Applications`
   - Click `Create`
1. Click `Settings` in the middle of the page and make a note of the
   following configuration parameters:
   - Domain
   - Client ID

#### 2. Configure Application

Now, configure the application in the _Settings_ tab.

1. Configure `Allowed Callback URLs` (comma-separated)
   (The format/suffix of these urls should not be altered.)

   You should include `localhost`.
   BCP: Is it OK to indent these? (I assume yes, but I don't want to break
   anything. I reformatted to facilitate cut/paste,
   and I added commas, on the assumption that a trailing comma on the last
   one won't hurt anything)

```
http://localhost:3000/auth0/,
http://localhost:3000/auth0/logged-in,
http://localhost:3000/auth0/email-verification/result,
```

(Note that, for production, the first URL _must_ be the `auth0` address; see
[the auth0 documentation on Email Templates / Redirect
URLs](https://auth0.com/docs/auth0-email-services/customize-email-templates#configuring-the-redirect-to-url)).

**Full Setup**: If you have set up Netlify, you can optionally include your
Netlify app url(s) in the Allowed Callback URLs (at the end). Netlify is a
platform for hosting static websites. It takes our latest React site from
git, builds it and deploys it to a CDN automatically. It's not required for
most users - you could host the static part of the app wherever you
want. For the local development case, you're just using a server on your
local machine and maybe exposing it through a tunnel.

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

   - Click `APIs` in the sidebar
   - Click `Create API`
   - `Name` it anything you like -- e.g., `Clowdr Test API`
   - Set the `Identifier` to `hasura`
   - For `Signing Algorithm` choose `RS256`

   This may also have created another Machine-to-Machine _Application_ - this is
   okay, don't delete it.

#### 4. Create Rules

Order of the rules matters.

1. Create a new _Rule_

   - Click `Rules` in the sidebar, then `Create Rule`
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

1. Create another new _Rule_

   - Select `Empty rule`
   - `Name` it something like `Hasura User Sync`
   - Replace the `Script` with the code below
   - Don't forget to `Save changes`

   This rule creates users in Clowdr's DB via Hasura using the Admin Secret to
   directly access the `user` table. It also sets the `lastLoggedInAt` field
   every time a user logs in.

   _Note: `lastLoggedInAt` defaults to `now()` hence why updating it with a
   blank value when there is a constraint conflict results in it reflecting the
   last logged in time._

BCP: Ed said, "It occurs to me that this note is already out of date, as is
the paragraph above it."

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

BCP: General comment: I dislike these super-wide tables, which make it
really difficult to manage my screen real estate; also, they limit the size
of the comments about what things are and where to find them. 80 columns
(or not too much wider) is much nicer in both ways. I.e., can we format
them as bulleted lists or code blocks with comments or something?

BCP: HASURA_ADMIN_SECRET must be the same as HASURA_ADMIN_SECRET in
services/actions/.env, right? Or only sometimes?

Under _Settings_ on the `Rules` page, add the following key-value pairs:

| Key                 | Value                                                                                       | Notes                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HASURA_NAMESPACE    | `https://hasura.io/jwt/claims`                                                              | For Hasura, this value must always be this URL.                                                                                                           |
| HASURA_ADMIN_SECRET | The Hasura Admin Secret                                                                     | For local testing, see Hasura Environment Variables.                                                                                                      |
| HASURA_URL          | The full URL to the Hasura GraphQL API. E.g. `http://<ngrok-subdomain>.ngrok.io/v1/graphql` | Use Ngrok to make a `localhost` server accessible by Auth0: command `ngrok http 8080`. Hint: The Hasura Service _not_ the Hasura Console URL/port number! |

BCP: The first time through, I had no idea what the third row meant. The
second time, I was a little less confused, but the comment is still pretty
opaque; it would be nicer to spell out the steps. (I see there is some more
information involving ngrok below; is that what I need here? But the
command is different.)

You can optionally use `HASURA_ADMIN_SECRET_LOCAL` and `HASURA_URL_LOCAL` in
addition to the non-local versions to have user records pushed to both
services simultaneously (useful in testing environments).

BCP: Huh?

#### 6. Turn on live logging

BCP: Full Setup only??

This is useful for debugging. Go to _Extensions_ and install `Real-time Webtask Logs`. After installing, click it and authenticate it when asked. To
see some useful logs, uncomment `console.log` statements in the _Rules_ we
created above.

#### 7. Configure Hasura

1. Generate your JWT Secret key using [Hasura's tool -
   https://hasura.io/jwt-config/](https://hasura.io/jwt-config/)
   - Select Auth0
   - Enter your Auth0 Domain
1. Copy your key (the whole JSON object that is generated in the JWT Config
   box) into your local `hasura/.env.local` file
   - e.g. `HASURA_GRAPHQL_JWT_SECRET='your key goes in here'`
   - **Don't forget the wrapping single quotes!**
1. Uncomment the `HASURA_GRAPHQL_JWT_SECRET: ${HASURA_GRAPHQL_JWT_SECRET}`
   line in `hasura/docker-compose.yaml`
   - Don't forget to restart the `Hasura Console -- Local Development` task
     in VSCode!
     BCP: STOPPED HERE
1. Optionally: Copy your key into Hasura Cloud Environment configuration
   - No need for the wrapping single quotes - Hasura's UI will handle that for
     you.
     BCP: Full setup only, I assume? Or not even, for most people doing that?

#### 8. Use ngrok for online (local) testing

**_Every time_** you start up for online (local) development, you will need to
start ngrok (`ngrok start --config=ngrok.yaml auth actions`) and copy the auth URL
(`http://<ngrok-subdomain>.ngrok.io/v1/graphql`) into the `HASURA_URL` Auth0
_Rule Configuration_ as shown in step 5.

BCP: I don't see `ngrok.yaml`...

You will also need to set the actions URL
(`http://<ngrok-subdomain>.ngrok.io/vonage/sessionMonitoring/<VONAGE_WEBHOOK_SECRET>`)
into the Vonage Session Monitoring URL. You can find this in the _Project
Settings_ for your Vonage Video API project. (You can choose
`VONAGE_WEBHOOK_SECRET` arbitrarily as long as it matches the setting in
your env file.)

If you have a paid ngrok account, you can create a persistent public URL and
avoid having to do all this every time.

#### 9. Configure "new UI experience"

Under _Universal Login_ settings, set the _default look and feel_ to _**New**_.

BCP: This seems to be the default. Maybe this step can be skipped?

#### 10. (Optional) Customising the login page

To customise what the Auth0 login page looks like, go to _Universal Login_ and
have fun. (Note: Always use the _**New**_ 'look and feel' for Clowdr to work
properly.)

#### 11. Configure your environment

BCP: STOPPED HERE

You can now resume the frontend setup by configuring your [Frontend environment
variables](/frontend/README.md#frontend-configuration).

## Local Development

BCP: I'm confused where this fits in the task hierarchy -- are we done
setting up Auth0 now? And is this then another top-level task that should
then be listed in the Setup section at the top?

1. Run the VSCode task "Run All -- Local Development"
   - If you followed the setup, this should start everything you need.
1. Most of the time, this will auto-watch for changes. But if you alter
   environment config, Docker Compose config, etc then all tasks must be
   restarted.

## Formatting

This repository uses Prettier for auto-formatting and checks for both pushes and
PRs.

BCP: Is this something I need to do?

## Notes

- The `Procfile` is used by Heroku to determine what services to run. We can add
  more microservices to it in future.

## GitHub Actions Configuration (/Secrets)

BCP: Is this something I need to do?

| Secret                       | Value                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| HASURA_ADMIN_SECRET          | The value of Hasura Cloud                                                 |
| HASURA_ENDPOINT              | The GraphQL API URL from Hasura Cloud but without the `/v1/graphql` path. |
| ACTION_BASE_URL              | As-per the Hasura Cloud environment variable.                             |
| HASURA_PERSONAL_ACCESS_TOKEN | The value from Hasura Cloud                                               |
| HASURA_PROJECT_ID            | The value from Hasura Cloud                                               |

**_Note:_**: The `HASURA_ENDPOINT` changes when if rename your project inside
Hasura Cloud.
