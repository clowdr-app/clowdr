import { gql } from "@apollo/client";
import { chakra, Circle, Heading } from "@chakra-ui/react";
import React from "react";
import { HallwayWithContentFragment, useSelectHallwayQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import HallwayLayout from "./HallwayLayout";

gql`
    fragment HallwayContentGroup on ContentGroup {
        id
        title
        contentGroupTypeName
        contentItems(
            where: {
                isHidden: { _eq: false }
                contentTypeName: {
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
            ...ContentItemData
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

    fragment HallwayWithContent on Hallway {
        id
        name
        colour
        priority
        conferenceId
        contentGroups {
            id
            groupId
            hallwayId
            layout
            priority
            contentGroup {
                ...HallwayContentGroup
            }
        }
    }

    query SelectHallway($id: uuid!) {
        Hallway_by_pk(id: $id) {
            ...HallwayWithContent
        }
    }
`;

function HallwayPageInner({ hallway }: { hallway: HallwayWithContentFragment }): JSX.Element {
    const title = useTitle(hallway.name);

    return (
        <>
            {title}
            <Heading as="h1" pt={2}>
                <Circle size="0.7em" bg={hallway.colour} display="inline-block" verticalAlign="middle" mr="0.4em" />
                <chakra.span verticalAlign="text-bottom" mr="1.1em">
                    {hallway.name}
                </chakra.span>
                {/*TODO: Link to live event for this hallway if any.*/}
            </Heading>
            <HallwayLayout hallway={hallway} />
        </>
    );
}

export default function HallwayPage({ hallwayId }: { hallwayId: string }): JSX.Element {
    const hallwayResponse = useSelectHallwayQuery({
        variables: {
            id: hallwayId,
        },
    });

    return hallwayResponse.loading && !hallwayResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading hallway" }} />
    ) : hallwayResponse.data?.Hallway_by_pk ? (
        <HallwayPageInner hallway={hallwayResponse.data.Hallway_by_pk} />
    ) : (
        <PageNotFound />
    );
}
