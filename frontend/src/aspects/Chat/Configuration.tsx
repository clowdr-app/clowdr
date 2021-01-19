import React, { Dispatch, SetStateAction } from "react";
import type { Maybe, MinMax, MinMaxWithValue } from "./Types/Base";
import type { EmoteMessageData } from "./Types/Messages";

export enum ChatSpacing {
    COMPACT = 1,
    COMFORTABLE = 2,
    RELAXED = 4,
}

export type ChatSources =
    | {
          chatId: string;
          chatLabel: string;
          chatTitle: string;
      }
    | {
          chatIdL: string;
          chatLabelL: string;
          chatTitleL: string;
          chatIdR: string;
          chatLabelR: string;
          chatTitleR: string;
          defaultSelected: "L" | "R";
      };

export interface ChatPermissions {
    canMessage: boolean;
    canEmote: boolean; // TODO
    canReact: boolean; // TODO
    canQuestion: boolean;
    canAnswer: boolean;
    canPoll: boolean;
    canAnswerPoll: boolean; // TODO
    canPin: boolean;
    canUnpin: boolean;
    canSubscribe: boolean;
    canUnsubscribe: boolean;
    canEditMessage: boolean; // TODO
    canEditEmote: boolean; // TODO
    canEditReaction: boolean; // TODO
    canEditQuestion: boolean; // TODO
    canEditAnswer: boolean; // TODO
    canEditPoll: boolean; // TODO
    canDeleteMessage: boolean; // TODO
    canDeleteEmote: boolean; // TODO
    canDeleteReaction: boolean; // TODO
    canDeleteQuestion: boolean; // TODO
    canDeleteAnswer: boolean; // TODO
    canDeletePoll: boolean; // TODO
    canFlag: boolean; // TODO
}

export interface ChatMessageConfiguration {
    length: Maybe<MinMax>;
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
    showProfilePictures: boolean; // TODO
    showPlaceholderProfilePictures: boolean; // TODO
    enableProfileModal: boolean; // TODO
}

export interface ChatEmoteConfiguration {
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
}

export interface ChatReactionConfiguration {
    maxPerMessage: Maybe<number>; // TODO
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
    highlightNew: Maybe<boolean>; // TODO
}

export interface ChatQuestionConfiguration {
    length: Maybe<MinMax>;
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
}

export interface ChatAnswerConfiguration {
    length: Maybe<MinMax>;
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
}

export interface ChatPollConfiguration {
    sendCooloffPeriodMs: Maybe<number>;
    editTimeoutSeconds: Maybe<number>; // TODO
    questionLength: Maybe<MinMax>;
    numberOfAnswers: Maybe<MinMax>;
    answerLength: Maybe<MinMax>;
}

export interface ChatConfiguration {
    sources: ChatSources;
    useTypingIndicators: Maybe<boolean>; // TODO
    permissions: ChatPermissions; // TODO
    messageConfig: ChatMessageConfiguration; // TODO
    emoteConfig: ChatEmoteConfiguration; // TODO
    reactionConfig: ChatReactionConfiguration; // TODO
    questionConfig: ChatQuestionConfiguration; // TODO
    answerConfig: ChatAnswerConfiguration; // TODO
    pollConfig: ChatPollConfiguration; // TODO

    currentAttendeeId: Maybe<string>;
    currentAttendeeName: Maybe<string>;

    fontSizeRange: MinMaxWithValue;
    setFontSize: Dispatch<SetStateAction<number>>;

    spacing: ChatSpacing;
    setSpacing: Dispatch<SetStateAction<ChatSpacing>>;

    messageBatchSize: number | undefined;
    messageLiveBatchSize: number | undefined;

    onProfileModalOpened: Maybe<(attendeeId: string, close: () => void) => void>; // TODO
    onEmoteReceived: Maybe<(emote: EmoteMessageData) => void>; // TODO
}

const ConfigurationContext = React.createContext<ChatConfiguration | undefined>(undefined);

export function findSpacing(name: string): ChatSpacing | undefined {
    const keys = Object.keys(ChatSpacing);
    for (const key of keys) {
        const keyV = parseInt(key, 10);
        if (name === ChatSpacing[keyV]) {
            return keyV;
        }
    }
    return undefined;
}

/**
 * Utilises a ref and "deep copying" to maintain a stable reference for the
 * config context object while ensuring updates to the config are propagated
 * down the stack with minimal impact.
 */
export function ChatConfigurationProvider({
    children,
    config,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    config: ChatConfiguration;
}): JSX.Element {
    // TODO: Is this actually useful?
    // const ref = useRef<ChatConfiguration>(deepClone(config));

    // useEffect(() => {
    //     deepCopyChatConfiguration(config, ref.current);
    // }, [config]);

    return <ConfigurationContext.Provider value={config}>{children}</ConfigurationContext.Provider>;
}

export function useChatConfiguration(): ChatConfiguration {
    const ctx = React.useContext(ConfigurationContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
