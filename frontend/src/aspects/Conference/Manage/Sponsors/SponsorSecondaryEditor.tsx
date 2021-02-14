import { gql } from "@apollo/client";
import {
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Text,
} from "@chakra-ui/react";
import React from "react";
import {
    SponsorSecondaryEditor_ContentItemFragment,
    useSponsorSecondaryEditor_GetSponsorContentItemsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import type { SponsorInfoFragment } from "./Types";

gql`
    query SponsorSecondaryEditor_GetSponsorContentItems($contentGroupId: uuid!) {
        ContentItem(where: { contentGroupId: { _eq: $contentGroupId } }) {
            ...SponsorSecondaryEditor_ContentItem
        }
    }

    fragment SponsorSecondaryEditor_ContentItem on ContentItem {
        id
        name
        contentTypeName
        data
        isHidden
        layoutData
        updatedAt
    }
`;

export function SponsorSecondaryEditor({
    sponsors,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    index,
}: {
    sponsors: readonly SponsorInfoFragment[];
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    index: number | null;
}): JSX.Element {
    const contentItemsResult = useSponsorSecondaryEditor_GetSponsorContentItemsQuery({
        variables: {
            contentGroupId: index && sponsors.length > index ? sponsors[index].id : "",
        },
        skip: !index || sponsors.length <= index,
    });

    return (
        <Drawer isOpen={isSecondaryPanelOpen} onClose={onSecondaryPanelClose} size="lg">
            <DrawerOverlay>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Edit</DrawerHeader>
                    <DrawerBody>
                        <ApolloQueryWrapper getter={(result) => result.ContentItem} queryResult={contentItemsResult}>
                            {(contentItems: readonly SponsorSecondaryEditor_ContentItemFragment[]) => (
                                <>
                                    {contentItems.map((contentItem) => (
                                        <Text key={contentItem.id}>{contentItem.name}</Text>
                                    ))}
                                </>
                            )}
                        </ApolloQueryWrapper>
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}
