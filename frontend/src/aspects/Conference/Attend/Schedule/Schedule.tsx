/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, Heading, Select, Spinner, Tag, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { DateTime, Duration, SystemZone } from "luxon";
import * as R from "ramda";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { gql, useClient } from "urql";
import type {
    ScheduleEventFragment,
    SelectSchedulePageQuery,
    SelectSchedulePageQueryVariables,
} from "../../../../generated/graphql";
import {
    Order_By,
    SelectSchedulePageDocument,
    useSelectScheduleBoundsQuery,
    useSelectSchedulePeopleQuery,
    useSelectScheduleTagsQuery,
} from "../../../../generated/graphql";
import Card from "../../../Card";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../../../Chakra/Outline";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useConference } from "../../useConference";
import StarEventButton from "./StarEventButton";

gql`
    query SelectScheduleBounds($where: schedule_Event_bool_exp!) @cached {
        first: schedule_Event(where: $where, order_by: [{ scheduledStartTime: asc }], limit: 1) {
            id
            scheduledStartTime
        }
        last: schedule_Event(where: $where, order_by: [{ scheduledEndTime: desc }], limit: 1) {
            id
            scheduledEndTime
        }
    }
`;

export interface ScheduleProps {
    conferenceId: string;
    includeAllSubconferences?: boolean;
    subconferenceId?: string;
    eventsPerPage: number;

    includeAbstract: boolean;
}

export default function Schedule({
    selectableDates,
    ...props
}: ScheduleProps & {
    selectableDates: boolean;
}): JSX.Element {
    if (selectableDates) {
        return <SelectableSchedule {...props} />;
    } else {
        return (
            <VStack spacing={4} alignItems="flex-start" w="100%">
                <ContinuousSchedule startAtMs={DateTime.now().toMillis()} {...props} />
            </VStack>
        );
    }
}

function SelectableSchedule({
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    ...props
}: ScheduleProps): JSX.Element {
    const [boundsResponse] = useSelectScheduleBoundsQuery({
        variables: {
            where: {
                conferenceId: { _eq: conferenceId },
                ...(includeAllSubconferences
                    ? {}
                    : {
                          subconferenceId: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
                      }),
                sessionEventId: { _is_null: true },
            },
        },
    });

    return boundsResponse.fetching ? (
        <CenteredSpinner caller="Schedule.tsx:60" />
    ) : boundsResponse.data ? (
        <SelectableScheduleInner
            earliestTime={boundsResponse.data.first[0]?.scheduledStartTime}
            latestTime={boundsResponse.data.last[0]?.scheduledEndTime}
            conferenceId={conferenceId}
            includeAllSubconferences={includeAllSubconferences}
            subconferenceId={subconferenceId}
            {...props}
        />
    ) : (
        <Text>Unable to load schedule.</Text>
    );
}

