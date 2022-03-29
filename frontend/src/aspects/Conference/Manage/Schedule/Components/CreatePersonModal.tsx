import {
    Alert,
    AlertDescription,
    AlertTitle,
    Button,
    ButtonGroup,
    Divider,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    InputGroup,
    InputLeftAddon,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useEffect, useMemo, useState } from "react";
import { gql, useClient } from "urql";
import type {
    CreatePersonModal_GetRegistrantQuery,
    CreatePersonModal_GetRegistrantQueryVariables,
    CreatePersonModal_RegistrantFragment,
    CreatePersonModal_SearchRegistrantsQuery,
    CreatePersonModal_SearchRegistrantsQueryVariables,
} from "../../../../../generated/graphql";
import {
    CreatePersonModal_GetRegistrantDocument,
    CreatePersonModal_SearchRegistrantsDocument,
    Registrant_Invitation_Constraint,
    Registrant_Invitation_Update_Column,
    Registrant_Profile_Constraint,
    Registrant_Profile_Update_Column,
    Registrant_Registrant_Constraint,
    Registrant_Registrant_Update_Column,
    useCreatePersonModal_CreatePersonMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { SingleSelect } from "../../../../Chakra/MultiSelect";
import type { ValidationState } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    mutation CreatePersonModal_CreatePerson($person: collection_ProgramPerson_insert_input!) {
        insert_collection_ProgramPerson_one(object: $person) {
            id
        }
    }

    fragment CreatePersonModal_Registrant on registrant_Registrant {
        id
        displayName
        profile {
            registrantId
            affiliation
        }
        invitation {
            id
            invitedEmailAddress
        }
    }

    query CreatePersonModal_GetRegistrant($id: uuid!) {
        registrant_Registrant_by_pk(id: $id) {
            ...CreatePersonModal_Registrant
        }
    }

    query CreatePersonModal_SearchRegistrants($conferenceId: uuid!, $search: String!) {
        registrant_searchRegistrants(args: { conferenceid: $conferenceId, search: $search }, limit: 5) {
            ...CreatePersonModal_Registrant
        }
    }
`;

export default function CreatePersonModal({
    initialName,
    initialExistingRegistrantId,
    onCreate,

    isOpen,
    onClose,
}: {
    initialName: string;
    initialExistingRegistrantId: string | null;
    onCreate: (newPersonId: string) => void;

    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();

    const [name, setName] = useState<string>(initialName);
    const [affiliation, setAffiliation] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [registrantId, setRegistrantId] = useState<string | null>(initialExistingRegistrantId);

    const [nameHasChanged, setNameHasChanged] = useState<boolean>(false);
    const [nameValidation, setNameValidation] = useState<ValidationState>("no error");
    const [_affiliationHasChanged, setAffiliationHasChanged] = useState<boolean>(false);
    const [emailHasChanged, setEmailHasChanged] = useState<boolean>(false);
    const [emailValidation, setEmailValidation] = useState<ValidationState>("no error");

    useEffect(() => {
        if (isOpen) {
            setName(initialName.trim());
            setAffiliation("");
            setEmail("");
            setNameHasChanged(initialName.trim().length > 0);
            setRegistrantId(initialExistingRegistrantId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (nameHasChanged) {
            if (name.trim().length > 0) {
                setNameValidation("no error");
            } else {
                setNameValidation({ error: "Name is required." });
            }
        } else {
            setNameValidation("no error");
        }
    }, [name, nameHasChanged]);

    useEffect(() => {
        if (emailHasChanged) {
            if (email.trim().length > 0) {
                if (
                    email.trim().match(
                        // eslint-disable-next-line no-control-regex
                        /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
                    )
                ) {
                    setEmailValidation("no error");
                } else {
                    setEmailValidation({ error: "Email address is not valid" });
                }
            } else {
                setEmailValidation("no error");
            }
        } else {
            setEmailValidation("no error");
        }
    }, [email, emailHasChanged]);

    const client = useClient();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<ReadonlyArray<CreatePersonModal_RegistrantFragment>>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    useEffect(() => {
        const tId = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                setIsSearching(true);
                try {
                    const result = await client
                        .query<
                            CreatePersonModal_SearchRegistrantsQuery,
                            CreatePersonModal_SearchRegistrantsQueryVariables
                        >(
                            CreatePersonModal_SearchRegistrantsDocument,
                            {
                                conferenceId: conference.id,
                                search: searchTerm,
                            },
                            context
                        )
                        .toPromise();
                    if (result.data) {
                        setSearchResults(result.data.registrant_searchRegistrants);
                    }
                } finally {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => {
            clearTimeout(tId);
        };
    }, [client, conference.id, context, searchTerm, subconferenceId]);
    const searchedOptions = useMemo(
        () => [
            {
                label: "No registration",
                value: "none",
            },
            ...(searchTerm.length >= 3
                ? [
                      ...searchResults.map((x) => ({
                          label: x.displayName,
                          value: x.id,
                      })),
                      ...(subconferenceId
                          ? []
                          : [
                                {
                                    label: "Add a registration",
                                    value: "create",
                                },
                            ]),
                  ]
                : subconferenceId
                ? []
                : [
                      {
                          label: "Add a registration",
                          value: "create",
                      },
                  ]),
        ],
        [searchResults, searchTerm.length, subconferenceId]
    );

    const [registrant, setRegistrant] = useState<CreatePersonModal_RegistrantFragment | null>(null);
    const [loadingRegistrant, setLoadingRegistrant] = useState<boolean>(false);
    useEffect(() => {
        if (registrantId && registrantId !== "create") {
            (async () => {
                setLoadingRegistrant(true);
                const response = await client
                    .query<CreatePersonModal_GetRegistrantQuery, CreatePersonModal_GetRegistrantQueryVariables>(
                        CreatePersonModal_GetRegistrantDocument,
                        {
                            id: registrantId,
                        },
                        context
                    )
                    .toPromise();
                if (response.data?.registrant_Registrant_by_pk) {
                    setRegistrant(response.data.registrant_Registrant_by_pk);
                } else {
                    setRegistrant(null);
                }
                setLoadingRegistrant(false);
            })();
        }
    }, [client, context, registrantId]);
    useEffect(() => {
        if (registrant) {
            setName(registrant.displayName);
            setAffiliation(registrant.profile?.affiliation ?? "");
            setEmail(registrant.invitation?.invitedEmailAddress ?? "");
        } else if (loadingRegistrant) {
            setName("<Loading...>");
            setAffiliation("<Loading...>");
            setEmail("<Loading...>");
        } else {
            setName("<Unknown>");
            setAffiliation("<Unknown>");
            setEmail("<Unknown>");
        }
    }, [loadingRegistrant, registrant]);

    const [createPersonResponse, createPerson] = useCreatePersonModal_CreatePersonMutation();
    const [createError, setCreateError] = useState<string | null>(null);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a person</ModalHeader>
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Registration</FormLabel>
                            <InputGroup w="100%">
                                <InputLeftAddon>
                                    {isSearching ? <Spinner /> : <FAIcon iconStyle="s" icon="search" />}
                                </InputLeftAddon>
                                <SingleSelect
                                    placeholder="Start typing to search registrations"
                                    onInputChange={(value) => {
                                        setSearchTerm(value);
                                    }}
                                    value={
                                        registrantId === "create"
                                            ? { label: "Add a registration", value: registrantId }
                                            : registrantId === "none" || !registrantId
                                            ? { label: "No registration", value: "none" }
                                            : {
                                                  label:
                                                      registrant?.displayName ??
                                                      (loadingRegistrant ? "<Loading...>" : "<Unknown>"),
                                                  value: registrantId,
                                              }
                                    }
                                    onChange={(value, action) => {
                                        if (
                                            value &&
                                            (action.action === "create-option" || action.action === "select-option")
                                        ) {
                                            setRegistrantId(value.value === "none" ? null : value.value);
                                        } else if (action.action === "clear") {
                                            setRegistrantId(null);
                                        }
                                    }}
                                    options={searchedOptions}
                                    styles={{
                                        container: (base) => ({
                                            ...base,
                                            width: "100%",
                                        }),
                                    }}
                                />
                            </InputGroup>
                        </FormControl>
                        <Divider />
                        <FormControl id="create-person-name" isInvalid={nameValidation !== "no error"}>
                            <FormLabel>Name</FormLabel>
                            <Input
                                type="text"
                                value={name}
                                onChange={(ev) => {
                                    setCreateError(null);
                                    setName(ev.target.value);
                                    setNameHasChanged(true);
                                }}
                            />
                            <FormErrorMessage>
                                {nameValidation !== "no error" ? nameValidation.error : "No error"}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl id="create-person-name">
                            <FormLabel>Affiliation</FormLabel>
                            <Input
                                type="text"
                                value={affiliation}
                                onChange={(ev) => {
                                    setCreateError(null);
                                    setAffiliation(ev.target.value);
                                    setAffiliationHasChanged(true);
                                }}
                                isDisabled={Boolean(registrantId) && registrantId !== "create"}
                            />
                        </FormControl>
                        <FormControl id="create-person-name" isInvalid={emailValidation !== "no error"}>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(ev) => {
                                    setCreateError(null);
                                    setEmail(ev.target.value);
                                    setEmailHasChanged(true);
                                }}
                                isDisabled={Boolean(registrantId) && registrantId !== "create"}
                            />
                            <FormErrorMessage>
                                {emailValidation !== "no error" ? emailValidation.error : "No error"}
                            </FormErrorMessage>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter flexDir="column" alignItems="flex-end">
                    {createError !== null ? (
                        <Alert status="error" mb={4}>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{createError}</AlertDescription>
                        </Alert>
                    ) : undefined}
                    <ButtonGroup>
                        <Button
                            colorScheme="DestructiveActionButton"
                            variant="outline"
                            onClick={() => {
                                onClose();
                            }}
                            isDisabled={createPersonResponse.fetching}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="ConfirmButton"
                            onClick={async () => {
                                if (nameValidation === "no error") {
                                    const result = await createPerson(
                                        {
                                            person: {
                                                conferenceId: conference.id,
                                                subconferenceId,
                                                name: name.trim(),
                                                affiliation: affiliation.trim(),
                                                email: email.trim().toLowerCase(),
                                                registrant:
                                                    !subconferenceId && registrantId
                                                        ? {
                                                              data: {
                                                                  conferenceId: conference.id,
                                                                  id:
                                                                      registrantId === "create"
                                                                          ? undefined
                                                                          : registrantId,
                                                                  displayName: name.trim(),
                                                                  profile:
                                                                      registrantId === "create"
                                                                          ? {
                                                                                data: {
                                                                                    affiliation: affiliation.trim(),
                                                                                },
                                                                                on_conflict: {
                                                                                    constraint:
                                                                                        Registrant_Profile_Constraint.ProfileRegistrantIdKey,
                                                                                    update_columns: [
                                                                                        Registrant_Profile_Update_Column.Affiliation,
                                                                                    ],
                                                                                },
                                                                            }
                                                                          : undefined,
                                                                  invitation:
                                                                      registrantId === "create"
                                                                          ? {
                                                                                data: {
                                                                                    conferenceId: conference.id,
                                                                                    invitedEmailAddress: email
                                                                                        .trim()
                                                                                        .toLowerCase(),
                                                                                },
                                                                                on_conflict: {
                                                                                    constraint:
                                                                                        Registrant_Invitation_Constraint.InvitationRegistrantIdKey,
                                                                                    update_columns: [
                                                                                        Registrant_Invitation_Update_Column.InvitedEmailAddress,
                                                                                    ],
                                                                                },
                                                                            }
                                                                          : undefined,
                                                              },
                                                              on_conflict: {
                                                                  constraint:
                                                                      Registrant_Registrant_Constraint.RegistrantPkey,
                                                                  update_columns: [
                                                                      Registrant_Registrant_Update_Column.DisplayName,
                                                                  ],
                                                              },
                                                          }
                                                        : undefined,
                                            },
                                        },
                                        context
                                    );
                                    if (result.data?.insert_collection_ProgramPerson_one) {
                                        setCreateError(null);
                                        onClose();
                                        onCreate(result.data.insert_collection_ProgramPerson_one.id);
                                    } else {
                                        setCreateError(extractActualError(result.error) ?? null);
                                    }
                                }
                            }}
                            isDisabled={
                                loadingRegistrant || nameValidation !== "no error" || emailValidation !== "no error"
                            }
                            isLoading={createPersonResponse.fetching}
                        >
                            Create
                        </Button>
                    </ButtonGroup>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
