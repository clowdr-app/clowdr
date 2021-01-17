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
import React from "react";
import { HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { Route, RouteComponentProps } from "react-router-dom";
import IncognitoToggleButton from "../Users/CurrentUser/OnlineStatus/IncognitoToggleButton";
import MainMenuConferenceSections from "./MainMenuConferenceSections";
import { useMainMenu } from "./MainMenuState";

interface Props {
    isOpen: boolean;
    portalNode?: HtmlPortalNode<React.Component<any>>;
}

export default function MainMenuDrawer({ isOpen, portalNode }: Props): JSX.Element {
    const { onClose } = useMainMenu();

    const initialFocusRef = React.createRef<HTMLButtonElement>();

    return (
        <>
            <Drawer
                id="main-menu"
                placement="left"
                onClose={onClose}
                isOpen={isOpen}
                size="sm"
                initialFocusRef={initialFocusRef}
            >
                <DrawerOverlay>
                    <DrawerContent>
                        <DrawerHeader borderBottomWidth="1px">
                            <Flex direction="row" align="center">
                                <Heading as="h2" height="auto" fontSize="lg">
                                    Clowdr
                                </Heading>
                                <Spacer />
                                <IncognitoToggleButton />
                                <CloseButton ref={initialFocusRef} ml={2} onClick={onClose} title="Close main menu" />
                            </Flex>
                        </DrawerHeader>
                        <DrawerBody p="3px">
                            {portalNode ? (
                                <OutPortal node={portalNode} />
                            ) : (
                                <VStack align="stretch" spacing={0}>
                                    <Route
                                        path="/conference/:confSlug"
                                        component={(
                                            props: RouteComponentProps<{
                                                confSlug: string;
                                            }>
                                        ) => (
                                            <MainMenuConferenceSections
                                                rootUrl={props.match.url}
                                                confSlug={props.match.params.confSlug}
                                                onClose={onClose}
                                            />
                                        )}
                                    />
                                </VStack>
                            )}
                        </DrawerBody>
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
        </>
    );
}
