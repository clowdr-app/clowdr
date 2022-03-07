import {
    Button,
    chakra,
    Heading,
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
    useBreakpointValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import { gql } from "@urql/core";
import React, { useCallback, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import FAIcon from "../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useTitle } from "../../../Hooks/useTitle";
import { ShuffleWaiting } from "../../../ShuffleRooms/WaitingPage";
import { useConference } from "../../useConference";
import { AllRegistrantsList } from "../Registrant/RegistrantListPage";
import { CreateRoomModal } from "../Room/CreateRoomModal";
import ActiveSocialRooms from "./ActiveSocialRooms";
import InactiveSocialRooms from "./InactiveSocialRooms";
import { SocialiseModalTab } from "./SocialiseModalProvider";

gql`
    query GetSocialRooms($conferenceId: uuid!) @cached {
        room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                managementModeName: { _in: [PUBLIC, PRIVATE] }
                _not: { events: {} }
                itemId: { _is_null: true }
            }
        ) {
            ...SocialRoom
        }
    }

    fragment SocialRoom on room_Room {
        id
        name
        priority
        conferenceId
        itemId
        managementModeName
    }
`;

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
    const closeRef = useRef<HTMLButtonElement | null>(null);

    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="full"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent h="100vh" overflow="hidden" m={4}>
                <ModalCloseButton ref={closeRef} />
                <ModalBody display="flex" justifyContent="center" overflow="hidden" p={0}>
                    {isOpen ? <SocialiseTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} /> : undefined}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

function SocialiseTabs({
    selectedTab,
    setSelectedTab,
    tabButtonSize = "sm",
    alignLeft,
}: {
    selectedTab: SocialiseModalTab;
    setSelectedTab: (tab: SocialiseModalTab) => void;
    tabButtonSize?: string;
    alignLeft?: boolean;
}): JSX.Element {
    const { isOpen: createRoom_IsOpen, onClose: createRoom_OnClose, onOpen: createRoom_OnOpen } = useDisclosure();
    const { conferencePath } = useAuthParameters();
    const history = useHistory();
    const refetch = useCallback(
        async (id, cb) => {
            cb();
            history.push(`${conferencePath}/room/${id}`);
        },
        [conferencePath, history]
    );
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
            <Tabs
                variant="solid-rounded"
                colorScheme="PrimaryActionButton"
                isLazy
                h="auto"
                w="100%"
                overflow="hidden"
                display="flex"
                flexDir="column"
                size={tabButtonSize}
                index={selectedTabIndex}
                onChange={setSelectedTabFromIndex}
                pt={1}
                px={[2, 2, 4]}
                alignSelf={alignLeft ? "flex-start" : undefined}
            >
                <TabList justifyContent={alignLeft ? "flex-start" : "center"}>
                    <Tab alignItems="center">
                        <FAIcon iconStyle="s" icon="mug-hot" aria-hidden />
                        &nbsp;&nbsp;Rooms
                    </Tab>
                    <Tab alignItems="center">
                        <FAIcon iconStyle="s" icon="users" aria-hidden />
                        &nbsp;&nbsp;People
                    </Tab>
                    <Tab alignItems="center">
                        <FAIcon iconStyle="s" icon="random" aria-hidden />
                        &nbsp;&nbsp;Networking
                    </Tab>
                </TabList>
                <TabPanels overflow="hidden">
                    <TabPanel
                        h="100%"
                        overflowY="auto"
                        overflowX="hidden"
                        display="flex"
                        flexDir="column"
                        alignItems={alignLeft ? "flex-start" : "center"}
                        px={0}
                    >
                        <ActiveSocialRooms alignLeft={alignLeft} />
                        <chakra.div h={4} />
                        <InactiveSocialRooms alignLeft={alignLeft} />
                        <Button
                            onClick={createRoom_OnOpen}
                            colorScheme="PrimaryActionButton"
                            mt={4}
                            w="auto"
                            flex="0 0 auto"
                        >
                            Create new room
                        </Button>
                    </TabPanel>
                    <TabPanel h="100%" overflow="hidden" px={0}>
                        <VStack spacing={4} h="100%" overflow="hidden" alignItems={alignLeft ? "flex-start" : "center"}>
                            <AllRegistrantsList />
                        </VStack>
                    </TabPanel>
                    <TabPanel h="100%" overflowY="auto" overflowX="hidden" px={0}>
                        <VStack spacing={4} alignItems={alignLeft ? "flex-start" : "center"}>
                            <ShuffleWaiting />
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </>
    );
}

export function SocialisePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle("Socialize");
    const [selectedTab, setSelectedTab] = useRestorableState<SocialiseModalTab>(
        "SocialiseModal_SelectedTab" + conference.id,
        SocialiseModalTab.Rooms,
        (x) => x,
        (x) => x as SocialiseModalTab
    );

    const buttonSize = useBreakpointValue(["sm", "sm", "md"]);
    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" mt={[2, 2, 4]} px={[2, 2, 4]} alignSelf="flex-start">
                Socialize
            </Heading>
            <SocialiseTabs
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                tabButtonSize={buttonSize}
                alignLeft
            />
        </>
    );
}
