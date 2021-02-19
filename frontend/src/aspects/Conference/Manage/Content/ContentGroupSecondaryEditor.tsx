import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    ButtonGroup,
    Code,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Switch,
    Text,
    useToast,
} from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { ContentType_Enum, useContentGroup_CreateRoomMutation } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import type { SecondaryEditorComponents, SecondaryEditorFooterButton } from "../../../CRUDTable/CRUDTable";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import {
    GroupHallwaysEditorModal,
    GroupPeopleEditorModal,
    RequiredItemEditorModal,
} from "../ManageConferenceContentPage";
import type { OriginatingDataDescriptor } from "../Shared/Types";
import { GroupTemplates, ItemBaseTemplates } from "./Templates";
import type { ContentDescriptor, ContentGroupDescriptor, ContentPersonDescriptor, HallwayDescriptor } from "./Types";

gql`
    mutation ContentGroup_CreateRoom($conferenceId: uuid!, $contentGroupId: uuid!) {
        createContentGroupRoom(conferenceId: $conferenceId, contentGroupId: $contentGroupId) {
            roomId
            message
        }
    }
`;

function CreateRoomButton({ group }: { group: ContentGroupDescriptor | undefined }) {
    const conference = useConference();
    const toast = useToast();
    const history = useHistory();
    const [createBreakoutMutation] = useContentGroup_CreateRoomMutation();
    const [creatingBreakout, setCreatingBreakout] = useState<boolean>(false);
    const createBreakout = useCallback(async () => {
        if (!group?.id) {
            return;
        }

        try {
            setCreatingBreakout(true);
            const { data } = await createBreakoutMutation({
                variables: {
                    conferenceId: conference.id,
                    contentGroupId: group.id,
                },
            });

            if (!data?.createContentGroupRoom || !data.createContentGroupRoom.roomId) {
                throw new Error(`No data returned: ${data?.createContentGroupRoom?.message}`);
            }

            const roomId = data.createContentGroupRoom.roomId;

            // Wait so that breakout session has a chance to be created
            setTimeout(() => history.push(`/conference/${conference.slug}/room/${roomId}`), 2000);
        } catch (e) {
            toast({
                status: "error",
                title: "Failed to create room.",
                description: e?.message,
            });
            setCreatingBreakout(false);
        }
    }, [conference.id, conference.slug, createBreakoutMutation, group?.id, history, toast]);

    return (
        <Button isLoading={creatingBreakout} onClick={createBreakout}>
            Create discussion room
        </Button>
    );
}

