import {
    CloseButton,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    Heading,
    Spacer,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback } from "react";
import IncognitoToggleButton from "../Users/CurrentUser/OnlineStatus/IncognitoToggleButton";
import { useMainMenu } from "./MainMenuState";

interface Props {
    isOpen: boolean;
}

export default function MainMenuDrawer({ isOpen }: Props): JSX.Element {
    const { onClose } = useMainMenu();

    const menuItemClicked = useCallback(() => onClose(), [onClose]);

    return (
        <Drawer id="main-menu" placement="left" onClose={onClose} isOpen={isOpen} size="sm">
            <DrawerOverlay>
                <DrawerContent>
                    <DrawerHeader borderBottomWidth="1px">
                        <Flex direction="row" align="center">
                            <Heading as="h2" height="auto" fontSize="lg">
                                Clowdr
                            </Heading>
                            <Spacer />
                            <IncognitoToggleButton />
                            <CloseButton ml={2} onClick={onClose} title="Close main menu" />
                        </Flex>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack align="stretch" spacing={0}></VStack>
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}
