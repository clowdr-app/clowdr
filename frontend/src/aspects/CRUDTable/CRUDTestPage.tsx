import { Heading } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import isValidUUID from "../Utils/isValidUUID";
import CRUDTable, {
    BooleanFieldFormat,
    BooleanFieldSpec,
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
    StringFieldSpec,
} from "./CRDUTable";

type TestCRUDData = {
    id: string;
    stringField1: string;
    boolField1: boolean;
    intField1: number;
    multiLineField1: string;
    selectField1: string;
};

const TestCRUDTable = (props: Readonly<CRUDTableProps<TestCRUDData, "id">>) =>
    CRUDTable(props);

function generateInitialTestCRUDData(): Map<string, TestCRUDData> {
    const arr = new Array<[string, TestCRUDData]>();
    for (let i = 0; i < 100; i++) {
        const id = `id-${i}`;
        arr.push([id, {
            id,
            stringField1: `String ${i}`,
            boolField1: i % 2 === 0,
            intField1: i % 10,
            multiLineField1: `String ${i}\nLine 2\nLine 3`,
            selectField1: `Option ${i % 10}`
        }]);
    }
    return new Map(arr);
}

export default function CRUDTestPage(): JSX.Element {
    const [testData, setTestData] = useState<Map<string, TestCRUDData>>(
        generateInitialTestCRUDData()
    );

    const stringFieldSpec: StringFieldSpec<string> = useMemo(
        () => ({
            fieldType: FieldType.string,
            convertToUI: (x: string) => x,
            filter: defaultStringFilter
        }),
        []
    );

    const boolFieldSpec: BooleanFieldSpec<boolean> = useMemo(
        () => ({
            fieldType: FieldType.boolean,
            convertToUI: (x: boolean) => x,
            format: BooleanFieldFormat.checkbox,
        }),
        []
    );

    return (
        <>
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                CRUD Table Testing
            </Heading>
            <Heading
                as="h2"
                fontSize="1.7rem"
                lineHeight="2.4rem"
                fontStyle="italic"
            >
                Manual testing page
            </Heading>
            <TestCRUDTable
                data={testData}
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
                        str1Field: {
                            heading: "Str1",
                            ariaLabel: "String field 1",
                            description: "String field 1",
                            isHidden: false,
                            extract: (v) => v.stringField1,
                            spec: stringFieldSpec,
                            validate: (v) =>
                                v.length >= 10 || [
                                    "Must be at least 10 characters",
                                ],
                        },
                        // // TODO: Generate these directly from the DB Permissions enum using the Name and Description fields
                        // manageName: {
                        //     heading: "Manage Name?",
                        //     ariaLabel: "Manage Name Permission",
                        //     description:
                        //         "Permission to manage the conference name, short name and URL slug.",
                        //     isHidden: false,
                        //     extract: (v) =>
                        //         v.rolePermissions
                        //             .map((x) => x.permissionName)
                        //             .includes(
                        //                 Permission_Enum.ConferenceManageName
                        //             ),
                        //     spec: boolFieldSpec,
                        // },
                        // manageRoles: {
                        //     heading: "Manage Roles?",
                        //     ariaLabel: "Manage Roles Permission",
                        //     description:
                        //         "Permission to manage the conference roles.",
                        //     isHidden: false,
                        //     extract: (v) =>
                        //         v.rolePermissions
                        //             .map((x) => x.permissionName)
                        //             .includes(
                        //                 Permission_Enum.ConferenceManageRoles
                        //             ),
                        //     spec: boolFieldSpec,
                        // },
                    },
                }}
            />
        </>
    );
}
