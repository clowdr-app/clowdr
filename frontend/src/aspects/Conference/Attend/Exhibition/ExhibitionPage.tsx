import { gql } from "@apollo/client";
import { chakra, Circle, Heading, Text, VStack } from "@chakra-ui/react";
import React from "react";
import {
    ExhibitionWithContentFragment,
    ItemEventFragment,
    useSelectExhibitionQuery,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import PageNotFound from "../../../Errors/PageNotFound";
import { FAIcon } from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import { Element } from "../Content/Element/Element";
import { EventsTable } from "../Content/EventsTable";
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
        itemPeople(order_by: { priority: asc }) {
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
            elements(where: { isHidden: { _eq: false }, typeName: { _in: [ABSTRACT, TEXT] } }) {
                ...ElementData
            }
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

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" pt={2}>
                <Circle size="0.7em" bg={exhibition.colour} display="inline-block" verticalAlign="middle" mr="0.4em" />
                <chakra.span verticalAlign="text-bottom" mr="1.1em">
                    {exhibition.name}
                </chakra.span>
                {/*TODO: Link to live event for this exhibition if any.*/}
            </Heading>
            <VStack>
                {exhibition.descriptiveItem && exhibition.descriptiveItem.elements.length
                    ? exhibition.descriptiveItem.elements.map((element) => (
                          <Element key={element.id} element={element} />
                      ))
                    : undefined}
                <Text w="auto" textAlign="left" p={0}>
                    <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                    Times are shown in your local timezone.
                </Text>
                <EventsTable events={events} includeRoom={true} />
            </VStack>
            <ExhibitionLayout exhibition={exhibition} />
        </>
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
