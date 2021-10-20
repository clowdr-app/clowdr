import type { ButtonProps, StackProps} from "@chakra-ui/react";
import { Button, ButtonGroup, useColorModeValue } from "@chakra-ui/react";
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
    const color = useColorModeValue(
        "MessageTypeSelectorButton.textColor-Selected-light",
        "MessageTypeSelectorButton.textColor-Selected-dark"
    );
    return (
        <Button
            minW="auto"
            minH="0"
            py={0}
            size="xs"
            borderRadius="2em"
            colorScheme="MessageTypeSelectorButton"
            color={shouldHighlight ? color : undefined}
            variant={shouldHighlight ? "solid" : "outline"}
            {...props}
        >
            <MessageTypeIndicator showName={true} messageType={messageType} color="inherit" />
        </Button>
    );
}

export function MessageTypeButtons({ isDisabled, ...props }: StackProps & { isDisabled?: boolean }): JSX.Element {
    const composeCtx = useComposeContext();
    const config = useChatConfiguration();

    return (
        <ButtonGroup
            spacing={config.spacing}
            pl={config.spacing}
            fontSize={config.fontSizeRange.value}
            justifyContent="center"
            alignItems="center"
            colorScheme="MessageTypeSelectorButton"
            pt={1}
            pb={2}
            {...props}
        >
            {config.permissions.canMessage ? (
                <MessageTypeButton
                    isDisabled={isDisabled}
                    messageType={Chat_MessageType_Enum.Message}
                    shouldHighlight={composeCtx.newMessageType === Chat_MessageType_Enum.Message}
                    aria-label="Compose an ordinary message"
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
                    aria-label="Compose a question"
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
                    aria-label="Compose a poll"
                    onClick={() => {
                        if (composeCtx.newMessageType !== Chat_MessageType_Enum.Poll) {
                            composeCtx.setNewMessageType(Chat_MessageType_Enum.Poll);
                        }
                    }}
                />
            ) : undefined}
        </ButtonGroup>
    );
}
