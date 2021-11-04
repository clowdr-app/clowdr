import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Center,
    Code,
    Container,
    Heading,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import type { VideoFileBlob } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import * as R from "ramda";
import React from "react";
import { Content_ElementType_Enum, useItemByPersonAccessTokenQuery } from "../../../generated/graphql";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import { LinkButton } from "../../Chakra/LinkButton";
import { contentSortOrder } from "../../Conference/Attend/Content/Element/ElementsGridLayout";
import FAIcon from "../../Icons/FAIcon";
import { maybeCompare } from "../../Utils/maybeSort";
import { useTitle } from "../../Utils/useTitle";
import RenderElement from "../Elements/RenderElement";

gql`
    query ItemByPersonAccessToken($accessToken: String!, $itemId: uuid!) {
        collection_ProgramPersonByAccessToken(where: { accessToken: { _eq: $accessToken } }) {
            id
            name
        }
        content_ItemByPersonAccessToken(where: { id: { _eq: $itemId } }) {
            id
            title
            elements {
                id
                accessToken
                typeName
                name
                data
                uploadsRemaining
                layoutData
            }
        }
    }
`;

export default function ViewItemPage({ magicToken, itemId }: { magicToken: string; itemId: string }): JSX.Element {
    const title = useTitle("Submission");

    const accessToken = magicToken;
    const itemResponse = useItemByPersonAccessTokenQuery({
        variables: {
            itemId,
            accessToken,
        },
        fetchPolicy: "network-only",
        context: {
            headers: {
                "X-Hasura-Magic-Token": magicToken,
            },
        },
    });

    const person = itemResponse.data?.collection_ProgramPersonByAccessToken.length
        ? itemResponse.data.collection_ProgramPersonByAccessToken[0]
        : undefined;
    const item = itemResponse.data?.content_ItemByPersonAccessToken.length
        ? itemResponse.data.content_ItemByPersonAccessToken[0]
        : undefined;
    const elements = item
        ? R.sortWith(
              [
                  (x, y) =>
                      maybeCompare<Content_ElementType_Enum>(
                          x.typeName as Content_ElementType_Enum | null | undefined,
                          y.typeName as Content_ElementType_Enum | null | undefined,
                          (a, b) => contentSortOrder.indexOf(a) - contentSortOrder.indexOf(b)
                      ),
                  (x, y) =>
                      maybeCompare(
                          (x.layoutData as LayoutDataBlob | undefined)?.priority,
                          (y.layoutData as LayoutDataBlob | undefined)?.priority,
                          (a, b) => a - b
                      ),
              ],
              item.elements
          )
        : [];
    return (
        <Center pt={6} w="100%">
            {title}
            {itemResponse.loading && !itemResponse.data ? (
                <CenteredSpinner />
            ) : (
                <Container maxW="container.xl">
                    <VStack spacing={6} alignItems="flex-start" w="100%">
                        <Heading as="h1" fontSize="4xl" textAlign="left">
                            {person ? `Welcome ${person.name}` : "Submission"}
                        </Heading>
                        <LinkButton to={`/submissions/${magicToken}`} colorScheme="SecondaryActionButton" size="md">
                            <FAIcon iconStyle="s" icon="arrow-left" mr={2} /> Back to submissions
                        </LinkButton>
                        {item ? (
                            <Heading as="h2" fontSize="2xl" textAlign="left">
                                {item.title}
                            </Heading>
                        ) : (
                            <Heading as="h2" fontSize="2xl" textAlign="left">
                                Submission not found
                            </Heading>
                        )}
                        {itemResponse.error ? (
                            <Alert status="error" flexDir="column">
                                <AlertTitle>An error has occurred. Please try refreshing.</AlertTitle>
                                <AlertDescription>
                                    <Text>
                                        An error has occured while loading the data for your submission. If this error
                                        persists, please contact our support team with a copy of the error message shown
                                        below.
                                    </Text>
                                    <Code>{itemResponse.error.message}</Code>
                                </AlertDescription>
                            </Alert>
                        ) : undefined}
                        {item ? (
                            <>
                                {elements.length ? (
                                    <VStack spacing={20} alignItems="flex-start" w="100%">
                                        <Text>Please submit or review the content below.</Text>
                                        {elements.map((element) => (
                                            <VStack spacing={4} key={element.id} alignItems="flex-start" w="100%">
                                                <Heading as="h3" fontSize="lg" textAlign="left">
                                                    {element.name}
                                                </Heading>
                                                {element.uploadsRemaining ? (
                                                    <HStack spacing={4}>
                                                        <LinkButton
                                                            colorScheme="PrimaryActionButton"
                                                            size="sm"
                                                            to={`/submissions/${magicToken}/item/${itemId}/element/${element.id}`}
                                                        >
                                                            {element.data &&
                                                            element.data instanceof Array &&
                                                            element.data.length > 0
                                                                ? "Edit"
                                                                : "Submit first version"}
                                                        </LinkButton>
                                                        {(element.typeName ===
                                                            Content_ElementType_Enum.VideoBroadcast ||
                                                            element.typeName ===
                                                                Content_ElementType_Enum.VideoCountdown ||
                                                            element.typeName === Content_ElementType_Enum.VideoFile ||
                                                            element.typeName === Content_ElementType_Enum.VideoFiller ||
                                                            element.typeName ===
                                                                Content_ElementType_Enum.VideoPrepublish ||
                                                            element.typeName ===
                                                                Content_ElementType_Enum.VideoSponsorsFiller ||
                                                            element.typeName ===
                                                                Content_ElementType_Enum.VideoTitles) &&
                                                        element.data &&
                                                        element.data instanceof Array &&
                                                        element.data.length > 0 &&
                                                        (element.data[element.data.length - 1].data as VideoFileBlob)
                                                            ?.subtitles ? (
                                                            <LinkButton
                                                                colorScheme="PrimaryActionButton"
                                                                size="sm"
                                                                to={`/submissions/${magicToken}/item/${itemId}/element/${element.id}`}
                                                            >
                                                                Edit subtitles
                                                            </LinkButton>
                                                        ) : undefined}
                                                        <Text fontSize="sm">
                                                            {element.uploadsRemaining} submission attempts remaining.
                                                        </Text>
                                                    </HStack>
                                                ) : element.typeName === Content_ElementType_Enum.VideoBroadcast ||
                                                  element.typeName === Content_ElementType_Enum.VideoCountdown ||
                                                  element.typeName === Content_ElementType_Enum.VideoFile ||
                                                  element.typeName === Content_ElementType_Enum.VideoFiller ||
                                                  element.typeName === Content_ElementType_Enum.VideoPrepublish ||
                                                  element.typeName === Content_ElementType_Enum.VideoSponsorsFiller ||
                                                  element.typeName === Content_ElementType_Enum.VideoTitles ? (
                                                    <HStack spacing={4}>
                                                        <LinkButton
                                                            colorScheme="PrimaryActionButton"
                                                            size="sm"
                                                            to={`/submissions/${magicToken}/item/${itemId}/element/${element.id}`}
                                                        >
                                                            Edit subtitles
                                                        </LinkButton>
                                                        <Text fontSize="sm">
                                                            This video cannot be resubmitted but you can edit subtitles.
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text fontSize="sm">
                                                        This content cannot be edited. Please contact your conference
                                                        organizers if you wish to change this content.
                                                    </Text>
                                                )}
                                                {element.data instanceof Array && element.data.length > 0 ? (
                                                    <RenderElement data={element.data} />
                                                ) : undefined}
                                            </VStack>
                                        ))}
                                    </VStack>
                                ) : (
                                    <Text>
                                        You are not being asked to submit any content for this item. Your conference
                                        organizers may still be setting up the conference. If you believe this is a
                                        mistake, please contact your conference organizers to ask them to add content to
                                        your submission.
                                    </Text>
                                )}
                            </>
                        ) : (
                            <Text>
                                Please contact your conference organizers to ask them to check your submission link.
                            </Text>
                        )}
                    </VStack>
                </Container>
            )}
        </Center>
    );
}
