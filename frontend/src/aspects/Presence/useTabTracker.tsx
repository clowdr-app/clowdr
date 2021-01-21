import { gql } from "@apollo/client";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUpdateOpenTabMutation } from "../../generated/graphql";
import usePolling from "../Generic/usePolling";

gql`
    mutation UpdateOpenTab($delete: Boolean!, $oldId: uuid!, $path: String!, $attendeeId: uuid!) {
        insert_presence_OpenTab_one(object: { path: $path, attendeeId: $attendeeId }) {
            id
        }

        delete_presence_OpenTab_by_pk(id: $oldId) @include(if: $delete) {
            id
        }
    }
`;

export default function useTabTracker(attendeeId?: string): void {
    const location = useLocation();
    const [updateOpenTab] = useUpdateOpenTabMutation();
    const oldId = useRef<string>();

    const updatePresence = useCallback(() => {
        let tId: number | undefined;
        if (attendeeId) {
            tId = setTimeout(
                (async () => {
                    try {
                        oldId.current = (
                            await updateOpenTab({
                                variables: {
                                    attendeeId,
                                    path: location.pathname,
                                    oldId: oldId.current ?? attendeeId, // Give it any old id if it's not going to be used!
                                    delete: !!oldId.current,
                                },
                            })
                        ).data?.insert_presence_OpenTab_one?.id;
                    } catch (e) {
                        // Do nothing - might fail if in Incognito
                    }
                }) as TimerHandler,
                5000
            );
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [attendeeId, location.pathname, updateOpenTab]);

    useEffect(() => {
        return updatePresence();
    }, [updatePresence]);

    usePolling(updatePresence, 60000);
}
