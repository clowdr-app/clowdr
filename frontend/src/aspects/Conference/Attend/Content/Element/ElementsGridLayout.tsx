import { Grid, GridItem } from "@chakra-ui/react";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useMemo } from "react";
import type { ElementDataFragment } from "../../../../../generated/graphql";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";
import { maybeCompare } from "../../../../Utils/maybeSort";
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
    const els = useMemo(() => {
        return [...elements]
            .filter((element) => {
                const layoutBlob = element.layoutData as LayoutDataBlob | undefined;
                return (
                    !layoutBlob?.hidden &&
                    !(layoutBlob?.contentType === Content_ElementType_Enum.ImageFile && layoutBlob?.isLogo) &&
                    !(layoutBlob?.contentType === Content_ElementType_Enum.ImageUrl && layoutBlob?.isLogo)
                );
            })
            .sort((x, y) => contentSortOrder.indexOf(x.typeName) - contentSortOrder.indexOf(y.typeName))
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            )
            .map((element) => {
                const layoutBlob = element.layoutData as LayoutDataBlob | undefined;

                return (
                    <GridItem
                        minW={0}
                        overflowX="auto"
                        key={element.id}
                        colSpan={!layoutBlob || layoutBlob.wide ? [2] : [2, 2, 1]}
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
    }, [elements, textJustification]);

    return (
        <Grid gridTemplateColumns="50% 50%" ml={0} mr={3} gridColumnGap={5}>
            {els}
        </Grid>
    );
}
