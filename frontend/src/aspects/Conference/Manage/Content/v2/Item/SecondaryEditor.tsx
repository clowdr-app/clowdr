import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Button,
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    HStack,
    Text,
    useClipboard,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import type {
    ManageContent_ElementFragment,
    ManageContent_ItemSecondaryFragment,
} from "../../../../../../generated/graphql";
import { Content_ItemType_Enum, useManageContent_SelectItemQuery } from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../../GQL/AuthParameters";
import { makeContext } from "../../../../../GQL/make-context";
import QueryWrapper from "../../../../../GQL/QueryWrapper";
import { EditElements } from "../Element/EditElements";
import { AddContentMenu } from "./AddContentMenu";
import { CreateRoomButton } from "./CreateRoomButton";

export function SecondaryEditor({
    itemId,
    itemTitle,
    itemType,
    isOpen,
    onClose,
    openSendSubmissionRequests,
}: {
    itemId: string | null;
    itemTitle: string | null;
    itemType: Content_ItemType_Enum;
    isOpen: boolean;
    onClose: () => void;
    openSendSubmissionRequests: (itemId: string, personIds: string[]) => void;
}): JSX.Element {
    const { onCopy: onCopyItemId, hasCopied: hasCopiedItemId } = useClipboard(itemId ?? "");

    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader pb={1} pr="3em">
                        <Text fontSize="lg" overflow="wrap">
                            Edit: {itemTitle}
                        </Text>
                        <Text fontSize="xs" mt={2}>
                            Id: <Code fontSize="xs">{itemId}</Code>
                            <Button
                                onClick={onCopyItemId}
                                size="xs"
                                ml="auto"
                                variant="ghost"
                                p={0}
                                h="auto"
                                minH={0}
                                aria-label="Copy item id"
                            >
                                <FAIcon
                                    iconStyle="s"
                                    icon={hasCopiedItemId ? "check-circle" : "clipboard"}
                                    m={0}
                                    p={0}
                                />
                            </Button>
                        </Text>
                    </DrawerHeader>
                    <DrawerCloseButton />

                    <DrawerBody>
                        {itemId && (
                            <SecondaryEditorInner
                                itemId={itemId}
                                itemType={itemType}
                                openSendSubmissionRequests={openSendSubmissionRequests}
                            />
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}

function SecondaryEditorInner({
    itemId,
    itemType,
    openSendSubmissionRequests,
}: {
    itemId: string;
    itemType: Content_ItemType_Enum;
    openSendSubmissionRequests: (itemId: string, personIds: string[]) => void;
}): JSX.Element {
    const { conferencePath, subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext(
                {
                    [AuthHeader.Role]: subconferenceId
                        ? HasuraRoleName.SubconferenceOrganizer
                        : HasuraRoleName.ConferenceOrganizer,
                },
                ["content_Element", "room_Room"]
            ),
        [subconferenceId]
    );
    const [itemResponse, refetchItem] = useManageContent_SelectItemQuery({
        variables: {
            itemId,
        },
        context,
    });

    return (
        <VStack w="100%" alignItems="flex-start">
            <HStack flexWrap="wrap" justifyContent="flex-start" w="100%" gridRowGap={2}>
                <LinkButton
                    size="sm"
                    to={`${conferencePath}/item/${itemId}`}
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
                        {itemResponse.data.content_Item_by_pk.room ? (
                            <LinkButton
                                size="sm"
                                to={`${conferencePath}/room/${itemResponse.data.content_Item_by_pk.room.id}`}
                                isExternal
                                aria-label={
                                    itemResponse.data.content_Item_by_pk.typeName === Content_ItemType_Enum.Sponsor
                                        ? "View booth"
                                        : "View discussion room"
                                }
                                title={
                                    itemResponse.data.content_Item_by_pk.typeName === Content_ItemType_Enum.Sponsor
                                        ? "View booth"
                                        : "View discussion room"
                                }
                            >
                                <FAIcon iconStyle="s" icon="link" mr={2} />
                                {itemResponse.data.content_Item_by_pk.typeName === Content_ItemType_Enum.Sponsor
                                    ? "View booth"
                                    : "View discussion room"}
                                &nbsp;
                                <ExternalLinkIcon />
                            </LinkButton>
                        ) : (
                            <CreateRoomButton
                                size="sm"
                                itemId={itemId}
                                refetch={() => refetchItem()}
                                buttonText={
                                    itemResponse.data.content_Item_by_pk.typeName === Content_ItemType_Enum.Sponsor
                                        ? "Create booth"
                                        : undefined
                                }
                            />
                        )}
                    </>
                ) : undefined}
            </HStack>
            <QueryWrapper
                getter={(result) => ({
                    rooms: [],
                    ...result.content_Item_by_pk,
                    elements: result.content_Element,
                })}
                queryResult={itemResponse}
            >
                {(
                    result: Partial<ManageContent_ItemSecondaryFragment> & {
                        elements: readonly ManageContent_ElementFragment[];
                    }
                ) => (
                    <EditElements
                        itemId={itemId}
                        itemType={itemType}
                        openSendSubmissionRequests={openSendSubmissionRequests}
                        {...result}
                    />
                )}
            </QueryWrapper>
            {itemResponse.data?.content_Item_by_pk ? (
                <AddContentMenu
                    itemId={itemId}
                    onCreate={() => {
                        refetchItem();
                    }}
                />
            ) : undefined}
        </VStack>
    );
}
