import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AttendeeDataFragment, useAttendeesByIdQuery } from "../../generated/graphql";
import { useConference } from "./useConference";

gql`
    query AttendeesById($conferenceId: uuid!, $attendeeIds: [uuid!]!) {
        Attendee(where: { id: { _in: $attendeeIds }, conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeData
        }
    }
`;

type NotificationCallback = (data: AttendeeDataFragment, subscriptionId: number) => void;

interface AttendeesCtx {
    subscribe: (attendeeId: string, notify: NotificationCallback) => { id: number; attendee?: AttendeeDataFragment };
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

export function useAttendee(id: string | null | undefined): AttendeeDataFragment | null {
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

export function useAttendees(ids: string[]): AttendeeDataFragment[] {
    const [attendees, setAttendees] = useState<AttendeeDataFragment[]>([]);
    const attendeesCtx = useAttendeesContext();

    useEffect(() => {
        const subs: { id: number; attendee?: AttendeeDataFragment | undefined }[] = [];
        const result: AttendeeDataFragment[] = [];
        for (const id of ids) {
            const sub = attendeesCtx.subscribe(id, (attendee, subId) => {
                setAttendees((old) => {
                    if (old?.some((x) => x.id === attendee.id)) {
                        return old.map((x) => (x.id === attendee.id ? attendee : x));
                    } else if (old) {
                        return [...old, attendee];
                    }
                    return [attendee];
                });
                attendeesCtx.unsubscribe(subId);
            });
            subs.push(sub);
            if (sub.attendee) {
                result.push(sub.attendee);
            }
        }
        setAttendees(result);
        return () => {
            for (const sub of subs) {
                attendeesCtx.unsubscribe(sub.id);
            }
        };
    }, [attendeesCtx, ids]);

    return attendees;
}

interface AttendeeCacheEntry {
    fetchedAt: number;
    attendee: AttendeeDataFragment;
}

interface Subscription {
    attendeeId: string;
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
    const attendeesByIdQ = useAttendeesByIdQuery({
        skip: true,
    });

    const attendees = React.useRef<Map<string, AttendeeCacheEntry>>(new Map());
    const subscriptions = React.useRef<Map<number, Subscription>>(new Map());
    const subscriptionIdGen = React.useRef<number>(1);

    const subscribe = useCallback((attendeeId: string, cb: NotificationCallback) => {
        const subId = subscriptionIdGen.current++;
        subscriptions.current.set(subId, { attendeeId, notify: cb, lastNotifiedAt: -1 });
        const attendee = attendees.current.get(attendeeId);
        return {
            id: subId,
            attendee: attendee?.attendee,
        };
    }, []);

    const unsubscribe = useCallback((subId: number) => {
        subscriptions.current.delete(subId);
    }, []);

    useEffect(() => {
        const tId = setInterval(async () => {
            const requiredAttendeeIds = new Set<string>();
            const requiredSubIds = new Set<number>();
            let now = Date.now();
            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    const existingAttendeeData = attendees.current.get(sub.attendeeId);
                    if (!existingAttendeeData || existingAttendeeData.fetchedAt < now - fullRefetchInterval) {
                        requiredAttendeeIds.add(sub.attendeeId);
                        requiredSubIds.add(key);
                    }
                }
            });

            try {
                if (requiredAttendeeIds.size > 0) {
                    const filteredIds = [...requiredAttendeeIds.values()].filter(
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
                            for (const subId of requiredSubIds) {
                                subscriptions.current.delete(subId);
                            }
                        } else {
                            now = Date.now();
                            datas.data.Attendee.forEach((attendee) => {
                                attendees.current.set(attendee.id, { attendee, fetchedAt: now });
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Could not fetch attendees for chat!", e);
            }

            subscriptions.current.forEach((sub, key) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    const attendee = attendees.current.get(sub.attendeeId);
                    if (attendee) {
                        sub.notify(attendee.attendee, key);
                    }
                }
            });

            const limit = 5000;
            if (checkInterval < limit) {
                setCheckInterval((old) => Math.min(old * 1.5, limit));
            }
        }, checkInterval);
        return () => {
            clearInterval(tId);
        };
    }, [attendeesByIdQ, checkInterval, conference.id, fullRefetchInterval]);

    const ctx = useMemo(
        () => ({
            subscribe,
            unsubscribe,
        }),
        [subscribe, unsubscribe]
    );

    return <AttendeesContext.Provider value={ctx}>{children}</AttendeesContext.Provider>;
}
