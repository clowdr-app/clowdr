declare type Mutable<T extends Record<string, unknown>> = {
    -readonly [K in keyof T]: T[K];
};

type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };
