import { gql } from "@apollo/client";
import { Box, Flex, Heading, Spinner } from "@chakra-ui/react";
import {
    assertIsContentItemDataBlob,
    ContentBaseType,
    ContentItemDataBlob,
} from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    ContentGroupDataFragment,
    ContentType_Enum,
    Permission_Enum,
    useConferenceLandingPageContentGroupQuery,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import FAIcon from "../../Icons/FAIcon";
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
                        <Box key={"item-" + item.id} mt={5} maxW={600} display="inline-block">
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
    const activePermissions = useConferenceCurrentUserActivePermissions();

    const title = useTitle(conference.name);

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
            <Flex flexWrap="wrap" justifyContent="center">
                <LinkButton
                    mx={2}
                    mb={[2, 2, 4]}
                    to={`/conference/${conference.slug}/schedule`}
                    variant="outline"
                    size="lg"
                >
                    <FAIcon iconStyle="r" icon="calendar" mr={2} /> Schedule
                </LinkButton>
                {[
                    Permission_Enum.ConferenceViewAttendees,
                    Permission_Enum.ConferenceManageAttendees,
                    Permission_Enum.ConferenceManageGroups,
                    Permission_Enum.ConferenceManageRoles,
                ].some((permission) => activePermissions.has(permission)) ? (
                    <LinkButton
                        mx={2}
                        mb={[2, 2, 4]}
                        to={`/conference/${conference.slug}/attendees`}
                        variant="outline"
                        size="lg"
                    >
                        <FAIcon iconStyle="s" icon="users" mr={2} /> Attendees
                    </LinkButton>
                ) : undefined}
                {[
                    Permission_Enum.ConferenceViewAttendees,
                    Permission_Enum.ConferenceManageSchedule,
                ].some((permission) => activePermissions.has(permission)) ? (
                    <LinkButton
                        mx={2}
                        mb={[2, 2, 4]}
                        to={`/conference/${conference.slug}/rooms`}
                        variant="outline"
                        size="lg"
                    >
                        <FAIcon iconStyle="s" icon="mug-hot" mr={2} /> Rooms
                    </LinkButton>
                ) : undefined}
                {[
                    Permission_Enum.ConferenceViewAttendees,
                    Permission_Enum.ConferenceManageSchedule,
                    Permission_Enum.ConferenceModerateAttendees,
                    Permission_Enum.ConferenceManageAttendees,
                ].some((permission) => activePermissions.has(permission)) ? (
                    <LinkButton
                        mx={2}
                        mb={[2, 2, 4]}
                        to={`/conference/${conference.slug}/shuffle`}
                        variant="outline"
                        size="lg"
                    >
                        <FAIcon iconStyle="s" icon="mug-hot" mr={2} /> Shuffle Rooms
                    </LinkButton>
                ) : undefined}
            </Flex>
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
