import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    chakra,
    Flex,
    Heading,
    HStack,
    List,
    ListItem,
    Spinner,
    Tag,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import AmazonS3URI from "amazon-s3-uri";
import React from "react";
import { useMyRecordingsQuery } from "../../../../generated/graphql";
import { ExternalLinkButton, LinkButton } from "../../../Chakra/LinkButton";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    query MyRecordings($registrantId: uuid!) {
        registrant_SavedVonageRoomRecording(
            where: { registrantId: { _eq: $registrantId } }
            order_by: { recording: { endedAt: desc } }
        ) {
            id
            recording {
                id
                room {
                    id
                    name
                }
                startedAt
                endedAt
                s3Url
            }
        }
    }
`;

export default function MyRecordingsPage(): JSX.Element {
    const title = useTitle("Recordings");

    const conference = useConference();
    const registrant = useCurrentRegistrant();
    const response = useMyRecordingsQuery({
        variables: {
            registrantId: registrant.id,
        },
        fetchPolicy: "network-only",
    });

    const bgColor = useColorModeValue("gray.200", "gray.700");

    return (
        <>
            {title}
            <VStack mt={4} spacing={6}>
                <Heading as="h1" fontSize="4xl">
                    My Recordings
                </Heading>
                {response.loading && !response.data ? (
                    <HStack spacing={2}>
                        <Box>
                            <Spinner />
                        </Box>
                        <Text>Loading your recordings</Text>
                    </HStack>
                ) : undefined}
                {response.error ? (
                    <Alert status="error">
                        <AlertTitle>
                            <AlertIcon />
                            Error loading recordings
                        </AlertTitle>
                        <AlertDescription>{response.error.message}</AlertDescription>
                    </Alert>
                ) : undefined}
                {response.data ? (
                    response.data.registrant_SavedVonageRoomRecording.length > 0 ? (
                        <List spacing={4}>
                            {response.data.registrant_SavedVonageRoomRecording.map((save) => {
                                let bucket: string | null = null;
                                let key: string | null = null;
                                try {
                                    if (save.recording.s3Url) {
                                        const output = new AmazonS3URI(save.recording.s3Url);
                                        if (output?.bucket && output?.key) {
                                            bucket = output?.bucket;
                                            key = output?.key;
                                        }
                                    }
                                } catch (e) {
                                    console.error("Could not parse s3Url", save.recording.s3Url);
                                }

                                return (
                                    <ListItem key={save.id} bgColor={bgColor} p={4} overflow="hidden">
                                        <VStack alignItems="flex-start" spacing={4}>
                                            <Heading as="h2" fontSize="md" textAlign="left" w="100%" display="flex">
                                                <chakra.span mr="auto">
                                                    {save.recording.room?.name ?? "Unknown room"}
                                                </chakra.span>
                                                <chakra.span>
                                                    {new Date(save.recording.startedAt).toLocaleString(undefined, {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </chakra.span>
                                            </Heading>
                                            <Flex overflow="hidden" minW="100%">
                                                <VStack alignItems="flex-start" mr={12}>
                                                    {save.recording.endedAt ? (
                                                        <Text>
                                                            Ended at{" "}
                                                            {new Date(save.recording.endedAt).toLocaleTimeString(
                                                                undefined,
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </Text>
                                                    ) : (
                                                        <Text>Ongoing meeting</Text>
                                                    )}
                                                </VStack>
                                                <VStack ml="auto" alignItems="flex-end">
                                                    {bucket && key ? (
                                                        <ExternalLinkButton
                                                            linkProps={{ m: "3px" }}
                                                            isExternal
                                                            to={`https://${bucket}.s3-${
                                                                import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                                                            }.amazonaws.com/${key}`}
                                                            colorScheme="purple"
                                                        >
                                                            Download
                                                        </ExternalLinkButton>
                                                    ) : save.recording.endedAt ? (
                                                        <Tag
                                                            colorScheme="purple"
                                                            size="lg"
                                                            variant="outline"
                                                            whiteSpace="nowrap"
                                                            overflow="hidden"
                                                        >
                                                            Not yet available
                                                        </Tag>
                                                    ) : save.recording.room ? (
                                                        <LinkButton
                                                            linkProps={{ m: "3px" }}
                                                            to={`/conference/${conference.slug}/room/${save.recording.room.id}`}
                                                            colorScheme="purple"
                                                        >
                                                            Go to room
                                                        </LinkButton>
                                                    ) : undefined}
                                                </VStack>
                                            </Flex>
                                        </VStack>
                                    </ListItem>
                                );
                            })}
                        </List>
                    ) : (
                        <Text>You do not currently have any saved recordings.</Text>
                    )
                ) : undefined}
            </VStack>
        </>
    );
}
