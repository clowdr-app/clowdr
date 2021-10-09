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
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as portals from "react-reverse-portal";
import { gql } from "urql";
import {
    RoomPage_RoomDetailsFragment,
    useGetEventVonageTokenMutation,
    useGetRoomVonageSessionIdQuery,
    useGetRoomVonageTokenMutation,
} from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";

gql`
    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
            isRecorded
        }
    }

    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
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

    const [getRoomVonageToken] = useGetRoomVonageTokenMutation({
        variables: {
            roomId: room.id,
        },
    });
    const [getEventVonageToken] = useGetEventVonageTokenMutation({
        variables: {
            eventId,
        },
    });

    const completeGetAccessToken = useRef<{ resolve: () => void; reject: (reason?: any) => void } | undefined>();

    const getAccessToken = useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            if (eventId) {
                getEventVonageToken()
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
                getRoomVonageToken()
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
    }, [getRoomVonageToken, getEventVonageToken, eventId]);

    const [publicVonageSessionId, setPublicVonageSessionId] = useState<string | null | undefined>(
        room.publicVonageSessionId
    );
    useEffect(() => {
        setPublicVonageSessionId(room.publicVonageSessionId);
    }, [room.publicVonageSessionId]);

    const [roomVonageSessionIdResponse] = useGetRoomVonageSessionIdQuery({
        skip: true,
    });
    const attempts = React.useRef<number>(0);
    const lastAttempt = React.useRef<number>(Date.now());
    const now = useRealTime(1000);
    useEffect(() => {
        if (!publicVonageSessionId && attempts.current < 3 && now - lastAttempt.current > 3000) {
            attempts.current++;
            lastAttempt.current = now;

            (async () => {
                const response = await roomVonageSessionIdResponse.refetch({
                    roomId: room.id,
                });
                if (response.data?.room_Room_by_pk?.publicVonageSessionId) {
                    setPublicVonageSessionId(response.data.room_Room_by_pk.publicVonageSessionId);
                }
            })();
        }
    }, [publicVonageSessionId, room.id, roomVonageSessionIdResponse, now]);

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
