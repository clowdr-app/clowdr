/* eslint-disable react/prop-types */
import { ApolloClient, ApolloError, gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    ButtonGroup,
    CloseButton,
    createStandaloneToast,
    Heading,
    RenderProps,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import { Mutex } from "async-mutex";
import * as R from "ramda";
import React from "react";
import {
    AddReactionDocument,
    AddReactionMutation,
    AddReactionMutationVariables,
    ChatMessageDataFragment,
    ChatReactionDataFragment,
    Chat_MessageType_Enum,
    Chat_Reaction_Insert_Input,
    DeleteMessageDocument,
    DeleteMessageMutation,
    DeleteMessageMutationVariables,
    DeleteReactionDocument,
    DeleteReactionMutation,
    DeleteReactionMutationVariables,
    GetRemoteChatServiceTokenDocument,
    GetRemoteChatServiceTokenMutation,
    GetRemoteChatServiceTokenMutationVariables,
    InitialChatStateDocument,
    InitialChatStateQuery,
    InitialChatStateQueryVariables,
    InitialChatState_ChatFragment,
    PinChatDocument,
    PinChatMutation,
    PinChatMutationVariables,
    RoomPrivacy_Enum,
    SelectInitialChatStateDocument,
    SelectInitialChatStateQuery,
    SelectInitialChatStateQueryVariables,
    SelectInitialChatStatesDocument,
    SelectInitialChatStatesQuery,
    SelectInitialChatStatesQueryVariables,
    SelectMessagesPageDocument,
    SelectMessagesPageQuery,
    SelectMessagesPageQueryVariables,
    SelectPinnedOrSubscribedDocument,
    SelectPinnedOrSubscribedQuery,
    SelectPinnedOrSubscribedQueryVariables,
    SendChatMessageDocument,
    SendChatMessageMutation,
    SendChatMessageMutationVariables,
    ShortChatMessageDataFragment,
    SubscribeChatDocument,
    SubscribeChatMutation,
    SubscribeChatMutationVariables,
    UnpinChatDocument,
    UnpinChatMutation,
    UnpinChatMutationVariables,
    UnsubscribeChatDocument,
    UnsubscribeChatMutation,
    UnsubscribeChatMutationVariables,
} from "../../generated/graphql";
import type { Attendee } from "../Conference/useCurrentAttendee";
import { Markdown } from "../Text/Markdown";
import type { AnswerMessageData, AnswerReactionData, MessageData } from "./Types/Messages";

export type Observer<V> = (v: V) => true | void;

export class Observable<V> {
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
        remoteServiceId
    }

    fragment InitialChatState_Chat on chat_Chat {
        id
        remoteServiceId
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
        chat_PinnedOrSubscribed(where: { attendeeId: { _eq: $attendeeId } }) {
            chatId
            attendeeId
            chat {
                ...InitialChatState_Chat
            }
        }
    }

    query SelectInitialChatState($chatId: uuid!, $attendeeId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            ...InitialChatState_Chat
        }
    }

    query SelectInitialChatStates($chatIds: [uuid!]!, $attendeeId: uuid!) {
        chat_Chat(where: { id: { _in: $chatIds } }) {
            ...InitialChatState_Chat
        }
    }

    query SelectPinnedOrSubscribed($attendeeId: uuid!) {
        chat_PinnedOrSubscribed(where: { attendeeId: { _eq: $attendeeId } }) {
            chatId
            attendeeId
            chat {
                id
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
        messageId
        remoteServiceId
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
        remoteServiceId
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

    # subscription NewMessages($chatId: uuid!) {
    #     chat_Message(order_by: { id: desc }, where: { chatId: { _eq: $chatId } }, limit: 5) {
    #         ...SubscribedChatMessageData
    #     }
    # }
`;

gql`
    fragment ShortChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        message
        senderId
        type
        chatId
        remoteServiceId
    }

    mutation SendChatMessage(
        $chatId: uuid!
        $senderId: uuid!
        $type: chat_MessageType_enum!
        $message: String!
        $data: jsonb = {}
        $isPinned: Boolean = false
    ) {
        insert_chat_Message_one(
            object: {
                chatId: $chatId
                data: $data
                isPinned: $isPinned
                message: $message
                senderId: $senderId
                type: $type
            }
        ) {
            ...ShortChatMessageData
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

gql`
    query SelectReadUpToIndices($chatIds: [uuid!]!, $attendeeId: uuid!) {
        chat_ReadUpToIndex(where: { chatId: { _in: $chatIds }, attendeeId: { _eq: $attendeeId } }) {
            ...InitialChatState_ReadUpToIndex
        }
    }

    mutation InsertReadUpToIndex($chatId: uuid!, $attendeeId: uuid!, $messageId: Int!, $notifiedUpToMessageId: Int!) {
        insert_chat_ReadUpToIndex_one(
            object: {
                attendeeId: $attendeeId
                chatId: $chatId
                messageId: $messageId
                notifiedUpToMessageId: $notifiedUpToMessageId
            }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [messageId, notifiedUpToMessageId] }
        ) {
            attendeeId
            chatId
            messageId
        }
    }

    mutation UpdateReadUpToIndex($chatId: uuid!, $attendeeId: uuid!, $messageId: Int!, $notifiedUpToMessageId: Int!) {
        update_chat_ReadUpToIndex(
            where: {
                attendeeId: { _eq: $attendeeId }
                chatId: { _eq: $chatId }
                messageId: { _lte: $messageId }
                notifiedUpToMessageId: { _lte: $notifiedUpToMessageId }
            }
            _set: { messageId: $messageId, notifiedUpToMessageId: $notifiedUpToMessageId }
        ) {
            affected_rows
        }
    }
`;

gql`
    mutation DeleteMessage($id: Int!) {
        delete_chat_Message_by_pk(id: $id) {
            id
        }
    }
`;

gql`
    mutation AddReaction($reaction: chat_Reaction_insert_input!) {
        insert_chat_Reaction_one(object: $reaction) {
            ...ChatReactionData
        }
    }

    mutation DeleteReaction($reactionId: Int!) {
        delete_chat_Reaction_by_pk(id: $reactionId) {
            id
        }
    }
`;

gql`
    mutation GetRemoteChatServiceToken($attendeeId: uuid!) {
        generateChatRemoteToken(attendeeId: $attendeeId) {
            expiry
            jwt
        }
    }
`;

// gql`
//     subscription MessageReactions($messageIds: [Int!]!) {
//         chat_Reaction(where: { messageId: { _in: $messageIds } }) {
//             ...ChatReactionData
//         }
//     }
// `;

// CHAT_TODO
// gql`
//     fragment ChatFlagData on chat_Flag {
//         discussionChatId
//         flaggedById
//         id
//         messageId
//         notes
//         resolution
//         resolved_at
//         type
//         updated_at
//         created_at
//     }
// `;

export class MessageState {
    constructor(
        private readonly globalState: GlobalChatState,
        private readonly initialState: ChatMessageDataFragment | ShortChatMessageDataFragment
    ) {
        if ("reactions" in initialState) {
            this.reactions = [...initialState.reactions];
        } else {
            this.reactions = [];
        }
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

    private reactions: ChatReactionDataFragment[];
    private reactionsObs = new Observable<ChatReactionDataFragment[]>((observer) => {
        observer([...this.reactions]);
    });
    public async addReaction(reaction: Chat_Reaction_Insert_Input): Promise<void> {
        try {
            const result = await this.globalState.apolloClient.mutate<
                AddReactionMutation,
                AddReactionMutationVariables
            >({
                mutation: AddReactionDocument,
                variables: {
                    reaction: {
                        ...reaction,
                        senderId: this.globalState.attendee.id,
                        messageId: this.id,
                    },
                },
            });

            if (result.data?.insert_chat_Reaction_one) {
                this.reactions.push(result.data.insert_chat_Reaction_one);
                this.reactionsObs.publish([...this.reactions]);
            }
        } catch (e) {
            if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                console.error(`Error adding reaction: ${this.id} / ${reaction.symbol}`, e);
            }
        }
    }
    public async deleteReaction(reactionId: number): Promise<void> {
        try {
            await this.globalState.apolloClient.mutate<DeleteReactionMutation, DeleteReactionMutationVariables>({
                mutation: DeleteReactionDocument,
                variables: {
                    reactionId,
                },
            });

            this.reactions = this.reactions.filter((x) => x.id !== reactionId);
            this.reactionsObs.publish([...this.reactions]);
        } catch (e) {
            if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                console.error(`Error adding reaction: ${this.id} / ${reactionId}`, e);
            }
        }
    }
    public get Reactions(): Observable<ChatReactionDataFragment[]> {
        return this.reactionsObs;
    }

    // public async startReactionsSubscription(): Promise<void> {
    //     await this.globalState.addMessageIdForReactionSubscription(this);
    // }
    // public async endReactionsSubscription(): Promise<void> {
    //     await this.globalState.addMessageIdForReactionSubscription(this);
    // }

    public updateReactions(reactions: ChatReactionDataFragment[]): void {
        this.reactions = reactions;
        this.reactionsObs.publish([...this.reactions]);
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
    private remoteChatMutex = new Mutex();
    private sendMutex = new Mutex();

    private remoteChat: Promise<Channel> | null;

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
        this.unreadCount = 0;
        this.readUpToMsgId = -1;
        this.readUpTo_ExistsInDb = false;
        this.latestNotifiedIndex = -1;

        this.remoteChat = null;
    }

    public async teardown(): Promise<void> {
        await this.unsubscribeFromMoreMessages(true);
        // if (this.readUpTo_Timeout) {
        //     clearTimeout(this.readUpTo_Timeout.id);
        //     await this.saveReadUpToIndex();
        // }
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

        if (this.isPinned) {
            await this.subscribeToMoreMessages();
        }

        const release = await this.pinSubMutex.acquire();
        this.isTogglingPinned = true;

        try {
            if (isPind) {
                if (!this.EnableMandatorySubscribe) {
                    try {
                        await this.globalState.apolloClient.mutate<UnpinChatMutation, UnpinChatMutationVariables>({
                            mutation: UnpinChatDocument,
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
                        PinChatMutation,
                        PinChatMutationVariables
                    >({
                        mutation: PinChatDocument,
                        variables: {
                            attendeeId: this.globalState.attendee.id,
                            chatId: this.Id,
                        },
                    });
                    this.isPinned = !!result.data?.insert_chat_Pin && !!result.data.insert_chat_Pin.returning;
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
    public async setIsPinned(value: boolean): Promise<void> {
        if (value !== this.isPinned) {
            await this.togglePinned();
        }
    }

    public get isPinned_InternalUseOnly(): boolean {
        return this.isPinned;
    }

    public isSubscribed: boolean;
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

        if (this.isSubscribed) {
            await this.subscribeToMoreMessages();
        }

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
                    this.readUpTo_ExistsInDb = true;
                } catch (e) {
                    if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                        this.isSubscribed = isSubd;
                        throw e;
                    } else {
                        this.isSubscribed = true;
                        this.readUpTo_ExistsInDb = true;
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
    public async setIsSubscribed(value: boolean): Promise<void> {
        if (value !== this.isSubscribed) {
            await this.toggleSubscribed();
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
    private fetchMoreAttempts = 0;
    private lastHistoricallyFetchedMessageId = Math.pow(2, 31) - 1;
    private messagesObs = new Observable<MessageUpdate>((observer) => {
        observer({
            op: "initial",
            messages: R.sortBy((x) => -x.id, [...this.messages.values()]),
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
                    result.data.chat_Message.forEach((msg) => {
                        const existing = this.messages.get(msg.id);
                        if (existing) {
                            // This mostly only happens when the subscription initially
                            // pulls in data faster than selecting the first page does
                            existing.updateReactions([...msg.reactions]);
                        }
                    });

                    newMessageStates = result.data.chat_Message
                        .filter((msg) => !this.messages.has(msg.id))
                        .map((message) => new MessageState(this.globalState, message));
                    if (newMessageStates.length > 0) {
                        if (result.data.chat_Message.length > 0) {
                            this.fetchMoreAttempts = 0;
                        } else {
                            this.fetchMoreAttempts++;
                        }

                        this.lastHistoricallyFetchedMessageId =
                            result.data.chat_Message.length === 0 && this.fetchMoreAttempts >= 5
                                ? -1
                                : result.data.chat_Message.length === 0
                                ? Math.max(this.lastHistoricallyFetchedMessageId, 0)
                                : newMessageStates[newMessageStates.length - 1].id;
                        newMessageStates.forEach((state) => {
                            this.messages.set(state.id, state);
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
    private subscribedToMoreMessages = false;
    public async subscribeToMoreMessages(): Promise<void> {
        const release = await this.remoteChatMutex.acquire();

        try {
            if (this.initialState.remoteServiceId) {
                if (!this.subscribedToMoreMessages) {
                    this.subscribedToMoreMessages = true;

                    const remoteServiceClient = await this.globalState.remoteServiceClient;
                    this.remoteChat = remoteServiceClient?.getChannelBySid(this.initialState.remoteServiceId) ?? null;
                    const remoteChat = await this.remoteChat;
                    try {
                        if (remoteChat?.status !== "joined") {
                            await remoteChat?.join();
                        } else {
                            await remoteChat?._subscribe();
                        }
                    } catch (e) {
                        console.error(`Error joining remote service for chat: ${this.Id}`, e);
                    }
                    remoteChat?.on("messageAdded", this.messageAddedListener.bind(this));
                    remoteChat?.on("messageRemoved", this.messageRemovedListener.bind(this));
                    remoteChat?.on("messageUpdated", this.messageUpdatedListener.bind(this));

                    if (remoteChat?.lastMessage) {
                        await remoteChat?.getMessages(
                            ChatState.DefaultPageSize,
                            remoteChat.lastMessage.index,
                            "backwards"
                        );
                    }
                }
            } else {
                console.warn(
                    `Live messages and reactions unavailable for chat ${this.initialState.id} because the remote service has not been set up for this chat yet.`
                );
            }
        } catch (e) {
            console.error(`Error subscribing to new messages: ${this.Id}`, e);
        } finally {
            release();
        }
    }
    public async unsubscribeFromMoreMessages(force = false): Promise<void> {
        const release = await this.remoteChatMutex.acquire();

        try {
            if (force || (!this.isSubscribed && !this.isPinned)) {
                const remoteChat = await this.remoteChat;
                remoteChat?._unsubscribe();
                // This API has an "on" but not an "off"...WTH?!
                // remoteChat?.off("messageAdded", this.messageAddedListener);
                // remoteChat?.off("messageRemoved", this.messageRemovedListener);
                // remoteChat?.off("messageUpdated", this.messageUpdatedListener);
            }
        } catch (e) {
            console.error(`Error unsubscribing from new messages: ${this.Id}`, e);
        } finally {
            release();
        }
    }

    private async messageAddedListener(msg: TwilioMessage) {
        const release = await this.messagesMutex.acquire();
        let newMessageStates: MessageState[] | undefined;
        try {
            const attrs = msg.attributes as Record<string, any>;
            const existing = this.messages.get(attrs.id);
            if (!existing) {
                let senderId = null;
                try {
                    const member = await msg.getMember();
                    senderId = member.identity;
                } catch {
                    // Ignore - maybe system sent the message
                }
                newMessageStates = [
                    new MessageState(this.globalState, {
                        id: attrs.id,
                        data: attrs.data,
                        type: attrs.type,
                        chatId: this.Id,
                        message: msg.body,
                        created_at: msg.dateCreated.toISOString(),
                        senderId,
                    }),
                ];
                newMessageStates.forEach((msg) => {
                    this.messages.set(msg.id, msg);
                });
            }
        } catch (e) {
            console.error(`Error processing new messages from remote service: ${this.Id}`, e);
        } finally {
            release();
            if (newMessageStates && newMessageStates.length > 0) {
                this.messagesObs.publish({
                    op: "loaded_new",
                    messages: newMessageStates,
                });
                await this.computeNotifications(newMessageStates[0]);
            }
        }
    }

    private async messageRemovedListener(msg: TwilioMessage) {
        const release = await this.messagesMutex.acquire();
        let deletedId: number | undefined;
        try {
            const attrs = msg.attributes as Record<string, any>;
            if (this.messages.delete(attrs.id)) {
                deletedId = attrs.id;
            }
        } catch (e) {
            console.error(`Error processing removed messages from remote service: ${this.Id}`, e);
        } finally {
            release();
            if (deletedId) {
                this.messagesObs.publish({
                    op: "deleted",
                    messageIds: [deletedId],
                });
            }
        }
    }

    private async messageUpdatedListener({
        message: ev,
        updateReasons,
    }: {
        message: TwilioMessage;
        updateReasons: Array<TwilioMessage.UpdateReason>;
    }) {
        const release = await this.messagesMutex.acquire();
        try {
            if (updateReasons && updateReasons.includes("attributes")) {
                const attrs = ev.attributes as Record<string, any>;
                const existingMsg = this.messages.get(attrs.id);
                if (existingMsg) {
                    existingMsg.updateReactions(attrs.reactions);
                }
            }
        } catch (e) {
            console.error(`Error processing updated messages from remote service: ${this.Id}`, e);
        } finally {
            release();
        }
    }

    private readonly toast = createStandaloneToast();
    private latestNotifiedIndex: number;
    private async computeNotifications(message: MessageState) {
        if (this.latestNotifiedIndex < message.id) {
            if (this.latestNotifiedIndex !== -1 && this.readUpToMsgId < message.id) {
                const remoteChat = await this.remoteChat;
                const remoteUnreadCount =
                    message.senderId === this.globalState.attendee.id
                        ? 0
                        : (await remoteChat?.getUnconsumedMessagesCount()) ?? Number.POSITIVE_INFINITY;
                const newCount = Math.min(this.unreadCount + 1, remoteUnreadCount);
                if (this.unreadCount !== newCount) {
                    this.unreadCount = newCount;
                    this.unreadCountObs.publish(this.unreadCount);
                }
            }

            const prevNotifIndex = this.latestNotifiedIndex;
            this.latestNotifiedIndex = message.id;

            if (
                this.isSubscribed &&
                prevNotifIndex !== -1 &&
                this.readUpToMsgId < message.id &&
                this.globalState.attendee.id !== message.senderId &&
                message.chatId !== this.globalState.suppressNotificationsForChatId &&
                message.type !== Chat_MessageType_Enum.DuplicationMarker &&
                message.type !== Chat_MessageType_Enum.Emote
            ) {
                const chatPath = `/conference/${this.globalState.conference.slug}/chat/${this.Id}`;
                const chatName = this.Name;
                const chatIsDM = this.IsDM;
                const globalState = this.globalState;

                this.toast({
                    position: "top-right",
                    description: message.message,
                    isClosable: true,
                    duration: 15000,
                    render: function ChatNotification(props: RenderProps) {
                        return (
                            <VStack
                                alignItems="flex-start"
                                background="purple.700"
                                color="gray.50"
                                w="auto"
                                h="auto"
                                p={5}
                                opacity={0.95}
                                borderRadius={10}
                                position="relative"
                                pt={2}
                            >
                                <CloseButton position="absolute" top={2} right={2} onClick={props.onClose} />
                                <Heading textAlign="left" as="h2" fontSize="1rem" my={0} py={0}>
                                    New{" "}
                                    {message.type === Chat_MessageType_Enum.Message
                                        ? "message"
                                        : message.type === Chat_MessageType_Enum.Answer
                                        ? "answer"
                                        : message.type === Chat_MessageType_Enum.Question
                                        ? "question"
                                        : "message"}
                                </Heading>
                                <Heading
                                    textAlign="left"
                                    as="h3"
                                    fontSize="0.9rem"
                                    fontStyle="italic"
                                    maxW="250px"
                                    noOfLines={1}
                                >
                                    {chatIsDM ? "from " : "in "}
                                    {chatName}
                                </Heading>
                                <Box maxW="250px" maxH="200px" overflow="hidden" noOfLines={10}>
                                    <Markdown restrictHeadingSize>{message.message}</Markdown>
                                </Box>
                                <ButtonGroup isAttached>
                                    {globalState.openChatInSidebar ? (
                                        <Button
                                            colorScheme="green"
                                            onClick={() => {
                                                props.onClose();
                                                globalState.openChatInSidebar?.(message.chatId);
                                                globalState.showSidebar?.();
                                            }}
                                        >
                                            Go to chat
                                        </Button>
                                    ) : undefined}
                                    {chatPath ? (
                                        <Button
                                            colorScheme="blue"
                                            onClick={() => {
                                                props.onClose();
                                                window.open(chatPath, "_blank");
                                            }}
                                        >
                                            <ExternalLinkIcon />
                                        </Button>
                                    ) : undefined}
                                </ButtonGroup>
                            </VStack>
                        );
                    },
                });
            }
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
        type: Chat_MessageType_Enum,
        message: string,
        data: MessageData,
        isPinned: boolean
    ): Promise<void> {
        const release = await this.sendMutex.acquire();

        this.unreadCount = 0;
        this.unreadCountObs.publish(0);

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
                    },
                })
            ).data?.insert_chat_Message_one;

            if (newMsg) {
                const release2 = await this.messagesMutex.acquire();
                const newMsgState = new MessageState(this.globalState, newMsg);
                try {
                    if (!this.messages.has(newMsg.id)) {
                        this.messages.set(newMsg.id, newMsgState);
                    }
                } finally {
                    release2();

                    this.messagesObs.publish({
                        op: "loaded_new",
                        messages: [newMsgState],
                    });
                }

                if (type === Chat_MessageType_Enum.Answer && newMsg) {
                    const answeringIds = (data as AnswerMessageData).questionMessagesIds;
                    if (answeringIds.length > 0) {
                        const answeringId = answeringIds[0];
                        const reactionData: AnswerReactionData = {
                            answerMessageId: newMsg.id,
                            duplicateAnswerMessageId: newMsg.duplicatedMessageId ?? undefined,
                        };
                        const targetMsg = this.messages.get(answeringId);
                        if (targetMsg) {
                            await targetMsg.addReaction({
                                data: reactionData,
                                senderId,
                            });
                        }
                    }
                }
            } else {
                throw new Error("New message mutation returned null or undefined");
            }
        } catch (e) {
            console.error(`Failed to send message: ${this.Id}`, e);
        } finally {
            this.isSending = false;
            release();

            this.isSendingObs.publish(this.isSending);
        }
    }

    public async deleteMessage(messageId: number): Promise<void> {
        const release = await this.messagesMutex.acquire();

        try {
            await this.globalState.apolloClient.mutate<DeleteMessageMutation, DeleteMessageMutationVariables>({
                mutation: DeleteMessageDocument,
                variables: {
                    id: messageId,
                },
            });
            this.messagesObs.publish({
                op: "deleted",
                messageIds: [messageId],
            });
        } catch (e) {
            console.error(`Error deleting message: ${this.Id} @ ${messageId}`, e);
            throw e;
        } finally {
            release();
        }
    }

    private readUpToMsgId: number;
    private readUpTo_ExistsInDb: boolean;
    private readUpTo_Timeout: { id: number; firstTimestampMs: number } | undefined;
    public get ReadUpToMsgId(): number {
        return this.readUpToMsgId;
    }
    public setAllMessagesRead(messageId: number): void {
        this.readUpToMsgId = Math.max(this.readUpToMsgId, messageId);
        this.latestNotifiedIndex = Math.max(messageId, this.latestNotifiedIndex);
        this.unreadCount = 0;
        this.unreadCountObs.publish(0);

        (async () => {
            const remoteChat = await this.remoteChat;
            await remoteChat?.setAllMessagesConsumed();
        })();
    }
    public async updateReadUpToIdx(): Promise<void> {
        const remoteChat = await this.remoteChat;
        const newCount = (await remoteChat?.getUnconsumedMessagesCount()) ?? 0;
        if (this.unreadCount !== newCount) {
            this.unreadCount = newCount;
            this.unreadCountObs.publish(this.unreadCount);
        }
    }

    static compare(x: ChatState, y: ChatState): number {
        const nameComparison = x.Name.localeCompare(y.Name);
        // TODO: Right side bar would need to monitor all unread counts of pinned chats to reapply sorting
        // if (x.unreadCount && y.unreadCount) {
        //     return nameComparison;
        // } else if (x.unreadCount) {
        //     return -1;
        // } else if (y.unreadCount) {
        //     return 1;
        // }
        return nameComparison;
    }
}

export class GlobalChatState {
    private _suppressNotificationsForChatId: string | null = null;
    public get suppressNotificationsForChatId(): string | null {
        return this._suppressNotificationsForChatId;
    }
    public set suppressNotificationsForChatId(value: string | null) {
        this._suppressNotificationsForChatId = value;
        this.suppressNotificationsForChatIdObs.publish(value);
    }
    public suppressNotificationsForChatIdObs: Observable<string | null> = new Observable((observe) => {
        observe(this.suppressNotificationsForChatId);
    });
    public openChatInSidebar: ((chatId: string) => void) | null = null;
    public showSidebar: (() => void) | null = null;

    private remoteServiceToken: string | null = null;
    public remoteServiceClient: Promise<Twilio.Chat.Client | null> | null = null;

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
        if (this.chatStates !== undefined) {
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
    private hasInitialised = false;
    private hasTorndown = false;
    public async init(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            if (!this.hasInitialised) {
                this.hasInitialised = true;
                if (!this.hasTorndown) {
                    // eslint-disable-next-line no-async-promise-executor
                    this.remoteServiceClient = new Promise(async (resolve, reject) => {
                        let resolved = false;

                        try {
                            let retry: boolean;
                            let attempCount = 0;

                            do {
                                retry = false;
                                attempCount++;

                                if (!this.remoteServiceToken) {
                                    const { token } = await this.fetchFreshToken();
                                    if (token) {
                                        this.remoteServiceToken = token;
                                        console.info("RemoteService token obtained.");
                                    } else {
                                        this.remoteServiceToken = null;

                                        console.warn("RemoteService token not obtained.");
                                        throw new Error("RemoteService token not obtained.");
                                    }
                                }

                                assert(this.remoteServiceToken);

                                try {
                                    const result = await Twilio.Chat.Client.create(this.remoteServiceToken);
                                    resolve(result);
                                    resolved = true;
                                    console.info("Created RemoteService client.");

                                    // Enable underlying service features
                                    this.enableAutoRenewConnection();

                                    // TODO: Attach to events
                                } catch (e) {
                                    if (e.toString().includes("expired")) {
                                        console.info("RemoteService token (probably) expired.");

                                        this.remoteServiceToken = null;

                                        if (attempCount < 2) {
                                            retry = true;
                                        }
                                    }

                                    if (!retry) {
                                        console.error("Could not create RemoteService client!", e);
                                        throw e;
                                    }
                                }
                            } while (retry);

                            if (!resolved) {
                                resolve(null);
                            }
                        } catch (e) {
                            if (!resolved) {
                                reject(e);
                            }
                        }
                    });

                    const initialData = await this.apolloClient.query<
                        InitialChatStateQuery,
                        InitialChatStateQueryVariables
                    >({
                        query: InitialChatStateDocument,
                        variables: {
                            attendeeId: this.attendee.id,
                        },
                    });

                    console.info("Initial chat data", initialData);

                    await this.remoteServiceClient;

                    console.info("Remote service client configured.", initialData);

                    if (!this.chatStates) {
                        this.chatStates = new Map();
                    }
                    await Promise.all(
                        initialData.data.chat_PinnedOrSubscribed.map(async (item) => {
                            if (item.chat) {
                                const newState = new ChatState(this, item.chat);
                                if (newState.isSubscribed || newState.isPinned_InternalUseOnly) {
                                    await newState.subscribeToMoreMessages();
                                }
                                await newState.updateReadUpToIdx();
                                this.chatStates?.set(item.chat.id, newState);
                            }
                        })
                    );

                    this.chatStatesObs.publish(this.chatStates);

                    // await this.setupUnreadCountPolling();
                    await this.setupPinsSubsPolling();
                    // await this.setupReactionsSubscription();
                }
            }
        } catch (e) {
            console.error("Failed to initialise chat state", e);
        } finally {
            release();
        }
    }

    private async fetchFreshToken(): Promise<{
        token: string | null;
        expiry: Date | null;
    }> {
        console.info(
            `Fetching fresh chat token for ${this.attendee.displayName} (${this.attendee.id}), ${this.conference.name} (${this.conference.id})`
        );

        const result = await this.apolloClient.mutate<
            GetRemoteChatServiceTokenMutation,
            GetRemoteChatServiceTokenMutationVariables
        >({
            mutation: GetRemoteChatServiceTokenDocument,
            variables: {
                attendeeId: this.attendee.id,
            },
        });
        return {
            token: result.data?.generateChatRemoteToken?.jwt ?? "Unknown token",
            expiry: new Date(result.data?.generateChatRemoteToken?.expiry ?? 0),
        };
    }

    async enableAutoRenewConnection(): Promise<void> {
        console.info("Enabling auto-renew connection.");
        (await this.remoteServiceClient)?.on("tokenAboutToExpire", async () => {
            console.info("Token about to expire");

            const { token } = await this.fetchFreshToken();
            if (token) {
                this.remoteServiceToken = token;
                console.info("Twilio token for renewal obtained.");

                await (await this.remoteServiceClient)?.updateToken(token);
            } else {
                this.remoteServiceToken = null;
                console.warn("Twilio token for renewal not obtained.");
                throw new Error("Twilio token for renewal not obtained.");
            }
        });
    }

    public async teardown(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            if (!this.hasTorndown) {
                this.hasTorndown = true;
                if (this.hasInitialised) {
                    // await this.teardownReactionsSubscription();
                    await this.teardownPinsSubsPolling();
                    // await this.teardownUnreadCountPolling();

                    if (this.chatStates) {
                        await Promise.all(
                            [...this.chatStates.values()].map(async (st) => {
                                await st.teardown();
                            })
                        );
                    }
                }
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
                        const newState = new ChatState(this, result.data.chat_Chat_by_pk);
                        if (newState.isSubscribed || newState.isPinned_InternalUseOnly) {
                            await newState.subscribeToMoreMessages();
                        }
                        await newState.updateReadUpToIdx();
                        this.chatStates.set(chatId, newState);
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

    // private unreadCountPollMutex = new Mutex();
    // private unreadCountMutex = new Mutex();
    // private unreadCount_IntervalId: number | undefined;
    // private async setupUnreadCountPolling() {
    //     const release = await this.unreadCountPollMutex.acquire();

    //     try {
    //         if (this.unreadCount_IntervalId === undefined) {
    //             this.unreadCount_IntervalId = setInterval(
    //                 (() => {
    //                     this.pollUnreadCount();
    //                 }) as TimerHandler,
    //                 30 * 1000
    //             );
    //         }
    //     } catch (e) {
    //         console.error("Failed to setup polling unread count", e);
    //     } finally {
    //         release();
    //     }
    // }
    // private async teardownUnreadCountPolling() {
    //     const release = await this.unreadCountPollMutex.acquire();

    //     try {
    //         if (this.unreadCount_IntervalId === undefined) {
    //             clearInterval(this.unreadCount_IntervalId);
    //         }
    //     } catch (e) {
    //         console.error("Failed to tear down polling unread count", e);
    //     } finally {
    //         release();
    //     }
    // }
    // private async pollUnreadCount() {
    //     const release = await this.unreadCountMutex.acquire();

    //     const newDatas = new Map<
    //         string,
    //         { count: number | undefined; latestNotifiedIndex: number; readUpToMsgId: number }
    //     >();
    //     try {
    //         if (this.chatStates) {
    //             const chatIds = [...this.chatStates.values()]
    //                 .filter((x) => x.isPinned_InternalUseOnly)
    //                 .map((x) => x.Id);
    //             if (chatIds.length > 0) {
    //                 const result = await this.apolloClient.query<
    //                     SelectReadUpToIndicesQuery,
    //                     SelectReadUpToIndicesQueryVariables
    //                 >({
    //                     query: SelectReadUpToIndicesDocument,
    //                     variables: {
    //                         attendeeId: this.attendee.id,
    //                         chatIds,
    //                     },
    //                 });
    //                 if (result.data.chat_ReadUpToIndex) {
    //                     for (const index of result.data.chat_ReadUpToIndex) {
    //                         const chatState = this.chatStates.get(index.chatId);
    //                         if (chatState) {
    //                             newDatas.set(index.chatId, {
    //                                 count: index.unreadCount ?? undefined,
    //                                 latestNotifiedIndex: index.notifiedUpToMessageId,
    //                                 readUpToMsgId: index.messageId,
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     } catch (e) {
    //         console.error("Failed to fetch unread counts", e);
    //     } finally {
    //         release();

    //         for (const [chatId, newData] of newDatas) {
    //             const chatState = this.chatStates?.get(chatId);
    //             if (chatState) {
    //                 await chatState.updateReadUpToIdx(newData);
    //             }
    //         }
    //     }
    // }

    private pinsSubsPollMutex = new Mutex();
    private pinsSubsMutex = new Mutex();
    private pinsSubs_IntervalId: number | undefined;
    private async setupPinsSubsPolling() {
        const release = await this.pinsSubsPollMutex.acquire();

        try {
            if (this.pinsSubs_IntervalId === undefined) {
                this.pinsSubs_IntervalId = setInterval(
                    (() => {
                        this.pollPinsSubs();
                    }) as TimerHandler,
                    30 * 1000
                );
            }
        } catch (e) {
            console.error("Failed to setup polling unread count", e);
        } finally {
            release();
        }
    }
    private async teardownPinsSubsPolling() {
        const release = await this.pinsSubsPollMutex.acquire();

        try {
            if (this.pinsSubs_IntervalId === undefined) {
                clearInterval(this.pinsSubs_IntervalId);
            }
        } catch (e) {
            console.error("Failed to tear down polling unread count", e);
        } finally {
            release();
        }
    }
    private async pollPinsSubs() {
        const release = await this.pinsSubsMutex.acquire();

        try {
            if (this.chatStates) {
                const allPinsSubs = await this.apolloClient.query<
                    SelectPinnedOrSubscribedQuery,
                    SelectPinnedOrSubscribedQueryVariables
                >({
                    query: SelectPinnedOrSubscribedDocument,
                    variables: {
                        attendeeId: this.attendee.id,
                    },
                    fetchPolicy: "network-only",
                });
                const newlyPinSubIds: string[] = [];
                for (const pinSub of allPinsSubs.data.chat_PinnedOrSubscribed) {
                    if (pinSub.chat) {
                        const isPinned = pinSub.chat.pins.length > 0;
                        const isSubscribed = pinSub.chat.subscriptions.length > 0;

                        const existing = this.chatStates.get(pinSub.chatId);
                        if (existing) {
                            existing.setIsPinned(isPinned);
                            existing.setIsSubscribed(isSubscribed);
                        } else {
                            newlyPinSubIds.push(pinSub.chatId);
                        }
                    }
                }
                if (newlyPinSubIds.length > 0) {
                    const newlyPinSubChats = await this.apolloClient.query<
                        SelectInitialChatStatesQuery,
                        SelectInitialChatStatesQueryVariables
                    >({
                        query: SelectInitialChatStatesDocument,
                        variables: {
                            attendeeId: this.attendee.id,
                            chatIds: newlyPinSubIds,
                        },
                        fetchPolicy: "network-only",
                    });
                    for (const pinSubChat of newlyPinSubChats.data.chat_Chat) {
                        const newState = new ChatState(this, pinSubChat);
                        if (newState.isSubscribed || newState.isPinned_InternalUseOnly) {
                            await newState.subscribeToMoreMessages();
                        }
                        await newState.updateReadUpToIdx();
                        this.chatStates.set(pinSubChat.id, newState);
                    }
                    this.chatStatesObs.publish(this.chatStates);
                }
            }
        } catch (e) {
            console.error("Failed to fetch unread counts", e);
        } finally {
            release();
        }
    }

    // private reactionsSubscription_MessagesMutex = new Mutex();
    // private reactionsSubscription_SetupMutex = new Mutex();
    // private reactionsSubscription_Messages = new Map<number, MessageState>();
    // private reactionsSubscription_ReconfigureTimeoutId: number | undefined;
    // private reactionsSubscription: ZenObservable.Subscription | null = null;

    // public async addMessageIdForReactionSubscription(msg: MessageState): Promise<void> {
    //     const release = await this.reactionsSubscription_MessagesMutex.acquire();

    //     try {
    //         this.reactionsSubscription_Messages.set(msg.id, msg);
    //         await this.reconfigureReactionsSubscription();
    //     } catch (e) {
    //         console.error(`Failed to add message to reactions subscription: ${msg.id}`, e);
    //     } finally {
    //         release();
    //     }
    // }
    // public async removeMessageIdForReactionSubscription(msg: MessageState): Promise<void> {
    //     const release = await this.reactionsSubscription_MessagesMutex.acquire();

    //     try {
    //         this.reactionsSubscription_Messages.delete(msg.id);
    //         await this.reconfigureReactionsSubscription();
    //     } catch (e) {
    //         console.error(`Failed to remove message from reactions subscription: ${msg.id}`, e);
    //     } finally {
    //         release();
    //     }
    // }
    // private async reconfigureReactionsSubscription(): Promise<void> {
    //     if (this.reactionsSubscription_ReconfigureTimeoutId !== undefined) {
    //         clearTimeout(this.reactionsSubscription_ReconfigureTimeoutId);
    //     }

    //     this.reactionsSubscription_ReconfigureTimeoutId = setTimeout(
    //         (async () => {
    //             await this.teardownReactionsSubscription();
    //             await this.setupReactionsSubscription();
    //         }) as TimerHandler,
    //         1500
    //     );
    // }
    // private async setupReactionsSubscription(): Promise<void> {
    //     const release = await this.reactionsSubscription_SetupMutex.acquire();

    //     try {
    //         if (!this.reactionsSubscription) {
    //             const messageIds = [...this.reactionsSubscription_Messages.values()].map((x) => x.id);
    //             if (messageIds.length > 0) {
    //                 const sub = this.apolloClient.subscribe<
    //                     MessageReactionsSubscription,
    //                     MessageReactionsSubscriptionVariables
    //                 >({
    //                     query: MessageReactionsDocument,
    //                     variables: {
    //                         messageIds,
    //                     },
    //                 });
    //                 this.reactionsSubscription = sub.subscribe(({ data }) => {
    //                     try {
    //                         if (data?.chat_Reaction) {
    //                             const messageReactions = new Map<number, ChatReactionDataFragment[]>();
    //                             for (const reaction of data.chat_Reaction) {
    //                                 let existing = messageReactions.get(reaction.messageId);
    //                                 if (!existing) {
    //                                     existing = [];
    //                                     messageReactions.set(reaction.messageId, existing);
    //                                 }
    //                                 existing.push(reaction);
    //                             }

    //                             for (const [msgId, reactions] of messageReactions) {
    //                                 const msg = this.reactionsSubscription_Messages.get(msgId);
    //                                 if (msg) {
    //                                     msg.updateReactions(reactions);
    //                                 }
    //                             }
    //                         }
    //                     } catch (e) {
    //                         console.error("Error updating reactions", e);
    //                     }
    //                 });
    //             }
    //         }
    //     } catch (e) {
    //         console.error("Failed to setup reactions subscriptions", e);
    //     } finally {
    //         release();
    //     }
    // }
    // private async teardownReactionsSubscription(): Promise<void> {
    //     const release = await this.reactionsSubscription_SetupMutex.acquire();

    //     try {
    //         if (this.reactionsSubscription) {
    //             this.reactionsSubscription.unsubscribe();
    //             this.reactionsSubscription = null;
    //         }
    //     } catch (e) {
    //         console.error("Failed to teardown reactions subscriptions", e);
    //     } finally {
    //         release();
    //     }
    // }
}
