import type { QueryResult } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import React from "react";

export default function ApolloQueryWrapper<TData, TVariables>({
    queryResult,
    children,
}: {
    queryResult: QueryResult<TData, TVariables>;
    children: (data: TData) => React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    return (
        <>
            {queryResult.error ? (
                <>Failed to load data</>
            ) : queryResult.loading ? (
                <Spinner />
            ) : queryResult.data ? (
                children(queryResult.data)
            ) : (
                <>Failed to load data</>
            )}
        </>
    );
}
