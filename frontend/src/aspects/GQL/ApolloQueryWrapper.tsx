import type { LazyQueryResult, QueryResult } from "@apollo/client";
import { Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import useQueryErrorToast from "./useQueryErrorToast";

export default function ApolloQueryWrapper<TData, TVariables, TInnerData>({
    queryResult,
    getter,
    children,
    noSpinner = false,
}: {
    queryResult: QueryResult<TData, TVariables> | LazyQueryResult<TData, TVariables>;
    getter: (data: TData) => TInnerData | undefined | null;
    children: (data: TInnerData) => React.ReactNode | React.ReactNodeArray;
    noSpinner?: boolean;
}): JSX.Element {
    const innerData = useMemo(() => {
        if (queryResult.data) {
            return getter(queryResult.data);
        } else {
            return undefined;
        }
    }, [getter, queryResult.data]);
    useQueryErrorToast(queryResult.error, false, "ApolloQueryWrapper");

    return (
        <>
            {queryResult.loading ? (
                noSpinner ? (
                    <></>
                ) : (
                    <Spinner />
                )
            ) : queryResult.error ? (
                <Text>An error occurred loading in data - please see further information in notifications.</Text>
            ) : undefined}
            {queryResult.loading && !innerData ? (
                <></>
            ) : !innerData ? (
                <>
                    <Text>No data found</Text>
                    <Text>
                        (You might not have permission to access this. Please contact your conference organisers if you
                        think this is a mistake.)
                    </Text>
                </>
            ) : (
                children(innerData)
            )}
        </>
    );
}
