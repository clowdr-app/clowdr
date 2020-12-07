import { gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Permission_Enum,
    useSelectAllRequiredContentQuery,
} from "../../../generated/graphql";
import CRUDTable, {
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    ValidatationResult,
} from "../../CRUDTable/CRDUTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    query SelectAllRequiredContent($conferenceId: uuid!) {
        RequiredContentItem(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            contentGroup {
                title
            }
            contentTypeName
            contentItem {
                name
            }
            id
            name
        }
    }
`;

type RequiredContentDescriptor = {
    id: string;
    name: string;
    contentGroupTitle: string;
    contentTypeName: string;
    contentItemName?: string;
};

const RequiredContentCRUDTable = (
    props: Readonly<CRUDTableProps<RequiredContentDescriptor, "id">>
) => CRUDTable(props);

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllRequiredContent,
        error: errorAllRequiredContent,
        data: allRequiredContent,
    } = useSelectAllRequiredContentQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
        context: {
            headers: {
                "x-hasura-magic-token": "Some value",
            },
        },
    });
    useQueryErrorToast(errorAllRequiredContent);

    const parsedDBRequiredContent = useMemo(() => {
        if (!allRequiredContent) {
            return undefined;
        }

        return new Map(
            allRequiredContent.RequiredContentItem.map((item): [
                string,
                RequiredContentDescriptor
            ] => [
                item.id,
                {
                    id: item.id,
                    name: item.name,
                    contentGroupTitle: item.contentGroup.title,
                    contentTypeName: item.contentTypeName,
                    contentItemName: item.contentItem?.name,
                },
            ])
        );
    }, [allRequiredContent]);

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<RequiredContentDescriptor, any>>;
        } = {
            name: {
                heading: "Name",
                ariaLabel: "Name",
                description: "Name of required content item",
                isHidden: false,
                isEditable: true,
                defaultValue: "New item name",
                insert: (item, v) => {
                    return {
                        ...item,
                        name: v,
                    };
                },
                extract: (v) => v.name,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) =>
                    v.length >= 3 || ["Name must be at least 3 characters"],
            },
        };
        return result;
    }, []);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
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
                Groups
            </Heading>
            {loadingAllRequiredContent || !parsedDBRequiredContent ? (
                <Spinner />
            ) : errorAllRequiredContent ? (
                <>
                    An error occurred loading in data - please see further
                    information in notifications.
                </>
            ) : (
                <></>
            )}
            <RequiredContentCRUDTable
                key="crud-table"
                data={parsedDBRequiredContent ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, item) => {
                            return true;
                        },
                        update: (items) => {
                            console.log("todo");
                            return new Map<string, ValidatationResult>();
                        },
                        delete: (keys) => {
                            console.log("todo");
                            return new Map<string, boolean>();
                        },
                        save: async (keys) => {
                            console.log("todo");
                            return new Map<string, boolean>();
                        },
                    },
                }}
                primaryFields={{
                    keyField: {
                        heading: "Id",
                        ariaLabel: "Unique identifier",
                        description: "Unique identifier",
                        isHidden: true,
                        insert: (item, v) => {
                            return {
                                ...item,
                                id: v,
                            };
                        },
                        extract: (v) => v.id,
                        spec: {
                            fieldType: FieldType.string,
                            convertToUI: (x) => x,
                            disallowSpaces: true,
                        },
                        validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                    },
                    otherFields: fields,
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
