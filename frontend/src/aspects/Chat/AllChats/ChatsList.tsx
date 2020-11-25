import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Tooltip,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link as ReactLink } from "react-router-dom";
import { useCreateChatMutation } from "../../../generated/graphql";
import Column from "../../Generic/Column";
import FAIcon from "../../Icons/FAIcon";
import useChats from "./useChats";

const _createChatQuery = gql`
    mutation createChat($description: String!, $name: String!) {
        insert_Chat(objects: { description: $description, name: $name }) {
            returning {
                id
            }
        }
    }
`;

export default function ChatsList(): JSX.Element {
    const { chats, refetchChats } = useChats();

    const {
        isOpen: isCreateModalOpen,
        onOpen: onCreateModalOpen,
        onClose: _onCreateModalClose,
    } = useDisclosure();
    const [newChatName, setNewChatName] = useState<string>("");
    const [newChatDescription, setNewChatDescription] = useState<string>("");
    const searchBoxRef = useRef<any>();
    const descriptionBoxRef = useRef<any>();

    const onCreateModalClose = useCallback(() => {
        setNewChatName("");
        setNewChatDescription("");
        _onCreateModalClose();
    }, [_onCreateModalClose]);

    const [
        createChatMutation,
        { loading: createChatMutationLoading, error: createChatMutationError },
    ] = useCreateChatMutation();

    const doCreateChat = useCallback(async () => {
        const result = await createChatMutation({
            variables: {
                description: newChatDescription,
                name: newChatName,
            },
        });
        if (result.data) {
            await refetchChats();
            onCreateModalClose();
        }
    }, [
        createChatMutation,
        newChatDescription,
        newChatName,
        onCreateModalClose,
        refetchChats,
    ]);

    const handleCreateChat = useCallback(
        async (name: string) => {
            setNewChatName(name);
            onCreateModalOpen();
        },
        [onCreateModalOpen]
    );

    const column = useMemo(() => {
        if (chats === null) {
            return <Spinner />;
        }
        if (chats === false) {
            return <Text>Error!</Text>;
        }
        return (
            <Column
                searchInputRef={searchBoxRef}
                title="Chats"
                onCreate={handleCreateChat}
                items={chats.Chat}
                compareItems={(x, y) => {
                    return x.name.localeCompare(y.name);
                }}
                renderItem={(chat) => {
                    const cutoff = Date.now() - 80 * 1000;
                    const isActive =
                        chat.viewers.filter(
                            (x) => new Date(x.lastSeen).getTime() > cutoff
                        ).length > 0;
                    const nameEl = (
                        <Link as={ReactLink} to={`/chat/${chat.id}`}>
                            {chat.name}
                            {chat.viewers.length > 0
                                ? `(${chat.viewers.length} here now)`
                                : undefined}
                        </Link>
                    );
                    return (
                        <HStack key={chat.id} width="100%">
                            <FAIcon
                                icon="comment"
                                iconStyle={isActive ? "s" : "r"}
                                color={isActive ? "#00ff00" : "#fcfcfc"}
                            />
                            {chat.description ? (
                                <Tooltip
                                    label={chat.description}
                                    aria-label={chat.description}
                                >
                                    {nameEl}
                                </Tooltip>
                            ) : (
                                nameEl
                            )}
                        </HStack>
                    );
                }}
                filterItem={(search, item) => {
                    return item.name
                        .toLowerCase()
                        .includes(search.toLowerCase());
                }}
            />
        );
    }, [chats, handleCreateChat]);

    const modalContent = useMemo(() => {
        if (createChatMutationLoading) {
            return <Spinner />;
        } else if (createChatMutationError) {
            return <Text>{createChatMutationError.message}</Text>;
        } else {
            return (
                <>
                    <FormControl>
                        <FormLabel>Name</FormLabel>
                        <Input
                            placeholder="Name"
                            value={newChatName}
                            onChange={(ev) => setNewChatName(ev.target.value)}
                        />
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Short description</FormLabel>
                        <Input
                            ref={descriptionBoxRef}
                            value={newChatDescription}
                            onChange={(ev) =>
                                setNewChatDescription(ev.target.value)
                            }
                            placeholder="Short description"
                        />
                    </FormControl>
                </>
            );
        }
    }, [
        createChatMutationError,
        createChatMutationLoading,
        newChatDescription,
        newChatName,
    ]);

    return (
        <>
            {column}
            <Modal
                onClose={onCreateModalClose}
                size="xl"
                isOpen={isCreateModalOpen}
                scrollBehavior="inside"
                initialFocusRef={descriptionBoxRef}
                finalFocusRef={searchBoxRef}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create chat</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>{modalContent}</ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={doCreateChat}
                            colorScheme="green"
                            disabled={
                                newChatName.trim().length === 0 ||
                                (chats
                                    ? chats.Chat.some(
                                          (x) =>
                                              x.name.toLowerCase() ===
                                              newChatName.trim().toLowerCase()
                                      )
                                    : undefined)
                            }
                        >
                            Create
                        </Button>
                        <Button onClick={onCreateModalClose} colorScheme="red">
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
