import type { ButtonProps} from "@chakra-ui/react";
import { useColorModeValue, useDisclosure } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../../Icons/FAIcon";
import { useChatConfiguration } from "../../Configuration";
import { useComposeContext } from "../ComposeContext";
import SendLockoutButton from "../SendLockoutButton";
import CreatePollOptionsModal from "./CreatePollOptionsModal";

export function CreatePollOptionsButton({
    onOpenRef,
    sendFailed,
    ...props
}: ButtonProps & {
    onOpenRef: React.RefObject<{
        onOpen: () => void;
    }>;
    sendFailed: boolean;
}): JSX.Element {
    const colour = useColorModeValue("ChatSendMessageButton.color-light", "ChatSendMessageButton.color-dark");
    const focusColour = useColorModeValue(
        "ChatSendMessageButton.focusColor-light",
        "ChatSendMessageButton.focusColor-dark"
    );
    const activeColour = useColorModeValue(
        "ChatSendMessageButton.activeColor-light",
        "ChatSendMessageButton.activeColor-dark"
    );

    const config = useChatConfiguration();
    const compose = useComposeContext();
    const { isOpen, onOpen, onClose } = useDisclosure();
    if (onOpenRef.current) {
        onOpenRef.current.onOpen = onOpen;
    }

    return (
        <>
            <SendLockoutButton
                sendFailed={sendFailed}
                aria-label="Create poll choices"
                color={colour}
                p={config.spacing}
                background="none"
                fontSize={config.fontSizeRange.value}
                {...props}
                onClick={onOpen}
            >
                <FAIcon
                    _focus={{
                        color: focusColour,
                    }}
                    _hover={{
                        color: focusColour,
                    }}
                    _active={{
                        color: activeColour,
                    }}
                    iconStyle="s"
                    icon="list"
                    transition="all 0.5s ease-in"
                />
            </SendLockoutButton>
            <CreatePollOptionsModal
                sendFailed={sendFailed}
                initialData={compose.newMessageData}
                isOpen={isOpen}
                onCancel={onClose}
                onSend={(opts) => {
                    compose.setNewMessageData(opts);
                    compose.send(opts);
                    onClose();
                }}
            />
        </>
    );
}
