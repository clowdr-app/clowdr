import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Badge, chakra, Grid, GridItem, GridProps, Link } from "@chakra-ui/react";
import React from "react";
import type { Registrant } from "../../useCurrentRegistrant";

export default function RegistrantExtraInfo({
    registrant,
    ...rest
}: { registrant: Registrant } & GridProps): JSX.Element {
    return (registrant.profile.timezoneUTCOffset !== undefined && registrant.profile.timezoneUTCOffset !== null) ||
        registrant.profile.country ||
        registrant.profile.website ||
        registrant.profile.twitter ||
        registrant.profile.github ? (
        <Grid gridTemplateColumns="auto auto" gap={4} alignSelf="flex-start" {...rest}>
            {registrant.profile.timezoneUTCOffset !== undefined && registrant.profile.timezoneUTCOffset !== null ? (
                <>
                    <GridItem fontWeight="600">Timezone</GridItem>
                    <GridItem>
                        <Badge fontSize="md" p={1}>
                            &nbsp; UTC{registrant.profile.timezoneUTCOffset < 0 ? "-" : "+"}
                            {Math.abs(registrant.profile.timezoneUTCOffset)}
                            &nbsp;&nbsp;
                        </Badge>
                    </GridItem>
                </>
            ) : undefined}
            {registrant.profile.country ? (
                <>
                    <GridItem fontWeight="600">Country</GridItem>
                    <GridItem overflowWrap="break-word">{registrant.profile.country}</GridItem>
                </>
            ) : undefined}
            {registrant.profile.website ? (
                <>
                    <GridItem fontWeight="600">Website</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link
                            isExternal
                            href={`${
                                !registrant.profile.website.toLowerCase().startsWith("http://") &&
                                !registrant.profile.website.toLowerCase().startsWith("https://")
                                    ? "https://"
                                    : ""
                            }${registrant.profile.website}`}
                            overflowWrap="anywhere"
                        >
                            {registrant.profile.website}
                            &nbsp;
                            <chakra.sup>
                                <ExternalLinkIcon />
                            </chakra.sup>
                        </Link>
                    </GridItem>
                </>
            ) : undefined}
            {registrant.profile.twitter ? (
                <>
                    <GridItem fontWeight="600">Twitter</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link
                            isExternal
                            href={`https://twitter.com/${registrant.profile.twitter}`}
                            overflowWrap="anywhere"
                        >
                            @{registrant.profile.twitter}
                            &nbsp;
                            <chakra.sup>
                                <ExternalLinkIcon />
                            </chakra.sup>
                        </Link>
                    </GridItem>
                </>
            ) : undefined}
            {registrant.profile.github ? (
                <>
                    <GridItem fontWeight="600">GitHub</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link
                            isExternal
                            href={`https://github.com/${registrant.profile.github}`}
                            overflowWrap="anywhere"
                        >
                            {registrant.profile.github}
                            &nbsp;
                            <chakra.sup>
                                <ExternalLinkIcon />
                            </chakra.sup>
                        </Link>
                    </GridItem>
                </>
            ) : undefined}
        </Grid>
    ) : (
        <></>
    );
}
