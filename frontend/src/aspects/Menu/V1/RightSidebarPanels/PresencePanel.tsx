import { Divider, Heading, List, ListItem, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ProfileModal from "../../../Conference/Attend/Registrant/ProfileModal";
import type { RegistrantIdSpec } from "../../../Conference/RegistrantsContext";
import { useRegistrant, useRegistrants } from "../../../Conference/RegistrantsContext";
import { useMaybeConference } from "../../../Conference/useConference";
import type { Registrant } from "../../../Conference/useCurrentRegistrant";
import FAIcon from "../../../Icons/FAIcon";
import { usePresenceState } from "../../../Realtime/PresenceStateProvider";
import useRoomParticipants from "../../../Room/useRoomParticipants";
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

function ParticipantListItem({ registrantId }: { registrantId: string }): JSX.Element {
    const idObj = useMemo(() => ({ registrant: registrantId }), [registrantId]);
    const registrant = useRegistrant(idObj);
    return (
        <ListItem fontWeight="light">
            <FAIcon icon="circle" iconStyle="s" fontSize="0.5rem" color="PrimaryActionButton.400" mr={2} mb={1} />
            {registrant?.displayName ?? "Loading"}
        </ListItem>
    );
}

function ParticipantsList({ roomId }: { roomId: string }): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    const [elements, setElements] = useState<JSX.Element[]>([]);

    useEffect(() => {
        setElements((oldElements) => {
            const newElements: JSX.Element[] = [];
            for (const participant of thisRoomParticipants) {
                if (!oldElements.some((x) => x.key !== participant.id)) {
                    newElements.push(
                        <ParticipantListItem key={participant.id} registrantId={participant.registrantId} />
                    );
                }
            }

            const removeIds: string[] = [];
            for (const element of oldElements) {
                if (!thisRoomParticipants.some((x) => x.id === element.key)) {
                    removeIds.push(element.key as string);
                }
            }
            return [...oldElements.filter((x) => !removeIds.includes(x.key as string)), ...newElements];
        });
    }, [thisRoomParticipants]);

    return roomParticipants && roomParticipants.length > 0 ? (
        <>
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Connected to this room
            </Heading>
            <Text fontStyle="italic" fontSize="sm" mb={2}>
                Users who have joined the video/audio chat room.
            </Text>
            <List fontSize="sm" width="100%">
                {elements}
            </List>
            <Divider my={4} />
        </>
    ) : (
        <></>
    );
}

function PresencePanel_WithConnectedParticipants({ roomId }: { roomId: string }): JSX.Element {
    return (
        <>
            <ParticipantsList roomId={roomId} />
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Here with you
            </Heading>
            <PresencePanel_WithoutConnectedParticipants />
        </>
    );
}

export function PresencePanel({ roomId, isOpen }: { roomId?: string; isOpen: boolean }): JSX.Element {
    const [panelContents, setPanelContents] = useState<{
        roomId: string;
        element: JSX.Element;
    } | null>(null);
    useEffect(() => {
        if (isOpen && roomId && roomId !== panelContents?.roomId) {
            setPanelContents({
                roomId,
                element: <PresencePanel_WithConnectedParticipants roomId={roomId} />,
            });
        }
    }, [isOpen, roomId, panelContents]);

    useEffect(() => {
        let timeoutId: number | undefined;
        if (!isOpen) {
            timeoutId = setTimeout(
                (() => {
                    setPanelContents(null);
                }) as TimerHandler,
                5000
            );
        }
        return () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, [isOpen]);

    return panelContents?.element ?? (isOpen ? <PresencePanel_WithoutConnectedParticipants /> : <></>);
}
