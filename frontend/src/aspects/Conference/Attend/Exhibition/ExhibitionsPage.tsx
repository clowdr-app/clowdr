import { gql } from "@apollo/client";
import { Grid, GridItem, Heading, Spinner, Text, useColorMode, useColorModeValue, useToken } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import { ExhibitionSummaryFragment, useSelectAllExhibitionsQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageCountText from "../../../Realtime/PageCountText";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";

gql`
    fragment ExhibitionSummary on collection_Exhibition {
        id
        name
        colour
        priority
    }

    query SelectAllExhibitions($conferenceId: uuid!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ExhibitionSummary
        }
    }
`;

function ExhibitionTile({ exhibition }: { exhibition: ExhibitionSummaryFragment }): JSX.Element {
    const conference = useConference();
    const borderColour = useColorModeValue("gray.300", "gray.600");

    const { colorMode } = useColorMode();
    const baseBgColour = colorMode === "light" ? "gray.200" : "gray.600";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(() => (Color(exhibition.colour).getAlpha() !== 0 ? exhibition.colour : baseGrey), [
        baseGrey,
        exhibition.colour,
    ]);
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

    const textColour = bgColour_IsDark ? "white" : "black";
    const textColour_Hover = bgColour_Hover_IsDark ? "white" : "black";
    const textColour_Active = bgColour_Active_IsDark ? "white" : "black";

    const shadow = useColorModeValue("md", "light-md");
    return (
        <GridItem>
            <LinkButton
                to={`/conference/${conference.slug}/exhibition/${exhibition.id}`}
                w="100%"
                h="auto"
                minH="100%"
                py={8}
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
            >
                <Text whiteSpace="normal" px={5}>
                    {exhibition.name}
                </Text>
                <PageCountText path={`/conference/${conference.slug}/exhibition/${exhibition.id}`} />
            </LinkButton>
        </GridItem>
    );
}

export function ExhibitionsGrid(): JSX.Element {
    const conference = useConference();
    const exhibitionsResponse = useSelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const exhibitions = useMemo(
        () =>
            exhibitionsResponse.loading && !exhibitionsResponse.data
                ? undefined
                : [...(exhibitionsResponse.data?.collection_Exhibition ?? [])],
        [exhibitionsResponse.data, exhibitionsResponse.loading]
    );
    const sortedExhibitions = useMemo(() => exhibitions?.sort((x, y) => x.priority - y.priority), [exhibitions]);

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
    const exhibitionsResponse = useSelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const exhibitions = useMemo(
        () =>
            exhibitionsResponse.loading && !exhibitionsResponse.data
                ? undefined
                : [...(exhibitionsResponse.data?.collection_Exhibition ?? [])],
        [exhibitionsResponse.data, exhibitionsResponse.loading]
    );
    const sortedExhibitions = useMemo(() => exhibitions?.sort((x, y) => x.priority - y.priority), [exhibitions]);

    const title = useTitle("Exhibitions");

    return (
        <>
            {title}
            {sortedExhibitions === undefined ? (
                <CenteredSpinner spinnerProps={{ label: "Loading exhibitions" }} />
            ) : (
                <>
                    <Heading as="h1" id="page-heading" py={6}>
                        Exhibitions
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
