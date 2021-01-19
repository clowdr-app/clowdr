import { gql } from "@apollo/client";
import { Box, Button, HStack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import {
    EventRoomJoinRequestDetailsFragment,
    useApproveEventRoomJoinRequestMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Icons/FAIcon";
import { useAttendee } from "../../../AttendeesContext";

gql`
    mutation ApproveEventRoomJoinRequest($eventRoomJoinRequestId: uuid!) {
        update_EventRoomJoinRequest_by_pk(pk_columns: { id: $eventRoomJoinRequestId }, _set: { approved: true }) {
            id
        }
    }
`;

export function JoinRequest({
    joinRequest,
    enableApproval,
}: {
    joinRequest: EventRoomJoinRequestDetailsFragment;
    enableApproval: boolean;
}): JSX.Element {
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
            toast({
                title: "Approved request to join",
                status: "success",
            });
        } catch (e) {
            console.error("Could not approve join request", joinRequest.id);
            toast({
                title: "Could not approve join request",
                status: "error",
            });
        }
        setLoading(false);
    }, [approveJoinRequestMutation, joinRequest.id, toast]);

    const attendee = useAttendee(joinRequest.attendeeId);

    return (
        <HStack my={2}>
            <FAIcon icon="hand-paper" iconStyle="s" />
            <Text>{attendee?.displayName ?? "<Loading>"}</Text>
            {enableApproval ? (
                <Box flexGrow={1} textAlign="right">
                    <Button
                        onClick={approveJoinRequest}
                        aria-label={`Add ${attendee?.displayName ?? "<Loading name>"} to the event room`}
                        isLoading={loading}
                        p={0}
                        colorScheme="green"
                        size="xs"
                    >
                        <FAIcon icon="check-circle" iconStyle="s" />{" "}
                    </Button>
                </Box>
            ) : (
                <></>
            )}
        </HStack>
    );
}
