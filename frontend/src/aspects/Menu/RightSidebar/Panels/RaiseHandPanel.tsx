import { Heading, Spinner, Text, useToast, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import {
    Schedule_EventProgramPersonRole_Enum,
    useRaiseHandPanel_GetEventDetailsQuery,
} from "../../../../generated/graphql";
import { VonageBackstage } from "../../../Conference/Attend/Room/Stream/VonageBackstage";
import { useRegistrants } from "../../../Conference/RegistrantsContext";
import type { Registrant } from "../../../Conference/useCurrentRegistrant";
import { useRaiseHandState } from "../../../RaiseHand/RaiseHandProvider";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { RaisedHandsList } from "./RaisedHandsList";
import { RegistrantsList } from "./RegistrantsList";

gql`
    query RaiseHandPanel_GetEventDetails($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            ...Room_EventSummary
        }
    }
`;

export function RaiseHandPanel(): JSX.Element {
    const raiseHand = useRaiseHandState();
    const currentUser = useCurrentUser().user;

    const [currentEventId, setCurrentEventId] = useState<{
        eventId: string;
        userRole: Schedule_EventProgramPersonRole_Enum;
    } | null>(null);
    const [isBackstage, setIsBackstage] = useState<boolean>(false);
    const [_startTimeOfNextBackstage, setStartTimeOfNextBackstage] = useState<number | null>(null);
    const [raisedHandUserIds, setRaisedHandUserIds] = useState<string[] | null>(null);
    const toast = useToast();

    useEffect(() => {
        const unsubscribe = raiseHand.CurrentEventId.subscribe(setCurrentEventId);
        return () => {
            unsubscribe();
        };
    }, [raiseHand.CurrentEventId]);

    useEffect(() => {
        const unsubscribe = raiseHand.IsBackstage.subscribe(setIsBackstage);
        return () => {
            unsubscribe();
        };
    }, [raiseHand.IsBackstage]);

    useEffect(() => {
        const unsubscribe = raiseHand.StartTimeOfNextBackstage.subscribe(setStartTimeOfNextBackstage);
        return () => {
            unsubscribe();
        };
    }, [raiseHand.StartTimeOfNextBackstage]);

    useEffect(() => {
        const unobserve = currentEventId
            ? raiseHand.observe(currentEventId.eventId, (update) => {
                  if ("userIds" in update) {
                      setRaisedHandUserIds(update.userIds);
                  } else if (!update.wasAccepted && update.userId === currentUser?.id) {
                      toast({
                          title: "Hand lowered",
                          description: "The chair has lowered your hand.",
                          position: "top-right",
                          status: "warning",
                          duration: 5000,
                          isClosable: true,
                      });
                  }
              })
            : () => {
                  // Intentionally empty
              };

        return () => {
            unobserve();
        };
    }, [toast, currentEventId, raiseHand, currentUser?.id]);

    useEffect(() => {
        setRaisedHandUserIds(null);
    }, []);

    const registrants = useRegistrants(
        raisedHandUserIds !== null
            ? raisedHandUserIds.map((user) => ({
                  user,
              }))
            : []
    );
    const sortedRegistrants = useMemo(
        () =>
            R.sortBy(
                (x) => (x.userId && raisedHandUserIds ? raisedHandUserIds.indexOf(x.userId) : -1),
                registrants
            ) as Registrant[],
        [raisedHandUserIds, registrants]
    );

    const completeJoinRef: React.MutableRefObject<() => Promise<void>> = React.useRef(async () => {
        // Intentionally empty
    });
    useEffect(() => {
        const unobserve = currentEventId
            ? raiseHand.observe(currentEventId.eventId, (update) => {
                  if ("userId" in update && update.userId === currentUser.id && update.wasAccepted) {
                      // alert("Auto joining vonage backstage room");
                      completeJoinRef.current();
                  }
              })
            : () => {
                  // Intentionally empty
              };

        return () => {
            unobserve();
        };
    }, [currentEventId, currentUser.id, raiseHand]);

    const [result] = useRaiseHandPanel_GetEventDetailsQuery({
        pause: !currentEventId || currentEventId.userRole !== Schedule_EventProgramPersonRole_Enum.Participant,
        variables: {
            eventId: currentEventId?.eventId,
        },
    });

    if (isBackstage) {
        return currentEventId && currentEventId.userRole === Schedule_EventProgramPersonRole_Enum.Chair ? (
            <VStack spacing={1} alignItems="flex-start" m={2}>
                <Heading as="h3" fontSize="lg" textAlign="left">
                    Manage raised hands
                </Heading>
                <RaisedHandsList searchedRegistrants={sortedRegistrants} currentEventId={currentEventId.eventId} />
                {sortedRegistrants.length === 0 ? <Text>Nobody has raised their hand at the moment.</Text> : undefined}
            </VStack>
        ) : (
            <VStack spacing={2} alignItems="flex-start" m={2}>
                <Heading as="h3" fontSize="lg" textAlign="left">
                    You are backstage
                </Heading>
                <Text fontWeight="bold" pt={4}>
                    Raised hands
                </Text>
                <RegistrantsList searchedRegistrants={sortedRegistrants} />
                {sortedRegistrants.length === 0 ? <Text>Nobody has raised their hand at the moment.</Text> : undefined}
            </VStack>
        );
    } else if (currentEventId) {
        if (raisedHandUserIds === null) {
            return <Spinner label="Loading users who have raised hands" />;
        }

        return (
            <VStack spacing={2} alignItems="flex-start" m={2}>
                <Heading as="h3" fontSize="lg">
                    {raisedHandUserIds.includes(currentUser.id)
                        ? "Waiting to be admitted"
                        : "Prepare to join the stream"}
                </Heading>

                {raisedHandUserIds.includes(currentUser.id) ? (
                    <>
                        <Text fontSize="xs">The chair will decide whether to let you join the stream.</Text>
                        <Text fontSize="xs">
                            Please note when you join the backstage, you may find the conversation ahead of what you are
                            currently watching in the stream (stream lag up to 30s is normal).
                        </Text>
                    </>
                ) : (
                    <Text fontSize="xs">
                        By clicking &ldquo;I&apos;m ready&rdquo; below, you agree to participate in the livestream. The
                        stream may also be recorded and later published to Midspace and external sites (such as YouTube)
                        at the discretion of your conference organisers.
                    </Text>
                )}

                {result.data?.schedule_Event_by_pk ? (
                    <VonageBackstage
                        event={result.data?.schedule_Event_by_pk}
                        isRaiseHandPreJoin={true}
                        isRaiseHandWaiting={raisedHandUserIds.includes(currentUser.id)}
                        completeJoinRef={completeJoinRef}
                        hlsUri={undefined}
                    />
                ) : (
                    <Spinner />
                )}
                <Text fontWeight="bold" pt={4}>
                    Raised hands
                </Text>
                <RegistrantsList searchedRegistrants={sortedRegistrants} />
                {sortedRegistrants.length === 0 ? <Text>Nobody has raised their hand at the moment.</Text> : undefined}
            </VStack>
        );
    }
    // else if (startTimeOfNextBackstage !== null) {
    //     // RAISE_HAND_TODO: Show message explaining time until next backstage is available
    //     return <>Time until next backstage</>;
    // }
    else {
        return (
            <VStack spacing={2} alignItems="flex-start" m={2}>
                <Heading as="h3" fontSize="lg">
                    Raise your hand to join the stream
                </Heading>
                <Text>
                    No backstage is currently available. Please wait for a backstage to become available during a live
                    presentation/Q&amp;A.
                </Text>
            </VStack>
        );
    }
}
