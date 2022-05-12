import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useManageExport_GetRegistrantGoogleAccountsQuery } from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

function useValue() {
    const registrant = useCurrentRegistrant();
    const { subconferenceId } = useAuthParameters();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [googleAccounts, refreshGoogleAccounts] = useManageExport_GetRegistrantGoogleAccountsQuery({
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
            !googleAccounts.data?.registrant_GoogleAccount.some((account) => account.id === selectedGoogleAccountId)
        ) {
            setSelectedGoogleAccountId(null);
        }
    }, [googleAccounts, selectedGoogleAccountId]);

    return useMemo(
        () => ({
            selectedGoogleAccountId,
            setSelectedGoogleAccountId,
            googleAccounts,
            refreshGoogleAccounts,
            finished,
            setFinished,
            reset,
        }),
        [finished, googleAccounts, refreshGoogleAccounts, reset, selectedGoogleAccountId]
    );
}

export const YouTubeExportContext = createContext({} as ReturnType<typeof useValue>);

export function YouTubeExportProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <YouTubeExportContext.Provider value={useValue()}>{props.children}</YouTubeExportContext.Provider>;
}
