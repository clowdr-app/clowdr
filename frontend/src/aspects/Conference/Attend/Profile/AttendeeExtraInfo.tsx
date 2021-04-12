import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Badge, chakra, Grid, GridItem, GridProps, Link } from "@chakra-ui/react";
import React from "react";
import type { Attendee } from "../../useCurrentAttendee";

export default function AttendeeExtraInfo({ attendee, ...rest }: { attendee: Attendee } & GridProps): JSX.Element {
    return (attendee.profile.timezoneUTCOffset !== undefined && attendee.profile.timezoneUTCOffset !== null) ||
        attendee.profile.country ||
        attendee.profile.website ||
        attendee.profile.twitter ||
        attendee.profile.github ? (
        <Grid gridTemplateColumns="auto auto" gap={4} alignSelf="flex-start" {...rest}>
            {attendee.profile.timezoneUTCOffset !== undefined && attendee.profile.timezoneUTCOffset !== null ? (
                <>
                    <GridItem fontWeight="600">Timezone</GridItem>
                    <GridItem>
                        <Badge fontSize="md" p={1}>
                            &nbsp; UTC{attendee.profile.timezoneUTCOffset < 0 ? "-" : "+"}
                            {Math.abs(attendee.profile.timezoneUTCOffset)}
                            &nbsp;&nbsp;
                        </Badge>
                    </GridItem>
                </>
            ) : undefined}
            {attendee.profile.country ? (
                <>
                    <GridItem fontWeight="600">Country</GridItem>
                    <GridItem overflowWrap="break-word">{attendee.profile.country}</GridItem>
                </>
            ) : undefined}
            {attendee.profile.website ? (
                <>
                    <GridItem fontWeight="600">Website</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link isExternal href={`https://${attendee.profile.website}`} overflowWrap="anywhere">
                            {attendee.profile.website}
                            &nbsp;
                            <chakra.sup>
                                <ExternalLinkIcon />
                            </chakra.sup>
                        </Link>
                    </GridItem>
                </>
            ) : undefined}
            {attendee.profile.twitter ? (
                <>
                    <GridItem fontWeight="600">Twitter</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link
                            isExternal
                            href={`https://twitter.com/${attendee.profile.twitter}`}
                            overflowWrap="anywhere"
                        >
                            @{attendee.profile.twitter}
                            &nbsp;
                            <chakra.sup>
                                <ExternalLinkIcon />
                            </chakra.sup>
                        </Link>
                    </GridItem>
                </>
            ) : undefined}
            {attendee.profile.github ? (
                <>
                    <GridItem fontWeight="600">GitHub</GridItem>
                    <GridItem overflowWrap="anywhere">
                        <Link isExternal href={`https://github.com/${attendee.profile.github}`} overflowWrap="anywhere">
                            {attendee.profile.github}
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
