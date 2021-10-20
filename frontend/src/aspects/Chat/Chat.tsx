import type { BoxProps } from "@chakra-ui/react";
import type { RefObject} from "react";
import React, { useMemo } from "react";
import { Permissions_Permission_Enum } from "../../generated/graphql";
import RequireAtLeastOnePermissionWrapper from "../Conference/RequireAtLeastOnePermissionWrapper";
import { useConferenceCurrentUserActivePermissions } from "../Conference/useConferenceCurrentUserActivePermissions";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { useRestorableState } from "../Generic/useRestorableState";
import type { ChatState } from "./ChatGlobalState";
import type { ChatConfiguration} from "./Configuration";
import { ChatConfigurationProvider, ChatSpacing } from "./Configuration";
import { ChatFrame } from "./Frame/ChatFrame";
import type { EmoteMessageData } from "./Types/Messages";

export interface ChatProps {
    customHeadingElements?: React.ReactNodeArray;
    chat: ChatState;
    isVisible: RefObject<boolean>;

    onProfileModalOpened?: (registrantId: string, close: () => void) => void;
    onEmoteReceived?: (emote: EmoteMessageData) => void;
}

export function Chat({
    customHeadingElements,
    chat,
    onProfileModalOpened,
    onEmoteReceived,
    ...rest
}: ChatProps & BoxProps): JSX.Element {
    const currentRegistrant = useMaybeCurrentRegistrant();
    const currentPermissions = useConferenceCurrentUserActivePermissions();
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
    // TODO: This is a temporary hack
    const canCompose =
        chat.Name !== "Announcements" ||
        currentPermissions.has(Permissions_Permission_Enum.ConferenceManageAttendees) ||
        currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees) ||
        currentPermissions.has(Permissions_Permission_Enum.ConferenceManageSchedule);
    const config = useMemo<ChatConfiguration>(
        () => ({
            customHeadingElements,

            state: chat,
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

                canMessage: canCompose, // TODO
                canEmote: canCompose, // TODO
                canReact: canCompose, // TODO
                canQuestion: canCompose, // TODO
                canAnswer: canCompose, // TODO
                canPoll: canCompose, // TODO
                canAnswerPoll: canCompose, // TODO

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

                canDeleteMessage: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),
                canDeleteEmote: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),
                canDeleteReaction: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),
                canDeleteQuestion: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),
                canDeleteAnswer: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),
                canDeletePoll: currentPermissions.has(Permissions_Permission_Enum.ConferenceModerateAttendees),

                canFlag: true,
            },
            messageConfig: {
                length: {
                    min: 1,
                    max: 1120,
                },
                sendCooloffPeriodMs: 0,
                editTimeoutSeconds: 60, // Allow 60s to start editing a sent message before locking out
                showProfilePictures: true,
                showPlaceholderProfilePictures: true,
                enableProfileModal: true,
            },
            emoteConfig: {
                sendCooloffPeriodMs: 3000,
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
                sendCooloffPeriodMs: 5000,
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
                sendCooloffPeriodMs: 10000,
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
            currentRegistrantId: currentRegistrant?.id,
            currentRegistrantName: currentRegistrant?.displayName,
            spacing,
            setSpacing,
            setFontSize: (next) =>
                setFontSize((old) =>
                    Math.min(fontSizeMax, Math.max(fontSizeMin, typeof next === "function" ? next(old) : next))
                ),
            messageBatchSize: 30,
            onProfileModalOpened,
            onEmoteReceived,
        }),
        [
            canCompose,
            chat,
            currentRegistrant?.displayName,
            currentRegistrant?.id,
            customHeadingElements,
            fontSize,
            onEmoteReceived,
            onProfileModalOpened,
            setFontSize,
            setSpacing,
            spacing,
            currentPermissions,
        ]
    );

    return (
        <RequireAtLeastOnePermissionWrapper permissions={[Permissions_Permission_Enum.ConferenceViewAttendees]}>
            {/* <ReflectionInfoModalProvider> */}
            <ChatConfigurationProvider config={config}>
                <ChatFrame {...rest} />
            </ChatConfigurationProvider>
            {/* </ReflectionInfoModalProvider> */}
        </RequireAtLeastOnePermissionWrapper>
    );
}
