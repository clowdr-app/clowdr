import { useToast } from "@chakra-ui/react";
import { WeakRef } from "@ungap/weakrefs";
import { gql } from "@urql/core";
import { detect } from "detect-browser";
import * as R from "ramda";
import type { Dispatch } from "react";
import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { useVonageRoomStateProvider_GetVonageMaxSimultaneousScreenSharesQuery } from "../../../../../../generated/graphql";
import { useRestorableState } from "../../../../../Hooks/useRestorableState";
import { useConference } from "../../../../useConference";
import type { DevicesProps } from "../../VideoChat/PermissionInstructionsContext";
import type { CompleteGetAccessToken } from "../useGetAccessToken";

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

export const enum RecordingControlReason {
    ConferenceOrganizer = "CONFERENCE_ORGANIZER",
    EventPerson = "EVENT_PERSON",
    ItemPerson = "ITEM_PERSON",
    RoomAdmin = "ROOM_ADMIN",
}

export interface VonageRoomSettings {
    maximumSimultaneousScreenShares: number;
    isBackstageRoom: boolean;
    canControlRecordingAs: Set<RecordingControlReason>;
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    joinRoomButtonText?: string;
    joiningRoomButtonText?: string;
    requireMicrophoneOrCamera: boolean;
    completeGetAccessToken: CompleteGetAccessToken | null;
    eventIsFuture: boolean;
    roomId?: string;
    eventId?: string;
    extraLayoutButtons?: JSX.Element;
}

interface VonageRoomContext {
    state: VonageRoomState;
    computedState: VonageRoomComputedState;
    dispatch: Dispatch<VonageRoomStateAction>;
    settings: VonageRoomSettings;
}

const defaultVonageRoomSettings: VonageRoomSettings = {
    maximumSimultaneousScreenShares: 1,
    isBackstageRoom: false,
    canControlRecordingAs: new Set(),
    onPermissionsProblem: () => {
        //
    },
    joinRoomButtonText: undefined,
    joiningRoomButtonText: undefined,
    requireMicrophoneOrCamera: false,
    eventIsFuture: false,
    completeGetAccessToken: null,
    extraLayoutButtons: undefined,
};

export const VonageRoomContext = React.createContext<VonageRoomContext>({
    state: initialRoomState,
    computedState: initialComputedState,
    dispatch: () => null,
    settings: defaultVonageRoomSettings,
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

gql`
    query VonageRoomStateProvider_GetVonageMaxSimultaneousScreenShares($conferenceId: uuid!) @cached {
        conference_Configuration_by_pk(conferenceId: $conferenceId, key: VONAGE_MAX_SIMULTANEOUS_SCREEN_SHARES) {
            conferenceId
            key
            value
        }
    }
`;

export function VonageRoomProvider({
    onPermissionsProblem,
    isBackstageRoom,
    canControlRecordingAs,
    joinRoomButtonText,
    joiningRoomButtonText,
    requireMicrophoneOrCamera,
    completeGetAccessToken,
    eventIsFuture,
    eventId,
    roomId,
    extraLayoutButtons,
    children,
}: {
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    isBackstageRoom: boolean;
    canControlRecordingAs: Set<RecordingControlReason>;
    joinRoomButtonText?: string;
    joiningRoomButtonText?: string;
    requireMicrophoneOrCamera: boolean;
    completeGetAccessToken?: CompleteGetAccessToken | null;
    eventIsFuture?: boolean;
    eventId?: string;
    roomId?: string;
    extraLayoutButtons?: JSX.Element;
    children: JSX.Element;
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

    const { id: conferenceId } = useConference();
    const [maxSimultaneousScreenSharesResponse] = useVonageRoomStateProvider_GetVonageMaxSimultaneousScreenSharesQuery({
        variables: {
            conferenceId,
        },
    });

    const settings = useMemo(
        () =>
            R.mergeWithKey<VonageRoomSettings, Partial<VonageRoomSettings>>(
                (k, l, r) => {
                    switch (k) {
                        case "maximumSimultaneousScreenShares":
                            return typeof r === "number" ? r : l;
                        default:
                            return r ?? l;
                    }
                },
                defaultVonageRoomSettings,
                {
                    maximumSimultaneousScreenShares:
                        maxSimultaneousScreenSharesResponse?.data?.conference_Configuration_by_pk?.value ?? undefined,
                    canControlRecordingAs,
                    isBackstageRoom,
                    onPermissionsProblem,
                    joinRoomButtonText,
                    joiningRoomButtonText,
                    requireMicrophoneOrCamera,
                    completeGetAccessToken,
                    eventIsFuture,
                    eventId,
                    roomId,
                    extraLayoutButtons,
                }
            ),
        [
            canControlRecordingAs,
            extraLayoutButtons,
            isBackstageRoom,
            onPermissionsProblem,
            joinRoomButtonText,
            joiningRoomButtonText,
            requireMicrophoneOrCamera,
            completeGetAccessToken,
            eventIsFuture,
            eventId,
            roomId,
            maxSimultaneousScreenSharesResponse?.data?.conference_Configuration_by_pk?.value,
        ]
    );

    const ctx = useMemo(() => ({ state, dispatch, computedState, settings }), [computedState, state, settings]);

    return <VonageRoomContext.Provider value={ctx}>{children}</VonageRoomContext.Provider>;
}

export function useVonageRoom(): VonageRoomContext {
    return React.useContext(VonageRoomContext);
}
