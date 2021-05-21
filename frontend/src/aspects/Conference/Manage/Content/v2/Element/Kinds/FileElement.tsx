import { Box, Center, Heading, Image } from "@chakra-ui/react";
import { ElementBaseType, ElementVersionData } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../../../Chakra/LinkButton";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";
import UploadFileForm_Element from "./UploadFileForm_Element";

function createDefaultFile(
    type: Content_ElementType_Enum.ImageFile | Content_ElementType_Enum.PaperFile | Content_ElementType_Enum.PosterFile
): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ElementBaseType.File,
            s3Url: "",
        },
    };
}

export const FileElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [
        Content_ElementType_Enum.ImageFile,
        Content_ElementType_Enum.PaperFile,
        Content_ElementType_Enum.PosterFile,
    ],
    createDefault: (type, required, conferenceId, itemId) => {
        assert(
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
        if (required) {
            return {
                type: "required-only",
                uploadableElement: {
                    __typename: "content_UploadableElement",
                    id: uuidv4(),
                    name,
                    isHidden: false,
                    typeName: type,
                    uploaders: [],
                    conferenceId,
                    itemId,
                },
            };
        } else {
            return {
                type: "element-only",
                element: {
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
                },
            };
        }
    },
    renderEditor: function FileElementEditor({ data, update }: RenderEditorProps) {
        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.ImageFile ||
                    data.element.typeName === Content_ElementType_Enum.PosterFile ||
                    data.element.typeName === Content_ElementType_Enum.PaperFile
                )
            ) {
                return <>File Element Template mistakenly used for type {data.type}.</>;
            }

            if (data.element.data.length === 0) {
                data = {
                    ...data,
                    element: {
                        ...data.element,
                        data: [createDefaultFile(data.element.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.element.data[data.element.data.length - 1];
            if (latestVersion.data.baseType !== ElementBaseType.File) {
                return <>File Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            let imageSrc = undefined;
            if (
                latestVersion &&
                latestVersion.data.baseType === ElementBaseType.File &&
                latestVersion.data.s3Url !== ""
            ) {
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    imageSrc = `https://s3.${
                        import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                    }.amazonaws.com/${bucket}/${key}`;
                } catch {
                    /* Ignore */
                }
            }
            return (
                <>
                    {imageSrc ? (
                        <>
                            <Box pb={4}>
                                {data.element.typeName === Content_ElementType_Enum.ImageFile ||
                                data.element.typeName === Content_ElementType_Enum.PosterFile ? (
                                    <>
                                        <Heading as="h3" fontSize="lg" mt={4} mb={4}>
                                            Current file
                                        </Heading>
                                        <Center>
                                            <Image src={imageSrc} maxH={200} alt="No caption provided." />
                                        </Center>
                                    </>
                                ) : (
                                    <ExternalLinkButton to={imageSrc} isExternal>
                                        Current file
                                    </ExternalLinkButton>
                                )}
                            </Box>
                        </>
                    ) : undefined}
                    <Heading as="h3" fontSize="lg" mb={4}>
                        Upload new file
                    </Heading>
                    <UploadFileForm_Element
                        allowedFileTypes={
                            data.element.typeName === Content_ElementType_Enum.ImageFile ||
                            data.element.typeName === Content_ElementType_Enum.PosterFile
                                ? ["image/png", "image/jpeg", "image/gif", "image/webp"]
                                : [".pdf"]
                        }
                        item={data.element}
                        onElementChange={(newElement) => {
                            const newData = {
                                ...data,
                                element: newElement,
                            };
                            update(newData);
                        }}
                        contentBaseType={ElementBaseType.File}
                    />
                </>
            );
        }
        return data.uploadableElement.hasBeenUploaded ? (
            <>A file has been uploaded but you do not have permission to view it.</>
        ) : (
            <>No file uploaded yet.</>
        );
    },
    renderEditorHeading: function FileElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
