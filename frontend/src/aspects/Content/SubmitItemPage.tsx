import { gql } from "@apollo/client";
import {
    Box,
    Center,
    Container,
    Divider,
    Heading,
    ListItem,
    Spinner,
    Text,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import "@uppy/core/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import React, { useCallback, useMemo } from "react";
import {
    ContentType_Enum,
    useGetContentItemQuery,
    useGetUploadAgreementQuery,
    useSelectRequiredItemQuery,
} from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { useNoPrimaryMenuButtons } from "../Menu/usePrimaryMenuButtons";
import { useTitle } from "../Utils/useTitle";
import UploadedContentItem from "./UploadedContentItem";
import UploadFileForm from "./UploadFileForm";
import UploadLinkForm from "./UploadLinkForm";
import UploadTextForm from "./UploadTextForm";
import UploadUrlForm from "./UploadUrlForm";

gql`
    query GetContentItem($magicToken: String!) {
        getContentItem(magicToken: $magicToken) {
            contentTypeName
            data
            layoutData
            name
            id
            contentGroupTitle
        }
    }

    query SelectRequiredItem($requiredContentItemId: uuid!) {
        RequiredContentItem(where: { id: { _eq: $requiredContentItemId } }) {
            ...RequiredItemFields
        }
    }

    fragment RequiredItemFields on RequiredContentItem {
        id
        contentTypeName
        name
        uploadsRemaining
        conference {
            id
            name
        }
        contentGroupTitle
    }

    mutation SubmitContentItem($contentItemData: jsonb!, $magicToken: String!) {
        submitContentItem(data: $contentItemData, magicToken: $magicToken) {
            message
            success
        }
    }

    query GetUploadAgreement($magicToken: String!) {
        getUploadAgreement(magicToken: $magicToken) {
            agreementText
        }
    }
`;

export default function SubmitItemPage({
    magicToken,
    requiredContentItemId,
}: {
    magicToken: string;
    requiredContentItemId: string;
}): JSX.Element {
    useNoPrimaryMenuButtons();

    const { loading, error, data, refetch } = useSelectRequiredItemQuery({
        fetchPolicy: "network-only",
        context: {
            headers: {
                "x-hasura-magic-token": magicToken,
            },
        },
        variables: {
            requiredContentItemId,
        },
    });
    const {
        loading: uploadAgreementLoading,
        error: uploadAgreementError,
        data: uploadAgreementData,
    } = useGetUploadAgreementQuery({
        fetchPolicy: "network-only",
        variables: {
            magicToken,
        },
    });
    useQueryErrorToast(error, "SubmitItemPage -- upload agreement");

    const {
        loading: loadingContentItem,
        error: errorContentItem,
        data: dataContentItem,
        refetch: refetchContentItem,
    } = useGetContentItemQuery({
        variables: {
            magicToken,
        },
        fetchPolicy: "network-only",
    });
    useQueryErrorToast(error, "SubmitItemPage -- content item");

    const requiredItem = useMemo(() => {
        if (!data?.RequiredContentItem || data.RequiredContentItem.length !== 1) {
            return null;
        }

        return data.RequiredContentItem[0];
    }, [data]);

    const title = useTitle(requiredItem?.contentGroupTitle ? `Submit ${requiredItem.contentGroupTitle}` : "Clowdr");

    const uploadAgreement = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementText ?? undefined;
    }, [uploadAgreementData]);

    const formSubmitted = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const form = useMemo(() => {
        if (!requiredItem) {
            return <>No matching item found.</>;
        }

        switch (requiredItem.contentTypeName) {
            case ContentType_Enum.Abstract:
            case ContentType_Enum.Text:
                return <UploadTextForm magicToken={magicToken} uploadAgreement={uploadAgreement} />;
            case ContentType_Enum.ImageFile:
            case ContentType_Enum.PaperFile:
            case ContentType_Enum.PosterFile:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        requiredItem={requiredItem}
                        allowedFileTypes={[".pdf", ".png", ".jpg"]}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ContentType_Enum.Link:
            case ContentType_Enum.LinkButton:
            case ContentType_Enum.PaperLink:
            case ContentType_Enum.VideoLink:
                return (
                    <UploadLinkForm
                        magicToken={magicToken}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ContentType_Enum.ImageUrl:
            case ContentType_Enum.PaperUrl:
            case ContentType_Enum.PosterUrl:
            case ContentType_Enum.VideoUrl:
                return (
                    <UploadUrlForm
                        magicToken={magicToken}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ContentType_Enum.VideoBroadcast:
            case ContentType_Enum.VideoCountdown:
            case ContentType_Enum.VideoFile:
            case ContentType_Enum.VideoFiller:
            case ContentType_Enum.VideoPrepublish:
            case ContentType_Enum.VideoSponsorsFiller:
            case ContentType_Enum.VideoTitles:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        requiredItem={requiredItem}
                        allowedFileTypes={[".mp4", ".mkv", ".webm"]}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
        }
    }, [formSubmitted, magicToken, requiredItem, uploadAgreement]);

    return (
        <Center>
            {title}
            <VStack spacing={4}>
                <Container centerContent maxW="100%">
                    <VStack spacing={4}>
                        <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                            Content Submission
                        </Heading>
                        {requiredItem && (
                            <Heading as="h2" fontSize="1.5rem" lineHeight="2.2rem" fontStyle="italic">
                                {requiredItem.contentGroupTitle}
                            </Heading>
                        )}
                        {(loading && !data) || (uploadAgreementLoading && !uploadAgreementData) ? (
                            <div>
                                <Spinner />
                            </div>
                        ) : error || uploadAgreementError ? (
                            <Text mt={4}>An error occurred while loading data.</Text>
                        ) : !requiredItem ? (
                            <Text mt={4}>No matching item.</Text>
                        ) : (
                            <>
                                <Heading as="h3" fontSize="1.2rem" mt={5}>
                                    Upload: {requiredItem.name}
                                </Heading>
                                {requiredItem.uploadsRemaining === 0 ? (
                                    <Text mt={4}>
                                        No upload attempts remaining for this item. Please contact your conference
                                        organisers if you need to upload another version.
                                    </Text>
                                ) : (
                                    <>
                                        {requiredItem.contentTypeName === ContentType_Enum.VideoBroadcast ? (
                                            <Box>
                                                <UnorderedList>
                                                    {requiredItem.uploadsRemaining ? (
                                                        <ListItem>
                                                            {requiredItem.uploadsRemaining} upload attempt
                                                            {requiredItem.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        This video will be live streamed during the conference just
                                                        prior to your Q&amp;A session.
                                                    </ListItem>
                                                    <ListItem>Maximum 5 minute video duration</ListItem>
                                                    <ListItem>Maximum 1080p video quality</ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        {requiredItem.contentTypeName === ContentType_Enum.VideoPrepublish ? (
                                            <Box>
                                                <UnorderedList>
                                                    {requiredItem.uploadsRemaining ? (
                                                        <ListItem>
                                                            {requiredItem.uploadsRemaining} upload attempt
                                                            {requiredItem.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        This video will be made publicly available around the 11th of
                                                        January.
                                                    </ListItem>
                                                    <ListItem>Maximum 30 minute video duration</ListItem>
                                                    <ListItem>Maximum 1080p video quality</ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        <Center>{form}</Center>
                                    </>
                                )}
                                <Divider />
                                <VStack spacing={4}>
                                    <Heading as="h3" fontSize="1.2rem">
                                        Previously uploaded
                                    </Heading>
                                    <UploadedContentItem
                                        magicToken={magicToken}
                                        data={dataContentItem}
                                        error={!!errorContentItem}
                                        loading={loadingContentItem}
                                        refetch={refetchContentItem}
                                    />
                                </VStack>
                            </>
                        )}
                    </VStack>
                </Container>
            </VStack>
        </Center>
    );
}
