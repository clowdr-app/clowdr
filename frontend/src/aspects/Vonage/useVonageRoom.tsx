import { useToast } from "@chakra-ui/react";
import { detect } from "detect-browser";
import React, { Dispatch, useEffect, useMemo, useReducer, useRef } from "react";
import type { DevicesProps } from "../Conference/Attend/Room/VideoChat/PermissionInstructions";
import { useRestorableState } from "../Generic/useRestorableState";

export interface VonageRoomState {
    preferredCameraId: string | null;
    cameraIntendedEnabled: boolean;
    cameraExplicitlyDisabled: boolean;
    cameraOnError: (() => void) | undefined;
    cameraStream: MediaStream | null;
    preferredMicrophoneId: string | null;
    microphoneIntendedEnabled: boolean;
    microphoneExplicitlyDisabled: boolean;
    microphoneOnError: (() => void) | undefined;
    microphoneStream: MediaStream | null;
    screenShareIntendedEnabled: boolean;
}

const initialRoomState: VonageRoomState = {
    preferredCameraId: null,
    cameraIntendedEnabled: false,
    cameraExplicitlyDisabled: true,
    cameraOnError: undefined,
    cameraStream: null,
    preferredMicrophoneId: null,
    microphoneIntendedEnabled: false,
    microphoneExplicitlyDisabled: true,
    microphoneOnError: undefined,
    microphoneStream: null,
    screenShareIntendedEnabled: false,
};

type VonageRoomStateAction =
    | SetPreferredCamera
    | ClearPreferredCamera
    | SetPreferredMicrophone
    | ClearPreferredMicrophone
    | SetCameraIntendedState
    | SetCameraMediaStream
    | SetMicrophoneIntendedState
    | SetMicrophoneMediaStream
    | SetScreenShareIntendedState;

export enum VonageRoomStateActionType {
    SetPreferredCamera,
    ClearPreferredCamera,
    SetCameraIntendedState,
    SetCameraMediaStream,
    SetPreferredMicrophone,
    ClearPreferredMicrophone,
    SetMicrophoneIntendedState,
    SetMicrophoneMediaStream,
    SetScreenShareIntendedState,
}

interface SetPreferredCamera {
    type: VonageRoomStateActionType.SetPreferredCamera;
    cameraId: string;
}

interface ClearPreferredCamera {
    type: VonageRoomStateActionType.ClearPreferredCamera;
}

interface SetCameraIntendedState {
    type: VonageRoomStateActionType.SetCameraIntendedState;
    cameraEnabled: boolean;
    /** Was the camera explicitly turned off by the user (or implicitly by permissions)? If they just left a room, is false. */
    explicitlyDisabled?: boolean;
    onError: (() => void) | undefined;
}

interface SetCameraMediaStream {
    type: VonageRoomStateActionType.SetCameraMediaStream;
    mediaStream: MediaStream | "disabled";
}

interface SetPreferredMicrophone {
    type: VonageRoomStateActionType.SetPreferredMicrophone;
    microphoneId: string;
}

interface ClearPreferredMicrophone {
    type: VonageRoomStateActionType.ClearPreferredMicrophone;
}

interface SetMicrophoneIntendedState {
    type: VonageRoomStateActionType.SetMicrophoneIntendedState;
    microphoneEnabled: boolean;
    /** Was the microphone explicitly turned off by the user (or implicitly by permissions)? If they just left a room, is false. */
    explicitlyDisabled?: boolean;
    onError: (() => void) | undefined;
}

interface SetMicrophoneMediaStream {
    type: VonageRoomStateActionType.SetMicrophoneMediaStream;
    mediaStream: MediaStream | "disabled";
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

        case VonageRoomStateActionType.ClearPreferredCamera: {
            // Required until https://bugs.chromium.org/p/chromium/issues/detail?id=642785 is resolved
            const isChrome = detect()?.name === "chrome";
            state.cameraStream?.getTracks().forEach((track) => (isChrome ? track.stop() : (track.enabled = false)));
            return { ...state, preferredCameraId: null, cameraIntendedEnabled: false, cameraStream: null };
        }

        case VonageRoomStateActionType.SetCameraIntendedState:
            return {
                ...state,
                cameraIntendedEnabled: action.cameraEnabled,
                cameraExplicitlyDisabled: action.explicitlyDisabled ?? false,
                cameraOnError: action.onError,
            };

        case VonageRoomStateActionType.SetCameraMediaStream:
            if (action.mediaStream === "disabled") {
                // Required until https://bugs.chromium.org/p/chromium/issues/detail?id=642785 is resolved
                const isChrome = detect()?.name === "chrome";
                state.cameraStream?.getTracks().forEach((track) => (isChrome ? track.stop() : (track.enabled = false)));
                return { ...state };
            } else {
                state.cameraStream?.getTracks().forEach((track) => track.stop());
                return { ...state, cameraStream: action.mediaStream };
            }

        case VonageRoomStateActionType.SetPreferredMicrophone:
            if (action.microphoneId !== state.preferredMicrophoneId) {
                state.microphoneStream?.getTracks().forEach((track) => track.stop());
                return { ...state, preferredMicrophoneId: action.microphoneId, microphoneStream: null };
            }
            return { ...state, preferredMicrophoneId: action.microphoneId };

        case VonageRoomStateActionType.ClearPreferredMicrophone: {
            // Required until https://bugs.chromium.org/p/chromium/issues/detail?id=642785 is resolved
            const isChrome = detect()?.name === "chrome";
            state.microphoneStream?.getTracks().forEach((track) => (isChrome ? track.stop() : (track.enabled = false)));
            return { ...state, preferredMicrophoneId: null, microphoneIntendedEnabled: false, microphoneStream: null };
        }

