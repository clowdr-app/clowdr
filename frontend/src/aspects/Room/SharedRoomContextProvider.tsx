import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import { ChimeRoom } from "../Conference/Attend/Room/Chime/ChimeRoom";
import {
    DevicesProps,
    devicesToFriendlyName,
    PermissionInstructions,
} from "../Conference/Attend/Room/VideoChat/PermissionInstructions";
import { VonageRoom } from "../Conference/Attend/Room/Vonage/VonageRoom";
import { SharedRoomContext } from "./useSharedRoomContext";

export function SharedRoomContextProvider({
    children,
}: {
    children: string | React.ReactNodeArray | React.ReactNode;
}): JSX.Element {
    const vonageNode = useMemo(() => portals.createHtmlPortalNode(), []);
    const chimeNode = useMemo(() => portals.createHtmlPortalNode(), []);
    const [devices, setDevices] = useState<DevicesProps | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const permissionsModal = useDisclosure();
    const onPermissionsProblem = useCallback(
        (devices: DevicesProps, title: string | null) => {
            setDevices(devices);
            setTitle(title);
            permissionsModal.onOpen();
        },
        [permissionsModal, setDevices]
    );
    const ctx = useMemo(
        () => ({ vonagePortalNode: vonageNode, chimePortalNode: chimeNode, onPermissionsProblem }),
        [vonageNode, chimeNode, onPermissionsProblem]
    );

    return (
        <>
            <portals.InPortal node={vonageNode}>
                <VonageRoom
                    getAccessToken={async () => ""}
                    eventId={null}
                    vonageSessionId=""
                    disable={true}
                    isBackstageRoom={false}
                    raiseHandPrejoinEventId={null}
                    isRaiseHandWaiting={undefined}
                    requireMicrophoneOrCamera={false}
                    completeJoinRef={undefined}
                    onPermissionsProblem={onPermissionsProblem}
                    canControlRecording={false}
                />
            </portals.InPortal>
            <portals.InPortal node={chimeNode}>
                <ChimeRoom disable={true} roomId="" />
            </portals.InPortal>
            <SharedRoomContext.Provider value={ctx}>
                {children}
                <Modal isOpen={permissionsModal.isOpen} onClose={permissionsModal.onClose} size="xl">
                    <ModalOverlay />
                    <ModalContent pb={2}>
                        {devices
                            ? <ModalHeader>{title}</ModalHeader> ?? (
                                  <ModalHeader>
                                      There seems to be an issue with your {devicesToFriendlyName(devices, "or")}
                                  </ModalHeader>
                              )
                            : undefined}
                        <ModalCloseButton />
                        <ModalBody>{devices ? <PermissionInstructions {...devices} /> : <Spinner />}</ModalBody>
                    </ModalContent>
                </Modal>
            </SharedRoomContext.Provider>
        </>
    );
}
