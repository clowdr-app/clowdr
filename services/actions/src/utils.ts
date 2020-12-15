import assert from "assert";
import { backOff } from "exponential-backoff";

export async function callWithRetry<T>(f: () => Promise<T>): Promise<T> {
    const response = await backOff<T>(f, {
        startingDelay: 500,
        numOfAttempts: 3,
    });
    return response;
}

export function getHostUrl(): string {
    assert(
        process.env.HOST_DOMAIN,
        "HOST_DOMAIN environment variable not provided."
    );
    assert(
        process.env.HOST_SECURE_PROTOCOLS,
        "HOST_SECURE_PROTOCOLS environment variable not provided."
    );
    return `${
        process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http"
    }://${process.env.HOST_DOMAIN}`;
}
