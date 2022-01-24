import type { LazyQueryResult, QueryResult } from "@apollo/client";
import { Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import useQueryErrorToast from "./useQueryErrorToast";
import { FormattedMessage } from "react-intl";

export default function ApolloQueryWrapper<TData, TVariables, TInnerData>({
    queryResult,
    getter,
    children,
    childrenNoData,
    noSpinner = false,
}: {
    queryResult: QueryResult<TData, TVariables> | LazyQueryResult<TData, TVariables>;
    getter: (data: TData) => TInnerData | undefined | null;
    children: (data: TInnerData) => React.ReactNode | React.ReactNodeArray;
    childrenNoData?: () => React.ReactNode | React.ReactNodeArray;
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
                <Text>
                    <FormattedMessage
                        id="gql.apolloquerywrapper.errorloading"
                        defaultMessage="An error occurred loading in data - please see further information in notifications."
                    />
                </Text>
            ) : undefined}
            {queryResult.loading && !innerData ? (
                <></>
            ) : !innerData ? (
                childrenNoData ? (
                    childrenNoData()
                ) : (
                    <>
                        <Text>
                            <FormattedMessage
                                id="gql.apolloquerywrapper.nodatafound"
                                defaultMessage="No data found"
                            />
                        </Text>
                        <Text>
                            <FormattedMessage
                                id="gql.apolloquerywrapper.mightnothavepermission"
                                defaultMessage="(You might not have permission to access this. Please contact your conference organisers if you think this is a mistake.)"
                            />
                        </Text>
                    </>
                )
            ) : (
                children(innerData)
            )}
        </>
    );
}
