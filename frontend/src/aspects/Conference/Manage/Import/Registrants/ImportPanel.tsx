import { gql } from "@apollo/client";
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
import type { IntermediaryRegistrantData } from "@clowdr-app/shared-types/build/import/intermediary";
import assert from "assert";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Permissions_GroupRegistrant_Insert_Input,
    useImportRegistrantsMutation,
    useSelectAllGroupsQuery,
    useSelectAllRegistrantsQuery,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { useConference } from "../../../useConference";

gql`
    mutation ImportRegistrants(
        $insertRegistrants: [registrant_Registrant_insert_input!]!
        $insertInvitations: [registrant_Invitation_insert_input!]!
        $insertGroupRegistrants: [permissions_GroupRegistrant_insert_input!]!
    ) {
        insert_registrant_Registrant(objects: $insertRegistrants) {
            affected_rows
        }
        insert_registrant_Invitation(objects: $insertInvitations) {
            affected_rows
        }
        insert_permissions_GroupRegistrant(objects: $insertGroupRegistrants) {
            affected_rows
        }
    }
`;

interface RegistrantFinalData {
    id: string;
    name: string;
    email: string;
    group:
        | undefined
        | {
              id: string;
              name: string;
          };
    isNew: boolean;
}

export default function ImportPanel({
    data: inputData,
}: {
    data: Record<string, IntermediaryRegistrantData[]>;
}): JSX.Element {
    const conference = useConference();
    const [hasImported, setHasImported] = useState<boolean>(false);

    const {
        loading: groupsLoading,
        data: groupsData,
        error: groupsError,
    } = useSelectAllGroupsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(groupsError, false);

    const {
        loading: registrantsLoading,
        data: registrantsData,
        error: registrantsError,
        refetch: refetchRegistrants,
    } = useSelectAllRegistrantsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(registrantsError, false);

    const [importMutation, { loading: importLoading, error: importError, data: importData }] =
        useImportRegistrantsMutation();
    useQueryErrorToast(importError, false);

    const toast = useToast();
    useEffect(() => {
        if (importData?.insert_registrant_Registrant) {
            toast({
                title: `Imported ${importData.insert_registrant_Registrant.affected_rows / 2} registrants`,
                status: "success",
                duration: 3000,
                position: "bottom",
            });
            refetchRegistrants();
        }
    }, [importData?.insert_registrant_Registrant, refetchRegistrants, toast]);

    const finalData = useMemo(() => {
        const firstPass = Object.values(inputData).reduce(
            (acc, input) => [
                ...acc,
                ...input
                    .map((row) => ({
                        ...row,
                        name: row.name.trim(),
                        email: row.email.trim().toLowerCase(),
                    }))
                    // Remove duplicates as compared to the existing data
                    .reduce<RegistrantFinalData[]>((acc, row) => {
                        const group = groupsData?.permissions_Group.find(
                            (g) => g.name.toLowerCase() === row.group.toLowerCase()
                        );

                        const existingRegistrant =
                            registrantsData?.registrant_Registrant &&
                            registrantsData.registrant_Registrant.find((x) => {
                                return x.invitation && x.invitation.invitedEmailAddress === row.email;
                            });

                        if (existingRegistrant) {
                            if (!existingRegistrant.groupRegistrants.some((ga) => ga.groupId === group?.id)) {
                                return [
                                    ...acc,
                                    {
                                        name: row.name,
                                        email: row.email,
                                        id: existingRegistrant.id,
                                        group,
                                        isNew: false,
                                    },
                                ];
                            } else {
                                return acc;
                            }
                        } else {
                            return [
                                ...acc,
                                {
                                    name: row.name,
                                    email: row.email,
                                    id: uuidv4(),
                                    group,
                                    isNew: true,
                                },
                            ];
                        }
                    }, []),
            ],
            [] as RegistrantFinalData[]
        );

        // Remove duplicates as compared to the provided data
        return firstPass.filter(
            (row1, index1) => !firstPass.some((row2, index2) => index2 < index1 && row2.email === row1.email)
        );
    }, [registrantsData?.registrant_Registrant, groupsData?.permissions_Group, inputData]);

    const noGroup = finalData.some((x) => !x.group);
    const noEmail = finalData.some((x) => x.email.length === 0);
    const noName = finalData.some((x) => x.name.length === 0);

    const totalInputLength = useMemo(
        () => Object.values(inputData).reduce((acc, rows) => acc + rows.length, 0),
        [inputData]
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
                    isDisabled={!!groupsError || !!registrantsError || noName || noEmail || noGroup}
                    isLoading={groupsLoading || importLoading || registrantsLoading}
                    onClick={() => {
                        const newRegistrants = finalData.filter((x) => x.isNew);
                        const newGroupRegistrants: Permissions_GroupRegistrant_Insert_Input[] = finalData
                            .filter((x) => !x.isNew)
                            .map((x) => ({
                                registrantId: x.id,
                                groupId: x.group?.id,
                            }));

                        importMutation({
                            variables: {
                                insertRegistrants: newRegistrants.map((x) => {
                                    assert(x.group);
                                    return {
                                        id: x.id,
                                        conferenceId: conference.id,
                                        displayName: x.name,
                                        groupRegistrants: {
                                            data: [
                                                {
                                                    groupId: x.group.id,
                                                },
                                            ],
                                        },
                                    };
                                }),
                                insertInvitations: newRegistrants.map((x) => ({
                                    registrantId: x.id,
                                    invitedEmailAddress: x.email,
                                })),
                                insertGroupRegistrants: newGroupRegistrants,
                            },
                        });
                        setHasImported(true);
                    }}
                >
                    Import
                </Button>
                <LinkButton
                    to={`/conference/${conference.slug}/manage/registrants`}
                    colorScheme="red"
                    isDisabled={!!finalData?.length && (!hasImported || importLoading)}
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
            {noGroup && !groupsLoading ? (
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
                                {groupsData
                                    ? `Currently available groups are: ${R.sortBy(
                                          (x) => x.name,
                                          groupsData.permissions_Group
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
            {!noName && !noEmail && !noGroup && !groupsLoading && finalData.length < totalInputLength ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>
                        Your selected data has been de-duplicated against existing Midspace data based on email address.
                    </AlertTitle>
                </Alert>
            ) : undefined}
            {!noName && !noEmail && !noGroup && !groupsLoading ? (
                <Alert>
                    <AlertIcon />
                    <AlertTitle>{finalData.length} unique registrant-group pairs will be imported.</AlertTitle>
                    {finalData.length < totalInputLength ? (
                        <AlertDescription>
                            ({totalInputLength - finalData.length} were ignored due to de-duplication)
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
                                    <Td>{x.group?.name}</Td>
                                </Tr>
                            ))}
                        {finalData.length === 0 ? (
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
