/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, Spinner, Text } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import * as R from "ramda";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ScheduleEventFragment,
    SelectMySchedulePageQuery,
    SelectMySchedulePageQueryVariables,
    SelectSchedulePageQuery,
    SelectSchedulePageQueryVariables,
} from "../../../../generated/graphql";
import { Order_By, SelectMySchedulePageDocument, SelectSchedulePageDocument } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import ScheduleList from "./ScheduleList";
import type { ScheduleProps } from "./ScheduleProps";

gql`
    fragment ScheduleItemTag on content_ItemTag {
        id
        itemId
        tagId
    }

    fragment ScheduleItemPerson on content_ItemProgramPerson {
        id
        itemId
        personId
        roleName
    }

    fragment ScheduleItem on content_Item {
        id
        conferenceId
        subconferenceId
        title
        typeName
        itemTags {
            ...ScheduleItemTag
        }
        itemPeople {
            ...ScheduleItemPerson
        }
        abstract: elements(where: { typeName: { _eq: ABSTRACT } }, limit: 1) @include(if: $includeAbstract) {
            id
            data
        }
        events @include(if: $includeItemEvents) {
            id
            session {
                id
                name
                item {
                    id
                    title
                }
            }
        }
    }

    fragment ScheduleEvent on schedule_Event {
        id
        conferenceId
        subconferenceId
        scheduledStartTime
        scheduledEndTime
        name
        roomId
        modeName
        sessionEventId
        item {
            ...ScheduleItem
        }
    }

    query SelectSchedulePage(
        $where: schedule_Event_bool_exp!
        $ordering: [schedule_Event_order_by!]!
        $limit: Int!
        $includeAbstract: Boolean!
        $includeItemEvents: Boolean!
    ) @cached {
        schedule_Event(where: $where, order_by: $ordering, limit: $limit) {
            ...ScheduleEvent
        }
    }

    query SelectMySchedulePage(
        $where: schedule_Event_bool_exp!
        $starredOrdering: [schedule_StarredEvent_order_by!]!
        $peopleOrdering: [schedule_EventProgramPerson_order_by!]!
        $limit: Int!
        $includeAbstract: Boolean!
        $includeItemEvents: Boolean!
        $registrantId: uuid!
    ) @cached {
        schedule_StarredEvent(
            where: { registrantId: { _eq: $registrantId }, event: $where }
            order_by: $starredOrdering
            limit: $limit
        ) {
            event {
                ...ScheduleEvent
            }
        }
        schedule_EventProgramPerson(
            where: { person: { registrantId: { _eq: $registrantId } }, event: $where }
            order_by: $peopleOrdering
            limit: $limit
        ) {
            event {
                ...ScheduleEvent
            }
        }
    }
`;

