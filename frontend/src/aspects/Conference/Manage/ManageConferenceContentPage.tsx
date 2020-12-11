import { gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupType_Enum,
    ContentType_Enum,
    Permission_Enum,
    useSelectAllContentGroupsQuery,
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
    query SelectAllContentGroups($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            conferenceId
            contentGroupTypeName
            title
            shortTitle
            requiredContentItems {
                id
                name
                contentTypeName
                conferenceId
                contentGroupId
            }
            contentItems {
                conferenceId
                contentGroupId
                contentTypeName
                data
                id
                isHidden
                layoutData
                name
                requiredContentId
                requiredContentItem {
                    conferenceId
                    contentGroupId
                    contentTypeName
                    id
                    name
                }
            }
            contentGroupTags {
                id
                tagId
                contentGroupId
            }
        }
    }
`;

type TagDescriptor = {
    id: string;
    name: string;
    desciptor: string;
};

type ContentItemDescriptor = {
    id: string;
    typeName: ContentType_Enum;
    isHidden: boolean;
    layoutData: string;
    requiredContentId?: string | null;
    name: string;
    data: any;
};

type RequiredContentItemDescriptor = {
    id: string;
    typeName: string;
    name: string;
};

type ContentGroupDescriptor = {
    id: string;
    title: string;
    shortTitle?: string | null;
    typeName: ContentGroupType_Enum;
    tagIds: TagDescriptor[];
    items: ContentItemDescriptor[];
    requiredItems: RequiredContentItemDescriptor[];
};

const ContentGroupCRUDTable = (
    props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>
) => CRUDTable(props);

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllContentGroups,
        error: errorAllContentGroups,
        data: allContentGroups,
    } = useSelectAllContentGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllContentGroups);

    const parsedDBContentGroups = useMemo(() => {
        if (!allContentGroups) {
            return undefined;
        }

        return new Map(
            allContentGroups.ContentGroup.map((item): [
                string,
                ContentGroupDescriptor
            ] => [
                item.id,
                {
                    id: item.id,
                    title: item.title,
                    shortTitle: item.shortTitle,
                    typeName: item.contentGroupTypeName,
                    tagIds: item.contentGroupTags.map((x) => x.tagId),
                    items: item.contentItems.map((item) => ({
                        id: item.id,
                        isHidden: item.isHidden,
                        name: item.name,
                        typeName: item.contentTypeName,
                        data: item.data,
                        layoutData: item.layoutData,
                        requiredContentId: item.requiredContentId,
                    })),
                    requiredItems: item.requiredContentItems.map((item) => ({
                        id: item.id,
                        name: item.name,
                        typeName: item.contentTypeName,
                    })),
                },
            ])
        );
    }, [allContentGroups]);

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<ContentGroupDescriptor, any>>;
        } = {
            name: {
                heading: "Title",
                ariaLabel: "Title",
                description: "Title of content",
                isHidden: false,
                isEditable: true,
                defaultValue: "New content title",
                insert: (item, v) => {
                    return {
                        ...item,
                        name: v,
                    };
                },
                extract: (v) => v.title,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) =>
                    v.length >= 3 || ["Title must be at least 3 characters"],
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
            {loadingAllContentGroups || !parsedDBContentGroups ? (
                <Spinner />
            ) : errorAllContentGroups ? (
                <>
                    An error occurred loading in data - please see further
                    information in notifications.
                </>
            ) : (
                <></>
            )}
            <ContentGroupCRUDTable
                key="crud-table"
                data={parsedDBContentGroups ?? new Map()}
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
