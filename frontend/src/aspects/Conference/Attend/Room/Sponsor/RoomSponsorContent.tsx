import { gql } from "@apollo/client";
import { Divider, Grid, GridItem, Spinner } from "@chakra-ui/react";
import { ContentItemDataBlob, isContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import { isLayoutDataBlob, LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import * as R from "ramda";
import React, { useMemo } from "react";
import {
    RoomSponsorContent_ContentItemDataFragment,
    useRoomSponsorContent_GetContentItemsQuery,
} from "../../../../../generated/graphql";
import { ContentItem } from "../../Content/Item/ContentItem";

gql`
    query RoomSponsorContent_GetContentItems($contentGroupId: uuid!) {
        ContentGroup(where: { id: { _eq: $contentGroupId }, contentGroupTypeName: { _eq: SPONSOR } }) {
            ...RoomSponsorContent_ContentGroupData
        }
    }

    fragment RoomSponsorContent_ContentGroupData on ContentGroup {
        id
        contentItems {
            ...RoomSponsorContent_ContentItemData
        }
    }

    fragment RoomSponsorContent_ContentItemData on ContentItem {
        id
        name
        isHidden
        contentTypeName
        data
        layoutData
    }
`;

export function RoomSponsorContent({ contentGroupId }: { contentGroupId: string }): JSX.Element {
    const { data, error, loading } = useRoomSponsorContent_GetContentItemsQuery({
        variables: {
            contentGroupId,
        },
    });

    const contentItems = useMemo(() => {
        if (!data?.ContentGroup || data.ContentGroup.length === 0) {
            return null;
        }

        const contentGroup = data.ContentGroup[0];

        const items: {
            item: RoomSponsorContent_ContentItemDataFragment;
            blob: ContentItemDataBlob;
            layoutBlob: LayoutDataBlob;
        }[] = contentGroup.contentItems
            .filter((item) => !item.isHidden)
            .filter((item) => isLayoutDataBlob(item.layoutData))
            .filter((item) => isContentItemDataBlob(item.data))
            .map((item) => {
                const layoutBlob = item.layoutData as LayoutDataBlob;
                const blob = item.data as ContentItemDataBlob;
                return { item, layoutBlob, blob };
            });

        const sortedItems = R.sortWith(
            [R.ascend((item) => item.layoutBlob.priority), R.ascend((item) => item.item.name)],
            items
        );

        return sortedItems;
    }, [data?.ContentGroup]);

    return (
        <>
            <Divider mb={6} />
            {loading ? <Spinner /> : error ? <>An error occurred loading in data.</> : undefined}
            <Grid gridTemplateColumns="50% 50%" ml={5} gridColumnGap={5}>
                {contentItems ? (
                    contentItems.map((contentItem) =>
                        contentItem.layoutBlob.hidden ? (
                            <></>
                        ) : (
                            <GridItem
                                minW={0}
                                overflowX="auto"
                                key={contentItem.item.id}
                                colSpan={contentItem.layoutBlob.wide ? [1, 1, 2] : [1]}
                                p={4}
                            >
                                <ContentItem blob={contentItem.blob} />
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
