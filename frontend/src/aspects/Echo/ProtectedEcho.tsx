import { gql } from "@apollo/client";
import React from "react";
import { useProtectedEchoQuery } from "../../generated/graphql";

const echoQuery = gql`
    query ProtectedEcho($message: String!) {
        protectedEcho(message: $message) {
            message
        }
    }
`;

export default function ProtectedEcho(): JSX.Element {
    const query = useProtectedEchoQuery({
        variables: {
            message: "Test protected echo message",
        },
    });
    if (query.loading) {
        return <>Loading&#8230;</>;
    } else if (query.error) {
        return <>Query error! {query.error.message}</>;
    } else if (query.data) {
        return <>Hello, world! {query.data.protectedEcho?.message}.</>;
    } else {
        return <>Hello, world! No data?!.</>;
    }
}
