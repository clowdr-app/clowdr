import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import type {
    RegistrantDataFragment,
    RegistrantsByIdQuery,
    RegistrantsByIdQueryVariables,
    RegistrantsByUserIdQuery,
    RegistrantsByUserIdQueryVariables,
} from "../../generated/graphql";
import { RegistrantsByIdDocument, RegistrantsByUserIdDocument } from "../../generated/graphql";
import usePolling from "../Hooks/usePolling";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "./useConference";

gql`
    query RegistrantsById($conferenceId: uuid!, $registrantIds: [uuid!]!) @cached {
        registrant_Registrant(where: { id: { _in: $registrantIds }, conferenceId: { _eq: $conferenceId } }) {
            ...RegistrantData
        }
    }

    query RegistrantsByUserId($conferenceId: uuid!, $userIds: [String!]!) @cached {
        registrant_Registrant(where: { userId: { _in: $userIds }, conferenceId: { _eq: $conferenceId } }) {
            ...RegistrantData
        }
    }
`;

type NotificationCallback = (data: RegistrantDataFragment, subscriptionId: number) => void;

export type RegistrantIdSpec = { user: string } | { registrant: string };

interface RegistrantsCtx {
    subscribe: (
        id: RegistrantIdSpec,
        notify: NotificationCallback
    ) => { id: number; registrant?: RegistrantDataFragment };
    unsubscribe: (subscriptionId: number) => void;
}

const RegistrantsContext = React.createContext<RegistrantsCtx | undefined>(undefined);

