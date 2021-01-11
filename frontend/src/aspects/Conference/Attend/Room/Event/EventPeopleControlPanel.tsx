import { Heading, List, ListItem } from "@chakra-ui/react";
import React from "react";
import type { EventPersonDetailsFragment, EventRoomJoinRequestDetailsFragment } from "../../../../../generated/graphql";
import { JoinRequest } from "./JoinRequest";

export function EventPeopleControlPanel({
    unapprovedJoinRequests,
    eventPeople,
}: {
    unapprovedJoinRequests: readonly EventRoomJoinRequestDetailsFragment[];
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    return (
        <>
            <Heading as="h3" size="sm" my={2}>
                Raised hands
            </Heading>
            {unapprovedJoinRequests.length === 0 ? <>No hands are raised at the moment.</> : <></>}
            <List>
                {unapprovedJoinRequests.map((joinRequest) => (
                    <ListItem key={joinRequest.id}>
                        <JoinRequest joinRequest={joinRequest} />
                    </ListItem>
                ))}
            </List>
            <Heading as="h3" size="sm" my={2}>
                People
            </Heading>
            <List>
                {eventPeople.map((person) => (
                    <ListItem key={person.id}>
                        {person.attendee?.displayName ?? "<Unknown>"} ({person.roleName})
                    </ListItem>
                ))}
            </List>
        </>
    );
}
