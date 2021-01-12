import type { BoxProps } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Permission_Enum } from "../../generated/graphql";
import RequireAtLeastOnePermissionWrapper from "../Conference/RequireAtLeastOnePermissionWrapper";
import { useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";
import { useRestorableState } from "../Generic/useRestorableState";
import { ChatConfiguration, ChatConfigurationProvider, ChatSources, ChatSpacing } from "./Configuration";
import { ChatFrame } from "./Frame/ChatFrame";
import ReflectionInfoModalProvider from "./ReflectionInfoModal";
import { SelectedChatProvider } from "./SelectedChat";
import type { EmoteMessageData } from "./Types/Messages";

export interface ChatProps {
    sources: ChatSources;

    onProfileModalOpened?: (attendeeId: string, close: () => void) => void;
    onEmoteReceived?: (emote: EmoteMessageData) => void;
}

export function Chat({ sources, onProfileModalOpened, onEmoteReceived, ...rest }: ChatProps & BoxProps): JSX.Element {
    const currentAttendee = useMaybeCurrentAttendee();
    const [spacing, setSpacing] = useRestorableState<ChatSpacing>(
        "clowdr-chatSpacing",
        ChatSpacing.COMFORTABLE,
        (x) => x.toString(),
        (x) => parseInt(x, 10) as ChatSpacing
    );
    const [fontSize, setFontSize] = useRestorableState<number>(
        "clowdr-chatFontSize",
        16,
        (x) => x.toString(),
        (x) => parseInt(x, 10) as ChatSpacing
    );
    const fontSizeMin = 10;
    const fontSizeMax = 28;
    const config = useMemo<ChatConfiguration>(
        () => ({
            sources,
            fontSizeRange: {
                min: fontSizeMin,
                max: fontSizeMax,
                value: fontSize,
            },
            useTypingIndicators: true,
            permissions: {
                // TODO: Disable certain permissions for announcements channel
                // TODO: Disable certain permissions for during broadcast
                // TODO: Enable certain permissions only if creator or admin

                canMessage: true, // TODO
                canEmote: true, // TODO
                canReact: true, // TODO
                canQuestion: true, // TODO
                canAnswer: true, // TODO
                canPoll: true, // TODO
                canAnswerPoll: true, // TODO

                canPin: true,
                canUnpin: true,

                canSubscribe: true,
                canUnsubscribe: true,

                canEditMessage: false, // TODO
                canEditEmote: false, // TODO
                canEditReaction: false, // TODO
                canEditQuestion: false, // TODO
                canEditAnswer: false, // TODO
                canEditPoll: false, // TODO

                canDeleteMessage: true, // TODO
                canDeleteEmote: true, // TODO
                canDeleteReaction: true, // TODO
                canDeleteQuestion: true, // TODO
                canDeleteAnswer: true, // TODO
                canDeletePoll: true, // TODO

                canFlag: false, // TODO
            },
            messageConfig: {
                length: {
                    min: 1,
                    max: 1120,
                },
                sendCooloffPeriodMs: 3000,
                editTimeoutSeconds: 60, // Allow 60s to start editing a sent message before locking out
                showProfilePictures: true,
                showPlaceholderProfilePictures: true,
                enableProfileModal: true,
            },
            emoteConfig: {
                sendCooloffPeriodMs: 20000,
                editTimeoutSeconds: 0, // Once an emote is sent, don't allow it to be edited
            },
            reactionConfig: {
                maxPerMessage: 3, // Max. 3 reactions per user per message
                sendCooloffPeriodMs: 0,
                editTimeoutSeconds: undefined, // Always permit retraction of reactions
                highlightNew: true, // Highlight new reactions for user's sent messages
            },
            questionConfig: {
                length: {
                    min: 10,
                    max: 1120,
                },
                sendCooloffPeriodMs: 30000,
                editTimeoutSeconds: 30, // Allow 30s to start editing a sent message before locking out
            },
            answerConfig: {
                length: {
                    min: 2,
                    max: 1120,
                },
                sendCooloffPeriodMs: 0,
                editTimeoutSeconds: 0, // Do not allow editing of answers
            },
            pollConfig: {
                sendCooloffPeriodMs: 60000,
                editTimeoutSeconds: 60, // Allow 60s to start editing a sent message before locking out
                questionLength: {
                    min: 10,
                    max: 240,
                },
                numberOfAnswers: {
                    min: 1,
                    max: 10,
                },
                answerLength: {
                    min: 1,
                    max: 20,
                },
            },
            currentAttendeeId: currentAttendee?.id,
            spacing,
            setSpacing,
            setFontSize: (next) =>
                setFontSize((old) =>
                    Math.min(fontSizeMax, Math.max(fontSizeMin, typeof next === "function" ? next(old) : next))
                ),
            messageBatchSize: 30,
            messageLiveBatchSize: 30,
            onProfileModalOpened,
            onEmoteReceived,
        }),
        [
            currentAttendee?.id,
            fontSize,
            onEmoteReceived,
            onProfileModalOpened,
            setFontSize,
            setSpacing,
            sources,
            spacing,
        ]
    );

    return (
        <RequireAtLeastOnePermissionWrapper permissions={[Permission_Enum.ConferenceViewAttendees]}>
            <ReflectionInfoModalProvider>
                <ChatConfigurationProvider config={config}>
                    <SelectedChatProvider>
                        <ChatFrame {...rest} />
                    </SelectedChatProvider>
                </ChatConfigurationProvider>
            </ReflectionInfoModalProvider>
        </RequireAtLeastOnePermissionWrapper>
    );
}
