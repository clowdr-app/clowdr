import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertTitle,
    Button,
    ButtonGroup,
    chakra,
    Code,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Select,
    Tooltip,
    useClipboard,
    useDisclosure,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { LegacyRef } from "react";
import React, { useMemo, useState } from "react";
import { gql } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    SuPermissionGrantFragment,
    System_ConfigurationPermissionGrant,
    System_SuperUserPermissionGrant,
} from "../../../generated/graphql";
import {
    System_ConfigurationKey_Enum,
    System_SuperUserPermission_Enum,
    useDeleteSuPermissionGrantsMutation,
    useInitialiseRoleForUserMutation,
    useInsertSuPermissionGrantMutation,
    useSelectSuPermissionsQuery,
    useSuPermissionGrants_AllUsersQuery,
    useUserSuPermissionsQuery,
} from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";
import { TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    Delete,
    Insert,
    RowSpecification,
} from "../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../CRUDTable2/CRUDTable2";
import { makeContext } from "../../GQL/make-context";
import useCurrentUser from "../../Users/CurrentUser/useCurrentUser";

gql`
    fragment SUPermissionGrant on system_SuperUserPermissionGrant {
        id
        created_at
        updated_at
        grantedPermissionName
        userId
        targetPermissionName
    }

    query UserSUPermissions($userId: String!) {
        system_SuperUserPermissionGrant(where: { userId: { _eq: $userId } }) {
            ...SUPermissionGrant
        }
    }

    query SelectSUPermissions {
        system_SuperUserPermissionGrant {
            ...SUPermissionGrant
        }
    }

    query SUPermissionGrants_AllUsers {
        User {
            id
            email
        }
    }

    mutation InsertSUPermissionGrant($object: system_SuperUserPermissionGrant_insert_input!) {
        insert_system_SuperUserPermissionGrant_one(object: $object) {
            ...SUPermissionGrant
        }
    }

    mutation DeleteSUPermissionGrants($ids: [uuid!]!) {
        delete_system_SuperUserPermissionGrant(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }

    mutation InitialiseRoleForUser(
        $suPermGrants: [system_SuperUserPermissionGrant_insert_input!]!
        $sysConfigPermGrants: [system_ConfigurationPermissionGrant_insert_input!]!
    ) {
        insert_system_SuperUserPermissionGrant(
            objects: $suPermGrants
            on_conflict: {
                constraint: SuperUserPermissionGrant_grantedPermissionName_userId_targe_key
                update_columns: []
            }
        ) {
            affected_rows
        }
        insert_system_ConfigurationPermissionGrant(
            objects: $sysConfigPermGrants
            on_conflict: {
                constraint: ConfigurationPermissionGrant_permissionName_configurationKey_us
                update_columns: []
            }
        ) {
            affected_rows
        }
    }
`;

interface Role {
    name: string;
    suPermissions: Pick<System_SuperUserPermissionGrant, "grantedPermissionName" | "targetPermissionName">[];
    sysConfigPermissions: Pick<System_ConfigurationPermissionGrant, "configurationKey" | "permissionName">[];
}

