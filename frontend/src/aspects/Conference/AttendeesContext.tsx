import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttendeeDataFragment, useAttendeesByIdQuery, useAttendeesByUserIdQuery } from "../../generated/graphql";
import usePolling from "../Generic/usePolling";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "./useConference";

gql`
    query AttendeesById($conferenceId: uuid!, $attendeeIds: [uuid!]!) {
        Attendee(where: { id: { _in: $attendeeIds }, conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeData
        }
    }

    query AttendeesByUserId($conferenceId: uuid!, $userIds: [String!]!) {
        Attendee(where: { userId: { _in: $userIds }, conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeData
        }
    }
`;

type NotificationCallback = (data: AttendeeDataFragment, subscriptionId: number) => void;

export type AttendeeIdSpec = { user: string } | { attendee: string };

interface AttendeesCtx {
    subscribe: (id: AttendeeIdSpec, notify: NotificationCallback) => { id: number; attendee?: AttendeeDataFragment };
    unsubscribe: (subscriptionId: number) => void;
}

const AttendeesContext = React.createContext<AttendeesCtx | undefined>(undefined);

export function useAttendeesContext(): AttendeesCtx {
    const ctx = React.useContext(AttendeesContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function useAttendee(id: AttendeeIdSpec | null | undefined): AttendeeDataFragment | null {
    const [attendee, setAttendee] = useState<AttendeeDataFragment | null>(null);
    const attendees = useAttendeesContext();

    useEffect(() => {
        let sub: { id: number; attendee?: AttendeeDataFragment | undefined } | undefined;
        if (id) {
            sub = attendees.subscribe(id, (x, subId) => {
                setAttendee(x);
                attendees.unsubscribe(subId);
            });
            if (sub.attendee) {
                setAttendee(sub.attendee);
            } else {
                setAttendee(null);
            }
        }
        return () => {
            if (sub) {
                attendees.unsubscribe(sub.id);
            }
        };
    }, [attendees, id]);

    return attendee;
}

export function useAttendees(ids: AttendeeIdSpec[]): AttendeeDataFragment[] {
    const attendeesCtx = useAttendeesContext();

    const _attendees = useRef<{
        updatedAt: number;
        data: AttendeeDataFragment[];
    }>({
        updatedAt: 0,
        data: [],
    });

    useEffect(() => {
        const subs: number[] = [];
        const result: AttendeeDataFragment[] = [];
        for (const id of ids) {
            const sub = attendeesCtx.subscribe(id, (attendee, subId) => {
                attendeesCtx.unsubscribe(subId);

                _attendees.current.updatedAt = Date.now();
                const old = _attendees.current.data;
                if (old?.some((x) => x.id === attendee.id)) {
                    _attendees.current.data = old.map((x) => (x.id === attendee.id ? attendee : x));
                } else if (old) {
                    _attendees.current.data = [...old, attendee];
                } else {
                    _attendees.current.data = [attendee];
                }
            });
            subs.push(sub.id);
            if (sub.attendee) {
                result.push(sub.attendee);
            }
        }

        _attendees.current.updatedAt = Date.now();
        _attendees.current.data = result;

        return () => {
            for (const sub of subs) {
                attendeesCtx.unsubscribe(sub);
            }
        };
    }, [attendeesCtx, ids]);

    const [attendees, setAttendees] = useState<AttendeeDataFragment[]>([]);
    const lastAppliedUpdate = useRef<number>(0);
    const refresh = useCallback(() => {
        if (_attendees.current.updatedAt !== lastAppliedUpdate.current) {
            setAttendees(_attendees.current.data);
        }
    }, []);
    usePolling(refresh, 2000, true);

    return attendees;
}

interface AttendeeCacheEntry {
    fetchedAt: number;
    attendee: AttendeeDataFragment;
}

interface Subscription {
    id: AttendeeIdSpec;
    notify: NotificationCallback;
    lastNotifiedAt: number;
}

export default function AttendeesContextProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const fullRefetchInterval = 60 * 60 * 1000; // 1 hour
    const [checkInterval, setCheckInterval] = useState<number>(1000);
    const conference = useConference();
    const currentUser = useMaybeCurrentUser();
    const attendeesByIdQ = useAttendeesByIdQuery({
        skip: true,
    });
    const attendeesByUserIdQ = useAttendeesByUserIdQuery({
        skip: true,
    });

    const attendees = React.useRef<Map<string, AttendeeCacheEntry>>(new Map());
    const usersToAttendeeIds = React.useRef<Map<string, string>>(new Map());
    const subscriptions = React.useRef<Map<number, Subscription>>(new Map());
    const subscriptionIdGen = React.useRef<number>(1);

    const subscribe = useCallback((id: AttendeeIdSpec, cb: NotificationCallback) => {
        const subId = subscriptionIdGen.current++;
        subscriptions.current.set(subId, { id, notify: cb, lastNotifiedAt: -1 });
        if ("attendee" in id) {
            const attendee = attendees.current.get(id.attendee);
            return {
                id: subId,
                attendee: attendee?.attendee,
            };
        } else {
            const attendeeId = usersToAttendeeIds.current.get(id.user);
            const attendee = attendeeId ? attendees.current.get(attendeeId) : undefined;
            return {
                id: subId,
                attendee: attendee?.attendee,
            };
        }
    }, []);

    const unsubscribe = useCallback((subId: number) => {
        subscriptions.current.delete(subId);
    }, []);

    useEffect(() => {
        usersToAttendeeIds.current = new Map();
    }, [conference.id]);

    useEffect(() => {
        if (!currentUser.user) {
            return;
        }

        const tId = setInterval(async () => {
            const requiredAttendee_Ids = new Set<string>();
            const requiredAttendee_SubIds = new Set<number>();

            const requiredUser_Ids = new Set<string>();
            const requiredUser_SubIds = new Set<number>();
            let now = Date.now();
            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    if ("attendee" in sub.id) {
                        const existingAttendeeData = attendees.current.get(sub.id.attendee);
                        if (!existingAttendeeData || existingAttendeeData.fetchedAt < now - fullRefetchInterval) {
                            requiredAttendee_Ids.add(sub.id.attendee);
                            requiredAttendee_SubIds.add(key);
                        }
                    } else {
                        const existingAttendeeId = usersToAttendeeIds.current.get(sub.id.user);
                        const existingAttendeeData = existingAttendeeId
                            ? attendees.current.get(existingAttendeeId)
                            : undefined;
                        if (!existingAttendeeData || existingAttendeeData.fetchedAt < now - fullRefetchInterval) {
                            requiredUser_Ids.add(sub.id.user);
                            requiredUser_SubIds.add(key);
                        }
                    }
                }
            });

            try {
                if (requiredAttendee_Ids.size > 0) {
                    const filteredIds = [...requiredAttendee_Ids.values()].filter(
                        (x) => x !== undefined && x !== null && x !== ""
                    );
                    if (filteredIds.length > 0) {
                        const datas = await attendeesByIdQ.refetch({
                            attendeeIds: filteredIds,
                            conferenceId: conference.id,
                        });

                        if (filteredIds.length !== datas.data.Attendee.length && datas.data.Attendee.length === 0) {
                            // We didn't get any of the ids back - probably deleted or some permissions issue.
                            // In which case we want to avoid endless refetching.
                            for (const subId of requiredAttendee_SubIds) {
                                subscriptions.current.delete(subId);
                            }
                        } else {
                            now = Date.now();
                            datas.data.Attendee.forEach((attendee) => {
                                if (attendee.userId) {
                                    usersToAttendeeIds.current.set(attendee.userId, attendee.id);
                                }
                                attendees.current.set(attendee.id, { attendee, fetchedAt: now });
                            });
                        }
                    }
                }

                if (requiredUser_Ids.size > 0) {
                    const filteredIds = [...requiredUser_Ids.values()].filter(
                        (x) => x !== undefined && x !== null && x !== ""
                    );
                    if (filteredIds.length > 0) {
                        const datas = await attendeesByUserIdQ.refetch({
                            userIds: filteredIds,
                            conferenceId: conference.id,
                        });

                        if (filteredIds.length !== datas.data.Attendee.length && datas.data.Attendee.length === 0) {
                            // We didn't get any of the ids back - probably deleted or some permissions issue.
                            // In which case we want to avoid endless refetching.
                            for (const subId of requiredUser_SubIds) {
                                subscriptions.current.delete(subId);
                            }
                        } else {
                            now = Date.now();
                            datas.data.Attendee.forEach((attendee) => {
                                if (attendee.userId) {
                                    usersToAttendeeIds.current.set(attendee.userId, attendee.id);
                                }
                                attendees.current.set(attendee.id, { attendee, fetchedAt: now });
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Could not fetch attendees!", e);
                setCheckInterval(60000);
            }

            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    sub.lastNotifiedAt = now;

                    if ("attendee" in sub.id) {
                        const attendee = attendees.current.get(sub.id.attendee);
                        if (attendee) {
                            sub.notify(attendee.attendee, key);
                        }
                    } else {
                        const attendeeId = usersToAttendeeIds.current.get(sub.id.user);
                        const attendee = attendeeId ? attendees.current.get(attendeeId) : undefined;
                        if (attendee) {
                            sub.notify(attendee.attendee, key);
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
    }, [attendeesByIdQ, attendeesByUserIdQ, checkInterval, conference.id, fullRefetchInterval, currentUser]);

    const ctx = useMemo(
        () => ({
            subscribe,
            unsubscribe,
        }),
        [subscribe, unsubscribe]
    );

    return <AttendeesContext.Provider value={ctx}>{children}</AttendeesContext.Provider>;
}
