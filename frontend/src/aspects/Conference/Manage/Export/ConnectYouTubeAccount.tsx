import { gql } from "@apollo/client";
import { Button, Heading, HStack, List, ListItem, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
    ManageConferenceExportPage_RegistrantGoogleAccountFragment,
    useManageConferenceExportPage_DeleteRegistrantGoogleAccountMutation,
    useManageConferenceExportPage_GetGoogleOAuthUrlMutation,
    useManageConferenceExportPage_GetRegistrantGoogleAccountsQuery,
} from "../../../../generated/graphql";
import { useGoogleOAuthRedirectPath } from "../../../Google/useGoogleOAuthRedirectUrl";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    mutation ManageConferenceExportPage_GetGoogleOAuthUrl($registrantId: uuid!, $scopes: [String!]!) {
        getGoogleOAuthUrl(registrantId: $registrantId, scopes: $scopes) {
            url
        }
    }

    query ManageConferenceExportPage_GetRegistrantGoogleAccounts($registrantId: uuid!) {
        registrant_GoogleAccount(where: { registrantId: { _eq: $registrantId } }) {
            ...ManageConferenceExportPage_RegistrantGoogleAccount
        }
    }

    fragment ManageConferenceExportPage_RegistrantGoogleAccount on registrant_GoogleAccount {
        id
        googleAccountEmail
    }

    mutation ManageConferenceExportPage_DeleteRegistrantGoogleAccount($registrantGoogleAccountId: uuid!) {
        delete_registrant_GoogleAccount_by_pk(id: $registrantGoogleAccountId) {
            id
        }
    }
`;
export function ConnectYouTubeAccount(): JSX.Element {
    const listItemBgColour = useColorModeValue("gray.100", "gray.700");
    const toast = useToast();

    const [mutation] = useManageConferenceExportPage_GetGoogleOAuthUrlMutation();

    const registrant = useCurrentRegistrant();
    const result = useManageConferenceExportPage_GetRegistrantGoogleAccountsQuery({
        variables: {
            registrantId: registrant?.id,
        },
    });

    const [deleteAccount] = useManageConferenceExportPage_DeleteRegistrantGoogleAccountMutation();
    const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});

    const history = useHistory();
    const [, setGoogleOAuthRedirectUrl] = useGoogleOAuthRedirectPath();

    return (
        <>
            <Heading as="h3" size="md" textAlign="left" mb={2}>
                Connected accounts
            </Heading>
            <ApolloQueryWrapper getter={(data) => data.registrant_GoogleAccount} queryResult={result}>
                {(accounts: readonly ManageConferenceExportPage_RegistrantGoogleAccountFragment[]) => (
                    <List>
                        {accounts.map((account) => (
                            <ListItem
                                key={account.id}
                                p={2}
                                pl={4}
                                my={2}
                                bgColor={listItemBgColour}
                                borderRadius="sm"
                                overflow="hidden"
                            >
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
                                                    variables: { registrantGoogleAccountId: account.id },
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
                                registrantId: registrant.id,
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

                        setGoogleOAuthRedirectUrl(history.location.pathname);
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
