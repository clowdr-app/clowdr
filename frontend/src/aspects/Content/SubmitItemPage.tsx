import {
    Center,
    Container,
    Heading,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import "@uppy/core/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import gql from "graphql-tag";
import React, { useMemo } from "react";
import {
    ContentType_Enum,
    useSelectRequiredItemQuery,
} from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import UploadedContentItem from "./UploadedContentItem";
import UploadFileForm from "./UploadFileForm";
import UploadLinkForm from "./UploadLinkForm";
import UploadTextForm from "./UploadTextForm";
import UploadUrlForm from "./UploadUrlForm";

gql`
    query SelectRequiredItem {
        RequiredContentItem {
            ...RequiredItemFields
        }
    }

    fragment RequiredItemFields on RequiredContentItem {
        id
        contentTypeName
        name
        conference {
            id
            name
        }
    }

    mutation SubmitContentItem($contentItemData: jsonb!, $magicToken: String!) {
        submitContentItem(data: $contentItemData, magicToken: $magicToken) {
            message
            success
        }
    }
`;

export default function SubmitItemPage({
    magicToken,
}: {
    magicToken: string;
}): JSX.Element {
    const { loading, error, data } = useSelectRequiredItemQuery({
        fetchPolicy: "network-only",
        context: {
            headers: {
                "x-hasura-magic-token": magicToken,
            },
        },
    });
    useQueryErrorToast(error);

    const requiredItem = useMemo(() => {
        if (
            !data?.RequiredContentItem ||
            data.RequiredContentItem.length !== 1
        ) {
            return null;
        }

        return data.RequiredContentItem[0];
    }, [data?.RequiredContentItem]);

    const form = useMemo(() => {
        if (!requiredItem) {
            return <>No matching item found.</>;
        }

        switch (requiredItem.contentTypeName) {
            case ContentType_Enum.Abstract:
            case ContentType_Enum.Text:
                return <UploadTextForm magicToken={magicToken} />;
            case ContentType_Enum.ImageFile:
            case ContentType_Enum.PaperFile:
            case ContentType_Enum.PosterFile:
                return (
                    <UploadFileForm
                        magicToken={magicToken}
                        requiredItem={requiredItem}
                        allowedFileTypes={[".pdf", ".png", ".jpg"]}
                    />
                );
            case ContentType_Enum.LinkButton:
            case ContentType_Enum.PaperLink:
            case ContentType_Enum.VideoLink:
                return <UploadLinkForm magicToken={magicToken} />;
            case ContentType_Enum.ImageUrl:
            case ContentType_Enum.Link:
            case ContentType_Enum.PaperUrl:
            case ContentType_Enum.PosterUrl:
            case ContentType_Enum.VideoUrl:
                return <UploadUrlForm magicToken={magicToken} />;
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
                    />
                );
        }
    }, [magicToken, requiredItem]);

    return (
        <Center>
            <VStack spacing={4}>
                <Container centerContent>
                    <VStack spacing={4}>
                        <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                            Upload item
                        </Heading>
                        {loading ? (
                            <div>
                                <Spinner />
                            </div>
                        ) : error ? (
                            <Text mt={4}>
                                An error occurred while loading data.
                            </Text>
                        ) : !requiredItem ? (
                            <Text mt={4}>No matching item.</Text>
                        ) : (
                            <>
                                <Heading as="h2" fontSize="1.5rem" mt={5}>
                                    {requiredItem.name}
                                </Heading>
                                {form}
                                <VStack spacing={4}>
                                    <Heading as="h3" fontSize="1.2rem">
                                        Previously uploaded
                                    </Heading>
                                    <UploadedContentItem
                                        magicToken={magicToken}
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
