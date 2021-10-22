import { Button, Center, Code, Container, Heading, List, ListItem, Text, useToast, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { gql, useClient } from "urql";
import {
    Submissions_GetProgramPersonAccessTokenDocument,
    useSubmissions_ListUploadersQuery,
} from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { useTitle } from "../Utils/useTitle";

gql`
    query Submissions_ListUploaders($elementId: uuid!) {
        content_Uploader(where: { elementId: { _eq: $elementId } }) {
            id
            name
            email
        }
    }

    query Submissions_GetProgramPersonAccessToken(
        $elementId: uuid!
        $uploaderEmail: String!
        $elementAccessToken: String!
    ) {
        getProgramPersonAccessToken(
            elementId: $elementId
            uploaderEmail: $uploaderEmail
            elementAccessToken: $elementAccessToken
        ) {
            accessToken
        }
    }
`;

export default function OldAccessFormatRedirectionPage({
    magicToken,
    elementId,
}: {
    magicToken: string;
    elementId: string;
}): JSX.Element {
    const title = useTitle("Submission identification");

    const [response] = useSubmissions_ListUploadersQuery({
        requestPolicy: "network-only",
        variables: {
            elementId,
        },
        context: {
            headers: {
                "X-Hasura-Magic-Token": magicToken,
                "SEND-WITHOUT-AUTH": true,
            },
        },
    });

    const history = useHistory();
    const toast = useToast();
    const client = useClient();
    const [accessTokenFetching, setAccessTokenFetching] = useState<boolean>(false);

    return (
        <Center pt={6}>
            {title}
            {response.fetching && !response.data ? (
                <CenteredSpinner />
            ) : (
                <Container maxW="container.md">
                    <VStack spacing={6} alignItems="flex-start">
                        <Heading as="h1" fontSize="4xl">
                            Submission Identification
                        </Heading>
                        <Text>
                            Please select yourself from the list below. If you do not see yourself listed, please
                            contact your conference organizers.
                        </Text>
                        {response.data?.content_Uploader.length ? (
                            <List listStylePos="inside" spacing={2}>
                                {response.data.content_Uploader.map((uploader) => (
                                    <ListItem key={uploader.id}>
                                        <Button
                                            colorScheme="PrimaryActionButton"
                                            isLoading={accessTokenFetching}
                                            onClick={async () => {
                                                try {
                                                    setAccessTokenFetching(true);
                                                    const tokenResponse = await client
                                                        .query(Submissions_GetProgramPersonAccessTokenDocument, {
                                                            elementAccessToken: magicToken,
                                                            elementId,
                                                            uploaderEmail: uploader.email ?? "",
                                                        })
                                                        .toPromise();

                                                    if (
                                                        tokenResponse.data.getProgramPersonAccessToken.accessToken
                                                            ?.length
                                                    ) {
                                                        const token =
                                                            tokenResponse.data.getProgramPersonAccessToken.accessToken;
                                                        history.push(`/submissions/${token}`);
                                                    } else {
                                                        toast({
                                                            status: "error",
                                                            position: "top",
                                                            title: "Unable to identify matching submissions",
                                                            description:
                                                                "Sorry, we were unable to identify matching submissions. Please contact your conference organizers to ask them to fix this.",
                                                            isClosable: true,
                                                            duration: 1000000,
                                                        });
                                                    }
                                                    setAccessTokenFetching(false);
                                                } catch (e) {
                                                    toast({
                                                        status: "error",
                                                        position: "top",
                                                        title: "A technical error has occurred",
                                                        description: (
                                                            <>
                                                                <Text mb={2}>
                                                                    Sorry, a technical error has occurred. Please try
                                                                    again in a few minutes. If this error persists,
                                                                    please contact our support team quoting the
                                                                    following error message:
                                                                </Text>
                                                                <Code>{e.toString()}</Code>
                                                            </>
                                                        ),
                                                        isClosable: true,
                                                        duration: 1000000,
                                                    });
                                                }
                                            }}
                                        >
                                            {uploader.name} &lt;{uploader.email}&gt;
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Text>
                                No people are listed for this submission token. Please contact your conference
                                organizers.
                            </Text>
                        )}
                    </VStack>
                </Container>
            )}
        </Center>
    );
}
