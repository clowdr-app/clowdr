import _ from "lodash";
import omitDeep from "omit-deep-lodash";
import { useEffect, useMemo, useState } from "react";
import type { UseQueryArgs, UseQueryResponse, UseQueryState } from "urql";
import * as Urql from "urql";

export function useQuery<Data = any, Variables = object>(
    args: UseQueryArgs<Variables, Data>
): UseQueryResponse<Data, Variables> {
    const [response, refetch] = Urql.useQuery<Data, Variables>(args);

    const [stableResponse, setStableResponse] = useState<UseQueryState<Data, Variables>>(response);

    useEffect(() => {
        const compareDataL =
            response.data && typeof response.data === "object"
                ? // eslint-disable-next-line @typescript-eslint/ban-types
                  omitDeep(response.data as Object, "__typename")
                : response.data;
        const compareDataR =
            stableResponse.data && typeof stableResponse.data === "object"
                ? // eslint-disable-next-line @typescript-eslint/ban-types
                  omitDeep(stableResponse.data as Object, "__typename")
                : stableResponse.data;
        if (!_.isEqual(compareDataL, compareDataR) || !_.isEqual(response.error, stableResponse.error)) {
            setStableResponse(response);
            // console.log("Updating stable response", {
            //     args,
            //     newResponse: response,
            //     previousResponse: stableResponse,
            //     compareDataL,
            //     compareDataR,
            // });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response, stableResponse.data, stableResponse.error]);

    const output = useMemo<UseQueryResponse<Data, Variables>>(
        () => [stableResponse, refetch],
        [refetch, stableResponse]
    );

    return output;
}
