import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Center,
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
import React, { useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useGetMediaLiveChannelsQuery } from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";

gql`
    query GetMediaLiveChannels($conferenceId: uuid!) {
        room_Room(where: { mediaLiveChannel: {}, conferenceId: { _eq: $conferenceId } }) {
            mediaLiveChannel {
                cloudFrontDomain
                endpointUri
                id
            }
            name
            id
        }
    }
`;

export function BroadcastRooms({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data, loading, error, refetch } = useGetMediaLiveChannelsQuery({ variables: { conferenceId } });
    useQueryErrorToast(error, false);

    const toStreamingEndpoint = useCallback((endpointUri: string, cloudFrontDomain: string): string => {
        const url = new URL(endpointUri);
        url.hostname = cloudFrontDomain;
        return url.toString();
    }, []);

    const [streamUri, setStreamUri] = useState<string | null>(null);
    const streamDisclosure = useDisclosure();

    return loading && !data ? (
        <Spinner />
    ) : error ? (
        <>Error while loading list of rooms.</>
    ) : (
        <>
            <Center>
                <Button aria-label="Refresh rooms" onClick={() => refetch()} size="sm">
                    <FAIcon icon="sync" iconStyle="s" />
                </Button>
            </Center>
            <Table variant="simple">
                <TableCaption>Rooms that are set up for broadcast</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>HLS URL</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {data?.Room.map((room) => (
                        <Tr key={room.id}>
                            <Td>{room.name}</Td>
                            <Td>
                                <Button
                                    isDisabled={!room.mediaLiveChannel}
                                    onClick={() => {
                                        if (room.mediaLiveChannel) {
                                            setStreamUri(
                                                toStreamingEndpoint(
                                                    room.mediaLiveChannel.endpointUri,
                                                    room.mediaLiveChannel.cloudFrontDomain
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
