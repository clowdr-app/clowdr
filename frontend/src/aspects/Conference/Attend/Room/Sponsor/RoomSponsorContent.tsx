import { gql } from "@apollo/client";
import { Divider, Grid, GridItem, Spinner } from "@chakra-ui/react";
import { ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { isLayoutDataBlob, LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import * as R from "ramda";
import React, { useMemo } from "react";
import {
    RoomSponsorContent_ElementDataFragment,
    useRoomSponsorContent_GetElementsQuery,
} from "../../../../../generated/graphql";
import { Element } from "../../Content/Element/Element";

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
        if (!data?.content_Item.length) {
            return null;
        }

        const item = data.content_Item[0];

        const items: {
            item: RoomSponsorContent_ElementDataFragment;
            blob: ElementDataBlob;
            layoutBlob: LayoutDataBlob;
        }[] = item.elements
            .filter((item) => !item.isHidden)
            .filter((item) => isLayoutDataBlob(item.layoutData))
            .filter((item) => isElementDataBlob(item.data))
            .map((item) => {
                const layoutBlob = item.layoutData as LayoutDataBlob;
                const blob = item.data as ElementDataBlob;
                return { item, layoutBlob, blob };
            });

        const sortedItems = R.sortWith(
            [R.ascend((item) => item.layoutBlob.priority), R.ascend((item) => item.item.name)],
            items
        );

        return sortedItems;
    }, [data?.content_Item]);

    return (
        <>
            <Divider mb={6} />
            {loading ? <Spinner /> : error ? <>An error occurred loading in data.</> : undefined}
            <Grid gridTemplateColumns="50% 50%" ml={0} mr={3} gridColumnGap={5}>
                {elements ? (
                    elements.map((element) =>
                        element.layoutBlob.hidden ? (
                            <></>
                        ) : (
                            <GridItem
                                minW={0}
                                overflowX="auto"
                                key={element.item.id}
                                colSpan={element.layoutBlob.wide ? [2] : [2, 2, 1]}
                                p={4}
                            >
                                <Element item={element.item} />
                            </GridItem>
                        )
                    )
                ) : (
                    <></>
                )}
            </Grid>
        </>
    );
}
