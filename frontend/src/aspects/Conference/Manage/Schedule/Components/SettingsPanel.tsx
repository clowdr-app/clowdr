import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    chakra,
    Checkbox,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Link,
    ListItem,
    Select,
    Text,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { ElementBaseType, type ElementDataBlob } from "@midspace/shared-types/content";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import type {
    ManageSchedule_FindSuitableRoomsQuery,
    ManageSchedule_FindSuitableRoomsQueryVariables,
    ManageSchedule_InsertRoomMutation,
    ManageSchedule_InsertRoomMutationVariables,
    ManageSchedule_SessionFragment,
} from "../../../../../generated/graphql";
import {
    Content_ElementType_Enum,
    ManageSchedule_FindSuitableRoomsDocument,
    ManageSchedule_InsertRoomDocument,
    Room_ManagementMode_Enum,
    Schedule_Mode_Enum,
    useManageSchedule_GetVideoElementsQuery,
    useManageSchedule_ListSuitableRoomsQuery,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import type { PanelProps } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";
import type { ScheduleEditorRecord, ScheduleEditorRecordExtras } from "./ScheduleEditorRecord";

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
}: PanelProps<ManageSchedule_SessionFragment & ScheduleEditorRecordExtras>): JSX.Element {
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
                modeName: record.modeName ?? Schedule_Mode_Enum.VideoChat,
                enableRecording: record.enableRecording ?? true,
                automaticParticipationSurvey: record.automaticParticipationSurvey ?? true,
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

    const [autoPlayEventResponse, refetchAutoPlayEvents] = useManageSchedule_GetVideoElementsQuery({
        variables: {
            sessionId: record.id ?? "00000000-0000-0000-0000-000000000000",
            sessionExists: Boolean(record.id),
            sessionItemId: record.itemId ?? record.item?.id ?? "00000000-0000-0000-0000-000000000000",
            sessionItemIdExists: Boolean(record.itemId ?? record.item?.id),
        },
        context,
        pause: !record.id || record.modeName !== Schedule_Mode_Enum.Livestream,
        requestPolicy: "cache-and-network",
    });
    const autoPlayEvent = autoPlayEventResponse.data?.schedule_Event_by_pk;
    const autoPlayContent = autoPlayEventResponse.data?.content_Item_by_pk;
    const autoPlayElementOptions = useMemo<
        {
            label: string;
            value: string;
        }[]
    >(
        () => [
            ...(autoPlayContent
                ? autoPlayContent.elements.map((x) => ({
                      label: autoPlayContent?.title + " - " + x.name,
                      value: x.id,
                  }))
                : []),
            ...(autoPlayEvent?.presentations.flatMap(
                (pres) =>
                    pres.item?.elements.map((x) => ({
                        label: pres.item?.title + " - " + x.name,
                        value: x.id,
                    })) ?? []
            ) ?? []),
            ...(autoPlayEvent?.exhibition?.items.flatMap((item) =>
                item.item.elements.map((x) => ({
                    label: item.item.title + " - " + x.name,
                    value: x.id,
                }))
            ) ?? []),
        ],
        [autoPlayContent, autoPlayEvent?.exhibition?.items, autoPlayEvent?.presentations]
    );
    useEffect(() => {
        if (record.modeName === Schedule_Mode_Enum.Livestream) {
            refetchAutoPlayEvents({
                requestPolicy: "network-only",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [record.modeName]);

    return (
        <VStack spacing={8} p={0}>
            {!record.modeName || selectableModes.includes(record.modeName) ? (
                <FormControl id="editor-session-mode">
                    <FormLabel>Interaction mode</FormLabel>
                    <Select
                        value={record.modeName ?? Schedule_Mode_Enum.VideoChat}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({
                                ...old,
                                modeName: ev.target.value as Schedule_Mode_Enum,
                            }));
                        }}
                    >
                        {selectableModes.map((mode) => (
                            <option key={mode} value={mode}>
                                {modeToLabel(mode)}
                            </option>
                        ))}
                    </Select>
                    <Explanation>
                        Determines the way attendees and speakers will interact during this event.
                    </Explanation>
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
                        {suitableRoomsResponse.data?.otherRooms
                            .filter((x) => !suitableRoomsResponse.data?.suggestedRooms.some((y) => y.id === x.id))
                            .map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                    </optgroup>
                </Select>
                <Explanation>
                    <Text>
                        Sessions are scheduled in rooms, much like they would be in a physical venue. Rooms are flexible
                        spaces with persistent chats. The session defines the mode of interaction within the room during
                        the session.
                    </Text>
                    <Text>
                        There is a conference-wide limit on the number of rooms with events scheduled in them (similar
                        to the fact that a conference venue only has a finite number of rooms). Rooms should be re-used,
                        for example by assigning all events for a single track to the same room.
                    </Text>
                    <Text>
                        Midspace will attempt to automatically select a room for you but you may need to set this
                        manually for complex schedules or special events (e.g. sessions in sponsor&lsquo;s booths).
                    </Text>
                </Explanation>
            </FormControl>
            {record.modeName === Schedule_Mode_Enum.Livestream ? (
                <FormControl id="editor-session-auto-play-video">
                    <FormLabel>Auto-play video</FormLabel>
                    <Select
                        value={record.autoPlayElementId ?? ""}
                        onChange={(ev) => {
                            onAnyChange();

                            const value = ev.target.value;
                            updateRecord((old) => ({
                                ...old,
                                autoPlayElementId: value.length ? value : undefined,
                            }));
                        }}
                    >
                        <option value="">No auto-play</option>
                        {autoPlayElementOptions.map((x) => (
                            <option key={x.value} value={x.value}>
                                {x.label}
                            </option>
                        ))}
                    </Select>
                    <Explanation>Start the session by automatically playing out the selected video.</Explanation>
                </FormControl>
            ) : record.modeName === Schedule_Mode_Enum.External ? (
                <VStack spacing={2} w="100%" alignItems="flex-start">
                    <FormControl id="editor-session-external-event-link">
                        <FormLabel>External event link</FormLabel>
                        <Input
                            type="text"
                            value={
                                record.item?.externalEventLink?.[0]?.data?.[
                                    record.item.externalEventLink[0].data.length - 1
                                ]?.data.url ?? ""
                            }
                            onChange={(ev) => {
                                onAnyChange();

                                const value = ev.target.value;
                                updateRecord((old) => ({
                                    ...old,
                                    item: old.item
                                        ? {
                                              ...old.item,
                                              externalEventLink: value.length
                                                  ? old.item.externalEventLink?.length
                                                      ? [
                                                            {
                                                                ...old.item.externalEventLink[0],
                                                                isHidden: true,
                                                                typeName: Content_ElementType_Enum.ExternalEventLink,
                                                                uploadsRemaining: 0,
                                                                data: old.item.externalEventLink[0].data?.length
                                                                    ? ([
                                                                          {
                                                                              ...old.item.externalEventLink[0].data[0],
                                                                              data: {
                                                                                  baseType: ElementBaseType.URL,
                                                                                  type: Content_ElementType_Enum.ExternalEventLink,
                                                                                  url: value,
                                                                              },
                                                                          },
                                                                      ] as ElementDataBlob)
                                                                    : ([
                                                                          {
                                                                              createdAt: Date.now(),
                                                                              createdBy: "user",
                                                                              data: {
                                                                                  baseType: ElementBaseType.URL,
                                                                                  type: Content_ElementType_Enum.ExternalEventLink,
                                                                                  url: value,
                                                                              },
                                                                          },
                                                                      ] as ElementDataBlob),
                                                            },
                                                        ]
                                                      : [
                                                            {
                                                                name: "Zoom",
                                                                isHidden: true,
                                                                typeName: Content_ElementType_Enum.ExternalEventLink,
                                                                uploadsRemaining: 0,
                                                                data: [
                                                                    {
                                                                        createdAt: Date.now(),
                                                                        createdBy: "user",
                                                                        data: {
                                                                            baseType: ElementBaseType.URL,
                                                                            type: Content_ElementType_Enum.ExternalEventLink,
                                                                            url: value,
                                                                        },
                                                                    },
                                                                ] as ElementDataBlob,
                                                            },
                                                        ]
                                                  : undefined,
                                          }
                                        : value.length
                                        ? {
                                              externalEventLink: [
                                                  {
                                                      name: "Zoom",
                                                      isHidden: true,
                                                      typeName: Content_ElementType_Enum.ExternalEventLink,
                                                      uploadsRemaining: 0,
                                                      data: [
                                                          {
                                                              createdAt: Date.now(),
                                                              createdBy: "user",
                                                              data: {
                                                                  baseType: ElementBaseType.URL,
                                                                  type: Content_ElementType_Enum.ExternalEventLink,
                                                                  url: value,
                                                              },
                                                          },
                                                      ] as ElementDataBlob,
                                                  },
                                              ],
                                          }
                                        : undefined,
                                }));
                            }}
                        />
                        <Explanation>
                            Link for attendees to join the external event. This should include any password fields or
                            similar (e.g. when using Zoom, include the full link provided by Zoom).
                        </Explanation>
                    </FormControl>
                    <FormControl id="editor-session-external-event-service-name">
                        <FormLabel>External event service name</FormLabel>
                        <Input
                            type="text"
                            value={record.item?.externalEventLink?.[0]?.name ?? "Zoom"}
                            onChange={(ev) => {
                                onAnyChange();

                                const value = ev.target.value;
                                updateRecord((old) => ({
                                    ...old,
                                    item: old.item
                                        ? {
                                              ...old.item,
                                              externalEventLink: value.length
                                                  ? old.item.externalEventLink?.length
                                                      ? [
                                                            {
                                                                ...old.item.externalEventLink[0],
                                                                name: value,
                                                                isHidden: true,
                                                                typeName: Content_ElementType_Enum.ExternalEventLink,
                                                                uploadsRemaining: 0,
                                                            },
                                                        ]
                                                      : [
                                                            {
                                                                name: value,
                                                                data: [] as ElementDataBlob,
                                                                isHidden: true,
                                                                typeName: Content_ElementType_Enum.ExternalEventLink,
                                                                uploadsRemaining: 0,
                                                            },
                                                        ]
                                                  : undefined,
                                          }
                                        : value.length
                                        ? {
                                              externalEventLink: [
                                                  {
                                                      name: value,
                                                      data: [] as ElementDataBlob,
                                                      isHidden: true,
                                                      typeName: Content_ElementType_Enum.ExternalEventLink,
                                                      uploadsRemaining: 0,
                                                  },
                                              ],
                                          }
                                        : undefined,
                                }));
                            }}
                        />
                        <Explanation>
                            Name of the external service, displayed as part of the button shown to attendees. E.g.
                            &ldquo;Join in Zoom&rdquo;, where &ldquo;Zoom&rdquo; is the external service name.
                        </Explanation>
                    </FormControl>
                </VStack>
            ) : undefined}
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
                    <Explanation>
                        <Text>Tick the box to enable automatic recording for this session.</Text>
                        <UnorderedList spacing={1}>
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
                    </Explanation>
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
                <Explanation>
                    <Text>
                        Tick the box to automatically post a participation survey in the chat at the end of the session.
                    </Text>
                    <Text>
                        The survey remains open for 5 minutes and allows attendees to log their attendance, provide a
                        rating on a 5-point scale, and leave a private comment.
                    </Text>
                </Explanation>
            </FormControl>
            {/* TODO: continuations */}
            <FormControl>
                <FormLabel>StreamText Event Id</FormLabel>
                <VStack spacing={2} alignItems="flex-start" w="100%">
                    <Input
                        type="text"
                        value={record.streamTextEventId ?? ""}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({
                                ...old,
                                streamTextEventId: ev.target.value.length ? ev.target.value : null,
                            }));
                        }}
                    />
                    <Explanation>
                        <Text>
                            The event id obtained from StreamText. This is just the id, not the full URL. Leave blank to
                            remove the integration.
                        </Text>
                        <Text>
                            StreamText is a 3rd party service for delivering real-time live captions. If you have a
                            StreamText account you can configure an event and input your event id below. This will embed
                            the StreamText feed within Midspace during this event.
                        </Text>
                        <Text>
                            Learn more at{" "}
                            <Link href="https://streamtext.net" isExternal>
                                StreamText.Net
                                <sup>
                                    <ExternalLinkIcon />
                                </sup>
                            </Link>
                            .
                        </Text>
                        <Text>
                            The Midspace platform and software are not affiliated with StreamText.Net in any way. We
                            cannot provide support with your StreamText feed. We are not responsible for any issue
                            caused by StreamText software embedded within this site.
                        </Text>
                    </Explanation>
                </VStack>
            </FormControl>
        </VStack>
    );
}

function Explanation({ children }: React.PropsWithChildren<Record<never, any>>) {
    const [expanded, setExpanded] = useState<boolean>(false);
    return (
        <FormHelperText>
            {expanded ? (
                <>
                    <VStack spacing={1} alignItems="flex-start" w="100%">
                        {typeof children === "string" ? <Text>{children}</Text> : children}
                        <Link
                            pt={1}
                            href="#"
                            onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                setExpanded(false);
                            }}
                        >
                            Hide
                        </Link>
                    </VStack>
                </>
            ) : (
                <Link
                    href="#"
                    onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setExpanded(true);
                    }}
                    textDecoration="none"
                >
                    <FAIcon iconStyle="s" icon="info-circle" mr={1} verticalAlign="middle" />
                    <chakra.span verticalAlign="middle">What is this?</chakra.span>
                </Link>
            )}
        </FormHelperText>
    );
}
