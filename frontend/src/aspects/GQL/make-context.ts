import type { AuthHeaders } from "@midspace/shared-types/auth";
import type { OperationContext } from "urql";

export function makeContext(
    headers: Partial<Record<AuthHeaders | "NoConferenceId", string>>
): Partial<OperationContext> {
    return {
        fetchOptions: {
            headers,
        },
    };
}
