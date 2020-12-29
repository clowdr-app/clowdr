import OT from "@opentok/client";
import { useCallback } from "react";
import useOpenTokReducer, { OpenTokState } from "./useOpentokReducer";
import useSessionEventHandler, { SessionEvent } from "./useSessionEventHandler";

// default options for subscribe and initPublisher
const defaultOptions: Partial<OT.PublisherProperties> = {
    insertMode: "append",
    width: "100%",
    height: "100%",
};

interface SessionOptions {
    connectionEventsSuppressed?: boolean;
    iceConfig?: {
        includeServers: "all" | "custom";
        transportPolicy: "all" | "relay";
        customServers: {
            urls: string | string[];
            username?: string;
            credential?: string;
        }[];
    };
    ipWhitelist?: boolean;
}

interface OpenTokActions {
    initSessionAndConnect({
        apiKey,
        sessionId,
        token,
        sessionOptions,
    }: {
        apiKey: string;
        sessionId: string;
        token: string;
        sessionOptions: SessionOptions;
    }): Promise<void>;
    initSession({
        apiKey,
        sessionId,
        sessionOptions,
    }: {
        apiKey: string;
        sessionId: string;
        sessionOptions: SessionOptions;
    }): Promise<OT.Session>;
    connectSession(token: string, sessionToConnect: OT.Session): Promise<string>;
    disconnectSession(): void;
    initPublisher({
        name,
        element,
        options,
    }: {
        name: string;
        element: string;
        options: Partial<OT.PublisherProperties>;
    }): Promise<OT.Publisher>;
    removePublisher({ name }: { name: string }): void;
    publishPublisher({ name }: { name: string }): Promise<OT.Stream>;
    publish({
        name,
        element,
        options,
    }: {
        name: string;
        element: string;
        options: Partial<OT.PublisherProperties>;
    }): Promise<OT.Stream>;
    unpublish({ name }: { name: string }): void;
    subscribe({
        stream,
        element,
        options,
    }: {
        stream: OT.Stream;
        element: string | HTMLElement;
        options: Partial<OT.SubscriberProperties>;
    }): OT.Subscriber;
    unsubscribe({ stream }: { stream: OT.Stream }): void;
    sendSignal({
        type,
        data,
        to,
        completionHandler,
    }: {
        type?: string;
        data?: string;
        to: OT.Connection;
        completionHandler(): void;
    }): void;
}

