import { Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useRoomSponsorContent_GetElementsQuery } from "../../../../../generated/graphql";
import ElementsGridLayout from "../../Content/Element/ElementsGridLayout";

gql`
    query RoomSponsorContent_GetElements($itemId: uuid!) {
        content_Item(where: { id: { _eq: $itemId }, typeName: { _eq: SPONSOR } }) {
            ...RoomSponsorContent_ItemData
        }
    }

    fragment RoomSponsorContent_ItemData on content_Item {
        id
        typeName
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
        itemId
    }
`;

export function RoomSponsorContent({ itemId }: { itemId: string }): JSX.Element {
    const [{ data, error, fetching: loading }] = useRoomSponsorContent_GetElementsQuery({
        variables: {
            itemId,
        },
    });

    const elements = useMemo(() => {
        return data?.content_Item[0]?.elements ?? [];
    }, [data?.content_Item]);

    return (
        <>
            {loading ? <Spinner /> : error ? <>An error occurred loading in data.</> : undefined}
            <ElementsGridLayout elements={elements} />
        </>
    );
}
