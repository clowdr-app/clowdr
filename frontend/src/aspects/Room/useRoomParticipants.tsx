import { useEffect, useState } from "react";
import type { RegistrantIdSpec } from "../Conference/RegistrantsContext";
import { useConference } from "../Conference/useConference";
import { usePresenceState } from "../Realtime/PresenceStateProvider";

export default function useRoomParticipants(
    roomIds?: null | string | string[]
): Record<string, RegistrantIdSpec[] | null> {
    const [registrantIds, setRegistrantIds] = useState<Record<string, RegistrantIdSpec[] | null>>({});

    const conference = useConference();
    const presence = usePresenceState();
    useEffect(() => {
        if (roomIds) {
            const unobserves =
                typeof roomIds === "string"
                    ? [
                          presence.observeRoom(roomIds, conference.id, (registrantIdsSet) => {
                              setRegistrantIds((old) => ({
                                  ...old,
                                  [roomIds]: [...registrantIdsSet].map((registrant) => ({ registrant })),
                              }));
                          }),
                      ]
                    : roomIds.map((roomId) =>
                          presence.observeRoom(roomId, conference.id, (registrantIdsSet) => {
                              setRegistrantIds((old) => ({
                                  ...old,
                                  [roomId]: [...registrantIdsSet].map((registrant) => ({ registrant })),
                              }));
                          })
                      );

            return () => {
                unobserves.map((f) => f());
            };
        }
        return () => {
            // Nothing
        };
    }, [conference.id, presence, roomIds]);

    return registrantIds;
}