        case VonageRoomStateActionType.SetMicrophoneIntendedState:
            return {
                ...state,
                microphoneIntendedEnabled: action.microphoneEnabled,
                microphoneExplicitlyDisabled: action.explicitlyDisabled ?? false,
                microphoneOnError: action.onError,
            };

        case VonageRoomStateActionType.SetMicrophoneMediaStream:
            if (action.mediaStream === "disabled") {
                // Required until https://bugs.chromium.org/p/chromium/issues/detail?id=642785 is resolved
                const isChrome = detect()?.name === "chrome";
                state.microphoneStream
                    ?.getTracks()
                    .forEach((track) => (isChrome ? track.stop() : (track.enabled = false)));
                return { ...state };
            } else {
                state.microphoneStream?.getTracks().forEach((track) => track.stop());
                return { ...state, microphoneStream: action.mediaStream };
            }

        case VonageRoomStateActionType.SetScreenShareIntendedState:
            return { ...state, screenShareIntendedEnabled: action.screenEnabled };
    }
}

export function VonageRoomStateProvider({
    onPermissionsProblem,
    children,
}: {
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const [preferredCamera, setPreferredCamera] = useRestorableState<string | null>(
        "clowdr-preferredCamera",
        null,
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );
    const [preferredMicrophone, setPreferredMicrophone] = useRestorableState<string | null>(
        "clowdr-preferredMicrophone",
        null,
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );

    const initialRoomState_ = {
        ...initialRoomState,
        preferredCameraId: preferredCamera,
        preferredMicrophoneId: preferredMicrophone,
    };

    const [state, dispatch] = useReducer(reducer, initialRoomState_);
    const toast = useToast();

    const unmountRef = useRef<() => void>();
    const unloadRef = useRef<EventListener>();

    useEffect(() => {
        if (preferredCamera !== state.preferredCameraId) {
            setPreferredCamera(state.preferredCameraId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setPreferredCamera, state.preferredCameraId]);

    useEffect(() => {
        if (preferredMicrophone !== state.preferredMicrophoneId) {
            setPreferredMicrophone(state.preferredMicrophoneId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setPreferredMicrophone, state.preferredMicrophoneId]);

    useEffect(() => {
        function stop() {
            state.cameraStream?.getTracks().forEach((track) => (track.enabled = false));
            state.microphoneStream?.getTracks().forEach((track) => (track.enabled = false));
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
            unmountRef.current?.();
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
                    audio: false,
                });

                // If the stream ends for external reasons, update the state
                if (WeakRef) {
                    const dispatchRef = new WeakRef(dispatch);
                    mediaStream.getTracks().forEach((t) => {
                        t.addEventListener("ended", () => {
                            if (!mediaStream.getTracks().some((t) => t.readyState === "live")) {
                                const dispatch = dispatchRef.deref();
                                dispatch?.({
                                    type: VonageRoomStateActionType.SetCameraIntendedState,
                                    cameraEnabled: false,
                                    explicitlyDisabled: true,
                                    onError: undefined,
                                });
                            }
                        });
                    });
                }

                dispatch({
                    type: VonageRoomStateActionType.SetCameraMediaStream,
                    mediaStream,
                });
            } catch (e) {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: false,
                    explicitlyDisabled: true,
                    onError: undefined,
                });

                if (state.cameraOnError) {
                    state.cameraOnError();
                } else {
                    console.error("Failed to start camera", e);
                    onPermissionsProblem({ microphone: true }, "Failed to start camera");
                }
                return;
            }
        }

        if (state.cameraIntendedEnabled) {
            enableCamera();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.cameraIntendedEnabled, state.preferredCameraId, toast]);

    useEffect(() => {
        async function disableCamera() {
            dispatch({
                type: VonageRoomStateActionType.SetCameraMediaStream,
                mediaStream: "disabled",
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
                    video: false,
                });

                // If the stream ends for external reasons, update the state
                if (WeakRef) {
                    const dispatchRef = new WeakRef(dispatch);
                    mediaStream.getTracks().forEach((t) => {
                        t.addEventListener("ended", () => {
                            if (!mediaStream.getTracks().some((t) => t.readyState === "live")) {
                                const dispatch = dispatchRef.deref();
                                dispatch?.({
                                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                                    microphoneEnabled: false,
                                    explicitlyDisabled: true,
                                    onError: undefined,
                                });
                            }
                        });
                    });
                }

                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                    mediaStream,
                });
            } catch (e) {
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: false,
                    explicitlyDisabled: true,
                    onError: undefined,
                });
                if (state.microphoneOnError) {
                    state.microphoneOnError();
                } else {
                    console.error("Failed to start microphone", e);
                    onPermissionsProblem({ microphone: true }, "Failed to unmute");
                }
                return;
            }
        }

        if (state.microphoneIntendedEnabled) {
            enableMicrophone();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.microphoneIntendedEnabled, state.preferredMicrophoneId, toast]);

    useEffect(() => {
        async function disableMicrophone() {
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                mediaStream: "disabled",
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

    const ctx = useMemo(() => ({ state, dispatch, computedState }), [computedState, state]);

    return <VonageContext.Provider value={ctx}>{children}</VonageContext.Provider>;
}

export function useVonageRoom(): VonageRoomContext {
    return React.useContext(VonageContext);
}
