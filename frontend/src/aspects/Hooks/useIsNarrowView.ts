import { useBreakpointValue } from "@chakra-ui/react";

export default function useIsNarrowView(): boolean {
    return (
        useBreakpointValue({
            base: true,
            md: false,
        }) ?? false
    );
}
