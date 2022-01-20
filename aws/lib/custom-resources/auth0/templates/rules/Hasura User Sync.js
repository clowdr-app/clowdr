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
        const graphqlReq = { query: upsertUserQuery, variables: { userId: userId, email: email } };

        // console.log("url", url);
        // console.log("graphqlReq", JSON.stringify(graphqlReq, null, 2));

        const sendRequest = (url, adminSecret, user, context, cb) => {
            request.post(
                {
                    headers: { "content-type": "application/json", "x-hasura-admin-secret": adminSecret },
                    url: url,
                    body: JSON.stringify(graphqlReq),
                },
                function (error, response, body) {
                    body = JSON.parse(body);
                    console.log(body);
                    if (
                        !error &&
                        body.data &&
                        body.data.insert_User &&
                        typeof body.data.insert_User.affected_rows === "number"
                    ) {
                        console.log("Suucessfully saved to db. Marking as not new.");
                        user.app_metadata.isNew = false;
                    } else {
                        console.log("body.data", body.data);
                        console.log("body.data.insert_User", body.data && body.data.insert_User);
                        console.log(
                            "body.data.insert_User.affected_rows",
                            body.data && body.data.insert_User && body.data.insert_User.affected_rows
                        );
                    }
                    cb(null, user, context);
                }
            );
        };

        sendRequest(configuration.HASURA_URL, configuration.HASURA_ADMIN_SECRET, user, context, (_err, _user, _ctx) => {
            auth0.users
                .updateAppMetadata(_user.user_id, _user.app_metadata)
                .then(function () {
                    if (_err) {
                        callback(_err);
                    } else {
                        callback(null, _user, _ctx);
                    }
                })
                .catch(function (_err2) {
                    callback(_err2);
                });
        });
    } else {
        console.log("Ignoring existing user");
        callback(null, user, context);
    }
}
