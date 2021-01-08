import { useToast } from "@chakra-ui/react";
import React, { Dispatch, useEffect, useMemo, useReducer, useRef } from "react";

export interface VonageRoomState {
    preferredCameraId: string | null;
    cameraIntendedEnabled: boolean;
    cameraStream: MediaStream | null;
    preferredMicrophoneId: string | null;
    microphoneIntendedEnabled: boolean;
    microphoneStream: MediaStream | null;
    screenIntendedEnabled: boolean;
}

const initialRoomState: VonageRoomState = {
    preferredCameraId: null,
    cameraIntendedEnabled: false,
    cameraStream: null,
    preferredMicrophoneId: null,
    microphoneIntendedEnabled: false,
    microphoneStream: null,
    screenIntendedEnabled: false,
};

type VonageRoomStateAction =
    | SetPreferredCamera
    | SetPreferredMicrophone
    | SetCameraIntendedState
    | SetCameraMediaStream
    | SetMicrophoneIntendedState
    | SetMicrophoneMediaStream
    | SetScreenShareIntendedState;

export enum VonageRoomStateActionType {
    SetPreferredCamera,
    SetCameraIntendedState,
    SetCameraMediaStream,
    SetPreferredMicrophone,
    SetMicrophoneIntendedState,
    SetMicrophoneMediaStream,
    SetScreenShareIntendedState,
}

interface SetPreferredCamera {
    type: VonageRoomStateActionType.SetPreferredCamera;
    cameraId: string;
}

interface SetCameraIntendedState {
    type: VonageRoomStateActionType.SetCameraIntendedState;
    cameraEnabled: boolean;
}

interface SetCameraMediaStream {
    type: VonageRoomStateActionType.SetCameraMediaStream;
    mediaStream: MediaStream | null;
}

interface SetPreferredMicrophone {
    type: VonageRoomStateActionType.SetPreferredMicrophone;
    microphoneId: string;
}

interface SetMicrophoneIntendedState {
    type: VonageRoomStateActionType.SetMicrophoneIntendedState;
    microphoneEnabled: boolean;
}

interface SetMicrophoneMediaStream {
    type: VonageRoomStateActionType.SetMicrophoneMediaStream;
    mediaStream: MediaStream | null;
}

interface SetScreenShareIntendedState {
    type: VonageRoomStateActionType.SetScreenShareIntendedState;
    screenEnabled: boolean;
}

export interface VonageRoomComputedState {
    videoTrack: MediaStreamTrack | null;
    audioTrack: MediaStreamTrack | null;
}

const initialComputedState: VonageRoomComputedState = {
    videoTrack: null,
    audioTrack: null,
};

interface VonageRoomContext {
    state: VonageRoomState;
    computedState: VonageRoomComputedState;
    dispatch: Dispatch<VonageRoomStateAction>;
}

export const VonageContext = React.createContext<VonageRoomContext>({
    state: initialRoomState,
    computedState: initialComputedState,
    dispatch: () => null,
});

function reducer(state: VonageRoomState, action: VonageRoomStateAction): VonageRoomState {
    switch (action.type) {
        case VonageRoomStateActionType.SetPreferredCamera:
            if (action.cameraId !== state.preferredCameraId) {
                state.cameraStream?.getTracks().forEach((track) => track.stop());
                return { ...state, preferredCameraId: action.cameraId, cameraStream: null };
            }
            return { ...state, preferredCameraId: action.cameraId };

        case VonageRoomStateActionType.SetCameraIntendedState:
            return { ...state, cameraIntendedEnabled: action.cameraEnabled };

        case VonageRoomStateActionType.SetCameraMediaStream:
            if (action.mediaStream === null) {
                state.cameraStream?.getTracks().forEach((track) => track.stop());
            }
            return { ...state, cameraStream: action.mediaStream };

        case VonageRoomStateActionType.SetPreferredMicrophone:
            if (action.microphoneId !== state.preferredMicrophoneId) {
                state.microphoneStream?.getTracks().forEach((track) => track.stop());
                return { ...state, preferredMicrophoneId: action.microphoneId, microphoneStream: null };
            }
            return { ...state, preferredMicrophoneId: action.microphoneId };

        case VonageRoomStateActionType.SetMicrophoneIntendedState:
            return { ...state, microphoneIntendedEnabled: action.microphoneEnabled };

        case VonageRoomStateActionType.SetMicrophoneMediaStream:
            if (action.mediaStream === null) {
                state.microphoneStream?.getTracks().forEach((track) => track.stop());
            }
            return { ...state, microphoneStream: action.mediaStream };

        case VonageRoomStateActionType.SetScreenShareIntendedState:
            return { ...state, screenIntendedEnabled: action.screenEnabled };
    }
}

export function VonageRoomStateProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const [state, dispatch] = useReducer(reducer, initialRoomState);
    const toast = useToast();
    const unmountRef = useRef<() => void>();
    const unloadRef = useRef<EventListener>();

    useEffect(() => {
        function stop() {
            state.cameraStream?.getTracks().forEach((track) => track.stop());
            state.microphoneStream?.getTracks().forEach((track) => track.stop());
        }

        unmountRef.current = () => {
            stop();
        };
        unloadRef.current = () => {
            stop();
        };
    }, [state.cameraStream, state.microphoneStream]);

    useEffect(() => {
        return () => {
            if (unmountRef && unmountRef.current) {
                unmountRef.current();
            }
        };
    }, []);

    useEffect(() => {
        if (unloadRef && unloadRef.current) {
            window.addEventListener("beforeunload", unloadRef.current);
        }
        return () => {
            if (unloadRef && unloadRef.current) window.removeEventListener("beforeunload", unloadRef.current);
        };
    }, []);

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
            dispatch({
                type: VonageRoomStateActionType.SetCameraMediaStream,
                mediaStream: null,
            });
        }

        if (!state.cameraIntendedEnabled) {
            disableCamera();
        }
    }, [state.cameraIntendedEnabled]);

    useEffect(() => {
        async function enableMicrophone() {
            const deviceConstraints = state.preferredMicrophoneId
                ? { deviceId: { exact: state.preferredMicrophoneId } }
                : {};

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        ...deviceConstraints,
                    },
                });
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                    mediaStream,
                });
            } catch (e) {
                console.error("Failed to start microphone preview", e);
                toast({
                    description: "Failed to start microphone",
                    status: "error",
                });
            }
        }

        if (state.microphoneIntendedEnabled) {
            enableMicrophone();
        }
    }, [state.microphoneIntendedEnabled, state.preferredMicrophoneId, toast]);

    useEffect(() => {
        async function disableMicrophone() {
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                mediaStream: null,
            });
        }

        if (!state.microphoneIntendedEnabled) {
            disableMicrophone();
        }
    }, [state.microphoneIntendedEnabled]);

    const cameraTrack = useMemo(() => {
        const videoTracks = state.cameraStream?.getVideoTracks();
        if (videoTracks && videoTracks.length > 0) {
            return videoTracks[0];
        }
        return null;
    }, [state.cameraStream]);

    const microphoneTrack = useMemo(() => {
        const audioTracks = state.microphoneStream?.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
            return audioTracks[0];
        }
        return null;
    }, [state.microphoneStream]);

    const computedState = useMemo(() => {
        return {
            videoTrack: cameraTrack,
            audioTrack: microphoneTrack,
        };
    }, [cameraTrack, microphoneTrack]);

    return <VonageContext.Provider value={{ state, dispatch, computedState }}>{children}</VonageContext.Provider>;
}

export function useVonageRoom(): VonageRoomContext {
    return React.useContext(VonageContext);
}
