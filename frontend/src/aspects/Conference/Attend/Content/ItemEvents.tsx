import { Flex, Heading, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { gql } from "urql";
import type { ItemEventFragment } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useConference } from "../../useConference";

gql`
    fragment ItemRoomEvent on schedule_Event {
        scheduledStartTime
        item {
            id
            title
        }
        exhibitionId
        id
        scheduledEndTime
        name
        modeName
    }
`;

export function ItemEvents({
    itemId: _itemId,
    events,
}: {
    itemId: string;
    events: readonly ItemEventFragment[];
}): JSX.Element {
    const conference = useConference();
    const thisPaperTable = useMemo(
        () =>
            !conference.disableAllTimesForThisItem?.[0]?.value ? (
                <>TODO:</> /*TODO: FOR SESSIONS: <EventsTable events={events} includeRoom={true} />*/
            ) : undefined,
        [conference.disableAllTimesForThisItem]
    );

    const rooms = useMemo(
        () => [
            ...events
                .reduce((acc, event) => {
                    const existing = acc.get(event.roomId);
                    if (!existing) {
                        acc.set(event.roomId, { roomName: event.room?.name ?? "Private room", events: [event] });
                    } else {
                        existing.events.push(event);
                    }
                    return acc;
                }, new Map<string, { roomName: string; events: ItemEventFragment[] }>())
                .entries(),
        ],
        [events]
    );

    return rooms.length > 0 &&
        (!conference.disableAllTimesForThisItem?.[0]?.value || !conference.disableNearbyEvents?.[0]?.value) ? (
        <>
            <Flex pt={2} flexWrap="wrap" alignItems="flex-start" gridColumnGap="2%" overflowX="auto">
                {!conference.disableAllTimesForThisItem?.[0]?.value ? (
                    <VStack flex="1 1 48%" alignItems="flex-start" maxW="max-content">
                        <Heading as="h4" size="md" textAlign="left" w="100%" pt={8}>
                            All times for this content
                        </Heading>
                        <Text my={3} w="auto" textAlign="left" p={0}>
                            <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                            Times are shown in your local timezone.
                        </Text>
                        {thisPaperTable}
                    </VStack>
                ) : undefined}
            </Flex>
        </>
    ) : (
        <></>
    );
}
