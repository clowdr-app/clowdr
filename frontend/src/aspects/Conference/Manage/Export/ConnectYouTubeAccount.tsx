import { gql } from "@apollo/client";
import { Button, Heading, HStack, List, ListItem, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useState } from "react";
import {
    ManageConferenceExportPage_AttendeeGoogleAccountFragment,
    useManageConferenceExportPage_DeleteAttendeeGoogleAccountMutation,
    useManageConferenceExportPage_GetAttendeeGoogleAccountsQuery,
    useManageConferenceExportPage_GetGoogleOAuthUrlMutation,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import useCurrentAttendee from "../../useCurrentAttendee";

gql`
    mutation ManageConferenceExportPage_GetGoogleOAuthUrl($scopes: [String!]!) {
        getGoogleOAuthUrl(scopes: $scopes) {
            url
        }
    }

    query ManageConferenceExportPage_GetAttendeeGoogleAccounts($attendeeId: uuid!) {
        AttendeeGoogleAccount(where: { attendeeId: { _eq: $attendeeId } }) {
            ...ManageConferenceExportPage_AttendeeGoogleAccount
        }
    }

    fragment ManageConferenceExportPage_AttendeeGoogleAccount on AttendeeGoogleAccount {
        id
        googleAccountEmail
    }

    mutation ManageConferenceExportPage_DeleteAttendeeGoogleAccount($attendeeGoogleAccountId: uuid!) {
        delete_AttendeeGoogleAccount_by_pk(id: $attendeeGoogleAccountId) {
            id
        }
    }
`;
export function ConnectYouTubeAccount(): JSX.Element {
    const listItemBgColour = useColorModeValue("gray.200", "gray.700");
    const toast = useToast();

    const [mutation] = useManageConferenceExportPage_GetGoogleOAuthUrlMutation();

    const attendee = useCurrentAttendee();
    const result = useManageConferenceExportPage_GetAttendeeGoogleAccountsQuery({
        variables: {
            attendeeId: attendee?.id,
        },
    });

    const [deleteAccount] = useManageConferenceExportPage_DeleteAttendeeGoogleAccountMutation();
    const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});

    return (
        <>
            <Heading as="h3" size="md" textAlign="left" mb={2}>
                Connected accounts
            </Heading>
            <ApolloQueryWrapper getter={(data) => data.AttendeeGoogleAccount} queryResult={result}>
                {(accounts: readonly ManageConferenceExportPage_AttendeeGoogleAccountFragment[]) => (
                    <List>
                        {accounts.map((account) => (
                            <ListItem key={account.id} p={2} pl={4} my={2} bgColor={listItemBgColour}>
                                <HStack>
                                    <FAIcon icon="youtube" iconStyle="b" />
                                    <Text>{account.googleAccountEmail}</Text>
                                    <Button
                                        aria-label="disconnect account"
                                        style={{ marginLeft: "auto" }}
                                        colorScheme="red"
                                        size="sm"
                                        isLoading={!!deleting[account.id]}
                                        onClick={async () => {
                                            setDeleting((x) => R.set(R.lensProp(account.id), true, x));
                                            try {
                                                await deleteAccount({
                                                    variables: { attendeeGoogleAccountId: account.id },
                                                });
                                                await result.refetch();
                                                toast({
                                                    status: "success",
                                                    title: "Unlinked YouTube account.",
                                                });
                                            } catch (e) {
                                                toast({
                                                    status: "error",
                                                    title: "Failed to unlink YouTube account. Try again later.",
                                                });
                                            } finally {
                                                setDeleting((x) => R.set(R.lensProp(account.id), false, x));
                                            }
                                        }}
                                    >
                                        <FAIcon icon="unlink" iconStyle="s" />
                                    </Button>
                                </HStack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </ApolloQueryWrapper>
            <Button
                display="block"
                onClick={async () => {
                    try {
                        const urlResult = await mutation({
                            variables: {
                                scopes: [
                                    "https://www.googleapis.com/auth/youtube.upload",
                                    "https://www.googleapis.com/auth/youtube.readonly",
                                    "https://www.googleapis.com/auth/youtube.force-ssl",
                                ],
                            },
                        });

                        if (!urlResult.data?.getGoogleOAuthUrl) {
                            throw new Error("Could not retrieve Google OAuth URL");
                        }

                        window.location.href = urlResult.data?.getGoogleOAuthUrl?.url;
                    } catch (e) {
                        console.error("Failed to connect to YouTube", e);
                        toast({
                            title: "Failed to connect to YouTube",
                            status: "error",
                        });
                    }
                }}
                mt={2}
            >
                <FAIcon icon="plus" iconStyle="s" mr={2} />
                Connect to YouTube
            </Button>
        </>
    );
}
