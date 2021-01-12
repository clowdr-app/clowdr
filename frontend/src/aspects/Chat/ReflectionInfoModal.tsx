import {
    Heading,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    UnorderedList,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import React from "react";

const ReflectionInfoModalContext = React.createContext<(() => void) | undefined>(undefined);

export function useReflectionInfoModal(): () => void {
    const ctx = React.useContext(ReflectionInfoModalContext);
    assert(ctx);
    return ctx;
}

export default function ReflectionInfoModalProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
        <>
            <ReflectionInfoModalContext.Provider value={onOpen}>{children}</ReflectionInfoModalContext.Provider>
            <Modal isCentered isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>What is chat &ldquo;reflection&rdquo;?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={2} alignItems="stretch">
                            <Text>Both rooms and items (e.g. papers) have independent chats.</Text>
                            <Text>
                                There are times when an item is being presented at an event in a room. During this time,
                                the two chats - one for the room, one for the item - join eachother.
                            </Text>
                            <Text>
                                While two chats are joined, any messages posted in one are reflected (i.e. copied) into
                                the other.
                            </Text>
                            <Heading pt={4} as="h3" fontSize="1rem" textAlign="left" w="100%">
                                Why show both chats?
                            </Heading>
                            <Text>The two chats have different histories:</Text>
                            <UnorderedList my={2} listStylePos="outside" pl={4} spacing={2}>
                                <ListItem>
                                    The item&rsquo;s chat, contains the conversation about that item from before the
                                    event started in the room.
                                </ListItem>
                                <ListItem>
                                    If you&rsquo;ve been part of a room for a while, the room chat gives you a
                                    continuous and coherent feed of what was discussed during your time in the room,
                                    across all the events that you&rsquo;ve watched.
                                </ListItem>
                                <ListItem>
                                    After an event ends, the item&rsquo;s chat preserves the history of the live
                                    discussion of that item. This will also be archived after the conference.
                                </ListItem>
                            </UnorderedList>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
