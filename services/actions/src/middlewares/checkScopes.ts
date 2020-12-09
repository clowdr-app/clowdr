import checkScopes from "../checkScopes";

export const checkUserScopes = checkScopes(
    ["user"],
    "auth",
    "https://hasura.io/jwt/claims",
    "x-hasura-allowed-roles"
);
