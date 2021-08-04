import { gql } from "@apollo/client";
import { Box, BoxProps, Button, Spinner } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import React, { useEffect, useMemo, useState } from "react";
import {
    StarEventButton_GetStarsDocument,
    StarEventButton_GetStarsQuery,
    StarEventButton_GetStarsQueryVariables,
    StarredEventFragmentDoc,
    StarredEvents_SelectEventIdsDocument,
    StarredEvents_SelectEventIdsQuery,
    StarredEvents_SelectEventIdsQueryVariables,
    useStarEventButton_DeleteStarsMutation,
    useStarEventButton_GetStarsQuery,
    useStarEventButton_InsertStarsMutation,
} from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import { Registrant, useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";

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
                minW="1em"
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
    const starsResponse = useStarEventButton_GetStarsQuery({
        variables: {
            eventIds,
            registrantId: registrant.id,
        },
    });

    const [insertStars, insertStarsResponse] = useStarEventButton_InsertStarsMutation({
        update: (cache, response) => {
            if (response.data?.insert_schedule_StarredEvent) {
                const datas = response.data?.insert_schedule_StarredEvent.returning;
                datas.forEach((data) => {
                    cache.writeFragment({
                        data,
                        fragment: StarredEventFragmentDoc,
                        fragmentName: "StarredEvent",
                    });
                });

                {
                    const query = cache.readQuery<
                        StarEventButton_GetStarsQuery,
                        StarEventButton_GetStarsQueryVariables
                    >({
                        query: StarEventButton_GetStarsDocument,
                        variables: {
                            eventIds,
                            registrantId: registrant.id,
                        },
                    });
                    if (query) {
                        cache.writeQuery<StarEventButton_GetStarsQuery, StarEventButton_GetStarsQueryVariables>({
                            query: StarEventButton_GetStarsDocument,
                            data: {
                                ...query,
                                schedule_StarredEvent: [...query.schedule_StarredEvent, ...datas],
                            },
                            variables: {
                                eventIds,
                                registrantId: registrant.id,
                            },
                        });
                    }
                }
                {
                    const query = cache.readQuery<
                        StarredEvents_SelectEventIdsQuery,
                        StarredEvents_SelectEventIdsQueryVariables
                    >({
                        query: StarredEvents_SelectEventIdsDocument,
                        variables: {
                            registrantId: registrant.id,
                        },
                    });
                    if (query) {
                        cache.writeQuery<StarredEvents_SelectEventIdsQuery, StarredEvents_SelectEventIdsQueryVariables>(
                            {
                                query: StarredEvents_SelectEventIdsDocument,
                                data: {
                                    ...query,
                                    schedule_StarredEvent: [...query.schedule_StarredEvent, ...datas],
                                },
                                variables: {
                                    registrantId: registrant.id,
                                },
                            }
                        );
                    }
                }
            }
        },
    });
    const [deleteStars, deleteStarsResponse] = useStarEventButton_DeleteStarsMutation({
        update: (cache, response) => {
            if (response.data?.delete_schedule_StarredEvent) {
                const data = response.data.delete_schedule_StarredEvent;
                const deletedIds = data.returning.map((x) => x.id);
                deletedIds.forEach((x) => {
                    cache.evict({
                        id: x.id,
                        fieldName: "StarredEvents_SelectEventIds",
                        broadcast: true,
                    });

                    cache.evict({
                        id: x.id,
                        fieldName: "schedule_StarredEvent",
                        broadcast: true,
                    });
                });
                {
                    const query = cache.readQuery<
                        StarEventButton_GetStarsQuery,
                        StarEventButton_GetStarsQueryVariables
                    >({
                        query: StarEventButton_GetStarsDocument,
                        variables: {
                            eventIds,
                            registrantId: registrant.id,
                        },
                    });
                    if (query) {
                        cache.writeQuery<StarEventButton_GetStarsQuery, StarEventButton_GetStarsQueryVariables>({
                            query: StarEventButton_GetStarsDocument,
                            data: {
                                ...query,
                                schedule_StarredEvent: query.schedule_StarredEvent.filter(
                                    (x) => !deletedIds.includes(x.id)
                                ),
                            },
                            variables: {
                                eventIds,
                                registrantId: registrant.id,
                            },
                        });
                    }
                }
                {
                    const query = cache.readQuery<
                        StarredEvents_SelectEventIdsQuery,
                        StarredEvents_SelectEventIdsQueryVariables
                    >({
                        query: StarredEvents_SelectEventIdsDocument,
                        variables: {
                            registrantId: registrant.id,
                        },
                    });
                    if (query) {
                        cache.writeQuery<StarredEvents_SelectEventIdsQuery, StarredEvents_SelectEventIdsQueryVariables>(
                            {
                                query: StarredEvents_SelectEventIdsDocument,
                                data: {
                                    ...query,
                                    schedule_StarredEvent: query.schedule_StarredEvent.filter(
                                        (x) => !deletedIds.includes(x.id)
                                    ),
                                },
                                variables: {
                                    registrantId: registrant.id,
                                },
                            }
                        );
                    }
                }
            }
        },
    });

    if (starsResponse.loading) {
        return <Spinner size="xs" speed="0.6s" />;
    }

    if (insertStarsResponse.loading || deleteStarsResponse.loading) {
        return <Spinner size="xs" color="gold" speed="0.4s" />;
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
                        deleteStars({
                            variables: {
                                ids,
                            },
                        });
                    }
                }}
                variant="ghost"
                size="xs"
                m={0}
                p={0}
                w="auto"
                h="auto"
                minW={0}
                minH={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                _hover={{
                    bgColor: "gold",
                }}
            >
                <FAIcon iconStyle="s" icon="star" color="gold" aria-hidden />
            </Button>
        );
    } else {
        return (
            <Button
                aria-label="Add event to your personal schedule"
                onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    insertStars({
                        variables: {
                            objects: eventIds.map((eventId) => ({
                                eventId,
                                registrantId: registrant.id,
                            })),
                        },
                    });
                }}
                variant="ghost"
                size="xs"
                m={0}
                p={0}
                w="auto"
                h="auto"
                minW={0}
                minH={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                _hover={{
                    bgColor: "gold",
                }}
            >
                <FAIcon iconStyle="r" icon="star" color="gold" aria-hidden />
            </Button>
        );
    }
}