export function ContentGroupSecondaryEditor(
    allGroupsMap: Map<string, ContentGroupDescriptor>,
    allPeopleMap: Map<string, ContentPersonDescriptor>,
    allOriginatingDatasMap: Map<string, OriginatingDataDescriptor>,
    allHallwaysMap: Map<string, HallwayDescriptor>,
    key: string,
    markDirty: () => void,
    setAllContentGroupsMap: React.Dispatch<React.SetStateAction<Map<string, ContentGroupDescriptor> | undefined>>,
    isDirty: boolean,
    conferenceSlug: string,
    onCombineVideosOpen: () => void,
    combineVideosModal: (key: string) => JSX.Element
): SecondaryEditorComponents {
    const group = allGroupsMap.get(key);

    let editorElement: JSX.Element;
    const footerButtons: SecondaryEditorFooterButton[] = [];

    const contentTypeOptions: { label: string; value: ContentType_Enum }[] = (() => {
        return Object.keys(ContentType_Enum)
            .filter(
                (key) =>
                    typeof (ContentType_Enum as any)[key] === "string" &&
                    ItemBaseTemplates[ItemBaseTypes[(ContentType_Enum as any)[key] as ContentType_Enum]].supported
            )
            .map((key) => {
                const v = (ContentType_Enum as any)[key] as string;
                return {
                    label: v
                        .split("_")
                        .map((x) => x[0] + x.substr(1).toLowerCase())
                        .reduce((acc, x) => `${acc} ${x}`),
                    value: v as ContentType_Enum,
                };
            });
    })();

    // TODO: Configure / Edit tabs
    if (group) {
        const addContentMenu = (
            <>
                <Menu size="sm">
                    <MenuButton size="sm" my={0} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                        Add content
                    </MenuButton>
                    <MenuList maxH="20vh" overflowY="auto">
                        {contentTypeOptions.map((typeOpt) => (
                            <MenuItem
                                key={typeOpt.value}
                                onClick={() => {
                                    markDirty();

                                    setAllContentGroupsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        const template = ItemBaseTemplates[ItemBaseTypes[typeOpt.value]];
                                        assert(template.supported);
                                        const newContent = template.createDefault(typeOpt.value, false);
                                        assert(newContent.type === "item-only");
                                        newGroups.set(group.id, {
                                            ...existingGroup,
                                            items: [...existingGroup.items, newContent.item],
                                        });

                                        return newGroups;
                                    });
                                }}
                            >
                                {typeOpt.label}
                            </MenuItem>
                        ))}
                        <MenuItem key="combine-videos" onClick={() => onCombineVideosOpen()}>
                            Combine videos
                        </MenuItem>
                    </MenuList>
                </Menu>
                <Menu size="sm">
                    <MenuButton size="sm" my={0} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                        Add uploadable
                    </MenuButton>
                    <MenuList maxH="20vh" overflowY="auto">
                        {contentTypeOptions.map((typeOpt) => (
                            <MenuItem
                                key={typeOpt.value}
                                onClick={() => {
                                    markDirty();

                                    setAllContentGroupsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        const template = ItemBaseTemplates[ItemBaseTypes[typeOpt.value]];
                                        assert(template.supported);
                                        const newContent = template.createDefault(typeOpt.value, true);
                                        if (newContent.type === "required-only") {
                                            newGroups.set(group.id, {
                                                ...existingGroup,
                                                requiredItems: [
                                                    ...existingGroup.requiredItems,
                                                    newContent.requiredItem,
                                                ],
                                            });
                                        } else if (newContent.type === "required-and-item") {
                                            newGroups.set(group.id, {
                                                ...existingGroup,
                                                items: [...existingGroup.items, newContent.item],
                                                requiredItems: [
                                                    ...existingGroup.requiredItems,
                                                    newContent.requiredItem,
                                                ],
                                            });
                                        }

                                        return newGroups;
                                    });
                                }}
                            >
                                {typeOpt.label}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </>
        );
        const menu = (
            <ButtonGroup flexWrap="wrap" size="sm" mb={2}>
                <LinkButton
                    size="sm"
                    to={`/conference/${conferenceSlug}/item/${group.id}`}
                    colorScheme="green"
                    isExternal={true}
                    aria-label={`View ${group.title} in the attendee view`}
                    title={`View ${group.title} in the attendee view`}
                    linkProps={{
                        flex: "0 0 auto",
                    }}
                >
                    <FAIcon icon="link" iconStyle="s" mr={3} />
                    View item
                </LinkButton>
                {group.rooms.length === 0 ? (
                    <CreateRoomButton group={group} />
                ) : (
                    <LinkButton
                        size="sm"
                        to={`/conference/${conferenceSlug}/room/${group.rooms[0].id}`}
                        colorScheme="green"
                        isExternal={true}
                        aria-label={"View discussion room in the attendee view"}
                        title={"View discussion room in the attendee view"}
                        linkProps={{
                            flex: "0 0 auto",
                        }}
                    >
                        <FAIcon icon="link" iconStyle="s" mr={3} />
                        View discussion room
                    </LinkButton>
                )}
                {addContentMenu}
            </ButtonGroup>
        );

        const groupTemplate = GroupTemplates[group.typeName];
        if (groupTemplate.supported) {
            const itemElements: JSX.Element[] = [];

            itemElements.push(
                <AccordionItem key="people">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            People
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <GroupPeopleEditorModal
                            group={group}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            peopleMap={allPeopleMap}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

            itemElements.push(
                <AccordionItem key="hallways">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Hallways
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <GroupHallwaysEditorModal
                            group={group}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            hallwaysMap={allHallwaysMap}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

            for (const item of group.items
                .sort((x, y) => x.name.localeCompare(y.name))
                .sort((x, y) => x.typeName.localeCompare(y.typeName))) {
                if (!item.requiredContentId) {
                    const itemType = item.typeName;
                    const baseType = ItemBaseTypes[itemType];
                    const itemTemplate = ItemBaseTemplates[baseType];
                    let accordianTitle: string | JSX.Element = `TODO: Unsupported item type ${itemType}`;
                    let accordianContents: JSX.Element | undefined;

                    if (itemTemplate.supported) {
                        const itemDesc: ContentDescriptor | null = item
                            ? {
                                  type: "item-only",
                                  item,
                              }
                            : null;
                        if (!itemDesc) {
                            throw new Error(
                                `Item ${itemType} does not exist for the group ${group.id} following template ${group.typeName}!`
                            );
                        }

                        if (!item) {
                            setTimeout(() => {
                                markDirty();
                                setAllContentGroupsMap((oldGroups) => {
                                    assert(oldGroups);
                                    const newGroups = new Map(oldGroups);

                                    const existingGroup = newGroups.get(group.id);
                                    assert(existingGroup);
                                    if (existingGroup.items.some((x) => x.id === itemDesc.item.id)) {
                                        return oldGroups;
                                    }
                                    newGroups.set(group.id, {
                                        ...existingGroup,
                                        items: [...existingGroup.items, itemDesc.item],
                                    });

                                    return newGroups;
                                });
                            }, 0);
                        }

                        accordianTitle = itemTemplate.renderEditorHeading(itemDesc);
                        accordianContents = (
                            <itemTemplate.renderEditor
                                data={itemDesc}
                                update={(updatedDesc) => {
                                    markDirty();

                                    assert(updatedDesc.type === "item-only");

                                    setAllContentGroupsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        newGroups.set(group.id, {
                                            ...existingGroup,
                                            items: existingGroup.items.map((cItem) => {
                                                return itemDesc.item.id === cItem.id ? updatedDesc.item : cItem;
                                            }),
                                        });

                                        return newGroups;
                                    });
                                }}
                            />
                        );
                    }

                    itemElements.push(
                        <AccordionItem key={`row-${item.id}`}>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    {accordianTitle}
                                </Box>
                                {accordianContents && <AccordionIcon />}
                            </AccordionButton>
                            {accordianContents && (
                                <AccordionPanel pb={4}>
                                    <HStack pb={4}>
                                        <FormControl
                                            display="flex"
                                            flexDir="row"
                                            alignItems="flex-start"
                                            justifyContent="flex-start"
                                        >
                                            <FormLabel m={0} p={0} fontSize="0.9em">
                                                Hidden?
                                            </FormLabel>
                                            <Switch
                                                m={0}
                                                ml={2}
                                                p={0}
                                                lineHeight="1em"
                                                size="sm"
                                                isChecked={item.isHidden}
                                                onChange={() => {
                                                    markDirty();

                                                    setAllContentGroupsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            items: existingGroup.items.map((cItem) => {
                                                                return item.id === cItem.id
                                                                    ? { ...cItem, isHidden: !cItem.isHidden }
                                                                    : cItem;
                                                            }),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                            <FormHelperText m={0} ml={2} p={0}>
                                                Enable to hide this content from attendees.
                                            </FormHelperText>
                                        </FormControl>
                                        <Box ml="auto">
                                            <IconButton
                                                colorScheme="red"
                                                size="sm"
                                                aria-label="Delete content"
                                                icon={<FAIcon iconStyle="s" icon="trash-alt" />}
                                                onClick={() => {
                                                    markDirty();

                                                    setAllContentGroupsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            items: existingGroup.items.filter((cItem) => {
                                                                return item.id !== cItem.id;
                                                            }),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                        </Box>
                                    </HStack>
                                    {accordianContents}
                                </AccordionPanel>
                            )}
                        </AccordionItem>
                    );
                }
            }

            for (const requiredItem of group.requiredItems
                .sort((x, y) => x.name.localeCompare(y.name))
                .sort((x, y) => x.typeName.localeCompare(y.typeName))) {
                const itemType = requiredItem.typeName;
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                let accordianTitle: string | JSX.Element = `TODO: Unsupported required item type ${itemType}`;
                let accordianContents: JSX.Element | undefined;

                const item =
                    requiredItem &&
                    group.items.find((x) => x.typeName === itemType && x.requiredContentId === requiredItem.id);

                if (itemTemplate.supported) {
                    const itemDesc: ContentDescriptor | null =
                        requiredItem && item
                            ? {
                                  type: "required-and-item",
                                  item,
                                  requiredItem,
                              }
                            : requiredItem
                            ? {
                                  type: "required-only",
                                  requiredItem,
                              }
                            : null;
                    if (!itemDesc) {
                        throw new Error(
                            `Required item ${itemType} does not exist for the group ${group.id} following template ${group.typeName}!`
                        );
                    }

                    accordianTitle = itemTemplate.renderEditorHeading(itemDesc);

                    accordianContents = (
                        <RequiredItemEditorModal
                            group={group}
                            itemTemplate={itemTemplate}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                            itemDesc={itemDesc}
                        />
                    );
                }

                itemElements.push(
                    <AccordionItem key={`row-${item?.id ?? requiredItem.id}`}>
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                                (Uploadable) {accordianTitle}
                            </Box>
                            {accordianContents && <AccordionIcon />}
                        </AccordionButton>
                        {accordianContents && (
                            <AccordionPanel pb={4}>
                                <HStack pb={4} justifyContent="flex-end">
                                    {item ? (
                                        <FormControl
                                            display="flex"
                                            flexDir="row"
                                            alignItems="flex-start"
                                            justifyContent="flex-start"
                                        >
                                            <FormLabel m={0} p={0} fontSize="0.9em">
                                                Hidden?
                                            </FormLabel>
                                            <Switch
                                                m={0}
                                                ml={2}
                                                p={0}
                                                lineHeight="1em"
                                                size="sm"
                                                isChecked={item.isHidden}
                                                onChange={() => {
                                                    markDirty();

                                                    setAllContentGroupsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            items: existingGroup.items.map((cItem) => {
                                                                return item.id === cItem.id
                                                                    ? { ...cItem, isHidden: !cItem.isHidden }
                                                                    : cItem;
                                                            }),
                                                            requiredItems: existingGroup.requiredItems.map((cItem) => {
                                                                return requiredItem.id === cItem.id
                                                                    ? { ...cItem, isHidden: !cItem.isHidden }
                                                                    : cItem;
                                                            }),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                            <FormHelperText m={0} ml={2} p={0}>
                                                Enable to hide this content from attendees.
                                            </FormHelperText>
                                        </FormControl>
                                    ) : (
                                        <FormControl
                                            display="flex"
                                            flexDir="row"
                                            alignItems="flex-start"
                                            justifyContent="flex-start"
                                        >
                                            <FormLabel m={0} p={0} fontSize="0.9em">
                                                Hidden?
                                            </FormLabel>
                                            <Switch
                                                m={0}
                                                ml={2}
                                                p={0}
                                                lineHeight="1em"
                                                size="sm"
                                                isChecked={requiredItem.isHidden}
                                                onChange={() => {
                                                    markDirty();

                                                    setAllContentGroupsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            requiredItems: existingGroup.requiredItems.map((cItem) => {
                                                                return requiredItem.id === cItem.id
                                                                    ? { ...cItem, isHidden: !cItem.isHidden }
                                                                    : cItem;
                                                            }),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                            <FormHelperText m={0} ml={2} p={0}>
                                                Enable to hide this content from attendees.
                                            </FormHelperText>
                                        </FormControl>
                                    )}
                                    <Box>
                                        <IconButton
                                            colorScheme="red"
                                            size="sm"
                                            aria-label="Delete content"
                                            icon={<FAIcon iconStyle="s" icon="trash-alt" />}
                                            onClick={() => {
                                                markDirty();

                                                setAllContentGroupsMap((oldGroups) => {
                                                    assert(oldGroups);
                                                    const newGroups = new Map(oldGroups);

                                                    const existingGroup = newGroups.get(group.id);
                                                    assert(existingGroup);
                                                    newGroups.set(group.id, {
                                                        ...existingGroup,
                                                        requiredItems: existingGroup.requiredItems.filter((cItem) => {
                                                            return requiredItem.id !== cItem.id;
                                                        }),
                                                    });

                                                    return newGroups;
                                                });
                                            }}
                                        />
                                    </Box>
                                </HStack>
                                {accordianContents}
                            </AccordionPanel>
                        )}
                    </AccordionItem>
                );
            }

            if (group.originatingDataId) {
                const originatingData = allOriginatingDatasMap.get(group.originatingDataId);
                let accordianContents: JSX.Element;
                if (originatingData) {
                    accordianContents = (
                        <>
                            <Text>The following shows the raw data received when this item was imported.</Text>
                            <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                                <Code w="100%" p={2}>
                                    Source Ids: {JSON.stringify(originatingData.sourceId.split("¬"), null, 2)}
                                </Code>
                            </Text>
                            <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                                <Code w="100%" p={2}>
                                    {JSON.stringify(originatingData.data, null, 2)}
                                </Code>
                            </Text>
                        </>
                    );
                } else {
                    accordianContents = <>Error: Data not found</>;
                }
                itemElements.push(
                    <AccordionItem key="originating-data">
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                                Originating Data
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>
                    </AccordionItem>
                );
            }

            const itemsAccordian = <Accordion allowToggle>{itemElements}</Accordion>;
            editorElement = (
                <>
                    {menu}
                    {combineVideosModal(key)}
                    {itemsAccordian}
                </>
            );
        } else {
            editorElement = (
                <>
                    {menu}
                    {combineVideosModal(key)}
                    <Text>TODO: Unsupported group type: {group.typeName}</Text>
                </>
            );
        }
    } else {
        editorElement = <>Error: Content not found.</>;
    }

    return {
        includeCloseButton: true,
        editorElement,
        footerButtons,
    };
}
