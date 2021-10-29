import { FormControl, FormHelperText, FormLabel, HStack, Switch, VStack } from "@chakra-ui/react";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import React, { useCallback, useMemo } from "react";
import { Content_ElementType_Enum } from "../../../../../../generated/graphql";

export function LayoutEditor({
    layoutDataBlob,
    elementType,
    update,
}: {
    layoutDataBlob: LayoutDataBlob | null;
    elementType: Content_ElementType_Enum;
    update: (_updated: LayoutDataBlob) => void;
}): JSX.Element {
    const newLayoutData = useCallback((contentType: Content_ElementType_Enum): LayoutDataBlob => {
        switch (contentType) {
            case Content_ElementType_Enum.ImageUrl:
            case Content_ElementType_Enum.ImageFile:
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
                } as LayoutDataBlob;
        }
    }, []);

    const layoutData = useMemo<LayoutDataBlob>(
        () => layoutDataBlob ?? newLayoutData(elementType),
        [elementType, layoutDataBlob, newLayoutData]
    );

    // const [priority, setPriority] = useState<number | null>(null);
    // useEffect(() => {
    //     setPriority(null);
    // }, [layoutData.priority]);

    return (
        <VStack alignItems="flex-start" mt={4}>
            <FormControl as={HStack} spacing={2}>
                <FormLabel m={0}>Wide</FormLabel>
                <Switch
                    m={0}
                    size="sm"
                    isChecked={layoutData.wide}
                    onChange={(event) => {
                        update({
                            ...layoutData,
                            wide: event.target.checked,
                        });
                    }}
                />
                <FormHelperText m={0}>Display this content across both columns.</FormHelperText>
            </FormControl>
            {layoutData.contentType === Content_ElementType_Enum.ImageUrl ||
            layoutData.contentType === Content_ElementType_Enum.ImageFile ? (
                <FormControl as={HStack} spacing={2}>
                    <FormLabel m={0}>Use as logo?</FormLabel>
                    <Switch
                        m={0}
                        size="sm"
                        isChecked={layoutData.isLogo}
                        onChange={(event) => {
                            update({
                                ...layoutData,
                                isLogo: event.target.checked,
                            });
                        }}
                    />
                    <FormHelperText m={0}>Use this image as the sponsor logo.</FormHelperText>
                </FormControl>
            ) : undefined}
        </VStack>
    );
}
