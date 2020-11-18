import React from "react";
import { gql } from "@apollo/client";
import { useEchoQueryQuery } from "../../generated/graphql";

const echoQuery = gql`
    query EchoQuery($message: String!) {
        echo(input: { message: $message }) {
            message
        }
    }
`;

export default function Echo() {
    const query = useEchoQueryQuery({
        variables: {
            message: "Test echo message"
        }
    });
    if (query.loading) {
        return <>Loading...</>;
    }
    else if (query.error) {
        return <>Query error! {query.error.message}</>;
    }
    else if (query.data) {
        return <>Hello, world! {query.data.echo?.message}.</>;
    }
    else {
        return <>Hello, world! No data?!.</>;
    }
}
