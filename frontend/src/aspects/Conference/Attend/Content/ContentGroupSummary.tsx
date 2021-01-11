import { Box, Container, Heading, Text } from "@chakra-ui/react";
import {
    assertIsContentItemDataBlob,
    ContentBaseType,
    ContentItemDataBlob,
    ZoomBlob,
} from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";
import LinkButton from "../../../Chakra/LinkButton";
import { Markdown } from "../../../Text/Markdown";
import { AuthorList } from "./AuthorList";

export function ContentGroupSummary({ contentGroupData }: { contentGroupData: ContentGroupDataFragment }): JSX.Element {
    const abstractContentItem = useMemo(() => {
        const abstractItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Abstract
        );
        try {
            assertIsContentItemDataBlob(abstractItem?.data);
            const latestVersion = R.last(abstractItem.data);

            return (
                <Box mt={5}>
                    <Markdown>
                        {latestVersion?.data.baseType === ContentBaseType.Text ? latestVersion.data.text : ""}
                    </Markdown>
                </Box>
            );
        } catch (e) {
            return <></>;
        }
    }, [contentGroupData.contentItems]);

    const maybeZoomDetails = useMemo(() => {
        const zoomItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Zoom
        );

        if (!zoomItem) {
            return undefined;
        }

        const versions = zoomItem.data as ContentItemDataBlob;

        return (R.last(versions)?.data as ZoomBlob).url;
    }, [contentGroupData.contentItems]);

    return (
        <Box alignItems="left" textAlign="left" my={5}>
            <Text colorScheme="green">{contentGroupData.contentGroupTypeName}</Text>
            <Heading as="h2" size="md" mb={5} textAlign="left">
                {contentGroupData.title}
            </Heading>
            {<AuthorList contentPeopleData={contentGroupData.people ?? []} />}
            {maybeZoomDetails ? (
                <LinkButton to={maybeZoomDetails} isExternal={true} colorScheme="green" mt={5}>
                    Go to Zoom
                </LinkButton>
            ) : (
                <></>
            )}
            <Container width="100%" mt={5} ml={0} pl={0}>
                {abstractContentItem}
            </Container>
        </Box>
    );
}
