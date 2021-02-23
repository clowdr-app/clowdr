import { Button, Code, HStack, StackProps, Text, Tooltip, useToast, VStack } from "@chakra-ui/react";
import React from "react";
import { Chat_ReactionType_Enum } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import { useEmojiPickerContext } from "./EmojiPickerProvider";
import { useReactions } from "./ReactionsProvider";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

export default function MessageControls({
    hideReactions,
    messageId,
    isOwnMessage,
    canEdit,
    canDelete,
    canFlag,
    isPollOpen,
    isPollIncomplete,
    usedReactions,
    ...props
}: StackProps & {
    messageId: number;
    isOwnMessage: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canFlag?: boolean;
    isPollOpen?: boolean;
    isPollIncomplete?: boolean;
    hideReactions: boolean;
    usedReactions: string[];
}): JSX.Element {
    const emojiPicker = useEmojiPickerContext();
    const reactions = useReactions();
    const messages = useReceiveMessageQueries();
    const toast = useToast();

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
                ? buttonF("Close poll to new votes", "vote-yea", "cyan.400", async () => {
                      await reactions.addReaction({
                          data: {},
                          messageId,
                          symbol: "<Poll Closed>",
                          type: Chat_ReactionType_Enum.PollClosed,
                      });
                      messages.refetch(messageId);
                  })
                : undefined}
            {(isOwnMessage || canEdit) && !isPollOpen && isPollIncomplete
                ? buttonF("Complete poll to reveal results", "poll", "cyan.400", async () => {
                      await reactions.addReaction({
                          data: {},
                          messageId,
                          symbol: "<Poll Complete>",
                          type: Chat_ReactionType_Enum.PollComplete,
                      });
                      messages.refetch(messageId);
                      // TODO: Publish results as a message
                  })
                : undefined}
            {!hideReactions
                ? buttonF("Add reaction", "grin", "yellow.400", () => {
                      emojiPicker.open(async (data) => {
                          const emoji = (data as any).native as string;
                          if (!usedReactions.includes(emoji)) {
                              await reactions.addReaction({
                                  data: {},
                                  messageId,
                                  symbol: emoji,
                                  type: Chat_ReactionType_Enum.Emoji,
                              });
                              messages.refetch(messageId);
                          }
                      });
                  })
                : undefined}
            {/* {isOwnMessage || canEdit
                ? buttonF("Edit message", "edit", "blue.400", () => {
                      alert("TODO"); // TODO
                  })
                : undefined} */}
            {isOwnMessage || canDelete
                ? buttonF("Delete message", "trash-alt", "red.400", async () => {
                      try {
                          messages.delete(messageId);
                          toast({
                              title: "Deleted",
                              status: "success",
                              duration: 10000,
                              isClosable: true,
                              description:
                                  "It may take a little while for the message to be removed from all user's views.",
                              position: "bottom-right",
                          });
                      } catch (e) {
                          toast({
                              title: "Failed to delete",
                              status: "error",
                              isClosable: true,
                              description: (
                                  <VStack alignItems="flex-start">
                                      <Text as="p">Please try again in a few minutes.</Text>
                                      <Text as="pre">
                                          <Code color="black">{e.message ?? e.toString()}</Code>
                                      </Text>
                                  </VStack>
                              ),
                              position: "bottom-right",
                          });
                      }
                  })
                : undefined}
            {!isOwnMessage && canFlag
                ? buttonF("Report message", "flag", "purple.400", () => {
                      alert("TODO"); // TODO
                  })
                : undefined}
        </HStack>
    );
}
