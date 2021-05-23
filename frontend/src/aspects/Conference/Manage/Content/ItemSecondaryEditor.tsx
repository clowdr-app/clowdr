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
    Tag,
    Text,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import type { SecondaryEditorComponents, SecondaryEditorFooterButton } from "../../../CRUDTable/CRUDTable";
import FAIcon from "../../../Icons/FAIcon";
import {
    GroupExhibitionsEditorModal,
    GroupPeopleEditorModal,
    UploadableItemEditorModal,
} from "../ManageConferenceContentPage";
import type { OriginatingDataDescriptor } from "../Shared/Types";
import { CreateRoomButton } from "./CreateRoomButton";
import { ElementBaseTemplates, ItemTemplates } from "./Templates";
import type { ContentDescriptor, ExhibitionDescriptor, ItemDescriptor, ProgramPersonDescriptor } from "./Types";

gql`
    mutation Item_CreateRoom($conferenceId: uuid!, $itemId: uuid!) {
        createItemRoom(conferenceId: $conferenceId, itemId: $itemId) {
            roomId
            message
        }
    }
`;

export function ItemSecondaryEditor(
    allGroupsMap: Map<string, ItemDescriptor>,
    allPeopleMap: Map<string, ProgramPersonDescriptor>,
    allOriginatingDatasMap: Map<string, OriginatingDataDescriptor>,
    allExhibitionsMap: Map<string, ExhibitionDescriptor>,
    key: string,
    markDirty: () => void,
    setAllItemsMap: React.Dispatch<React.SetStateAction<Map<string, ItemDescriptor> | undefined>>,
    isDirty: boolean,
    conferenceSlug: string,
    onCombineVideosOpen: () => void,
    combineVideosModal: (key: string) => JSX.Element
): SecondaryEditorComponents {
    const group = allGroupsMap.get(key);

    let editorElement: JSX.Element;
    const footerButtons: SecondaryEditorFooterButton[] = [];

    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = (() => {
        return Object.keys(Content_ElementType_Enum)
            .filter(
                (key) =>
                    typeof (Content_ElementType_Enum as any)[key] === "string" &&
                    ElementBaseTemplates[
                        ElementBaseTypes[(Content_ElementType_Enum as any)[key] as Content_ElementType_Enum]
                    ].supported
            )
            .map((key) => {
                const v = (Content_ElementType_Enum as any)[key] as string;
                return {
                    label: v
                        .split("_")
                        .map((x) => x[0] + x.substr(1).toLowerCase())
                        .reduce((acc, x) => `${acc} ${x}`),
                    value: v as Content_ElementType_Enum,
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

                                    setAllItemsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        const template = ElementBaseTemplates[ElementBaseTypes[typeOpt.value]];
                                        assert(template.supported);
                                        const newContent = template.createDefault(typeOpt.value, false);
                                        assert(newContent.type === "element-only");
                                        newGroups.set(group.id, {
                                            ...existingGroup,
                                            elements: [...existingGroup.elements, newContent.element],
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

                                    setAllItemsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        const template = ElementBaseTemplates[ElementBaseTypes[typeOpt.value]];
                                        assert(template.supported);
                                        const newContent = template.createDefault(typeOpt.value, true);
                                        if (newContent.type === "required-only") {
                                            newGroups.set(group.id, {
                                                ...existingGroup,
                                                uploadableElements: [
                                                    ...existingGroup.uploadableElements,
                                                    newContent.uploadableElement,
                                                ],
                                            });
                                        } else if (newContent.type === "required-and-element") {
                                            newGroups.set(group.id, {
                                                ...existingGroup,
                                                elements: [...existingGroup.elements, newContent.element],
                                                uploadableElements: [
                                                    ...existingGroup.uploadableElements,
                                                    newContent.uploadableElement,
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
                    colorScheme="purple"
                    isExternal={true}
                    aria-label={`View ${group.title} in the registrant view`}
                    title={`View ${group.title} in the registrant view`}
                    linkProps={{
                        flex: "0 0 auto",
                    }}
                >
                    <FAIcon icon="link" iconStyle="s" mr={3} />
                    View item
                </LinkButton>
                {group.rooms.length === 0 ? (
                    <CreateRoomButton itemId={group?.id} />
                ) : (
                    <LinkButton
                        size="sm"
                        to={`/conference/${conferenceSlug}/room/${group.rooms[0].id}`}
                        colorScheme="purple"
                        isExternal={true}
                        aria-label={"View discussion room in the registrant view"}
                        title={"View discussion room in the registrant view"}
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

        const groupTemplate = ItemTemplates[group.typeName];
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
                            setAllItemsMap={setAllItemsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

            itemElements.push(
                <AccordionItem key="exhibitions">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Exhibitions
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <GroupExhibitionsEditorModal
                            group={group}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            exhibitionsMap={allExhibitionsMap}
                            setAllItemsMap={setAllItemsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

            for (const item of group.elements
                .sort((x, y) => x.name.localeCompare(y.name))
                .sort((x, y) => x.typeName.localeCompare(y.typeName))) {
                if (!item.uploadableId) {
                    const itemType = item.typeName;
                    const baseType = ElementBaseTypes[itemType];
                    const itemTemplate = ElementBaseTemplates[baseType];
                    let accordianTitle: string | JSX.Element = `TODO: Unsupported item type ${itemType}`;
                    let accordianContents: JSX.Element | undefined;

                    if (itemTemplate.supported) {
                        const itemDesc: ContentDescriptor | null = item
                            ? {
                                  type: "element-only",
                                  element: item,
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
                                setAllItemsMap((oldGroups) => {
                                    assert(oldGroups);
                                    const newGroups = new Map(oldGroups);

                                    const existingGroup = newGroups.get(group.id);
                                    assert(existingGroup);
                                    if (existingGroup.elements.some((x) => x.id === itemDesc.element.id)) {
                                        return oldGroups;
                                    }
                                    newGroups.set(group.id, {
                                        ...existingGroup,
                                        elements: [...existingGroup.elements, itemDesc.element],
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

                                    assert(updatedDesc.type === "element-only");

                                    setAllItemsMap((oldGroups) => {
                                        assert(oldGroups);
                                        const newGroups = new Map(oldGroups);

                                        const existingGroup = newGroups.get(group.id);
                                        assert(existingGroup);
                                        newGroups.set(group.id, {
                                            ...existingGroup,
                                            elements: existingGroup.elements.map((cItem) => {
                                                return itemDesc.element.id === cItem.id ? updatedDesc.element : cItem;
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
                                {item.isHidden && (
                                    <Tag size="sm" mr={1}>
                                        Hidden
                                    </Tag>
                                )}
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

                                                    setAllItemsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            elements: existingGroup.elements.map((cItem) => {
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
                                                Enable to hide this content from registrants.
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

                                                    setAllItemsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            elements: existingGroup.elements.filter((cItem) => {
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

            for (const uploadableElement of group.uploadableElements
                .sort((x, y) => x.name.localeCompare(y.name))
                .sort((x, y) => x.typeName.localeCompare(y.typeName))) {
                const itemType = uploadableElement.typeName;
                const baseType = ElementBaseTypes[itemType];
                const itemTemplate = ElementBaseTemplates[baseType];
                let accordianTitle: string | JSX.Element = `TODO: Unsupported required item type ${itemType}`;
                let accordianContents: JSX.Element | undefined;

                const item =
                    uploadableElement &&
                    group.elements.find((x) => x.typeName === itemType && x.uploadableId === uploadableElement.id);

                if (itemTemplate.supported) {
                    const itemDesc: ContentDescriptor | null =
                        uploadableElement && item
                            ? {
                                  type: "required-and-element",
                                  element: item,
                                  uploadableElement,
                              }
                            : uploadableElement
                            ? {
                                  type: "required-only",
                                  uploadableElement,
                              }
                            : null;
                    if (!itemDesc) {
                        throw new Error(
                            `Required item ${itemType} does not exist for the group ${group.id} following template ${group.typeName}!`
                        );
                    }

                    accordianTitle = itemTemplate.renderEditorHeading(itemDesc);

                    accordianContents = (
                        <UploadableItemEditorModal
                            group={group}
                            itemTemplate={itemTemplate}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            setAllItemsMap={setAllItemsMap}
                            itemDesc={itemDesc}
                        />
                    );
                }

                itemElements.push(
                    <AccordionItem key={`row-${item?.id ?? uploadableElement.id}`}>
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

                                                    setAllItemsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            elements: existingGroup.elements.map((cItem) => {
                                                                return item.id === cItem.id
                                                                    ? { ...cItem, isHidden: !cItem.isHidden }
                                                                    : cItem;
                                                            }),
                                                            uploadableElements: existingGroup.uploadableElements.map(
                                                                (cItem) => {
                                                                    return uploadableElement.id === cItem.id
                                                                        ? { ...cItem, isHidden: !cItem.isHidden }
                                                                        : cItem;
                                                                }
                                                            ),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                            <FormHelperText m={0} ml={2} p={0}>
                                                Enable to hide this content from registrants.
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
                                                isChecked={uploadableElement.isHidden}
                                                onChange={() => {
                                                    markDirty();

                                                    setAllItemsMap((oldGroups) => {
                                                        assert(oldGroups);
                                                        const newGroups = new Map(oldGroups);

                                                        const existingGroup = newGroups.get(group.id);
                                                        assert(existingGroup);
                                                        newGroups.set(group.id, {
                                                            ...existingGroup,
                                                            uploadableElements: existingGroup.uploadableElements.map(
                                                                (cItem) => {
                                                                    return uploadableElement.id === cItem.id
                                                                        ? { ...cItem, isHidden: !cItem.isHidden }
                                                                        : cItem;
                                                                }
                                                            ),
                                                        });

                                                        return newGroups;
                                                    });
                                                }}
                                            />
                                            <FormHelperText m={0} ml={2} p={0}>
                                                Enable to hide this content from registrants.
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

                                                setAllItemsMap((oldGroups) => {
                                                    assert(oldGroups);
                                                    const newGroups = new Map(oldGroups);

                                                    const existingGroup = newGroups.get(group.id);
                                                    assert(existingGroup);
                                                    newGroups.set(group.id, {
                                                        ...existingGroup,
                                                        uploadableElements: existingGroup.uploadableElements.filter(
                                                            (cItem) => {
                                                                return uploadableElement.id !== cItem.id;
                                                            }
                                                        ),
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
