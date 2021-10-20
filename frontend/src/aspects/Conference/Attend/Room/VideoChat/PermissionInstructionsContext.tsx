import { useDisclosure } from "@chakra-ui/react";
import type { PropsWithChildren} from "react";
import React, { createContext, useCallback, useState } from "react";

export type DevicesProps = {
    camera?: boolean;
    microphone?: boolean;
    screen?: boolean;
};

function useValue() {
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

    return {
        onPermissionsProblem,
        devices,
        title,
        permissionsModal,
    };
}

export const PermissionInstructionsContext = createContext({} as ReturnType<typeof useValue>);

export function PermissionInstructionsProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return (
        <PermissionInstructionsContext.Provider value={useValue()}>
            {props.children}
        </PermissionInstructionsContext.Provider>
    );
}
