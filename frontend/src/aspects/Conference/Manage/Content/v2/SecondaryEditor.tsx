import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    HStack,
    Menu,
    Text,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ItemSecondaryFragment,
    useManageContent_SelectItemQuery,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import { AddContentMenu } from "./AddContentMenu";
import { Elements } from "./EditElement";

export function SecondaryEditor({
    itemId,
    itemTitle,
    isOpen,
    onClose,
}: {
    itemId: string | null;
    itemTitle: string | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader pb={0} pr="3em">
                        <Text fontSize="lg" overflow="wrap">
                            Edit item: {itemTitle}
                        </Text>
                        <Code fontSize="xs">{itemId}</Code>
                    </DrawerHeader>
                    <DrawerCloseButton />

                    <DrawerBody>{itemId && <SecondaryEditorInner itemId={itemId} />}</DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}

function SecondaryEditorInner({ itemId }: { itemId: string }): JSX.Element {
    const conference = useConference();
    const itemResponse = useManageContent_SelectItemQuery({
        variables: {
            itemId,
        },
        fetchPolicy: "network-only",
    });

    return (
        <VStack w="100%" alignItems="flex-start">
            <HStack flexWrap="wrap" justifyContent="flex-start" w="100%" gridRowGap={2}>
                <LinkButton
                    size="sm"
                    to={`/conference/${conference.slug}/item/${itemId}`}
                    isExternal
                    aria-label="View item"
                    title="View item"
                >
                    <FAIcon iconStyle="s" icon="link" mr={2} />
                    View item&nbsp;
                    <ExternalLinkIcon />
                </LinkButton>
                {itemResponse.data?.content_Item_by_pk ? (
                    <>
                        {itemResponse.data.content_Item_by_pk.rooms.length === 1 ? (
                            <LinkButton
                                size="sm"
                                to={`/conference/${conference.slug}/room/${itemResponse.data.content_Item_by_pk.rooms[0].id}`}
                                isExternal
                                aria-label="View discussion room"
                                title="View discussion room"
                            >
                                <FAIcon iconStyle="s" icon="link" mr={2} />
                                View discussion room&nbsp;
                                <ExternalLinkIcon />
                            </LinkButton>
                        ) : itemResponse.data.content_Item_by_pk.rooms.length > 1 ? (
                            <Menu>TODO</Menu>
                        ) : undefined}
                        <AddContentMenu
                            itemId={itemId}
                            roomId={itemResponse.data.content_Item_by_pk.rooms[0]?.id ?? null}
                            refetch={async () => {
                                await itemResponse.refetch();
                            }}
                        />
                    </>
                ) : undefined}
            </HStack>
            <ApolloQueryWrapper
                getter={(result) => ({ rooms: [], ...result.content_Item_by_pk, elements: result.content_Element })}
                queryResult={itemResponse}
            >
                {(
                    result: ManageContent_ItemSecondaryFragment & {
                        elements: readonly ManageContent_ElementFragment[];
                    }
                ) => <Elements itemId={itemId} {...result} />}
            </ApolloQueryWrapper>
        </VStack>
    );
}
