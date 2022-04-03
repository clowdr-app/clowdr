import { Box, Grid, Spacer, Text } from "@chakra-ui/react";
import type { ElementBlob, ElementDataBlob } from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import type {
    ElementDataFragment,
    ExhibitionItemFragment,
    ExhibitionWithContentFragment,
} from "../../../../generated/graphql";
import { Content_ElementType_Enum, useSelectExhibitionQuery } from "../../../../generated/graphql";
import Card from "../../../Card";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import { ExternalLinkButton, LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRealTime } from "../../../Hooks/useRealTime";
import PageCountText from "../../../Realtime/PageCountText";
import { maybeCompare } from "../../../Utils/maybeCompare";
import { AuthorList } from "../Content/AuthorList";
import { Element } from "../Content/Element/Element";
import TagList from "../Content/TagList";

function ItemTile({
    item,
    hideLiveViewButton,
}: {
    item: ExhibitionItemFragment;
    hideLiveViewButton: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();

    const primaryItems: ElementDataFragment[] = useMemo(() => {
        const sortOrder = [
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
            Content_ElementType_Enum.VideoUrl,
            Content_ElementType_Enum.PosterFile,
            Content_ElementType_Enum.PosterUrl,
            Content_ElementType_Enum.ImageFile,
            Content_ElementType_Enum.ImageUrl,
        ];

        return [...item.elements]
            .filter((x) => {
                if (!sortOrder.includes(x.typeName)) {
                    return false;
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName));
    }, [item.elements]);

    const secondaryItems: ElementDataFragment[] = useMemo(() => {
        const sortOrder =
            item.elements.reduce((acc, x) => (x.typeName === Content_ElementType_Enum.Abstract ? acc + 1 : acc), 0) ===
            1
                ? [Content_ElementType_Enum.Abstract]
                : [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Text];

        return [...item.elements]
            .filter((x) => {
                if (!sortOrder.includes(x.typeName)) {
                    return false;
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName));
    }, [item.elements]);

    const now = useRealTime(30000);
    const liveEvent = useMemo(() => {
        const liveEvents = item.events.filter(
            (x) => Date.parse(x.scheduledStartTime) <= now + 2 * 60 * 1000 && now <= Date.parse(x.scheduledEndTime)
        );
        return liveEvents.length > 0 ? liveEvents[0] : undefined;
    }, [item.events, now]);
    const liveRoomUrl = liveEvent ? `${conferencePath}/room/${liveEvent.roomId}` : undefined;

    const discussionRoomUrl = item.discussionRoom ? `${conferencePath}/room/${item.discussionRoom.id}` : undefined;
    const externalEventInfo = useMemo(() => {
        if (discussionRoomUrl) {
            return undefined;
        }

        const element = item.elements.find((x) => {
            if (x.typeName === Content_ElementType_Enum.ExternalEventLink) {
                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        default:
                            return false;
                    }
                }
                return false;
            }
            return false;
        });
        return element ? { name: element.name, url: element.data[element.data.length - 1].data.url } : undefined;
    }, [discussionRoomUrl, item.elements]);

    const itemUrl = `${conferencePath}/item/${item.id}`;

    const history = useHistory();
    return (
        <Card
            p={[1, 2, 4]}
            heading={item.title}
            to={itemUrl}
            topLeftButton={
                liveRoomUrl && !hideLiveViewButton
                    ? {
                          colorScheme: "LiveActionButton",
                          iconStyle: "s",
                          label: "Live now",
                          variant: "solid",
                          onClick: () => {
                              history.push(liveRoomUrl);
                          },
                      }
                    : undefined
            }
            editControls={[
                ...(discussionRoomUrl
                    ? [
                          <LinkButton
                              key="internal"
                              colorScheme="PrimaryActionButton"
                              to={discussionRoomUrl}
                              textDecoration="none"
                              onClick={(ev) => {
                                  ev.stopPropagation();
                              }}
                              borderRadius="2xl"
                              size="sm"
                          >
                              <FAIcon iconStyle="s" icon="video" mr={2} />
                              <Text as="span" ml={1} mr={2}>
                                  Join in room
                              </Text>
                              <PageCountText path={discussionRoomUrl} fontSize="inherit" />
                          </LinkButton>,
                      ]
                    : []),
                ...(externalEventInfo
                    ? [
                          <ExternalLinkButton
                              key="external"
                              colorScheme="PrimaryActionButton"
                              to={externalEventInfo.url}
                              textDecoration="none"
                              onClick={(ev) => {
                                  ev.stopPropagation();
                              }}
                              borderRadius="2xl"
                              size="sm"
                          >
                              <FAIcon iconStyle="s" icon="video" mr={2} />
                              <Text as="span" ml={1} mr={2}>
                                  Join in {externalEventInfo.name}
                              </Text>
                          </ExternalLinkButton>,
                      ]
                    : []),
            ]}
        >
            {primaryItems.length > 0 ? <Element element={primaryItems[0]} /> : undefined}
            {primaryItems.length > 1 ? (
                <LinkButton
                    to={itemUrl}
                    my={4}
                    colorScheme="PrimaryActionButton"
                    linkProps={{ alignSelf: "center" }}
                    onClick={(ev) => {
                        ev.stopPropagation();
                    }}
                >
                    <FAIcon iconStyle="s" icon="video" mr={2} />
                    View {primaryItems.length - 1} more videos and images
                </LinkButton>
            ) : undefined}
            <Box mt={primaryItems.length === 1 ? 4 : undefined}>
                {secondaryItems.map((item) => (
                    <Element key={item.id} element={item} />
                ))}
            </Box>
            <Box my={4}>
                <AuthorList programPeopleData={item.itemPeople} />
            </Box>
            {/* <Text>TODO: A marker to show if any of the authors are present</Text> */}
            <Spacer />
            <TagList tags={item.itemTags} />
        </Card>
    );
}

export default function ExhibitionLayout({
    exhibition,
    hideLiveViewButton,
}: {
    exhibition: ExhibitionWithContentFragment;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const sortedItems = useMemo(
        () => [...exhibition.items].sort((x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b)),
        [exhibition.items]
    );
    return (
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} mt={0} gap={[2, 2, 4]} w="100%">
            {sortedItems.map((item) => (
                <ItemTile key={item.id} item={item.item} hideLiveViewButton={hideLiveViewButton ?? false} />
            ))}
        </Grid>
    );
}

export function ExhibitionLayoutWrapper({
    exhibitionId,
    hideLiveViewButton,
}: {
    exhibitionId: string;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const [exhibitionResponse] = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
            includeAbstract: false,
            includeItemEvents: false,
        },
    });

    return exhibitionResponse.fetching && !exhibitionResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading exhibition" }} caller="ExhibitionLayout:307" />
    ) : exhibitionResponse.data?.collection_Exhibition_by_pk ? (
        <ExhibitionLayout
            exhibition={exhibitionResponse.data.collection_Exhibition_by_pk}
            hideLiveViewButton={hideLiveViewButton}
        />
    ) : (
        <></>
    );
}
