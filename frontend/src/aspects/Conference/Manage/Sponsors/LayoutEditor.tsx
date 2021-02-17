import {
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Switch,
} from "@chakra-ui/react";
import { ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
            case ContentType_Enum.ImageFile:
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

    const [priority, setPriority] = useState<number | null>(null);
    useEffect(() => {
        setPriority(null);
    }, [layoutData.priority]);

    return (
        <HStack alignItems="flex-start" mt={4}>
            {layoutData.contentType === ContentType_Enum.ImageUrl ||
            layoutData.contentType === ContentType_Enum.ImageFile ? (
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
            <FormControl>
                <FormLabel>Wide</FormLabel>
                <Switch
                    size="sm"
                    isChecked={layoutData.wide}
                    onChange={(event) => {
                        update({
                            ...layoutData,
                            wide: event.target.checked,
                        });
                    }}
                />
                <FormHelperText>Display this content across both columns.</FormHelperText>
            </FormControl>
            <FormControl>
                <FormLabel>Order</FormLabel>
                <NumberInput
                    value={priority ?? layoutData.priority}
                    onChange={(_, value) => setPriority(value)}
                    onBlur={() => {
                        if (priority !== null && priority !== layoutData.priority) {
                            update({
                                ...layoutData,
                                priority: priority,
                            });
                        }
                    }}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
                <FormHelperText>The order in which to display this content (lower numbers come first).</FormHelperText>
            </FormControl>
        </HStack>
    );
}
