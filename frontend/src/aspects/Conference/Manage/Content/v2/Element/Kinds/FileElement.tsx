import { Box, Center, Heading, Image } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { ElementBaseType } from "@midspace/shared-types/content";
import AmazonS3URI from "amazon-s3-uri";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../../../Chakra/LinkButton";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";
import UploadFileForm_Element from "./UploadFileForm_Element";

export const FileElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [
        Content_ElementType_Enum.ImageFile,
        Content_ElementType_Enum.PaperFile,
        Content_ElementType_Enum.PosterFile,
    ],
    createDefault: (type, conferenceId, itemId) => {
        assert.truthy(
            type === Content_ElementType_Enum.ImageFile ||
                type === Content_ElementType_Enum.PaperFile ||
                type === Content_ElementType_Enum.PosterFile,
            `File Element Template mistakenly used for type ${type}.`
        );

        const name =
            type === Content_ElementType_Enum.ImageFile
                ? "Image"
                : type === Content_ElementType_Enum.PaperFile
                ? "Document"
                : type === Content_ElementType_Enum.PosterFile
                ? "Poster"
                : "File";

        return {
            __typename: "content_Element",
            updatedAt: new Date().toISOString(),
            id: uuidv4(),
            name,
            typeName: type,
            isHidden: false,
            data: [],
            layoutData: null,
            conferenceId,
            itemId,
            uploadsRemaining: 3,
        };
    },
    renderEditor: function FileElementEditor({ data, update }: RenderEditorProps) {
        if (
            !(
                data.typeName === Content_ElementType_Enum.ImageFile ||
                data.typeName === Content_ElementType_Enum.PosterFile ||
                data.typeName === Content_ElementType_Enum.PaperFile
            )
        ) {
            return <>File Element Template mistakenly used for type {data.typeName}.</>;
        }

        const latestVersion = data.data[data.data.length - 1];
        if (latestVersion && latestVersion.data.baseType !== ElementBaseType.File) {
            return <>File Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
        }

        let fileSrc = undefined;
        let altText = undefined;
        if (latestVersion && latestVersion.data.baseType === ElementBaseType.File && latestVersion.data.s3Url !== "") {
            altText = latestVersion.data.altText;
            try {
                const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                fileSrc = `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            } catch {
                /* Ignore */
            }
        }
        return (
            <>
                {fileSrc ? (
                    <>
                        <Box pb={4}>
                            {data.typeName === Content_ElementType_Enum.ImageFile ||
                            data.typeName === Content_ElementType_Enum.PosterFile ? (
                                <>
                                    <Heading as="h3" fontSize="lg" mt={4} mb={4}>
                                        Current file
                                    </Heading>
                                    <Center>
                                        <Image src={fileSrc} maxH={200} alt={altText ?? "No caption provided."} />
                                    </Center>
                                </>
                            ) : (
                                <ExternalLinkButton to={fileSrc} isExternal>
                                    Current file
                                </ExternalLinkButton>
                            )}
                        </Box>
                    </>
                ) : undefined}
                <Heading as="h3" fontSize="lg" my={4} textAlign="left" alignSelf="flex-start">
                    Upload new file
                </Heading>
                <UploadFileForm_Element
                    allowedFileTypes={
                        data.typeName === Content_ElementType_Enum.ImageFile ||
                        data.typeName === Content_ElementType_Enum.PosterFile
                            ? ["image/png", "image/jpeg", "image/gif", "image/webp"]
                            : [".pdf"]
                    }
                    item={data}
                    onElementChange={(newElement) => {
                        const newData = {
                            ...data,
                            ...newElement,
                        };
                        update(newData);
                    }}
                    contentBaseType={ElementBaseType.File}
                />
            </>
        );
    },
    renderEditorHeading: function FileElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
