import { chakra, Circle, Heading, Text, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import type { ExhibitionWithContentFragment, ItemEventFragment } from "../../../../generated/graphql";
import { useSelectExhibitionQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useTitle } from "../../../Hooks/useTitle";
import PageCountText from "../../../Realtime/PageCountText";
import RequireRole from "../../RequireRole";
import { EventsTable } from "../Content/EventsTable";
import { ItemElements } from "../Content/ItemElements";
import ExhibitionLayout from "./ExhibitionLayout";

gql`
    fragment ExhibitionItem on content_Item {
        id
        title
        typeName
        elements(
            where: {
                _or: [{ isHidden: { _eq: false } }, { typeName: { _eq: ZOOM } }]
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
                        ZOOM
                    ]
                }
            }
        ) {
            ...ElementData
        }
        events {
            id
            startTime
            endTime
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

    query SelectExhibition($id: uuid!) {
        collection_Exhibition_by_pk(id: $id) {
            ...ExhibitionWithContent
        }
        schedule_Event(where: { exhibitionId: { _eq: $id } }) {
            ...ItemEvent
        }
    }
`;

function ExhibitionPageInner({
    exhibition,
    events,
}: {
    exhibition: ExhibitionWithContentFragment;
    events: readonly ItemEventFragment[];
}): JSX.Element {
    const title = useTitle(exhibition.name);
    const { conferencePath } = useAuthParameters();

    const descriptiveItemDiscussionRoom = useMemo(
        () => exhibition.descriptiveItem?.room,
        [exhibition.descriptiveItem?.room]
    );

    return (
        <VStack spacing={4} alignItems="flex-start" mt={4} w="100%">
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
                {events.length > 0 ? (
                    <>
                        <Text w="auto" textAlign="left" p={0}>
                            <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                            Times are shown in your local timezone.
                        </Text>
                        <EventsTable events={events} includeRoom={true} />
                    </>
                ) : undefined}
            </VStack>
            <ExhibitionLayout exhibition={exhibition} />
        </VStack>
    );
}

export default function ExhibitionPage({ exhibitionId }: { exhibitionId: string }): JSX.Element {
    const [exhibitionResponse] = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
        },
    });

    return exhibitionResponse.fetching && !exhibitionResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading exhibition" }} caller="ExhibitionPage:187" />
    ) : exhibitionResponse.data?.collection_Exhibition_by_pk ? (
        <ExhibitionPageInner
            exhibition={exhibitionResponse.data.collection_Exhibition_by_pk}
            events={exhibitionResponse.data.schedule_Event}
        />
    ) : (
        <PageNotFound />
    );
}
