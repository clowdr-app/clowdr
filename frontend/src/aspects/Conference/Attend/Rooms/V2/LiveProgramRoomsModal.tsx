import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import type { RoomTile_GetRoomQuery, RoomTile_GetRoomQueryVariables } from "../../../../../generated/graphql";
import { RoomTile_GetRoomDocument } from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { useLiveEvents } from "../../../../LiveEvents/LiveEvents";
import LiveProgramRooms from "./LiveProgramRooms";

interface LiveProgramRoomsModalContext {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const LiveProgramRoomsModalContext = React.createContext<LiveProgramRoomsModalContext | undefined>(undefined);

export function useLiveProgramRoomsModal(): LiveProgramRoomsModalContext {
    const ctx = React.useContext(LiveProgramRoomsModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function LiveProgramRoomsModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const liveprogramroomsButtonRef = useRef<FocusableElement>(null);

    const ctx: LiveProgramRoomsModalContext = useMemo(
        () => ({
            finalFocusRef: liveprogramroomsButtonRef,
            isOpen,
            onOpen,
            onClose,
        }),
        [onOpen, isOpen, onClose]
    );

    return (
        <LiveProgramRoomsModalContext.Provider value={ctx}>
            {children}
            <LiveProgramRoomsModal isOpen={isOpen} onClose={onClose} finalFocusRef={liveprogramroomsButtonRef} />
        </LiveProgramRoomsModalContext.Provider>
    );
}

export default function LiveProgramRoomsModal({
    isOpen,
    onClose,
    finalFocusRef,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}): JSX.Element {
    const [shouldPreload, setShouldPreload] = useState<boolean>(false);
    const lastPreloadTime = useRef<number>(0);
    const { liveEventsInNextHour } = useLiveEvents();
    const now60s = useRealTime(60 * 1000);
    const preloadEvents = useMemo(
        () =>
            liveEventsInNextHour.filter((event) => {
                const timeDiff = Date.parse(event.startTime) - now60s;
                return 0 < timeDiff && timeDiff <= 10 * 60 * 1000;
            }),
        [liveEventsInNextHour, now60s]
    );
    useEffect(() => {
        let tId: number | undefined;
        if (preloadEvents.length > 0) {
            tId = setTimeout(
                (() => {
                    setShouldPreload(true);
                }) as TimerHandler,
                Math.random() * 7 * 60 * 1000
            );
        } else {
            setShouldPreload(false);
        }
        return () => {
            if (tId !== undefined) {
                clearTimeout(tId);
            }
        };
    }, [preloadEvents]);

    const client = useClient();
    useEffect(() => {
        if (shouldPreload && Date.now() - lastPreloadTime.current > 30 * 60 * 1000) {
            lastPreloadTime.current = Date.now();
            preloadEvents
                .filter((event) => !!event.room)
                .map((event) =>
                    client.query<RoomTile_GetRoomQuery, RoomTile_GetRoomQueryVariables>(RoomTile_GetRoomDocument, {
                        eventId: event.id,
                        roomId: event.room.id,
                        withEvent: true,
                    })
                );
        }
    }, [client, preloadEvents, shouldPreload]);

    const closeRef = useRef<HTMLButtonElement | null>(null);
    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Live or starting within 10 mins</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <LiveProgramRooms />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
