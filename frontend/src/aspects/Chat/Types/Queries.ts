import type { ApolloError } from "@apollo/client";
import type { Maybe } from "./Base";

export interface Query<T> {
    data: Maybe<T>;
    loading: boolean;
    error: Maybe<ApolloError>;
    refetch: Maybe<() => Promise<T>>;
}

export interface MutableQuery<T, M = T> extends Query<T> {
    mutate: Maybe<(value: M) => Promise<void>>;
}
