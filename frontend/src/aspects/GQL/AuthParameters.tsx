import React, { useMemo, useState } from "react";

export interface AuthParameters {
    conferencePath: string | null;
    conferenceSlug: string | null;
    conferenceId: string | null;
    subconferenceId: string | null;
    isOnManagementPage: boolean;
    setConferencePath: (value: string | null) => void;
    setConferenceSlug: (value: string | null) => void;
    setConferenceId: (value: string | null) => void;
    setSubconferenceId: (value: string | null) => void;
    setIsOnManagementPage: (value: boolean) => void;
}

const AuthParameters = React.createContext<AuthParameters | null>(null);

export function useAuthParameters(): AuthParameters {
    const ctx = React.useContext(AuthParameters);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider? (useAuthParameters)");
    }
    return ctx;
}

export function AuthParametersProvider({ children }: React.PropsWithChildren<Record<string, any>>): JSX.Element {
    const [conferencePath, setConferencePath] = useState<string | null>(null);
    const [conferenceSlug, setConferenceSlug] = useState<string | null>(null);
    const [conferenceId, setConferenceId] = useState<string | null>(null);
    const [subconferenceId, setSubconferenceId] = useState<string | null>(null);
    const [isOnManagementPage, setIsOnManagementPage] = useState<boolean>(false);
    const ctx = useMemo(
        () => ({
            conferencePath,
            setConferencePath,
            conferenceSlug,
            setConferenceSlug,
            conferenceId,
            setConferenceId,
            subconferenceId,
            setSubconferenceId,
            isOnManagementPage,
            setIsOnManagementPage,
        }),
        [conferencePath, conferenceSlug, conferenceId, subconferenceId, isOnManagementPage]
    );

    return <AuthParameters.Provider value={ctx}>{children}</AuthParameters.Provider>;
}
