import { ApolloClient, gql } from "@apollo/client";
import { Mutex } from "async-mutex";
import {
    InitialChatStateDocument,
    InitialChatStateQuery,
    InitialChatStateQueryVariables,
    InitialChatState_ChatFragment,
    RoomPrivacy_Enum,
    SelectInitialChatStateDocument,
    SelectInitialChatStateQuery,
    SelectInitialChatStateQueryVariables,
} from "../../generated/graphql";
import type { Attendee } from "../Conference/useCurrentAttendee";

type Observer<V> = (v: V) => true | void;

class Observable<V> {
    observers = new Map<number, Observer<V>>();
    idGenerator = 1;

    constructor(private onSubscribed?: (observer: Observer<V>) => void) {}

    public subscribe(observer: Observer<V>): () => void {
        const newId = this.idGenerator++;
        this.observers.set(newId, observer);
        this.onSubscribed?.(observer);
        return () => {
            this.observers.delete(newId);
        };
    }

    public publish(v: V): void {
        this.observers.forEach((observer, id) => {
            if (observer(v)) {
                this.observers.delete(id);
            }
        });
    }
}

gql`
    fragment InitialChatState_ReadUpToIndex on chat_ReadUpToIndex {
        attendeeId
        chatId
        messageId
        notifiedUpToMessageId
        unreadCount
    }

    fragment ChatState_SubdMessage on chat_Message {
        id
        chatId
        message
        type
        senderId
        senderName
    }

    fragment InitialChatState_Chat on chat_Chat {
        id
        contentGroup {
            id
            title
            shortTitle
        }
        nonDMRoom: room(where: { roomPrivacyName: { _neq: DM } }) {
            id
            name
            priority
            roomPrivacyName
        }
        DMRoom: room(where: { roomPrivacyName: { _eq: DM } }) {
            id
            name
            roomPeople {
                id
                attendee {
                    id
                    displayName
                }
            }
        }
        enableAutoPin
        enableAutoSubscribe
        enableMandatoryPin
        enableMandatorySubscribe
        readUpToIndices(where: { attendeeId: { _eq: $attendeeId } }) {
            ...InitialChatState_ReadUpToIndex
        }
        messages(limit: 1, order_by: { id: desc }) {
            ...ChatState_SubdMessage
        }
        pins(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            wasManuallyPinned
        }
        subscriptions(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            wasManuallySubscribed
        }
    }

    query InitialChatState($attendeeId: uuid!) {
        chat_Chat(
            where: {
                _or: [
                    { pins: { attendeeId: { _eq: $attendeeId } } }
                    { subscriptions: { attendeeId: { _eq: $attendeeId } } }
                ]
            }
        ) {
            ...InitialChatState_Chat
        }
    }

    query SelectInitialChatState($chatId: uuid!, $attendeeId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            ...InitialChatState_Chat
        }
    }
`;

export class ChatState {
    private name: string;

    constructor(private globalState: GlobalChatState, private initialInfo: InitialChatState_ChatFragment) {
        this.name =
            (initialInfo.contentGroup.length > 0
                ? initialInfo.contentGroup[0].shortTitle ?? initialInfo.contentGroup[0].title
                : initialInfo.nonDMRoom.length > 0
                ? initialInfo.nonDMRoom[0].name
                : initialInfo.DMRoom.length > 0
                ? initialInfo.DMRoom[0].roomPeople.find((x) => x?.attendee?.id !== globalState.attendee.id)?.attendee
                      ?.displayName
                : undefined) ?? "<No name available>";

        this.isPinned = initialInfo.pins.length > 0;
        this.unreadCount = initialInfo.readUpToIndices.length > 0 ? initialInfo.readUpToIndices[0].unreadCount ?? 0 : 0;
    }

    public get Id(): string {
        return this.initialInfo.id;
    }

    public get Name(): string {
        return this.name;
    }

    public get EnableMandatoryPin(): boolean {
        return this.initialInfo.enableMandatoryPin;
    }

    public get IsDM(): boolean {
        return !!this.DMRoomId;
    }

    public get IsPrivate(): boolean {
        return (
            this.IsDM ||
            (this.initialInfo.nonDMRoom.length > 0 &&
                this.initialInfo.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public)
        );
    }

