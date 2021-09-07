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
import { Content_ElementType_Enum, useGetElementQuery, useGetUploadAgreementQuery } from "../../generated/graphql";
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
            uploadsRemaining
        }
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
            agreementUrl
        }
    }
`;

export default function SubmitItemPage({ magicToken }: { magicToken: string }): JSX.Element {
    const {
        loading: uploadAgreementLoading,
        error: uploadAgreementError,
        data: uploadAgreementData,
    } = useGetUploadAgreementQuery({
        fetchPolicy: "network-only",
        variables: {
            magicToken,
        },
        context: {
            headers: {
                "SEND-WITHOUT-AUTH": true,
            },
        },
    });
    useQueryErrorToast(uploadAgreementError, false, "SubmitItemPage -- upload agreement");

    const { loading, error, data, refetch } = useGetElementQuery({
        variables: {
            magicToken,
        },
        context: {
            headers: {
                "x-hasura-magic-token": magicToken,
                "SEND-WITHOUT-AUTH": true,
            },
        },
        fetchPolicy: "network-only",
    });
    useQueryErrorToast(error, false, "SubmitItemPage -- content item");

    const uploadableElement = useMemo(() => {
        if (!data?.content_ElementByAccessToken || data.content_ElementByAccessToken.length !== 1) {
            return null;
        }

        return data.content_ElementByAccessToken[0];
    }, [data]);

    const title = useTitle(uploadableElement?.itemTitle ? `Submit ${uploadableElement.itemTitle}` : "Midspace");

    const uploadAgreementText = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementText ?? undefined;
    }, [uploadAgreementData]);
    const uploadAgreementUrl = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementUrl ?? undefined;
    }, [uploadAgreementData]);

    const formSubmitted = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const form = useMemo(() => {
        if (!uploadableElement) {
            return <>No matching item found.</>;
        }

        const existingData: any | null =
            (uploadableElement
                ? uploadableElement.data?.length
                    ? uploadableElement.data[uploadableElement.data.length - 1]?.data
                    : undefined
                : undefined) ?? null;

        switch (uploadableElement.typeName) {
            case Content_ElementType_Enum.Abstract:
            case Content_ElementType_Enum.Text:
                return (
                    <UploadTextForm
                        magicToken={magicToken}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        existingText={existingData}
                    />
                );
            case Content_ElementType_Enum.ImageFile:
            case Content_ElementType_Enum.PaperFile:
            case Content_ElementType_Enum.PosterFile:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        elementId={uploadableElement.id}
                        allowedFileTypes={[".pdf", ".png", ".jpg"]}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        handleFormSubmitted={formSubmitted}
                        existingAltText={existingData?.altText}
                    />
                );
            case Content_ElementType_Enum.Link:
            case Content_ElementType_Enum.LinkButton:
            case Content_ElementType_Enum.PaperLink:
            case Content_ElementType_Enum.VideoLink:
            case Content_ElementType_Enum.AudioLink:
                return (
                    <UploadLinkForm
                        magicToken={magicToken}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        handleFormSubmitted={formSubmitted}
                        existingLink={existingData}
                    />
                );
            case Content_ElementType_Enum.ImageUrl:
            case Content_ElementType_Enum.PaperUrl:
            case Content_ElementType_Enum.PosterUrl:
            case Content_ElementType_Enum.VideoUrl:
            case Content_ElementType_Enum.AudioUrl:
            case Content_ElementType_Enum.Zoom:
                return (
                    <UploadUrlForm
                        magicToken={magicToken}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        handleFormSubmitted={formSubmitted}
                        existingUrl={existingData}
                    />
                );
            case Content_ElementType_Enum.VideoBroadcast:
            case Content_ElementType_Enum.VideoCountdown:
            case Content_ElementType_Enum.VideoFile:
            case Content_ElementType_Enum.VideoFiller:
            case Content_ElementType_Enum.VideoPrepublish:
            case Content_ElementType_Enum.VideoSponsorsFiller:
            case Content_ElementType_Enum.VideoTitles:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        elementId={uploadableElement.id}
                        allowedFileTypes={[".mp4", ".mkv", ".webm"]}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        handleFormSubmitted={formSubmitted}
                        existingAltText={existingData?.altText}
                    />
                );
            case Content_ElementType_Enum.AudioFile:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        elementId={uploadableElement.id}
                        allowedFileTypes={[".mp3", ".wav", ".ogg", ".flac"]}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        handleFormSubmitted={formSubmitted}
                        existingAltText={existingData?.altText}
                    />
                );
            default:
                return <>Unrecognised upload type.</>;
        }
    }, [uploadableElement, magicToken, formSubmitted, uploadAgreementText, uploadAgreementUrl]);

    return (
        <Center>
            {title}
            <VStack spacing={4}>
                <Container centerContent maxW="100%">
                    <VStack spacing={4}>
                        <Heading as="h1" id="page-heading" fontSize="2.3rem" lineHeight="3rem">
                            Content Submission
                        </Heading>
                        {uploadableElement && (
                            <Heading as="h2" fontSize="1.5rem" lineHeight="2.2rem" fontStyle="italic">
                                {uploadableElement.itemTitle}
                            </Heading>
                        )}
                        {(loading && !data) || (uploadAgreementLoading && !uploadAgreementData) ? (
                            <div>
                                <Spinner />
                            </div>
                        ) : error || uploadAgreementError ? (
                            <Text mt={4}>An error occurred while loading data.</Text>
                        ) : !uploadableElement ? (
                            <Text mt={4}>No matching item.</Text>
                        ) : (
                            <>
                                <Heading as="h3" fontSize="1.2rem" mt={5}>
                                    Upload: {uploadableElement.name}
                                </Heading>
                                {uploadableElement.uploadsRemaining === 0 ? (
                                    <Text mt={4}>
                                        No upload attempts remaining for this item. Please contact your conference
                                        organisers if you need to upload another version.
                                    </Text>
                                ) : (
                                    <>
                                        {uploadableElement.typeName === Content_ElementType_Enum.VideoBroadcast ? (
                                            <Box>
                                                <UnorderedList>
                                                    {uploadableElement.uploadsRemaining ? (
                                                        <ListItem>
                                                            {uploadableElement.uploadsRemaining} upload attempt
                                                            {uploadableElement.uploadsRemaining > 1 ? "s" : ""}{" "}
                                                            remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        Your conference organisers should have sent instructions
                                                        regarding the maximum duration of your video.
                                                    </ListItem>
                                                    <ListItem>Maximum 1080p video quality</ListItem>
                                                    <ListItem>
                                                        Please refer to{" "}
                                                        <Link
                                                            href="https://resources.midspace.app/video-subtitles/uploading-videos/"
                                                            isExternal
                                                        >
                                                            these instructions
                                                        </Link>{" "}
                                                        for further information.
                                                    </ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        {uploadableElement.typeName === Content_ElementType_Enum.VideoPrepublish ? (
                                            <Box>
                                                <UnorderedList>
                                                    {uploadableElement.uploadsRemaining ? (
                                                        <ListItem>
                                                            {uploadableElement.uploadsRemaining} upload attempt
                                                            {uploadableElement.uploadsRemaining > 1 ? "s" : ""}{" "}
                                                            remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        Your conference organisers should have sent instructions
                                                        regarding the maximum duration of your video.
                                                    </ListItem>
                                                    <ListItem>Maximum 1080p video quality</ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        {uploadableElement.typeName === Content_ElementType_Enum.AudioFile ? (
                                            <Box>
                                                <UnorderedList>
                                                    {uploadableElement.uploadsRemaining ? (
                                                        <ListItem>
                                                            {uploadableElement.uploadsRemaining} upload attempt
                                                            {uploadableElement.uploadsRemaining > 1 ? "s" : ""}{" "}
                                                            remaining.
                                                        </ListItem>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <ListItem>
                                                        Your conference organisers should have sent instructions
                                                        regarding the maximum duration of your audio file.
                                                    </ListItem>
                                                    <ListItem>
                                                        Accepted file types are MP3, OGG/VORBIS, WAV and FLAC. For
                                                        others to be able to listen in-browser (i.e. without downloading
                                                        the file) please use MP3 format.
                                                    </ListItem>
                                                </UnorderedList>
                                            </Box>
                                        ) : undefined}
                                        <Center w="100%">{form}</Center>
                                    </>
                                )}
                                <Divider />
                                <VStack spacing={4}>
                                    <Heading as="h3" fontSize="1.2rem">
                                        Previously uploaded
                                    </Heading>
                                    <UploadedElement
                                        magicToken={magicToken}
                                        data={data}
                                        error={!!error}
                                        loading={loading}
                                        refetch={refetch}
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
