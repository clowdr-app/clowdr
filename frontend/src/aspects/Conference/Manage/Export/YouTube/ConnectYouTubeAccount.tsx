import type { BoxProps } from "@chakra-ui/react";
import { Box, Button, Heading, HStack, List, ListItem, useId, useIds, useToast } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useCallback, useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import type { ManageExport_RegistrantGoogleAccountFragment } from "../../../../../generated/graphql";
import {
    useManageExport_DeleteRegistrantGoogleAccountMutation,
    useManageExport_GetGoogleOAuthUrlMutation,
} from "../../../../../generated/graphql";
import { useGoogleOAuthRedirectPath } from "../../../../Google/useGoogleOAuthRedirectUrl";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import { FAIcon } from "../../../../Icons/FAIcon";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { YouTubeExportContext } from "./YouTubeExportContext";

gql`
    mutation ManageExport_GetGoogleOAuthUrl($registrantId: uuid!, $scopes: [String!]!) {
        getGoogleOAuthUrl(registrantId: $registrantId, scopes: $scopes) {
            url
        }
    }

    query ManageExport_GetRegistrantGoogleAccounts($registrantId: uuid!) {
        registrant_GoogleAccount(where: { registrantId: { _eq: $registrantId } }) {
            ...ManageExport_RegistrantGoogleAccount
        }
    }

    fragment ManageExport_RegistrantGoogleAccount on registrant_GoogleAccount {
        id
        googleAccountEmail
        youTubeData
    }

    mutation ManageExport_DeleteRegistrantGoogleAccount($registrantGoogleAccountId: uuid!) {
        delete_registrant_GoogleAccount_by_pk(id: $registrantGoogleAccountId) {
            id
        }
    }
`;
export function ConnectYouTubeAccount(props: BoxProps): JSX.Element {
    const toast = useToast();

    const [, mutation] = useManageExport_GetGoogleOAuthUrlMutation();

    const registrant = useCurrentRegistrant();

    const { googleAccounts, selectedGoogleAccountId, setSelectedGoogleAccountId, finished } =
        useContext(YouTubeExportContext);

    const [, deleteAccount] = useManageExport_DeleteRegistrantGoogleAccountMutation();
    const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});

    const history = useHistory();
    const [, setGoogleOAuthRedirectUrl] = useGoogleOAuthRedirectPath();

    const optionIdSuffix = useId();
    const optionIds = useIds(
        optionIdSuffix,
        ...(googleAccounts[0].data?.registrant_GoogleAccount?.map((x) => x.id) ?? [])
    );

    const disconnectAccount = useCallback(
        async (accountId: string) => {
            setDeleting((x) => R.set(R.lensProp(accountId), true, x));
            try {
                await deleteAccount({
                    registrantGoogleAccountId: accountId,
                });
                await googleAccounts[1]();
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
                setDeleting((x) => R.set(R.lensProp(accountId), false, x));
            }
        },
        [deleteAccount, googleAccounts, toast]
    );

    const addAccount = useCallback(async () => {
        try {
            const urlResult = await mutation({
                registrantId: registrant.id,
                scopes: [
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube.readonly",
                    "https://www.googleapis.com/auth/youtube.force-ssl",
                ],
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
    }, [history.location.pathname, mutation, registrant.id, setGoogleOAuthRedirectUrl, toast]);

    return finished ? (
        <></>
    ) : (
        <Box {...props}>
            <HStack justifyContent="space-between" mb={2}>
                <Heading as="h3" size="md" textAlign="left" mb={2}>
                    Choose a connected account
                </Heading>
                <Button
                    display="block"
                    colorScheme="PrimaryActionButton"
                    onClick={addAccount}
                    mt={2}
                    ml="auto"
                    size="sm"
                >
                    <FAIcon icon="plus" iconStyle="s" mr={2} />
                    Add a YouTube account
                </Button>
            </HStack>
            <QueryWrapper getter={(data) => data.registrant_GoogleAccount} queryResult={googleAccounts[0]}>
                {(accounts: readonly ManageExport_RegistrantGoogleAccountFragment[]) => (
                    <List
                        role="listbox"
                        aria-activedescendant={
                            selectedGoogleAccountId ? `${selectedGoogleAccountId}-${optionIdSuffix}` : undefined
                        }
                        spacing={2}
                    >
                        {accounts.map((account, idx) => (
                            <ListItem key={account.id}>
                                <HStack gridColumnGap={2} flex={1} borderRadius="sm" overflow="hidden">
                                    <Button
                                        id={optionIds[idx]}
                                        aria-selected={selectedGoogleAccountId === account.id}
                                        isActive={selectedGoogleAccountId === account.id ? true : false}
                                        isDisabled={Boolean(selectedGoogleAccountId)}
                                        colorScheme="SecondaryActionButton"
                                        role="option"
                                        onClick={() => setSelectedGoogleAccountId(account.id)}
                                        leftIcon={<FAIcon icon="youtube" iconStyle="b" />}
                                        textAlign="left"
                                    >
                                        {account.googleAccountEmail}
                                    </Button>
                                    <Button
                                        aria-label="disconnect account"
                                        style={{ marginLeft: "auto" }}
                                        isDisabled={Boolean(selectedGoogleAccountId)}
                                        colorScheme="red"
                                        size="sm"
                                        isLoading={!!deleting[account.id]}
                                        onClick={() => disconnectAccount(account.id)}
                                    >
                                        <FAIcon icon="unlink" iconStyle="s" />
                                    </Button>
                                </HStack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </QueryWrapper>
            {selectedGoogleAccountId && (
                <Button
                    display="block"
                    colorScheme="SecondaryActionButton"
                    onClick={() => setSelectedGoogleAccountId(null)}
                    mt={2}
                    ml="auto"
                    size="sm"
                >
                    Cancel
                </Button>
            )}
        </Box>
    );
}
