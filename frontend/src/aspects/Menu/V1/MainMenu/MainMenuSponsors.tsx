import { gql } from "@apollo/client";
import { Grid, GridItem, Image, List, ListItem, Text, useToken, VStack } from "@chakra-ui/react";
import type { ElementDataBlob} from "@clowdr-app/shared-types/build/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { MainMenuSponsors_ItemDataFragment} from "../../../../generated/graphql";
import { useMainMenuSponsors_GetSponsorsQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { Participants } from "../../../Conference/Attend/Rooms/V1/RoomParticipants";
import { useConference } from "../../../Conference/useConference";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import { maybeCompare } from "../../../Utils/maybeSort";

gql`
    query MainMenuSponsors_GetSponsors($conferenceId: uuid!) {
        content_Item(
            where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SPONSOR } }
            order_by: { title: asc }
        ) {
            ...MainMenuSponsors_ItemData
        }
    }

    fragment MainMenuSponsors_ItemData on content_Item {
        id
        rooms(limit: 1, order_by: { created_at: asc }, where: { conferenceId: { _eq: $conferenceId } }) {
            id
            priority
        }
        logo: elements(
            where: { typeName: { _in: [IMAGE_URL, IMAGE_FILE] }, layoutData: { _contains: { isLogo: true } } }
            order_by: { updatedAt: desc }
            limit: 1
        ) {
            id
            data
        }
        title
        shortTitle
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            id
            person {
                id
                registrantId
            }
            roleName
        }
    }
`;

export function MainMenuSponsors(): JSX.Element {
    const conference = useConference();

    const sponsorsResult = useMainMenuSponsors_GetSponsorsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const sponsorLogos = useMemo((): { [itemId: string]: string | null } => {
        function getLogoUrlFromData(data: any): string | null {
            if (isElementDataBlob(data)) {
                const blob = data as ElementDataBlob;
                const latestData = R.last(blob)?.data;

                if (latestData?.type === Content_ElementType_Enum.ImageUrl) {
                    return latestData.url;
                } else if (latestData?.type === Content_ElementType_Enum.ImageFile) {
                    try {
                        const { bucket, key } = new AmazonS3URI(latestData.s3Url);
                        return `https://s3.${
                            import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                        }.amazonaws.com/${bucket}/${key}`;
                    } catch {
                        return null;
                    }
                }
            }

            return null;
        }

        const pairs: [string, string | null][] =
            sponsorsResult.data?.content_Item.map((item) => [
                item.id,
                item.logo.length > 0 ? getLogoUrlFromData(item.logo[0].data) : null,
            ]) ?? [];
        return R.fromPairs(pairs);
    }, [sponsorsResult.data?.content_Item]);

    const borderColour = useToken("colors", ["gray.300"]);

    return (
        <ApolloQueryWrapper getter={(data) => data.content_Item} queryResult={sponsorsResult}>
            {(sponsorItems: readonly MainMenuSponsors_ItemDataFragment[]) => (
                <List>
                    {R.sortWith(
                        [
                            (x: MainMenuSponsors_ItemDataFragment, y: MainMenuSponsors_ItemDataFragment) =>
                                maybeCompare(
                                    x.rooms.reduce<number | null>(
                                        (acc, i) => (acc !== null ? Math.min(i.priority, acc) : i.priority),
                                        null
                                    ),
                                    y.rooms.reduce<number | null>(
                                        (acc, i) => (acc !== null ? Math.min(i.priority, acc) : i.priority),
                                        null
                                    ),
                                    (a, b) => a - b
                                ),
                            (x: MainMenuSponsors_ItemDataFragment, y: MainMenuSponsors_ItemDataFragment) =>
                                x.title.localeCompare(y.title),
                        ],
                        sponsorItems
                    ).map((sponsorItem) => {
                        const url = sponsorItem.rooms.length
                            ? `/conference/${conference.slug}/room/${sponsorItem.rooms[0].id}`
                            : `/conference/${conference.slug}/item/${sponsorItem.id}`;
                        return (
                            <ListItem key={sponsorItem.id} mb={2} h="auto" width="100%">
                                <LinkButton
                                    to={url}
                                    h="auto"
                                    width="100%"
                                    px={0}
                                    overflow="hidden"
                                    linkProps={{ h: "100%", w: "100%" }}
                                    border={`1px solid ${borderColour}`}
                                >
                                    <VStack w="100%">
                                        <Grid templateColumns="25% 75%" h="100%" w="100%">
                                            <GridItem minH="0" py={2} px={4} bgColor="white">
                                                {sponsorLogos[sponsorItem.id] ? (
                                                    <Image
                                                        src={sponsorLogos[sponsorItem.id] ?? undefined}
                                                        w="100%"
                                                        h="100%"
                                                        maxH="100%"
                                                        objectFit="contain"
                                                        alt={`${sponsorItem.title} logo`}
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
                                                px={2}
                                            >
                                                <Text fontSize="lg">
                                                    <Twemoji
                                                        className="twemoji"
                                                        text={
                                                            sponsorItem.shortTitle
                                                                ? sponsorItem.shortTitle
                                                                : sponsorItem.title
                                                        }
                                                    />
                                                </Text>
                                                <PageCountText path={url} />
                                            </GridItem>
                                        </Grid>
                                        {sponsorItem.rooms.length ? (
                                            <Participants
                                                px={2}
                                                pb={2}
                                                roomId={sponsorItem.rooms[0].id}
                                                highlightPeople={sponsorItem.itemPeople.map((x) => ({
                                                    registrantId: x.person.registrantId,
                                                    role: x.roleName,
                                                }))}
                                            />
                                        ) : undefined}
                                    </VStack>
                                </LinkButton>
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </ApolloQueryWrapper>
    );
}
