import { Wrap, WrapItem } from "@chakra-ui/react";
import React from "react";
import type { SponsorBoothsList_ItemFragment } from "../../../../../generated/graphql";
import SponsorTile from "./SponsorTile";

export default function SponsorsSummary({
    sponsors,
    leftAlign,
}: {
    sponsors: SponsorBoothsList_ItemFragment[];
    leftAlign?: boolean;
}): JSX.Element {
    return sponsors.length > 0 ? (
        <Wrap
            spacing={4}
            w="100%"
            justify={leftAlign ? "flex-start" : "center"}
            overflow="hidden"
            px={[1, 1, 3]}
            pb={[2, 2, 4]}
        >
            {sponsors.map((sponsor) => (
                <WrapItem key={sponsor.id} w="30%" minW="280px" maxW="300px">
                    <SponsorTile sponsor={sponsor} />
                </WrapItem>
            ))}
        </Wrap>
    ) : (
        <></>
    );
}
