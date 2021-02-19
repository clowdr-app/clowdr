import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import {
    assertIsContentItemDataBlob,
    ContentBaseType,
    ContentItemDataBlob,
} from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import {
    ContentGroupDataFragment,
    ContentType_Enum,
    Permission_Enum,
    useConferenceLandingPageContentGroupQuery,
} from "../../../generated/graphql";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useNoPrimaryMenuButtons } from "../../Menu/usePrimaryMenuButtons";
import { Markdown } from "../../Text/Markdown";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { useConferenceCurrentUserActivePermissions } from "../useConferenceCurrentUserActivePermissions";
import ContentGroupList from "./Content/ContentGroupList";

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
    let elements: { el: JSX.Element; type: ContentType_Enum }[] = [];
    const conferenceLandingContentSortOrder = [
        ContentType_Enum.Abstract,
        ContentType_Enum.VideoUrl,
        ContentType_Enum.ContentGroupList,
    ];
    for (const item of group.contentItems) {
        switch (item.contentTypeName) {
            case ContentType_Enum.Abstract:
                {
                    assertIsContentItemDataBlob(item.data);
                    const latestVersion = item.data[item.data.length - 1];
                    elements.push({
                        el: (
                            <Box key={"item-" + item.id} mt={5} maxW={600} display="inline-block">
                                <Markdown>
                                    {latestVersion?.data.baseType === ContentBaseType.Text
                                        ? latestVersion.data.text
                                        : ""}
                                </Markdown>
                            </Box>
                        ),
                        type: item.contentTypeName,
                    });
                }
                break;
            case ContentType_Enum.VideoUrl:
                {
                    assertIsContentItemDataBlob(item.data);
                    const latestVersion = item.data[item.data.length - 1];
                    elements.push({
                        el: (
                            <Box maxW="100%">
                                <ReactPlayer
                                    style={{ maxWidth: "100%" }}
                                    url={
                                        latestVersion.data.baseType === ContentBaseType.URL
                                            ? latestVersion.data.url
                                            : ""
                                    }
                                    controls={true}
                                />
                            </Box>
                        ),
                        type: item.contentTypeName,
                    });
                }
                break;
            case ContentType_Enum.ContentGroupList:
                {
                    elements.push({ el: <ContentGroupList key={"item-" + item.id} />, type: item.contentTypeName });
                }
                break;
        }
    }
    elements = elements.sort(
        (x, y) => conferenceLandingContentSortOrder.indexOf(x.type) - conferenceLandingContentSortOrder.indexOf(y.type)
    );
    return <>{elements.map((x) => x.el)}</>;
}

function ConferenceLandingPageInner(): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();

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
    useNoPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <ConferenceLandingPageInner />
        </RequireAtLeastOnePermissionWrapper>
    );
}
