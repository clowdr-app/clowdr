import { Container, Heading, Text } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, ContentBaseType } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";
import { AuthorList } from "./AuthorList";

export default function ContentGroupSummary({
    contentGroupData,
}: {
    contentGroupData: ContentGroupDataFragment;
}): JSX.Element {
    const abstractContentItem = useMemo(() => {
        const abstractItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Abstract
        );
        try {
            assertIsContentItemDataBlob(abstractItem?.data);
            const latestVersion = R.last(abstractItem.data);

            return (
                <Text mt={5}>
                    {latestVersion?.data.baseType === ContentBaseType.Text ? latestVersion.data.text : ""}
                </Text>
            );
        } catch (e) {
            return <></>;
        }
    }, [contentGroupData.contentItems]);

    return (
        <Container textAlign="left" width="100%" alignItems="left" mt={5} ml={0}>
            <Heading as="h2" textAlign="left" mb={5}>
                {contentGroupData.title}
            </Heading>
            {<AuthorList contentPeopleData={contentGroupData.people ?? []} />}
            {abstractContentItem}
        </Container>
    );
}
