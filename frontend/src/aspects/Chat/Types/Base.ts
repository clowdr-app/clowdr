export type Maybe<T> = T | undefined;

export interface MinMax {
    min: Maybe<number>;
    max: Maybe<number>;
}

export interface MinMaxWithValue extends MinMax {
    value: number;
}
