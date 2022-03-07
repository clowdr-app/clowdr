import { Box, Divider, Heading, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { SponsorBoothsList_ItemFragment, SponsorBoothsList_TierFragment } from "../../../../generated/graphql";
import { Markdown } from "../../../Chakra/Markdown";
import SponsorTile from "./SponsorTile";

export interface SponsorshipTier {
    info?: SponsorBoothsList_TierFragment;
    members: SponsorBoothsList_ItemFragment[];
}

const minSizes = ["280px", "260px", "240px", "220px"];
const maxSizes = ["300px", "275px", "250px", "225px"];

export default function SponsorsSummary({
    sponsors,
    leftAlign,
}: {
    sponsors: SponsorshipTier[];
    leftAlign?: boolean;
}): JSX.Element {
    const nonEmptyTiers = useMemo(() => sponsors.filter((x) => x.members.length > 0), [sponsors]);
    return nonEmptyTiers.length > 0 ? (
        <VStack w="100%" px={[1, 1, 3]} spacing={8} alignItems={leftAlign ? "flex-start" : undefined}>
            {nonEmptyTiers.map((tier, idx) => (
                <VStack key={tier.info?.id ?? "untiered"} alignItems={leftAlign ? "flex-start" : undefined} w="100%">
                    {tier.info ? (
                        <>
                            <Heading pl={1} as="h3" fontSize="xl" textAlign={leftAlign ? "left" : undefined}>
                                {tier.info.name}
                            </Heading>
                            {tier.info.description?.length ? (
                                <Box pl={1} textAlign={leftAlign ? "left" : "center"}>
                                    <Markdown>{tier.info.description}</Markdown>
                                </Box>
                            ) : undefined}{" "}
                        </>
                    ) : undefined}
                    <Wrap spacing={4} pb={5} w="100%" justify={leftAlign ? "flex-start" : "center"} overflow="hidden">
                        {tier.members.map((sponsor) => (
                            <WrapItem
                                key={sponsor.id}
                                w="30%"
                                minW={minSizes[tier.info?.size ?? minSizes.length - 1]}
                                maxW={maxSizes[tier.info?.size ?? maxSizes.length - 1]}
                            >
                                <SponsorTile sponsor={sponsor} showLogo={tier.info?.showLogos} />
                            </WrapItem>
                        ))}
                    </Wrap>
                    {idx < nonEmptyTiers.length - 1 ? <Divider /> : undefined}
                </VStack>
            ))}
        </VStack>
    ) : (
        <></>
    );
}
