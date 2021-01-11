import { gql } from "@apollo/client";
import { Button, HStack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import {
    EventRoomJoinRequestDetailsFragment,
    useApproveEventRoomJoinRequestMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Icons/FAIcon";

gql`
    mutation ApproveEventRoomJoinRequest($eventRoomJoinRequestId: uuid!) {
        update_EventRoomJoinRequest_by_pk(pk_columns: { id: $eventRoomJoinRequestId }, _set: { approved: true }) {
            id
        }
    }
`;

export function JoinRequest({ joinRequest }: { joinRequest: EventRoomJoinRequestDetailsFragment }): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const [approveJoinRequestMutation] = useApproveEventRoomJoinRequestMutation();
    const toast = useToast();

    const approveJoinRequest = useCallback(async () => {
        setLoading(true);

        try {
            await approveJoinRequestMutation({
                variables: {
                    eventRoomJoinRequestId: joinRequest.id,
                },
            });
        } catch (e) {
            toast({
                title: "Could not approve join request",
                status: "error",
            });
        }
        setLoading(false);
    }, [approveJoinRequestMutation, joinRequest.id, toast]);

    return (
        <HStack my={2}>
            <FAIcon icon="hand-paper" iconStyle="s" />
            <Text>{joinRequest.attendee.displayName}</Text>
            <Button
                onClick={approveJoinRequest}
                aria-label={`Add ${joinRequest.attendee.displayName} to the event room`}
                isLoading={loading}
                p={0}
                colorScheme="green"
                size="xs"
            >
                <FAIcon icon="check-circle" iconStyle="s" />{" "}
            </Button>
        </HStack>
    );
}
