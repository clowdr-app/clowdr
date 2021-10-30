import {
    Button,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { useCallback, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import FAIcon from "../../../../Icons/FAIcon";
import { ShuffleWaiting } from "../../../../ShuffleRooms/WaitingPage";
import { AllRegistrantsList } from "../../Registrant/RegistrantListPage";
import { CreateRoomModal } from "../../Room/CreateRoomModal";
import ActiveSocialRooms from "./ActiveSocialRooms";
import InactiveSocialRooms from "./InactiveSocialRooms";
import { SocialiseModalTab } from "./SocialiseModalProvider";

export default function SocialiseModal({
    isOpen,
    onClose,
    finalFocusRef,
    selectedTab,
    setSelectedTab,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
    selectedTab: SocialiseModalTab;
    setSelectedTab: (tab: SocialiseModalTab) => void;
}): JSX.Element {
    const { isOpen: createRoom_IsOpen, onClose: createRoom_OnClose, onOpen: createRoom_OnOpen } = useDisclosure();
    const { conferencePath } = useAuthParameters();

    const history = useHistory();
    const refetch = useCallback(
        async (id, cb) => {
            // Wait, because Vonage session creation is not instantaneous
            setTimeout(() => {
                cb();
                history.push(`${conferencePath}/room/${id}`);
            }, 2000);
        },
        [conferencePath, history]
    );

    const closeRef = useRef<HTMLButtonElement | null>(null);

    const selectedTabIndex = useMemo(() => {
        switch (selectedTab) {
            case SocialiseModalTab.Rooms:
                return 0;
            case SocialiseModalTab.People:
                return 1;
            case SocialiseModalTab.Networking:
                return 2;
        }
    }, [selectedTab]);

    const setSelectedTabFromIndex = useCallback(
        (index: number) => {
            switch (index) {
                case 0:
                    setSelectedTab(SocialiseModalTab.Rooms);
                    break;
                case 1:
                    setSelectedTab(SocialiseModalTab.People);
                    break;
                case 2:
                    setSelectedTab(SocialiseModalTab.Networking);
                    break;
            }
        },
        [setSelectedTab]
    );

    return (
        <>
            <CreateRoomModal isOpen={createRoom_IsOpen} onClose={createRoom_OnClose} onCreated={refetch} />
            <Modal
                initialFocusRef={closeRef}
                finalFocusRef={finalFocusRef}
                size="6xl"
                isCentered
                autoFocus={false}
                returnFocusOnClose={false}
                trapFocus={true}
                scrollBehavior="inside"
                isOpen={isOpen}
                onClose={onClose}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalCloseButton ref={closeRef} />
                    <ModalBody display="flex" justifyContent="center" overflow="hidden">
                        <Tabs
                            variant="enclosed-colored"
                            colorScheme="PrimaryActionButton"
                            isLazy
                            h="auto"
                            w="100%"
                            overflow="hidden"
                            display="flex"
                            flexDir="column"
                            index={selectedTabIndex}
                            onChange={setSelectedTabFromIndex}
                        >
                            <TabList justifyContent="center">
                                <Tab>
                                    <FAIcon iconStyle="s" icon="mug-hot" aria-hidden />
                                    &nbsp;&nbsp;Rooms
                                </Tab>
                                <Tab overflow="hidden">
                                    <FAIcon iconStyle="s" icon="users" aria-hidden />
                                    &nbsp;&nbsp;People
                                </Tab>
                                <Tab overflow="auto">
                                    <FAIcon iconStyle="s" icon="random" aria-hidden />
                                    &nbsp;&nbsp;Networking
                                </Tab>
                            </TabList>
                            <TabPanels overflow="hidden">
                                <TabPanel h="100%" overflow="auto">
                                    <ActiveSocialRooms excludeLiveEventRooms />
                                    <InactiveSocialRooms />
                                    <Flex mt={4} justifyContent="center">
                                        <Button onClick={createRoom_OnOpen} colorScheme="PrimaryActionButton">
                                            Create new room
                                        </Button>
                                    </Flex>
                                </TabPanel>
                                <TabPanel h="100%" overflow="hidden">
                                    <VStack spacing={4} h="100%" overflow="hidden">
                                        <AllRegistrantsList />
                                    </VStack>
                                </TabPanel>
                                <TabPanel h="100%" overflow="auto">
                                    <VStack spacing={4}>
                                        <ShuffleWaiting />
                                    </VStack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
