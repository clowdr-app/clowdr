/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Tag, Text, useDisclosure, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { gql } from "urql";
import type { ScheduleEventFragment } from "../../../../generated/graphql";
import { useSelectSchedulePeopleQuery, useSelectScheduleTagsQuery } from "../../../../generated/graphql";
import Card from "../../../Card";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useConference } from "../../useConference";
import { typeNameToDisplayName } from "../Content/ItemCard";
import PresentationsList from "./PresentationsList";
import StarEventButton from "./StarEventButton";

gql`
    fragment ScheduleTag on collection_Tag {
        id
        name
        colour
        priority
    }

    query SelectScheduleTags($where: collection_Tag_bool_exp!) @cached {
        collection_Tag(where: $where) {
            ...ScheduleTag
        }
    }

    query SelectSchedulePeople($ids: [uuid!]!) @cached {
        collection_ProgramPerson(where: { id: { _in: $ids } }) {
            id
            name
        }
    }
`;

export default function EventCard({
    event,
    includePresentations,
    includeTypeName,
    autoExpandPresentations,
    includeAbstract = false,
    onlyLinkToRoom,
    limitAbstractLengthTo = 3,
}: {
    event: ScheduleEventFragment;
    includePresentations?: boolean;
    includeTypeName?: boolean;
    autoExpandPresentations?: boolean;
    includeAbstract?: boolean;
    onlyLinkToRoom?: boolean;
    limitAbstractLengthTo?: number;
}) {
    const { conferencePath } = useAuthParameters();
    const conference = useConference();

    const start = useMemo(
        () => (event.scheduledStartTime ? new Date(event.scheduledStartTime) : undefined),
        [event.scheduledStartTime]
    );
    const end = useMemo(
        () => (event.scheduledEndTime ? new Date(event.scheduledEndTime) : undefined),
        [event.scheduledEndTime]
    );
    const duration = useMemo(
        () => start && end && Math.round((end.getTime() - start.getTime()) / (60 * 1000)),
        [end, start]
    );
    const now = useRealTime(60000);
    const isLive = start && end && now >= start.getTime() && now <= end.getTime();
    const isStartingSoon = start && end && now + 10 * 60 * 1000 >= start.getTime() && now <= end.getTime();

    const peopleIds = useMemo(() => event.item?.itemPeople.map((x) => x.personId), [event.item?.itemPeople]);
    const [peopleResponse] = useSelectSchedulePeopleQuery({
        variables: {
            ids: peopleIds,
        },
    });

    const tagIds = useMemo(() => event.item?.itemTags.map((x) => x.tagId), [event.item?.itemTags]);
    const [tagsResponse] = useSelectScheduleTagsQuery({
        variables: {
            where: {
                conferenceId: { _eq: event.conferenceId },
                subconferenceId: event.subconferenceId ? { _eq: event.subconferenceId } : { _is_null: true },
            },
        },
    });
    const tags = useMemo(
        () => tagIds?.map((id) => tagsResponse.data?.collection_Tag.find((x) => x.id === id)).filter((x) => !!x) ?? [],
        [tagIds, tagsResponse.data?.collection_Tag]
    );

    const subconference = useMemo(
        () =>
            event.subconferenceId ? conference.subconferences.find((x) => x.id === event.subconferenceId) : undefined,
        [conference.subconferences, event.subconferenceId]
    );

    const presentationsDisclosure = useDisclosure({
        defaultIsOpen: autoExpandPresentations,
    });

    return (
        <>
            <Card
                minW={["300px", "300px", "30em"]}
                maxW="60em"
                heading={event.item?.title ?? event.name}
                subHeading={
                    start && end && duration
                        ? start.toLocaleString(undefined, {
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
                        : undefined
                }
                to={
                    isLive || isStartingSoon || !event.item?.id || onlyLinkToRoom
                        ? `${conferencePath}/room/${event.roomId}`
                        : `${conferencePath}/item/${event.item.id}`
                }
                topLeftButton={
                    isLive || isStartingSoon
                        ? {
                              colorScheme: "LiveActionButton",
                              iconStyle: "s",
                              label: isLive ? "Live" : "Starts soon",
                              variant: "solid",
                              showLabel: true,
                          }
                        : event.item && includeTypeName
                        ? {
                              colorScheme: "blue",
                              iconStyle: "s",
                              label: typeNameToDisplayName(event.item.typeName),
                              variant: "solid",
                              showLabel: true,
                          }
                        : undefined
                }
                contentPadding={4}
                tabIndex={0}
                editControls={[
                    ...(subconference
                        ? [
                              <Tag key="subconference-tag" borderRadius="full">
                                  {subconference.shortName}
                              </Tag>,
                          ]
                        : []),
                    <StarEventButton key="star-event-button" eventIds={[event.id]} />,
                ]}
                bottomButton={
                    includePresentations
                        ? {
                              label: "Presentations",
                              colorScheme: "blue",
                              icon: presentationsDisclosure.isOpen ? "chevron-up" : "chevron-down",
                              iconStyle: "s",
                              onClick: presentationsDisclosure.onToggle,
                              variant: "ghost",
                              showLabel: true,
                          }
                        : undefined
                }
            >
                {event.item?.abstract?.[0]?.data?.length ? (
                    <Text noOfLines={limitAbstractLengthTo === -1 ? undefined : limitAbstractLengthTo}>
                        {event.item.abstract[0].data[event.item.abstract[0].data.length - 1].data.text}
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
            {includePresentations && presentationsDisclosure.isOpen ? (
                <PresentationsList sessionId={event.id} includeAbstract={includeAbstract} />
            ) : undefined}
        </>
    );
}
