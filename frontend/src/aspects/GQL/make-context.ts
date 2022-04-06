import type { AuthHeader } from "@midspace/shared-types/auth";
import type { OperationContext } from "urql";

export function makeContext(
    headers: Partial<Record<AuthHeader | "NoConferenceId", string>>,
    additionalTypenames?: string[]
): Partial<OperationContext> {
    return {
        fetchOptions: {
            headers,
        },
        additionalTypenames,
    };
}