export default function ContinuousSchedule({
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    eventsPerPage,
    includeAbstract,
    includeTypeName,

    startAtMs,
    myEventsOnly,
}: ScheduleProps & {
    startAtMs: number;
    myEventsOnly?: boolean;
}): JSX.Element {
    const maybeRegistrant = useMaybeCurrentRegistrant();

    const [events, setEvents] = useState<ScheduleEventFragment[]>([]);
    const [mightHaveEarlier, setMightHaveEarlier] = useState<boolean>(true);
    const [mightHaveLater, setMightHaveLater] = useState<boolean>(true);
    const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);
    const [loadingLater, setLoadingLater] = useState<boolean>(false);

    const loadingEarlierRef = useRef<boolean>(false);
    const loadingLaterRef = useRef<boolean>(false);

    const client = useClient();

    const loadEarlierEvents = useCallback(
        async (ignoreExisting?: boolean) => {
            if (!loadingEarlierRef.current) {
                loadingEarlierRef.current = true;
                setLoadingEarlier(true);
                try {
                    let earlierEvents: undefined | readonly ScheduleEventFragment[];

                    if (myEventsOnly && maybeRegistrant) {
                        const response = await client
                            .query<SelectMySchedulePageQuery, SelectMySchedulePageQueryVariables>(
                                SelectMySchedulePageDocument,
                                {
                                    where: {
                                        conferenceId: { _eq: conferenceId },
                                        ...(includeAllSubconferences
                                            ? {}
                                            : {
                                                  subconferenceId: subconferenceId
                                                      ? { _eq: subconferenceId }
                                                      : { _is_null: true },
                                              }),
                                        sessionEventId: { _is_null: true },

                                        scheduledEndTime: {
                                            _lt: new Date(
                                                !ignoreExisting && events[0]?.scheduledEndTime
                                                    ? Date.parse(events[0].scheduledEndTime)
                                                    : startAtMs
                                            ).toISOString(),
                                        },
                                    },
                                    starredOrdering: [
                                        { event: { scheduledStartTime: Order_By.Desc } },
                                        { event: { scheduledEndTime: Order_By.Desc } },
                                    ],
                                    peopleOrdering: [
                                        { event: { scheduledStartTime: Order_By.Desc } },
                                        { event: { scheduledEndTime: Order_By.Desc } },
                                    ],
                                    limit: eventsPerPage,
                                    includeAbstract,
                                    includeItemEvents: false,
                                    registrantId: maybeRegistrant.id,
                                }
                            )
                            .toPromise();

                        earlierEvents = R.sortWith(
                            [
                                (x, y) => Date.parse(y.scheduledStartTime) - Date.parse(x.scheduledStartTime),
                                (x, y) => Date.parse(y.scheduledEndTime) - Date.parse(x.scheduledEndTime),
                            ],
                            R.uniqBy(
                                (x) => x.id,
                                [
                                    ...(response.data?.schedule_StarredEvent.map((x) => x.event) ?? []),
                                    ...(response.data?.schedule_EventProgramPerson.map((x) => x.event) ?? []),
                                ]
                            )
                        );
                    } else {
                        const response = await client
                            .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(
                                SelectSchedulePageDocument,
                                {
                                    where: {
                                        conferenceId: { _eq: conferenceId },
                                        ...(includeAllSubconferences
                                            ? {}
                                            : {
                                                  subconferenceId: subconferenceId
                                                      ? { _eq: subconferenceId }
                                                      : { _is_null: true },
                                              }),
                                        sessionEventId: { _is_null: true },

                                        scheduledEndTime: {
                                            _lt: new Date(
                                                !ignoreExisting && events[0]?.scheduledEndTime
                                                    ? Date.parse(events[0].scheduledEndTime)
                                                    : startAtMs
                                            ).toISOString(),
                                        },
                                    },
                                    ordering: [
                                        { scheduledStartTime: Order_By.Desc },
                                        { scheduledEndTime: Order_By.Desc },
                                    ],
                                    limit: eventsPerPage,
                                    includeAbstract,
                                    includeItemEvents: false,
                                }
                            )
                            .toPromise();

                        earlierEvents = response.data?.schedule_Event;
                    }

                    if (earlierEvents) {
                        setMightHaveEarlier(earlierEvents.length === eventsPerPage);
                        setMightHaveLater((old) => Boolean(old || ignoreExisting));
                        const xs = earlierEvents;
                        setEvents((old) => (!ignoreExisting ? [...R.reverse(xs), ...old] : R.reverse(xs)));
                    }
                } finally {
                    loadingEarlierRef.current = false;
                    setLoadingEarlier(false);
                }
            }
        },
        [
            myEventsOnly,
            maybeRegistrant,
            client,
            conferenceId,
            includeAllSubconferences,
            subconferenceId,
            events,
            startAtMs,
            eventsPerPage,
            includeAbstract,
        ]
    );

    const loadLaterEvents = useCallback(
        async (ignoreExisting?: boolean) => {
            if (!loadingLaterRef.current) {
                loadingLaterRef.current = true;
                setLoadingLater(true);
                try {
                    let laterEvents: undefined | readonly ScheduleEventFragment[];

                    if (myEventsOnly && maybeRegistrant) {
                        const response = await client
                            .query<SelectMySchedulePageQuery, SelectMySchedulePageQueryVariables>(
                                SelectMySchedulePageDocument,
                                {
                                    where: {
                                        conferenceId: { _eq: conferenceId },
                                        ...(includeAllSubconferences
                                            ? {}
                                            : {
                                                  subconferenceId: subconferenceId
                                                      ? { _eq: subconferenceId }
                                                      : { _is_null: true },
                                              }),
                                        sessionEventId: { _is_null: true },

                                        _and: [
                                            {
                                                scheduledEndTime:
                                                    !ignoreExisting && events[events.length - 1]?.scheduledEndTime
                                                        ? {
                                                              _gt: new Date(
                                                                  events[events.length - 1].scheduledEndTime
                                                              ).toISOString(),
                                                          }
                                                        : { _gte: new Date(startAtMs).toISOString() },
                                            },
                                        ],
                                    },
                                    starredOrdering: [
                                        { event: { scheduledStartTime: Order_By.Asc } },
                                        { event: { scheduledEndTime: Order_By.Asc } },
                                    ],
                                    peopleOrdering: [
                                        { event: { scheduledStartTime: Order_By.Asc } },
                                        { event: { scheduledEndTime: Order_By.Asc } },
                                    ],
                                    limit: eventsPerPage,
                                    includeAbstract,
                                    includeItemEvents: false,
                                    registrantId: maybeRegistrant.id,
                                }
                            )
                            .toPromise();

                        laterEvents = R.sortWith(
                            [
                                (x, y) => Date.parse(x.scheduledStartTime) - Date.parse(y.scheduledStartTime),
                                (x, y) => Date.parse(x.scheduledEndTime) - Date.parse(y.scheduledEndTime),
                            ],
                            R.uniqBy(
                                (x) => x.id,
                                [
                                    ...(response.data?.schedule_StarredEvent.map((x) => x.event) ?? []),
                                    ...(response.data?.schedule_EventProgramPerson.map((x) => x.event) ?? []),
                                ]
                            )
                        );
                    } else {
                        const response = await client
                            .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(
                                SelectSchedulePageDocument,
                                {
                                    where: {
                                        conferenceId: { _eq: conferenceId },
                                        ...(includeAllSubconferences
                                            ? {}
                                            : {
                                                  subconferenceId: subconferenceId
                                                      ? { _eq: subconferenceId }
                                                      : { _is_null: true },
                                              }),
                                        sessionEventId: { _is_null: true },

                                        _and: [
                                            {
                                                scheduledEndTime:
                                                    !ignoreExisting && events[events.length - 1]?.scheduledEndTime
                                                        ? {
                                                              _gt: new Date(
                                                                  events[events.length - 1].scheduledEndTime
                                                              ).toISOString(),
                                                          }
                                                        : { _gte: new Date(startAtMs).toISOString() },
                                            },
                                        ],
                                    },
                                    ordering: [
                                        { scheduledStartTime: Order_By.Asc },
                                        { scheduledEndTime: Order_By.Asc },
                                    ],
                                    limit: eventsPerPage,
                                    includeAbstract,
                                    includeItemEvents: false,
                                }
                            )
                            .toPromise();
                        laterEvents = response.data?.schedule_Event;
                    }

                    if (laterEvents) {
                        setMightHaveEarlier((old) => Boolean(old || ignoreExisting));
                        setMightHaveLater(laterEvents.length === eventsPerPage);

                        const xs = laterEvents;
                        setEvents((old) => (!ignoreExisting ? [...old, ...xs] : [...xs]));
                    }
                } finally {
                    loadingLaterRef.current = false;
                    setLoadingLater(false);
                }
            }
        },
        [
            client,
            conferenceId,
            events,
            eventsPerPage,
            includeAbstract,
            includeAllSubconferences,
            maybeRegistrant,
            myEventsOnly,
            startAtMs,
            subconferenceId,
        ]
    );

    useEffect(() => {
        loadLaterEvents(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startAtMs]);

    return (
        <>
            {mightHaveEarlier ? (
                <Button
                    variant="outline"
                    textDecoration="underline"
                    onClick={() => {
                        loadEarlierEvents();
                    }}
                    isLoading={loadingEarlier}
                    w="100%"
                    py={2}
                >
                    <FAIcon iconStyle="s" icon="chevron-up" mr={2} />
                    Load earlier sessions
                </Button>
            ) : undefined}
            <ScheduleList events={events} includeTypeName={includeTypeName} includeAbstract={includeAbstract} />
            {events.length === 0 && !loadingLater && !loadingEarlier ? <Text>No sessions to display</Text> : undefined}
            {!mightHaveEarlier && !mightHaveLater && (loadingLater || loadingEarlier) ? <Spinner /> : undefined}
            {mightHaveLater ? (
                <Observer
                    onChange={(props) => {
                        if (props.intersectionRatio > 0) {
                            loadLaterEvents();
                        }
                    }}
                >
                    <Button
                        variant="outline"
                        textDecoration="underline"
                        onClick={() => {
                            loadLaterEvents();
                        }}
                        isLoading={loadingLater}
                        w="100%"
                        py={2}
                    >
                        <FAIcon iconStyle="s" icon="chevron-down" mr={2} />
                        Load later sessions
                    </Button>
                </Observer>
            ) : undefined}
        </>
    );
}
