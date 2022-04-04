import {
    Box,
    Button,
    Center,
    Flex,
    Heading,
    Select,
    Spinner,
    Text,
    useColorMode,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Color from "tinycolor2";
import { useClient } from "urql";
import type {
    ContentOfTagQuery,
    ContentOfTagQueryVariables,
    ItemList_ItemTagDataFragment,
    ItemList_TagInfoFragment,
} from "../../../../generated/graphql";
import { ContentOfTagDocument, useTagsQuery } from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useConference } from "../../useConference";
import ItemCard from "./ItemCard";

gql`
    fragment ItemList_ItemTagData on content_ItemTag {
        id
        tagId
        itemId
        item {
            ...ScheduleItem
        }
    }

    fragment ItemList_TagInfo on collection_Tag {
        id
        subconferenceId
        colour
        name
        priority
    }

    query ContentOfTag($id: uuid!, $includeAbstract: Boolean!, $includeItemEvents: Boolean!) @cached {
        content_ItemTag(where: { tagId: { _eq: $id } }) {
            ...ItemList_ItemTagData
        }
    }

    query Tags($conferenceId: uuid!) @cached {
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
            whiteSpace="normal"
            w="10em"
            my={2}
            mr={2}
            p={1}
            color={
                (isExpanded && isExpandedDark) || (!isExpanded && isDark)
                    ? "TagBrowser-Tag.textColor-light"
                    : "TagBrowser-Tag.textColor-dark"
            }
            height="auto"
            borderRadius="3xl"
            borderWidth={2}
            borderColor={isExpanded ? expandedBgColour : collapsedBgColour}
            variant="outline"
            id={notExpander ? undefined : `content-items-accordion-button-${tag.id}`}
            aria-controls={notExpander ? undefined : `content-items-accordion-panel-${tag.id}`}
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

function Panel({
    tag,
    isExpanded,
    noHeading,
}: {
    tag: ItemList_TagInfoFragment;
    isExpanded: boolean;
    noHeading?: boolean;
}): JSX.Element {
    const client = useClient();
    const [content, setContent] = useState<ItemList_ItemTagDataFragment[] | null>(null);
    useEffect(() => {
        if (isExpanded && !content) {
            (async () => {
                const data = await client
                    .query<ContentOfTagQuery, ContentOfTagQueryVariables>(ContentOfTagDocument, {
                        id: tag.id,
                        includeAbstract: true,
                        includeItemEvents: true,
                    })
                    .toPromise();
                setContent(data.data?.content_ItemTag ? [...data.data.content_ItemTag] : []);
            })();
        }
    }, [content, client, isExpanded, tag.id]);

    const sortedItems = useMemo(
        () => content?.map((x) => x.item).sort((x, y) => x.title.localeCompare(y.title)),
        [content]
    );
    const itemElements = useMemo(
        () =>
            sortedItems?.map((group) => ({
                title: group.title.toLowerCase(),
                el: <ItemCard key={group.id} item={group} />,
            })),
        [sortedItems]
    );

    return (
        <Flex
            role="region"
            id={`content-items-accordion-panel-${tag.id}`}
            aria-labelledby={`content-items-accordion-button-${tag.id}`}
            hidden={!isExpanded ? true : undefined}
            transition={"height 5s linear"}
            overflow="hidden"
            height="auto"
            width="100%"
            flexDir="column"
            alignItems="stretch"
            justifyContent="stretch"
            p={2}
        >
            {!noHeading ? (
                <Heading as="h3" fontSize="1.4rem" marginBottom="0.5rem" mb={4} textAlign="left" w="100%">
                    {tag.name}
                </Heading>
            ) : undefined}
            {!itemElements ? (
                <Spinner label="Loading content" />
            ) : (
                <Flex w="100%" flexWrap="wrap" alignItems="stretch" justifyContent="stretch">
                    {itemElements.map((g) => g.el)}
                </Flex>
            )}
        </Flex>
    );
}

export default function ItemList({
    selectAsDropdown,
    ...props
}: {
    overrideSelectedTag?: string | null;
    setOverrideSelectedTag?: (id: string | null) => void;
    selectAsDropdown?: boolean;
}): JSX.Element {
    const { overrideSelectedTag, setOverrideSelectedTag } = props;
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

    const sortedGroupedTags = useMemo(() => {
        if (data?.collection_Tag) {
            const groupedTags = R.groupBy((x) => (x.subconferenceId ?? "none") as string, data.collection_Tag);
            for (const key in groupedTags) {
                groupedTags[key].sort((x, y) => x.name.localeCompare(y.name)).sort((x, y) => x.priority - y.priority);
            }
            return groupedTags;
        }
        return undefined;
    }, [data?.collection_Tag]);

    if (loading && !sortedGroupedTags) {
        return (
            <div>
                <Spinner />
            </div>
        );
    }

    if (!sortedGroupedTags) {
        return <></>;
    }

    return (
        <VStack px={4} spacing={4} alignItems="flex-start" w="100%" minW="min(100vw, 35em)">
            <Text>Select a tag to browse papers, posters, keynotes, and more.</Text>
            {sortedGroupedTags ? (
                !selectAsDropdown ? (
                    Object.keys(sortedGroupedTags).map((subconferenceId) => {
                        const sortedTags = sortedGroupedTags[subconferenceId];
                        return (
                            <Fragment key={"tag-buttons-" + subconferenceId}>
                                {subconferenceId !== "none" ? (
                                    <Heading as="h3" fontSize="md" textAlign="left">
                                        {conference.subconferences.find((x) => x.id === subconferenceId)?.shortName ??
                                            "Unknown subconference"}
                                    </Heading>
                                ) : undefined}
                                <Flex maxW={1024} flexDir="row" flexWrap="wrap">
                                    {sortedTags.map((tag) => (
                                        <TagButton
                                            key={tag.id}
                                            tag={tag}
                                            setOpenId={setOpenId}
                                            isExpanded={openPanelId === tag.id}
                                        />
                                    ))}
                                </Flex>
                            </Fragment>
                        );
                    })
                ) : (
                    <Select
                        value={openPanelId ?? ""}
                        onChange={(ev) => setOpenId(ev.target.value.length > 0 ? ev.target.value : null)}
                    >
                        <option value="">Select a tag</option>
                        {Object.keys(sortedGroupedTags).map((subconferenceId) => {
                            const sortedTags = sortedGroupedTags[subconferenceId];
                            return (
                                <optgroup
                                    key={"tag-buttons-" + subconferenceId}
                                    label={
                                        subconferenceId !== "none"
                                            ? conference.subconferences.find((x) => x.id === subconferenceId)
                                                  ?.shortName ?? "Unknown subconference"
                                            : "Main conference"
                                    }
                                >
                                    {sortedTags.map((tag) => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                                </optgroup>
                            );
                        })}
                    </Select>
                )
            ) : undefined}
            {sortedGroupedTags &&
                Object.keys(sortedGroupedTags).map((subconferenceId) => {
                    const sortedTags = sortedGroupedTags[subconferenceId];
                    return (
                        <Box
                            key={"tag-panel-" + subconferenceId}
                            overflow="hidden"
                            pt={selectAsDropdown ? 0 : 6}
                            justifyContent="flex-start"
                            w="100%"
                        >
                            {sortedTags.map((tag) => (
                                <Panel
                                    key={tag.id}
                                    tag={tag}
                                    isExpanded={openPanelId === tag.id}
                                    noHeading={selectAsDropdown}
                                />
                            ))}
                        </Box>
                    );
                })}
        </VStack>
    );
}
