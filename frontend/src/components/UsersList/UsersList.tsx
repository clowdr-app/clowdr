import { gql } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import React from "react";
import { useUsersQuery } from "../../generated/graphql";

const echoQuery = gql`
    query Users {
        user {
            firstName
            id
            lastLoggedInAt
            lastName
        }
    }
`;

export default function UsersList(): JSX.Element {
    const query = useUsersQuery();
    if (query.loading) {
        return <Spinner />;
    }
    if (query.error) {
        return <>Error! {query.error.message}</>;
    }
    return <>{JSON.stringify(query.data?.user, null, 2)}</>;
}