const Roles: Role[] = [
    {
        name: "Grand Superuser",
        suPermissions: [
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
        ],
        sysConfigPermissions: [],
    },
    {
        name: "Superuser",
        suPermissions: [
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewUsers,
            },

            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewUsers,
            },

            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewUsers,
            },
        ],
        sysConfigPermissions: [],
    },
    {
        name: "Overseer",
        suPermissions: [
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
                targetPermissionName: System_SuperUserPermission_Enum.ViewUsers,
            },

            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.InsertSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },

            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSuPermissionGrant,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteSuPermission,
                targetPermissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
            },
        ],
        sysConfigPermissions: [
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.AllowEmailsToDomains,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultFrontendHost,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultVideoRoomBackend,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.HostOrganisationName,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridApiKey,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridReplyto,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridSender,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.StopEmailsContactEmailAddress,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.VapidPrivateKey,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.VapidPublicKey,
            },
        ],
    },
    {
        name: "System Admin",
        suPermissions: [],
        sysConfigPermissions: [
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.AllowEmailsToDomains,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultFrontendHost,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultVideoRoomBackend,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.HostOrganisationName,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridApiKey,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridReplyto,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridSender,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.StopEmailsContactEmailAddress,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.VapidPrivateKey,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.VapidPublicKey,
            },

            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultVideoRoomBackend,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridApiKey,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.DefaultFrontendHost,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.AllowEmailsToDomains,
            },
        ],
    },
    {
        name: "Operations",
        suPermissions: [
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ListConferenceDemoCodes,
                targetPermissionName: null,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.CreateConferenceDemoCode,
                targetPermissionName: null,
            },
        ],
        sysConfigPermissions: [],
    },
    {
        name: "Legal",
        suPermissions: [],
        sysConfigPermissions: [
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.CookiePolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.HostOrganisationName,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.HostOrganisationName,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.PrivacyPolicyUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsUrl,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.TermsUrl,
            },
        ],
    },
    {
        name: "Communications",
        suPermissions: [],
        sysConfigPermissions: [
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridReplyto,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridReplyto,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridSender,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.SendgridSender,
            },
            {
                permissionName: System_SuperUserPermission_Enum.ViewSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.StopEmailsContactEmailAddress,
            },
            {
                permissionName: System_SuperUserPermission_Enum.SetSystemConfiguration,
                configurationKey: System_ConfigurationKey_Enum.StopEmailsContactEmailAddress,
            },
        ],
    },
    {
        name: "Support",
        suPermissions: [
            {
                grantedPermissionName: System_SuperUserPermission_Enum.ViewUsers,
                targetPermissionName: null,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.DeleteUsers,
                targetPermissionName: null,
            },
            {
                grantedPermissionName: System_SuperUserPermission_Enum.EditUserRegistrants,
                targetPermissionName: null,
            },
        ],
        sysConfigPermissions: [],
    },
];

