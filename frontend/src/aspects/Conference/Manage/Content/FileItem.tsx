import { Box, Center, Heading, Image } from "@chakra-ui/react";
import { ContentBaseType, ContentItemVersionData } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentType_Enum } from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";
import UploadFileForm_ContentItem from "./UploadFileForm_ContentItem";

function createDefaultFile(
    type: ContentType_Enum.ImageFile | ContentType_Enum.PaperFile | ContentType_Enum.PosterFile
): ContentItemVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ContentBaseType.File,
            s3Url: "",
        },
    };
}

export const FileItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (type, required) => {
        assert(
            type === ContentType_Enum.ImageFile ||
                type === ContentType_Enum.PaperFile ||
                type === ContentType_Enum.PosterFile,
            `File Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ContentType_Enum.ImageFile
                ? "Image (PNG/JPEG/GIF/WebP)"
                : type === ContentType_Enum.PaperFile
                ? "Document (PDF)"
                : type === ContentType_Enum.PosterFile
                ? "Poster (PNG/JPEG/WebP)"
                : "File";
        if (required) {
            return {
                type: "required-only",
                requiredItem: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    isHidden: false,
                    typeName: type,
                    uploaders: [],
                },
            };
        } else {
            return {
                type: "item-only",
                item: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    typeName: type,
                    isHidden: false,
                    data: [],
                    layoutData: null,
                },
            };
        }
    },
    renderEditor: function FileItemEditor({ data, update }: RenderEditorProps) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            if (
                !(
                    data.item.typeName === ContentType_Enum.ImageFile ||
                    data.item.typeName === ContentType_Enum.PosterFile ||
                    data.item.typeName === ContentType_Enum.PaperFile
                )
            ) {
                return <>File Item Template mistakenly used for type {data.type}.</>;
            }

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultFile(data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data[data.item.data.length - 1];
            if (latestVersion.data.baseType !== ContentBaseType.File) {
                return <>File Item Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            let imageSrc = undefined;
            if (
                latestVersion &&
                latestVersion.data.baseType === ContentBaseType.File &&
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
                                {data.item.typeName === ContentType_Enum.ImageFile ||
                                data.item.typeName === ContentType_Enum.PosterFile ? (
                                    <>
                                        <Heading as="h3" fontSize="lg" mt={4} mb={4}>
                                            Current file
                                        </Heading>
                                        <Center>
                                            <Image src={imageSrc} maxH={200} />
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
                    <UploadFileForm_ContentItem
                        allowedFileTypes={
                            data.item.typeName === ContentType_Enum.ImageFile ||
                            data.item.typeName === ContentType_Enum.PosterFile
                                ? ["image/png", "image/jpeg", "image/gif", "image/webp"]
                                : ["pdf"]
                        }
                        item={data.item}
                        onItemChange={(newItem) => {
                            const newData = {
                                ...data,
                                item: newItem,
                            };
                            update(newData);
                        }}
                        contentBaseType={ContentBaseType.File}
                    />
                </>
            );
        }
        return <></>;
    },
    renderEditorHeading: function FileItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
