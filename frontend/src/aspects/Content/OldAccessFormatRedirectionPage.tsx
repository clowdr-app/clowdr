import { gql } from "@apollo/client";
import { Button, Center, Code, Container, Heading, List, ListItem, Text, useToast, VStack } from "@chakra-ui/react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import {
    useSubmissions_GetProgramPersonAccessTokenQuery,
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
    const intl = useIntl();
    const title = useTitle(intl.formatMessage({ id: 'content.oldaccessformatredirectionpage.submissionidentification', defaultMessage: "Submission Identification" }));

    const response = useSubmissions_ListUploadersQuery({
        fetchPolicy: "network-only",
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

    const accessToken = useSubmissions_GetProgramPersonAccessTokenQuery({
        skip: true,
    });

    const history = useHistory();
    const toast = useToast();

    return (
        <Center pt={6}>
            {title}
            {response.loading && !response.data ? (
                <CenteredSpinner />
            ) : (
                <Container maxW="container.md">
                    <VStack spacing={6} alignItems="flex-start">
                        <Heading as="h1" fontSize="4xl">
                            <FormattedMessage
                                id="content.oldaccessformatredirectionpage.submissionidentification"
                                defaultMessage="Submission Identification"
                            />
                        </Heading>
                        <Text>
                            <FormattedMessage
                                id="content.oldaccessformatredirectionpage.selectyourself"
                                defaultMessage="Please select yourself from the list below. If you do not see yourself listed, please
                                contact your conference organizers."
                            />
                        </Text>
                        {response.data?.content_Uploader.length ? (
                            <List listStylePos="inside" spacing={2}>
                                {response.data.content_Uploader.map((uploader) => (
                                    <ListItem key={uploader.id}>
                                        <Button
                                            colorScheme="PrimaryActionButton"
                                            isLoading={accessToken.loading}
                                            onClick={async () => {
                                                try {
                                                    const tokenResponse = await accessToken.refetch({
                                                        elementAccessToken: magicToken,
                                                        elementId,
                                                        uploaderEmail: uploader.email ?? "",
                                                    });

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
                                                            title: intl.formatMessage({ id: 'content.oldaccessformatredirectionpage.erroridmatching', defaultMessage: "Unable to identify matching submissions" }),
                                                            description: intl.formatMessage({ id: 'content.oldaccessformatredirectionpage.erroridmatchingdesc', defaultMessage: 
                                                                "Sorry, we were unable to identify matching submissions. Please contact your conference organizers to ask them to fix this."
                                                            }),
                                                            isClosable: true,
                                                            duration: 1000000,
                                                        });
                                                    }
                                                } catch (e) {
                                                    toast({
                                                        status: "error",
                                                        position: "top",
                                                        title: intl.formatMessage({ id: 'content.oldaccessformatredirectionpage.technicalerror', defaultMessage: "A technical error has occurred" }),
                                                        description: (
                                                            <>
                                                                <Text mb={2}>
                                                                    <FormattedMessage
                                                                        id="content.oldaccessformatredirectionpage.technicalerrordesc"
                                                                        defaultMessage="Sorry, a technical error has occurred. Please try
                                                                        again in a few minutes. If this error persists,
                                                                        please contact our support team quoting the
                                                                        following error message:"
                                                                    />
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
                                <FormattedMessage
                                    id="content.oldaccessformatredirectionpage.nopeoplelisted"
                                    defaultMessage="No people are listed for this submission token. Please contact your conference
                                    organizers."
                                />
                                
                            </Text>
                        )}
                    </VStack>
                </Container>
            )}
        </Center>
    );
}
