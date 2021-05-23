import { Wrap, WrapItem } from "@chakra-ui/react";
import React from "react";
import type { SponsorBoothsList_ItemFragment } from "../../../../../generated/graphql";
import SponsorTile from "./SponsorTile";

export default function SponsorsSummary({ sponsors }: { sponsors: SponsorBoothsList_ItemFragment[] }): JSX.Element {
    return sponsors.length > 0 ? (
        <Wrap spacing={4} w="100%" justify="center" overflow="hidden" pb={[2, 2, 4]}>
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
