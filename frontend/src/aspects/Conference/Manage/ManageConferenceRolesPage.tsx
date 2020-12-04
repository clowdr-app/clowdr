import { gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    Permission_Enum,
    SelectAllRolesQuery,
    useSelectAllRolesQuery,
} from "../../../generated/graphql";
import CRUDTable, {
    BooleanFieldFormat,
    BooleanFieldSpec,
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
} from "../../CRUDTable/CRDUTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

const _manageRolesQueries = gql`
    query SelectAllRoles($conferenceId: uuid!) {
        Role(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            id
            name
            rolePermissions {
                id
                permissionName
                roleId
            }
        }
    }
`;

const RolesCRUDTable = (
    props: Readonly<CRUDTableProps<SelectAllRolesQuery["Role"][0], "id">>
) => CRUDTable(props);

export default function ManageConferenceRolesPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllRoles,
        error: errorAllRoles,
        data: allRoles,
    } = useSelectAllRolesQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllRoles);

    const allRolesMap = useMemo(() => {
        if (!allRoles) {
            return undefined;
        }

        const result = new Map<string, SelectAllRolesQuery["Role"][0]>();

        for (const role of allRoles.Role) {
            result.set(role.id, role);
            for (let i = 0; i < 100; i++) {
                result.set(role.id + "-" + i, {
                    ...role,
                    id: role.id + "-" + i,
                    name: role.name + "-" + i
                });
            }
        }

        return result;
    }, [allRoles]);

    const permissionFieldSpec: BooleanFieldSpec<boolean> = useMemo(
        () => ({
            fieldType: FieldType.boolean,
            convertToUI: (x: boolean) => x,
            format: BooleanFieldFormat.checkbox,
        }),
        []
    );

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageRoles]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading
                as="h2"
                fontSize="1.7rem"
                lineHeight="2.4rem"
                fontStyle="italic"
            >
                Roles
            </Heading>
            {loadingAllRoles ? (
                <Spinner />
            ) : errorAllRoles || !allRolesMap ? (
                <></>
            ) : (
                <RolesCRUDTable
                    data={allRolesMap}
                    primaryFields={{
                        keyField: {
                            heading: "Id",
                            ariaLabel: "Unique identifier",
                            description: "Unique identifier",
                            isHidden: true,
                            extract: (v) => v.id,
                            spec: {
                                fieldType: FieldType.string,
                                convertToUI: (x) => x,
                                disallowSpaces: true,
                            },
                            validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                        },
                        otherFields: {
                            name: {
                                heading: "Name",
                                ariaLabel: "Name",
                                description: "Role name",
                                isHidden: false,
                                extract: (v) => v.name,
                                spec: {
                                    fieldType: FieldType.string,
                                    convertToUI: (x) => x,
                                    filter: defaultStringFilter,
                                },
                                validate: (v) =>
                                    v.length >= 10 || [
                                        "Name must be at least 10 characters",
                                    ],
                            },
                            // TODO: Generate these directly from the DB Permissions enum using the Name and Description fields
                            manageName: {
                                heading: "Manage Name?",
                                ariaLabel: "Manage Name Permission",
                                description:
                                    "Permission to manage the conference name, short name and URL slug.",
                                isHidden: false,
                                extract: (v) =>
                                    v.rolePermissions
                                        .map((x) => x.permissionName)
                                        .includes(
                                            Permission_Enum.ConferenceManageName
                                        ),
                                spec: permissionFieldSpec,
                            },
                            manageRoles: {
                                heading: "Manage Roles?",
                                ariaLabel: "Manage Roles Permission",
                                description:
                                    "Permission to manage the conference roles.",
                                isHidden: false,
                                extract: (v) =>
                                    v.rolePermissions
                                        .map((x) => x.permissionName)
                                        .includes(
                                            Permission_Enum.ConferenceManageRoles
                                        ),
                                spec: permissionFieldSpec,
                            },
                        },
                    }}
                />
            )}
        </RequireAtLeastOnePermissionWrapper>
    );
}
