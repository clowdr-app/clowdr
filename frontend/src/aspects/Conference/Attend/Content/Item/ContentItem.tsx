import { HStack, Image, Link } from "@chakra-ui/react";
import { ContentItemDataBlob, ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import { ExternalLinkButton } from "../../../../Chakra/LinkButton";
import { Markdown } from "../../../../Text/Markdown";

export function ContentItem({ blob }: { blob: ContentItemDataBlob }): JSX.Element {
    const el = useMemo(() => {
        const latestVersion = R.last(blob);

        if (!latestVersion) {
            return <>No data to display.</>;
        }

        switch (latestVersion.data.type) {
            case ContentType_Enum.Abstract:
                return <Markdown>{latestVersion.data.text}</Markdown>;
            case ContentType_Enum.Text:
                return <Markdown>{latestVersion.data.text}</Markdown>;
            case ContentType_Enum.VideoUrl:
                return (
                    <ReactPlayer
                        url={latestVersion.data.url}
                        style={{ maxWidth: "100%" }}
                        width="100%"
                        height="auto"
                        controls={true}
                    />
                );
            case ContentType_Enum.ImageUrl:
                return <Image src={latestVersion.data.url} style={{ maxWidth: "100%" }} />;
            case ContentType_Enum.ImageFile:
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    return (
                        <Image
                            src={`https://${bucket}.s3-${
                                import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                            }.amazonaws.com/${key}`}
                        />
                    );
                } catch (e) {
                    return <>Invalid image URL.</>;
                }
            case ContentType_Enum.Link:
                return <Link href={latestVersion.data.url}>{latestVersion.data.text}</Link>;
            case ContentType_Enum.LinkButton:
                return (
                    <HStack>
                        <ExternalLinkButton colorScheme="green" to={latestVersion.data.url} linkProps={{ mx: "auto" }}>
                            {latestVersion.data.text}
                        </ExternalLinkButton>
                    </HStack>
                );
            case ContentType_Enum.VideoFile:
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    return (
                        <ReactPlayer
                            url={`https://${bucket}.s3-${
                                import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                            }.amazonaws.com/${key}`}
                            style={{ maxWidth: "100%" }}
                            controls={true}
                        />
                    );
                } catch (e) {
                    return <>Invalid image URL.</>;
                }
        }

        return <>Cannot render this content.</>;
    }, [blob]);

    return <>{el}</>;
}
