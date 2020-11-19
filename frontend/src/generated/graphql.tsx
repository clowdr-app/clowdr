import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K];
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    json: any;
    timestamptz: any;
    uuid: any;
};

export type EchoInput = {
    message: Scalars["String"];
};

export type EchoOutput = {
    __typename?: "EchoOutput";
    message: Scalars["String"];
};

export type SampleInput = {
    password: Scalars["String"];
    username: Scalars["String"];
};

export type SampleOutput = {
    __typename?: "SampleOutput";
    accessToken: Scalars["String"];
};

/** expression to compare columns of type json. All fields are combined with logical 'AND'. */
export type Json_Comparison_Exp = {
    _eq?: Maybe<Scalars["json"]>;
    _gt?: Maybe<Scalars["json"]>;
    _gte?: Maybe<Scalars["json"]>;
    _in?: Maybe<Array<Scalars["json"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["json"]>;
    _lte?: Maybe<Scalars["json"]>;
    _neq?: Maybe<Scalars["json"]>;
    _nin?: Maybe<Array<Scalars["json"]>>;
};

/** column ordering options */
export enum Order_By {
    /** in the ascending order, nulls last */
    Asc = "asc",
    /** in the ascending order, nulls first */
    AscNullsFirst = "asc_nulls_first",
    /** in the ascending order, nulls last */
    AscNullsLast = "asc_nulls_last",
    /** in the descending order, nulls first */
    Desc = "desc",
    /** in the descending order, nulls first */
    DescNullsFirst = "desc_nulls_first",
    /** in the descending order, nulls last */
    DescNullsLast = "desc_nulls_last",
}

/** query root */
export type Query_Root = {
    __typename?: "query_root";
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
};

/** query root */
export type Query_RootEchoArgs = {
    input: EchoInput;
};

/** subscription root */
export type Subscription_Root = {
    __typename?: "subscription_root";
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
};

/** subscription root */
export type Subscription_RootEchoArgs = {
    input: EchoInput;
};

export type EchoQueryQueryVariables = Exact<{
    message: Scalars["String"];
}>;

export type EchoQueryQuery = { __typename?: "query_root" } & {
    echo?: Maybe<{ __typename?: "EchoOutput" } & Pick<EchoOutput, "message">>;
};

export const EchoQueryDocument = gql`
    query EchoQuery($message: String!) {
        echo(input: { message: $message }) {
            message
        }
    }
`;

/**
 * __useEchoQueryQuery__
 *
 * To run a query within a React component, call `useEchoQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useEchoQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEchoQueryQuery({
 *   variables: {
 *      message: // value for 'message'
 *   },
 * });
 */
export function useEchoQueryQuery(
    baseOptions: Apollo.QueryHookOptions<
        EchoQueryQuery,
        EchoQueryQueryVariables
    >
) {
    return Apollo.useQuery<EchoQueryQuery, EchoQueryQueryVariables>(
        EchoQueryDocument,
        baseOptions
    );
}
export function useEchoQueryLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<
        EchoQueryQuery,
        EchoQueryQueryVariables
    >
) {
    return Apollo.useLazyQuery<EchoQueryQuery, EchoQueryQueryVariables>(
        EchoQueryDocument,
        baseOptions
    );
}
export type EchoQueryQueryHookResult = ReturnType<typeof useEchoQueryQuery>;
export type EchoQueryLazyQueryHookResult = ReturnType<
    typeof useEchoQueryLazyQuery
>;
export type EchoQueryQueryResult = Apollo.QueryResult<
    EchoQueryQuery,
    EchoQueryQueryVariables
>;
