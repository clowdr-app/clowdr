import { gql } from "@apollo/client/core";
import { EchoDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query Echo($message: String!) {
        echo(message: $message) {
            message
        }
    }
`;

export default async function protectedEchoHandler(
    args: protectedEchoArgs
): Promise<ProtectedEchoOutput> {
    const response = await apolloClient.query({
        query: EchoDocument,
        variables: {
            message: args.message,
        },
    });

    if (!response.data.echo?.message) {
        throw new Error("No message returned");
    }

    return {
        message: response.data.echo.message,
    };
}
