import {
    Button,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
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
import { useRestorableState } from "../../../../Generic/useRestorableState";
import FAIcon from "../../../../Icons/FAIcon";
import { ShuffleWaiting } from "../../../../ShuffleRooms/WaitingPage";
import { useConference } from "../../../useConference";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { AllRegistrantsList } from "../../Registrant/RegistrantListPage";
import { CreateRoomModal } from "../../Room/CreateRoomModal";
import ActiveSocialRooms from "./ActiveSocialRooms";
import InactiveSocialRooms from "./InactiveSocialRooms";

export enum SocialiseModalTab {
    Rooms = "Rooms",
    People = "People",
    Networking = "Networking",
}

interface SocialiseModalContext {
    isOpen: boolean;
    onOpen: (tab?: SocialiseModalTab) => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const SocialiseModalContext = React.createContext<SocialiseModalContext | undefined>(undefined);

export function useSocialiseModal(): SocialiseModalContext {
    const ctx = React.useContext(SocialiseModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function SocialiseModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const conference = useConference();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const socialiseButtonRef = useRef<FocusableElement>(null);
    const [selectedTab, setSelectedTab] = useRestorableState<SocialiseModalTab>(
        "SocialiseModal_SelectedTab" + conference.id,
        SocialiseModalTab.Rooms,
        (x) => x,
        (x) => x as SocialiseModalTab
    );

    const doOnOpen = useCallback(
        (tab?: SocialiseModalTab) => {
            onOpen();
            if (tab) {
                setSelectedTab(tab);
            }
        },
        [onOpen, setSelectedTab]
    );

    const ctx: SocialiseModalContext = useMemo(
        () => ({
            finalFocusRef: socialiseButtonRef,
            isOpen,
            onOpen: doOnOpen,
            onClose,
        }),
        [doOnOpen, isOpen, onClose]
    );

    const maybeRegistrant = useMaybeCurrentRegistrant();

    return (
        <SocialiseModalContext.Provider value={ctx}>
            {children}
            {maybeRegistrant ? (
                <SocialiseModal
                    isOpen={isOpen}
                    onClose={onClose}
                    finalFocusRef={socialiseButtonRef}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />
            ) : undefined}
        </SocialiseModalContext.Provider>
    );
}

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
                            colorScheme="purple"
                            isLazy
                            w="100%"
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
                                        <Button onClick={createRoom_OnOpen} colorScheme="purple">
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
