import type * as OpenTok from "@opentok/client";
import { useMemo, useReducer } from "react";

const initialState: OpenTokState = {
    // connection info
    isSessionInitialized: false,
    connectionId: undefined,
    isSessionConnected: false,

    // connected data
    session: undefined,
    connections: [],
    streams: [],
    subscribers: [],
    publisher: {},
};

export interface OpenTokState {
    isSessionInitialized: boolean;
    connectionId?: string | null;
    isSessionConnected: boolean;
    session?: OpenTok.Session;
    connections: OpenTok.Connection[];
    streams: OpenTok.Stream[];
    subscribers: OpenTok.Subscriber[];
    publisher: { [key: string]: OpenTok.Publisher };
}

export enum ActionType {
    UPDATE = "UPDATE",
    ADD_CONNECTION = "ADD_CONNECTION",
    REMOVE_CONNECTION = "REMOVE_CONNECTION",
    ADD_STREAM = "ADD_STREAM",
    REMOVE_STREAM = "REMOVE_STREAM",
    SET_PUBLISHER = "SET_PUBLISHER",
    REMOVE_PUBLISHER = "REMOVE_PUBLISHER",
    ADD_SUBSCRIBER = "ADD_SUBSCRIBER",
    REMOVE_SUBSCRIBER = "REMOVE_SUBSCRIBER",
}

export type Action = { type: ActionType; payload: any };

const reducer = (state: OpenTokState, action: Action) => {
    const { type, payload } = action;

    switch (type) {
        // CONNECT_SUCCESS
        case ActionType.UPDATE: {
            return {
                ...state,
                ...payload,
            };
        }
        case ActionType.ADD_CONNECTION: {
            return {
                ...state,
                connections: [...state.connections, payload],
            };
        }
        case ActionType.REMOVE_CONNECTION: {
            return {
                ...state,
                connections: [...state.connections.filter((c) => c.connectionId !== payload.connectionId)],
            };
        }
        case ActionType.ADD_STREAM: {
            return {
                ...state,
                streams: [...state.streams, payload],
            };
        }
        case ActionType.REMOVE_STREAM: {
            return {
                ...state,
                streams: [...state.streams.filter((s) => s.streamId !== payload.streamId)],
            };
        }
        case ActionType.SET_PUBLISHER: {
            const { name, publisher } = payload;
            return {
                ...state,
                publisher: {
                    ...state.publisher,
                    [name]: publisher,
                },
            };
        }
        case ActionType.REMOVE_PUBLISHER: {
            const { name } = payload;
            return {
                ...state,
                publisher: {
                    ...state.publisher,
                    [name]: null,
                },
            };
        }
        case ActionType.ADD_SUBSCRIBER: {
            return {
                ...state,
                subscribers: [...state.subscribers, payload],
            };
        }
        case ActionType.REMOVE_SUBSCRIBER: {
            return {
                ...state,
                subscribers: [...state.subscribers.filter((s) => s.stream?.streamId !== payload.streamId)],
            };
        }
        default:
            return state;
    }
};

interface ReducerActions {
    update(payload: Partial<OpenTokState>): void;
    addConnection(connection: OpenTok.Connection): void;
    removeConnection(connection: OpenTok.Connection): void;
    addStream(stream: OpenTok.Stream): void;
    removeStream(stream: OpenTok.Stream): void;
    setPublisher({ name, publisher }: { name: string; publisher: OpenTok.Publisher }): void;
    removePublisher({ name }: { name: string }): void;
    addSubscriber(subscriber: OpenTok.Subscriber): void;
    removeSubscriber(subscriber: OpenTok.Subscriber): void;
}

function useOpenTokReducer(): [state: OpenTokState, action: ReducerActions] {
    const [state, dispatch] = useReducer(reducer, initialState);

    const action = useMemo<ReducerActions>(
        () => ({
            update(payload) {
                dispatch({
                    type: ActionType.UPDATE,
                    payload,
                });
            },
            addConnection(connection) {
                dispatch({
                    type: ActionType.ADD_CONNECTION,
                    payload: connection,
                });
            },
            removeConnection(connection) {
                dispatch({
                    type: ActionType.REMOVE_CONNECTION,
                    payload: connection,
                });
            },
            addStream(stream) {
                dispatch({
                    type: ActionType.ADD_STREAM,
                    payload: stream,
                });
            },
            removeStream(stream) {
                dispatch({
                    type: ActionType.REMOVE_STREAM,
                    payload: stream,
                });
            },
            setPublisher({ name, publisher }) {
                dispatch({
                    type: ActionType.SET_PUBLISHER,
                    payload: { name, publisher },
                });
            },
            removePublisher({ name }) {
                dispatch({
                    type: ActionType.REMOVE_PUBLISHER,
                    payload: { name },
                });
            },
            addSubscriber(subscriber) {
                dispatch({
                    type: ActionType.ADD_SUBSCRIBER,
                    payload: subscriber,
                });
            },
            removeSubscriber(subscriber) {
                dispatch({
                    type: ActionType.REMOVE_SUBSCRIBER,
                    payload: subscriber,
                });
            },
        }),
        [dispatch]
    );

    return [state, action];
}

export default useOpenTokReducer;
