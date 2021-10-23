import React, { useMemo, useState } from "react";

export interface AuthParameters {
    conferencePath: string | null;
    conferenceSlug: string | null;
    conferenceId: string | null;
    subconferenceId: string | null;
    setConferencePath: (value: string | null) => void;
    setConferenceSlug: (value: string | null) => void;
    setConferenceId: (value: string | null) => void;
    setSubconferenceId: (value: string | null) => void;
}

const AuthParameters = React.createContext<AuthParameters | null>(null);

export function useAuthParameters(): AuthParameters {
    const ctx = React.useContext(AuthParameters);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider? (useAuthParameters)");
    }
    return ctx;
}

/*
    query ConferenceById_WithUser($slug: String!, $userId: String!) {
        conference_Conference(where: { slug: { _eq: $slug } }) {
            id
        }
    }
*/

export function AuthParametersProvider({ children }: React.PropsWithChildren<Record<string, any>>): JSX.Element {
    const [conferencePath, setConferencePath] = useState<string | null>(null);
    const [conferenceSlug, setConferenceSlug] = useState<string | null>(null);
    // TODO: Use conference slug to detect or fetch corresponding conference id

    const [conferenceId, setConferenceId] = useState<string | null>(null);
    const [subconferenceId, setSubconferenceId] = useState<string | null>(null);
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
        }),
        [conferencePath, conferenceSlug, conferenceId, subconferenceId]
    );

    return <AuthParameters.Provider value={ctx}>{children}</AuthParameters.Provider>;
}
