import { ApolloClient, ApolloError, gql } from "@apollo/client";
import { Mutex } from "async-mutex";
import {
    ChatMessageDataFragment,
    ChatReactionDataFragment,
    Chat_MessageType_Enum,
    InitialChatStateDocument,
    InitialChatStateQuery,
    InitialChatStateQueryVariables,
    InitialChatState_ChatFragment,
    NewMessagesDocument,
    NewMessagesSubscription,
    NewMessagesSubscriptionVariables,
    RoomPrivacy_Enum,
    SelectInitialChatStateDocument,
    SelectInitialChatStateQuery,
    SelectInitialChatStateQueryVariables,
    SelectMessagesPageDocument,
    SelectMessagesPageQuery,
    SelectMessagesPageQueryVariables,
    SendChatAnswerDocument,
    SendChatAnswerMutation,
    SendChatAnswerMutationVariables,
    SendChatMessageDocument,
    SendChatMessageMutation,
    SendChatMessageMutationVariables,
    SubscribeChatDocument,
    SubscribeChatMutation,
    SubscribeChatMutationVariables,
    SubscribedChatMessageDataFragment,
    UnsubscribeChatDocument,
    UnsubscribeChatMutation,
    UnsubscribeChatMutationVariables,
} from "../../generated/graphql";
import type { Attendee } from "../Conference/useCurrentAttendee";
import type { AnswerMessageData, AnswerReactionData, MessageData } from "./Types/Messages";

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

gql`
    mutation SubscribeChat($chatId: uuid!, $attendeeId: uuid!) {
        insert_chat_Subscription(
            objects: { chatId: $chatId, attendeeId: $attendeeId }
            on_conflict: { constraint: Subscription_pkey, update_columns: wasManuallySubscribed }
        ) {
            returning {
                chatId
                attendeeId
            }
        }
        insert_chat_ReadUpToIndex(
            objects: { chatId: $chatId, attendeeId: $attendeeId, messageId: -1 }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [] }
        ) {
            affected_rows
        }
    }

    mutation UnsubscribeChat($chatId: uuid!, $attendeeId: uuid!) {
        delete_chat_Subscription_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
            attendeeId
            chatId
        }
    }
`;

gql`
    mutation PinChat($chatId: uuid!, $attendeeId: uuid!) {
        insert_chat_Pin(
            objects: { chatId: $chatId, attendeeId: $attendeeId }
            on_conflict: { constraint: ChatPin_pkey, update_columns: wasManuallyPinned }
        ) {
            returning {
                chatId
                attendeeId
            }
        }
    }

    mutation UnpinChat($chatId: uuid!, $attendeeId: uuid!) {
        delete_chat_Pin_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
            attendeeId
            chatId
        }
    }
`;

gql`
    fragment ChatReactionData on chat_Reaction {
        data
        id
        senderId
        symbol
        type
    }

    fragment ChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        message
        reactions {
            ...ChatReactionData
        }
        senderId
        type
        chatId
    }

    query SelectMessagesPage($chatId: uuid!, $startAtIndex: Int!, $maxCount: Int!) {
        chat_Message(
            order_by: { id: desc }
            where: { chatId: { _eq: $chatId }, id: { _lte: $startAtIndex } }
            limit: $maxCount
        ) {
            ...ChatMessageData
        }
    }

    fragment SubscribedChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        message
        senderId
        type
        chatId
    }

    subscription NewMessages($chatId: uuid!) {
        chat_Message(order_by: { id: desc }, where: { chatId: { _eq: $chatId } }, limit: 5) {
            ...SubscribedChatMessageData
        }
    }
`;

