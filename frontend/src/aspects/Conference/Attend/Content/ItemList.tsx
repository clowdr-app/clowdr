import type { StackProps } from "@chakra-ui/react";
import {
    Box,
    Button,
    Center,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    SimpleGrid,
    Spinner,
    Text,
    useColorMode,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import Color from "tinycolor2";
import { useClient } from "urql";
import type {
    ContentOfTagQuery,
    ContentOfTagQueryVariables,
    ItemList_ItemDataFragment,
    ItemList_ItemTagDataFragment,
    ItemList_TagInfoFragment,
} from "../../../../generated/graphql";
import { ContentOfTagDocument, useTagsQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRestorableState } from "../../../Generic/useRestorableState";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { AuthorList } from "./AuthorList";

gql`
    fragment ItemList_ItemData on content_Item {
        id
        title
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            ...ProgramPersonData
        }
    }

    fragment ItemList_ItemTagData on content_ItemTag {
        id
        tagId
        itemId
        item {
            ...ItemList_ItemData
        }
    }

    fragment ItemList_TagInfo on collection_Tag {
        id
        colour
        name
        priority
    }

    query ContentOfTag($id: uuid!) {
        content_ItemTag(where: { tagId: { _eq: $id } }) {
            ...ItemList_ItemTagData
        }
    }

    query Tags($conferenceId: uuid!) {
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ItemList_TagInfo
        }
    }
`;

export function TagButton({
    tag,
    isExpanded,
    setOpenId,
    notExpander,
    withBorder,
}: {
    tag: ItemList_TagInfoFragment;
    isExpanded: boolean;
    setOpenId?: (id: string | null) => void;
    notExpander?: boolean;
    withBorder?: boolean;
}): JSX.Element {
    const colour = tag.colour.replace(/\s/g, "").endsWith("0)") ? undefined : tag.colour;
    const defaultCollapsedBgColour = useColorModeValue(
        "TagBrowser-Tag.defaultBackgroundColor-Unselected-light",
        "TagBrowser-Tag.defaultBackgroundColor-Unselected-dark"
    );
    const defaultExpandedBgColour = useColorModeValue(
        "TagBrowser-Tag.defaultBackgroundColor-Selected-light",
        "TagBrowser-Tag.defaultBackgroundColor-Selected-dark"
    );
    const colourMode = useColorMode();
    const isDark = useMemo(
        () => (colour ? Color(colour).isDark() : colourMode.colorMode === "dark"),
        [colour, colourMode.colorMode]
    );
    const collapsedBgColour = useMemo(
        () => (colour ? colour : defaultCollapsedBgColour),
        [colour, defaultCollapsedBgColour]
    );
    const expandedBgColour = useMemo(
        () =>
            colour
                ? isDark
                    ? Color(colour).lighten(20).toHexString()
                    : Color(colour).darken(20).toHexString()
                : defaultExpandedBgColour,
        [colour, defaultExpandedBgColour, isDark]
    );
    const isExpandedDark = useMemo(
        () => (colour ? Color(expandedBgColour).isDark() : false),
        [colour, expandedBgColour]
    );

    const shadow = useColorModeValue("md", "light-md");
    return setOpenId ? (
        <Button
            colorScheme="pink"
            isActive={isExpanded}
            aria-expanded={isExpanded}
            padding={[1, 1, 1]}
            whiteSpace="normal"
            margin={0}
            color={
                (isExpanded && isExpandedDark) || (!isExpanded && isDark)
                    ? "TagBrowser-Tag.textColor-light"
                    : "TagBrowser-Tag.textColor-dark"
            }
            height="auto"
            borderWidth={2}
            borderColor={isExpanded ? expandedBgColour : collapsedBgColour}
            variant="outline"
            id={notExpander ? undefined : `content-groups-accordion-button-${tag.id}`}
            aria-controls={notExpander ? undefined : `content-groups-accordion-panel-${tag.id}`}
            onClick={() => (isExpanded ? setOpenId(null) : setOpenId(tag.id))}
            backgroundColor={isExpanded ? expandedBgColour : collapsedBgColour}
            _hover={{
                backgroundColor: isExpanded ? collapsedBgColour : expandedBgColour,
            }}
            _focus={{
                backgroundColor: isExpanded ? collapsedBgColour : expandedBgColour,
            }}
            _active={{
                backgroundColor: isExpanded ? expandedBgColour : collapsedBgColour,
            }}
            shadow={shadow}
        >
            <Center m={0} p={0}>
                <Text as="span" fontSize="sm" fontWeight={600} m={0}>
                    {tag.name}
                </Text>
            </Center>
        </Button>
    ) : (
        <Box
            padding={[1, 1, 1]}
            whiteSpace="normal"
            margin={0}
            color={
                (isExpanded && isExpandedDark) || (!isExpanded && isDark)
                    ? "TagBrowser-Tag.textColor-light"
                    : "TagBrowser-Tag.textColor-dark"
            }
            height="auto"
            borderWidth={withBorder && !isExpanded ? 1 : 2}
            borderColor={withBorder || isExpanded ? expandedBgColour : collapsedBgColour}
            backgroundColor={isExpanded ? expandedBgColour : collapsedBgColour}
        >
            <Center m={0} p={0}>
                <Text as="span" fontSize="xs" fontWeight={600} m={0}>
                    {tag.name}
                </Text>
            </Center>
        </Box>
    );
}

function ItemButton({ group }: { group: ItemList_ItemDataFragment }): JSX.Element {
    const shadow = useColorModeValue("md", "light-md");
    const { conferencePath } = useAuthParameters();
    return (
        <LinkButton
            to={`${conferencePath}/item/${group.id}`}
            p={[2, 4]}
            alignItems="flex-start"
            justifyContent="flex-start"
            flexDir="column"
            width="100%"
            height="100%"
            colorScheme="TagBrowser-Item"
            shadow={shadow}
            fontSize="0.9em"
        >
            <Text as="p" whiteSpace="normal" fontSize="1.4em" fontWeight="600" textAlign="left" mb={4}>
                <Twemoji className="twemoji" text={group.title} />
            </Text>
            <AuthorList programPeopleData={group.itemPeople} noRegistrantLink />
        </LinkButton>
    );
}

function Panel({ tag, isExpanded }: { tag: ItemList_TagInfoFragment; isExpanded: boolean }): JSX.Element {
    const [search, setSearch] = useRestorableState<string>(
        "ItemList_Search_" + tag.id,
        "",
        (x) => x,
        (x) => x
    );

    const client = useClient();
    const [content, setContent] = useState<ItemList_ItemTagDataFragment[] | null>(null);
    useEffect(() => {
        if (isExpanded && !content) {
            (async () => {
                const data = await client
                    .query<ContentOfTagQuery, ContentOfTagQueryVariables>(ContentOfTagDocument, {
                        id: tag.id,
                    })
                    .toPromise();
                setContent(data.data?.content_ItemTag ? [...data.data.content_ItemTag] : []);
            })();
        }
    }, [content, client, isExpanded, tag.id]);

    const sortedGroups = useMemo(
        () => content?.map((x) => x.item).sort((x, y) => x.title.localeCompare(y.title)),
        [content]
    );
    const groupElements = useMemo(
        () =>
            sortedGroups?.map((group) => ({
                title: group.title.toLowerCase(),
                names: group.itemPeople.map((person) => person.person.name.toLowerCase()),
                affiliations: group.itemPeople.map((person) => person.person.affiliation?.toLowerCase() ?? ""),
                el: <ItemButton key={group.id} group={group} />,
            })),
        [sortedGroups]
    );
    const s = search.toLowerCase();
    const filteredElements = groupElements?.filter((g) => {
        return (
            g.title.includes(s) ||
            g.names.some((name) => name.includes(s)) ||
            g.affiliations.some((affiliation) => affiliation.includes(s))
        );
    });

    const resultCountStr = filteredElements
        ? `${filteredElements.length} ${filteredElements.length !== 1 ? "items" : "item"}`
        : "Loading content";
    const [ariaSearchResultStr, setAriaSearchResultStr] = useState<string>(resultCountStr);
    useEffect(() => {
        const tId = setTimeout(() => {
            setAriaSearchResultStr(resultCountStr);
        }, 250);
        return () => {
            clearTimeout(tId);
        };
    }, [resultCountStr]);

    return (
        <Center
            role="region"
            id={`content-groups-accordion-panel-${tag.id}`}
            aria-labelledby={`content-groups-accordion-button-${tag.id}`}
            hidden={!isExpanded ? true : undefined}
            transition={"height 5s linear"}
            overflow="hidden"
            height="auto"
            width="100%"
            flexDir="column"
            p={2}
        >
            <Heading as="h3" fontSize="1.4rem" marginBottom="0.5rem" mb={4}>
                {tag.name}
            </Heading>
            <FormControl mb={4} maxW={400}>
                <FormLabel mt={4} textAlign="center">
                    {resultCountStr}
                </FormLabel>
                <InputGroup>
                    <InputLeftAddon aria-hidden>
                        <FAIcon iconStyle="s" icon="search" mr={2} />
                        Search
                    </InputLeftAddon>
                    <Input
                        aria-label={"Search found " + ariaSearchResultStr}
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(ev) => {
                            setSearch(ev.target.value);
                        }}
                    />
                    <InputRightElement
                        as={Button}
                        variant="ghost"
                        ml={1}
                        fontSize="sm"
                        onClick={() => {
                            setSearch("");
                        }}
                        isDisabled={search === ""}
                    >
                        <FAIcon iconStyle="s" icon="times-circle" />
                    </InputRightElement>
                </InputGroup>
                <FormHelperText>Search for an item by title or a person&apos;s name or affiliation.</FormHelperText>
            </FormControl>
            {!filteredElements ? (
                <Spinner label="Loading content" />
            ) : (
                <SimpleGrid
                    columns={[1, Math.min(2, filteredElements.length), Math.min(3, filteredElements.length)]}
                    autoRows="min-content"
                    spacing={[2, 2, 4]}
                >
                    {filteredElements.map((g) => g.el)}
                </SimpleGrid>
            )}
        </Center>
    );
}

