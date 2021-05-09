import { Button } from "@chakra-ui/react";
import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React from "react";
import type { ElementDescriptor } from "./Types";

export function RefreshSubtitles({
    item,
    onElementChange,
}: {
    item: ElementDescriptor;
    onElementChange: (_newItem: ElementDescriptor) => void;
}): JSX.Element {
    return (
        <Button
            my={4}
            size="sm"
            onClick={() => {
                const latestVersion = R.last(item.data);
                if (latestVersion?.data.baseType === ElementBaseType.Video) {
                    onElementChange({
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
