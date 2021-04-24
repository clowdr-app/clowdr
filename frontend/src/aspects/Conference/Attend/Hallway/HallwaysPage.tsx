import { gql } from "@apollo/client";
import { Grid, GridItem, Heading, Text, useColorMode, useColorModeValue, useToken } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import { HallwaySummaryFragment, useSelectAllHallwaysQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageCountText from "../../../Realtime/PageCountText";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";

gql`
    fragment HallwaySummary on Hallway {
        id
        name
        colour
        priority
    }

    query SelectAllHallways($conferenceId: uuid!) {
        Hallway(where: { conferenceId: { _eq: $conferenceId } }) {
            ...HallwaySummary
        }
    }
`;

function HallwayTile({ hallway }: { hallway: HallwaySummaryFragment }): JSX.Element {
    const conference = useConference();
    const borderColour = useColorModeValue("gray.300", "gray.600");

    const { colorMode } = useColorMode();
    const baseBgColour = colorMode === "light" ? "gray.200" : "gray.600";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(() => (Color(hallway.colour).getAlpha() !== 0 ? hallway.colour : baseGrey), [
        baseGrey,
        hallway.colour,
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

    return (
        <GridItem>
            <LinkButton
                to={`/conference/${conference.slug}/hallway/${hallway.id}`}
                w="100%"
                py={8}
                linkProps={{
                    w: "100%",
                    bgColor: bgColour.toRgbString(),
                    color: textColour,
                    border: "1px solid",
                    borderColor: borderColour,
                    _hover: {
                        bgColor: bgColour_Hover.toRgbString(),
                        color: textColour_Hover,
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
                <Text px={5}>{hallway.name}</Text>
                <PageCountText path={`/conference/${conference.slug}/hallway/${hallway.id}`} />
            </LinkButton>
        </GridItem>
    );
}

export default function HallwaysPage(): JSX.Element {
    const conference = useConference();
    const hallwaysResponse = useSelectAllHallwaysQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const hallways = useMemo(
        () =>
            hallwaysResponse.loading && !hallwaysResponse.data
                ? undefined
                : [...(hallwaysResponse.data?.Hallway ?? [])],
        [hallwaysResponse.data, hallwaysResponse.loading]
    );
    const sortedHallways = useMemo(() => hallways?.sort((x, y) => x.priority - y.priority), [hallways]);

    const title = useTitle("Hallways");

    return (
        <>
            {title}
            {sortedHallways === undefined ? (
                <CenteredSpinner spinnerProps={{ label: "Loading hallways" }} />
            ) : (
                <>
                    <Heading as="h1" py={6}>
                        Hallways
                    </Heading>
                    <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]} gap={4}>
                        {sortedHallways.map((hallway) => (
                            <HallwayTile key={hallway.id} hallway={hallway} />
                        ))}
                    </Grid>
                </>
            )}
        </>
    );
}
