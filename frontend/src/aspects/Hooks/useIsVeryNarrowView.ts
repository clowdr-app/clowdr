import { useBreakpointValue } from "@chakra-ui/react";

export default function useIsVeryNarrowView(): boolean {
    return (
        useBreakpointValue({
            base: true,
            sm: false,
        }) ?? false
    );
}
