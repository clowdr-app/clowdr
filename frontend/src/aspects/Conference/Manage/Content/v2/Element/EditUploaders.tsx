import { FetchResult, gql, MutationFunctionOptions, Reference } from "@apollo/client";
import {
    Box,
    Button,
    ButtonGroup,
    chakra,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Link,
    List,
    ListItem,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Spinner,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useRef, useState } from "react";
import {
    ManageContent_SelectUploadersDocument,
    ManageContent_SelectUploadersQuery,
    ManageContent_SelectUploadersQueryVariables,
    ManageContent_UpdateElementMutation,
    ManageContent_UpdateElementMutationVariables,
    ManageContent_UploaderFragment,
    ManageContent_UploaderFragmentDoc,
    useManageContent_DeleteUploadersMutation,
    useManageContent_InsertUploadersMutation,
    useManageContent_SelectUploadersQuery,
    useManageContent_UpdateUploaderMutation,
} from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { useConference } from "../../../../useConference";

gql`
    fragment ManageContent_Uploader on content_Uploader {
        id
        elementId
        email
        name
        emailsSentCount
        conferenceId
    }

    query ManageContent_SelectUploaders($elementId: uuid!) {
        content_Uploader(where: { elementId: { _eq: $elementId } }) {
            ...ManageContent_Uploader
        }
    }

    mutation ManageContent_InsertUploaders($objects: [content_Uploader_insert_input!]!) {
        insert_content_Uploader(objects: $objects) {
            returning {
                ...ManageContent_Uploader
            }
        }
    }

    mutation ManageContent_UpdateUploader($id: uuid!, $update: content_Uploader_set_input!) {
        update_content_Uploader_by_pk(pk_columns: { id: $id }, _set: $update) {
            ...ManageContent_Uploader
        }
    }

    mutation ManageContent_DeleteUploaders($ids: [uuid!]!) {
        delete_content_Uploader(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export function EditUploaders({
    elementId,
    uploadsRemaining,
    isUpdatingUploadable,
    updateUploadableElement,
    openSendSubmissionRequests,
}: {
    elementId: string;
    uploadsRemaining: number | null;
    isUpdatingUploadable: boolean;
    updateUploadableElement: (
        options?: MutationFunctionOptions<
            ManageContent_UpdateElementMutation,
            ManageContent_UpdateElementMutationVariables
        >
    ) => Promise<FetchResult<ManageContent_UpdateElementMutation>>;
    openSendSubmissionRequests: (uploaderIds: string[]) => void;
}): JSX.Element {
    const conference = useConference();
    const uploadersResponse = useManageContent_SelectUploadersQuery({
        variables: {
            elementId,
        },
    });

    const bgColor = useColorModeValue("purple.50", "purple.900");

    const { isOpen: addUploader_IsOpen, onOpen: addUploader_OnOpen, onClose: addUploader_OnClose } = useDisclosure();
    const addUploader_InitialRef = useRef(null);
    const [addUploader_Name, addUploader_SetName] = useState<string>("");
    const [addUploader_Email, addUploader_SetEmail] = useState<string>("");
    const [addUploader_EmailValid, addUploader_SetEmailValid] = useState<boolean>(false);

    const [insertUploaders, insertUploadersResponse] = useManageContent_InsertUploadersMutation({
        update: (cache, response) => {
            if (response.data?.insert_content_Uploader) {
                const datas = response.data.insert_content_Uploader.returning;
                datas.forEach((data) => {
                    cache.writeFragment({
                        data,
                        fragment: ManageContent_UploaderFragmentDoc,
                        fragmentName: "ManageContent_Uploader",
                    });

                    {
                        const query = cache.readQuery<
                            ManageContent_SelectUploadersQuery,
                            ManageContent_SelectUploadersQueryVariables
                        >({
                            query: ManageContent_SelectUploadersDocument,
                            variables: {
                                elementId: data.elementId,
                            },
                        });
                        if (query) {
                            cache.writeQuery<
                                ManageContent_SelectUploadersQuery,
                                ManageContent_SelectUploadersQueryVariables
                            >({
                                query: ManageContent_SelectUploadersDocument,
                                data: {
                                    ...query,
                                    content_Uploader: [...query.content_Uploader.filter((x) => data.id !== x.id), data],
                                },
                                variables: {
                                    elementId: data.elementId,
                                },
                            });
                        }
                    }
                });
            }
        },
    });

    const toast = useToast();

    if (uploadersResponse.loading || !uploadersResponse.data) {
        return <Spinner label="Loading uploaders" />;
    } else {
        return (
            <>
                <Flex w="100%" mt={4} mb={2} alignItems="center">
                    <Tooltip label="Send submission request emails to all uploaders of this element.">
                        <Button
                            mr={3}
                            size="xs"
                            aria-label="Send submission request emails to all uploaders of this element."
                            onClick={() => {
                                openSendSubmissionRequests(
                                    uploadersResponse.data?.content_Uploader.map((x) => x.id) ?? []
                                );
                            }}
                            isLoading={insertUploadersResponse.loading}
                            isDisabled={uploadersResponse.data.content_Uploader.length === 0}
                        >
                            <FAIcon iconStyle="s" icon="envelope" />
                        </Button>
                    </Tooltip>
                    <Popover
                        placement="bottom-start"
                        isLazy
                        initialFocusRef={addUploader_InitialRef}
                        isOpen={addUploader_IsOpen}
                        onClose={addUploader_OnClose}
                    >
                        <PopoverTrigger>
                            <Button
                                size="xs"
                                aria-label="Add uploader"
                                mr={2}
                                colorScheme="purple"
                                onClick={addUploader_OnOpen}
                            >
                                <FAIcon iconStyle="s" icon="plus" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent bgColor={bgColor}>
                            <PopoverHeader>Add uploader</PopoverHeader>
                            <PopoverBody>
                                <FormControl>
                                    <FormLabel>Name</FormLabel>
                                    <Input
                                        placeholder="First-name last-name"
                                        ref={addUploader_InitialRef}
                                        value={addUploader_Name}
                                        onChange={(ev) => {
                                            addUploader_SetName(ev.target.value);
                                        }}
                                    />
                                </FormControl>
                                <FormControl mt={2}>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        type="email"
                                        placeholder="email@example.org"
                                        value={addUploader_Email}
                                        onChange={(ev) => {
                                            addUploader_SetEmail(ev.target.value);
                                            addUploader_SetEmailValid(ev.target.validity.valid);
                                        }}
                                    />
                                </FormControl>
                            </PopoverBody>
                            <PopoverFooter textAlign="right">
                                <ButtonGroup>
                                    <Button size="sm" onClick={addUploader_OnClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        colorScheme="purple"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await insertUploaders({
                                                    variables: {
                                                        objects: [
                                                            {
                                                                conferenceId: conference.id,
                                                                email: addUploader_Email,
                                                                name: addUploader_Name,
                                                                elementId,
                                                            },
                                                        ],
                                                    },
                                                });
                                                addUploader_OnClose();
                                            } catch (e) {
                                                toast({
                                                    title: "Error adding uploader",
                                                    description: e.message ?? e.toString(),
                                                    isClosable: true,
                                                    duration: 10000,
                                                    position: "bottom",
                                                    status: "error",
                                                });
                                            }
                                        }}
                                        isDisabled={
                                            addUploader_Name.length === 0 ||
                                            addUploader_Email.length === 0 ||
                                            !addUploader_EmailValid
                                        }
                                        isLoading={insertUploadersResponse.loading}
                                    >
                                        Add
                                    </Button>
                                </ButtonGroup>
                            </PopoverFooter>
                        </PopoverContent>
                    </Popover>
                    <Heading as="h4" fontSize="sm" textAlign="left" pl={1} mr="auto">
                        Uploaders
                    </Heading>
                    {uploadsRemaining !== null ? (
                        <FormControl as={HStack} spacing={0} fontSize="sm" w="auto" alignItems="center">
                            <FormLabel m={0} pr={1} pb={1}>
                                Attempts remaining:
                            </FormLabel>
                            <NumberInput
                                size="xs"
                                minW={0}
                                w="50px"
                                isDisabled={isUpdatingUploadable}
                                value={uploadsRemaining}
                                onChange={(_valAsStr, valAsNum) => {
                                    const newVal = Math.max(valAsNum, 0);
                                    if (newVal !== uploadsRemaining) {
                                        updateUploadableElement({
                                            variables: {
                                                elementId,
                                                element: {
                                                    uploadsRemaining: newVal,
                                                },
                                            },
                                        });
                                    }
                                }}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper aria-label="Increment" />
                                    <NumberDecrementStepper aria-label="Decrement" />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    ) : (
                        <>
                            <chakra.span fontSize="sm">Attempts remaining:</chakra.span>
                            <FAIcon iconStyle="s" icon="infinity" fontSize="xs" ml={2} />
                        </>
                    )}
                </Flex>
                <Box overflow="auto" w="100%">
                    <List minW="max-content">
                        {R.sortBy((x) => x.name, uploadersResponse.data.content_Uploader).map((uploader) => (
                            <EditUploader
                                key={uploader.id}
                                uploader={uploader}
                                openSendSubmissionRequests={openSendSubmissionRequests}
                            />
                        ))}
                        {uploadersResponse.data.content_Uploader.length === 0 ? (
                            <ListItem>No uploaders listed. Use the plus button above to add an uploader.</ListItem>
                        ) : undefined}
                    </List>
                </Box>
            </>
        );
    }
}

function EditUploader({
    uploader,
    openSendSubmissionRequests,
}: {
    uploader: ManageContent_UploaderFragment;
    openSendSubmissionRequests: (uploaderIds: string[]) => void;
}): JSX.Element {
    const [updateUploader, updateUploaderResponse] = useManageContent_UpdateUploaderMutation({
        update: (cache, { data: _data }) => {
            if (_data?.update_content_Uploader_by_pk) {
                const data = _data.update_content_Uploader_by_pk;
                cache.modify({
                    fields: {
                        content_Uploader(existingRefs: Reference[] = [], { readField }) {
                            const newRef = cache.writeFragment({
                                data,
                                fragment: ManageContent_UploaderFragmentDoc,
                                fragmentName: "ManageContent_Uploader",
                            });
                            if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                return existingRefs;
                            }
                            return [...existingRefs, newRef];
                        },
                    },
                });
            }
        },
    });
    const [deleteUploaders, deleteUploadersResponse] = useManageContent_DeleteUploadersMutation({
        update: (cache, response) => {
            if (response.data?.delete_content_Uploader) {
                const deletedIds = response.data.delete_content_Uploader.returning.map((x) => x.id);
                cache.modify({
                    fields: {
                        content_Uploader(existingRefs: Reference[] = [], { readField }) {
                            for (const deletedId of deletedIds) {
                                cache.evict({
                                    id: deletedId,
                                    fieldName: "ManageContent_Uploader",
                                    broadcast: true,
                                });
                            }
                            return existingRefs.filter((ref) => !deletedIds.includes(readField("id", ref)));
                        },
                    },
                });
            }
        },
    });

    const toast = useToast();

    const [newName, setNewName] = useState<string>(uploader.name);
    const [newEmail, setNewEmail] = useState<string>(uploader.email);
    const [newEmailIsValid, setNewEmailIsValid] = useState<boolean>(true);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    return (
        <ListItem w="100%" mb={1}>
            <Flex w="100%" alignItems="flex-start">
                <Tooltip
                    label={`Send submission request email to ${uploader.email}. ${uploader.emailsSentCount} previously sent.`}
                >
                    <Box mr={2} display="inline-block">
                        <Button
                            size="xs"
                            aria-label={`Send submission request email to ${uploader.email}. ${uploader.emailsSentCount} previously sent.`}
                            onClick={() => {
                                openSendSubmissionRequests([uploader.id]);
                            }}
                            mr={2}
                        >
                            <FAIcon iconStyle="s" icon="envelope" />
                            &nbsp;&nbsp;{uploader.emailsSentCount}
                        </Button>
                    </Box>
                </Tooltip>
                {!isEditing ? (
                    <>
                        <Tooltip label="Edit uploader">
                            <Button
                                size="xs"
                                aria-label="Edit uploader"
                                onClick={() => {
                                    setIsEditing(true);
                                }}
                                mr={2}
                                isLoading={updateUploaderResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="edit" />
                            </Button>
                        </Tooltip>
                        <Text mr="auto">{uploader.name}</Text>
                        <Text ml={2} mr={2}>
                            &lt;
                            <Link isExternal href={`mailto:${uploader.email}`}>
                                {uploader.email}
                            </Link>
                            &gt;
                        </Text>
                    </>
                ) : (
                    <HStack alignItems="flex-start" mr="auto">
                        <Tooltip label="Save changes">
                            <Button
                                size="xs"
                                aria-label="Save changes"
                                onClick={async () => {
                                    try {
                                        await updateUploader({
                                            variables: {
                                                id: uploader.id,
                                                update: {
                                                    email: newEmail,
                                                    name: newName,
                                                },
                                            },
                                        });

                                        setIsEditing(false);
                                    } catch (e) {
                                        toast({
                                            title: "Error updating uploader",
                                            description: e.message ?? e.toString(),
                                            isClosable: true,
                                            duration: 10000,
                                            position: "bottom",
                                            status: "error",
                                        });
                                    }
                                }}
                                colorScheme="purple"
                                isDisabled={newName === "" || newEmail === "" || !newEmailIsValid}
                                isLoading={updateUploaderResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="save" />
                            </Button>
                        </Tooltip>
                        <Tooltip label="Discard changes">
                            <Button
                                size="xs"
                                aria-label="Discard changes"
                                onClick={() => {
                                    setNewName(uploader.name);
                                    setNewEmail(uploader.email);
                                    setIsEditing(false);
                                }}
                                mr={2}
                                colorScheme="yellow"
                                isLoading={updateUploaderResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="ban" />
                            </Button>
                        </Tooltip>
                        <Input
                            value={newName}
                            size="sm"
                            minW={70}
                            onChange={(ev) => {
                                setNewName(ev.target.value);
                            }}
                        />
                        <Input
                            type="email"
                            value={newEmail}
                            size="sm"
                            minW={70}
                            onChange={(ev) => {
                                setNewEmail(ev.target.value);
                                setNewEmailIsValid(ev.target.validity.valid);
                            }}
                        />
                    </HStack>
                )}
                <Tooltip label="Delete uploader">
                    <Button
                        ml={2}
                        size="xs"
                        colorScheme="red"
                        aria-label="Delete uploader"
                        isLoading={deleteUploadersResponse.loading}
                        onClick={async () => {
                            try {
                                await deleteUploaders({
                                    variables: {
                                        ids: [uploader.id],
                                    },
                                });
                            } catch (e) {
                                toast({
                                    title: "Error deleting uploader",
                                    description: e.message ?? e.toString(),
                                    isClosable: true,
                                    duration: 10000,
                                    position: "bottom",
                                    status: "error",
                                });
                            }
                        }}
                    >
                        <FAIcon iconStyle="s" icon="trash-alt" />
                    </Button>
                </Tooltip>
            </Flex>
        </ListItem>
    );
}