gql`
    mutation SendChatMessage(
        $chatId: uuid!
        $senderId: uuid!
        $type: chat_MessageType_enum!
        $message: String!
        $data: jsonb = {}
        $isPinned: Boolean = false
        $chatTitle: String = " "
        $senderName: String = " "
    ) {
        insert_chat_Message_one(
            object: {
                chatId: $chatId
                data: $data
                isPinned: $isPinned
                message: $message
                senderId: $senderId
                type: $type
                chatTitle: $chatTitle
                senderName: $senderName
            }
        ) {
            ...SubscribedChatMessageData
        }
    }

    mutation SendChatAnswer($data: jsonb!, $senderId: uuid!, $answeringId: Int!) {
        insert_chat_Reaction_one(
            object: { messageId: $answeringId, senderId: $senderId, symbol: "ANSWER", type: ANSWER, data: $data }
        ) {
            id
        }
    }
`;

export class MessageState {
    constructor(
        private readonly globalState: GlobalChatState,
        private readonly chatState: ChatState,
        private readonly initialState: ChatMessageDataFragment | SubscribedChatMessageDataFragment
    ) {}

    public get Id(): number {
        return this.initialState.id;
    }

    public get created_at(): string {
        return this.initialState.created_at;
    }
    public get data(): any {
        return this.initialState.data;
    }
    public get duplicatedMessageId(): number | null | undefined {
        return this.initialState.duplicatedMessageId;
    }
    public get id(): number {
        return this.initialState.id;
    }
    public get message(): string {
        return this.initialState.message;
    }
    public get senderId(): string | null | undefined {
        return this.initialState.senderId;
    }
    public get type(): Chat_MessageType_Enum {
        return this.initialState.type;
    }
    public get chatId(): string {
        return this.initialState.chatId;
    }

    // TODO: Make this observable
    public get reactions(): ReadonlyArray<ChatReactionDataFragment> {
        return [];
    }

    public updateFrom(msg: SubscribedChatMessageDataFragment): void {
        // TODO
    }
}

type MessageUpdate =
    | {
          op: "initial";
          messages: MessageState[];
      }
    | {
          op: "loaded_historic";
          messages: MessageState[];
      }
    | {
          op: "loaded_new";
          messages: MessageState[];
      }
    | {
          op: "deleted";
          messageIds: number[];
      };

export class ChatState {
    private static readonly DefaultPageSize = 30;

    private pinSubMutex = new Mutex();
    private messagesMutex = new Mutex();
    private initSubscriptionMutex = new Mutex();
    private sendMutex = new Mutex();

    constructor(
        private readonly globalState: GlobalChatState,
        private readonly initialState: InitialChatState_ChatFragment
    ) {
        this.name =
            (initialState.contentGroup.length > 0
                ? initialState.contentGroup[0].shortTitle ?? initialState.contentGroup[0].title
                : initialState.nonDMRoom.length > 0
                ? initialState.nonDMRoom[0].name
                : initialState.DMRoom.length > 0
                ? initialState.DMRoom[0].roomPeople.find((x) => x?.attendee?.id !== globalState.attendee.id)?.attendee
                      ?.displayName
                : undefined) ?? "<No name available>";

        this.isPinned = initialState.pins.length > 0;
        this.isSubscribed = initialState.subscriptions.length > 0;
        this.unreadCount =
            initialState.readUpToIndices.length > 0 ? initialState.readUpToIndices[0].unreadCount ?? 0 : 0;

        if (this.isSubscribed) {
            this.subscribeToMoreMessages();
        }
    }

    public async teardown(): Promise<void> {
        await this.unsubscribeFromMoreMessages(true);
    }

    public get Id(): string {
        return this.initialState.id;
    }

    private name: string;
    public get Name(): string {
        return this.name;
    }

    public get EnableMandatoryPin(): boolean {
        return this.initialState.enableMandatoryPin;
    }

    public get EnableMandatorySubscribe(): boolean {
        return this.initialState.enableMandatorySubscribe;
    }

    public get IsDM(): boolean {
        return !!this.DMRoomId;
    }

    public get IsPrivate(): boolean {
        return (
            this.IsDM ||
            (this.initialState.nonDMRoom.length > 0 &&
                this.initialState.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public)
        );
    }

