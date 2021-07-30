import { ChevronDownIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Button,
    ButtonGroup,
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    HStack,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
    useClipboard,
    VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import {
    Content_ItemType_Enum,
    ManageContent_ElementFragment,
    ManageContent_ItemSecondaryFragment,
    useManageContent_SelectItemQuery,
} from "../../../../../../generated/graphql";
import { LinkButton } from "../../../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { useConference } from "../../../../useConference";
import { EditElements } from "../Element/EditElements";
import { AddContentMenu } from "./AddContentMenu";
import { CreateRoomButton } from "./CreateRoomButton";

export function SecondaryEditor({
    itemId,
    itemTitle,
    isOpen,
    onClose,
    isSponsor,
    openSendSubmissionRequests,
}: {
    itemId: string | null;
    itemTitle: string | null;
    isOpen: boolean;
    onClose: () => void;
    isSponsor: boolean;
    openSendSubmissionRequests: (itemId: string, uploaderIds: string[]) => void;
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
                                isSponsor={isSponsor}
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
    isSponsor,
    openSendSubmissionRequests,
}: {
    itemId: string;
    isSponsor: boolean;
    openSendSubmissionRequests: (itemId: string, uploaderIds: string[]) => void;
}): JSX.Element {
    const conference = useConference();
    const itemResponse = useManageContent_SelectItemQuery({
        variables: {
            itemId,
        },
        fetchPolicy: "network-only",
    });
    const [defaultOpenSecurityForId, setDefaultOpenSecurityForId] = useState<string | null>(null);

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
                        ) : itemResponse.data.content_Item_by_pk.rooms.length >= 1 ? (
                            <Menu size="sm">
                                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                                    View discussion rooms
                                </MenuButton>
                                <MenuList>
                                    {itemResponse.data.content_Item_by_pk.rooms.map((room, idx) => (
                                        <MenuItem key={room.id}>
                                            <Link
                                                size="sm"
                                                href={`/conference/${conference.slug}/room/${room.id}`}
                                                isExternal
                                                aria-label="View discussion room"
                                                title="View discussion room"
                                                textDecoration="none"
                                            >
                                                {idx}. {room.name}
                                                &nbsp;
                                                <ExternalLinkIcon />
                                            </Link>
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        ) : (
                            <CreateRoomButton
                                size="sm"
                                itemId={itemId}
                                refetch={() => itemResponse.refetch()}
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
            <ApolloQueryWrapper
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
                        refetchElements={() => {
                            itemResponse.refetch();
                        }}
                        defaultOpenSecurityForId={defaultOpenSecurityForId ?? undefined}
                        isSponsor={isSponsor}
                        openSendSubmissionRequests={openSendSubmissionRequests}
                        {...result}
                    />
                )}
            </ApolloQueryWrapper>
            {itemResponse.data?.content_Item_by_pk ? (
                <ButtonGroup>
                    <AddContentMenu
                        itemId={itemId}
                        onCreate={(newId) => {
                            setDefaultOpenSecurityForId(newId);
                            itemResponse.refetch();
                        }}
                    />
                </ButtonGroup>
            ) : undefined}
        </VStack>
    );
}
