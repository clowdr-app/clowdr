import { gql } from "@apollo/client";
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
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import {
    ContentGroupList_ContentGroupDataFragment,
    ContentGroupList_ContentGroupTagDataFragment,
    ContentGroupList_TagInfoFragment,
    useContentOfTagQuery,
    useTagsQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRestorableState } from "../../../Generic/useRestorableState";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { sortAuthors } from "./AuthorList";

gql`
    fragment ContentGroupList_ContentPersonData on ContentGroupPerson {
        id
        person {
            id
            affiliation
            name
        }
        priority
    }

    fragment ContentGroupList_ContentGroupData on ContentGroup {
        id
        title
        people(where: { roleName: { _nilike: "chair" } }) {
            ...ContentGroupList_ContentPersonData
        }
    }

    fragment ContentGroupList_ContentGroupTagData on ContentGroupTag {
        contentGroup {
            ...ContentGroupList_ContentGroupData
        }
    }

    fragment ContentGroupList_TagInfo on Tag {
        id
        colour
        name
        priority
    }

    query ContentOfTag($id: uuid!) {
        ContentGroupTag(where: { tagId: { _eq: $id } }) {
            ...ContentGroupList_ContentGroupTagData
        }
    }

    query Tags($conferenceId: uuid!) {
        Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ContentGroupList_TagInfo
        }
    }
`;

function TagButton({
    tag,
    isExpanded,
    setOpenId,
}: {
    tag: ContentGroupList_TagInfoFragment;
    isExpanded: boolean;
    setOpenId: (id: string) => void;
}): JSX.Element {
    const colour = tag.colour.replace(/\s/g, "") === "rgba(0,0,0,0)" ? undefined : tag.colour;
    const collapsedBgColour = useColorModeValue("blue.200", "blue.700");
    const expandedBgColour = useColorModeValue("blue.300", "gray.500");
    return (
        <Button
            colorScheme="blue"
            isActive={isExpanded}
            aria-expanded={isExpanded}
            padding={[1, 1, 5]}
            whiteSpace="normal"
            margin={0}
            color={colour}
            height="auto"
            borderWidth={2}
            borderColor={isExpanded ? expandedBgColour : collapsedBgColour}
            variant="outline"
            id={`content-groups-accordion-button-${tag.id}`}
            aria-controls={`content-groups-accordion-panel-${tag.id}`}
            onClick={() => setOpenId(tag.id)}
            backgroundColor={isExpanded ? expandedBgColour : collapsedBgColour}
        >
            <Center>
                <Text as="span" fontSize="1.2rem" marginBottom="0.5rem" fontWeight={600} m={0}>
                    {tag.name}
                </Text>
            </Center>
        </Button>
    );
}

function ContentGroupButton({ group }: { group: ContentGroupList_ContentGroupDataFragment }): JSX.Element {
    const conference = useConference();
    const textColour = useColorModeValue("gray.500", "gray.400");
    return (
        <LinkButton
            to={`/conference/${conference.slug}/item/${group.id}`}
            p={[2, 4]}
            alignItems="flex-start"
            justifyContent="flex-start"
            flexDir="column"
            width="100%"
            height="100%"
        >
            <Text as="p" whiteSpace="normal" fontSize="1.2em" fontWeight="600" textAlign="left" mb={4}>
                <Twemoji className="twemoji" text={group.title} />
            </Text>
            <Text as="p" fontSize="0.9em" textColor={textColour} whiteSpace="normal" lineHeight="3ex">
                {[...group.people]
                    .sort(sortAuthors)
                    .reduce((acc, person) => `${acc}, ${person.person.name}`, "")
                    .substr(2)}
            </Text>
        </LinkButton>
    );
}

function Panel({ tag, isExpanded }: { tag: ContentGroupList_TagInfoFragment; isExpanded: boolean }): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const contentOfTag = useContentOfTagQuery({
        skip: true,
    });
    const [content, setContent] = useState<ContentGroupList_ContentGroupTagDataFragment[] | null>(null);
    useEffect(() => {
        if (isExpanded && !content) {
            (async () => {
                const data = await contentOfTag.refetch({
                    id: tag.id,
                });
                setContent(data.data?.ContentGroupTag ? [...data.data.ContentGroupTag] : []);
            })();
        }
    }, [content, contentOfTag, isExpanded, tag.id]);

    const sortedGroups = useMemo(
        () => content?.map((x) => x.contentGroup).sort((x, y) => x.title.localeCompare(y.title)),
        [content]
    );
    const groupElements = useMemo(
        () =>
            sortedGroups?.map((group) => ({
                title: group.title.toLowerCase(),
                names: group.people.map((person) => person.person.name.toLowerCase()),
                affiliations: group.people.map((person) => person.person.affiliation?.toLowerCase() ?? ""),
                el: <ContentGroupButton key={group.id} group={group} />,
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
                    <InputLeftAddon aria-hidden>Search</InputLeftAddon>
                    <Input
                        aria-label={"Search found " + ariaSearchResultStr}
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(ev) => {
                            setSearch(ev.target.value);
                        }}
                    />
                    <InputRightElement>
                        <FAIcon iconStyle="s" icon="search" />
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

export default function ContentGroupList(): JSX.Element {
    const conference = useConference();
    const { loading, data, error } = useTagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ContentGroupList.tsx");

    const [openPanelId, setOpenPanelId] = useRestorableState<string | null>(
        "ContentGroupList_OpenPanelId",
        null,
        (s) => (s === null ? "null" : s),
        (s) => (s === "null" ? null : s)
    );
    const setOpenId = setOpenPanelId;

    const sortedTags = useMemo(
        () =>
            data?.Tag
                ? [...data.Tag].sort((x, y) => x.name.localeCompare(y.name)).sort((x, y) => x.priority - y.priority)
                : [],
        [data?.Tag]
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
        <VStack px={4} pt="6ex" spacing={4}>
            <Center flexDirection="column">
                <SimpleGrid
                    aria-describedby="content-groups-accordion-header"
                    columns={[
                        1,
                        Math.min(2, sortedTags.length),
                        Math.min(3, sortedTags.length),
                        Math.min(4, sortedTags.length),
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
