import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import { AttendeeDataFragment, useAttendeesByIdQuery } from "../../../generated/graphql";
import { useConference } from "../../Conference/useConference";

gql`
    query AttendeesById($conferenceId: uuid!, $attendeeIds: [uuid!]!) {
        Attendee(where: { id: { _in: $attendeeIds }, conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeData
        }
    }
`;

type NotificationCallback = (data: AttendeeDataFragment) => void;

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

    const subscribe = useCallback((attendeeId: string, cb: (data: AttendeeDataFragment) => void) => {
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
            const subsToFetchFor: Subscription[] = [];
            const requiredAttendeeIds = new Set<string>();
            let now = Date.now();
            subscriptions.current.forEach((sub) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    subsToFetchFor.push(sub);
                    requiredAttendeeIds.add(sub.attendeeId);
                }
            });

            try {
                const datas = await attendeesByIdQ.refetch({
                    attendeeIds: [...requiredAttendeeIds.values()],
                    conferenceId: conference.id,
                });

                now = Date.now();
                datas.data.Attendee.forEach((attendee) => {
                    attendees.current.set(attendee.id, { attendee, fetchedAt: now });
                });
            } catch (e) {
                console.error("Could not fetch attendees for chat!", e);
            }

            subscriptions.current.forEach((sub) => {
                if (sub.lastNotifiedAt < now - fullRefetchInterval) {
                    const attendee = attendees.current.get(sub.attendeeId);
                    if (attendee) {
                        sub.notify(attendee.attendee);
                    }
                }
            });

            if (checkInterval < 10000) {
                setCheckInterval((old) => Math.min(old * 1.5, 10000));
            }
        }, checkInterval);
        return () => {
            clearInterval(tId);
        };
    }, [attendeesByIdQ, checkInterval, conference.id, fullRefetchInterval]);

    return (
        <AttendeesContext.Provider
            value={{
                subscribe,
                unsubscribe,
            }}
        >
            {children}
        </AttendeesContext.Provider>
    );
}
