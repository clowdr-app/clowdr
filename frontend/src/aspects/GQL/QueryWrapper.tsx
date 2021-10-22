import { Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { UseQueryState } from "urql";
import useQueryErrorToast from "./useQueryErrorToast";

export default function QueryWrapper<TData, TVariables, TInnerData>({
    queryResult,
    getter,
    children,
    noSpinner = false,
}: {
    queryResult: UseQueryState<TData, TVariables>;
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
    useQueryErrorToast(queryResult.error, false, "QueryWrapper");

    return (
        <>
            {queryResult.fetching ? (
                noSpinner ? (
                    <></>
                ) : (
                    <Spinner />
                )
            ) : queryResult.error ? (
                <Text>An error occurred loading in data - please see further information in notifications.</Text>
            ) : undefined}
            {queryResult.fetching && !innerData ? (
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
