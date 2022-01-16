import { backOff } from "exponential-backoff";

export async function callWithRetry<T>(f: () => Promise<T>): Promise<T> {
    const response = await backOff<T>(f, {
        startingDelay: 500,
        numOfAttempts: 3,
    });
    return response;
}
