import { gql } from "@apollo/client";
import { chakra, Circle, Heading, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    ExhibitionWithContentFragment,
    ItemEventFragment,
    Permissions_Permission_Enum,
    useSelectExhibitionQuery,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import { FAIcon } from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
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
                isHidden: { _eq: false }
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
        }
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }, order_by: { priority: asc }) {
            ...ProgramPersonData
        }
        itemTags {
            ...ItemTagData
        }
        discussionRoom: rooms(
            where: { originatingEventId: { _is_null: true } }
            limit: 1
            order_by: { created_at: asc }
        ) {
            id
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
    const conference = useConference();

    const descriptiveItemDiscussionRoom = useMemo(
        () => exhibition.descriptiveItem?.rooms[0],
        [exhibition.descriptiveItem?.rooms]
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
                        <RequireAtLeastOnePermissionWrapper
                            permissions={[Permissions_Permission_Enum.ConferenceViewAttendees]}
                        >
                            {descriptiveItemDiscussionRoom ? (
                                <LinkButton
                                    width="100%"
                                    to={`/conference/${conference.slug}/room/${descriptiveItemDiscussionRoom.id}`}
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
                                            path={`/conference/${conference.slug}/room/${descriptiveItemDiscussionRoom.id}`}
                                        />
                                    </VStack>
                                </LinkButton>
                            ) : undefined}
                        </RequireAtLeastOnePermissionWrapper>
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
    const exhibitionResponse = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
        },
    });

    return exhibitionResponse.loading && !exhibitionResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading exhibition" }} />
    ) : exhibitionResponse.data?.collection_Exhibition_by_pk ? (
        <ExhibitionPageInner
            exhibition={exhibitionResponse.data.collection_Exhibition_by_pk}
            events={exhibitionResponse.data.schedule_Event}
        />
    ) : (
        <PageNotFound />
    );
}
