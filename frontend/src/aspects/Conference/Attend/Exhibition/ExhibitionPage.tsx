import { gql } from "@apollo/client";
import { chakra, Circle, Heading } from "@chakra-ui/react";
import React from "react";
import { ExhibitionWithContentFragment, useSelectExhibitionQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
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
    }
`;

function ExhibitionPageInner({ exhibition }: { exhibition: ExhibitionWithContentFragment }): JSX.Element {
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
        <ExhibitionPageInner exhibition={exhibitionResponse.data.collection_Exhibition_by_pk} />
    ) : (
        <PageNotFound />
    );
}
