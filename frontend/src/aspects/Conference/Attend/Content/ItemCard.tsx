/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Tag, Text, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ScheduleItemFragment } from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    useSelectSchedulePeopleQuery,
    useSelectScheduleTagsQuery,
} from "../../../../generated/graphql";
import Card from "../../../Card";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useConference } from "../../useConference";

export default function ItemCard({ item }: { item: ScheduleItemFragment }) {
    const { conferencePath } = useAuthParameters();
    const conference = useConference();

    const peopleIds = useMemo(() => item.itemPeople.map((x) => x.personId), [item.itemPeople]);
    const [peopleResponse] = useSelectSchedulePeopleQuery({
        variables: {
            ids: peopleIds,
        },
    });

    const tagIds = useMemo(() => item.itemTags.map((x) => x.tagId), [item.itemTags]);
    const [tagsResponse] = useSelectScheduleTagsQuery({
        variables: {
            where: {
                conferenceId: { _eq: item.conferenceId },
                subconferenceId: item.subconferenceId ? { _eq: item.subconferenceId } : { _is_null: true },
            },
        },
    });
    const tags = useMemo(
        () => tagIds?.map((id) => tagsResponse.data?.collection_Tag.find((x) => x.id === id)).filter((x) => !!x) ?? [],
        [tagIds, tagsResponse.data?.collection_Tag]
    );

    const subconference = useMemo(
        () => (item.subconferenceId ? conference.subconferences.find((x) => x.id === item.subconferenceId) : undefined),
        [conference.subconferences, item.subconferenceId]
    );

    const sessionTitle = useMemo(() => {
        if (item.events?.length === 1) {
            const event0 = item.events[0];
            if (event0.session) {
                return event0.session.item?.title ?? event0.session.name;
            }
        }
        return undefined;
    }, [item.events]);

    return (
        <Card
            m={[2, 2, 4]}
            maxW="30em"
            minW={["250px", "250px", "30em"]}
            heading={item.title}
            subHeading={sessionTitle}
            to={`${conferencePath}/item/${item.id}`}
            topLeftButton={{
                colorScheme: "PrimaryActionButton",
                iconStyle: "s",
                label: typeNameToDisplayName(item.typeName),
                variant: "solid",
                showLabel: true,
            }}
            contentPadding={4}
            tabIndex={0}
            editControls={
                subconference
                    ? [
                          <Tag key="subconference-tag" borderRadius="full">
                              {subconference.shortName}
                          </Tag>,
                      ]
                    : []
            }
        >
            {item.abstract?.[0]?.data?.length ? (
                <Text noOfLines={3}>{item.abstract[0].data[item.abstract[0].data.length - 1].data.text}</Text>
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

function typeNameToDisplayName(typeName: Content_ItemType_Enum): string {
    switch (typeName) {
        case Content_ItemType_Enum.Demonstration:
            return "Demonstration";
        case Content_ItemType_Enum.Keynote:
            return "Keynote";
        case Content_ItemType_Enum.LandingPage:
            return "LandingPage";
        case Content_ItemType_Enum.Other:
            return "Other";
        case Content_ItemType_Enum.Paper:
            return "Paper";
        case Content_ItemType_Enum.Poster:
            return "Poster";
        case Content_ItemType_Enum.Presentation:
            return "Presentation";
        case Content_ItemType_Enum.Session:
            return "Session";
        case Content_ItemType_Enum.SessionQAndA:
            return "Session Q&A";
        case Content_ItemType_Enum.Social:
            return "Social";
        case Content_ItemType_Enum.Sponsor:
            return "Sponsor";
        case Content_ItemType_Enum.SwagBag:
            return "SwagBag";
        case Content_ItemType_Enum.Symposium:
            return "Symposium";
        case Content_ItemType_Enum.Tutorial:
            return "Tutorial";
        case Content_ItemType_Enum.Workshop:
            return "Workshop";
    }
}
