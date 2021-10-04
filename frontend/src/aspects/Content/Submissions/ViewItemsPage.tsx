import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Center,
    Code,
    Container,
    Heading,
    List,
    ListItem,
    Text,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { useItemsByPersonAccessTokenQuery } from "../../../generated/graphql";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import { LinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";

gql`
    query ItemsByPersonAccessToken($accessToken: String!) {
        collection_ProgramPersonByAccessToken(where: { accessToken: { _eq: $accessToken } }) {
            id
            name
            itemPeople(order_by: { item: { title: asc } }) {
                id
                item {
                    id
                    title
                }
            }
        }
    }
`;

export default function ViewItemsPage({ magicToken }: { magicToken: string }): JSX.Element {
    const title = useTitle("Submissions");

    const accessToken = magicToken;
    const itemsResponse = useItemsByPersonAccessTokenQuery({
        variables: {
            accessToken,
        },
        context: {
            headers: {
                "X-Hasura-Magic-Token": magicToken,
            },
        },
    });

    const person = itemsResponse.data?.collection_ProgramPersonByAccessToken.length
        ? itemsResponse.data.collection_ProgramPersonByAccessToken[0]
        : undefined;
    return (
        <Center pt={6}>
            {title}
            {itemsResponse.loading && !itemsResponse.data ? (
                <CenteredSpinner />
            ) : (
                <Container maxW="container.md">
                    <VStack spacing={6} alignItems="flex-start">
                        <Heading as="h1" fontSize="4xl" textAlign="left">
                            {person ? `Welcome ${person.name}` : "Submissions"}
                        </Heading>
                        {person ? (
                            <Heading as="h2" fontSize="2xl" textAlign="left">
                                Submissions to Midspace
                            </Heading>
                        ) : undefined}
                        {itemsResponse.error ? (
                            <Alert status="error" flexDir="column">
                                <AlertTitle>An error has occurred. Please try refreshing.</AlertTitle>
                                <AlertDescription>
                                    <Text>
                                        An error has occured while loading the data for your submissions. If this error
                                        persists, please contact our support team with a copy of the error message shown
                                        below.
                                    </Text>
                                    <Code>{itemsResponse.error.message}</Code>
                                </AlertDescription>
                            </Alert>
                        ) : undefined}
                        {person ? (
                            <>
                                {person.itemPeople.length ? (
                                    <>
                                        <Text>Please use the links below to navigate your submissions.</Text>
                                        <List listStylePos="inside" spacing={2}>
                                            {person.itemPeople
                                                .filter((x) => !!x.item)
                                                .map((itemPerson) => (
                                                    <ListItem key={itemPerson.id}>
                                                        <LinkButton
                                                            colorScheme="PrimaryActionButton"
                                                            to={`/submissions/${magicToken}/item/${itemPerson.item?.id}`}
                                                            whiteSpace="normal"
                                                            h="auto"
                                                            py={2}
                                                        >
                                                            {itemPerson.item?.title ?? "<Error: Title not available>"}
                                                        </LinkButton>
                                                    </ListItem>
                                                ))}
                                        </List>
                                    </>
                                ) : (
                                    <Text>
                                        Submissions not currently available. Your conference organizers may still be
                                        setting up the conference. If you believe this is a mistake, please contact your
                                        conference organizers to ask them to make your submissions available.
                                    </Text>
                                )}
                            </>
                        ) : undefined}
                    </VStack>
                </Container>
            )}
        </Center>
    );
}
