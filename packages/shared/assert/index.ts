interface Assert {
    truthy(input: unknown, message?: string): asserts input;
    string(input: unknown, message?: string): asserts input is string;
}

export const assert: Assert = {
    truthy: (input: unknown, message?: string) => {
        if (!input) {
            throw new Error(message ?? "Expected truthy input.");
        }
    },
    string: (input: unknown, message?: string) => {
        if (typeof input !== "string") {
            throw new Error(message ?? "Expected string input.");
        }
    },
};
