import { Box, BoxProps, ButtonGroup } from "@chakra-ui/react";
import React from "react";
import { SelectChatButton } from "../Compose/SelectChatButton";
import { useChatConfiguration } from "../Configuration";
import { useSelectedChat } from "../SelectedChat";

export function ChatSelector({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const selectedChat = useSelectedChat();

    return (
        <Box pt={config.spacing} {...rest}>
            <ButtonGroup w="100%" isAttached>
                {"chatId" in config.sources ? (
                    <SelectChatButton flex="0 0 100%" borderBottomRadius={0} label={selectedChat.label} />
                ) : (
                    <>
                        <SelectChatButton
                            flex="0 0 50%"
                            chatSide="L"
                            borderBottomRadius={0}
                            label={config.sources.chatLabelL}
                        />
                        <SelectChatButton
                            flex="0 0 50%"
                            chatSide="R"
                            borderBottomRadius={0}
                            label={config.sources.chatLabelR}
                        />
                    </>
                )}
            </ButtonGroup>
        </Box>
    );
}
