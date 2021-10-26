# Auth0 Setup

Midspace uses Auth0 for authentication/authorization of users. Auth0 can be
bypassed during offline (local) testing.

**_You will need an Auth0 account to follow these instructions._**

**_You will need to do online testing with Auth0 for non-minor PRs to be
considered for merging._**

## 1. Create account

1. Visit [auth0.com](https://auth0.com)
1. Click `Sign up`.
1. You may either create an Auth0 account or use an existing account with one of the other authentication providers offered.
1. Fill in company name if appropriate and click `Next`

## 2. Configure application

1. In the left sidebar under `Applications`, click `Applications`.
1. There should be a single application named `Default Application`. If not, create a new application of type Single Page Application. Click on the application name to go to its settings page.
1. Rename the Default Application if you'd like, and make a note of the following configuration parameters:
   - Domain
   - Client ID
1. In the `Application Properties` section, for `Application Type` select `Single Page Application`.
1. Configure `Allowed Callback URLs` (comma-separated)
   (The `localhost` URLs below must be inserted without alteration. You must
   also include the same set of paths using `https` and the public subdomain
   on which your local frontend instance is exposed.)
   ```
   http://localhost:3000/auth0/,
   http://localhost:3000/auth0/logged-in,
   http://localhost:3000/auth0/email-verification/result,
   https://<frontendSubdomain>.<PacketRiotDomain>/auth0/,
   https://<frontendSubdomain>.<PacketRiotDomain>/auth0/logged-in,
   https://<frontendSubdomain>.<PacketRiotDomain>/auth0/email-verification/result,
   ```
   (Note that, for production, the first URL _must_ be the `auth0` address; see [the auth0 documentation on Email Templates / RedirectURLs](https://auth0.com/docs/auth0-email-services/customize-email-templates#configuring-the-redirect-to-url)).
   **Full Setup**: If you have set up Netlify, you can optionally include your Netlify app url(s) in the Allowed Callback URLs (at the end). Netlify is a platform for hosting static websites. It takes our latest React site from git, builds it and deploys it to a CDN automatically. It's not required for most users - you could host the static part of the app wherever you want. For the local development case, you're just using a server on your local machine and maybe exposing it through a tunnel.
   ```
   https://<netlify-subdomain>.netlify.app/auth0/,
   https://<netlify-subdomain>.netlify.app/auth0/logged-in,
   https://<netlify-subdomain>.netlify.app/auth0/email-verification/result
   ```
1. Configure `Allowed Logout URLs` (comma-separated)
   (The `localhost` URLs below must be inserted without alteration. You must
   also include the same set of paths using `https` and the public subdomain
   on which your local frontend instance is exposed.)
   E.g.
   ```
   http://localhost:3000/auth0/logged-out,
   http://localhost:3000/auth0/email-verification/required/no-redirect,
   https://<frontendSubdomain>.<PacketRiotDomain>/auth0/logged-out,
   https://<frontendSubdomain>.<PacketRiotDomain>/auth0/email-verification/required/no-redirect,
   ```
   **Full Setup**: If using netlify, add these:
   ```
   https://<netlify-subdomain>.netlify.app/auth0/logged-out,
   https://<netlify-subdomain>.netlify.app/auth0/email-verification/required/no-redirect
   ```
1. Configure `Allowed Web Origins` (comma-separated)
   E.g.
   ```
   http://localhost:3000, https://<frontendSubdomain>.<PacketRiotDomain>
   ```
   **Full Setup**: If using netlify, add this:
   ```
   https://<netlify-subdomain>.netlify.app
   ```
1. **Don't forget to `Save changes`**

## 3. Create API

1. Create an Auth0 _API_

   - In the left sidebar under `Applications`, click `APIs`
   - Click `Create API`
   - `Name` it anything you like -- e.g., `Midspace Test API`
   - Set the `Identifier` to `hasura`
   - For `Signing Algorithm` choose `RS256`

   This may also have created another Machine-to-Machine _Application_ - this is
   okay, don't delete it.

## 4. Create Rules

Midspace uses Auth0 rules to handle user registration and interface with Hasura. Order of the rules matters.

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
     recognised by Midspace's Hasura instance.

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
     This rule creates users in Midspace's DB via Hasura using the Admin Secret to
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

## 5. Configure Rules

Under _Settings_ on the `Rules` page, add the following key-value pairs:

| Key                 | Value                                                     | Notes                                                                                                              |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HASURA_NAMESPACE    | `https://hasura.io/jwt/claims`                            | For Hasura, this value must always be this URL.                                                                    |
| HASURA_ADMIN_SECRET | The Hasura Admin Secret                                   | This must match the HASURA_ADMIN_SECRET specified in the actions service and Hasura env.                           |
| HASURA_URL          | `https://<hasuraSubdomain>.<PacketRiotDomain>/v1/graphql` | The public URL for the Hasura GraphQL API. E.g. Hint: The Hasura Service _not_ the Hasura Console URL/port number! |

You may want to have a production and a test environment running off the same Auth0 tenant. In this case, you can optionally specify `HASURA_ADMIN_SECRET_LOCAL` and `HASURA_URL_LOCAL` in
addition to the `HASURA_ADMIN_SECRET` and `HASURA_URL` to have user records pushed to both places simultaneously.

## 6. Turn on live logging

This is useful for debugging. Go to _Extensions_ and install `Real-time Webtask Logs`. After installing, click it and authenticate it when asked. To
see some useful logs, uncomment `console.log` statements in the _Rules_ we
created above.

## 7. Configure "new UI experience"

In the left sidebar under _Branding_, click _Universal Login_ and set the _default look and feel_ to _**New**_.

## 8. (Optional) Customising the login page

To customise what the Auth0 login page looks like, go to _Branding_ -> _Universal Login_ and
have fun. (Note: Always use the _**New**_ 'look and feel' for Midspace to work
properly.)
