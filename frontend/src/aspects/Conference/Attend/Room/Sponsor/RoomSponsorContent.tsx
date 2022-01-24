import { gql } from "@apollo/client";
import { Divider, Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useRoomSponsorContent_GetElementsQuery } from "../../../../../generated/graphql";
import ElementsGridLayout from "../../Content/Element/ElementsGridLayout";
import { FormattedMessage } from "react-intl";

gql`
    query RoomSponsorContent_GetElements($itemId: uuid!) {
        content_Item(where: { id: { _eq: $itemId }, typeName: { _eq: SPONSOR } }) {
            ...RoomSponsorContent_ItemData
        }
    }

    fragment RoomSponsorContent_ItemData on content_Item {
        id
        elements {
            ...RoomSponsorContent_ElementData
        }
    }

    fragment RoomSponsorContent_ElementData on content_Element {
        id
        name
        isHidden
        typeName
        data
        layoutData
    }
`;

export function RoomSponsorContent({ itemId }: { itemId: string }): JSX.Element {
    const { data, error, loading } = useRoomSponsorContent_GetElementsQuery({
        variables: {
            itemId,
        },
    });

    const elements = useMemo(() => {
        return data?.content_Item[0]?.elements ?? [];
    }, [data?.content_Item]);

    return (
        <>
            <Divider mb={6} />
            {loading ? <Spinner /> : error ? <>
                <FormattedMessage
                    id="Conference.Attend.Room.Sponsor.RoomSponsorContent.Error"
                    defaultMessage="An error occurred loading in data."
                />
                
            </> : undefined}
            <ElementsGridLayout elements={elements} />
        </>
    );
}
