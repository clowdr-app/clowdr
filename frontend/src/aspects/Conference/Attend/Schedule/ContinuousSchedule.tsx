/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, Spinner, Text } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import * as R from "ramda";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ScheduleEventFragment,
    SelectSchedulePageQuery,
    SelectSchedulePageQueryVariables,
} from "../../../../generated/graphql";
import { Order_By, SelectSchedulePageDocument } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
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
`;

export default function ContinuousSchedule({
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    eventsPerPage,
    includeAbstract,

    startAtMs,
}: ScheduleProps & {
    startAtMs: number;
}): JSX.Element {
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
                    const response = await client
                        .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(SelectSchedulePageDocument, {
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
                            ordering: [{ scheduledStartTime: Order_By.Desc }, { scheduledEndTime: Order_By.Desc }],
                            limit: eventsPerPage,
                            includeAbstract,
                            includeItemEvents: false,
                        })
                        .toPromise();

                    if (response.data?.schedule_Event) {
                        setMightHaveEarlier(response.data.schedule_Event.length === eventsPerPage);
                        setMightHaveLater((old) => Boolean(old || ignoreExisting));
                        const earlierEvents = response.data.schedule_Event;
                        setEvents((old) =>
                            !ignoreExisting ? [...R.reverse(earlierEvents), ...old] : R.reverse(earlierEvents)
                        );
                    }
                } finally {
                    loadingEarlierRef.current = false;
                    setLoadingEarlier(false);
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
            startAtMs,
            subconferenceId,
        ]
    );

    const loadLaterEvents = useCallback(
        async (ignoreExisting?: boolean) => {
            if (!loadingLaterRef.current) {
                loadingLaterRef.current = true;
                setLoadingLater(true);
                try {
                    const response = await client
                        .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(SelectSchedulePageDocument, {
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
                            ordering: [{ scheduledStartTime: Order_By.Asc }, { scheduledEndTime: Order_By.Asc }],
                            limit: eventsPerPage,
                            includeAbstract,
                            includeItemEvents: false,
                        })
                        .toPromise();

                    if (response.data?.schedule_Event) {
                        setMightHaveEarlier((old) => Boolean(old || ignoreExisting));
                        setMightHaveLater(response.data.schedule_Event.length === eventsPerPage);

                        const laterEvents = response.data.schedule_Event;
                        setEvents((old) => (!ignoreExisting ? [...old, ...laterEvents] : [...laterEvents]));
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
            <ScheduleList events={events} />
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
