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
import { v4 as uuidv4 } from "uuid";
import {
    ChatReactionDataFragment,
    Chat_MessageType_Enum,
    Chat_Reaction_Insert_Input,
    InitialChatStateDocument,
    InitialChatStateQuery,
    InitialChatStateQueryVariables,
    InitialChatState_ChatFragment,
    Maybe,
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
import { realtimeService } from "../Realtime/RealtimeService";
import type { Action, Message, Notification, Reaction } from "../Realtime/RealtimeServiceCommonTypes";
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
        chat_Pin(where: { attendeeId: { _eq: $attendeeId } }) {
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

    # query SelectPinnedOrSubscribed($attendeeId: uuid!) {
    #     chat_PinnedOrSubscribed(where: { attendeeId: { _eq: $attendeeId } }) {
    #         chatId
    #         attendeeId
    #         chat {
    #             id
    #             pins(where: { attendeeId: { _eq: $attendeeId } }) {
    #                 attendeeId
    #                 chatId
    #                 wasManuallyPinned
    #             }
    #             subscriptions(where: { attendeeId: { _eq: $attendeeId } }) {
    #                 attendeeId
    #                 chatId
    #                 wasManuallySubscribed
    #             }
    #         }
    #     }
    # }
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
        sId
        data
        senderId
        symbol
        type
        messageSId
        duplicateSId
    }

    fragment ChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageSId
        id
        sId
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
        duplicatedMessageSId
        message
        senderId
        type
        chatId
        sId
    }

    fragment ShortChatReactionData on chat_Reaction {
        data
        senderId
        symbol
        type
        messageSId
        sId
        duplicateSId
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

// CHAT_TODO
// gql`
//     fragment ChatFlagData on chat_Flag {
//         discussionChatId
//         flaggedById
//         id
//         messageSId
//         notes
//         resolution
//         resolved_at
//         type
//         updated_at
//         created_at
//     }
// `;

export type ChatMessageData = {
    created_at: string;
    data: any;
    duplicatedMessageSId?: Maybe<string>;
    id: number;
    sId: string;
    message: string;
    senderId?: Maybe<string>;
    type: Chat_MessageType_Enum;
    chatId: string;
    reactions: ReadonlyArray<{ readonly __typename?: "chat_Reaction" } & ChatReactionDataFragment>;
};

export type ShortChatMessageData = {
    created_at: string;
    data: any;
    duplicatedMessageSId?: Maybe<string>;
    message: string;
    senderId?: Maybe<string>;
    type: Chat_MessageType_Enum;
    chatId: string;
    sId: string;
};

export class MessageState {
    constructor(
        private readonly globalState: GlobalChatState,
        private readonly initialState: ChatMessageData | ShortChatMessageData
    ) {
        if ("reactions" in initialState) {
            this.reactions = [...initialState.reactions];
        } else {
            this.reactions = [];
        }
    }

    createdAtN: number | undefined;
    public get created_at(): number {
        this.createdAtN = this.createdAtN ?? Date.parse(this.initialState.created_at);
        return this.createdAtN;
    }
    public get data(): any {
        return this.initialState.data;
    }
    public get duplicatedMessageSId(): string | null | undefined {
        return this.initialState.duplicatedMessageSId;
    }
    public get id(): number | undefined {
        return "id" in this.initialState ? this.initialState.id : undefined;
    }
    public get sId(): string {
        return this.initialState.sId;
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

    private updatedAt = Date.now();
    public updatedAtObs = new Observable<number>((observer) => {
        observer(this.updatedAt);
    });
    public update(msg: Message): void {
        this.initialState.data = msg.data;
        this.initialState.duplicatedMessageSId = msg.duplicatedMessageSId;
        this.initialState.message = msg.message;
        this.initialState.senderId = msg.senderId;
        this.initialState.type = msg.type;
        this.updatedAt = Date.now();
        this.updatedAtObs.publish(this.updatedAt);
    }

    private reactions: ChatReactionDataFragment[];
    private reactionsObs = new Observable<ChatReactionDataFragment[]>((observer) => {
        observer([...this.reactions]);
    });
    public async addReaction(reaction: Chat_Reaction_Insert_Input): Promise<void> {
        // CHAT_TODO
        // try {
        //     const result = await this.globalState.apolloClient.mutate<
        //         AddReactionMutation,
        //         AddReactionMutationVariables
        //     >({
        //         mutation: AddReactionDocument,
        //         variables: {
        //             reaction: {
        //                 ...reaction,
        //                 senderId: this.globalState.attendee.id,
        //                 messageSId: this.sId,
        //             },
        //         },
        //     });
        //     if (result.data?.insert_chat_Reaction_one) {
        //         this.reactions.push(result.data.insert_chat_Reaction_one);
        //         this.reactionsObs.publish([...this.reactions]);
        //     }
        // } catch (e) {
        //     if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
        //         console.error(`Error adding reaction: ${this.sId} / ${reaction.symbol}`, e);
        //     }
        // }
    }
    public async deleteReaction(reactionSId: string): Promise<void> {
        // CHAT_TODO
        // try {
        //     await this.globalState.apolloClient.mutate<DeleteReactionMutation, DeleteReactionMutationVariables>({
        //         mutation: DeleteReactionDocument,
        //         variables: {
        //             reactionId,
        //         },
        //     });
        //     this.reactions = this.reactions.filter((x) => x.id !== reactionId);
        //     this.reactionsObs.publish([...this.reactions]);
        // } catch (e) {
        //     if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
        //         console.error(`Error adding reaction: ${this.sId} / ${reactionId}`, e);
        //     }
        // }
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
          messageSIds: string[];
      };

export class ChatState {
    private static readonly DefaultPageSize = 30;

    private pinSubMutex = new Mutex();
    private messagesMutex = new Mutex();
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
        this.unreadCount = 0;

        // CHAT_TODO
        // this.readUpToMsgId = -1;
        // this.readUpTo_ExistsInDb = false;
        // this.latestNotifiedIndex = -1;
    }

    public async teardown(): Promise<void> {
        await this.unsubscribe(true);
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

                    // CHAT_TODO
                    // this.readUpTo_ExistsInDb = true;
                } catch (e) {
                    if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                        this.isSubscribed = isSubd;
                        throw e;
                    } else {
                        this.isSubscribed = true;

                        // CHAT_TODO
                        // this.readUpTo_ExistsInDb = true;
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

    private messages = new Map<string, MessageState>();
    private fetchMoreAttempts = 0;
    private lastHistoricallyFetchedMessageId = Math.pow(2, 31) - 1;
    private messagesObs = new Observable<MessageUpdate>((observer) => {
        observer({
            op: "initial",
            messages: R.sortBy((x) => -x.created_at, [...this.messages.values()]),
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
                        const existing = this.messages.get(msg.sId);
                        if (existing) {
                            // This mostly only happens when the subscription initially
                            // pulls in data faster than selecting the first page does
                            existing.updateReactions([...msg.reactions]);
                        }
                    });

                    newMessageStates = result.data.chat_Message
                        .filter((msg) => !this.messages.has(msg.sId))
                        .map((message) => new MessageState(this.globalState, { ...message }));
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
                                : newMessageStates[newMessageStates.length - 1].id ??
                                  this.lastHistoricallyFetchedMessageId;
                        newMessageStates.forEach((state) => {
                            this.messages.set(state.sId, state);
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

    private subMutex = new Mutex();
    private subCount = 0;
    public async subscribe(): Promise<void> {
        const release = await this.subMutex.acquire();

        try {
            this.subCount++;
            if (this.subCount === 1) {
                const socket = await this.globalState.socket;
                socket?.emit("chat.subscribe", this.Id);
            }
        } catch (e) {
            console.error(`Error subscribing to chat: ${this.Id}`, e);
        } finally {
            release();
        }
    }
    public async unsubscribe(force = false): Promise<void> {
        const release = await this.subMutex.acquire();

        try {
            this.subCount--;
            if (this.subCount === 0 || force) {
                const socket = await this.globalState.socket;
                socket?.emit("chat.unsubscribe", this.Id);
            }
            if (!force && this.subCount < 0) {
                console.warn(
                    "Chat sub count went negative..hmmm...suggests the ref count is going out of sync somehow.",
                    this.subCount
                );
            }
        } catch (e) {
            console.error(`Error unsubscribing from chat: ${this.Id}`, e);
        } finally {
            release();
        }
    }

    public async onMessageAdded(msg: Message): Promise<void> {
        const release = await this.messagesMutex.acquire();
        let newMessageStates: MessageState[] | undefined;
        try {
            const existing = this.messages.get(msg.sId);
            if (!existing) {
                newMessageStates = [
                    new MessageState(this.globalState, {
                        sId: msg.sId,
                        data: msg.data,
                        type: msg.type,
                        chatId: this.Id,
                        message: msg.message,
                        created_at: msg.created_at,
                        senderId: msg.senderId,
                    }),
                ];
                newMessageStates.forEach((msg) => {
                    this.messages.set(msg.sId, msg);
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
            }
        }
    }

    public async onMessageRemoved(msg: Message): Promise<void> {
        const release = await this.messagesMutex.acquire();
        let deletedSId: string | undefined;
        try {
            if (this.messages.delete(msg.sId)) {
                deletedSId = msg.sId;
            }
        } catch (e) {
            console.error(`Error processing removed messages from remote service: ${this.Id}`, e);
        } finally {
            release();
            if (deletedSId) {
                this.messagesObs.publish({
                    op: "deleted",
                    messageSIds: [deletedSId],
                });
            }
        }
    }

    public async onMessageUpdated(msg: Message): Promise<void> {
        const release = await this.messagesMutex.acquire();
        try {
            const existingMsg = this.messages.get(msg.sId);
            if (existingMsg) {
                existingMsg.update(msg);
            }
        } catch (e) {
            console.error(`Error processing updated messages from remote service: ${this.Id}`, e);
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
    public ackSendMessage: ((sId: string) => void) | undefined;
    public nackSendMessage: ((sId: string) => void) | undefined;
    public async send(
        chatId: string,
        senderId: string,
        type: Chat_MessageType_Enum,
        message: string,
        data: MessageData,
        isPinned: boolean
    ): Promise<void> {
        const release = await this.sendMutex.acquire();

        // CHAT_TODO
        // this.unreadCount = 0;
        // this.unreadCountObs.publish(0);

        this.isSending = true;
        this.isSendingObs.publish(this.isSending);
        try {
            const socket = await this.globalState.socket;
            assert(socket, "Not connected to chat service.");
            const sId = uuidv4();
            const newMsg: Message = {
                sId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                chatId,
                message,
                senderId,
                type,
                data,
                isPinned,
            };
            const action: Action<Message> = {
                op: "INSERT",
                data: newMsg,
            };
            socket.emit("chat.messages.send", action);
            const ackdSId = await new Promise<string>((resolve, reject) => {
                this.ackSendMessage = resolve;
                this.nackSendMessage = (nackSId) => {
                    if (nackSId === sId) {
                        reject("Send nack'd");
                    }
                };
            });
            assert(
                ackdSId === sId,
                `Message failed to send - ack received for wrong message: (ackd) ${ackdSId} !== ${sId} (expected)`
            );

            if (newMsg) {
                const release2 = await this.messagesMutex.acquire();
                const newMsgState = new MessageState(this.globalState, newMsg);
                try {
                    if (!this.messages.has(newMsg.sId)) {
                        this.messages.set(newMsg.sId, newMsgState);
                    }
                } finally {
                    release2();
                    this.messagesObs.publish({
                        op: "loaded_new",
                        messages: [newMsgState],
                    });
                }
                if (type === Chat_MessageType_Enum.Answer && newMsg) {
                    const answeringSIds = (data as AnswerMessageData).questionMessagesSIds;
                    if (answeringSIds && answeringSIds.length > 0) {
                        const answeringSId = answeringSIds[0];
                        const reactionData: AnswerReactionData = {
                            answerMessageSId: newMsg.sId,
                            duplicateAnswerMessageSId: newMsg.duplicatedMessageSId ?? undefined,
                        };
                        const targetMsg = this.messages.get(answeringSId);
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

    public async deleteMessage(messageSId: string): Promise<void> {
        const release = await this.messagesMutex.acquire();
        try {
            const socket = await this.globalState.socket;
            assert(socket, "Not connected to chat service.");

            const msg = this.messages.get(messageSId);
            if (msg) {
                const action: Action<Message> = {
                    op: "DELETE",
                    data: {
                        chatId: msg.chatId,
                        created_at: new Date(msg.created_at).toISOString(),
                        data: msg.data,
                        isPinned: false,
                        message: msg.message,
                        sId: msg.sId,
                        senderId: msg.senderId,
                        type: msg.type,
                        updated_at: new Date(msg.created_at).toISOString(),
                        duplicatedMessageSId: msg.duplicatedMessageSId,
                        systemId: undefined,
                    },
                };
                socket.emit("chat.messages.send", action);
                this.messagesObs.publish({
                    op: "deleted",
                    messageSIds: [messageSId],
                });
            }
        } catch (e) {
            console.error(`Error deleting message: ${this.Id} @ ${messageSId}`, e);
            throw e;
        } finally {
            release();
        }
    }

    // CHAT_TODO
    // private readUpToMsgId: number;
    // private readUpTo_ExistsInDb: boolean;
    // private readUpTo_Timeout: { id: number; firstTimestampMs: number } | undefined;
    // public get ReadUpToMsgId(): number {
    //     return this.readUpToMsgId;
    // }
    public setAllMessagesRead(_messageSId: string): void {
        // CHAT_TODO
        //     this.readUpToMsgId = Math.max(this.readUpToMsgId, messageId);
        //     this.latestNotifiedIndex = Math.max(messageId, this.latestNotifiedIndex);
        //     this.unreadCount = 0;
        //     this.unreadCountObs.publish(0);
        //     (async () => {
        //         const remoteChat = await this.remoteChat;
        //         await remoteChat?.setAllMessagesConsumed();
        //     })();
    }
    public async fetchReadUpToIdx(): Promise<void> {
        // CHAT_TODO
        //     const remoteChat = await this.remoteChat;
        //     const newCount = (await remoteChat?.getUnconsumedMessagesCount()) ?? 0;
        //     if (this.unreadCount !== newCount) {
        //         this.unreadCount = newCount;
        //         this.unreadCountObs.publish(this.unreadCount);
        //     }
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
    public openChatInSidebar: ((chatId: string) => void) | null = null;
    public showSidebar: (() => void) | null = null;

    public socket: Promise<SocketIOClient.Socket | null> | null = null;

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

    private readonly toast = createStandaloneToast();

    private mutex = new Mutex();
    private hasInitialised = false;
    private hasTorndown = false;
    private ongoingNotifications: (string | number)[] = [];
    public async init(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            if (!this.hasInitialised) {
                this.hasInitialised = true;
                if (!this.hasTorndown) {
                    this.socket = new Promise((resolve) => realtimeService.onSocketAvailable(resolve));

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

                    const socket = await this.socket;
                    if (!socket) {
                        throw new Error("No websocket connection to realtime/chat service!");
                    }

                    console.info("Remote service client configured.", initialData);

                    if (!this.chatStates) {
                        this.chatStates = new Map();
                    }
                    await Promise.all(
                        initialData.data.chat_Pin.map(async (item) => {
                            if (item.chat) {
                                const newState = new ChatState(this, item.chat);
                                await newState.fetchReadUpToIdx();
                                this.chatStates?.set(item.chat.id, newState);
                            }
                        })
                    );

                    this.chatStatesObs.publish(this.chatStates);

                    socket.on("notification", (notification: Notification) => {
                        // console.info("Notification", notification);

                        const openChatInSidebar = this.openChatInSidebar;
                        const showSidebar = this.showSidebar;

                        const notificationId = this.toast({
                            position: "top-right",
                            isClosable: true,
                            duration: 7000,
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
                                            {notification.title}
                                        </Heading>
                                        {notification.subtitle ? (
                                            <Heading
                                                textAlign="left"
                                                as="h3"
                                                fontSize="0.9rem"
                                                fontStyle="italic"
                                                maxW="250px"
                                                noOfLines={1}
                                            >
                                                {notification.subtitle}
                                            </Heading>
                                        ) : undefined}
                                        <Box maxW="250px" maxH="200px" overflow="hidden" noOfLines={10}>
                                            <Markdown restrictHeadingSize>{notification.description}</Markdown>
                                        </Box>
                                        <ButtonGroup isAttached>
                                            {openChatInSidebar && notification.chatId ? (
                                                <Button
                                                    colorScheme="green"
                                                    onClick={() => {
                                                        props.onClose();
                                                        if (notification.chatId) {
                                                            openChatInSidebar?.(notification.chatId);
                                                            showSidebar?.();
                                                        }
                                                    }}
                                                >
                                                    Go to chat
                                                </Button>
                                            ) : undefined}
                                            {notification.linkURL ? (
                                                <Button
                                                    colorScheme="blue"
                                                    onClick={() => {
                                                        props.onClose();
                                                        if (notification.linkURL) {
                                                            window.open(notification.linkURL, "_blank");
                                                        }
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
                        if (notificationId) {
                            let numPopped = 0;
                            while (this.ongoingNotifications.length - numPopped >= 3) {
                                this.toast.close(this.ongoingNotifications[numPopped]);

                                numPopped++;
                            }
                            this.ongoingNotifications = this.ongoingNotifications.slice(numPopped);
                            this.ongoingNotifications.push(notificationId);
                        }
                    });

                    socket.on("chat.subscribed", (chatId: string) => {
                        // console.info(`Chat subscribed: ${chatId}`);
                        const existing = this.chatStates?.get(chatId);
                        existing?.setIsSubscribed(true);
                    });
                    socket.on("chat.unsubscribed", (chatId: string) => {
                        // console.info(`Chat unsubscribed: ${chatId}`);
                        const existing = this.chatStates?.get(chatId);
                        existing?.setIsSubscribed(false);
                    });

                    socket.on("chat.pinned", async (chatId: string) => {
                        // console.info(`Chat pinned: ${chatId}`);
                        const existing = this.chatStates?.get(chatId);
                        if (existing) {
                            existing.setIsPinned(true);
                        } else {
                            try {
                                const newlyPinSubChats = await this.apolloClient.query<
                                    SelectInitialChatStatesQuery,
                                    SelectInitialChatStatesQueryVariables
                                >({
                                    query: SelectInitialChatStatesDocument,
                                    variables: {
                                        attendeeId: this.attendee.id,
                                        chatIds: [chatId],
                                    },
                                    fetchPolicy: "network-only",
                                });

                                const release = await this.mutex.acquire();
                                try {
                                    this.chatStates = this.chatStates ?? new Map();
                                    for (const pinSubChat of newlyPinSubChats.data.chat_Chat) {
                                        const newState = new ChatState(this, pinSubChat);
                                        await newState.fetchReadUpToIdx();
                                        this.chatStates.set(pinSubChat.id, newState);
                                    }
                                    this.chatStatesObs.publish(this.chatStates);
                                } finally {
                                    release();
                                }
                            } catch (e) {
                                console.error(`Error initialising newly pinned chat: ${chatId}`, e);
                            }
                        }
                    });
                    socket.on("chat.unpinned", (chatId: string) => {
                        // console.info(`Chat unpinned: ${chatId}`);
                        const existing = this.chatStates?.get(chatId);
                        existing?.setIsPinned(false);
                    });

                    socket.on("chat.messages.receive", (msg: Message) => {
                        // console.info("Chat message received", msg);
                        const existing = this.chatStates?.get(msg.chatId);
                        existing?.onMessageAdded(msg);
                    });
                    socket.on("chat.messages.update", (msg: Message) => {
                        // console.info("Chat message updated", msg);
                        const existing = this.chatStates?.get(msg.chatId);
                        existing?.onMessageUpdated(msg);
                    });
                    socket.on("chat.messages.delete", (msg: Message) => {
                        // console.info("Chat message deleted", msg);
                        const existing = this.chatStates?.get(msg.chatId);
                        existing?.onMessageRemoved(msg);
                    });

                    socket.on("chat.messages.send.ack", (messageSid: string) => {
                        console.info("Chat message send ack'd", messageSid);
                        if (this.chatStates) {
                            for (const existing of this.chatStates) {
                                existing[1].ackSendMessage?.(messageSid);
                            }
                        }
                    });
                    socket.on("chat.messages.send.nack", (messageSid: string) => {
                        console.info("Chat message send nack'd", messageSid);
                        if (this.chatStates) {
                            for (const existing of this.chatStates) {
                                existing[1].nackSendMessage?.(messageSid);
                            }
                        }
                    });

                    socket.on("chat.reactions.receive", (msg: Reaction) => {
                        console.info("Chat reaction received", msg);
                        // CHAT_TODO
                    });
                    socket.on("chat.reactions.update", (msg: Reaction) => {
                        console.info("Chat reaction updated", msg);
                        // CHAT_TODO
                    });
                    socket.on("chat.reactions.delete", (msg: Reaction) => {
                        console.info("Chat reaction deleted", msg);
                        // CHAT_TODO
                    });

                    socket.emit("chat.subscriptions.changed.on", this.attendee.id);
                    socket.emit("chat.pins.changed.on", this.attendee.id);

                    // TODO: Actions
                    //    - Chat: subscribe / unsubscribe
                    //    - Messages: send (remember ack/nack)
                    //    - Reactions: send
                }
            }
        } catch (e) {
            console.error("Failed to initialise chat state", e);
        } finally {
            release();
        }
    }

    public async teardown(): Promise<void> {
        const release = await this.mutex.acquire();

        try {
            if (!this.hasTorndown) {
                this.hasTorndown = true;
                if (this.hasInitialised) {
                    const socket = await this.socket;
                    if (socket) {
                        socket.emit("chat.subscriptions.changed.off", this.attendee.id);
                        socket.emit("chat.pins.changed.off", this.attendee.id);

                        socket.off("notification");

                        socket.off("chat.subscribed");
                        socket.off("chat.unsubscribed");

                        socket.off("chat.pinned");
                        socket.off("chat.unpinned");

                        socket.off("chat.messages.receive");
                        socket.off("chat.messages.update");
                        socket.off("chat.messages.delete");

                        socket.off("chat.messages.send.ack");
                        socket.off("chat.messages.send.nack");

                        socket.off("chat.reactions.receive");
                        socket.off("chat.reactions.update");
                        socket.off("chat.reactions.delete");
                    }

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
                        await newState.fetchReadUpToIdx();
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

    // CHAT_TODO
    // private unreadCountMutex = new Mutex();
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

    // CHAT_TODO
    // private reactionsSubscription_MessagesMutex = new Mutex();
    // private reactionsSubscription_SetupMutex = new Mutex();
    // private reactionsSubscription_Messages = new Map<number, MessageState>();
    // private reactionsSubscription: ZenObservable.Subscription | null = null;
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