    public get DMRoomId(): string | undefined {
        if (this.initialState.DMRoom.length > 0) {
            return this.initialState.DMRoom[0].id;
        }
        return undefined;
    }

    public get NonDMRoomId(): string | undefined {
        if (this.initialState.nonDMRoom.length > 0) {
            return this.initialState.nonDMRoom[0].id;
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
    private isTogglingPinned = false;
    public get IsTogglingPinned(): boolean {
        return this.isTogglingPinned;
    }
    public async togglePinned(): Promise<void> {
        const isPind = this.isPinned;
        this.isPinned = !this.isPinned;
        this.isPinnedObs.publish(this.isPinned);

        const release = await this.pinSubMutex.acquire();
        this.isTogglingPinned = true;

        try {
            if (isPind) {
                if (!this.EnableMandatorySubscribe) {
                    try {
                        await this.globalState.apolloClient.mutate<
                            UnsubscribeChatMutation,
                            UnsubscribeChatMutationVariables
                        >({
                            mutation: UnsubscribeChatDocument,
                            variables: {
                                attendeeId: this.globalState.attendee.id,
                                chatId: this.Id,
                            },
                        });
                    } catch (e) {
                        this.isPinned = isPind;
                        throw e;
                    }
                }
            } else {
                try {
                    const result = await this.globalState.apolloClient.mutate<
                        SubscribeChatMutation,
                        SubscribeChatMutationVariables
                    >({
                        mutation: SubscribeChatDocument,
                        variables: {
                            attendeeId: this.globalState.attendee.id,
                            chatId: this.Id,
                        },
                    });
                    this.isPinned =
                        !!result.data?.insert_chat_Subscription && !!result.data.insert_chat_Subscription.returning;
                } catch (e) {
                    if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                        this.isPinned = isPind;
                        throw e;
                    } else {
                        this.isPinned = true;
                    }
                }
            }
        } catch (e) {
            console.error(`Error toggling chat pin: ${this.Id}`, e);
        } finally {
            this.isTogglingPinned = false;
            release();

            this.isPinnedObs.publish(this.isPinned);
        }
    }

    private isSubscribed: boolean;
    private isSubscribedObs = new Observable<boolean>((observer) => {
        observer(this.isSubscribed);
    });
    public get IsSubscribed(): Observable<boolean> {
        return this.isSubscribedObs;
    }
    private isTogglingSubscribed = false;
    public get IsTogglingSubscribed(): boolean {
        return this.isTogglingSubscribed;
    }
    public async toggleSubscribed(): Promise<void> {
        const isSubd = this.isSubscribed;
        this.isSubscribed = !this.isSubscribed;
        this.isSubscribedObs.publish(this.isSubscribed);

        const release = await this.pinSubMutex.acquire();
        this.isTogglingSubscribed = true;

        try {
            if (isSubd) {
                if (!this.EnableMandatorySubscribe) {
                    try {
                        await this.globalState.apolloClient.mutate<
                            UnsubscribeChatMutation,
                            UnsubscribeChatMutationVariables
                        >({
                            mutation: UnsubscribeChatDocument,
                            variables: {
                                attendeeId: this.globalState.attendee.id,
                                chatId: this.Id,
                            },
                        });
                    } catch (e) {
                        this.isSubscribed = isSubd;
                        throw e;
                    }
                }
            } else {
                try {
                    const result = await this.globalState.apolloClient.mutate<
                        SubscribeChatMutation,
                        SubscribeChatMutationVariables
                    >({
                        mutation: SubscribeChatDocument,
                        variables: {
                            attendeeId: this.globalState.attendee.id,
                            chatId: this.Id,
                        },
                    });
                    this.isSubscribed =
                        !!result.data?.insert_chat_Subscription && !!result.data.insert_chat_Subscription.returning;
                } catch (e) {
                    if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                        this.isSubscribed = isSubd;
                        throw e;
                    } else {
                        this.isSubscribed = true;
                    }
                }
            }
        } catch (e) {
            console.error(`Error toggling chat subscription: ${this.Id}`, e);
        } finally {
            this.isTogglingSubscribed = false;
            release();

            this.isSubscribedObs.publish(this.isSubscribed);
        }
    }

