import { gql } from "@apollo/client";
import {
    Button,
    ButtonGroup,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import {
    useDeleteRoomRtmpOutputMutation,
    useGetRoomRtmpOutputQuery,
    useInsertRoomRtmpOutputMutation,
    useUpdateRoomRtmpOutputMutation,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";

gql`
    query GetRoomRtmpOutput($roomId: uuid!) {
        video_RoomRtmpOutput(where: { roomId: { _eq: $roomId } }) {
            id
            roomId
            created_at
            updated_at
            url
            streamKey
        }
    }

    mutation InsertRoomRtmpOutput($roomId: uuid!, $url: String!, $key: String!) {
        insert_video_RoomRtmpOutput_one(object: { roomId: $roomId, url: $url, streamKey: $key }) {
            id
            roomId
            created_at
            updated_at
            url
            streamKey
        }
    }

    mutation UpdateRoomRtmpOutput($id: uuid!, $url: String!, $key: String!) {
        update_video_RoomRtmpOutput_by_pk(pk_columns: { id: $id }, _set: { url: $url, streamKey: $key }) {
            id
            roomId
            created_at
            updated_at
            url
            streamKey
        }
    }

    mutation DeleteRoomRtmpOutput($id: uuid!) {
        delete_video_RoomRtmpOutput_by_pk(id: $id) {
            id
        }
    }
`;

export default function ExternalRtmpBroadcastEditor({ roomId }: { roomId: string }): JSX.Element {
    const rtmpOutputResponse = useGetRoomRtmpOutputQuery({
        variables: {
            roomId,
        },
        fetchPolicy: "network-only",
    });
    const [doInsert, insertResponse] = useInsertRoomRtmpOutputMutation();
    const [doUpdate, updateResponse] = useUpdateRoomRtmpOutputMutation();
    const [doDelete, deleteResponse] = useDeleteRoomRtmpOutputMutation();

    const [url, setUrl] = useState<string | null>(null);
    const [key, setKey] = useState<string | null>(null);

    const toast = useToast();

    const doSave = useCallback(
        async (url: string, key: string) => {
            try {
                if (url !== null && key !== null) {
                    if (rtmpOutputResponse.data?.video_RoomRtmpOutput?.length) {
                        if (url === "" || key === "") {
                            await doDelete({
                                variables: {
                                    id: rtmpOutputResponse.data.video_RoomRtmpOutput[0].id,
                                },
                            });
                        } else {
                            await doUpdate({
                                variables: {
                                    id: rtmpOutputResponse.data.video_RoomRtmpOutput[0].id,
                                    url,
                                    key,
                                },
                            });
                        }
                    } else if (url !== "" && key !== "") {
                        await doInsert({
                            variables: {
                                roomId,
                                url,
                                key,
                            },
                        });
                    }

                    await rtmpOutputResponse.refetch();

                    setUrl(null);
                    setKey(null);
                }
            } catch (e) {
                toast({
                    status: "error",
                    title: "Error saving RTMP Output configuration",
                    description: e.message,
                    isClosable: true,
                    duration: 60000,
                    position: "top",
                });
            }
        },
        [rtmpOutputResponse, doDelete, doUpdate, doInsert, roomId, toast]
    );

    return rtmpOutputResponse.loading && !rtmpOutputResponse.data ? (
        <CenteredSpinner />
    ) : (
        <VStack spacing={4} justifyContent="flex-start" alignItems="flex-start">
            <Text>
                Entering a URL and Stream Key below will enable RTMP Output broadcast of your live-stream. This can be
                used, for example, to stream your event directly to YouTube.
            </Text>
            <Text>
                Please ensure your stream details are correct. If they are incorrect, the live-stream for this room may
                be unable to start.
            </Text>
            <Text>
                RTMP output must be configured at least 2 hours before the start of the first live-stream in this room
                and cannot be changed after the first live-stream starts. Changes made here will not be applied to an
                existing/ongoing stream.
            </Text>
            {rtmpOutputResponse.data?.video_RoomRtmpOutput?.length ? (
                <>
                    <Divider />
                    <Text>
                        Last updated:{" "}
                        {new Date(rtmpOutputResponse.data?.video_RoomRtmpOutput[0].updated_at).toLocaleString()} (local
                        time)
                    </Text>
                </>
            ) : undefined}
            <Divider />
            <FormControl>
                <FormLabel>URL</FormLabel>
                <Input
                    value={url ?? rtmpOutputResponse.data?.video_RoomRtmpOutput[0]?.url ?? ""}
                    onChange={(ev) => {
                        setUrl(ev.target.value);
                    }}
                />
                <FormHelperText>
                    RTMP URL for your destination service. Leave blank to remove your RTMP Output configuration.
                </FormHelperText>
            </FormControl>
            <FormControl>
                <FormLabel>Stream Key</FormLabel>
                <Input
                    value={key ?? rtmpOutputResponse.data?.video_RoomRtmpOutput[0]?.streamKey ?? ""}
                    onChange={(ev) => {
                        setKey(ev.target.value);
                    }}
                />
                <FormHelperText>Stream Key for your destination service (sometimes called Stream Name).</FormHelperText>
            </FormControl>
            <ButtonGroup spacing={4} alignSelf="flex-end">
                <Button
                    onClick={() => {
                        setUrl("");
                        setKey("");

                        doSave("", "");
                    }}
                    isDisabled={!rtmpOutputResponse.data?.video_RoomRtmpOutput?.length}
                    colorScheme="blue"
                >
                    Clear
                </Button>
                <Button
                    onClick={() => {
                        setUrl(null);
                        setKey(null);
                    }}
                    isDisabled={url === null && key === null}
                >
                    Reset
                </Button>
                <Button
                    colorScheme="purple"
                    onClick={() => {
                        if (url !== null && key !== null) {
                            doSave(url, key);
                        }
                    }}
                    isLoading={
                        rtmpOutputResponse.loading ||
                        insertResponse.loading ||
                        updateResponse.loading ||
                        deleteResponse.loading
                    }
                    isDisabled={url === null || key === null}
                >
                    Save
                </Button>
            </ButtonGroup>
        </VStack>
    );
}
