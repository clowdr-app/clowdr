import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Schedule_ItemFieldsFragment } from "../../../../generated/graphql";
import {
    useStarredEvents_SelectEventIdsQuery,
    useStarredEvents_SelectEventsQuery,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { useConference } from "../../useConference";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import { ScheduleInner } from "./v1/Schedule";

gql`
    query StarredEvents_SelectEventIds($registrantId: uuid!) {
        schedule_StarredEvent(where: { registrantId: { _eq: $registrantId } }) {
            ...StarredEvent
        }
        schedule_Event(where: { eventPeople: { person: { registrantId: { _eq: $registrantId } } } }) {
            id
        }
    }

    query StarredEvents_SelectEvents($eventIds: [uuid!]!, $conferenceId: uuid!) {
        room_Room(where: { events: { id: { _in: $eventIds } } }) {
            ...Schedule_RoomSummary
        }
        schedule_Event(where: { id: { _in: $eventIds } }) {
            ...Schedule_EventSummary
            item {
                ...Schedule_ItemFields
            }
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_ProgramPerson
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_Tag
        }
    }
`;

interface StarredEventsModalContext {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const StarredEventsModalContext = React.createContext<StarredEventsModalContext | undefined>(undefined);

export function useStarredEventsModal(): StarredEventsModalContext {
    const ctx = React.useContext(StarredEventsModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function StarredEventsModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const finalFocusRef = useRef<FocusableElement>(null);

    const ctx: StarredEventsModalContext = useMemo(
        () => ({
            finalFocusRef,
            isOpen,
            onOpen,
            onClose,
        }),
        [onOpen, isOpen, onClose]
    );

    return (
        <StarredEventsModalContext.Provider value={ctx}>
            {children}
            {maybeRegistrant ? (
                <StarredEventsModal isOpen={isOpen} onClose={onClose} finalFocusRef={finalFocusRef} />
            ) : undefined}
        </StarredEventsModalContext.Provider>
    );
}

export function StarredEventsModal({
    isOpen,
    onClose,
    finalFocusRef,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);

    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton ref={closeRef} />
                <ModalBody display="flex" justifyContent="stretch">
                    <StarredEvents />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

function StarredEvents(): JSX.Element {
    const registrant = useCurrentRegistrant();
    const [eventIdsResponse] = useStarredEvents_SelectEventIdsQuery({
        variables: {
            registrantId: registrant.id,
        },
    });
    const eventIds = useMemo(() => {
        const result: string[] = [];

        if (eventIdsResponse.data) {
            eventIdsResponse.data.schedule_Event.forEach((event) => {
                result.push(event.id);
            });
            eventIdsResponse.data.schedule_StarredEvent.forEach((star) => {
                result.push(star.eventId);
            });
        }

        return result;
    }, [eventIdsResponse.data]);

    if (!eventIdsResponse.data) {
        return <CenteredSpinner caller="StarredEventsModal:144" />;
    }

    return <StarredEventsInner eventIds={eventIds} />;
}

function StarredEventsInner({ eventIds }: { eventIds: string[] }): JSX.Element {
    const conference = useConference();
    const [roomsResult] = useStarredEvents_SelectEventsQuery({
        variables: {
            eventIds,
            conferenceId: conference.id,
        },
    });
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        if (roomsResult.data) {
            setData({
                rooms: roomsResult.data.room_Room,
                events: roomsResult.data.schedule_Event,
                items: roomsResult.data.schedule_Event
                    .filter((x) => !!x.item)
                    .map((x) => x.item) as Schedule_ItemFieldsFragment[],
                tags: roomsResult.data.collection_Tag,
                people: roomsResult.data.collection_ProgramPerson,
            });
        }
    }, [roomsResult.data]);
    return !data ? (
        <CenteredSpinner caller="StarredEventsModal:172" />
    ) : (
        <ScheduleInner titleStr={"My events"} noEventsText="" {...data} />
    );
}
