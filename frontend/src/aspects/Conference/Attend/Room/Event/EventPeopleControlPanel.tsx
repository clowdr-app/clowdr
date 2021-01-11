import { Heading, List, ListItem } from "@chakra-ui/react";
import React from "react";
import type { EventRoomJoinRequestDetailsFragment } from "../../../../../generated/graphql";
import { JoinRequest } from "./JoinRequest";

export function EventPeopleControlPanel({
    unapprovedJoinRequests,
}: {
    unapprovedJoinRequests: readonly EventRoomJoinRequestDetailsFragment[];
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
        </>
    );
}
