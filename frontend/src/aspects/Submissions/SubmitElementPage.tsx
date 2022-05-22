import { Box, Center, Divider, Heading, Link, ListItem, Spinner, Text, UnorderedList, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import "@uppy/core/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import React, { useCallback, useMemo } from "react";
import { gql } from "urql";
import { Content_ElementType_Enum, useGetElementQuery, useGetUploadAgreementQuery } from "../../generated/graphql";
import FAIcon from "../Chakra/FAIcon";
import { LinkButton } from "../Chakra/LinkButton";
import { makeContext } from "../GQL/make-context";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { useTitle } from "../Hooks/useTitle";
import UploadedElement from "./Elements/UploadedElement";
import UploadFileForm from "./Elements/UploadFileForm";
import UploadLinkForm from "./Elements/UploadLinkForm";
import UploadTextForm from "./Elements/UploadTextForm";
import UploadUrlForm from "./Elements/UploadUrlForm";

gql`
    query GetElement($accessToken: String!, $elementId: uuid!) {
        content_Element(where: { id: { _eq: $elementId } }) {
            typeName
            data
            name
            id
            uploadsRemaining
            itemId
            item {
                id
                title
            }
        }
        collection_ProgramPerson(where: { accessToken: { _eq: $accessToken } }) {
            id
            name
        }
    }

    mutation submitUploadableElement($elementData: jsonb!, $magicToken: String!, $elementId: uuid!) {
        submitUploadableElement(data: $elementData, magicToken: $magicToken, elementId: $elementId) {
            message
            success
        }
    }

    query GetUploadAgreement {
        getUploadAgreement {
            agreementText
            agreementUrl
        }
    }
`;

export default function SubmitElementPage({
    magicToken,
    itemId,
    elementId,
}: {
    magicToken: string;
    itemId: string;
    elementId: string;
}): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Submitter,
                [AuthHeader.MagicToken]: magicToken,
            }),
        [magicToken]
    );
    const [{ fetching: uploadAgreementLoading, error: uploadAgreementError, data: uploadAgreementData }] =
        useGetUploadAgreementQuery({
            requestPolicy: "network-only",
            context,
        });
    useQueryErrorToast(uploadAgreementError, false, "SubmitItemPage -- upload agreement");

    const [{ fetching: loading, error, data }, refetch] = useGetElementQuery({
        variables: {
            accessToken: magicToken,
            elementId,
        },
        context,
        requestPolicy: "network-only",
    });
    useQueryErrorToast(error, false, "SubmitItemPage -- content item");

    const uploadableElement = useMemo(() => {
        if (!data?.content_Element || data.content_Element.length !== 1) {
            return null;
        }

        return data.content_Element[0];
    }, [data]);

    const title = useTitle("Content Submission");

    const uploadAgreementText = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementText ?? undefined;
    }, [uploadAgreementData]);
    const uploadAgreementUrl = useMemo(() => {
        return uploadAgreementData?.getUploadAgreement?.agreementUrl ?? undefined;
    }, [uploadAgreementData]);

    const formSubmitted = useCallback(() => {
        refetch();
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
                        elementId={elementId}
                        magicToken={magicToken}
                        uploadAgreementText={uploadAgreementText}
                        uploadAgreementUrl={uploadAgreementUrl}
                        existingText={existingData}
                        handleFormSubmitted={formSubmitted}
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
                        isVideo={false}
                    />
                );
            case Content_ElementType_Enum.Link:
            case Content_ElementType_Enum.LinkButton:
            case Content_ElementType_Enum.PaperLink:
            case Content_ElementType_Enum.VideoLink:
            case Content_ElementType_Enum.AudioLink:
                return (
                    <UploadLinkForm
                        elementId={elementId}
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
            case Content_ElementType_Enum.ExternalEventLink:
                return (
                    <UploadUrlForm
                        elementId={elementId}
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
                        isVideo={true}
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
                        isVideo={false}
                    />
                );
            default:
                return <>Unrecognised upload type.</>;
        }
    }, [elementId, uploadableElement, magicToken, uploadAgreementText, uploadAgreementUrl, formSubmitted]);

    const person = data?.collection_ProgramPerson.length ? data?.collection_ProgramPerson[0] : undefined;

    return (
        <Center pt={6}>
            {title}
            <VStack spacing={6} alignItems="flex-start" w="100%">
                <Heading as="h1" id="page-heading" fontSize="4xl" textAlign="left">
                    {person ? `Welcome ${person.name}` : "Submission"}
                </Heading>
                <LinkButton
                    to={`/submissions/${magicToken}/item/${itemId}`}
                    colorScheme="PrimaryActionButton"
                    size="md"
                >
                    <FAIcon iconStyle="s" icon="arrow-left" mr={2} /> Back to submission
                </LinkButton>
                {uploadableElement && (
                    <Heading as="h2" fontSize="2xl" textAlign="left">
                        {uploadableElement.item?.title && uploadableElement.name
                            ? `${uploadableElement.item.title}: ${uploadableElement.name}`
                            : "Content Submission"}
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
                        {uploadableElement.uploadsRemaining === 0 ? (
                            <Text mt={4}>
                                No upload attempts remaining for this item. Please contact your conference organisers if
                                you need to upload another version.
                            </Text>
                        ) : (
                            <>
                                {uploadableElement.typeName === Content_ElementType_Enum.VideoBroadcast ? (
                                    <Box>
                                        <UnorderedList>
                                            {uploadableElement.uploadsRemaining ? (
                                                <ListItem>
                                                    {uploadableElement.uploadsRemaining} upload attempt
                                                    {uploadableElement.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                </ListItem>
                                            ) : (
                                                <></>
                                            )}
                                            <ListItem>
                                                Your conference organisers should have sent instructions regarding the
                                                maximum duration of your video.
                                            </ListItem>
                                            <ListItem>Maximum 1080p video quality</ListItem>
                                            <ListItem>
                                                Please refer to{" "}
                                                <Link
                                                    href="https://midspace.app/resources/video-subtitles/uploading-videos/"
                                                    isExternal
                                                >
                                                    these instructions
                                                </Link>{" "}
                                                for further information.
                                            </ListItem>
                                        </UnorderedList>
                                    </Box>
                                ) : undefined}
                                {uploadableElement.typeName === Content_ElementType_Enum.VideoPrepublish ||
                                uploadableElement.typeName === Content_ElementType_Enum.VideoFile ? (
                                    <Box>
                                        <UnorderedList>
                                            {uploadableElement.uploadsRemaining ? (
                                                <ListItem>
                                                    {uploadableElement.uploadsRemaining} upload attempt
                                                    {uploadableElement.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                </ListItem>
                                            ) : (
                                                <></>
                                            )}
                                            <ListItem>
                                                Your conference organisers should have sent instructions regarding the
                                                maximum duration of your video.
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
                                                    {uploadableElement.uploadsRemaining > 1 ? "s" : ""} remaining.
                                                </ListItem>
                                            ) : (
                                                <></>
                                            )}
                                            <ListItem>
                                                Your conference organisers should have sent instructions regarding the
                                                maximum duration of your audio file.
                                            </ListItem>
                                            <ListItem>
                                                Accepted file types are MP3, OGG/VORBIS, WAV and FLAC. For others to be
                                                able to listen in-browser (i.e. without downloading the file) please use
                                                MP3 format.
                                            </ListItem>
                                        </UnorderedList>
                                    </Box>
                                ) : undefined}
                                {form}
                            </>
                        )}
                        <Divider />
                        <VStack spacing={4} alignItems="flex-start" w="100%">
                            <Heading as="h3" fontSize="xl" textAlign="left">
                                Previously submitted
                            </Heading>
                            <UploadedElement
                                magicToken={magicToken}
                                data={data}
                                error={!!error}
                                loading={loading}
                                refetch={() => refetch()}
                            />
                        </VStack>
                    </>
                )}
            </VStack>
        </Center>
    );
}
