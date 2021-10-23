import { Box, Center, Grid, GridItem, Image, Text, Tooltip } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import FAIcon from "../../../../Icons/FAIcon";
import { usePresenceState } from "../../../../Realtime/PresenceStateProvider";
import type { RegistrantIdSpec } from "../../../RegistrantsContext";
import { useRegistrants } from "../../../RegistrantsContext";
import { useConference } from "../../../useConference";
import type { Registrant } from "../../../useCurrentRegistrant";

export default function RoomPresenceGrid({ roomId, noGapFill }: { roomId: string; noGapFill?: boolean }): JSX.Element {
    const [userIds, setUserIds] = useState<RegistrantIdSpec[]>([]);
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const presence = usePresenceState();

    useEffect(() => {
        return presence.observePage(`${conferencePath}/room/${roomId}`, conference.slug, (ids) => {
            setUserIds([...ids.values()].map((x) => ({ user: x })));
        });
    }, [roomId, conference.slug, presence, conferencePath]);

    return userIds.length > 10 ? (
        <Text pb={2} textAlign="left" w="100%" px={4}>
            {userIds.length} {userIds.length === 1 ? " person is " : " people are "}here
        </Text>
    ) : (
        <RegistrantsGrid userIds={userIds} noGapFill={noGapFill} />
    );
}

function RegistrantTile({ registrant }: { registrant: Registrant }): JSX.Element {
    return (
        <Tooltip label={registrant.displayName}>
            {registrant.profile.photoURL_50x50 ? (
                <Image
                    w="50px"
                    h="50px"
                    aria-describedby={`registrant-trigger-${registrant.id}`}
                    src={registrant.profile.photoURL_50x50}
                    overflow="hidden"
                    alt={`Profile picture of ${registrant.displayName}`}
                />
            ) : (
                <Center w="50px" h="50px" flex="0 0 50px" ml={2}>
                    <FAIcon iconStyle="s" icon="cat" fontSize="30px" />
                </Center>
            )}
        </Tooltip>
    );
}

export function RegistrantsGrid({
    userIds,
    noGapFill,
}: {
    userIds: RegistrantIdSpec[];
    noGapFill?: boolean;
}): JSX.Element {
    const registrants = useRegistrants(userIds);
    const sortedRegistrants = useMemo(() => R.sortBy((x) => x.displayName, registrants), [registrants]);

    return sortedRegistrants.length > 0 ? (
        <Grid
            px="5px"
            pt={2}
            pb={4}
            gap="7px"
            templateColumns="repeat(auto-fill, 50px)"
            justifyContent="center"
            alignContent="flex-start"
            w="100%"
            maxH="200px"
            overflow="auto"
            css={{
                ["scrollbarWidth"]: "thin",
            }}
        >
            {sortedRegistrants.map((registrant) => (
                <GridItem key={registrant.id} w="50px">
                    <RegistrantTile registrant={registrant as Registrant} />
                </GridItem>
            ))}
        </Grid>
    ) : !noGapFill ? (
        <Box></Box>
    ) : (
        <></>
    );
}
