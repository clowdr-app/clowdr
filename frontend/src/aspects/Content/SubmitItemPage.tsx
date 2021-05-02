import { gql } from "@apollo/client";
import {
    Box,
    Center,
    Container,
    Divider,
    Heading,
    Link,
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
    ElementType_Enum,
    useGetElementQuery,
    useGetUploadAgreementQuery,
    useSelectUploadableItemQuery,
} from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { useTitle } from "../Utils/useTitle";
import UploadedElement from "./UploadedElement";
import UploadFileForm from "./UploadFileForm";
import UploadLinkForm from "./UploadLinkForm";
import UploadTextForm from "./UploadTextForm";
import UploadUrlForm from "./UploadUrlForm";

gql`
    query GetElement($magicToken: String!) {
        content_ElementByAccessToken(where: { accessToken: { _eq: $magicToken } }) {
            typeName
            data
            layoutData
            name
            id
            itemTitle
        }
    }

    query SelectUploadableItem($uploadableId: uuid!) {
        content_UploadableElement(where: { id: { _eq: $uploadableId } }) {
            ...UploadableItemFields
        }
    }

    fragment UploadableItemFields on content_UploadableElement {
        id
        typeName
        name
        uploadsRemaining
        conference {
            id
            name
        }
        itemTitle
    }

    mutation submitUploadableElement($elementData: jsonb!, $magicToken: String!) {
        submitUploadableElement(data: $elementData, magicToken: $magicToken) {
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
    uploadableId,
}: {
    magicToken: string;
    uploadableId: string;
}): JSX.Element {
    const { loading, error, data, refetch } = useSelectUploadableItemQuery({
        fetchPolicy: "network-only",
        context: {
            headers: {
                "x-hasura-magic-token": magicToken,
            },
        },
        variables: {
            uploadableId,
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
    useQueryErrorToast(error, false, "SubmitItemPage -- upload agreement");

    const {
        loading: loadingElement,
        error: errorElement,
        data: dataElement,
        refetch: refetchElement,
    } = useGetElementQuery({
        variables: {
            magicToken,
        },
        fetchPolicy: "network-only",
    });
    useQueryErrorToast(error, false, "SubmitItemPage -- content item");

    const uploadableItem = useMemo(() => {
        if (!data?.UploadableElement || data.UploadableElement.length !== 1) {
            return null;
        }

        return data.UploadableElement[0];
    }, [data]);

    const title = useTitle(uploadableItem?.itemTitle ? `Submit ${uploadableItem.itemTitle}` : "Clowdr");

    const uploadAgreement = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementText ?? undefined;
    }, [uploadAgreementData]);

    const formSubmitted = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const form = useMemo(() => {
        if (!uploadableItem) {
            return <>No matching item found.</>;
        }

        switch (uploadableItem.typeName) {
            case ElementType_Enum.Abstract:
            case ElementType_Enum.Text:
                return <UploadTextForm magicToken={magicToken} uploadAgreement={uploadAgreement} />;
            case ElementType_Enum.ImageFile:
            case ElementType_Enum.PaperFile:
            case ElementType_Enum.PosterFile:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        uploadableItem={uploadableItem}
                        allowedFileTypes={[".pdf", ".png", ".jpg"]}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ElementType_Enum.Link:
            case ElementType_Enum.LinkButton:
            case ElementType_Enum.PaperLink:
            case ElementType_Enum.VideoLink:
                return (
                    <UploadLinkForm
                        magicToken={magicToken}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ElementType_Enum.ImageUrl:
            case ElementType_Enum.PaperUrl:
            case ElementType_Enum.PosterUrl:
            case ElementType_Enum.VideoUrl:
                return (
                    <UploadUrlForm
                        magicToken={magicToken}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
            case ElementType_Enum.VideoBroadcast:
            case ElementType_Enum.VideoCountdown:
            case ElementType_Enum.VideoFile:
            case ElementType_Enum.VideoFiller:
            case ElementType_Enum.VideoPrepublish:
            case ElementType_Enum.VideoSponsorsFiller:
            case ElementType_Enum.VideoTitles:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        uploadableItem={uploadableItem}
                        allowedFileTypes={[".mp4", ".mkv", ".webm"]}
                        uploadAgreement={uploadAgreement}
                        handleFormSubmitted={formSubmitted}
                    />
                );
        }
    }, [formSubmitted, magicToken, uploadableItem, uploadAgreement]);

    return (
        <Center>
            {title}
            <VStack spacing={4}>
                <Container centerContent maxW="100%">
                    <VStack spacing={4}>
                        <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                            Content Submission
                        </Heading>
                        {uploadableItem && (
                            <Heading as="h2" fontSize="1.5rem" lineHeight="2.2rem" fontStyle="italic">
                                {uploadableItem.itemTitle}
                            </Heading>
                        )}
                        {(loading && !data) || (uploadAgreementLoading && !uploadAgreementData) ? (
                            <div>
                                <Spinner />
                            </div>
                        ) : error || uploadAgreementError ? (
                            <Text mt={4}>An error occurred while loading data.</Text>
                        ) : !uploadableItem ? (
                            <Text mt={4}>No matching item.</Text>
                        ) : (
                            <>
                                <Heading as="h3" fontSize="1.2rem" mt={5}>
                                    Upload: {uploadableItem.name}
                                </Heading>
                                {uploadableItem.uploadsRemaining === 0 ? (
                                    <Text mt={4}>
                                        No upload attempts remaining for this item. Please contact your conference
                                        organisers if you need to upload another version.
                                    </Text>
                                ) : (
                                    <>
                                        {uploadableItem.typeName === ElementType_Enum.VideoBroadcast ? (
                                            <Box>
                                                <UnorderedList>
                                                    {uploadableItem.uploadsRemaining ? (
                                                        <ListItem>
                                                            {uploadableItem.uploadsRemaining} upload attempt
                                                            {uploadableItem.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        This video will be live streamed during the conference just
                                                        prior to your Q&amp;A session.
                                                    </ListItem>
                                                    <ListItem>
                                                        Your conference organisers should have sent instructions
                                                        regarding the maximum duration of your video.
                                                    </ListItem>
                                                    <ListItem>Maximum 1080p video quality</ListItem>
                                                    <ListItem>
                                                        Please refer to{" "}
                                                        <Link
                                                            href="https://clowdr.org/resources/video-subtitles"
                                                            isExternal
                                                        >
                                                            these instructions
                                                        </Link>{" "}
                                                        for further information.
                                                    </ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        {uploadableItem.typeName === ElementType_Enum.VideoPrepublish ? (
                                            <Box>
                                                <UnorderedList>
                                                    {uploadableItem.uploadsRemaining ? (
                                                        <ListItem>
                                                            {uploadableItem.uploadsRemaining} upload attempt
                                                            {uploadableItem.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        This video will be made publicly available around the 11th of
                                                        January.
                                                    </ListItem>
                                                    <ListItem>
                                                        Your conference organisers should have sent instructions
                                                        regarding the maximum duration of your video.
                                                    </ListItem>
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
                                    <UploadedElement
                                        magicToken={magicToken}
                                        data={dataElement}
                                        error={!!errorElement}
                                        loading={loadingElement}
                                        refetch={refetchElement}
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
