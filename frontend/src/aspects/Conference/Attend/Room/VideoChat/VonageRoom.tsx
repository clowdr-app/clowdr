import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    ButtonGroup,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as portals from "react-reverse-portal";
import { useClient } from "urql";
import type {
    GetRoomVonageSessionIdQuery,
    GetRoomVonageSessionIdQueryVariables,
    RoomPage_RoomDetailsFragment,
} from "../../../../../generated/graphql";
import {
    GetRoomVonageSessionIdDocument,
    useGetEventVonageTokenMutation,
    useGetRoomVonageTokenMutation,
} from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { useShieldedHeaders } from "../../../../GQL/useShieldedHeaders";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

gql`
    mutation GetEventVonageToken($eventId: uuid!, $registrantId: uuid!) {
        joinEventVonageSession(eventId: $eventId, registrantId: $registrantId) {
            accessToken
            isRecorded
        }
    }

    mutation GetRoomVonageToken($roomId: uuid!, $registrantId: uuid!) {
        joinRoomVonageSession(roomId: $roomId, registrantId: $registrantId) {
            accessToken
            sessionId
            isRecorded
        }
    }

    query GetRoomVonageSessionId($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            publicVonageSessionId
        }
    }
`;

export function VideoChatVonageRoom({
    room,
    eventId,
    enable,
    eventIsFuture,
    isChairOrOrganizer,
}: {
    room: RoomPage_RoomDetailsFragment;
    eventId: string | undefined;
    enable: boolean;
    eventIsFuture: boolean;
    isChairOrOrganizer: boolean;
}): JSX.Element {
    const sharedRoomContext = useSharedRoomContext();
    const { id: registrantId } = useCurrentRegistrant();

    const context = useShieldedHeaders({
        "X-Auth-Role": "room-member",
        "X-Auth-Room-Id": room.id,
    });
    const [, getRoomVonageToken] = useGetRoomVonageTokenMutation();
    const [, getEventVonageToken] = useGetEventVonageTokenMutation();

    const completeGetAccessToken = useRef<{ resolve: () => void; reject: (reason?: any) => void } | undefined>();

    const getAccessToken = useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            if (eventId) {
                getEventVonageToken(
                    {
                        eventId,
                    },
                    context
                )
                    .then((result) => {
                        if (!result.data?.joinEventVonageSession?.accessToken) {
                            throw new Error("No Vonage session ID");
                        }
                        const token = result.data.joinEventVonageSession.accessToken;

                        if (result.data.joinEventVonageSession.isRecorded) {
                            completeGetAccessToken.current = {
                                resolve: () => {
                                    completeGetAccessToken.current = undefined;
                                    resolve(token);
                                },
                                reject: (reason) => {
                                    completeGetAccessToken.current = undefined;
                                    reject(reason);
                                },
                            };
                        } else {
                            resolve(token);
                        }
                    })
                    .catch(reject);
            } else {
                getRoomVonageToken(
                    {
                        roomId: room.id,
                        registrantId,
                    },
                    context
                )
                    .then((result) => {
                        if (!result.data?.joinRoomVonageSession?.accessToken) {
                            throw new Error("No Vonage session ID");
                        }
                        const token = result.data.joinRoomVonageSession.accessToken;

                        if (result.data.joinRoomVonageSession.isRecorded) {
                            completeGetAccessToken.current = {
                                resolve: () => {
                                    completeGetAccessToken.current = undefined;
                                    resolve(token);
                                },
                                reject: (reason) => {
                                    completeGetAccessToken.current = undefined;
                                    reject(reason);
                                },
                            };
                        } else {
                            resolve(token);
                        }
                    })
                    .catch(reject);
            }
        });
    }, [context, eventId, getEventVonageToken, getRoomVonageToken, registrantId, room.id]);

    const [publicVonageSessionId, setPublicVonageSessionId] = useState<string | null | undefined>(
        room.publicVonageSessionId
    );
    useEffect(() => {
        setPublicVonageSessionId(room.publicVonageSessionId);
    }, [room.publicVonageSessionId]);

    const attempts = React.useRef<number>(0);
    const lastAttempt = React.useRef<number>(Date.now());
    const now = useRealTime(1000);
    const client = useClient();
    useEffect(() => {
        if (!publicVonageSessionId && attempts.current < 3 && now - lastAttempt.current > 3000) {
            attempts.current++;
            lastAttempt.current = now;

            (async () => {
                const response = await client
                    .query<GetRoomVonageSessionIdQuery, GetRoomVonageSessionIdQueryVariables>(
                        GetRoomVonageSessionIdDocument,
                        {
                            roomId: room.id,
                        }
                    )
                    .toPromise();
                if (response.data?.room_Room_by_pk?.publicVonageSessionId) {
                    setPublicVonageSessionId(response.data.room_Room_by_pk.publicVonageSessionId);
                }
            })();
        }
    }, [publicVonageSessionId, room.id, client, now]);

    const recordingAlert_leastDestructiveRef = useRef<HTMLButtonElement | null>(null);

    return publicVonageSessionId && sharedRoomContext ? (
        <>
            <portals.OutPortal
                node={sharedRoomContext.vonagePortalNode}
                vonageSessionId={publicVonageSessionId}
                disable={!enable}
                getAccessToken={getAccessToken}
                isBackstageRoom={false}
                canControlRecording={!eventId || isChairOrOrganizer}
                eventId={eventId}
            />
            <AlertDialog
                isOpen={completeGetAccessToken.current !== undefined}
                onClose={() => {
                    // Empty
                }}
                leastDestructiveRef={recordingAlert_leastDestructiveRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Video is being recorded</AlertDialogHeader>
                    <AlertDialogBody>
                        <VStack spacing={4} alignItems="flex-start">
                            <Text>
                                The video-chat you are about to join{" "}
                                {eventIsFuture ? "will be recorded when the event starts" : "is being recorded"}.
                            </Text>
                            <Text>
                                By clicking Join below you consent to being recorded and for the recording to be owned
                                and managed by the organizers of this conference.
                            </Text>
                            <Text>For further information, please speak to your conference organizers.</Text>
                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup spacing={2}>
                            <Button
                                ref={recordingAlert_leastDestructiveRef}
                                onClick={() => {
                                    completeGetAccessToken.current?.reject("Declined to be recorded");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    completeGetAccessToken.current?.resolve();
                                }}
                                colorScheme="PrimaryActionButton"
                            >
                                Join
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    ) : (
        <VStack spacing={2} p={4}>
            <Text>Please wait while the video-chat initializes...</Text>
            <Spinner />
        </VStack>
    );
}