export default function SUPermissionGrants(): JSX.Element {
    const currentUser = useCurrentUser();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Superuser,
            }),
        []
    );
    const [currentUserPermissionsResponse] = useUserSuPermissionsQuery({
        variables: {
            userId: currentUser.user.id,
        },
        context,
        requestPolicy: "network-only",
    });
    const [allUsersResponse] = useSuPermissionGrants_AllUsersQuery({
        context,
    });

    const insertablePermissionNames = useMemo(
        () =>
            currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant
                .filter(
                    (x) =>
                        x.grantedPermissionName === System_SuperUserPermission_Enum.InsertSuPermission &&
                        x.targetPermissionName
                )
                .map((x) => x.targetPermissionName)
                .sort(),
        [currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant]
    );
    const deletablePermissionNames = useMemo(
        () =>
            currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant
                .filter(
                    (x) =>
                        x.grantedPermissionName === System_SuperUserPermission_Enum.DeleteSuPermission &&
                        x.targetPermissionName
                )
                .map((x) => x.targetPermissionName)
                .sort(),
        [currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant]
    );

    const [allPermissionsResponse] = useSelectSuPermissionsQuery({
        context,
        requestPolicy: "network-only",
    });

    const row: RowSpecification<SuPermissionGrantFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (record) => !!deletablePermissionNames?.includes(record.grantedPermissionName) || "",
            canDelete: (record) =>
                !!deletablePermissionNames?.includes(record.grantedPermissionName) ||
                "You do not have permission to delete this.",
            invalid: (record) => {
                if (!record.userId) {
                    return {
                        reason: "User not found",
                        columnId: "user-id",
                    };
                }

                if (!record.grantedPermissionName?.length) {
                    return {
                        reason: "Granted permission not chosen",
                        columnId: "granted-permission",
                    };
                }

                if (
                    record.grantedPermissionName === System_SuperUserPermission_Enum.DeleteSuPermission ||
                    record.grantedPermissionName === System_SuperUserPermission_Enum.InsertSuPermission ||
                    record.grantedPermissionName === System_SuperUserPermission_Enum.ViewSuPermissionGrant
                ) {
                    if (!record.targetPermissionName?.length) {
                        return {
                            reason: "Target permission not chosen",
                            columnId: "target-permission",
                        };
                    }
                } else {
                    if (record.targetPermissionName?.length) {
                        return {
                            reason: "A target permission has been chosen but should be NULL",
                            columnId: "target-permission",
                        };
                    }
                }

                return false;
            },
            pages: {
                defaultToLast: false,
            },
        }),
        [deletablePermissionNames]
    );

    const rolesCanCreate = useMemo(
        () =>
            insertablePermissionNames &&
            Roles.filter(
                (role) =>
                    role.suPermissions.every((perm) =>
                        insertablePermissionNames.includes(perm.grantedPermissionName)
                    ) &&
                    role.sysConfigPermissions.every((perm) => insertablePermissionNames.includes(perm.permissionName))
            ).map((x) => x.name),
        [insertablePermissionNames]
    );

    const columns: ColumnSpecification<SuPermissionGrantFragment>[] = useMemo(
        () => [
            {
                id: "user-email",
                defaultSortDirection: SortDirection.Asc,
                header: function EmailHeader(props: ColumnHeaderProps<SuPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>User Email</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            User Email{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => allUsersResponse.data?.User.find((x) => x.id === data.userId)?.email ?? "Unknown",
                set: (data, value) => {
                    const user = allUsersResponse.data?.User.find((x) => x.email === value);
                    data.userId = user?.id;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SuPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter((row) => {
                            const user = allUsersResponse.data?.User.find((x) => x.id === row.userId);
                            return !!user?.email?.toLowerCase().includes(filterValue.toLowerCase());
                        });
                    }
                },
                filterEl: TextColumnFilter,
                cell: function EmailCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<SuPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return (
                            <Input
                                value={value}
                                onChange={(ev) => {
                                    onChange?.(ev.target.value);
                                }}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLInputElement>}
                            />
                        );
                    } else {
                        return (
                            <Flex alignItems="center">
                                <chakra.span>{value}</chakra.span>
                                <Button onClick={onCopy} size="xs" ml="auto">
                                    <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                                </Button>
                            </Flex>
                        );
                    }
                },
            },
            {
                id: "granted-permission",
                defaultSortDirection: SortDirection.Asc,
                header: function GrantedPermissionHeader(props: ColumnHeaderProps<SuPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Granted Permission</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Granted Permission{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.grantedPermissionName ?? "NULL",
                set: (data, value) => {
                    data.grantedPermissionName = value === "NULL" ? undefined : value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SuPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter(
                            (row) => !!row.grantedPermissionName?.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function GrantedPermissionCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<SuPermissionGrantFragment>>) {
                    if (isInCreate) {
                        return (
                            <Select
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="NULL">Please select a permission</option>
                                {insertablePermissionNames?.map((name) => (
                                    <option key={name} value={name ?? ""}>
                                        {name}
                                    </option>
                                ))}
                            </Select>
                        );
                    } else {
                        return <Code>{value}</Code>;
                    }
                },
            },
            {
                id: "target-permission",
                defaultSortDirection: SortDirection.Asc,
                header: function TargetPermissionHeader(props: ColumnHeaderProps<SuPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Target Permission</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Target Permission{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.targetPermissionName ?? "",
                set: (data, value) => {
                    data.targetPermissionName = value === "NULL" || value === "" ? null : value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SuPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter(
                            (row) => !!row.targetPermissionName?.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function TargetPermissionCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<SuPermissionGrantFragment>>) {
                    if (isInCreate) {
                        const grantedPermission = staleRecord.grantedPermissionName;
                        return (
                            <Select
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="NULL">Please select an option</option>
                                {grantedPermission === System_SuperUserPermission_Enum.InsertSuPermission ||
                                grantedPermission === System_SuperUserPermission_Enum.DeleteSuPermission ||
                                grantedPermission === System_SuperUserPermission_Enum.ViewSuPermissionGrant ? (
                                    Object.values(System_SuperUserPermission_Enum).map((name) => (
                                        <option key={name} value={name ?? ""}>
                                            {name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">NULL</option>
                                )}
                            </Select>
                        );
                    } else {
                        return <Code>{value}</Code>;
                    }
                },
            },
            {
                id: "id",
                header: function EmailHeader(props: ColumnHeaderProps<SuPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <></>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Id{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.id,
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SuPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.id ?? "") === "");
                    } else {
                        return rows.filter((row) => !!row.id.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function IdCell({ isInCreate, value }: CellProps<Partial<SuPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return <></>;
                    }
                    return (
                        <Flex alignItems="center">
                            <chakra.span>{value}</chakra.span>
                            <Button onClick={onCopy} size="xs" ml="auto">
                                <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                            </Button>
                        </Flex>
                    );
                },
            },

            {
                id: "user-id",
                header: function UserIdHeader(props: ColumnHeaderProps<SuPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>User Id</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            User Id{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.userId,
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SuPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.userId ?? "") === "");
                    } else {
                        return rows.filter((row) => !!row.userId.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function UserIdCell({ value }: CellProps<Partial<SuPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    return (
                        <Flex alignItems="center">
                            <chakra.span>{value}</chakra.span>
                            <Button onClick={onCopy} size="xs" ml="auto">
                                <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                            </Button>
                        </Flex>
                    );
                },
            },
        ],
        [allUsersResponse.data?.User, insertablePermissionNames]
    );
    const data = useMemo(
        () =>
            (allPermissionsResponse.data?.system_SuperUserPermissionGrant && [
                ...allPermissionsResponse.data?.system_SuperUserPermissionGrant,
            ]) ??
            null,
        [allPermissionsResponse.data?.system_SuperUserPermissionGrant]
    );

    const [insertResponse, insertM] = useInsertSuPermissionGrantMutation();
    const insert = useMemo<Insert<SuPermissionGrantFragment>>(
        () => ({
            ongoing: insertResponse.fetching,
            generateDefaults: () => ({
                id: uuidv4(),
                userId: currentUser.user.id,
            }),
            makeWhole: (d) => d as SuPermissionGrantFragment,
            start: (record) => {
                insertM(
                    {
                        object: record,
                    },
                    // update: (cache, { data: _data }) => {
                    //     if (_data?.insert_room_Room_one) {
                    //         const data = _data.insert_room_Room_one;
                    //         cache.writeFragment({
                    //             data,
                    //             fragment: RoomWithParticipantInfoFragmentDoc,
                    //             fragmentName: "RoomWithParticipantInfo",
                    //         });
                    //     }
                    // },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: "superuser",
                            },
                        },
                    }
                );
            },
        }),
        [currentUser.user.id, insertM, insertResponse.fetching]
    );

    const [deleteResponse, deleteM] = useDeleteSuPermissionGrantsMutation();
    const deleteO = useMemo<Delete<SuPermissionGrantFragment>>(
        () => ({
            ongoing: deleteResponse.fetching,
            start: (keys) => {
                deleteM(
                    {
                        ids: keys,
                    },
                    // update: (cache, { data: _data }) => {
                    //     if (_data?.delete_room_Room) {
                    //         const data = _data.delete_room_Room;
                    //         const deletedIds = data.returning.map((x) => x.id);
                    //         cache.modify({
                    //             fields: {
                    //                 room_Room(existingRefs: Reference[] = [], { readField }) {
                    //                     deletedIds.forEach((x) => {
                    //                         cache.evict({
                    //                             id: x.id,
                    //                             fieldName: "RoomWithParticipantInfo",
                    //                             broadcast: true,
                    //                         });
                    //                     });
                    //                     return existingRefs.filter(
                    //                         (ref) => !deletedIds.includes(readField("id", ref))
                    //                     );
                    //                 },
                    //             },
                    //         });
                    //     }
                    // },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: "superuser",
                            },
                        },
                    }
                );
            },
        }),
        [deleteM, deleteResponse.fetching]
    );

    const {
        isOpen: initialiseRole_IsOpen,
        onOpen: initialiseRole_OnOpen,
        onClose: initialiseRole_OnClose,
    } = useDisclosure();
    const [initialiseForRoleName, setInitialiseForRoleName] = useState<string | null>(null);
    const [initialiseForUserEmail, setInitialiseForUserEmail] = useState<string | null>(null);
    const initialiseRole_CancelRef = React.useRef(null);
    const [initialiseRoleForUserResponse, initialiseRoleForUser] = useInitialiseRoleForUserMutation();
    return (
        <>
            <Menu>
                <MenuButton as={Button} colorScheme="purple" isLoading={initialiseRoleForUserResponse.fetching}>
                    Initialise role for a user
                </MenuButton>
                <MenuList>
                    {Roles.map((role) => {
                        const disabled = !rolesCanCreate?.includes(role.name);
                        const item = (
                            <MenuItem
                                key={role.name}
                                isDisabled={disabled}
                                onClick={() => {
                                    setInitialiseForRoleName(role.name);
                                    setInitialiseForUserEmail(currentUser.user.email ?? "");
                                    initialiseRole_OnOpen();
                                }}
                            >
                                {role.name}
                            </MenuItem>
                        );
                        if (disabled) {
                            return (
                                <Tooltip label="Insufficient permissions to initialise this role for a user.">
                                    <div>{item}</div>
                                </Tooltip>
                            );
                        }
                        return item;
                    })}
                </MenuList>
            </Menu>
            {initialiseRoleForUserResponse.error ? (
                <Alert status="error">
                    <AlertTitle>Error initialising role for user</AlertTitle>
                    <AlertDescription>{initialiseRoleForUserResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            <AlertDialog
                isOpen={initialiseRole_IsOpen}
                onClose={initialiseRole_OnClose}
                leastDestructiveRef={initialiseRole_CancelRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Add {initialiseForRoleName} role to user</AlertDialogHeader>
                    <AlertDialogCloseButton />
                    <AlertDialogBody>
                        <FormControl>
                            <FormLabel>Select a user</FormLabel>
                            <Select
                                value={initialiseForUserEmail ?? ""}
                                onChange={(ev) => {
                                    setInitialiseForUserEmail(ev.target.value);
                                }}
                            >
                                <option value="">Please select a user</option>
                                {allUsersResponse.data?.User.filter((user) => !!user.email).map((user) => (
                                    <option key={user.id} value={user.email as string}>
                                        {user.email}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup spacing={2}>
                            <Button
                                ref={initialiseRole_CancelRef}
                                onClick={() => {
                                    initialiseRole_OnClose();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={() => {
                                    const role = Roles.find((x) => x.name === initialiseForRoleName);
                                    const user = allUsersResponse.data?.User.find(
                                        (x) => x.email === initialiseForUserEmail
                                    );
                                    if (role && user) {
                                        initialiseRole_OnClose();

                                        initialiseRoleForUser(
                                            {
                                                suPermGrants: role.suPermissions.map((perm) => ({
                                                    grantedPermissionName: perm.grantedPermissionName,
                                                    targetPermissionName: perm.targetPermissionName,
                                                    userId: user.id,
                                                })),
                                                sysConfigPermGrants: role.sysConfigPermissions.map((perm) => ({
                                                    permissionName: perm.permissionName,
                                                    configurationKey: perm.configurationKey,
                                                    userId: user.id,
                                                })),
                                            },
                                            {
                                                headers: {
                                                    [AuthHeader.Role]: "superuser",
                                                },
                                            }
                                        );
                                    }
                                }}
                                isDisabled={!initialiseForUserEmail?.length || !initialiseForRoleName}
                            >
                                Add role
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <CRUDTable
                data={
                    !allPermissionsResponse.fetching &&
                    (allPermissionsResponse.data?.system_SuperUserPermissionGrant ? data : null)
                }
                tableUniqueName="SUPermissionGrants"
                row={row}
                columns={columns}
                insert={insertablePermissionNames?.length ? insert : undefined}
                delete={deleteO}
                alert={
                    insertResponse.error || deleteResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertResponse.error?.message ?? deleteResponse.error?.message ?? "Unknown error",
                          }
                        : undefined
                }
            />
        </>
    );
}
