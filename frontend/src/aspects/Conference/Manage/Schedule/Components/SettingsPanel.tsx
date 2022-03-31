import {
    Checkbox,
    FormControl,
    FormHelperText,
    FormLabel,
    ListItem,
    Select,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_FindSuitableRoomsQuery,
    ManageSchedule_FindSuitableRoomsQueryVariables,
    ManageSchedule_InsertRoomMutation,
    ManageSchedule_InsertRoomMutationVariables,
    ManageSchedule_SessionFragment,
} from "../../../../../generated/graphql";
import {
    ManageSchedule_FindSuitableRoomsDocument,
    ManageSchedule_InsertRoomDocument,
    Room_ManagementMode_Enum,
    Schedule_Mode_Enum,
    useManageSchedule_ListSuitableRoomsQuery,
} from "../../../../../generated/graphql";
import type { PanelProps } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";
import type { ScheduleEditorRecord } from "./ScheduleEditorRecord";

gql`
    query ManageSchedule_ListSuitableRooms(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $modes: [schedule_Mode_enum!]!
        $namePattern: String!
    ) {
        suggestedRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                itemId: { _is_null: true }
                _or: [
                    { events: { modeName: { _in: $modes } } }
                    { isProgramRoom: { _eq: false }, name: { _ilike: $namePattern } }
                ]
            }
            order_by: [{ name: asc }]
        ) {
            id
            name
        }

        otherRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                isProgramRoom: { _eq: false }
                _or: [{ itemId: { _is_null: true } }, { item: { typeName: { _eq: SPONSOR } } }]
            }
            order_by: [{ name: asc }]
        ) {
            id
            name
        }
    }

    query ManageSchedule_FindSuitableRooms(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $modes: [schedule_Mode_enum!]!
        $startBefore: timestamptz!
        $endAfter: timestamptz!
        $namePattern: String!
    ) {
        programRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                itemId: { _is_null: true }
                _and: [
                    { events: { modeName: { _in: $modes } } }
                    {
                        _not: {
                            events: { scheduledStartTime: { _lt: $startBefore }, scheduledEndTime: { _gt: $endAfter } }
                        }
                    }
                ]
            }
            order_by: [{ name: asc }]
            limit: 1
        ) {
            id
        }

        nonProgramRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                isProgramRoom: { _eq: false }
                itemId: { _is_null: true }
                name: { _ilike: $namePattern }
            }
            order_by: [{ name: asc }]
            limit: 1
        ) {
            id
        }

        conference_RemainingQuota(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            remainingStreamingProgramRooms
            remainingNonStreamingProgramRooms
            remainingPublicSocialRooms
        }
    }

    mutation ManageSchedule_InsertRoom($object: room_Room_insert_input!) {
        insert_room_Room_one(object: $object) {
            id
        }
    }
`;

function modeToLabel(mode: Schedule_Mode_Enum): string {
    switch (mode) {
        case Schedule_Mode_Enum.Exhibition:
            return "Breakout video-chat (exhibition)";
        case Schedule_Mode_Enum.External:
            return "External (e.g. Zoom, MS Teams or other platforms)";
        case Schedule_Mode_Enum.Livestream:
            return "Live-stream";
        case Schedule_Mode_Enum.None:
            return "No interaction";
        case Schedule_Mode_Enum.Shuffle:
            return "Networking";
        case Schedule_Mode_Enum.VideoChat:
            return "Video-chat";
        case Schedule_Mode_Enum.VideoPlayer:
            return "Video player (unmonitored session mirroring)";
    }
}

export default function SettingsPanel({ record, ...props }: PanelProps<ScheduleEditorRecord>): JSX.Element {
    if ("sessionEventId" in record && record.sessionEventId) {
        return <>No settings to configure.</>;
    }
    return <SessionSettingsPanel record={record} {...props} />;
}

