import { Button, ButtonProps, HStack, StackProps } from "@chakra-ui/react";
import React from "react";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import { useComposeContext } from "./ComposeContext";
import { MessageTypeIndicator } from "./MessageTypeIndicator";

function MessageTypeButton({
    messageType,
    shouldHighlight,
    ...props
}: ButtonProps & { messageType: Chat_MessageType_Enum; shouldHighlight: boolean }): JSX.Element {
    const highlightColour = "green.400";

    return (
        <Button minW="auto" minH="auto" w="auto" h="auto" p={0} m={0} background="none" borderRadius={0} {...props}>
            <MessageTypeIndicator color={shouldHighlight ? highlightColour : undefined} messageType={messageType} />
        </Button>
    );
}

export function MessageTypeButtons({ isDisabled, ...props }: StackProps & { isDisabled?: boolean }): JSX.Element {
    const composeCtx = useComposeContext();
    const config = useChatConfiguration();

    return (
        <HStack
            spacing={config.spacing}
            pl={config.spacing}
            fontSize={config.fontSizeRange.value}
            justifyContent="flex-start"
            alignItems="center"
            {...props}
        >
            {config.permissions.canMessage ? (
                <MessageTypeButton
                    isDisabled={isDisabled}
                    messageType={Chat_MessageType_Enum.Message}
                    shouldHighlight={composeCtx.newMessageType === Chat_MessageType_Enum.Message}
                    fontSize="inherit"
                    onClick={() => {
                        if (composeCtx.newMessageType !== Chat_MessageType_Enum.Message) {
                            composeCtx.setNewMessageType(Chat_MessageType_Enum.Message);
                        }
                    }}
                />
            ) : undefined}
            {config.permissions.canQuestion ? (
                <MessageTypeButton
                    isDisabled={isDisabled}
                    messageType={Chat_MessageType_Enum.Question}
                    shouldHighlight={composeCtx.newMessageType === Chat_MessageType_Enum.Question}
                    fontSize="inherit"
                    onClick={() => {
                        if (composeCtx.newMessageType !== Chat_MessageType_Enum.Question) {
                            composeCtx.setNewMessageType(Chat_MessageType_Enum.Question);
                        }
                    }}
                />
            ) : undefined}
            {/* {config.permissions.canAnswer ? (
                <MessageTypeButton
                    isDisabled={isDisabled}
                    messageType={Chat_MessageType_Enum.Answer}
                    shouldHighlight={composeCtx.newMessageType === Chat_MessageType_Enum.Answer}
                    fontSize="inherit"
                    onClick={() => {
                        if (composeCtx.newMessageType !== Chat_MessageType_Enum.Answer) {
                            composeCtx.setNewMessageType(Chat_MessageType_Enum.Answer);
                        }
                    }}
                />
            ) : undefined} */}
            {config.permissions.canPoll ? (
                <MessageTypeButton
                    isDisabled={isDisabled}
                    messageType={Chat_MessageType_Enum.Poll}
                    shouldHighlight={composeCtx.newMessageType === Chat_MessageType_Enum.Poll}
                    fontSize="inherit"
                    onClick={() => {
                        if (composeCtx.newMessageType !== Chat_MessageType_Enum.Poll) {
                            composeCtx.setNewMessageType(Chat_MessageType_Enum.Poll);
                        }
                    }}
                />
            ) : undefined}
        </HStack>
    );
}
