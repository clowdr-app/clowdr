import { gql } from "@apollo/client";
import { Grid, GridItem, Image, List, ListItem, Text, useToken } from "@chakra-ui/react";
import { ContentItemDataBlob, ContentType_Enum, isContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import {
    MainMenuSponsors_ContentGroupDataFragment,
    useMainMenuSponsors_GetSponsorsQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { useConference } from "../Conference/useConference";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import FAIcon from "../Icons/FAIcon";
import PageCountText from "../Presence/PageCountText";

gql`
    query MainMenuSponsors_GetSponsors($conferenceId: uuid!) {
        ContentGroup(
            where: { conferenceId: { _eq: $conferenceId }, contentGroupTypeName: { _eq: SPONSOR } }
            order_by: { title: asc }
        ) {
            ...MainMenuSponsors_ContentGroupData
        }
    }

    fragment MainMenuSponsors_ContentGroupData on ContentGroup {
        id
        rooms(limit: 1, order_by: { created_at: asc }, where: { conferenceId: { _eq: $conferenceId } }) {
            id
        }
        logo: contentItems(
            where: { contentTypeName: { _eq: IMAGE_URL }, layoutData: { _contains: { isLogo: true } } }
            order_by: { updatedAt: desc }
            limit: 1
        ) {
            id
            data
        }
        title
    }
`;

export function MainMenuSponsors(): JSX.Element {
    const conference = useConference();

    const sponsorsResult = useMainMenuSponsors_GetSponsorsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const sponsorLogos = useMemo((): { [contentGroupId: string]: string | null } => {
        function getLogoUrlFromData(data: any): string | null {
            if (isContentItemDataBlob(data)) {
                const blob = data as ContentItemDataBlob;
                const latestData = R.last(blob)?.data;

                if (latestData?.type === ContentType_Enum.ImageUrl) {
                    return latestData.url;
                }
            }

            return null;
        }

        const pairs: [string, string | null][] =
            sponsorsResult.data?.ContentGroup.map((contentGroup) => [
                contentGroup.id,
                contentGroup.logo.length > 0 ? getLogoUrlFromData(contentGroup.logo[0].data) : null,
            ]) ?? [];
        return R.fromPairs(pairs);
    }, [sponsorsResult.data?.ContentGroup]);

    const borderColour = useToken("colors", ["gray.300"]);

    return (
        <ApolloQueryWrapper getter={(data) => data.ContentGroup} queryResult={sponsorsResult}>
            {(sponsorContentGroups: readonly MainMenuSponsors_ContentGroupDataFragment[]) => (
                <>
                    <List>
                        {sponsorContentGroups.map((sponsorContentGroup) => {
                            const url = sponsorContentGroup.rooms.length
                                ? `/conference/${conference.slug}/room/${sponsorContentGroup.rooms[0].id}`
                                : `/conference/${conference.slug}/item/${sponsorContentGroup.id}`;
                            return (
                                <ListItem key={sponsorContentGroup.id} mb={2} h={12} width="100%">
                                    <LinkButton
                                        to={url}
                                        h="100%"
                                        width="100%"
                                        pl={0}
                                        overflow="hidden"
                                        linkProps={{ h: "100%", w: "100%" }}
                                        border={`1px solid ${borderColour}`}
                                    >
                                        <Grid templateColumns="25% 75%" columnGap={4} h="100%" w="100%" pr={4}>
                                            <GridItem minH="0" py={2} px={4} bgColor="white">
                                                {sponsorLogos[sponsorContentGroup.id] ? (
                                                    <Image
                                                        src={sponsorLogos[sponsorContentGroup.id] ?? undefined}
                                                        w="100%"
                                                        h="100%"
                                                        maxH="100%"
                                                        objectFit="contain"
                                                    />
                                                ) : (
                                                    <FAIcon icon="cat" iconStyle="s" />
                                                )}
                                            </GridItem>
                                            <GridItem
                                                minH="0"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="space-between"
                                            >
                                                <Text fontSize="lg">{sponsorContentGroup.title}</Text>
                                                <PageCountText width="10%" path={url} />
                                            </GridItem>
                                        </Grid>
                                    </LinkButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </>
            )}
        </ApolloQueryWrapper>
    );
}
