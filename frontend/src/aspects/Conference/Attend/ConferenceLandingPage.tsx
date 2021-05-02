import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    ElementType_Enum,
    ItemDataFragment,
    Permissions_Permission_Enum,
    useConferenceLandingPageItemQuery,
} from "../../../generated/graphql";
import ConferencePageNotFound from "../../Errors/ConferencePageNotFound";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { Element } from "./Content/Element/Element";

gql`
    query ConferenceLandingPageItem($conferenceId: uuid!) {
        content_Item(where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { typeName: { _eq: LANDING_PAGE } }] }) {
            ...ItemData
        }
    }
`;

function ConferenceLandingContent({ group }: { group: ItemDataFragment }): JSX.Element {
    const conferenceLandingContentSortOrder = [
        ElementType_Enum.Abstract,
        ElementType_Enum.VideoUrl,
        ElementType_Enum.Text,
        ElementType_Enum.PaperFile,
        ElementType_Enum.PaperLink,
        ElementType_Enum.PaperUrl,
        ElementType_Enum.PosterFile,
        ElementType_Enum.PosterUrl,
        ElementType_Enum.ImageFile,
        ElementType_Enum.ImageUrl,
        ElementType_Enum.Link,
        ElementType_Enum.LinkButton,
        ElementType_Enum.VideoBroadcast,
        ElementType_Enum.VideoCountdown,
        ElementType_Enum.VideoFile,
        ElementType_Enum.VideoFiller,
        ElementType_Enum.VideoLink,
        ElementType_Enum.VideoPrepublish,
        ElementType_Enum.VideoSponsorsFiller,
        ElementType_Enum.VideoTitles,
        ElementType_Enum.Zoom,
        ElementType_Enum.ItemList,
        ElementType_Enum.WholeSchedule,
    ];

    const elements = group.elements
        .map((item) => ({ el: <Element key={item.id} item={item} />, type: item.typeName }))
        .sort(
            (x, y) =>
                conferenceLandingContentSortOrder.indexOf(x.type) - conferenceLandingContentSortOrder.indexOf(y.type)
        );
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
        if (data && data.Item.length > 0) {
            return data.Item[0];
        }
        return null;
    }, [data]);

    const hasAbstract = useMemo(
        () =>
            group?.elements.some((item) => {
                if (item.typeName === ElementType_Enum.Abstract) {
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
            {!hasAbstract ? <Heading as="h1">{conference.shortName}</Heading> : undefined}
            <ConferenceLandingContent group={group} />
        </>
    );
}

export default function ConferenceLandingPage(): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<ConferencePageNotFound />}
        >
            <ConferenceLandingPageInner />
        </RequireAtLeastOnePermissionWrapper>
    );
}
