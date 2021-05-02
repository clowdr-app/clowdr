import { gql } from "@apollo/client";
import { Badge, Box, Button, HStack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import {
    EventProgramPersonDetailsFragment,
    EventProgramPersonRole_Enum,
    useDeleteEventProgramPersonMutation,
} from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useRegistrant } from "../../../RegistrantsContext";

gql`
    mutation DeleteEventProgramPerson($eventProgramPersonId: uuid!) {
        delete_schedule_EventProgramPerson_by_pk(id: $eventProgramPersonId) {
            id
        }
    }
`;

export function EventProgramPerson({
    eventProgramPerson,
    enableDelete: enableDeleteInput,
    userId,
}: {
    eventProgramPerson: EventProgramPersonDetailsFragment;
    enableDelete: boolean;
    userId: string | null;
}): JSX.Element {
    const [deleteEventProgramPersonMutation] = useDeleteEventProgramPersonMutation();
    const toast = useToast();

    const deleteEventProgramPerson = useCallback(async () => {
        try {
            await deleteEventProgramPersonMutation({
                variables: {
                    eventProgramPersonId: eventProgramPerson.id,
                },
            });
            toast({
                title: "Removed person from event",
                status: "success",
            });
        } catch (e) {
            console.error("Could not remove event person", eventProgramPerson.id);
            toast({
                title: "Could not remove person from this event",
                status: "error",
            });
        }
    }, [deleteEventProgramPersonMutation, eventProgramPerson.id, toast]);

    const eventProgramPersonIdObj = useMemo(
        () =>
            eventProgramPerson.person?.registrantId
                ? { registrant: eventProgramPerson.person.registrantId }
                : undefined,
        [eventProgramPerson.person.registrantId]
    );
    const registrant = useRegistrant(eventProgramPersonIdObj);
    // Intentionally using `!=` (rather than `!==`) because `userId` may be null or undefined
    const enableDelete = enableDeleteInput && registrant?.userId != userId;

    return (
        <HStack>
            <Text>{registrant?.displayName ?? "<Unknown>"}</Text>
            <Badge
                colorScheme={eventProgramPerson.roleName === EventProgramPersonRole_Enum.Participant ? "blue" : "red"}
            >
                {eventProgramPerson.roleName}
            </Badge>
            {enableDelete ? (
                <Box flexGrow={1} textAlign="right">
                    <Button
                        onClick={deleteEventProgramPerson}
                        aria-label={`Remove ${registrant?.displayName ?? "<Loading name>"} from the event room`}
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
