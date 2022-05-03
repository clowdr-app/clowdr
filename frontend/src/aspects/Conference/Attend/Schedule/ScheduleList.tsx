/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Heading, VStack } from "@chakra-ui/react";
import React, { Fragment } from "react";
import type { ScheduleEventFragment } from "../../../../generated/graphql";
import EventCard from "./EventCard";

export default function ScheduleList({
    events,
    noDayHeadings,
    autoExpandPresentations,
    includeTypeName,
    includeAbstract,
    onlyLinkToRoom,
    promptMoveOnLiveEvent,
    currentRoomId,
}: {
    events: readonly ScheduleEventFragment[];
    noDayHeadings?: boolean;
    includeTypeName?: boolean;
    autoExpandPresentations?: boolean;
    includeAbstract?: boolean;
    onlyLinkToRoom?: boolean;
    promptMoveOnLiveEvent?: boolean;
    currentRoomId?: string;
}): JSX.Element {
    return (
        <VStack spacing={4} alignItems="stretch" justifyContent="flex-start">
            {events.map((event, idx) => {
                const previous = events[idx - 1];
                const previousStart = previous?.scheduledStartTime ? new Date(previous.scheduledStartTime) : undefined;
                const thisStart = event.scheduledStartTime ? new Date(event.scheduledStartTime) : undefined;
                const dateChanged =
                    idx === 0 ||
                    (previousStart &&
                        thisStart &&
                        (previousStart.getDate() !== thisStart.getDate() ||
                            previousStart.getMonth() !== thisStart.getMonth() ||
                            previousStart.getFullYear() !== thisStart.getFullYear()));

                const card = (
                    <EventCard
                        key={event.id}
                        event={event}
                        includePresentations
                        includeTypeName={includeTypeName}
                        autoExpandPresentations={autoExpandPresentations}
                        includeAbstract={includeAbstract}
                        onlyLinkToRoom={onlyLinkToRoom}
                        promptMoveOnLiveEvent={event.roomId !== currentRoomId && promptMoveOnLiveEvent}
                    />
                );
                return dateChanged && !noDayHeadings ? (
                    <Fragment key={event.id}>
                        <Heading as="h2" fontSize="md" textAlign="left" pl={1} pt={4}>
                            {thisStart?.toLocaleDateString(undefined, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            })}
                            {thisStart &&
                            ((previousStart && thisStart.getFullYear() !== previousStart.getFullYear()) ||
                                (idx === 0 && thisStart.getFullYear() !== new Date().getFullYear()))
                                ? " " + thisStart.getFullYear()
                                : undefined}
                        </Heading>
                        {card}
                    </Fragment>
                ) : (
                    card
                );
            })}
        </VStack>
    );
}
