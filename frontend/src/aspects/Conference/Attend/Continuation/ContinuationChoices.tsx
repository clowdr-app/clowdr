import { gql } from "@apollo/client";
import { useToast } from "@chakra-ui/toast";
import {
    ContinuationDefaultFor,
    ContinuationType,
    ExtendedContinuationTo,
    NavigationView,
} from "@clowdr-app/shared-types/build/continuation";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import {
    ContinuationChoices_ContinuationFragment,
    useContinuationChoices_ContinuationsQuery,
    useContinuationChoices_RoomsQuery,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";
import { useMyBackstagesModal } from "../Profile/MyBackstages";
import { useLiveProgramRoomsModal } from "../Rooms/V2/LiveProgramRoomsModal";
import { SocialiseModalTab, useSocialiseModal } from "../Rooms/V2/SocialiseModal";
import { ProgramModalTab, useScheduleModal } from "../Schedule/ProgramModal";
import ContinuationActiveChoice from "./ContinuationActiveChoice";
import ContinuationPassiveChoice from "./ContinuationPassiveChoice";

gql`
    fragment ContinuationChoices_Continuation on schedule_Continuation {
        id
        to
        defaultFor
        isActiveChoice
        priority
        colour
        description
    }

    query ContinuationChoices_Continuations($fromId: uuid!, $nowStart: timestamptz, $nowEnd: timestamptz) {
        schedule_Continuation(
            where: { _or: [{ fromEvent: { _eq: $fromId } }, { fromShuffleQueue: { _eq: $fromId } }] }
        ) {
            ...ContinuationChoices_Continuation
        }
        room_ShufflePeriod(where: { id: { _eq: $fromId } }) {
            id
            endAt
            roomDurationMinutes
        }
        schedule_Event(
            where: {
                _or: [
                    { id: { _eq: $fromId } }
                    { startTime: { _lte: $nowStart }, endTime: { _gte: $nowEnd }, shufflePeriodId: { _eq: $fromId } }
                ]
            }
        ) {
            id
            roomId
            endTime
        }
    }

    query ContinuationChoices_Rooms($ids: [uuid!]!) {
        content_Item(where: { id: { _in: $ids } }) {
            id
            rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
                id
            }
        }
        schedule_Event(where: { id: { _in: $ids } }) {
            id
            roomId
        }
    }
`;

export default function ContinuationChoices({
    from,
    isBackstage,
    noBackstage,
    currentRole,
    currentRoomId,
    extraChoices,
}: {
    from: { eventId: string; itemId: string | null } | { shufflePeriodId: string; shuffleRoomEndsAt: number };
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    currentRoomId: string;
    extraChoices: readonly ContinuationChoices_ContinuationFragment[];
}): JSX.Element {
    // We do not want this to change on every render...
    const nowStatic_StartStr = useMemo(() => new Date(Date.now() + 60000).toISOString(), []);
    const nowStatic_EndStr = useMemo(() => new Date(Date.now() - 60000).toISOString(), []);
    // ...else this query would change on every render!
    const response = useContinuationChoices_ContinuationsQuery({
        variables: {
            fromId: "eventId" in from ? from.eventId : from.shufflePeriodId,
            nowStart: nowStatic_StartStr,
            nowEnd: nowStatic_EndStr,
        },
    });

    // Delay rendering choices (and thus fetching of events/items/rooms) to
    // allow time for automatic discussion rooms to be generated
    const renderedAt = useMemo(() => Date.now(), []);
    const now = useRealTime(10000);

    const allChoices = useMemo(
        () =>
            response.data?.schedule_Continuation
                ? [...extraChoices, ...response.data.schedule_Continuation]
                : extraChoices,
        [response.data?.schedule_Continuation, extraChoices]
    );

    return response.data && (allChoices.length > 0 || "shufflePeriodId" in from) && now - renderedAt > 15000 ? (
        <ContinuationChoices_Inner
            from={
                "eventId" in from
                    ? {
                          eventId: from.eventId,
                          itemId: from.itemId,
                          endTime:
                              response.data.schedule_Event.length > 0
                                  ? Date.parse(response.data.schedule_Event[0].endTime)
                                  : 0,
                      }
                    : {
                          shufflePeriodId: from.shufflePeriodId,
                          periodEndTime:
                              response.data.room_ShufflePeriod.length > 0
                                  ? Date.parse(response.data.room_ShufflePeriod[0].endAt)
                                  : 0,
                          roomEndTime: from.shuffleRoomEndsAt,
                          roomDuration:
                              response.data.room_ShufflePeriod.length > 0
                                  ? response.data.room_ShufflePeriod[0].roomDurationMinutes * 60 * 1000
                                  : 0,
                          eventRoomId: response.data.schedule_Event[0]?.roomId,
                      }
            }
            choices={allChoices}
            isBackstage={isBackstage}
            noBackstage={noBackstage}
            currentRole={currentRole}
            currentRoomId={currentRoomId}
        />
    ) : (
        <></>
    );
}

const passiveChoice_RevealThreshholdMs = 2 * 60 * 1000;
const passiveChoice_HideThreshholdMs = 1 * 60 * 1000;
const activeChoice_RevealThreshholdMs = 20 * 1000;
const activeChoice_HideThreshholdMs = 1 * 60 * 1000;

function ContinuationChoices_Inner({
    from,
    choices,
    isBackstage,
    noBackstage,
    currentRole,
    currentRoomId,
}: {
    from:
        | { eventId: string; itemId: string | null; endTime: number }
        | {
              shufflePeriodId: string;
              periodEndTime: number;
              roomEndTime: number;
              roomDuration: number;
              eventRoomId?: string;
          };
    choices: readonly ContinuationChoices_ContinuationFragment[];
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    currentRoomId: string;
}): JSX.Element {
    const roomsResponse = useContinuationChoices_RoomsQuery({
        variables: {
            ids: choices.reduce((acc, option) => {
                const to: ExtendedContinuationTo = option.to;
                if (to.type === ContinuationType.AutoDiscussionRoom) {
                    const itemId = to.id ?? ("eventId" in from ? from.itemId : null);
                    if (itemId) {
                        acc.push(itemId);
                    }
                } else if (to.type === ContinuationType.Event) {
                    acc.push(to.id);
                }
                return acc;
            }, [] as string[]),
        },
    });

    const isActiveChoice = useMemo(() => R.any((x) => x.isActiveChoice, choices), [choices]);

    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    const now = useRealTime(1000);
    const { displayChoice, timeRemaining } = useMemo(() => {
        let endTime: number;
        if ("eventId" in from) {
            endTime = from.endTime;
        } else {
            if (from.roomEndTime < from.periodEndTime - from.roomDuration) {
                // Time for another room, never display the choice
                return { displayChoice: false, timeRemaining: from.roomEndTime - now };
            } else {
                // No time for another room, display choice when this room ends
                endTime = from.roomEndTime;
            }
        }
        return {
            displayChoice:
                choices.length > 0 &&
                ((!isActiveChoice &&
                    (now < endTime || selectedOptionId === null) &&
                    now > endTime - passiveChoice_RevealThreshholdMs &&
                    now < endTime + passiveChoice_HideThreshholdMs) ||
                    (isActiveChoice &&
                        now > endTime - activeChoice_RevealThreshholdMs &&
                        now < endTime + activeChoice_HideThreshholdMs)),
            timeRemaining: endTime - now,
        };
    }, [from, isActiveChoice, now, selectedOptionId, choices.length]);

    const [activateChoice, setActivateChoice] = useState<boolean>(false);
    const [activatedChoice, setActivatedChoice] = useState<boolean | string>(false);
    useEffect(() => {
        if (timeRemaining < 0) {
            setActivateChoice(true);
        }
    }, [timeRemaining]);
    const activate = useCallback(() => {
        setActivateChoice(true);
        setActivatedChoice(false);
    }, []);

    const toast = useToast();
    const history = useHistory();
    const conference = useConference();
    const scheduleModal = useScheduleModal();
    const socialiseModal = useSocialiseModal();
    const myBackstages = useMyBackstagesModal();
    const liveProgramRooms = useLiveProgramRoomsModal();
    useEffect(() => {
        if (activateChoice && !activatedChoice) {
            const activateChosenOption = () => {
                if (selectedOptionId !== null) {
                    const selectedOption = choices.find((x) => x.id === selectedOptionId);
                    let error: string | null = null;

                    if (selectedOption) {
                        const to: ExtendedContinuationTo = selectedOption.to;
                        switch (to.type) {
                            case "function":
                                to.f();
                                break;
                            case ContinuationType.URL:
                                window.location.assign(to.url);
                                break;
                            case ContinuationType.Room:
                                if (currentRoomId !== to.id) {
                                    history.push(`/conference/${conference.slug}/room/${to.id}`);
                                }
                                break;
                            case ContinuationType.Event:
                                if (!roomsResponse.loading) {
                                    const event = roomsResponse.data?.schedule_Event.find(
                                        (event) => event.id === to.id
                                    );
                                    if (event && event?.roomId) {
                                        if (currentRoomId !== event.roomId) {
                                            history.push(`/conference/${conference.slug}/room/${event.roomId}`);
                                        }
                                    } else {
                                        if (roomsResponse.error) {
                                            error = roomsResponse.error.message;
                                        } else {
                                            error = "Sorry, the room for the chosen event could not be found.";
                                        }
                                    }
                                }
                                break;
                            case ContinuationType.AutoDiscussionRoom:
                                if (!roomsResponse.loading) {
                                    const toItemId = to.id ?? ("eventId" in from ? from.itemId : null);
                                    const item = roomsResponse.data?.content_Item.find((item) => item.id === toItemId);
                                    if (item && item.rooms.length > 0) {
                                        if (currentRoomId !== item.rooms[0].id) {
                                            history.push(`/conference/${conference.slug}/room/${item.rooms[0].id}`);
                                        }
                                    } else {
                                        if (roomsResponse.error) {
                                            error = roomsResponse.error.message;
                                        } else {
                                            error = "Sorry, the chosen discussion room could not be found.";
                                        }
                                    }
                                }
                                break;
                            case ContinuationType.Item:
                                history.push(`/conference/${conference.slug}/item/${to.id}`);
                                break;
                            case ContinuationType.Exhibition:
                                history.push(`/conference/${conference.slug}/exhibition/${to.id}`);
                                break;
                            case ContinuationType.ShufflePeriod:
                                history.push(`/conference/${conference.slug}/shuffle`);
                                break;
                            case ContinuationType.Profile:
                                history.push(`/conference/${conference.slug}/profile/view/${to.id}`);
                                break;
                            case ContinuationType.OwnProfile:
                                history.push(`/conference/${conference.slug}/profile`);
                                break;
                            case ContinuationType.NavigationView:
                                switch (to.view) {
                                    case NavigationView.LiveProgramRooms:
                                        liveProgramRooms.onOpen();
                                        break;
                                    case NavigationView.HappeningSoon:
                                        scheduleModal.onOpen(undefined, ProgramModalTab.HappeningSoon);
                                        break;
                                    case NavigationView.Tags:
                                        scheduleModal.onOpen(
                                            to.tagId?.length ? to.tagId : undefined,
                                            ProgramModalTab.Tags
                                        );
                                        break;
                                    case NavigationView.Exhibitions:
                                        scheduleModal.onOpen(undefined, ProgramModalTab.Exhibitions);
                                        break;
                                    case NavigationView.Search:
                                        scheduleModal.onOpen(undefined, ProgramModalTab.Search, to.term);
                                        break;
                                    case NavigationView.Schedule:
                                        scheduleModal.onOpen(undefined, ProgramModalTab.Schedule);
                                        break;
                                    case NavigationView.SocialRooms:
                                        socialiseModal.onOpen(SocialiseModalTab.Rooms);
                                        break;
                                    case NavigationView.People:
                                        socialiseModal.onOpen(SocialiseModalTab.People);
                                        break;
                                    case NavigationView.ShufflePeriods:
                                        socialiseModal.onOpen(SocialiseModalTab.Networking);
                                        break;
                                    case NavigationView.MyBackstages:
                                        myBackstages.onOpen();
                                        break;
                                }
                                break;
                            case ContinuationType.ConferenceLandingPage:
                                history.push(`/conference/${conference.slug}`);
                                break;
                        }
                    } else {
                        error = "Sorry, the selected option is no longer available.";
                    }

                    setActivatedChoice(error ?? true);
                }
            };

            if ("shufflePeriodId" in from) {
                if (from.eventRoomId) {
                    history.push(`/conference/${conference.slug}/room/${from.eventRoomId}`);
                } else {
                    history.push(`/conference/${conference.slug}/shuffle`);
                }
                setTimeout(() => activateChosenOption(), 200);
            } else {
                activateChosenOption();
            }
        }
    }, [
        choices,
        conference.slug,
        history,
        roomsResponse.data?.content_Item,
        roomsResponse.data?.schedule_Event,
        roomsResponse.error,
        roomsResponse.loading,
        selectedOptionId,
        toast,
        currentRoomId,
        scheduleModal,
        activatedChoice,
        socialiseModal,
        liveProgramRooms,
        activateChoice,
        myBackstages,
        from,
    ]);

    useEffect(() => {
        if (typeof activatedChoice === "string") {
            toast({
                description: activatedChoice,
                duration: 80000,
                position: "bottom",
                isClosable: true,
                title: "Error activating continuation",
                status: "error",
            });
        }
    }, [activatedChoice, toast]);

    const activeSet = useCallback((choiceId: string | null, isDefault: boolean) => {
        setSelectedOptionId(choiceId);
        if (!isDefault) {
            setActivatedChoice(false);
            setActivateChoice(true);
        }
    }, []);
    const passiveSet = useCallback((choiceId: string | null, _isDefault: boolean) => {
        setSelectedOptionId(choiceId);
        setActivatedChoice(false);
    }, []);

    return displayChoice ? (
        isActiveChoice ? (
            <ContinuationActiveChoice
                selectedOptionId={selectedOptionId}
                choices={choices}
                isBackstage={isBackstage}
                noBackstage={noBackstage}
                currentRole={currentRole}
                timeRemaining={timeRemaining + activeChoice_HideThreshholdMs}
                timeMax={activeChoice_RevealThreshholdMs + activeChoice_HideThreshholdMs}
                onChoiceSelected={activeSet}
            />
        ) : (
            <ContinuationPassiveChoice
                selectedOptionId={selectedOptionId}
                choices={choices}
                isBackstage={isBackstage}
                noBackstage={noBackstage}
                currentRole={currentRole}
                timeRemaining={timeRemaining}
                timeMax={passiveChoice_RevealThreshholdMs}
                onChoiceSelected={passiveSet}
                activate={activate}
            />
        )
    ) : (
        <></>
    );
}
