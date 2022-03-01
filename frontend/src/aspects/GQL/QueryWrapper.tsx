import { Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { OperationResult, UseQueryState } from "urql";
import useQueryErrorToast from "./useQueryErrorToast";

export default function QueryWrapper<TData, TVariables, TInnerData>({
    queryResult,
    getter,
    children,
    childrenNoData,
    noSpinner = false,
}: {
    queryResult:
        | UseQueryState<TData, TVariables>
        | (OperationResult<TData, TVariables> & { fetching: boolean; stale: boolean })
        | { fetching: boolean; stale: boolean };
    getter: (data: TData) => TInnerData | undefined | null;
    children: (data: TInnerData) => React.ReactNode | React.ReactNode[];
    childrenNoData?: () => React.ReactNode | React.ReactNode[];
    noSpinner?: boolean;
}): JSX.Element {
    const innerData = useMemo(() => {
        if ("data" in queryResult && queryResult.data) {
            return getter(queryResult.data);
        } else {
            return undefined;
        }
    }, [getter, queryResult]);
    useQueryErrorToast("error" in queryResult ? queryResult?.error : undefined, false, "QueryWrapper");

    return (
        <>
            {queryResult.fetching || (queryResult.stale && !innerData) ? (
                noSpinner ? undefined : (
                    <Spinner />
                )
            ) : queryResult && "error" in queryResult && queryResult.error ? (
                <Text>An error occurred loading in data - please see further information in notifications.</Text>
            ) : undefined}
            {queryResult.fetching || (queryResult.stale && !innerData) ? undefined : !innerData ? (
                childrenNoData ? (
                    childrenNoData()
                ) : (
                    <>
                        <Text>No data found</Text>
                        <Text>
                            (You might not have permission to access this. Please contact your conference organisers if
                            you think this is a mistake.)
                        </Text>
                    </>
                )
            ) : (
                children(innerData)
            )}
        </>
    );
}
