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
import type { Registrant_GroupRegistrant_Insert_Input } from "../../../../../generated/graphql";
import {
    useImportRegistrantsMutation,
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
    ) {
        insert_registrant_Registrant(objects: $insertRegistrants) {
            affected_rows
        }
        insert_registrant_Invitation(objects: $insertInvitations) {
            affected_rows
        }
        insert_registrant_GroupRegistrant(objects: $insertGroupRegistrants) {
            affected_rows
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
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [{ fetching: groupsLoading, data: groupsData, error: groupsError }] = useSelectAllGroupsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    useQueryErrorToast(groupsError, false);

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
                title: `Imported ${importData.insert_registrant_Registrant.affected_rows} registrants. Added registrants to groups.`,
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
                } else {
                    const existingOriginal =
                        registrantsData?.registrant_Registrant &&
                        registrantsData.registrant_Registrant.find((x) => {
                            return x.invitation && x.invitation.invitedEmailAddress.trim().toLowerCase() === email;
                        });
                    if (existingOriginal) {
                        if (!group || !existingOriginal.groupRegistrants.some((x) => x.groupId === group.id)) {
                            acc.push({
                                id: existingOriginal.id,
                                isNew: false,
                                email,
                                name: existingOriginal.displayName,
                                groups: group ? [group] : [],
                                missingGroups: !group && row.group ? [row.group.trim()] : undefined,
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
                        });
                    }
                }
            }

            return acc;
        }, [] as RegistrantFinalData[]);
    }, [registrantsData?.registrant_Registrant, groupsData?.registrant_Group, inputData]);

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
    const noEmail = finalData.some((x) => x.email.length === 0);
    const noName = finalData.some((x) => x.name.length === 0);

    const totalInputLength = useMemo(
        () => Object.values(inputData).reduce((acc, rows) => acc + rows.length, 0),
        [inputData]
    );
    const totalOutputLength = useMemo(
        () => finalData?.reduce((acc, x) => acc + 1 + x.groups.length, 0) ?? 0,
        [finalData]
    );
    const newRegistrantsCount = useMemo(
        () => finalData?.reduce((acc, x) => acc + (x.isNew ? 1 : 0), 0) ?? 0,
        [finalData]
    );
    const existingRegistrantsCount = useMemo(
        () => finalData?.reduce((acc, x) => acc + (!x.isNew && x.groups.length > 0 ? 1 : 0), 0) ?? 0,
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
                    isDisabled={!!groupsError || !!registrantsError || noName || noEmail || !!missingGroups.length}
                    isLoading={groupsLoading || importLoading || registrantsLoading}
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
                                    };
                                }),
                                insertInvitations: newRegistrants.map((x) => ({
                                    registrantId: x.id,
                                    invitedEmailAddress: x.email,
                                })),
                                insertGroupRegistrants: newGroupRegistrants,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
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
            {!noName && !noEmail && !missingGroups.length && !groupsLoading && totalOutputLength < totalInputLength ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>
                        Your selected data has been de-duplicated against existing Midspace data based on email address.
                    </AlertTitle>
                </Alert>
            ) : undefined}
            {!noName && !noEmail && !missingGroups.length && !groupsLoading ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>
                        {newRegistrantsCount} new registrants will be imported.
                        <br />
                        {existingRegistrantsCount} existing registrants will be added to more groups.
                    </AlertTitle>
                    {totalOutputLength < totalInputLength ? (
                        <AlertDescription>
                            ({totalInputLength - totalOutputLength} group assignments were de-duplicated)
                        </AlertDescription>
                    ) : undefined}
                </Alert>
            ) : undefined}
            <Box overflowX="auto" maxW="100%" w="100%">
                <Table colorScheme="pink" variant="striped">
                    <Thead>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Group</Th>
                    </Thead>
                    <Tbody>
                        {finalData
                            .sort((x, y) => x.name.localeCompare(y.name))
                            .map((x) => (
                                <Tr key={x.id}>
                                    <Td>{x.name}</Td>
                                    <Td>{x.email}</Td>
                                    <Td>{x.groups.map((y) => y.name).join(", ")}</Td>
                                </Tr>
                            ))}
                        {totalOutputLength === 0 ? (
                            <Tr>
                                <Td>No new data to import</Td>
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
