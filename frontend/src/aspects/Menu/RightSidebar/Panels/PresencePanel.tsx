import { Spinner, Text, useDisclosure } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ProfileModal from "../../../Conference/Attend/Registrant/ProfileModal";
import type { RegistrantIdSpec } from "../../../Conference/RegistrantsContext";
import { useRegistrants } from "../../../Conference/RegistrantsContext";
import { useMaybeConference } from "../../../Conference/useConference";
import type { Registrant } from "../../../Conference/useCurrentRegistrant";
import { usePresenceState } from "../../../Realtime/PresenceStateProvider";
import { RegistrantsList } from "./RegistrantsList";

function PresencePanel_WithoutConnectedParticipants(): JSX.Element {
    const [totalUserIds, setTotalUserIds] = useState<number>(0);
    const [userIds, setUserIds] = useState<RegistrantIdSpec[]>([]);
    const updateTimeoutId = useRef<number | undefined>(undefined);
    const totalUserIdsRef = useRef<number>(0);
    const presence = usePresenceState();
    const mConference = useMaybeConference();
    const location = useLocation();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
    const openProfileModal = useCallback(
        (registrant: Registrant) => {
            setSelectedRegistrant(registrant);
            onOpen();
        },
        [onOpen]
    );

    useEffect(() => {
        const unobserve = presence.observePage(location.pathname, mConference?.slug, (ids) => {
            setTotalUserIds(ids.size);

            if (!updateTimeoutId.current) {
                const update = () => {
                    const reducedIds: string[] = [...ids];
                    while (reducedIds.length > 70) {
                        const index = Math.round(Math.random() * (reducedIds.length - 1));
                        reducedIds.splice(index, 1);
                    }
                    setUserIds(reducedIds.map((x) => ({ user: x })));
                    totalUserIdsRef.current = ids.size;
                    updateTimeoutId.current = undefined;
                };
                if (totalUserIdsRef.current === 0) {
                    update();
                } else {
                    updateTimeoutId.current = setTimeout(update as TimerHandler, 60000);
                }
            }
        });

        return () => {
            unobserve();

            if (updateTimeoutId.current) {
                clearTimeout(updateTimeoutId.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, mConference?.slug, presence, updateTimeoutId, totalUserIdsRef]);

    const registrants = useRegistrants(userIds);
    const sortedRegistrants = useMemo(() => R.sortBy((x) => x.displayName, registrants), [registrants]);

    return (
        <>
            <Text fontStyle="italic" fontSize="sm" mb={2}>
                {totalUserIds} users with at least one tab open on this page.
            </Text>
            <RegistrantsList
                searchedRegistrants={sortedRegistrants as Registrant[]}
                action={(registrantId) => {
                    const a = registrants.find((x) => x.id === registrantId);
                    if (a) {
                        openProfileModal(a as Registrant);
                    }
                }}
            />
            {sortedRegistrants.length !== userIds.length ? <Spinner size="xs" label="Loading users" /> : undefined}
            <ProfileModal isOpen={isOpen} onClose={onClose} registrant={selectedRegistrant} />
        </>
    );
}

export function PresencePanel({ isOpen }: { isOpen: boolean }): JSX.Element {
    return isOpen ? <PresencePanel_WithoutConnectedParticipants /> : <></>;
}
