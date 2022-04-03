import { Grid, Heading, Spinner, useColorMode, useColorModeValue, useToken, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Link as ReactLink } from "react-router-dom";
import Color from "tinycolor2";
import type { ExhibitionSummaryFragment, ItemTagDataFragment } from "../../../../generated/graphql";
import { useSelectAllExhibitionsQuery } from "../../../../generated/graphql";
import Card from "../../../Card";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import { PlainAuthorsList } from "../Content/AuthorList";
import TagList from "../Content/TagList";

gql`
    fragment ExhibitionSummary on collection_Exhibition {
        id
        conferenceId
        isHidden
        name
        colour
        priority
        items {
            id
            exhibitionId
            itemId
            item {
                id
                itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
                    ...ProgramPersonData
                }
                itemTags {
                    ...ItemTagData
                }
            }
        }
    }

    query SelectAllExhibitions($conferenceId: uuid!) @cached {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, isHidden: { _eq: false } }) {
            ...ExhibitionSummary
        }
    }
`;

function ExhibitionTile({ exhibition }: { exhibition: ExhibitionSummaryFragment }): JSX.Element {
    const { conferencePath } = useAuthParameters();

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
        <Card
            heading={exhibition.name}
            as={ReactLink}
            to={`${conferencePath}/exhibition/${exhibition.id}`}
            bgColor={bgColour.toRgbString()}
            color={textColour}
            _hover={{
                bgColor: bgColour_Hover.toRgbString(),
                color: textColour_Hover,
                shadow,
            }}
            _focus={{
                bgColor: bgColour_Hover.toRgbString(),
                color: textColour_Hover,
                boxShadow: "0 0 0 2px rgba(255, 187, 0, 0.8)",
            }}
            _active={{
                bgColor: bgColour_Active.toRgbString(),
                color: textColour_Active,
                boxShadow: "0 0 0 2px rgba(255, 187, 0, 0.8)",
            }}
            minW={["200px", "200px", "25em"]}
        >
            <TagList tags={allTags} noClick mb={2} withBorder />
            <PlainAuthorsList people={allAuthors} fontSize="sm" sortByNameOnly />
        </Card>
    );
}

export function ExhibitionsList(): JSX.Element {
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
        <VStack spacing={4} alignItems="stretch" w="100%">
            {sortedExhibitions.map((exhibition) => (
                <ExhibitionTile key={exhibition.id} exhibition={exhibition} />
            ))}
        </VStack>
    ) : (
        <Spinner label="Loading exhibitions" />
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

    const title = useTitle(
        (conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions") + " - " + conference.shortName
    );

    return (
        <>
            {title}
            {sortedExhibitions === undefined ? (
                <CenteredSpinner
                    spinnerProps={{ label: `Loading ${conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions"}` }}
                    caller="ExhibitionsPage:228"
                />
            ) : (
                <>
                    <Heading as="h1" id="page-heading" mt={[2, 2, 4]} px={[2, 2, 4]} alignSelf="flex-start">
                        {conference.visibleExhibitionsLabel[0]?.value ?? "Exhibitions"}
                    </Heading>
                    <Grid
                        templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
                        gap={[2, 2, 4]}
                        w="100%"
                        px={[2, 2, 4]}
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
