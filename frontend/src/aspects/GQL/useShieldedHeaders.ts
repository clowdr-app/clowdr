import { useMemo } from "react";
import type { OperationContext } from "urql";

export function useShieldedHeaders(headers: Record<string, string>): Partial<OperationContext> | undefined {
    const outContext = useMemo<Partial<OperationContext> | undefined>(
        () => ({
            fetchOptions: {
                headers,
            },
        }),
        [headers]
    );

    return outContext;
}
