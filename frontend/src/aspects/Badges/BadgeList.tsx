import { Box, BoxProps } from "@chakra-ui/react";
import React from "react";
import ProfileBadge, { BadgeData } from "./ProfileBadge";

export default function BadgeList({ badges, ...rest }: { badges: BadgeData[] } & BoxProps): JSX.Element {
    return (
        <Box fontSize="0.8rem" display="block" w="100%" {...rest}>
            {badges.map((badge) => (
                <ProfileBadge mb={2} mr={2} key={badge.name} badge={badge} />
            ))}
        </Box>
    );
}