    private unreadCount: number;
    private unreadCountObs = new Observable<number>((observer) => {
        observer(this.unreadCount);
    });
    public get UnreadCount(): Observable<number> {
        return this.unreadCountObs;
    }

    private messages = new Map<number, MessageState>();
    private lastHistoricallyFetchedMessageId = Math.pow(2, 31) - 1;
    private messagesObs = new Observable<MessageUpdate>((observer) => {
        observer({
            op: "initial",
            messages: [...this.messages.values()],
        });
    });
    private mightHaveMoreMessagesObs = new Observable<boolean>((observer) => {
        observer(this.lastHistoricallyFetchedMessageId !== -1);
    });
    public get MightHaveMoreMessages(): Observable<boolean> {
        return this.mightHaveMoreMessagesObs;
    }
    public get Messages(): Observable<MessageUpdate> {
        return this.messagesObs;
    }
    private isLoadingMessages = false;
    private isLoadingMessagesObs = new Observable<boolean>((observer) => {
        observer(this.isLoadingMessages);
    });
    public get IsLoadingMessages(): Observable<boolean> {
        return this.isLoadingMessagesObs;
    }
    public async loadMoreMessages(pageSize: number = ChatState.DefaultPageSize): Promise<void> {
        const release = await this.messagesMutex.acquire();
        this.isLoadingMessages = true;
        this.isLoadingMessagesObs.publish(this.isLoadingMessages);

        let newMessageStates: MessageState[] | undefined;

        try {
            if (this.lastHistoricallyFetchedMessageId !== -1) {
                const result = await this.globalState.apolloClient.query<
                    SelectMessagesPageQuery,
                    SelectMessagesPageQueryVariables
                >({
                    query: SelectMessagesPageDocument,
                    variables: {
                        chatId: this.Id,
                        maxCount: pageSize,
                        startAtIndex: this.lastHistoricallyFetchedMessageId,
                    },
                });
                if (result.data.chat_Message.length > 0) {
                    // TODO: This shouldn't ever overlap, so I don't think we need to handle updates here
                    newMessageStates = result.data.chat_Message
                        .filter((msg) => !this.messages.has(msg.id))
                        .map((message) => new MessageState(this.globalState, this, message));
                    if (newMessageStates.length > 0) {
                        this.lastHistoricallyFetchedMessageId =
                            result.data.chat_Message.length < pageSize ? -1 : newMessageStates[0].Id;
                        newMessageStates.forEach((state) => {
                            this.messages.set(state.Id, state);
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Error loading more messages: ${this.Id}`, e);
        } finally {
            this.isLoadingMessages = false;
            release();

            this.isLoadingMessagesObs.publish(this.isLoadingMessages);

            if (newMessageStates && newMessageStates.length > 0) {
                this.messagesObs.publish({
                    op: "loaded_historic",
                    messages: newMessageStates,
                });
                this.mightHaveMoreMessagesObs.publish(this.lastHistoricallyFetchedMessageId !== -1);
            } else if (this.lastHistoricallyFetchedMessageId !== -1) {
                this.mightHaveMoreMessagesObs.publish(false);
            }
        }
    }
    private subscribedToMoreMessages: ZenObservable.Subscription | null = null;
    public async subscribeToMoreMessages(): Promise<void> {
        const release = await this.initSubscriptionMutex.acquire();

        try {
            if (!this.subscribedToMoreMessages || this.subscribedToMoreMessages.closed) {
                const subscription = this.globalState.apolloClient.subscribe<
                    NewMessagesSubscription,
                    NewMessagesSubscriptionVariables
                >({
                    query: NewMessagesDocument,
                    variables: {
                        chatId: this.Id,
                    },
                });
                this.subscribedToMoreMessages = subscription.subscribe(async ({ data }) => {
                    const release = await this.messagesMutex.acquire();

                    let newMessageStates: MessageState[] | undefined;

                    try {
                        if (data) {
                            const updatedMessages = data.chat_Message.filter((msg) => this.messages.has(msg.id));
                            updatedMessages.forEach((msg) => {
                                const msgSt = this.messages.get(msg.id);
                                if (msgSt) {
                                    msgSt.updateFrom(msg);
                                }
                            });
                            newMessageStates = data.chat_Message
                                .filter((msg) => !this.messages.has(msg.id))
                                .map((message) => new MessageState(this.globalState, this, message));
                            newMessageStates.forEach((msg) => {
                                this.messages.set(msg.Id, msg);
                            });
                        }
                    } catch (e) {
                        console.error(`Error processing new messages from subscription: ${this.Id}`, e);
                    } finally {
                        release();

                        if (newMessageStates && newMessageStates.length > 0) {
                            this.messagesObs.publish({
                                op: "loaded_new",
                                messages: newMessageStates,
                            });
                        }
                    }
                });
            }
        } catch (e) {
            console.error(`Error subscribing to new messages: ${this.Id}`, e);
        } finally {
            release();
        }
    }
    public async unsubscribeFromMoreMessages(force = false): Promise<void> {
        const release = await this.initSubscriptionMutex.acquire();

        try {
            if (
                (force || !this.isSubscribed) &&
                this.subscribedToMoreMessages &&
                !this.subscribedToMoreMessages.closed
            ) {
                this.subscribedToMoreMessages.unsubscribe();
            }
        } catch (e) {
            console.error(`Error unsubscribing from new messages: ${this.Id}`, e);
        } finally {
            release();
        }
    }

    private isSending = false;
    private isSendingObs = new Observable<boolean>((observer) => {
        observer(this.isSending);
    });
    public get IsSending(): Observable<boolean> {
        return this.isSendingObs;
    }
    public async send(
        chatId: string,
        senderId: string,
        senderName: string,
        type: Chat_MessageType_Enum,
        message: string,
        data: MessageData,
        isPinned: boolean,
        chatTitle: string
    ): Promise<void> {
        const release = await this.sendMutex.acquire();

        this.isSending = true;
        this.isSendingObs.publish(this.isSending);
        try {
            const newMsg = (
                await this.globalState.apolloClient.mutate<SendChatMessageMutation, SendChatMessageMutationVariables>({
                    mutation: SendChatMessageDocument,
                    variables: {
                        chatId,
                        message,
                        senderId,
                        type,
                        data,
                        isPinned,
                        senderName,
                        chatTitle,
                    },
                })
            ).data?.insert_chat_Message_one;

            if (type === Chat_MessageType_Enum.Answer && newMsg) {
                const answeringIds = (data as AnswerMessageData).questionMessagesIds;
                if (answeringIds.length > 0) {
                    const reactionData: AnswerReactionData = {
                        answerMessageId: newMsg.id,
                        duplicateAnswerMessageId: newMsg.duplicatedMessageId ?? undefined,
                    };
                    const newReaction = await this.globalState.apolloClient.mutate<
                        SendChatAnswerMutation,
                        SendChatAnswerMutationVariables
                    >({
                        mutation: SendChatAnswerDocument,
                        variables: {
                            answeringId: answeringIds[0],
                            data: reactionData,
                            senderId,
                        },
                    });
                    // TODO: Update the target message
                }
            }
        } catch (e) {
            console.error(`Failed to send message: ${this.Id}`, e);
        } finally {
            this.isSending = false;
            release();

            this.isSendingObs.publish(this.isSending);
        }
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
            if (this.chatStates) {
                await Promise.all(
                    [...this.chatStates.values()].map(async (st) => {
                        await st.teardown();
                    })
                );
            }
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
