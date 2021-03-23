import { Button } from "@chakra-ui/react";
import { ContentBaseType } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React from "react";
import type { ContentItemDescriptor } from "./Types";

export function RefreshSubtitles({
    item,
    onItemChange,
}: {
    item: ContentItemDescriptor;
    onItemChange: (_newItem: ContentItemDescriptor) => void;
}): JSX.Element {
    return (
        <Button
            my={4}
            size="sm"
            onClick={() => {
                const latestVersion = R.last(item.data);
                if (latestVersion?.data.baseType === ContentBaseType.Video) {
                    onItemChange({
                        ...item,
                        data: [
                            ...item.data,
                            {
                                createdAt: Date.now(),
                                createdBy: "user",
                                data: {
                                    baseType: latestVersion.data.baseType,
                                    s3Url: latestVersion.data.s3Url,
                                    type: latestVersion.data.type,
                                    broadcastTranscode: undefined,
                                    sourceHasEmbeddedSubtitles: undefined,
                                    transcode: undefined,
                                    subtitles: {},
                                },
                            },
                        ],
                    });
                }
            }}
        >
            Regenerate subtitles
        </Button>
    );
}
