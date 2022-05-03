import type { BoxProps } from "@chakra-ui/react";
import { Box, Button, Spinner } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import {
    useStarEventButton_DeleteStarsMutation,
    useStarEventButton_GetStarsQuery,
    useStarEventButton_InsertStarsMutation,
} from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import type { Registrant } from "../../useCurrentRegistrant";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import { useMyScheduleCacheControl } from "./ContinuousSchedule";

gql`
    fragment StarredEvent on schedule_StarredEvent {
        id
        eventId
        registrantId
    }

    query StarEventButton_GetStars($eventIds: [uuid!]!, $registrantId: uuid!) {
        schedule_StarredEvent(where: { eventId: { _in: $eventIds }, registrantId: { _eq: $registrantId } }) {
            ...StarredEvent
        }
    }

    mutation StarEventButton_InsertStars($objects: [schedule_StarredEvent_insert_input!]!) {
        insert_schedule_StarredEvent(objects: $objects) {
            returning {
                ...StarredEvent
            }
        }
    }

    mutation StarEventButton_DeleteStars($ids: [uuid!]!) {
        delete_schedule_StarredEvent(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export default function StarEventButton({
    eventIds,
    ...props
}: { eventIds: string | string[] } & BoxProps): JSX.Element {
    const registrant = useMaybeCurrentRegistrant();
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [show, setShow] = useState<boolean>(false);
    useEffect(() => {
        let tId: number | undefined;

        if (isVisible) {
            tId = setTimeout(
                (() => {
                    setShow(true);
                }) as TimerHandler,
                250
            );
        }

        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isVisible]);

    const inner = useMemo(
        () => (show && registrant ? <StarEventButtonInner eventIds={eventIds} registrant={registrant} /> : undefined),
        [eventIds, registrant, show]
    );
    return show && registrant ? (
        <>{inner}</>
    ) : (
        <Observer
            onChange={({ isIntersecting }) => {
                setIsVisible(isIntersecting);
            }}
        >
            <Box
                display="inline-flex"
                justifyContent="center"
                alignItems="center"
                verticalAlign="middle"
                w="1em"
                {...props}
            >
                {inner}
            </Box>
        </Observer>
    );
}

function StarEventButtonInner({
    eventIds: _eventIds,
    registrant,
}: {
    eventIds: string | string[];
    registrant: Registrant;
}): JSX.Element {
    const eventIds = useMemo(() => (typeof _eventIds === "string" ? [_eventIds] : _eventIds), [_eventIds]);
    const getStarsContext = useMemo(() => ({ additionalTypenames: ["schedule_StarredEvent"] }), []);
    const [starsResponse] = useStarEventButton_GetStarsQuery({
        variables: {
            eventIds,
            registrantId: registrant.id,
        },
        context: getStarsContext,
    });

    const [insertStarsResponse, insertStars] = useStarEventButton_InsertStarsMutation();
    const [deleteStarsResponse, deleteStars] = useStarEventButton_DeleteStarsMutation();

    const [_, setShouldRefreshCache] = useMyScheduleCacheControl();

    if (starsResponse.fetching) {
        return (
            <Box display="inline-flex" justifyContent="center" alignItems="center" verticalAlign="middle" w="1.19em">
                <Spinner size="xs" color="blue" speed="0.4s" />
            </Box>
        );
    }

    if (insertStarsResponse.fetching || deleteStarsResponse.fetching) {
        return (
            <Box display="inline-flex" justifyContent="center" alignItems="center" verticalAlign="middle" w="1.19em">
                <Spinner size="xs" color="blue" speed="0.4s" />
            </Box>
        );
    }

    if (!starsResponse.data) {
        return <div></div>;
    }

    if (starsResponse.data.schedule_StarredEvent.length > 0) {
        return (
            <Button
                aria-label="Remove event from your personal schedule"
                onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    const ids = starsResponse.data?.schedule_StarredEvent.map((x) => x.id);
                    if (ids) {
                        deleteStars(
                            {
                                ids,
                            },
                            getStarsContext
                        );
                        setShouldRefreshCache(true);
                    }
                }}
                variant="ghost"
                size="md"
                m={0}
                p={0}
                w="1.1em"
                h="auto"
                minW={0}
                minH={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                _hover={{
                    bgColor: "blue",
                }}
                fontWeight="bold"
                flex="0 0 auto"
            >
                <FAIcon iconStyle="s" icon="calendar-minus" color="blue" aria-hidden />
            </Button>
        );
    } else {
        return (
            <Button
                aria-label="Add event to your personal schedule"
                onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    insertStars(
                        {
                            objects: eventIds.map((eventId) => ({
                                eventId,
                                registrantId: registrant.id,
                            })),
                        },
                        getStarsContext
                    );
                    setShouldRefreshCache(true);
                }}
                variant="ghost"
                size="md"
                m={0}
                p={0}
                w="1.1em"
                h="auto"
                minW={0}
                minH={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                _hover={{
                    bgColor: "blue",
                }}
                fontWeight="bold"
                flex="0 0 auto"
            >
                <FAIcon iconStyle="s" icon="calendar-plus" color="blue" aria-hidden />
            </Button>
        );
    }
}
