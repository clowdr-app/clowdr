import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { gql } from "urql";
import { useSchedule_GetPresentationsQuery } from "../../../../generated/graphql";
import EventCard from "./EventCard";

gql`
    query Schedule_GetPresentations($sessionId: uuid!, $includeAbstract: Boolean!, $includeItemEvents: Boolean!) {
        schedule_Event(
            where: { sessionEventId: { _eq: $sessionId } }
            order_by: [{ scheduledStartTime: asc_nulls_last }]
        ) {
            ...ScheduleEvent
        }
    }
`;

export default function PresentationsList({ sessionId }: { sessionId: string }): JSX.Element {
    const [presentationsResponse] = useSchedule_GetPresentationsQuery({
        variables: {
            sessionId,
            includeAbstract: true,
            includeItemEvents: false,
        },
    });
    const presentations = presentationsResponse.data?.schedule_Event ?? [];

    return (
        <VStack pt={2} pl={24} alignItems="stretch" w="100%" zIndex={1} spacing={4}>
            {presentationsResponse.fetching ? (
                <Spinner />
            ) : presentations.length === 0 ? (
                <Text>No presentations found - proceedings may be ad-hoc or unscheduled.</Text>
            ) : (
                presentations.map((presentation, idx) => <EventCard key={idx} event={presentation} />)
            )}
            <Box h={4}>&nbsp;</Box>
        </VStack>
    );
}
