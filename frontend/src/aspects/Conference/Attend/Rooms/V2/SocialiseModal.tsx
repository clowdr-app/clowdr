import {
    Button,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    ModalProps,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
import FAIcon from "../../../../Icons/FAIcon";
import { ShuffleWaiting } from "../../../../ShuffleRooms/WaitingPage";
import { useConference } from "../../../useConference";
import { AllRegistrantsList } from "../../Registrant/RegistrantListPage";
import { CreateRoomModal } from "../../Room/CreateRoomModal";
import ActiveSocialRooms from "./ActiveSocialRooms";
import InactiveSocialRooms from "./InactiveSocialRooms";

export default function SocialiseModal(props: Omit<ModalProps, "children">): JSX.Element {
    const { isOpen: createRoom_IsOpen, onClose: createRoom_OnClose, onOpen: createRoom_OnOpen } = useDisclosure();
    const conference = useConference();

    const history = useHistory();
    const refetch = useCallback(
        async (id, cb) => {
            // Wait, because Vonage session creation is not instantaneous
            setTimeout(() => {
                cb();
                history.push(`/conference/${conference.slug}/room/${id}`);
            }, 2000);
        },
        [conference.slug, history]
    );

    const closeRef = useRef<HTMLButtonElement | null>(null);
    return (
        <>
            <CreateRoomModal isOpen={createRoom_IsOpen} onClose={createRoom_OnClose} onCreated={refetch} />
            <Modal initialFocusRef={closeRef} size="6xl" isCentered scrollBehavior="inside" {...props}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Socialise</ModalHeader>
                    <ModalCloseButton ref={closeRef} />
                    <ModalBody>
                        <Tabs isFitted variant="enclosed-colored" colorScheme="purple" isLazy>
                            <TabList>
                                <Tab>
                                    <FAIcon iconStyle="s" icon="mug-hot" aria-hidden />
                                    &nbsp;&nbsp;Rooms
                                </Tab>
                                <Tab>
                                    <FAIcon iconStyle="s" icon="users" aria-hidden />
                                    &nbsp;&nbsp;People
                                </Tab>
                                <Tab>
                                    <FAIcon iconStyle="s" icon="random" aria-hidden />
                                    &nbsp;&nbsp;Networking
                                </Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <ActiveSocialRooms excludeLiveEventRooms />
                                    <InactiveSocialRooms />
                                    <Flex mt={4} justifyContent="center">
                                        <Button onClick={createRoom_OnOpen} colorScheme="green">
                                            Create new room
                                        </Button>
                                    </Flex>
                                </TabPanel>
                                <TabPanel>
                                    <VStack spacing={4}>
                                        <AllRegistrantsList />
                                    </VStack>
                                </TabPanel>
                                <TabPanel>
                                    <VStack spacing={4}>
                                        <ShuffleWaiting />
                                    </VStack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                    <ModalFooter></ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
