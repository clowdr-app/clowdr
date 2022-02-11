import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import { useCallback, useMemo, useRef } from "react";
import { useGetEventVonageTokenMutation, useGetRoomVonageTokenMutation } from "../../../../../generated/graphql";
import { makeContext } from "../../../../GQL/make-context";
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
`;

export function useGetAccessToken(roomId: string, eventId?: string) {
    const [, getRoomVonageToken] = useGetRoomVonageTokenMutation();
    const [, getEventVonageToken] = useGetEventVonageTokenMutation();

    const { id: registrantId } = useCurrentRegistrant();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.RoomMember,
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );

    const completeGetAccessToken = useRef<{ resolve: () => void; reject: (reason?: any) => void } | undefined>();

    const getAccessToken = useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            if (eventId) {
                getEventVonageToken(
                    {
                        eventId,
                        registrantId,
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
                        roomId: roomId,
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
    }, [context, eventId, getEventVonageToken, getRoomVonageToken, registrantId, roomId]);

    return {
        getAccessToken,
        completeGetAccessToken,
    };
}
