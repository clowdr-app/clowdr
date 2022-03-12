import type { CombinedError } from "@urql/core";

export default function extractActualError(error?: CombinedError | string | null): string | undefined {
    return typeof error === "string"
        ? error
        : error?.graphQLErrors?.[0]?.extensions?.internal?.error?.message ??
              error?.graphQLErrors?.[0]?.extensions?.internal?.response?.body ??
              (error?.networkError?.message ? `Network error: ${error?.networkError?.message}` : error?.message) ??
              error ??
              undefined;
}
