import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, ContentBaseType } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";
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

    return (
        <Box alignItems="left" textAlign="left" my={5}>
            <Text colorScheme="green">{contentGroupData.contentGroupTypeName}</Text>
            <Heading as="h2" mb={5} textAlign="left">
                {contentGroupData.title}
            </Heading>
            {<AuthorList contentPeopleData={contentGroupData.people ?? []} />}
            <Container width="100%" mt={5} ml={0} pl={0}>
                {abstractContentItem}
            </Container>
        </Box>
    );
}
