import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Table,
    TableCaption,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useDisclosure,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useCallback, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import { gql } from "urql";
import { useGetChannelStacksQuery } from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";

gql`
    query GetChannelStacks($conferenceId: uuid!) {
        room_Room(where: { channelStack: {}, conferenceId: { _eq: $conferenceId } }) {
            channelStack {
                cloudFrontDomain
                endpointUri
                id
                roomId
            }
            name
            id
            conferenceId
        }
    }
`;

export function BroadcastRooms({ conferenceId }: { conferenceId: string }): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [{ data, fetching: loading, error }, refetch] = useGetChannelStacksQuery({
        variables: { conferenceId },
        context,
    });
    useQueryErrorToast(error, false);

    const toStreamingEndpoint = useCallback((endpointUri: string, cloudFrontDomain: string): string => {
        const url = new URL(endpointUri);
        url.hostname = cloudFrontDomain;
        return url.toString();
    }, []);

    const [streamUri, setStreamUri] = useState<string | null>(null);
    const streamDisclosure = useDisclosure();

    return (
        <>
            {loading ? <Spinner /> : undefined}
            {error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>Failed to load data</AlertTitle>
                    <AlertDescription>
                        {error.name}: {error.message}
                    </AlertDescription>
                </Alert>
            ) : undefined}

            <Button aria-label="Refresh rooms" onClick={() => refetch()} size="sm">
                <FAIcon icon="sync" iconStyle="s" />
            </Button>
            <Table variant="simple" w="100%">
                <TableCaption>Rooms that are set up for broadcast</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>HLS URL</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {data?.room_Room.map((room) => (
                        <Tr key={room.id}>
                            <Td>{room.name}</Td>
                            <Td>
                                <Button
                                    isDisabled={!room.channelStack}
                                    onClick={() => {
                                        if (room.channelStack) {
                                            setStreamUri(
                                                toStreamingEndpoint(
                                                    room.channelStack.endpointUri,
                                                    room.channelStack.cloudFrontDomain
                                                )
                                            );
                                            streamDisclosure.onOpen();
                                        }
                                    }}
                                >
                                    Preview stream
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <Modal isCentered isOpen={streamDisclosure.isOpen} onClose={streamDisclosure.onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Stream preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {streamUri ? (
                            <>
                                <Text mb={2} fontSize="sm">
                                    {streamUri}
                                </Text>
                                <Box mb={2}>
                                    <ReactPlayer
                                        width="600"
                                        height="auto"
                                        url={streamUri}
                                        config={{
                                            file: {
                                                hlsOptions: {},
                                            },
                                        }}
                                        controls={true}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Text>No stream preview available.</Text>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
