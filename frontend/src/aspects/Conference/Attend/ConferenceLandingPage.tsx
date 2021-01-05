import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
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
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
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
    const elements: JSX.Element[] = [];
    for (const item of group.contentItems) {
        switch (item.contentTypeName) {
            case ContentType_Enum.Abstract:
                {
                    assertIsContentItemDataBlob(item.data);
                    const latestVersion = item.data[item.data.length - 1];
                    elements.splice(
                        0,
                        0,
                        <Box key={"item-" + item.id} mt={5} maxW={600}>
                            <Markdown>
                                {latestVersion?.data.baseType === ContentBaseType.Text ? latestVersion.data.text : ""}
                            </Markdown>
                        </Box>
                    );
                }
                break;
            case ContentType_Enum.ContentGroupList:
                {
                    elements.push(<ContentGroupList key={"item-" + item.id} />);
                }
                break;
        }
    }
    return <>{elements}</>;
}

function ConferenceLandingPageInner(): JSX.Element {
    const conference = useConference();

    const { error, data } = useConferenceLandingPageContentGroupQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error);

    const group = useMemo(() => {
        if (data && data.ContentGroup.length > 0) {
            return data.ContentGroup[0];
        }
        return null;
    }, [data]);

    const hasAbstract = useMemo(() => group?.contentItems.some(item => {
        if (item.contentTypeName === ContentType_Enum.Abstract) {
            const data: ContentItemDataBlob = item.data;
            if (data.length > 0 && data[0].data.baseType === ContentBaseType.Text && data[0].data.text && data[0].data.text.trim() !== "") {
                return true;
            }
        }
        return false;
    }), [group?.contentItems]);

    if (!group) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return (
            <PageFailedToLoad>
                Sorry, we were unable to load the page due to an unrecognised error. Please try again later or contact
                our support teams if this error persists.
            </PageFailedToLoad>
        );
    }

    return (
        <>
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
