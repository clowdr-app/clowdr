interface Assert {
    truthy(input: unknown, message?: string): asserts input;
    string(input: unknown, message?: string): asserts input is string;
}
export declare const assert: Assert;
export {};
//# sourceMappingURL=index.d.ts.map