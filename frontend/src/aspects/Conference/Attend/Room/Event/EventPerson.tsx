import { gql } from "@apollo/client";
import { Badge, Box, Button, HStack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback } from "react";
import {
    EventPersonDetailsFragment,
    EventPersonRole_Enum,
    useDeleteEventPersonMutation,
} from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useAttendee } from "../../../AttendeesContext";

gql`
    mutation DeleteEventPerson($eventPersonId: uuid!) {
        delete_EventPerson_by_pk(id: $eventPersonId) {
            id
        }
    }
`;

export function EventPerson({
    eventPerson,
    enableDelete,
}: {
    eventPerson: EventPersonDetailsFragment;
    enableDelete: boolean;
}): JSX.Element {
    const [deleteEventPersonMutation] = useDeleteEventPersonMutation();
    const toast = useToast();

    const deleteEventPerson = useCallback(async () => {
        try {
            await deleteEventPersonMutation({
                variables: {
                    eventPersonId: eventPerson.id,
                },
            });
            toast({
                title: "Removed person from event",
                status: "success",
            });
        } catch (e) {
            console.error("Could not remove event person", eventPerson.id);
            toast({
                title: "Could not remove person from this event",
                status: "error",
            });
        }
    }, [deleteEventPersonMutation, eventPerson.id, toast]);

    const attendee = useAttendee(eventPerson.attendeeId);

    return (
        <HStack>
            <Text>{attendee?.displayName ?? "<Unknown>"}</Text>
            <Badge colorScheme={eventPerson.roleName === EventPersonRole_Enum.Participant ? "blue" : "red"}>
                {eventPerson.roleName}
            </Badge>
            {enableDelete ? (
                <Box flexGrow={1} textAlign="right">
                    <Button
                        onClick={deleteEventPerson}
                        aria-label={`Remove ${attendee?.displayName ?? "<Loading name>"} from the event room`}
                        p={0}
                        colorScheme="red"
                        size="xs"
                    >
                        <FAIcon icon="times-circle" iconStyle="s" />
                    </Button>
                </Box>
            ) : (
                <></>
            )}
        </HStack>
    );
}
