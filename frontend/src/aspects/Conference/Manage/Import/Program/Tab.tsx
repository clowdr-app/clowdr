import type { TabProps } from "@chakra-ui/react";
import { Box, Button, chakra, useMultiStyleConfig, useTab, useToken } from "@chakra-ui/react";
import React from "react";

const Tab = React.forwardRef<
    HTMLButtonElement,
    TabProps & { colorScheme: string; selectedColor: string; isStart?: boolean; isEnd?: boolean }
>(function Tab({ selectedColor, isStart, isEnd, ...props }, ref) {
    // 1. Reuse the `useTab` hook
    const tabProps = useTab({ ...props, ref });
    const isSelected = !!tabProps["aria-selected"];

    // 2. Hook into the Tabs `size`, `variant`, props
    const styles = useMultiStyleConfig("Tabs", tabProps);

    const bgHex = useToken("colors", `${props.colorScheme}.500`);

    (styles.tab as any)._selected.borderColor = "inherit";

    return (
        <Button
            pos="relative"
            __css={styles.tab}
            variant={isSelected ? "solid" : "outline"}
            w="130px"
            maxW="100%"
            overflow="visible"
            {...tabProps}
            mx={1}
        >
            {isSelected ? (
                <chakra.svg
                    pos="absolute"
                    zIndex={1}
                    top={0}
                    height="100%"
                    left={!isStart ? "-14px" : "0px"}
                    width={isStart && isEnd ? "100%" : isStart || isEnd ? "calc(100% + 14px)" : "calc(100% + 28px)"}
                    viewBox="0 0 45 20"
                    preserveAspectRatio="none"
                >
                    {isStart ? (
                        <polygon points="0,0 38,0 45,10 38,20 0,20 0,10" style={{ fill: bgHex }} />
                    ) : isEnd ? (
                        <polygon points="0,0 45,0 45,10 45,20 0,20 7,10" style={{ fill: bgHex }} />
                    ) : (
                        <polygon points="0,0 38,0 45,10 38,20 0,20 7,10" style={{ fill: bgHex }} />
                    )}
                </chakra.svg>
            ) : undefined}
            <Box pos="relative" zIndex={2} whiteSpace="nowrap" color={isSelected ? selectedColor : undefined}>
                {tabProps.children}
            </Box>
        </Button>
    );
});

export default Tab;
