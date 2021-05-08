import { FormControl, FormHelperText, FormLabel, HStack, Switch } from "@chakra-ui/react";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useCallback, useMemo } from "react";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";

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
                };
        }
    }, []);

    const layoutData = useMemo<LayoutDataBlob>(() => layoutDataBlob ?? newLayoutData(elementType), [
        elementType,
        layoutDataBlob,
        newLayoutData,
    ]);

    // const [priority, setPriority] = useState<number | null>(null);
    // useEffect(() => {
    //     setPriority(null);
    // }, [layoutData.priority]);

    return (
        <HStack alignItems="flex-start" mt={4}>
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
            {/* <FormControl>
                <FormLabel>Order</FormLabel>
                {layoutDataBlob ? (
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
                ) : (
                    <Button
                        onClick={() => {
                            update({
                                ...layoutData,
                            });
                        }}
                        size="sm"
                    >
                        Set order
                    </Button>
                )}
                <FormHelperText>The order in which to display this content (lower numbers come first).</FormHelperText>
            </FormControl> */}
        </HStack>
    );
}