export default function ItemList(
    props: { overrideSelectedTag?: string | null; setOverrideSelectedTag?: (id: string | null) => void } & StackProps
): JSX.Element {
    const { overrideSelectedTag, setOverrideSelectedTag, ...remainingProps } = props;
    const conference = useConference();
    const [{ fetching: loading, data, error }] = useTagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ItemList.tsx");

    const [internalOpenPanelId, setInternalOpenPanelId] = useRestorableState<string | null>(
        "ItemList_OpenPanelId_" + conference.id,
        null,
        (s) => (s === null ? "null" : s),
        (s) => (s === "null" ? null : s)
    );
    const setOpenId = useCallback(
        (id: string | null) => {
            setInternalOpenPanelId(id);
            setOverrideSelectedTag?.(id);
        },
        [setInternalOpenPanelId, setOverrideSelectedTag]
    );
    const openPanelId = overrideSelectedTag !== undefined ? overrideSelectedTag : internalOpenPanelId;

    const sortedTags = useMemo(
        () =>
            data?.collection_Tag
                ? [...data.collection_Tag]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .sort((x, y) => x.priority - y.priority)
                : [],
        [data?.collection_Tag]
    );

    if (loading && !sortedTags) {
        return (
            <div>
                <Spinner />
            </div>
        );
    }

    if (!sortedTags) {
        return <></>;
    }

    return (
        <VStack px={4} spacing={4} {...remainingProps}>
            <Text>Select a tag to browse papers, posters, keynotes, and more.</Text>
            <Center flexDirection="column">
                <SimpleGrid
                    aria-describedby="content-groups-accordion-header"
                    columns={[
                        1,
                        Math.min(2, sortedTags.length),
                        Math.min(3, sortedTags.length),
                        Math.min(5, sortedTags.length),
                    ]}
                    maxW={1024}
                    autoRows={["min-content", "min-content", "1fr"]}
                    spacing={[2, 2, 4]}
                >
                    {sortedTags.map((tag) => (
                        <TagButton key={tag.id} tag={tag} setOpenId={setOpenId} isExpanded={openPanelId === tag.id} />
                    ))}
                </SimpleGrid>
                <Box overflow="hidden" pt={6} justifyContent="center">
                    {sortedTags.map((tag) => (
                        <Panel key={tag.id} tag={tag} isExpanded={openPanelId === tag.id} />
                    ))}
                </Box>
            </Center>
        </VStack>
    );
}
