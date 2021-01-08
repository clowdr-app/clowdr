import { Button, ButtonProps, chakra, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Icons/FAIcon";
import { useChatConfiguration } from "../Configuration";
import { useSelectedChat } from "../SelectedChat";

export function SelectChatButton({
    chatSide,
    label,
    ...rest
}: { chatSide?: "L" | "R"; label: string } & ButtonProps): JSX.Element {
    const config = useChatConfiguration();
    const selectedChat = useSelectedChat();
    const isSelected = selectedChat.selectedSide === chatSide;

    const selectedBgColour = useColorModeValue("blue.400", "blue.400");
    const notSelectedBgColour = useColorModeValue("blue.600", "blue.200");

    const contents = (() => (
        <>
            {isSelected && chatSide === "L" ? (
                <FAIcon
                    display="inline-block"
                    iconStyle="r"
                    icon="dot-circle"
                    mr={config.spacing}
                    pos="absolute"
                    top="50%"
                    transform="translateY(-50%)"
                    left={1 + config.spacing}
                    p={0}
                    m={0}
                />
            ) : undefined}
            <chakra.span>{label}</chakra.span>
            {isSelected && chatSide === "R" ? (
                <FAIcon
                    display="inline-block"
                    iconStyle="r"
                    icon="dot-circle"
                    ml={config.spacing}
                    pos="absolute"
                    top="50%"
                    transform="translateY(-50%)"
                    right={1 + config.spacing}
                    p={0}
                    m={0}
                />
            ) : undefined}
        </>
    ))();

    return !chatSide ? (
        <Button
            fontSize={config.fontSizeRange.value}
            onClick={
                chatSide
                    ? () => {
                          selectedChat.setSelectedSide(chatSide);
                      }
                    : undefined
            }
            colorScheme="blue"
            backgroundColor={isSelected ? selectedBgColour : notSelectedBgColour}
            pos="relative"
            h="auto"
            p={config.spacing}
            {...rest}
            _disabled={{}}
            _hover={{}}
            _active={{}}
            _focus={{}}
            tabIndex={-1}
            cursor="unset"
        >
            {contents}
        </Button>
    ) : (
        <Button
            fontSize={config.fontSizeRange.value}
            onClick={
                chatSide
                    ? () => {
                          selectedChat.setSelectedSide(chatSide);
                      }
                    : undefined
            }
            colorScheme="blue"
            backgroundColor={isSelected ? selectedBgColour : notSelectedBgColour}
            pos="relative"
            h="auto"
            p={config.spacing}
            {...rest}
        >
            {contents}
        </Button>
    );
}
