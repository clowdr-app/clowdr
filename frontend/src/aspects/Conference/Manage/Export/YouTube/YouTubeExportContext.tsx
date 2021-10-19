import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { useManageExport_GetRegistrantGoogleAccountsQuery } from "../../../../../generated/graphql";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

function useValue() {
    const registrant = useCurrentRegistrant();
    const googleAccounts = useManageExport_GetRegistrantGoogleAccountsQuery({
        variables: {
            registrantId: registrant?.id,
        },
    });
    const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState<string | null>(null);

    useEffect(() => {
        if (
            selectedGoogleAccountId &&
            !googleAccounts.data?.registrant_GoogleAccount.some((account) => account.id === selectedGoogleAccountId)
        ) {
            setSelectedGoogleAccountId(null);
        }
    }, [googleAccounts.data?.registrant_GoogleAccount, selectedGoogleAccountId]);

    return {
        selectedGoogleAccountId,
        setSelectedGoogleAccountId,
        googleAccounts,
    };
}

export const YouTubeExportContext = createContext({} as ReturnType<typeof useValue>);

export function YouTubeExportProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <YouTubeExportContext.Provider value={useValue()}>{props.children}</YouTubeExportContext.Provider>;
}