function SelectableScheduleInner({
    earliestTime,
    latestTime,
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    ...props
}: ScheduleProps & {
    earliestTime: string | null | undefined;
    latestTime: string | null | undefined;
}): JSX.Element {
    const days = useMemo(() => {
        if (!earliestTime || !latestTime) {
            return [];
        }

        const startDate = DateTime.fromISO(earliestTime).setZone(SystemZone.instance).startOf("day");
        const endDate = DateTime.fromISO(latestTime).setZone(SystemZone.instance).startOf("day");
        const result: {
            label: string;
            value: number;
        }[] = [];
        let currentDate = startDate;
        while (currentDate.toMillis() <= endDate.toMillis()) {
            result.push({
                label: currentDate.toLocaleString({
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                value: currentDate.toMillis(),
            });
            currentDate = currentDate.plus(
                Duration.fromObject({
                    days: 1,
                })
            );
        }
        return result;
    }, [earliestTime, latestTime]);

    const today = useMemo(() => DateTime.now().startOf("day"), []);
    const todayMillis = useMemo(() => today.toMillis(), [today]);
    const todayInSchedule = useMemo(() => days.some((x) => x.value === todayMillis), [days, todayMillis]);
    const defaultSelectedDay = todayInSchedule ? todayMillis : days[0]?.value ?? 0;
    const [selectedDay, setSelectedDay] = useRestorableState<number>(
        `PreviouslySelectedDay-${conferenceId}-${subconferenceId}`,
        defaultSelectedDay,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    return (
        <VStack spacing={4} alignItems="flex-start" w="100%">
            <Select
                minW="max-content"
                maxW="max-content"
                borderColor="SecondaryActionButton.500"
                aria-label="Select date"
                value={selectedDay.toString()}
                onChange={(ev) => {
                    const value = parseInt(ev.target.value, 10);
                    setSelectedDay(value);
                }}
            >
                {days.map((day) => (
                    <option
                        key={day.value}
                        value={day.value}
                        css={{
                            fontWeight: day.value === todayMillis ? "bold" : undefined,
                        }}
                    >
                        {day.label}
                    </option>
                ))}
                {days.length === 0 ? <option value={0}>No dates available</option> : undefined}
            </Select>
            {selectedDay !== 0 ? (
                <ContinuousSchedule
                    startAtMs={selectedDay}
                    endAtMs={DateTime.fromMillis(selectedDay).endOf("day").toMillis()}
                    conferenceId={conferenceId}
                    subconferenceId={subconferenceId}
                    includeAllSubconferences={includeAllSubconferences}
                    canLoadEarlier={false}
                    canLoadLater={false}
                    {...props}
                />
            ) : (
                <Text>No sessions to display.</Text>
            )}
        </VStack>
    );
}

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
        title
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
    ) @cached {
        schedule_Event(where: $where, order_by: $ordering, limit: $limit) {
            ...ScheduleEvent
        }
    }

    query SelectScheduleTags($where: collection_Tag_bool_exp!) @cached {
        collection_Tag(where: $where) {
            id
            name
            colour
            priority
        }
    }

    query SelectSchedulePeople($ids: [uuid!]!) @cached {
        collection_ProgramPerson(where: { id: { _in: $ids } }) {
            id
            name
        }
    }
`;

function ContinuousSchedule({
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    eventsPerPage,
    includeAbstract,

    canLoadEarlier = true,
    canLoadLater = true,
    startAtMs,
    endAtMs,
}: ScheduleProps & {
    canLoadEarlier?: boolean;
    canLoadLater?: boolean;
    startAtMs: number;
    endAtMs?: number;
}): JSX.Element {
    const [events, setEvents] = useState<ScheduleEventFragment[]>([]);
    const [mightHaveEarlier, setMightHaveEarlier] = useState<boolean>(true);
    const [mightHaveLater, setMightHaveLater] = useState<boolean>(true);
    const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);
    const [loadingLater, setLoadingLater] = useState<boolean>(false);

    const client = useClient();

    const loadEarlierEvents = useCallback(
        async (ignoreExisting?: boolean) => {
            setLoadingEarlier(true);
            try {
                const response = await client
                    .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(SelectSchedulePageDocument, {
                        where: {
                            conferenceId: { _eq: conferenceId },
                            ...(includeAllSubconferences
                                ? {}
                                : {
                                      subconferenceId: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
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
                    })
                    .toPromise();

                if (response.data?.schedule_Event) {
                    setMightHaveEarlier(response.data.schedule_Event.length === eventsPerPage);
                    const earlierEvents = response.data.schedule_Event;
                    setEvents((old) =>
                        !ignoreExisting ? [...R.reverse(earlierEvents), ...old] : R.reverse(earlierEvents)
                    );
                }
            } finally {
                setLoadingEarlier(false);
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
            setLoadingLater(true);
            try {
                const response = await client
                    .query<SelectSchedulePageQuery, SelectSchedulePageQueryVariables>(SelectSchedulePageDocument, {
                        where: {
                            conferenceId: { _eq: conferenceId },
                            ...(includeAllSubconferences
                                ? {}
                                : {
                                      subconferenceId: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
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
                                ...(endAtMs
                                    ? [
                                          {
                                              scheduledStartTime: {
                                                  _lt: new Date(endAtMs).toISOString(),
                                              },
                                          },
                                      ]
                                    : []),
                            ],
                        },
                        ordering: [{ scheduledStartTime: Order_By.Asc }, { scheduledEndTime: Order_By.Asc }],
                        limit: eventsPerPage,
                        includeAbstract,
                    })
                    .toPromise();

                if (response.data?.schedule_Event) {
                    setMightHaveLater(response.data.schedule_Event.length === eventsPerPage);

                    const laterEvents = response.data.schedule_Event;
                    setEvents((old) => (!ignoreExisting ? [...old, ...laterEvents] : [...laterEvents]));

                    if (!response.data.schedule_Event.length && canLoadEarlier) {
                        loadEarlierEvents(ignoreExisting);
                    }
                }
            } finally {
                setLoadingLater(false);
            }
        },
        [
            canLoadEarlier,
            client,
            conferenceId,
            endAtMs,
            events,
            eventsPerPage,
            includeAbstract,
            includeAllSubconferences,
            loadEarlierEvents,
            startAtMs,
            subconferenceId,
        ]
    );

    useEffect(() => {
        if (!canLoadLater || events.length === 0) {
            loadLaterEvents(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startAtMs]);

    const allowLoadLater = useMemo(
        () =>
            endAtMs && events.length > 0
                ? canLoadLater && Date.parse(events[events.length - 1].scheduledStartTime) < endAtMs
                : canLoadLater,
        [endAtMs, events, canLoadLater]
    );

    return (
        <>
            {mightHaveEarlier && canLoadEarlier ? (
                <Button
                    variant="outline"
                    textDecoration="underline"
                    onClick={() => {
                        loadEarlierEvents();
                    }}
                    isLoading={loadingEarlier}
                    w="100%"
                >
                    <FAIcon iconStyle="s" icon="chevron-up" mr={2} />
                    Load earlier sessions
                </Button>
            ) : undefined}
            <ScheduleList events={events} />
            {events.length === 0 && !loadingLater && !loadingEarlier ? <Text>No sessions to display</Text> : undefined}
            {!(mightHaveEarlier && canLoadEarlier) &&
            !(mightHaveEarlier && allowLoadLater) &&
            (loadingLater || loadingEarlier) ? (
                <Spinner />
            ) : undefined}
            {mightHaveLater && allowLoadLater ? (
                <Button
                    variant="outline"
                    textDecoration="underline"
                    onClick={() => {
                        loadLaterEvents();
                    }}
                    isLoading={loadingLater}
                    w="100%"
                >
                    <FAIcon iconStyle="s" icon="chevron-down" mr={2} />
                    Load later sessions
                </Button>
            ) : undefined}
        </>
    );
}

export function ScheduleList({
    events,
    noDayHeadings,
}: {
    events: readonly ScheduleEventFragment[];
    noDayHeadings?: boolean;
}): JSX.Element {
    return (
        <VStack spacing={4} alignItems="stretch" justifyContent="flex-start" maxW="100%">
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

                const card = <SessionCard key={event.id} session={event} />;
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

export function SessionCard({ session }: { session: ScheduleEventFragment }) {
    const { conferencePath } = useAuthParameters();
    const conference = useConference();

    const start = useMemo(() => new Date(session.scheduledStartTime), [session.scheduledStartTime]);
    const end = useMemo(() => new Date(session.scheduledEndTime), [session.scheduledEndTime]);
    const duration = useMemo(() => Math.round((end.getTime() - start.getTime()) / (60 * 1000)), [end, start]);
    const now = useRealTime(60000);
    const isLive = now >= start.getTime() && now <= end.getTime();
    const isStartingSoon = now + 10 * 60 * 1000 >= start.getTime() && now <= end.getTime();

    const history = useHistory();

    const peopleIds = useMemo(() => session.item?.itemPeople.map((x) => x.personId), [session.item?.itemPeople]);
    const [peopleResponse] = useSelectSchedulePeopleQuery({
        variables: {
            ids: peopleIds,
        },
    });

    const tagIds = useMemo(() => session.item?.itemTags.map((x) => x.tagId), [session.item?.itemTags]);
    const [tagsResponse] = useSelectScheduleTagsQuery({
        variables: {
            where: {
                conferenceId: { _eq: session.conferenceId },
                subconferenceId: session.subconferenceId ? { _eq: session.subconferenceId } : { _is_null: true },
            },
        },
    });
    const tags = useMemo(
        () => tagIds?.map((id) => tagsResponse.data?.collection_Tag.find((x) => x.id === id)).filter((x) => !!x) ?? [],
        [tagIds, tagsResponse.data?.collection_Tag]
    );

    const subconference = useMemo(
        () =>
            session.subconferenceId
                ? conference.subconferences.find((x) => x.id === session.subconferenceId)
                : undefined,
        [conference.subconferences, session.subconferenceId]
    );

    return (
        <Card
            minW={["300px", "300px", "30em"]}
            maxW="60em"
            heading={session.item?.title ?? session.name}
            subHeading={
                start.toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                }) +
                " - " +
                end.toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                }) +
                ` (${
                    duration >= 60
                        ? Math.floor(duration / 60).toFixed(0) +
                          " hr" +
                          (duration >= 120 ? "s" : "") +
                          (duration % 60 !== 0 ? " " : "")
                        : ""
                }${duration % 60 !== 0 ? (duration % 60) + " mins" : ""})`
            }
            onKeyUp={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.stopPropagation();
                    history.push(`${conferencePath}/room/${session.roomId}`);
                }
            }}
            onClick={(ev) => {
                ev.stopPropagation();
                if (isLive || isStartingSoon || !session.item?.id) {
                    history.push(`${conferencePath}/room/${session.roomId}`);
                } else {
                    history.push(`${conferencePath}/item/${session.item.id}`);
                }
            }}
            topLeftButton={
                isLive || isStartingSoon
                    ? {
                          colorScheme: "LiveActionButton",
                          iconStyle: "s",
                          label: isLive ? "Live" : "Starts soon",
                          variant: "solid",
                          showLabel: true,
                      }
                    : undefined
            }
            cursor="pointer"
            contentPadding={4}
            tabIndex={0}
            _focus={{
                shadow: defaultOutline_AsBoxShadow,
            }}
            editControls={[
                ...(subconference
                    ? [
                          <Tag key="subconference-tag" borderRadius="full">
                              {subconference.shortName}
                          </Tag>,
                      ]
                    : []),
                <StarEventButton key="star-event-button" eventIds={[session.id]} />,
            ]}
        >
            {session.item?.abstract?.[0]?.data?.length ? (
                <Text noOfLines={3}>
                    {session.item.abstract[0].data[session.item.abstract[0].data.length - 1].data.text}
                </Text>
            ) : undefined}
            {peopleResponse.data?.collection_ProgramPerson.length ? (
                <Wrap>
                    {peopleResponse.data.collection_ProgramPerson.map((person) => (
                        <WrapItem key={person.id}>
                            <Tag colorScheme="blue" variant="subtle" borderRadius="full">
                                {person.name}
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            ) : undefined}
            {tags.length ? (
                <Wrap>
                    {tags.map((tag) => (
                        <WrapItem key={tag!.id}>
                            <Tag variant="subtle" borderRadius="full">
                                {tag!.name}
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            ) : undefined}
        </Card>
    );
}
