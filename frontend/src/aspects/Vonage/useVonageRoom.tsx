import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, ListItem, OrderedList, UnorderedList, useToast } from "@chakra-ui/react";
import React, { Dispatch, useEffect, useMemo, useReducer, useRef } from "react";
import { PermissionInstructions } from "../Conference/Attend/Room/Chime/PermissionInstructions";
import { useRestorableState } from "../Generic/useRestorableState";

export interface VonageRoomState {
    preferredCameraId: string | null;
    cameraIntendedEnabled: boolean;
    cameraStream: MediaStream | null;
    preferredMicrophoneId: string | null;
    microphoneIntendedEnabled: boolean;
    microphoneStream: MediaStream | null;
    screenShareIntendedEnabled: boolean;
}

const initialRoomState: VonageRoomState = {
    preferredCameraId: null,
    cameraIntendedEnabled: false,
    cameraStream: null,
    preferredMicrophoneId: null,
    microphoneIntendedEnabled: false,
    microphoneStream: null,
    screenShareIntendedEnabled: false,
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
            return { ...state, screenShareIntendedEnabled: action.screenEnabled };
    }
}

export function VonageRoomStateProvider({
    children,
}: {
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
                    audio: false,
                });
                dispatch({
                    type: VonageRoomStateActionType.SetCameraMediaStream,
                    mediaStream,
                });
            } catch (e) {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: false,
                });
                console.error("Failed to start camera preview", e);
                toast({
                    title: "Failed to start camera",
                    description: <PermissionInstructions />,
                    status: "error",
                    isClosable: true,
                    duration: 30000,
                });
                return;
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
                    video: false,
                });
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                    mediaStream,
                });
            } catch (e) {
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: false,
                });
                console.error("Failed to start microphone preview", e);
                toast({
                    title: "Failed to start microphone",
                    description: (
                        <OrderedList>
                            <ListItem>
                                Check that you have allowed permission to use the microphone in your browser.
                                <UnorderedList>
                                    <ListItem>
                                        <Link
                                            isExternal
                                            href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop"
                                        >
                                            Instructions for Google Chrome <ExternalLinkIcon />
                                        </Link>
                                    </ListItem>
                                    <ListItem>
                                        <Link
                                            isExternal
                                            href="https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions"
                                        >
                                            Instructions for Firefox <ExternalLinkIcon />
                                        </Link>
                                    </ListItem>
                                </UnorderedList>
                            </ListItem>
                            <ListItem>
                                Please also make sure you have fully quit/exited Zoom, Skype and any other tabs that may
                                be using your microphone.
                            </ListItem>
                        </OrderedList>
                    ),
                    status: "error",
                    isClosable: true,
                    duration: 30000,
                });
                return;
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

    const ctx = useMemo(() => ({ state, dispatch, computedState }), [computedState, state]);

    return <VonageContext.Provider value={ctx}>{children}</VonageContext.Provider>;
}

export function useVonageRoom(): VonageRoomContext {
    return React.useContext(VonageContext);
}
