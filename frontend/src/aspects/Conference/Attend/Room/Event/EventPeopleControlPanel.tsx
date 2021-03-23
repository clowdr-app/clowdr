import { Heading, List, ListItem, useToast } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import {
    EventPersonDetailsFragment,
    EventPersonRole_Enum,
    EventRoomJoinRequestDetailsFragment,
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import { EventPerson } from "./EventPerson";
import { JoinRequest } from "./JoinRequest";

export function EventPeopleControlPanel({
    unapprovedJoinRequests,
    eventPeople,
    myRoles,
}: {
    unapprovedJoinRequests: readonly EventRoomJoinRequestDetailsFragment[];
    eventPeople: readonly EventPersonDetailsFragment[];
    myRoles: EventPersonRole_Enum[];
}): JSX.Element {
    const canControlEventPeople = useMemo(
        () => myRoles.includes(EventPersonRole_Enum.Chair) || myRoles.includes(EventPersonRole_Enum.Presenter),
        [myRoles]
    );
    const userId = useUserId();

    const toast = useToast();

    const [numUnapprovedJoinRequests, setNumUnapprovedJoinRequests] = useState<number | null>(null);
    useEffect(() => {
        if (numUnapprovedJoinRequests !== null && numUnapprovedJoinRequests < unapprovedJoinRequests.length) {
            toast({
                title: "Somebody asked to join the event room",
                status: "info",
            });
        }
        if (numUnapprovedJoinRequests !== unapprovedJoinRequests.length) {
            setNumUnapprovedJoinRequests(unapprovedJoinRequests.length);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unapprovedJoinRequests]);

    return (
        <>
            <Heading as="h3" size="sm" my={2}>
                Raised hands
            </Heading>
            {unapprovedJoinRequests.length === 0 ? <>No hands are raised at the moment.</> : <></>}
            <List>
                {unapprovedJoinRequests.map((joinRequest) => (
                    <ListItem key={joinRequest.id}>
                        <JoinRequest joinRequest={joinRequest} enableApproval={canControlEventPeople} />
                    </ListItem>
                ))}
            </List>
            <Heading as="h3" size="sm" my={2}>
                People
            </Heading>
            <List>
                {eventPeople.map((person) => (
                    <EventPersonListItem
                        key={person.id}
                        person={person}
                        canControlEventPeople={canControlEventPeople}
                        userId={userId}
                    />
                ))}
            </List>
        </>
    );
}

function EventPersonListItem({
    person,
    canControlEventPeople,
    userId,
}: {
    userId: string | null;
    person: EventPersonDetailsFragment;
    canControlEventPeople: boolean;
}): JSX.Element {
    return (
        <ListItem mt={2}>
            <EventPerson eventPerson={person} enableDelete={canControlEventPeople} userId={userId} />
        </ListItem>
    );
}
