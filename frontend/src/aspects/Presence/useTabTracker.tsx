import { gql } from "@apollo/client";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDeleteOpenTabMutation, useInsertOpenTabMutation } from "../../generated/graphql";
import usePolling from "../Generic/usePolling";

gql`
    mutation DeleteOpenTab($oldId: uuid!) {
        delete_presence_OpenTab_by_pk(id: $oldId) {
            id
        }
    }

    mutation InsertOpenTab($oldId: uuid = null, $path: String!, $attendeeId: uuid!) {
        insert_presence_OpenTab_one(object: { path: $path, attendeeId: $attendeeId }) {
            id
        }
    }
`;

export default function useTabTracker(attendeeId?: string): void {
    const location = useLocation();
    const [insertOpenTab] = useInsertOpenTabMutation();
    const [deleteOpenTab] = useDeleteOpenTabMutation();
    const oldId = useRef<string>();

    const updatePresence = useCallback(() => {
        let tId: number | undefined;
        if (attendeeId) {
            tId = setTimeout((async () => {
                try {
                    if (oldId.current) {
                        await deleteOpenTab({
                            variables: {
                                oldId: oldId.current
                            }
                        });
                    }
                    oldId.current = (await insertOpenTab({
                        variables: {
                            attendeeId,
                            path: location.pathname,
                            oldId: oldId.current
                        }
                    })).data?.insert_presence_OpenTab_one?.id;
                }
                catch (e) {
                    // Do nothing - might fail if in Incognito
                }
            }) as TimerHandler, 1000);
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [attendeeId, insertOpenTab, location.pathname, deleteOpenTab]);

    useEffect(() => {
        return updatePresence();
    }, [updatePresence]);

    usePolling(updatePresence, 60000);
}
