import {
    Button,
    ButtonGroup,
    chakra,
    Divider,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useCallback, useMemo, useState } from "react";
import { gql } from "urql";
import {
    Job_Queues_JobStatus_Enum,
    useDeleteRoomRtmpOutputMutation,
    useGetRoomRtmpOutputQuery,
    useInsertRoomRtmpOutputMutation,
    useUpdateRoomRtmpOutputMutation,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";

gql`
    query GetRoomRtmpOutput($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            rtmpOutput {
                id
                created_at
                updated_at
                url
                streamKey
                roomId
            }
            channelStack {
                id
                roomId
                rtmpOutputUri
                rtmpOutputStreamKey
                updateJobs: channelStackUpdateJobs(where: { jobStatusName: { _in: [NEW, IN_PROGRESS] } }) {
                    id
                    created_at
                    updated_at
                    jobStatusName
                    message
                    channelStackId
                }
                mediaLiveChannelStatus {
                    id
                    createdAt
                    updatedAt
                    state
                    channelStackId
                }
            }
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
    const { subconferenceId } = useAuthParameters();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId, subconferenceId]
    );
    const [rtmpOutputResponse, refetchRtmpOutputResponse] = useGetRoomRtmpOutputQuery({
        variables: {
            roomId,
        },
        requestPolicy: "network-only",
        context,
    });
    const [insertResponse, doInsert] = useInsertRoomRtmpOutputMutation();
    const [updateResponse, doUpdate] = useUpdateRoomRtmpOutputMutation();
    const [deleteResponse, doDelete] = useDeleteRoomRtmpOutputMutation();

    const [url, setUrl] = useState<string | null>(null);
    const [key, setKey] = useState<string | null>(null);

    const toast = useToast();

    const rtmpOutput = rtmpOutputResponse.data?.room_Room_by_pk?.rtmpOutput;
    const channelStack = rtmpOutputResponse.data?.room_Room_by_pk?.channelStack;
    const rtmpOutputUpdateRequired =
        channelStack?.rtmpOutputUri != rtmpOutput?.url || channelStack?.rtmpOutputStreamKey != rtmpOutput?.streamKey;
    const channelStatus = channelStack?.mediaLiveChannelStatus;
    const updateJobs = channelStack?.updateJobs[0];
    const isUpdating =
        updateJobs?.jobStatusName === Job_Queues_JobStatus_Enum.New ||
        updateJobs?.jobStatusName === Job_Queues_JobStatus_Enum.InProgress;

    const doSave = useCallback(
        async (url: string, key: string) => {
            try {
                if (
                    !channelStack ||
                    channelStatus?.state === "IDLE" ||
                    confirm("This will stop the ongoing live-stream in this room. Are you sure you wish to continue?")
                ) {
                    if (url !== null && key !== null) {
                        if (rtmpOutput) {
                            if (url === "" || key === "") {
                                await doDelete(
                                    {
                                        id: rtmpOutput.id,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                [AuthHeader.Role]: subconferenceId
                                                    ? HasuraRoleName.SubconferenceOrganizer
                                                    : HasuraRoleName.ConferenceOrganizer,
                                            },
                                        },
                                    }
                                );
                            } else {
                                await doUpdate(
                                    {
                                        id: rtmpOutput.id,
                                        url,
                                        key,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                [AuthHeader.Role]: subconferenceId
                                                    ? HasuraRoleName.SubconferenceOrganizer
                                                    : HasuraRoleName.ConferenceOrganizer,
                                            },
                                        },
                                    }
                                );
                            }
                        } else if (url !== "" && key !== "") {
                            await doInsert(
                                {
                                    roomId,
                                    url,
                                    key,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: subconferenceId
                                                ? HasuraRoleName.SubconferenceOrganizer
                                                : HasuraRoleName.ConferenceOrganizer,
                                        },
                                    },
                                }
                            );
                        }

                        refetchRtmpOutputResponse();
                    }
                }

                setUrl(null);
                setKey(null);
            } catch (e: any) {
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
        [
            channelStack,
            channelStatus?.state,
            rtmpOutput,
            refetchRtmpOutputResponse,
            doDelete,
            subconferenceId,
            doUpdate,
            doInsert,
            roomId,
            toast,
        ]
    );

    return rtmpOutputResponse.fetching && !rtmpOutputResponse.data ? (
        <CenteredSpinner caller="ExternalRtmpBroadcastEditor:214" />
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
                Please note that RTMP output details can only be changed when the live-stream channel is stopped. If you
                change these settings while your stream is running, the stream will be stopped, updated then restarted.
                This process can take up to 20 minutes and will interrupt any ongoing live-stream events in this room.
            </Text>
            <Divider />
            <FormControl>
                <FormLabel>URL</FormLabel>
                <Input
                    value={url ?? rtmpOutput?.url ?? ""}
                    onChange={(ev) => {
                        setUrl(ev.target.value);
                    }}
                    isDisabled={isUpdating}
                />
                <FormHelperText>
                    RTMP URL for your destination service. Leave blank to remove your RTMP Output configuration.
                </FormHelperText>
            </FormControl>
            <FormControl>
                <FormLabel>Stream Key</FormLabel>
                <Input
                    value={key ?? rtmpOutput?.streamKey ?? ""}
                    onChange={(ev) => {
                        setKey(ev.target.value);
                    }}
                    isDisabled={isUpdating}
                />
                <FormHelperText>Stream Key for your destination service (sometimes called Stream Name).</FormHelperText>
            </FormControl>
            {rtmpOutput ? (
                <Text fontSize="sm">Last updated: {new Date(rtmpOutput.updated_at).toLocaleString()} (local time)</Text>
            ) : undefined}
            <Flex w="100%">
                <VStack mr="auto" alignItems="flex-start">
                    <Text fontWeight="bold">Stream information:</Text>
                    <Text pl={4} fontSize="sm">
                        <chakra.span fontStyle="italic">Status:&nbsp;&nbsp;</chakra.span>
                        <chakra.span>{!channelStack ? "STOPPED" : channelStatus?.state ?? "UNKNOWN"}</chakra.span>
                    </Text>
                    {channelStatus ? (
                        <Text pl={4} fontSize="sm">
                            <chakra.span fontStyle="italic">Status updated at:&nbsp;&nbsp;</chakra.span>
                            <chakra.span>
                                {channelStatus?.updatedAt
                                    ? new Date(channelStatus.updatedAt).toLocaleString() + " (local time)"
                                    : "UNKNOWN"}
                            </chakra.span>
                        </Text>
                    ) : undefined}
                    {channelStack ? (
                        <>
                            <Divider />
                            <Text pl={4} fontSize="sm">
                                <chakra.span fontStyle="italic">Current URL:&nbsp;&nbsp;</chakra.span>
                                <chakra.span>{channelStack.rtmpOutputUri ?? "<None>"}</chakra.span>
                            </Text>
                            <Text pl={4} fontSize="sm">
                                <chakra.span fontStyle="italic">Current Stream Key:&nbsp;&nbsp;</chakra.span>
                                <chakra.span>{channelStack.rtmpOutputStreamKey ?? "<None>"}</chakra.span>
                            </Text>
                        </>
                    ) : undefined}
                </VStack>
                <VStack alignItems="flex-start">
                    {isUpdating ? (
                        <>
                            <Text fontWeight="bold">Update in progress</Text>
                            <Text>Please check again in 15 minutes.</Text>
                        </>
                    ) : rtmpOutputUpdateRequired ? (
                        <>
                            <Text fontWeight="bold">Update queued</Text>
                            <Text>Please check again in 15 minutes.</Text>
                        </>
                    ) : undefined}
                    <ButtonGroup spacing={4} alignSelf="flex-end">
                        <Button
                            onClick={() => {
                                setUrl("");
                                setKey("");

                                doSave("", "");
                            }}
                            isDisabled={!rtmpOutput || isUpdating}
                            colorScheme="pink"
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={() => {
                                setUrl(null);
                                setKey(null);
                            }}
                            isDisabled={(url === null && key === null) || isUpdating}
                        >
                            Reset
                        </Button>
                        <Button
                            colorScheme="purple"
                            onClick={() => {
                                if (url !== null || key !== null) {
                                    doSave(url ?? rtmpOutput?.url ?? "", key ?? rtmpOutput?.streamKey ?? "");
                                }
                            }}
                            isLoading={
                                rtmpOutputResponse.fetching ||
                                insertResponse.fetching ||
                                updateResponse.fetching ||
                                deleteResponse.fetching
                            }
                            isDisabled={(url === null && key === null) || isUpdating}
                        >
                            Save
                        </Button>
                    </ButtonGroup>
                </VStack>
            </Flex>
        </VStack>
    );
}
