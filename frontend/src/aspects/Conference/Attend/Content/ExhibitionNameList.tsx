import { HStack, StackProps, Text, useColorMode, useColorModeValue, useToken } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import type { ExhibitionSummaryFragment, ItemExhibitionDataFragment } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useConference } from "../../useConference";

export default function ExhibitionNameList({
    exhibitions,
    ...props
}: { exhibitions: readonly ItemExhibitionDataFragment[]; noClick?: boolean } & StackProps): JSX.Element {
    const sortedExhibitions = useMemo(
        () => [...exhibitions].sort((x, y) => x.exhibition.priority - y.exhibition.priority),
        [exhibitions]
    );
    return (
        <HStack flexWrap="wrap" w="100%" {...props}>
            {sortedExhibitions.map((exhibition) => (
                <ExhibitionButton key={exhibition.id} exhibition={exhibition.exhibition} />
            ))}
        </HStack>
    );
}

function ExhibitionButton({ exhibition }: { exhibition: ExhibitionSummaryFragment }): JSX.Element {
    const conference = useConference();
    const borderColour = useColorModeValue(
        "ItemExhibitionLinkButton.borderColor-light",
        "ItemExhibitionLinkButton.borderColor-dark"
    );

    const { colorMode } = useColorMode();
    const baseBgColour =
        colorMode === "light"
            ? "ItemExhibitionLinkButton.defaultBackgroundColor-light"
            : "ItemExhibitionLinkButton.defaultBackgroundColor-dark";
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

    const textColour = bgColour_IsDark
        ? "ItemExhibitionLinkButton.textColor-light"
        : "ItemExhibitionLinkButton.textColor-dark";
    const textColour_Hover = bgColour_Hover_IsDark
        ? "ItemExhibitionLinkButton.textColor-Hover-light"
        : "ItemExhibitionLinkButton.textColor-Hover-dark";
    const textColour_Active = bgColour_Active_IsDark
        ? "ItemExhibitionLinkButton.textColor-Active-light"
        : "ItemExhibitionLinkButton.textColor-Active-dark";

    const shadow = useColorModeValue("md", "light-md");
    return (
        <LinkButton
            to={`/conference/${conference.slug}/exhibition/${exhibition.id}`}
            w="auto"
            h="auto"
            fontSize="sm"
            py={2}
            px={0}
            linkProps={{
                w: "auto",
                h: "auto",
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
        </LinkButton>
    );
}
