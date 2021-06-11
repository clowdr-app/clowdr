import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useMemo } from "react";
import {
    Content_ElementType_Enum,
    ItemElements_ItemDataFragment,
    Permissions_Permission_Enum,
    useConferenceLandingPageItemQuery,
} from "../../../generated/graphql";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { maybeCompare } from "../../Utils/maybeSort";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { Element } from "./Content/Element/Element";

gql`
    query ConferenceLandingPageItem($conferenceId: uuid!) {
        content_Item(where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { typeName: { _eq: LANDING_PAGE } }] }) {
            ...ItemElements_ItemData
        }
    }
`;

function ConferenceLandingContent({ group }: { group: ItemElements_ItemDataFragment }): JSX.Element {
    const conferenceLandingContentSortOrder = [
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
        Content_ElementType_Enum.VideoBroadcast,
        Content_ElementType_Enum.VideoCountdown,
        Content_ElementType_Enum.VideoFile,
        Content_ElementType_Enum.VideoFiller,
        Content_ElementType_Enum.VideoLink,
        Content_ElementType_Enum.VideoPrepublish,
        Content_ElementType_Enum.VideoSponsorsFiller,
        Content_ElementType_Enum.VideoTitles,
        Content_ElementType_Enum.Zoom,
        Content_ElementType_Enum.ContentGroupList,
        Content_ElementType_Enum.WholeSchedule,
        Content_ElementType_Enum.ExploreProgramButton,
        Content_ElementType_Enum.ExploreScheduleButton,
    ];

    const elements = group.elements
        .map((item) => ({
            el: <Element key={item.id} element={item} />,
            type: item.typeName,
            priority: (item.layoutData as LayoutDataBlob | undefined)?.priority,
        }))
        .sort(
            (x, y) =>
                conferenceLandingContentSortOrder.indexOf(x.type) - conferenceLandingContentSortOrder.indexOf(y.type)
        )
        .sort((x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b));
    return <>{elements.map((x) => x.el)}</>;
}

function ConferenceLandingPageInner(): JSX.Element {
    const conference = useConference();

    const title = useTitle(conference.name);

    const { error, data } = useConferenceLandingPageItemQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ConferenceLandingPage.tsx");

    const group = useMemo(() => {
        if (data && data.content_Item.length > 0) {
            return data.content_Item[0];
        }
        return null;
    }, [data]);

    const hasAbstract = useMemo(
        () =>
            group?.elements.some((item) => {
                if (item.typeName === Content_ElementType_Enum.Abstract) {
                    const data: ElementDataBlob = item.data;
                    if (
                        data.length > 0 &&
                        data[0].data.baseType === ElementBaseType.Text &&
                        data[0].data.text &&
                        data[0].data.text.trim() !== ""
                    ) {
                        return true;
                    }
                }
                return false;
            }),
        [group?.elements]
    );

    if (!group) {
        return (
            <Box>
                {title}
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return (
            <>
                {title}
                <PageFailedToLoad>
                    Sorry, we were unable to load the page due to an unrecognised error. Please try again later or
                    contact our support teams if this error persists.
                </PageFailedToLoad>
            </>
        );
    }

    return (
        <>
            {title}
            {!hasAbstract ? (
                <Heading as="h1" id="page-heading">
                    {conference.shortName}
                </Heading>
            ) : undefined}
            <ConferenceLandingContent group={group} />
        </>
    );
}

export default function ConferenceLandingPage(): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permissions_Permission_Enum.ConferenceView,
                Permissions_Permission_Enum.ConferenceManageContent,
            ]}
            componentIfDenied={<PageNotFound />}
        >
            <ConferenceLandingPageInner />
        </RequireAtLeastOnePermissionWrapper>
    );
}
