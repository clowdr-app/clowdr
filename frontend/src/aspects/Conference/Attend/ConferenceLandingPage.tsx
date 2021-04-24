import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    ContentGroupDataFragment,
    ContentType_Enum,
    Permission_Enum,
    useConferenceLandingPageContentGroupQuery,
} from "../../../generated/graphql";
import ConferencePageNotFound from "../../Errors/ConferencePageNotFound";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { ContentItem } from "./Content/Item/ContentItem";

gql`
    query ConferenceLandingPageContentGroup($conferenceId: uuid!) {
        ContentGroup(
            where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { contentGroupTypeName: { _eq: LANDING_PAGE } }] }
        ) {
            ...ContentGroupData
        }
    }
`;

function ConferenceLandingContent({ group }: { group: ContentGroupDataFragment }): JSX.Element {
    const conferenceLandingContentSortOrder = [
        ContentType_Enum.Abstract,
        ContentType_Enum.VideoUrl,
        ContentType_Enum.Text,
        ContentType_Enum.PaperFile,
        ContentType_Enum.PaperLink,
        ContentType_Enum.PaperUrl,
        ContentType_Enum.PosterFile,
        ContentType_Enum.PosterUrl,
        ContentType_Enum.ImageFile,
        ContentType_Enum.ImageUrl,
        ContentType_Enum.Link,
        ContentType_Enum.LinkButton,
        ContentType_Enum.VideoBroadcast,
        ContentType_Enum.VideoCountdown,
        ContentType_Enum.VideoFile,
        ContentType_Enum.VideoFiller,
        ContentType_Enum.VideoLink,
        ContentType_Enum.VideoPrepublish,
        ContentType_Enum.VideoSponsorsFiller,
        ContentType_Enum.VideoTitles,
        ContentType_Enum.Zoom,
        ContentType_Enum.ContentGroupList,
        ContentType_Enum.WholeSchedule,
    ];

    const elements = group.contentItems
        .map((item) => ({ el: <ContentItem key={item.id} item={item} />, type: item.contentTypeName }))
        .sort(
            (x, y) =>
                conferenceLandingContentSortOrder.indexOf(x.type) - conferenceLandingContentSortOrder.indexOf(y.type)
        );
    return <>{elements.map((x) => x.el)}</>;
}

function ConferenceLandingPageInner(): JSX.Element {
    const conference = useConference();

    const title = useTitle(conference.name);

    const { error, data } = useConferenceLandingPageContentGroupQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ConferenceLandingPage.tsx");

    const group = useMemo(() => {
        if (data && data.ContentGroup.length > 0) {
            return data.ContentGroup[0];
        }
        return null;
    }, [data]);

    const hasAbstract = useMemo(
        () =>
            group?.contentItems.some((item) => {
                if (item.contentTypeName === ContentType_Enum.Abstract) {
                    const data: ContentItemDataBlob = item.data;
                    if (
                        data.length > 0 &&
                        data[0].data.baseType === ContentBaseType.Text &&
                        data[0].data.text &&
                        data[0].data.text.trim() !== ""
                    ) {
                        return true;
                    }
                }
                return false;
            }),
        [group?.contentItems]
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
            {!hasAbstract ? <Heading as="h1">{conference.shortName}</Heading> : undefined}
            <ConferenceLandingContent group={group} />
        </>
    );
}

export default function ConferenceLandingPage(): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<ConferencePageNotFound />}
        >
            <ConferenceLandingPageInner />
        </RequireAtLeastOnePermissionWrapper>
    );
}
