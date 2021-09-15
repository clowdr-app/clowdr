import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import {
    Content_Uploader_Insert_Input,
    useSynchroniseUploadersMutation,
    useSynchroniseUploaders_SelectDataQuery,
} from "../../../../../../generated/graphql";
import MultiSelect from "../../../../../Chakra/MultiSelect";
import { useConference } from "../../../../useConference";

gql`
    query SynchroniseUploaders_SelectData($itemIds: [uuid!]!, $elementIds: [uuid!]!, $conferenceId: uuid!) {
        content_Item(where: { id: { _in: $itemIds } }) {
            id
            itemPeople(where: { person: { _and: [{ email: { _is_null: false } }, { email: { _neq: "" } }] } }) {
                id
                roleName
                personId
            }
            elements(where: { id: { _in: $elementIds } }) {
                id
                uploaders {
                    id
                    name
                    email
                }
            }
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId }, email: { _is_null: false } }) {
            id
            name
            email
        }
    }

    mutation SynchroniseUploaders($deleteUploaderIds: [uuid!]!, $insertUploaders: [content_Uploader_insert_input!]!) {
        delete_content_Uploader(where: { id: { _in: $deleteUploaderIds } }) {
            returning {
                id
            }
        }
        insert_content_Uploader(
            objects: $insertUploaders
            on_conflict: { constraint: Uploader_elementId_email_key, update_columns: [] }
        ) {
            returning {
                id
            }
        }
    }
`;

function isNotUndefined<T>(x: T | undefined): x is T {
    if (x === undefined) {
        return false;
    }
    return true;
}

export function SynchroniseUploadersModal({
    isOpen,
    onClose,
    elementsByItem,
}: {
    isOpen: boolean;
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Synchronise uploaders</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner elementsByItem={elementsByItem} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    elementsByItem,
}: {
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    const conference = useConference();
    const itemIds = useMemo(() => elementsByItem.map((x) => x.itemId), [elementsByItem]);
    const elementIds = useMemo(() => elementsByItem.flatMap((x) => x.elementIds), [elementsByItem]);
    const response = useSynchroniseUploaders_SelectDataQuery({
        variables: {
            itemIds,
            elementIds,
            conferenceId: conference.id,
        },
        fetchPolicy: "no-cache",
    });
    const [sync, syncResponse] = useSynchroniseUploadersMutation();

    const [selectedRoles, setSelectedRoles] = useState<readonly { value: string; label: string }[]>([
        {
            label: "Presenter",
            value: "PRESENTER",
        },
        {
            label: "Author",
            value: "AUTHOR",
        },
        {
            label: "Discussant",
            value: "DISCUSSANT",
        },
    ]);

    const toast = useToast();
    const synchronise = useCallback(async () => {
        if (response.data) {
            const data = response.data;

            const deleteUploaderIds: string[] = [];
            const insertUploaders: Content_Uploader_Insert_Input[] = [];

            for (const item of data.content_Item) {
                const filteredPeople = item.itemPeople
                    .filter((x) => selectedRoles.some((role) => role.value === x.roleName.toUpperCase()))
                    .map((itemPerson) => data.collection_ProgramPerson.find((x) => x.id === itemPerson.personId))
                    .filter(isNotUndefined);

                for (const element of item.elements) {
                    for (const person of filteredPeople) {
                        const isMissing = !element.uploaders.some(
                            (uploader) => uploader.name === person.name && uploader.email === person.email
                        );
                        if (isMissing) {
                            insertUploaders.push({
                                conferenceId: conference.id,
                                elementId: element.id,
                                email: person.email,
                                name: person.name,
                            });
                        }
                    }

                    for (const uploader of element.uploaders) {
                        const isMissing = !filteredPeople.some(
                            (person) => uploader.name === person.name && uploader.email === person.email
                        );
                        if (isMissing) {
                            deleteUploaderIds.push(uploader.id);
                        }
                    }
                }
            }

            try {
                await sync({
                    variables: {
                        deleteUploaderIds,
                        insertUploaders,
                    },
                });

                toast({
                    title: "Synchronised",
                    status: "success",
                    duration: 3000,
                    position: "top",
                });

                setTimeout(() => {
                    window.location.reload();
                }, 2500);

                onClose();
            } catch (e) {
                console.error("Failed to synchronise uploaders", e);
            }
        }
    }, [conference.id, onClose, response.data, selectedRoles, sync, toast]);

    return (
        <>
            <ModalBody>
                <Text>This will synchronise the list of uploaders on each element from the list of people.</Text>
                <Text>
                    Any person linked to the respective item that is not in the list of uploaders (who has an email
                    address) will be added to the uploaders for each selected element of that item.
                </Text>
                <Text>
                    Any uploader of an element not in the list of people for the respective item will be removed from
                    the uploaders for that element.
                </Text>
                <FormControl mt={4}>
                    <FormLabel>Limit to roles</FormLabel>
                    <MultiSelect
                        name="roles"
                        options={[
                            {
                                label: "Presenter",
                                value: "PRESENTER",
                            },
                            {
                                label: "Author",
                                value: "AUTHOR",
                            },
                            {
                                label: "Chair",
                                value: "CHAIR",
                            },
                            {
                                label: "Session Organizer",
                                value: "SESSION ORGANIZER",
                            },
                            {
                                label: "Discussant",
                                value: "DISCUSSANT",
                            },
                        ]}
                        value={selectedRoles}
                        placeholder="Select one or more roles"
                        isMulti
                        onChange={(ev) => {
                            setSelectedRoles(ev);
                        }}
                    />
                    <FormHelperText>Only consider people on items with these roles</FormHelperText>
                </FormControl>
                {syncResponse.error ? (
                    <Alert status="error" mt={4}>
                        <AlertTitle>
                            <AlertIcon />
                            Error synchronising uploaders
                        </AlertTitle>
                        <AlertDescription>{syncResponse.error.message}</AlertDescription>
                    </Alert>
                ) : undefined}
            </ModalBody>
            <ModalFooter>
                <VStack>
                    {response.loading ? <Text>Loading sychronisation data, please wait.</Text> : undefined}
                    <ButtonGroup spacing={2}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            colorScheme="purple"
                            isDisabled={!response.data}
                            isLoading={response.loading || syncResponse.loading}
                            onClick={synchronise}
                        >
                            Synchronise
                        </Button>
                    </ButtonGroup>
                </VStack>
            </ModalFooter>
        </>
    );
}
