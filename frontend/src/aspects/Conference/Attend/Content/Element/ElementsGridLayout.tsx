import { Grid, GridItem } from "@chakra-ui/react";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import React, { useMemo } from "react";
import type { ElementDataFragment } from "../../../../../generated/graphql";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";
import useIsNarrowView from "../../../../Hooks/useIsNarrowView";
import useIsVeryNarrowView from "../../../../Hooks/useIsVeryNarrowView";
import { Element } from "../Element/Element";

export const contentSortOrder = [
    Content_ElementType_Enum.VideoBroadcast,
    Content_ElementType_Enum.VideoCountdown,
    Content_ElementType_Enum.VideoFile,
    Content_ElementType_Enum.VideoFiller,
    Content_ElementType_Enum.VideoLink,
    Content_ElementType_Enum.VideoPrepublish,
    Content_ElementType_Enum.VideoSponsorsFiller,
    Content_ElementType_Enum.VideoTitles,
    Content_ElementType_Enum.Abstract,
    Content_ElementType_Enum.VideoUrl,
    Content_ElementType_Enum.LiveProgramRooms,
    Content_ElementType_Enum.ActiveSocialRooms,
    Content_ElementType_Enum.Divider,
    Content_ElementType_Enum.SponsorBooths,
    Content_ElementType_Enum.Text,
    Content_ElementType_Enum.PaperFile,
    Content_ElementType_Enum.PaperLink,
    Content_ElementType_Enum.PaperUrl,
    Content_ElementType_Enum.PosterFile,
    Content_ElementType_Enum.PosterUrl,
    Content_ElementType_Enum.ImageFile,
    Content_ElementType_Enum.ImageUrl,
    Content_ElementType_Enum.Link,
    Content_ElementType_Enum.LinkButton,
    Content_ElementType_Enum.Zoom,
    Content_ElementType_Enum.ContentGroupList,
    Content_ElementType_Enum.WholeSchedule,
    Content_ElementType_Enum.ExploreProgramButton,
    Content_ElementType_Enum.ExploreScheduleButton,
];

export default function ElementsGridLayout({
    elements,
    textJustification = "flex-start",
}: {
    elements: readonly ElementDataFragment[];
    textJustification?: "flex-start" | "center";
}): JSX.Element {
    const isNarrowView = useIsNarrowView();
    const isVeryNarrowView = useIsVeryNarrowView();

    const columns = isVeryNarrowView ? 1 : isNarrowView ? 4 : 12;
    const divisor = 12 / columns;
    const els = useMemo(() => {
        return [...elements]
            .filter((element) => {
                const layoutBlob = element.layoutData as LayoutDataBlob | undefined;
                return (
                    !element.isHidden &&
                    !(layoutBlob?.contentType === Content_ElementType_Enum.ImageFile && layoutBlob?.isLogo) &&
                    !(layoutBlob?.contentType === Content_ElementType_Enum.ImageUrl && layoutBlob?.isLogo)
                );
            })
            .sort((x, y) => contentSortOrder.indexOf(x.typeName) - contentSortOrder.indexOf(y.typeName))
            .sort((x, y) => {
                const xLayout = x.layoutData as LayoutDataBlob | undefined;
                const yLayout = y.layoutData as LayoutDataBlob | undefined;
                if (xLayout) {
                    if (yLayout) {
                        if (xLayout.position) {
                            if (yLayout.position) {
                                return (
                                    xLayout.position.row - yLayout.position.row ||
                                    xLayout.position.column - yLayout.position.column
                                );
                            } else {
                                return -1;
                            }
                        } else {
                            if (yLayout.position) {
                                return 1;
                            }
                        }

                        if (xLayout.priority !== undefined) {
                            if (yLayout.priority !== undefined) {
                                return xLayout.priority - yLayout.priority;
                            }
                            return -1;
                        } else {
                            if (yLayout.priority !== undefined) {
                                return 1;
                            }
                            return 0;
                        }
                    } else {
                        return -1;
                    }
                } else {
                    if (yLayout) {
                        return 1;
                    }
                    return 0;
                }
            })
            .map((element) => {
                const layoutBlob = element.layoutData as LayoutDataBlob | undefined;

                return (
                    <GridItem
                        minW={0}
                        overflowX="auto"
                        key={element.id}
                        colSpan={Math.max(
                            1,
                            Math.round(
                                !layoutBlob
                                    ? columns
                                    : layoutBlob.size
                                    ? layoutBlob.size.columns / divisor
                                    : layoutBlob.wide
                                    ? columns
                                    : columns / 2
                            )
                        )}
                        rowSpan={!layoutBlob ? 1 : layoutBlob.size ? layoutBlob.size.rows : 1}
                        p={4}
                        display="flex"
                        justifyContent={
                            element.typeName === Content_ElementType_Enum.Abstract ||
                            element.typeName === Content_ElementType_Enum.Text
                                ? textJustification
                                : "center"
                        }
                    >
                        <Element element={element} />
                    </GridItem>
                );
            });
    }, [columns, divisor, elements, textJustification]);

    return (
        <Grid gridTemplateColumns={`repeat(${columns}, 1fr)`} ml={0} mr={3} w="100%">
            {els}
        </Grid>
    );
}
