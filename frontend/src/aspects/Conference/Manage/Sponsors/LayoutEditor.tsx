import { FormControl, FormHelperText, FormLabel, Switch } from "@chakra-ui/react";
import { ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useCallback, useMemo } from "react";

export function LayoutEditor({
    layoutDataBlob,
    contentItemType,
    update,
}: {
    layoutDataBlob: LayoutDataBlob | null;
    contentItemType: ContentType_Enum;
    update: (_updated: LayoutDataBlob) => void;
}): JSX.Element {
    const newLayoutData = useCallback((contentType: ContentType_Enum): LayoutDataBlob => {
        switch (contentType) {
            case ContentType_Enum.ImageUrl:
                return {
                    contentType,
                    wide: false,
                    hidden: false,
                    priority: 0,
                    isLogo: false,
                };
            default:
                return {
                    contentType,
                    wide: false,
                    hidden: false,
                    priority: 0,
                };
        }
    }, []);

    const layoutData = useMemo<LayoutDataBlob>(() => layoutDataBlob ?? newLayoutData(contentItemType), [
        contentItemType,
        layoutDataBlob,
        newLayoutData,
    ]);

    return (
        <>
            {layoutData.contentType === ContentType_Enum.ImageUrl ? (
                <FormControl>
                    <FormLabel>Is logo?</FormLabel>
                    <Switch
                        size="sm"
                        isChecked={layoutData.isLogo}
                        onChange={(event) => {
                            update({
                                ...layoutData,
                                isLogo: event.target.checked,
                            });
                        }}
                    />
                    <FormHelperText>Use this image as the sponsor logo.</FormHelperText>
                </FormControl>
            ) : undefined}
        </>
    );
}
