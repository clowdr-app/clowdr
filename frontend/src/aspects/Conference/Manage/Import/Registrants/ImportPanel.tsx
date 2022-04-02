import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    HStack,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { IntermediaryRegistrantData } from "@midspace/shared-types/import/registrant";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import { gql } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    Registrant_GroupRegistrant_Insert_Input,
    Registrant_SubconferenceMembership_Insert_Input,
} from "../../../../../generated/graphql";
import {
    Registrant_RegistrantRole_Enum,
    useImportRegistrantsMutation,
    useImportRegistrants_SelectAllSubconferencesQuery,
    useSelectAllGroupsQuery,
    useSelectAllRegistrantsQuery,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { useConference } from "../../../useConference";

gql`
    mutation ImportRegistrants(
        $insertRegistrants: [registrant_Registrant_insert_input!]!
        $insertInvitations: [registrant_Invitation_insert_input!]!
        $insertGroupRegistrants: [registrant_GroupRegistrant_insert_input!]!
        $insertSubconferenceMemberships: [registrant_SubconferenceMembership_insert_input!]!
    ) {
        insert_registrant_Registrant(objects: $insertRegistrants) {
            affected_rows
        }
        insert_registrant_Invitation(objects: $insertInvitations) {
            affected_rows
        }
        insert_registrant_GroupRegistrant(
            objects: $insertGroupRegistrants
            on_conflict: { constraint: GroupRegistrant_groupId_registrantId_key, update_columns: [] }
        ) {
            affected_rows
        }
        insert_registrant_SubconferenceMembership(
            objects: $insertSubconferenceMemberships
            on_conflict: { constraint: SubconferenceMembership_subconferenceId_registrantId_key, update_columns: [] }
        ) {
            affected_rows
        }
    }

    fragment ImportRegistrants_Subconference on conference_Subconference {
        id
        shortName
    }

    query ImportRegistrants_SelectAllSubconferences($conferenceId: uuid!) {
        conference_Subconference(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ImportRegistrants_Subconference
        }
    }
`;

interface RegistrantFinalData {
    id: string;
    name: string;
    email: string;
    groups: {
        id: string;
        name: string;
    }[];
    missingGroups?: string[];
    subconferences: {
        id: string;
        shortName: string;
    }[];
    missingSubconferences?: string[];
    isNew: boolean;
}

export default function ImportPanel({
    data: inputData,
}: {
    data: Record<string, IntermediaryRegistrantData[]>;
}): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const [hasImported, setHasImported] = useState<boolean>(false);

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [{ fetching: groupsLoading, data: groupsData, error: groupsError }] = useSelectAllGroupsQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    useQueryErrorToast(groupsError, false);

    const [{ fetching: subconferencesLoading, data: subconferencesData, error: subconferencesError }] =
        useImportRegistrants_SelectAllSubconferencesQuery({
            requestPolicy: "network-only",
            variables: {
                conferenceId: conference.id,
            },
            context,
        });
    useQueryErrorToast(subconferencesError, false);

    const [{ fetching: registrantsLoading, data: registrantsData, error: registrantsError }, refetchRegistrants] =
        useSelectAllRegistrantsQuery({
            requestPolicy: "network-only",
            variables: {
                conferenceId: conference.id,
            },
            context,
        });
    useQueryErrorToast(registrantsError, false);

    const [{ fetching: importLoading, error: importError, data: importData }, importMutation] =
        useImportRegistrantsMutation();
    useQueryErrorToast(importError, false);

    const toast = useToast();
    useEffect(() => {
        if (importData?.insert_registrant_Registrant) {
            toast({
                title: `Imported ${importData.insert_registrant_Registrant.affected_rows} registrants. Added registrants to groups and subconferences.`,
                status: "success",
                duration: 3000,
                position: "bottom",
            });
            refetchRegistrants();
        }
    }, [importData?.insert_registrant_Registrant, refetchRegistrants, toast]);

    const finalData = useMemo(() => {
        return Object.values(inputData).reduce((acc, input) => {
            for (const row of input) {
                const email = row.email.trim().toLowerCase();
                const group = row.group?.length
                    ? groupsData?.registrant_Group.find(
                          (g) => g.name.trim().toLowerCase() === row.group?.trim().toLowerCase()
                      )
                    : undefined;
                const subconference = row.subconference?.length
                    ? subconferencesData?.conference_Subconference.find(
                          (g) => g.shortName.trim().toLowerCase() === row.subconference?.trim().toLowerCase()
                      )
                    : undefined;

                const existingFinal = acc.find((x) => x.email === email);
                if (existingFinal) {
                    if (group) {
                        const existingOriginal =
                            !existingFinal.isNew &&
                            registrantsData?.registrant_Registrant &&
                            registrantsData.registrant_Registrant.find((x) => x.id === existingFinal.id);
                        if (
                            !existingFinal.groups.some((x) => x.id === group.id) &&
                            (!existingOriginal ||
                                !existingOriginal.groupRegistrants.some((x) => x.groupId === group.id))
                        ) {
                            existingFinal.groups.push(group);
                        }
                    } else if (row.group?.length) {
                        if (!existingFinal.missingGroups) {
                            existingFinal.missingGroups = [row.group.trim()];
                        } else if (
                            !existingFinal.missingGroups.some(
                                (x) => x.toLowerCase() === row.group?.trim().toLowerCase()
                            )
                        ) {
                            existingFinal.missingGroups.push(row.group.trim());
                        }
                    }

                    if (subconference) {
                        const existingOriginal =
                            !existingFinal.isNew &&
                            registrantsData?.registrant_Registrant &&
                            registrantsData.registrant_Registrant.find((x) => x.id === existingFinal.id);
                        if (
                            !existingFinal.subconferences.some((x) => x.id === subconference.id) &&
                            (!existingOriginal ||
                                !existingOriginal.subconferenceMemberships.some(
                                    (x) => x.subconferenceId === subconference.id
                                ))
                        ) {
                            existingFinal.subconferences.push(subconference);
                        }
                    } else if (row.subconference?.length) {
                        if (!existingFinal.missingSubconferences) {
                            existingFinal.missingSubconferences = [row.subconference.trim()];
                        } else if (
                            !existingFinal.missingSubconferences.some(
                                (x) => x.toLowerCase() === row.subconference?.trim().toLowerCase()
                            )
                        ) {
                            existingFinal.missingSubconferences.push(row.subconference.trim());
                        }
                    }
                } else {
                    const existingOriginal =
                        registrantsData?.registrant_Registrant &&
                        registrantsData.registrant_Registrant.find((x) => {
                            return x.invitation && x.invitation.invitedEmailAddress.trim().toLowerCase() === email;
                        });
                    if (existingOriginal) {
                        if (
                            (!group && row.group?.length) ||
                            (!subconference && row.subconference?.length) ||
                            !existingOriginal.groupRegistrants.some((x) => x.groupId === group?.id) ||
                            !existingOriginal.subconferenceMemberships.some(
                                (x) => x.subconferenceId === subconference?.id
                            )
                        ) {
                            acc.push({
                                id: existingOriginal.id,
                                isNew: false,
                                email,
                                name: existingOriginal.displayName,
                                groups: group ? [group] : [],
                                missingGroups: !group && row.group ? [row.group.trim()] : undefined,
                                subconferences: subconference ? [subconference] : [],
                                missingSubconferences:
                                    !subconference && row.subconference ? [row.subconference.trim()] : undefined,
                            });
                        }
                    } else {
                        const name = row.name.trim();
                        acc.push({
                            id: uuidv4(),
                            isNew: true,
                            email,
                            name,
                            groups: group ? [group] : [],
                            missingGroups: !group && row.group ? [row.group.trim()] : undefined,
                            subconferences: subconference ? [subconference] : [],
                            missingSubconferences:
                                !subconference && row.subconference ? [row.subconference.trim()] : undefined,
                        });
                    }
                }
            }

            return acc;
        }, [] as RegistrantFinalData[]);
    }, [
        inputData,
        groupsData?.registrant_Group,
        subconferencesData?.conference_Subconference,
        registrantsData?.registrant_Registrant,
    ]);

    const missingGroups = useMemo<string[]>(
        () => [
            ...(finalData?.reduce<Set<string>>((acc, x) => {
                if (x.missingGroups) {
                    x.missingGroups.forEach((y) => acc.add(y));
                }
                return acc;
            }, new Set<string>()) ?? []),
        ],
        [finalData]
    );
    const missingSubconferences = useMemo<string[]>(
        () => [
            ...(finalData?.reduce<Set<string>>((acc, x) => {
                if (x.missingSubconferences) {
                    x.missingSubconferences.forEach((y) => acc.add(y));
                }
                return acc;
            }, new Set<string>()) ?? []),
        ],
        [finalData]
    );
    const noEmail = finalData.some((x) => x.email.length === 0);
    const noName = finalData.some((x) => x.name.length === 0);

    const totalInputLength = useMemo(
        () => Object.values(inputData).reduce((acc, rows) => acc + rows.length, 0),
        [inputData]
    );
    const totalOutputLength = useMemo(
        () => finalData?.reduce((acc, x) => acc + 1 + x.groups.length + x.subconferences.length, 0) ?? 0,
        [finalData]
    );
    const newRegistrantsCount = useMemo(
        () => finalData?.reduce((acc, x) => acc + (x.isNew ? 1 : 0), 0) ?? 0,
        [finalData]
    );
    const existingRegistrantsCount = useMemo(
        () =>
            finalData?.reduce(
                (acc, x) => acc + (!x.isNew && (x.groups.length > 0 || x.subconferences.length > 0) ? 1 : 0),
                0
            ) ?? 0,
        [finalData]
    );

    return (
        <VStack alignItems="flex-start" spacing={8}>
            <Alert
                status="info"
                variant="top-accent"
                flexDirection="column"
                alignItems="flex-start"
                justifyContent="center"
                minH="150px"
            >
                <HStack>
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle fontSize="lg">Please check over the data below, then click Import</AlertTitle>
                </HStack>
                <AlertDescription mt={4} mb={1}>
                    <Text as="b">This does NOT send invitation emails to registrants.</Text>
                    <Text>
                        All this does is import the list into the system - after importing, you will need to go to
                        Manage Registrants to send invitations.
                    </Text>
                </AlertDescription>
            </Alert>
            <HStack>
                <Button
                    colorScheme="purple"
                    isDisabled={
                        !!groupsError ||
                        !!registrantsError ||
                        !!subconferencesError ||
                        noName ||
                        noEmail ||
                        !!missingGroups.length ||
                        !!missingSubconferences.length
                    }
                    isLoading={groupsLoading || importLoading || registrantsLoading || subconferencesLoading}
                    onClick={() => {
                        const newRegistrants = finalData.filter((x) => x.isNew);
                        const newGroupRegistrants: Registrant_GroupRegistrant_Insert_Input[] = finalData
                            .filter((x) => !x.isNew)
                            .flatMap((x) =>
                                x.groups.map((y) => ({
                                    registrantId: x.id,
                                    groupId: y.id,
                                }))
                            );
                        const newSubconferenceMemberships: Registrant_SubconferenceMembership_Insert_Input[] = finalData
                            .filter((x) => !x.isNew)
                            .flatMap((x) =>
                                x.subconferences.map((y) => ({
                                    registrantId: x.id,
                                    subconferenceId: y.id,
                                    role: Registrant_RegistrantRole_Enum.Attendee,
                                }))
                            );

                        importMutation(
                            {
                                insertRegistrants: newRegistrants.map((x) => {
                                    return {
                                        id: x.id,
                                        conferenceId: conference.id,
                                        displayName: x.name,
                                        groupRegistrants: {
                                            data: x.groups.map((y) => ({
                                                groupId: y.id,
                                            })),
                                        },
                                        subconferenceMemberships: {
                                            data: x.subconferences.map((y) => ({
                                                subconferenceId: y.id,
                                                role: Registrant_RegistrantRole_Enum.Attendee,
                                            })),
                                        },
                                    };
                                }),
                                insertInvitations: newRegistrants.map((x) => ({
                                    registrantId: x.id,
                                    invitedEmailAddress: x.email,
                                })),
                                insertGroupRegistrants: newGroupRegistrants,
                                insertSubconferenceMemberships: newSubconferenceMemberships,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        );
                        setHasImported(true);
                    }}
                >
                    Import
                </Button>
                <LinkButton
                    to={`/conference/${conference.slug}/manage/registrants`}
                    colorScheme="red"
                    isDisabled={!!totalOutputLength && (!hasImported || importLoading)}
                >
                    Go to Manage Registrants
                </LinkButton>
            </HStack>
            {noName ? (
                <Alert
                    status="error"
                    variant="top-accent"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                >
                    <AlertIcon />
                    <AlertTitle>Error: One or more rows has no &lsquot;name&rsquot; value</AlertTitle>
                </Alert>
            ) : undefined}
            {noEmail ? (
                <Alert
                    status="error"
                    variant="top-accent"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                >
                    <AlertIcon />
                    <AlertTitle>Error: One or more rows has no &lsquot;email&rsquot; value</AlertTitle>
                </Alert>
            ) : undefined}
            {missingGroups.length && !groupsLoading ? (
                <Alert
                    status="error"
                    variant="top-accent"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                >
                    <HStack>
                        <AlertIcon />
                        <AlertTitle>Error: One or more rows has an invalid group</AlertTitle>
                    </HStack>
                    <AlertDescription>
                        <VStack alignItems="flex-start" spacing={2} my={2}>
                            <Text overflowWrap="normal">
                                Make sure you created any groups before importing registrants.
                            </Text>
                            <Text overflowWrap="normal">
                                Missing groups are:{" "}
                                {R.sortBy((x) => x, missingGroups)
                                    .reduce<string>((acc, x) => `${acc}, ${x}`, "")
                                    .substring(2)}
                            </Text>
                            <Text overflowWrap="normal">
                                {groupsData
                                    ? `Currently available groups are: ${R.sortBy(
                                          (x) => x.name,
                                          groupsData.registrant_Group
                                      )
                                          .reduce<string>((acc, x) => `${acc}, ${x.name}`, "")
                                          .substring(2)}`
                                    : "Unable to load the list of groups - please refresh to try again."}
                            </Text>
                            <LinkButton to={`/conference/${conference.slug}/manage/groups`} colorScheme="red" mt={2}>
                                Go to Manage Groups
                            </LinkButton>
                        </VStack>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {missingSubconferences.length && !subconferencesLoading ? (
                <Alert
                    status="error"
                    variant="top-accent"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                >
                    <HStack>
                        <AlertIcon />
                        <AlertTitle>Error: One or more rows has an invalid subconference</AlertTitle>
                    </HStack>
                    <AlertDescription>
                        <VStack alignItems="flex-start" spacing={2} my={2}>
                            <Text overflowWrap="normal">
                                Make sure you created any subconferences before importing registrants.
                            </Text>
                            <Text overflowWrap="normal">
                                Missing subconferences are:{" "}
                                {R.sortBy((x) => x, missingSubconferences)
                                    .reduce<string>((acc, x) => `${acc}, ${x}`, "")
                                    .substring(2)}
                            </Text>
                            <Text overflowWrap="normal">
                                {subconferencesData
                                    ? `Currently available subconferences are: ${R.sortBy(
                                          (x) => x.shortName,
                                          subconferencesData.conference_Subconference
                                      )
                                          .reduce<string>((acc, x) => `${acc}, ${x.shortName}`, "")
                                          .substring(2)}`
                                    : "Unable to load the list of subconferences - please refresh to try again."}
                            </Text>
                            <LinkButton
                                to={`/conference/${conference.slug}/manage/subconferences`}
                                colorScheme="red"
                                mt={2}
                            >
                                Go to Manage Subconferences
                            </LinkButton>
                        </VStack>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {!noName &&
            !noEmail &&
            !missingGroups.length &&
            !groupsLoading &&
            !missingSubconferences.length &&
            !subconferencesLoading &&
            totalOutputLength < totalInputLength ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>
                        Your selected data has been de-duplicated against existing Midspace data based on email address.
                    </AlertTitle>
                </Alert>
            ) : undefined}
            {!noName &&
            !noEmail &&
            !missingGroups.length &&
            !groupsLoading &&
            !missingSubconferences.length &&
            !subconferencesLoading ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>
                        {newRegistrantsCount} new registrants will be imported.
                        <br />
                        {existingRegistrantsCount} existing registrants will be added to more groups and subconferences.
                    </AlertTitle>
                    {totalOutputLength < totalInputLength ? (
                        <AlertDescription>
                            ({totalInputLength - totalOutputLength} group and subconference assignments were
                            de-duplicated)
                        </AlertDescription>
                    ) : undefined}
                </Alert>
            ) : undefined}
            <Box overflowX="auto" maxW="100%" w="100%">
                <Table colorScheme="pink" variant="striped">
                    <Thead>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Groups</Th>
                        <Th>Subconferences</Th>
                    </Thead>
                    <Tbody>
                        {finalData
                            .sort((x, y) => x.name.localeCompare(y.name))
                            .map((x) => (
                                <Tr key={x.id}>
                                    <Td>{x.name}</Td>
                                    <Td>{x.email}</Td>
                                    <Td>{x.groups.map((y) => y.name).join(", ")}</Td>
                                    <Td>{x.subconferences.map((y) => y.shortName).join(", ")}</Td>
                                </Tr>
                            ))}
                        {totalOutputLength === 0 ? (
                            <Tr>
                                <Td>No new data to import</Td>
                                <Td></Td>
                                <Td></Td>
                                <Td></Td>
                            </Tr>
                        ) : undefined}
                    </Tbody>
                </Table>
            </Box>
        </VStack>
    );
}