export function useRegistrantsContext(): RegistrantsCtx {
    const ctx = React.useContext(RegistrantsContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function useRegistrant(id: RegistrantIdSpec | null | undefined): RegistrantDataFragment | null {
    const [registrant, setRegistrant] = useState<RegistrantDataFragment | null>(null);
    const registrants = useRegistrantsContext();

    useEffect(() => {
        let sub: { id: number; registrant?: RegistrantDataFragment | undefined } | undefined;
        if (id) {
            sub = registrants.subscribe(id, (x, subId) => {
                setRegistrant(x);
                registrants.unsubscribe(subId);
            });
            if (sub.registrant) {
                setRegistrant(sub.registrant);
            } else {
                setRegistrant(null);
            }
        }
        return () => {
            if (sub) {
                registrants.unsubscribe(sub.id);
            }
        };
    }, [registrants, id]);

    return registrant;
}

export function useRegistrants(ids: RegistrantIdSpec[]): RegistrantDataFragment[] {
    const registrantsCtx = useRegistrantsContext();

    const _registrants = useRef<{
        updatedAt: number;
        data: RegistrantDataFragment[];
    }>({
        updatedAt: 0,
        data: [],
    });

    useEffect(() => {
        const subs: number[] = [];
        const result: RegistrantDataFragment[] = [];
        for (const id of ids) {
            const sub = registrantsCtx.subscribe(id, (registrant, subId) => {
                registrantsCtx.unsubscribe(subId);

                _registrants.current.updatedAt = Date.now();
                const old = _registrants.current.data;
                if (old?.some((x) => x.id === registrant.id)) {
                    _registrants.current.data = old.map((x) => (x.id === registrant.id ? registrant : x));
                } else if (old) {
                    _registrants.current.data = [...old, registrant];
                } else {
                    _registrants.current.data = [registrant];
                }
            });
            subs.push(sub.id);
            if (sub.registrant) {
                result.push(sub.registrant);
            }
        }

        _registrants.current.updatedAt = Date.now();
        _registrants.current.data = result;

        return () => {
            for (const sub of subs) {
                registrantsCtx.unsubscribe(sub);
            }
        };
    }, [registrantsCtx, ids]);

    const [registrants, setRegistrants] = useState<RegistrantDataFragment[]>([]);
    const lastAppliedUpdate = useRef<number>(0);
    const refresh = useCallback(() => {
        if (_registrants.current.updatedAt !== lastAppliedUpdate.current) {
            setRegistrants(_registrants.current.data);
        }
    }, []);
    usePolling(refresh, 2000, true);

    return registrants;
}

interface RegistrantCacheEntry {
    fetchedAt: number;
    registrant: RegistrantDataFragment;
}

interface Subscription {
    id: RegistrantIdSpec;
    notify: NotificationCallback;
    lastNotifiedAt: number;
}

export default function RegistrantsContextProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const fullRefetchInterval = 60 * 60 * 1000; // 1 hour
    const [checkInterval, setCheckInterval] = useState<number>(1000);
    const conference = useConference();
    const currentUser = useMaybeCurrentUser();
    const client = useClient();
    const registrants = React.useRef<Map<string, RegistrantCacheEntry>>(new Map());
    const usersToRegistrantIds = React.useRef<Map<string, string>>(new Map());
    const subscriptions = React.useRef<Map<number, Subscription>>(new Map());
    const subscriptionIdGen = React.useRef<number>(1);

    const subscribe = useCallback((id: RegistrantIdSpec, cb: NotificationCallback) => {
        const subId = subscriptionIdGen.current++;
        subscriptions.current.set(subId, { id, notify: cb, lastNotifiedAt: -1 });
        if ("registrant" in id) {
            const registrant = registrants.current.get(id.registrant);
            return {
                id: subId,
                registrant: registrant?.registrant,
            };
        } else {
            const registrantId = usersToRegistrantIds.current.get(id.user);
            const registrant = registrantId ? registrants.current.get(registrantId) : undefined;
            return {
                id: subId,
                registrant: registrant?.registrant,
            };
        }
    }, []);

    const unsubscribe = useCallback((subId: number) => {
        subscriptions.current.delete(subId);
    }, []);

    useEffect(() => {
        usersToRegistrantIds.current = new Map();
    }, [conference.id]);

    useEffect(() => {
        if (!currentUser.user) {
            return;
        }

        const tId = setInterval(async () => {
            const requiredRegistrant_Ids = new Set<string>();
            const requiredRegistrant_SubIds = new Set<number>();

            const requiredUser_Ids = new Set<string>();
            const requiredUser_SubIds = new Set<number>();
            let now = Date.now();
            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    if ("registrant" in sub.id) {
                        const existingRegistrantData = registrants.current.get(sub.id.registrant);
                        if (!existingRegistrantData || existingRegistrantData.fetchedAt < now - fullRefetchInterval) {
                            requiredRegistrant_Ids.add(sub.id.registrant);
                            requiredRegistrant_SubIds.add(key);
                        }
                    } else {
                        const existingRegistrantId = usersToRegistrantIds.current.get(sub.id.user);
                        const existingRegistrantData = existingRegistrantId
                            ? registrants.current.get(existingRegistrantId)
                            : undefined;
                        if (!existingRegistrantData || existingRegistrantData.fetchedAt < now - fullRefetchInterval) {
                            requiredUser_Ids.add(sub.id.user);
                            requiredUser_SubIds.add(key);
                        }
                    }
                }
            });

            try {
                if (requiredRegistrant_Ids.size > 0) {
                    const filteredIds = [...requiredRegistrant_Ids.values()].filter(
                        (x) => x !== undefined && x !== null && x !== ""
                    );
                    if (filteredIds.length > 0) {
                        const datas = await client
                            .query<RegistrantsByIdQuery, RegistrantsByIdQueryVariables>(
                                RegistrantsByIdDocument,
                                {
                                    registrantIds: filteredIds,
                                    conferenceId: conference.id,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: "attendee",
                                        },
                                    },
                                }
                            )
                            .toPromise();

                        if (datas.data) {
                            if (
                                filteredIds.length !== datas.data.registrant_Registrant.length &&
                                datas.data.registrant_Registrant.length === 0
                            ) {
                                // We didn't get any of the ids back - probably deleted or some permissions issue.
                                // In which case we want to avoid endless refetching.
                                for (const subId of requiredRegistrant_SubIds) {
                                    subscriptions.current.delete(subId);
                                }
                            } else {
                                now = Date.now();
                                datas.data.registrant_Registrant.forEach((registrant) => {
                                    if (registrant.userId) {
                                        usersToRegistrantIds.current.set(registrant.userId, registrant.id);
                                    }
                                    registrants.current.set(registrant.id, { registrant, fetchedAt: now });
                                });
                            }
                        }
                    }
                }

                if (requiredUser_Ids.size > 0) {
                    const filteredIds = [...requiredUser_Ids.values()].filter(
                        (x) => x !== undefined && x !== null && x !== ""
                    );
                    if (filteredIds.length > 0) {
                        const datas = await client
                            .query<RegistrantsByUserIdQuery, RegistrantsByUserIdQueryVariables>(
                                RegistrantsByUserIdDocument,
                                {
                                    userIds: filteredIds,
                                    conferenceId: conference.id,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: "attendee",
                                        },
                                    },
                                }
                            )
                            .toPromise();

                        if (datas.data) {
                            if (
                                filteredIds.length !== datas.data.registrant_Registrant.length &&
                                datas.data.registrant_Registrant.length === 0
                            ) {
                                // We didn't get any of the ids back - probably deleted or some permissions issue.
                                // In which case we want to avoid endless refetching.
                                for (const subId of requiredUser_SubIds) {
                                    subscriptions.current.delete(subId);
                                }
                            } else {
                                now = Date.now();
                                datas.data.registrant_Registrant.forEach((registrant) => {
                                    if (registrant.userId) {
                                        usersToRegistrantIds.current.set(registrant.userId, registrant.id);
                                    }
                                    registrants.current.set(registrant.id, { registrant, fetchedAt: now });
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Could not fetch registrants!", e);
                setCheckInterval(60000);
            }

            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    sub.lastNotifiedAt = now;

                    if ("registrant" in sub.id) {
                        const registrant = registrants.current.get(sub.id.registrant);
                        if (registrant) {
                            sub.notify(registrant.registrant, key);
                        }
                    } else {
                        const registrantId = usersToRegistrantIds.current.get(sub.id.user);
                        const registrant = registrantId ? registrants.current.get(registrantId) : undefined;
                        if (registrant) {
                            sub.notify(registrant.registrant, key);
                        }
                    }
                }
            });

            const limit = 3000;
            if (checkInterval < limit) {
                setCheckInterval((old) => Math.min(old * 1.5, limit));
            } else if (checkInterval > limit * 1.5) {
                setCheckInterval(limit);
            }
        }, checkInterval);
        return () => {
            clearInterval(tId);
        };
    }, [client, checkInterval, conference.id, fullRefetchInterval, currentUser]);

    const ctx = useMemo(
        () => ({
            subscribe,
            unsubscribe,
        }),
        [subscribe, unsubscribe]
    );

    return <RegistrantsContext.Provider value={ctx}>{children}</RegistrantsContext.Provider>;
}
