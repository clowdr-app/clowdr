import { useToast } from "@chakra-ui/react";
import React, { Dispatch, useEffect, useReducer } from "react";

interface VonageRoomState {
    preferredCameraId: string | null;
    preferredMicrophoneId: string | null;
    cameraIntendedEnabled: boolean;
    cameraStream: MediaStream | null;
}

const initialRoomState: VonageRoomState = {
    preferredCameraId: null,
    preferredMicrophoneId: null,
    cameraIntendedEnabled: false,
    cameraStream: null,
};

type VonageRoomStateAction =
    | SetPreferredCamera
    | SetPreferredMicrophone
    | SetCameraIntendedState
    | SetCameraMediaStream;

export enum VonageRoomStateActionType {
    SetPreferredCamera,
    SetPreferredMicrophone,
    SetCameraIntendedState,
    SetCameraMediaStream,
}

interface SetPreferredCamera {
    type: VonageRoomStateActionType.SetPreferredCamera;
    cameraId: string;
}

interface SetPreferredMicrophone {
    type: VonageRoomStateActionType.SetPreferredMicrophone;
    microphoneId: string;
}

interface SetCameraIntendedState {
    type: VonageRoomStateActionType.SetCameraIntendedState;
    cameraEnabled: boolean;
}

interface SetCameraMediaStream {
    type: VonageRoomStateActionType.SetCameraMediaStream;
    mediaStream: MediaStream | null;
}

interface VonageRoomStateReducer {
    state: VonageRoomState;
    dispatch: Dispatch<VonageRoomStateAction>;
}

export const VonageContext = React.createContext<VonageRoomStateReducer>({
    state: initialRoomState,
    dispatch: () => null,
});

function reducer(state: VonageRoomState, action: VonageRoomStateAction): VonageRoomState {
    switch (action.type) {
        case VonageRoomStateActionType.SetPreferredCamera:
            return { ...state, preferredCameraId: action.cameraId };
        case VonageRoomStateActionType.SetPreferredMicrophone:
            return { ...state, preferredMicrophoneId: action.microphoneId };
        case VonageRoomStateActionType.SetCameraIntendedState:
            return { ...state, cameraIntendedEnabled: action.cameraEnabled };
        case VonageRoomStateActionType.SetCameraMediaStream:
            return { ...state, cameraStream: action.mediaStream };
    }
}

export function VonageRoomStateProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const [state, dispatch] = useReducer(reducer, initialRoomState);
    const toast = useToast();

    useEffect(() => {
        async function enableCamera() {
            const deviceConstraints = state.preferredCameraId ? { deviceId: { exact: state.preferredCameraId } } : {};

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        ...deviceConstraints,
                    },
                });
                dispatch({
                    type: VonageRoomStateActionType.SetCameraMediaStream,
                    mediaStream,
                });
            } catch (e) {
                console.error("Failed to start camera preview", e);
                toast({
                    description: "Failed to start camera",
                    status: "error",
                });
            }
        }

        if (state.cameraIntendedEnabled) {
            enableCamera();
        }
    }, [state.cameraIntendedEnabled, state.preferredCameraId, toast]);

    useEffect(() => {
        async function disableCamera() {
            state.cameraStream?.getTracks().forEach((track) => track.stop());
            dispatch({
                type: VonageRoomStateActionType.SetCameraMediaStream,
                mediaStream: null,
            });
        }

        if (!state.cameraIntendedEnabled) {
            disableCamera();
        }
    }, [state.cameraIntendedEnabled, state.cameraStream]);

    return <VonageContext.Provider value={{ state, dispatch }}>{children}</VonageContext.Provider>;
}

export function useVonageRoom(): VonageRoomStateReducer {
    return React.useContext(VonageContext);
}