    public get DMRoomId(): string | undefined {
        if (this.initialInfo.DMRoom.length > 0) {
            return this.initialInfo.DMRoom[0].id;
        }
        return undefined;
    }

    public get NonDMRoomId(): string | undefined {
        if (this.initialInfo.nonDMRoom.length > 0) {
            return this.initialInfo.nonDMRoom[0].id;
        }
        return undefined;
    }

    public get RoomId(): string | undefined {
        return this.DMRoomId ?? this.NonDMRoomId;
    }

    private isPinned: boolean;
    private isPinnedObs = new Observable<boolean>((observer) => {
        observer(this.isPinned);
    });
    public get IsPinned(): Observable<boolean> {
        return this.isPinnedObs;
    }

    private unreadCount: number;
    private unreadCountObs = new Observable<number>((observer) => {
        observer(this.unreadCount);
    });
    public get UnreadCount(): Observable<number> {
        return this.unreadCountObs;
    }

    static compare(x: ChatState, y: ChatState): number {
        const nameComparison = x.Name.localeCompare(y.Name);
        if (x.unreadCount && y.unreadCount) {
            return nameComparison;
        } else if (x.unreadCount) {
            return -1;
        } else if (y.unreadCount) {
            return 1;
        }
        return nameComparison;
    }
}

export class GlobalChatState {
    constructor(
        public readonly conference: {
            id: string;
            slug: string;
            name: string;
            shortName: string;
        },
        public readonly attendee: Attendee,
        public readonly apolloClient: ApolloClient<unknown>
    ) {}

    private chatStates: Map<string, ChatState> | undefined;

    private chatStatesObs = new Observable<Map<string, ChatState>>((observer) => {
        if (this.chatStates) {
            observer(this.chatStates);
        }
    });

    public get Chats(): Observable<ReadonlyMap<string, ChatState>> {
        return (this.chatStatesObs as unknown) as Observable<ReadonlyMap<string, ChatState>>;
    }

    public observeChatId(chatId: string, observer: Observer<ChatState>): () => void {
        let hasUnsubscribed = false;
        const unsubscribe = this.chatStatesObs.subscribe((chats) => {
            const chat = chats.get(chatId);
            if (chat) {
                hasUnsubscribed = true;
                observer(chat);
                return true;
            }
        });

        if (!this.chatStates?.has(chatId)) {
            this.fetchChat(chatId);
        }

        return () => {
            if (!hasUnsubscribed) {
                unsubscribe();
            }
        };
    }

    private mutex = new Mutex();
    public async init(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            const initialData = await this.apolloClient.query<InitialChatStateQuery, InitialChatStateQueryVariables>({
                query: InitialChatStateDocument,
                variables: {
                    attendeeId: this.attendee.id,
                },
            });

            console.log("Initial chat data", initialData);

            if (!this.chatStates) {
                this.chatStates = new Map();
            }
            initialData.data.chat_Chat.forEach((chat) => {
                this.chatStates?.set(chat.id, new ChatState(this, chat));
            });

            this.chatStatesObs.publish(this.chatStates);
        } catch (e) {
            console.error("Failed to initialise chat state", e);
        } finally {
            release();
        }
    }

    public async teardown(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            // TODO: Destroy observers, subscriptions, etc
        } finally {
            release();
        }
    }

    private async fetchChat(chatId: string) {
        try {
            const release = await this.mutex.acquire();

            try {
                if (!this.chatStates?.has(chatId)) {
                    const result = await this.apolloClient.query<
                        SelectInitialChatStateQuery,
                        SelectInitialChatStateQueryVariables
                    >({
                        query: SelectInitialChatStateDocument,
                        variables: {
                            chatId,
                            attendeeId: this.attendee.id,
                        },
                    });

                    if (result.data.chat_Chat_by_pk) {
                        if (!this.chatStates) {
                            this.chatStates = new Map<string, ChatState>();
                        }
                        this.chatStates.set(chatId, new ChatState(this, result.data.chat_Chat_by_pk));
                        this.chatStatesObs.publish(this.chatStates);
                    } else {
                        throw new Error("No chat returned by SelectInitialChatState query");
                    }
                }
            } finally {
                release();
            }
        } catch (e) {
            console.error(`Failed to fetch chat: ${chatId}`, e);
        }
    }
}
