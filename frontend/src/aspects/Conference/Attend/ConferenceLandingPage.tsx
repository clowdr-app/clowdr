import { gql } from "@apollo/client";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    Content_ElementType_Enum,
    Permissions_Permission_Enum,
    useConferenceLandingPageItemQuery,
} from "../../../generated/graphql";
import PageFailedToLoad from "../../Errors/PageFailedToLoad";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import ElementsGridLayout from "./Content/Element/ElementsGridLayout";

gql`
    query ConferenceLandingPageItem($conferenceId: uuid!) {
        content_Item(where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { typeName: { _eq: LANDING_PAGE } }] }) {
            ...ItemElements_ItemData
        }
    }
`;

function ConferenceLandingPageInner(): JSX.Element {
    const conference = useConference();

    const title = useTitle(conference.name);

    const { error, data } = useConferenceLandingPageItemQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ConferenceLandingPage.tsx");

    const item = useMemo(() => {
        if (data && data.content_Item.length > 0) {
            return data.content_Item[0];
        }
        return null;
    }, [data]);

    const hasAbstract = useMemo(
        () =>
            item?.elements.some((item) => {
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
        [item?.elements]
    );

    if (!item) {
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
                <Heading as="h1" id="page-heading" mt={2}>
                    {conference.shortName}
                </Heading>
            ) : (
                <Box h="0">&nbsp;</Box>
            )}
            <ElementsGridLayout elements={item.elements} textJustification="center" />
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
