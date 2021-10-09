import {
    Grid,
    GridItem,
    Heading,
    HStack,
    Spinner,
    Text,
    useColorMode,
    useColorModeValue,
    useToken,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import { gql } from "urql";
import {
    ExhibitionSummaryFragment,
    ItemTagDataFragment,
    useSelectAllExhibitionsQuery,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageCountText from "../../../Realtime/PageCountText";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import { PlainAuthorsList } from "../Content/AuthorList";
import TagList from "../Content/TagList";

gql`
    fragment ExhibitionSummary on collection_Exhibition {
        id
        name
        colour
        priority
        items {
            id
            item {
                itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
                    ...ProgramPersonData
                }
                itemTags {
                    ...ItemTagData
                }
            }
        }
    }

    query SelectAllExhibitions($conferenceId: uuid!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, isHidden: { _eq: false } }) {
            ...ExhibitionSummary
        }
    }
`;

function ExhibitionTile({ exhibition }: { exhibition: ExhibitionSummaryFragment }): JSX.Element {
    const conference = useConference();
    const borderColour = useColorModeValue("Exhibition.tileBorderColor-light", "Exhibition.tileBorderColor-dark");

    const { colorMode } = useColorMode();
    const baseBgColour =
        colorMode === "light" ? "Exhibition.defaultBackgroundColor-light" : "Exhibition.defaultBackgroundColor-dark";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(
        () => (Color(exhibition.colour).getAlpha() !== 0 ? exhibition.colour : baseGrey),
        [baseGrey, exhibition.colour]
    );
    const bgColour = useMemo(() => Color(baseColour), [baseColour]);
    const bgColour_Hover = useMemo(
        () => (colorMode === "light" ? Color(baseColour).darken(15) : Color(baseColour).lighten(15)),
        [baseColour, colorMode]
    );
    const bgColour_Active = useMemo(
        () => (colorMode === "light" ? Color(baseColour).darken(30) : Color(baseColour).lighten(30)),
        [baseColour, colorMode]
    );

    const bgColour_IsDark = useMemo(() => bgColour.isDark(), [bgColour]);
    const bgColour_Hover_IsDark = useMemo(() => bgColour_Hover.isDark(), [bgColour_Hover]);
    const bgColour_Active_IsDark = useMemo(() => bgColour_Active.isDark(), [bgColour_Active]);

    const textColour = bgColour_IsDark ? "Exhibition.textColor-dark" : "Exhibition.textColor-light";
    const textColour_Hover = bgColour_Hover_IsDark ? "Exhibition.textColor-dark" : "Exhibition.textColor-light";
    const textColour_Active = bgColour_Active_IsDark ? "Exhibition.textColor-dark" : "Exhibition.textColor-light";

    const shadow = useColorModeValue("md", "light-md");

    const allAuthors = useMemo(() => R.flatten(exhibition.items.map((x) => x.item.itemPeople)), [exhibition.items]);
    const allTags = useMemo<ItemTagDataFragment[]>(
        () =>
            R.sortWith(
                [(x, y) => x.tag.priority - y.tag.priority, (x, y) => x.tag.name.localeCompare(y.tag.name)],
                R.uniqBy((x) => x.tag.id, R.flatten(exhibition.items.map((x) => x.item.itemTags)))
            ),
        [exhibition.items]
    );

    return (
        <GridItem>
            <LinkButton
                to={`/conference/${conference.slug}/exhibition/${exhibition.id}`}
                w="100%"
                h="auto"
                minH="100%"
                p={4}
                linkProps={{
                    w: "100%",
                    h: "auto",
                    minH: "100%",
                    bgColor: bgColour.toRgbString(),
                    color: textColour,
                    border: "1px solid",
                    borderColor: borderColour,
                    shadow,
                    _hover: {
                        bgColor: bgColour_Hover.toRgbString(),
                        color: textColour_Hover,
                        shadow,
                    },
                    _focus: {
                        bgColor: bgColour_Hover.toRgbString(),
                        color: textColour_Hover,
                        boxShadow: "0 0 0 2px rgba(255, 187, 0, 0.8)",
                    },
                    _active: {
                        bgColor: bgColour_Active.toRgbString(),
                        color: textColour_Active,
                        boxShadow: "0 0 0 2px rgba(255, 187, 0, 0.8)",
                    },
                }}
                background="none"
                color="inherit"
                _focus={{
                    background: "none",
                    color: "inherit",
                }}
                _hover={{
                    background: "none",
                    color: "inherit",
                }}
                _active={{
                    background: "none",
                    color: "inherit",
                }}
                as={VStack}
            >
                <TagList tags={allTags} noClick mb={2} withBorder />
                <HStack w="100%" justifyContent="flex-start" alignItems="center">
                    <Text whiteSpace="normal" mr="auto" fontWeight="bold">
                        {exhibition.name}
                    </Text>
                    <PageCountText path={`/conference/${conference.slug}/exhibition/${exhibition.id}`} />
                </HStack>
                <PlainAuthorsList people={allAuthors} fontSize="sm" sortByNameOnly />
            </LinkButton>
        </GridItem>
    );
}

export function ExhibitionsGrid(): JSX.Element {
    const conference = useConference();
    const [exhibitionsResponse] = useSelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const exhibitions = useMemo(
        () =>
            exhibitionsResponse.fetching && !exhibitionsResponse.data
                ? undefined
                : [...(exhibitionsResponse.data?.collection_Exhibition ?? [])],
        [exhibitionsResponse.data, exhibitionsResponse.fetching]
    );
    const sortedExhibitions = useMemo(
        () =>
            exhibitions
                ? R.sortWith([(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)], exhibitions)
                : undefined,
        [exhibitions]
    );

    return sortedExhibitions ? (
        <Grid
            templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
            gap={4}
            w="100%"
            h="auto"
            overflow="hidden"
        >
            {sortedExhibitions.map((exhibition) => (
                <ExhibitionTile key={exhibition.id} exhibition={exhibition} />
            ))}
        </Grid>
    ) : (
        <Spinner label="Loading exhibitions" />
    );
}

export default function ExhibitionsPage(): JSX.Element {
    const conference = useConference();
    const [exhibitionsResponse] = useSelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const exhibitions = useMemo(
        () =>
            exhibitionsResponse.fetching && !exhibitionsResponse.data
                ? undefined
                : [...(exhibitionsResponse.data?.collection_Exhibition ?? [])],
        [exhibitionsResponse.data, exhibitionsResponse.fetching]
    );
    const sortedExhibitions = useMemo(() => exhibitions?.sort((x, y) => x.priority - y.priority), [exhibitions]);

    const title = useTitle(conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions");

    return (
        <>
            {title}
            {sortedExhibitions === undefined ? (
                <CenteredSpinner
                    spinnerProps={{ label: `Loading ${conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions"}` }}
                />
            ) : (
                <>
                    <Heading as="h1" id="page-heading" py={6}>
                        {conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions"}
                    </Heading>
                    <Grid
                        templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
                        gap={4}
                        w="100%"
                        h="auto"
                        overflow="hidden"
                    >
                        {sortedExhibitions.map((exhibition) => (
                            <ExhibitionTile key={exhibition.id} exhibition={exhibition} />
                        ))}
                    </Grid>
                </>
            )}
        </>
    );
}
