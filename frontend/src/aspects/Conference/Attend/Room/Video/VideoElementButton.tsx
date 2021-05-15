import { Button, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { defaultOutline_AsBoxShadow } from "../../../../Chakra/ChakraCustomProvider";
import { FAIcon } from "../../../../Icons/FAIcon";

export function VideoElementButton({
    elementName,
    isSelected,
    onClick,
}: {
    elementName: string;
    isSelected: boolean;
    onClick?: () => void;
}): JSX.Element {
    const bgColour = useColorModeValue("gray.800", "black");
    const activeBgColour = useColorModeValue("gray.700", "gray.800");

    return (
        <Button
            bgColor={bgColour}
            border={isSelected ? "1px solid white" : "none"}
            _hover={{}}
            _focus={{ boxShadow: defaultOutline_AsBoxShadow }}
            _active={{ bgColor: activeBgColour }}
            role="group"
            color="white"
            h="100%"
            w="100%"
            whiteSpace="normal"
            overflowWrap="anywhere"
            onClick={onClick}
        >
            <VStack p={4} py={6} spacing={4} w="100%" h="100%">
                <Text textAlign="center" w="100%" mb="auto">
                    {elementName}
                </Text>
                <FAIcon
                    iconStyle="s"
                    icon="play-circle"
                    fontSize="5xl"
                    color={isSelected ? "purple.500" : undefined}
                    _groupHover={{ color: "purple.500" }}
                    transition="color 0.3s ease-in-out"
                />
            </VStack>
        </Button>
    );
}