function SessionSettingsPanel({
    isCreate: _isCreate,
    isDisabled: _isDisabled,
    clearState: _clearState,
    firstInputRef: _firstInputRef,
    record,
    updateRecord,
    onValid,
    onInvalid,
    onAnyChange,
}: PanelProps<ManageSchedule_SessionFragment>): JSX.Element {
    const selectableModes = useMemo<Schedule_Mode_Enum[]>(
        () => [
            Schedule_Mode_Enum.VideoChat,
            Schedule_Mode_Enum.Livestream,
            Schedule_Mode_Enum.External,
            Schedule_Mode_Enum.VideoPlayer,
            Schedule_Mode_Enum.None,
        ],
        []
    );

    useEffect(() => {
        if (
            !record.modeName ||
            record.enableRecording === undefined ||
            record.automaticParticipationSurvey === undefined
        ) {
            onAnyChange();
            updateRecord((old) => ({
                ...old,
                modeName: Schedule_Mode_Enum.VideoChat,
                enableRecording: true,
                automaticParticipationSurvey: true,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [record.automaticParticipationSurvey, record.enableRecording, record.modeName]);

    useEffect(() => {
        if (!record.roomId) {
            onInvalid({ error: "No remaining program room quotas available." });
        } else {
            onValid();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [record.roomId]);

    const client = useClient();
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [suitableRoomsResponse, refetchSuitableRooms] = useManageSchedule_ListSuitableRoomsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            modes:
                record.modeName === Schedule_Mode_Enum.Livestream
                    ? [Schedule_Mode_Enum.Livestream]
                    : [
                          Schedule_Mode_Enum.Exhibition,
                          Schedule_Mode_Enum.External,
                          Schedule_Mode_Enum.None,
                          Schedule_Mode_Enum.Shuffle,
                          Schedule_Mode_Enum.VideoChat,
                          Schedule_Mode_Enum.VideoPlayer,
                      ],
            namePattern: record.modeName === Schedule_Mode_Enum.Livestream ? "Live-stream Track %" : "Track %",
        },
        context,
        requestPolicy: "cache-and-network",
    });
    const computingSuitableRoomRef = useRef<boolean>(false);
    const [roomWasAutoSet, setRoomWasAutoSet] = useState<boolean>(false);
    useEffect(() => {
        if (!computingSuitableRoomRef.current) {
            computingSuitableRoomRef.current = true;
            (async () => {
                try {
                    if (
                        (!record.roomId?.length || roomWasAutoSet) &&
                        record.modeName &&
                        record.scheduledStartTime &&
                        record.scheduledEndTime
                    ) {
                        setRoomWasAutoSet(true);

                        const response = await client
                            .query<
                                ManageSchedule_FindSuitableRoomsQuery,
                                ManageSchedule_FindSuitableRoomsQueryVariables
                            >(
                                ManageSchedule_FindSuitableRoomsDocument,
                                {
                                    conferenceId: conference.id,
                                    subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
                                    startBefore: record.scheduledEndTime,
                                    endAfter: record.scheduledStartTime,
                                    modes:
                                        record.modeName === Schedule_Mode_Enum.Livestream
                                            ? [Schedule_Mode_Enum.Livestream]
                                            : [
                                                  Schedule_Mode_Enum.Exhibition,
                                                  Schedule_Mode_Enum.External,
                                                  Schedule_Mode_Enum.None,
                                                  Schedule_Mode_Enum.Shuffle,
                                                  Schedule_Mode_Enum.VideoChat,
                                                  Schedule_Mode_Enum.VideoPlayer,
                                              ],
                                    namePattern:
                                        record.modeName === Schedule_Mode_Enum.Livestream
                                            ? "Live-stream Track %"
                                            : "Track %",
                                },
                                { ...context, requestPolicy: "network-only" }
                            )
                            .toPromise();

                        if (response.data?.programRooms.length) {
                            const roomId = response.data.programRooms[0].id;
                            updateRecord((old) => ({
                                ...old,
                                roomId,
                            }));
                        } else if (response.data?.conference_RemainingQuota) {
                            const quota = response.data.conference_RemainingQuota[0];
                            if (record.modeName === Schedule_Mode_Enum.Livestream) {
                                if (quota.remainingStreamingProgramRooms) {
                                    if (response.data?.nonProgramRooms.length) {
                                        const roomId = response.data.nonProgramRooms[0].id;
                                        updateRecord((old) => ({
                                            ...old,
                                            roomId,
                                        }));
                                    } else {
                                        const response2 = await client
                                            .mutation<
                                                ManageSchedule_InsertRoomMutation,
                                                ManageSchedule_InsertRoomMutationVariables
                                            >(
                                                ManageSchedule_InsertRoomDocument,
                                                {
                                                    object: {
                                                        conferenceId: conference.id,
                                                        managementModeName: Room_ManagementMode_Enum.Public,
                                                        name:
                                                            "Live-stream Track " + Math.round(Math.random() * 10000000),
                                                        priority: 8,
                                                        subconferenceId,
                                                    },
                                                },
                                                context
                                            )
                                            .toPromise();
                                        if (response2.error) {
                                            onInvalid({
                                                error:
                                                    extractActualError(response2.error) ??
                                                    "Unknown error creating a room for the session.",
                                            });
                                        } else if (response2.data?.insert_room_Room_one) {
                                            const roomId = response2.data?.insert_room_Room_one.id;
                                            updateRecord((old) => ({
                                                ...old,
                                                roomId,
                                            }));
                                        }
                                    }
                                } else {
                                    onInvalid({ error: "No remaining quota for streaming rooms." });
                                }
                            } else {
                                if (quota.remainingNonStreamingProgramRooms) {
                                    if (response.data?.nonProgramRooms.length) {
                                        const roomId = response.data.nonProgramRooms[0].id;
                                        updateRecord((old) => ({
                                            ...old,
                                            roomId,
                                        }));
                                    } else {
                                        const response2 = await client
                                            .mutation<
                                                ManageSchedule_InsertRoomMutation,
                                                ManageSchedule_InsertRoomMutationVariables
                                            >(
                                                ManageSchedule_InsertRoomDocument,
                                                {
                                                    object: {
                                                        conferenceId: conference.id,
                                                        managementModeName: Room_ManagementMode_Enum.Public,
                                                        name: "Track " + Math.round(Math.random() * 10000000),
                                                        priority: 9,
                                                        subconferenceId,
                                                    },
                                                },
                                                context
                                            )
                                            .toPromise();
                                        if (response2.error) {
                                            onInvalid({
                                                error:
                                                    extractActualError(response2.error) ??
                                                    "Unknown error creating a room for the session.",
                                            });
                                        } else if (response2.data?.insert_room_Room_one) {
                                            const roomId = response2.data?.insert_room_Room_one.id;
                                            updateRecord((old) => ({
                                                ...old,
                                                roomId,
                                            }));
                                        }
                                    }
                                } else {
                                    onInvalid({ error: "No remaining quota for non-streaming rooms." });
                                }
                            }
                        } else if (response.error) {
                            onInvalid({
                                error:
                                    extractActualError(response.error) ??
                                    "Unknown error choosing a room for the session.",
                            });
                        }

                        onAnyChange();
                        refetchSuitableRooms();
                    }
                } finally {
                    computingSuitableRoomRef.current = false;
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        client,
        conference.id,
        context,
        record.roomId,
        record.modeName,
        record.scheduledEndTime,
        record.scheduledStartTime,
        refetchSuitableRooms,
        subconferenceId,
    ]);

    return (
        <VStack spacing={6} p={0}>
            {!record.modeName || selectableModes.includes(record.modeName) ? (
                <FormControl id="editor-session-mode">
                    <FormLabel>Interaction mode</FormLabel>
                    <Select
                        value={record.modeName ?? Schedule_Mode_Enum.VideoChat}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({ ...old, modeName: ev.target.value as Schedule_Mode_Enum }));
                        }}
                    >
                        {selectableModes.map((mode) => (
                            <option key={mode} value={mode}>
                                {modeToLabel(mode)}
                            </option>
                        ))}
                    </Select>
                    <FormHelperText>
                        Determines the way attendees and speakers will interact during this event.
                    </FormHelperText>
                </FormControl>
            ) : undefined}
            <FormControl id="editor-session-room">
                <FormLabel>Room</FormLabel>
                <Select
                    value={record.roomId ?? ""}
                    onChange={(ev) => {
                        onAnyChange();
                        updateRecord((old) => ({
                            ...old,
                            roomId: ev.target.value === "" ? undefined : ev.target.value,
                        }));
                        setRoomWasAutoSet(ev.target.value === "");
                    }}
                >
                    <option value="">Select a room</option>
                    <optgroup label="Suggested rooms">
                        {suitableRoomsResponse.data?.suggestedRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.name}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Other rooms">
                        {suitableRoomsResponse.data?.otherRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.name}
                            </option>
                        ))}
                    </optgroup>
                </Select>
                <FormHelperText>
                    Sessions are scheduled in rooms, much like they would be in a physical venue. Rooms are flexible
                    spaces with persistent chats. The session defines the mode of interaction within the room during the
                    session. There is a conference-wide limit on the number of rooms with events scheduled in them
                    (similar to the fact that a conference venue only has a finite number of rooms). Midspace will
                    attempt to automatically select a room for you but you may need to set this manually for complex
                    schedules or special events (e.g. sessions in sponsor&lsquo;s booths). Rooms should be re-used, for
                    example by assigning all events for a single track to the same room.
                </FormHelperText>
            </FormControl>
            {/* TODO: auto play element id */}
            {record.modeName === Schedule_Mode_Enum.Livestream || record.modeName === Schedule_Mode_Enum.VideoChat ? (
                <FormControl id="editor-session-recording">
                    <FormLabel>Automatic recording?</FormLabel>
                    <Checkbox
                        isChecked={record.enableRecording}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({ ...old, enableRecording: ev.target.checked }));
                        }}
                    />
                    <FormHelperText>
                        Check to enable automatic recording for this session.
                        <UnorderedList>
                            <ListItem
                                fontWeight={record.modeName === Schedule_Mode_Enum.VideoChat ? "bold" : undefined}
                            >
                                For video-chat events, recording can also be started/stopped manually during the
                                session.
                            </ListItem>
                            <ListItem
                                fontWeight={record.modeName === Schedule_Mode_Enum.Livestream ? "bold" : undefined}
                            >
                                For live-stream events, recording cannot be manually controlled - this option is the
                                only way to enable recording.
                            </ListItem>
                        </UnorderedList>
                    </FormHelperText>
                </FormControl>
            ) : undefined}
            <FormControl id="editor-session-participation-survey">
                <FormLabel>Automatic participation survey?</FormLabel>
                <Checkbox
                    isChecked={record.automaticParticipationSurvey}
                    onChange={(ev) => {
                        onAnyChange();
                        updateRecord((old) => ({ ...old, automaticParticipationSurvey: ev.target.checked }));
                    }}
                />
                <FormHelperText>
                    Check to automatically post a participation survey in the chat at the end of the session.
                    <br />
                    <br />
                    The survey remains open for 5 minutes and allows attendees to log their attendance, provide a rating
                    on a 5-point scale, and leave a private comment.
                </FormHelperText>
            </FormControl>
        </VStack>
    );
}
