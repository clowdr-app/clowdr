import type { StackProps } from "@chakra-ui/react";
import { Button, Code, HStack, Text, Tooltip, useColorModeValue, useToast, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Chat_MessageType_Enum, Chat_ReactionType_Enum } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import type { MessageState } from "../ChatGlobalState";
import { useChatConfiguration } from "../Configuration";
import { useEmojiPicker } from "../EmojiPickerProvider";
import { useReportMessage } from "../Moderation/ReportMessageDialog";

export default function MessageControls({
    hideReactions,
    message,
    isOwnMessage,
    isPollOpen,
    isPollIncomplete,
    usedReactions,
    ...props
}: StackProps & {
    message: MessageState;
    isOwnMessage: boolean;
    isPollOpen?: boolean;
    isPollIncomplete?: boolean;
    hideReactions: boolean;
    usedReactions: string[];
}): JSX.Element {
    const emojiPicker = useEmojiPicker();
    const toast = useToast();
    const report = useReportMessage();
    const config = useChatConfiguration();

    function buttonF(label: string, icon: string, colour: string, onClick: () => void) {
        return (
            <Tooltip label={label}>
                <Button
                    fontSize="130%"
                    lineHeight="inherit"
                    background="none"
                    minW="0"
                    minH="0"
                    w="auto"
                    h="auto"
                    m={0}
                    p={0}
                    textAlign="center"
                    aria-label={label}
                    color={colour}
                    opacity={0.6}
                    _hover={{ opacity: 1 }}
                    _focus={{ opacity: 1 }}
                    _active={{ opacity: 1 }}
                    onClick={onClick}
                >
                    <FAIcon iconStyle="s" icon={icon} />
                </Button>
            </Tooltip>
        );
    }

    const canEdit = useMemo(() => {
        switch (message.type) {
            case Chat_MessageType_Enum.Answer:
                return config.permissions.canEditAnswer;
            case Chat_MessageType_Enum.DuplicationMarker:
                return false;
            case Chat_MessageType_Enum.Emote:
                return config.permissions.canEditEmote;
            case Chat_MessageType_Enum.Message:
                return config.permissions.canEditMessage;
            case Chat_MessageType_Enum.Poll:
                return config.permissions.canEditPoll;
            case Chat_MessageType_Enum.PollResults:
                return false;
            case Chat_MessageType_Enum.Question:
                return config.permissions.canEditQuestion;
            case Chat_MessageType_Enum.EventStart:
                return false;
            case Chat_MessageType_Enum.ParticipationSurvey:
                return false;
        }
    }, [
        config.permissions.canEditAnswer,
        config.permissions.canEditEmote,
        config.permissions.canEditMessage,
        config.permissions.canEditPoll,
        config.permissions.canEditQuestion,
        message.type,
    ]);

    const canDelete = useMemo(() => {
        switch (message.type) {
            case Chat_MessageType_Enum.Answer:
                return config.permissions.canDeleteAnswer;
            case Chat_MessageType_Enum.DuplicationMarker:
                return false;
            case Chat_MessageType_Enum.Emote:
                return config.permissions.canDeleteEmote;
            case Chat_MessageType_Enum.Message:
                return config.permissions.canDeleteMessage;
            case Chat_MessageType_Enum.Poll:
                return config.permissions.canDeletePoll;
            case Chat_MessageType_Enum.PollResults:
                return false;
            case Chat_MessageType_Enum.Question:
                return config.permissions.canDeleteQuestion;
            case Chat_MessageType_Enum.EventStart:
                return false;
            case Chat_MessageType_Enum.ParticipationSurvey:
                return false;
        }
    }, [
        config.permissions.canDeleteAnswer,
        config.permissions.canDeleteEmote,
        config.permissions.canDeleteMessage,
        config.permissions.canDeletePoll,
        config.permissions.canDeleteQuestion,
        message.type,
    ]);

    const failed_BgColor = useColorModeValue("ChatError.backgroundColor-light", "ChatError.backgroundColor-dark");
    const failed_TextColor = useColorModeValue("ChatError.textColor-light", "ChatError.textColor-dark");
    return (
        <HStack
            w="50%"
            m={0}
            p={0}
            justifyContent="flex-end"
            transition="opacity 0.2s ease-in-out"
            {...props}
            opacity={0.8}
            _hover={{
                opacity: 1,
            }}
            _focusWithin={{
                opacity: 1,
            }}
        >
            {(isOwnMessage || canEdit) && isPollOpen
                ? buttonF("Close poll to new votes", "vote-yea", "ChatManagePollButton.color", async () => {
                      await message.addReaction({
                          data: {},
                          symbol: "<Poll Closed>",
                          type: Chat_ReactionType_Enum.PollClosed,
                      });
                  })
                : undefined}
            {(isOwnMessage || canEdit) && !isPollOpen && isPollIncomplete
                ? buttonF("Complete poll to reveal results", "poll", "ChatManagePollButton.color", async () => {
                      await message.addReaction({
                          data: {},
                          symbol: "<Poll Complete>",
                          type: Chat_ReactionType_Enum.PollComplete,
                      });
                      // TODO: Publish results as a message
                  })
                : undefined}
            {!hideReactions
                ? buttonF("Add reaction", "grin", "ChatAddReactionButton.color", () => {
                      emojiPicker.open(async (data) => {
                          const emoji = (data as any).native as string;
                          if (!usedReactions.includes(emoji)) {
                              await message.addReaction({
                                  data: {},
                                  symbol: emoji,
                                  type: Chat_ReactionType_Enum.Emoji,
                              });
                          }
                      });
                  })
                : undefined}
            {/* {isOwnMessage || canEdit
                ? buttonF("Edit message", "edit", "ChatEditMessageButton.color", () => {
                      alert("TODO"); // TODO
                  })
                : undefined} */}
            {isOwnMessage || canDelete
                ? buttonF("Delete message", "trash-alt", "DestructiveActionButton.400", async () => {
                      try {
                          await message.delete();
                          toast({
                              title: "Deleted",
                              status: "success",
                              duration: 1000,
                              isClosable: true,
                              position: "bottom-right",
                          });
                      } catch (e: any) {
                          toast({
                              title: "Failed to delete",
                              status: "error",
                              isClosable: true,
                              description: (
                                  <VStack alignItems="flex-start">
                                      <Text as="p">Please try again in a few minutes.</Text>
                                      <Text as="pre" bgColor={failed_BgColor}>
                                          <Code color={failed_TextColor}>{e.message ?? e.toString()}</Code>
                                      </Text>
                                  </VStack>
                              ),
                              position: "bottom-right",
                          });
                      }
                  })
                : undefined}
            {!isOwnMessage && config.permissions.canFlag
                ? buttonF("Report message", "flag", "red.400", () => {
                      report.open((info) => {
                          if (info) {
                              message.report(info.type, info.reason);
                          }
                      });
                  })
                : undefined}
        </HStack>
    );
}
