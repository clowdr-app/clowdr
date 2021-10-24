import { useEffect, useMemo, useState } from "react";
import type { OperationContext } from "urql";

export function useShieldedHeaders(headers: Record<string, string>): Partial<OperationContext> | undefined {
    const [outHeaders, setOutHeaders] = useState<Record<string, string>>({});

    useEffect(() => {
        const inKeys = Object.keys(headers);
        const outKeys = Object.keys(outHeaders);
        if (inKeys.length !== outKeys.length) {
            setOutHeaders(headers);
        } else {
            let different = outKeys.some((outKey) => !inKeys.includes(outKey));
            if (!different) {
                for (const inKey of inKeys) {
                    if (outHeaders[inKey] !== headers[inKey]) {
                        different = true;
                        break;
                    }
                }
            }

            if (different) {
                setOutHeaders(headers);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [headers]);

    const outContext = useMemo<Partial<OperationContext> | undefined>(
        () => ({
            fetchOptions: {
                headers: outHeaders,
            },
        }),
        [outHeaders]
    );

    return outContext;
}