function useOpenTok(): [state: OpenTokState, actions: OpenTokActions] {
    const [state, action] = useOpenTokReducer();

    const {
        isSessionConnected,

        session,
        subscribers,
        publisher,

        streams,
    } = state;

    const handleConnectionCreated = useCallback(
        (event) => {
            action.addConnection(event.connection);
        },
        [action]
    );

    const handleConnectionDestroyed = useCallback(
        (event) => {
            action.removeConnection(event.connection);
        },
        [action]
    );

    const handleStreamCreated = useCallback(
        (event) => {
            action.addStream(event.stream);
        },
        [action]
    );

    const handleStreamDestroyed = useCallback(
        (event) => {
            action.removeStream(event.stream);
        },
        [action]
    );

    const initSession = useCallback(
        ({
            apiKey,
            sessionId,
            sessionOptions,
        }: {
            apiKey: string;
            sessionId: string;
            sessionOptions: SessionOptions;
        }): Promise<OT.Session> =>
            new Promise((resolve) => {
                const session = OT.initSession(apiKey, sessionId, sessionOptions);
                action.update({ session, isSessionInitialized: true });
                resolve(session);
            }),
        [action]
    );

    const connectSession = useCallback(
        (token: string, sessionToConnect: OT.Session): Promise<string> =>
            new Promise((resolve, reject) => {
                if (!token) {
                    return reject("[ReactUseOpenTok] token does not exist.");
                }

                if (!sessionToConnect) {
                    return reject("[ReactUseOpenTok] session does not exist.");
                }

                sessionToConnect.connect(token, (error) => {
                    if (error) {
                        reject(error);
                    } else if (!sessionToConnect.connection?.connectionId) {
                        reject("[ReactUseOpenTok] session connection is still undefined");
                    } else {
                        const connectionId = sessionToConnect.connection.connectionId;
                        action.update({
                            connectionId,
                            isSessionConnected: true,
                        });
                        resolve(connectionId);
                    }
                });
            }),
        [action]
    );

    const initSessionAndConnect = useCallback(
        async ({
            apiKey,
            sessionId,
            token,
            sessionOptions,
        }: {
            apiKey: string;
            sessionId: string;
            token: string;
            sessionOptions: SessionOptions;
        }) => {
            const newSession = await initSession({
                apiKey,
                sessionId,
                sessionOptions,
            });

            await connectSession(token, newSession);
        },
        [connectSession, initSession]
    );

    const disconnectSession = useCallback((): void => {
        session?.disconnect();
        action.update({
            connectionId: null,
            isSessionConnected: false,
        });
    }, [action, session]);

    const initPublisher = useCallback(
        ({
            name,
            element,
            options,
        }: {
            name: string;
            element: string;
            options: Partial<OT.PublisherProperties>;
        }): Promise<OT.Publisher> => {
            if (publisher[name]) {
                throw new Error(`[ReactUseOpenTok] initPublisher: The publisher(${name}) is already existed`);
            }
            return new Promise((resolve, reject) => {
                const newPublisher = OT.initPublisher(element, { ...defaultOptions, ...options }, (error) => {
                    if (error) {
                        reject(error);
                    }
                });
                action.setPublisher({
                    name,
                    publisher: newPublisher,
                });
                resolve(newPublisher);
            });
        },
        [action, publisher]
    );

    const removePublisher = useCallback(
        ({ name }): void => {
            if (!publisher[name]) {
                throw new Error(`[ReactUseOpenTok] removePublisher: The publisher(${name}) does not exist`);
            }

            const published = streams.some((stream) => stream.streamId === publisher[name].stream?.streamId);
            if (published) {
                throw new Error(
                    "[ReactUseOpenTok] removePublisher: can NOT remove published publisher, please use unpublish instead."
                );
            }

            publisher[name].destroy();
            action.removePublisher({ name });
        },
        [action, streams, publisher]
    );

    const publishPublisher = useCallback(
        ({ name }): Promise<OT.Stream> => {
            if (!publisher[name]) {
                throw new Error(`[ReactUseOpenTok] publishPublisher: The publisher(${name}) does not exist`);
            }

            if (!session) {
                throw new Error("[ReactUseOpenTok] publishPublisher: No session currently exists");
            }

            return new Promise<OT.Stream>((resolve, reject) => {
                session.publish(publisher[name], (error: OT.OTError | undefined) => {
                    if (error) {
                        reject(error);
                    } else {
                        const stream = publisher[name].stream;
                        if (stream) {
                            action.addStream(stream);
                            resolve(stream);
                        } else {
                            reject(`[ReactUseOpenTok] publishPublisher: Publisher(${name}) stream is still undefined`);
                        }
                    }
                });
            });
        },
        [action, session, publisher]
    );

    const publish = useCallback(
        ({
            name,
            element,
            options,
        }: {
            name: string;
            element: string;
            options: Partial<OT.PublisherProperties>;
        }): Promise<OT.Stream> => {
            if (publisher[name]) {
                throw new Error(`[ReactUseOpenTok] publish: The publisher(${name}) is already existed`);
            }

            return new Promise<OT.Publisher>((resolve, reject) => {
                const newPublisher = OT.initPublisher(element, { ...defaultOptions, ...options }, (error) => {
                    if (error) {
                        reject(error);
                    }
                });
                resolve(newPublisher);
            }).then((newPublisher) => {
                return new Promise((resolve, reject) => {
                    if (!session) {
                        reject("[ReactUseOpenTok] publish: The session is not defined");
                    }
                    session?.publish(newPublisher, (error: OT.OTError | undefined) => {
                        if (error) {
                            reject(error);
                        } else if (!newPublisher.stream) {
                            reject("[ReactUseOpenTok] publish: The stream is still undefined");
                        } else {
                            action.setPublisher({
                                name,
                                publisher: newPublisher,
                            });
                            action.addStream(newPublisher.stream);
                            resolve(newPublisher.stream);
                        }
                    });
                });
            });
        },
        [action, publisher, session]
    );

    const unpublish = useCallback(
        ({ name }: { name: string }): void => {
            if (!(publisher && publisher[name])) {
                throw new Error(`[ReactUseOpenTok] unpublish: publisher[${name}] is undefined`);
            }

            const stream = publisher && publisher[name] && publisher[name].stream;

            session?.unpublish(publisher[name]);
            action.removePublisher({ name });

            if (stream) {
                action.removeStream(stream);
            }
        },
        [action, publisher, session]
    );

    const subscribe = useCallback(
        ({
            stream,
            element,
            options,
        }: {
            stream: OT.Stream;
            element: string | HTMLElement;
            options: Partial<OT.SubscriberProperties>;
        }): OT.Subscriber => {
            if (!session) {
                throw new Error("[ReactUseOpenTok] subscribe: session is undefined");
            }
            const subscriber = session.subscribe(stream, element, {
                ...defaultOptions,
                ...options,
            });

            action.addSubscriber(subscriber);
            return subscriber;
        },
        [action, session]
    );

    const unsubscribe = useCallback(
        ({ stream }: { stream: OT.Stream }): void => {
            const { streamId } = stream;
            const subscriber = subscribers.find((subscriber) => subscriber.stream?.streamId === streamId);

            if (!subscriber) {
                throw new Error(`[ReactUseOpenTok] unsubscribe: No existing subsriber for stream(${streamId})`);
            }

            session?.unsubscribe(subscriber);
            action.removeSubscriber(subscriber);
        },
        [action, session, subscribers]
    );

    const sendSignal = useCallback(
        ({
            type,
            data,
            to,
            completionHandler,
        }: {
            type?: string;
            data?: string;
            to: OT.Connection;
            completionHandler(): void;
        }): void => {
            if (!isSessionConnected) {
                throw new Error("[ReactUseOpenTok] sendSignal: Session is not connected");
            }

            const signal = {
                data,
                ...(type && { type }),
                ...(to && { to }),
            };

            if (!session) {
                throw new Error("[ReactUseOpenTok] sendSignal: Session is undefined");
            }

            session.signal(signal, (error) => {
                if (error) {
                    console.warn("[ReactUseOpenTok] sendSignal error: " + error.message);
                } else if (typeof completionHandler === "function") {
                    completionHandler();
                }
            });
        },
        [isSessionConnected, session]
    );

    useSessionEventHandler(SessionEvent.CONNECTION_CREATED, handleConnectionCreated, session);
    useSessionEventHandler(SessionEvent.CONNECTION_DESTROYED, handleConnectionDestroyed, session);
    useSessionEventHandler(SessionEvent.STREAM_CREATED, handleStreamCreated, session);
    useSessionEventHandler(SessionEvent.STREAM_DESTROYED, handleStreamDestroyed, session);

    return [
        state,
        {
            initSessionAndConnect,
            initSession,
            connectSession,
            disconnectSession,
            initPublisher,
            removePublisher,
            publishPublisher,
            publish,
            unpublish,
            subscribe,
            unsubscribe,
            sendSignal,
        },
    ];
}

export default useOpenTok;
