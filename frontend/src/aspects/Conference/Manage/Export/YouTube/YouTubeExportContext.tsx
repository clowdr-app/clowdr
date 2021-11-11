import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useManageExport_GetRegistrantGoogleAccountsQuery } from "../../../../../generated/graphql";
import { useShieldedHeaders } from "../../../../GQL/useShieldedHeaders";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

function useValue() {
    const registrant = useCurrentRegistrant();
    const context = useShieldedHeaders(
        useMemo(
            () => ({
                "X-Auth-Role": "organizer",
            }),
            []
        )
    );
    const googleAccounts = useManageExport_GetRegistrantGoogleAccountsQuery({
        variables: {
            registrantId: registrant?.id,
        },
        context,
    });
    const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState<string | null>(null);
    const [finished, setFinished] = useState<boolean>(false);

    const reset = useCallback(() => {
        setSelectedGoogleAccountId(null);
        setFinished(false);
    }, []);

    useEffect(() => {
        if (
            selectedGoogleAccountId &&
            !googleAccounts[0].data?.registrant_GoogleAccount.some((account) => account.id === selectedGoogleAccountId)
        ) {
            setSelectedGoogleAccountId(null);
        }
    }, [googleAccounts, selectedGoogleAccountId]);

    return {
        selectedGoogleAccountId,
        setSelectedGoogleAccountId,
        googleAccounts,
        finished,
        setFinished,
        reset,
    };
}

export const YouTubeExportContext = createContext({} as ReturnType<typeof useValue>);

export function YouTubeExportProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <YouTubeExportContext.Provider value={useValue()}>{props.children}</YouTubeExportContext.Provider>;
}
