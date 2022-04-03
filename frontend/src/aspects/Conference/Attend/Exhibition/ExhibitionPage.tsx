import { chakra, Circle, Divider, Heading, Text, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import type {
    ExhibitionWithContentFragment,
    ItemPresentationFragment,
    ScheduleEventFragment,
} from "../../../../generated/graphql";
import { useSelectExhibitionQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useTitle } from "../../../Hooks/useTitle";
import PageCountText from "../../../Realtime/PageCountText";
import RequireRole from "../../RequireRole";
import { ItemElements } from "../Content/ItemElements";
import { ItemEvents } from "../Content/ItemEvents";
import ExhibitionLayout from "./ExhibitionLayout";

gql`
    fragment ExhibitionItem on content_Item {
        id
        title
        typeName
        elements(
            where: {
                _or: [{ isHidden: { _eq: false } }, { typeName: { _eq: EXTERNAL_EVENT_LINK } }]
                typeName: {
                    _in: [
                        ABSTRACT
                        IMAGE_FILE
                        IMAGE_URL
                        POSTER_FILE
                        POSTER_URL
                        TEXT
                        VIDEO_BROADCAST
                        VIDEO_FILE
                        VIDEO_PREPUBLISH
                        VIDEO_URL
                        EXTERNAL_EVENT_LINK
                    ]
                }
            }
        ) {
            ...ElementData
        }
        events {
            id
            scheduledStartTime
            scheduledEndTime
            roomId
            itemId
        }
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }, order_by: { priority: asc }) {
            ...ProgramPersonData
        }
        itemTags {
            ...ItemTagData
        }
        discussionRoom: room {
            id
            created_at
        }
    }

    fragment ExhibitionWithContent on collection_Exhibition {
        id
        name
        colour
        priority
        conferenceId
        descriptiveItem {
            id
            ...ItemElements_ItemData
            ...ItemPage_ItemRooms
        }
        items {
            id
            itemId
            exhibitionId
            layout
            priority
            item {
                ...ExhibitionItem
            }
        }
    }

    query SelectExhibition($id: uuid!, $includeAbstract: Boolean!, $includeItemEvents: Boolean!) @cached {
        collection_Exhibition_by_pk(id: $id) {
            ...ExhibitionWithContent
        }
        sessions: schedule_Event(where: { exhibitionId: { _eq: $id }, sessionEventId: { _is_null: true } }) {
            ...ScheduleEvent
        }
    }
`;

function ExhibitionPageInner({
    exhibition,
    sessions,
    presentations,
}: {
    exhibition: ExhibitionWithContentFragment;
    sessions: readonly ScheduleEventFragment[];
    presentations: readonly ItemPresentationFragment[];
}): JSX.Element {
    const title = useTitle(exhibition.name);
    const { conferencePath } = useAuthParameters();

    const descriptiveItemDiscussionRoom = useMemo(
        () => exhibition.descriptiveItem?.room,
        [exhibition.descriptiveItem?.room]
    );

    return (
        <VStack spacing={4} alignItems="flex-start" pb={[2, 2, 4]} px={[2, 2, 4]} w="100%">
            {title}
            <Heading as="h1" id="page-heading" pt={2} w="100%" textAlign="left">
                <Circle size="0.7em" bg={exhibition.colour} display="inline-block" verticalAlign="middle" mr="0.4em" />
                <chakra.span verticalAlign="text-bottom" mr="1.1em">
                    {exhibition.name}
                </chakra.span>
                {/*TODO: Link to live event for this exhibition if any.*/}
            </Heading>
            <VStack alignItems="flex-start" w="100%">
                {exhibition.descriptiveItem && exhibition.descriptiveItem.elements.length ? (
                    <ItemElements itemData={exhibition.descriptiveItem} dontFilterOutVideos={true} noHeading={true}>
                        <RequireRole attendeeRole>
                            {descriptiveItemDiscussionRoom ? (
                                <LinkButton
                                    width="100%"
                                    to={`${conferencePath}/room/${descriptiveItemDiscussionRoom.id}`}
                                    size="lg"
                                    colorScheme="PrimaryActionButton"
                                    height="auto"
                                    py={2}
                                    mb={2}
                                    linkProps={{ mr: 2 }}
                                >
                                    <VStack spacing={0}>
                                        <Text>
                                            <FAIcon
                                                iconStyle="s"
                                                icon="video"
                                                mr={2}
                                                fontSize="90%"
                                                verticalAlign="middle"
                                            />{" "}
                                            <chakra.span verticalAlign="middle" pb={0.7}>
                                                Discussion room
                                            </chakra.span>
                                        </Text>
                                        <PageCountText
                                            path={`${conferencePath}/room/${descriptiveItemDiscussionRoom.id}`}
                                        />
                                    </VStack>
                                </LinkButton>
                            ) : undefined}
                        </RequireRole>
                    </ItemElements>
                ) : undefined}
            </VStack>
            <ExhibitionLayout exhibition={exhibition} />
            <Divider pt={6} />
            <Heading as="h2" size="lg" pt={4}>
                Sessions hosting this exhibition
            </Heading>
            <ItemEvents sessions={sessions} presentations={presentations} autoExpandPresentations={false} />
        </VStack>
    );
}

export default function ExhibitionPage({ exhibitionId }: { exhibitionId: string }): JSX.Element {
    const [exhibitionResponse] = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
            includeAbstract: false,
            includeItemEvents: false,
        },
    });

    return (
        <>
            {!exhibitionResponse.data?.collection_Exhibition_by_pk ? (
                exhibitionResponse.fetching || exhibitionResponse.stale ? (
                    <CenteredSpinner spinnerProps={{ label: "Loading exhibition" }} caller="ExhibitionPage:187" />
                ) : (
                    <PageNotFound />
                )
            ) : (
                <ExhibitionPageInner
                    exhibition={exhibitionResponse.data.collection_Exhibition_by_pk}
                    sessions={exhibitionResponse.data?.sessions ?? []}
                    presentations={[]}
                />
            )}
        </>
    );
}
