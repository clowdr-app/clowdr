import { Heading, List, ListItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    EventPersonDetailsFragment,
    EventPersonRole_Enum,
    EventRoomJoinRequestDetailsFragment,
} from "../../../../../generated/graphql";
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
                    <ListItem key={person.id} mt={2}>
                        <EventPerson eventPerson={person} enableDelete={canControlEventPeople} />
                    </ListItem>
                ))}
            </List>
        </>
    );
}
