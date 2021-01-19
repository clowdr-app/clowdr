import type { LazyQueryResult, QueryResult } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import useQueryErrorToast from "./useQueryErrorToast";

export default function ApolloQueryWrapper<TData, TVariables, TInnerData>({
    queryResult,
    getter,
    children,
}: {
    queryResult: QueryResult<TData, TVariables> | LazyQueryResult<TData, TVariables>;
    getter: (data: TData) => TInnerData | undefined | null;
    children: (data: TInnerData) => React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const innerData = useMemo(() => {
        if (queryResult.data) {
            return getter(queryResult.data);
        } else {
            return undefined;
        }
    }, [getter, queryResult.data]);
    useQueryErrorToast(queryResult.error, "ApolloQueryWrapper");

    return (
        <>
            {queryResult.loading ? (
                <Spinner />
            ) : queryResult.error ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : undefined}
            {queryResult.loading && !innerData ? <></> : !innerData ? <>No data found</> : children(innerData)}
        </>
    );
}
