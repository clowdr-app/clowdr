import { Heading } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import isValidUUID from "../Utils/isValidUUID";
import CRUDTable, {
    BatchModeCUDCallbacks,
    BooleanFieldFormat,
    BooleanFieldSpec,
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
    InstantModeCUDCallbacks,
    StringFieldSpec,
    UpdateResult,
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
    for (let i = 0; i < 10; i++) {
        const id = `id-${i}`;
        arr.push([
            id,
            {
                id,
                stringField1: `String ${i}`,
                boolField1: i % 2 === 0,
                intField1: i % 10,
                multiLineField1: `String ${i}\nLine 2\nLine 3`,
                selectField1: `Option ${i % 10}`,
            },
        ]);
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
            convertToUI: (x) => x,
            convertFromUI: (x) => x,
            filter: defaultStringFilter,
        }),
        []
    );

    const boolFieldSpec: BooleanFieldSpec<boolean> = useMemo(
        () => ({
            fieldType: FieldType.boolean,
            convertToUI: (x) => x,
            convertFromUI: (x) => x,
            format: BooleanFieldFormat.switch,
            // TODO: filter: defaultBooleanFilter,
        }),
        []
    );

    const bacthCUDMode = true;
    const syncCUDCallbacks: BatchModeCUDCallbacks<TestCRUDData, "id"> = {
        generateTemporaryKey: () => {
            return uuidv4();
        },
        create: (tempKey, item) => {
            const newItem = { ...item, id: tempKey } as TestCRUDData;
            setTestData((oldData) => {
                const newData = new Map(oldData.entries());
                newData.set(tempKey, newItem);
                return newData;
            });
            return true;
        },
        update: (values) => {
            const results: Map<string, UpdateResult> = new Map();
            values.forEach((item, key) => {
                results.set(key, true);
            });

            setTestData((oldData) => {
                const newData = new Map(oldData.entries());
                values.forEach((item, key) => {
                    newData.set(key, item);
                });
                return newData;
            });

            return results;
        },
        delete: (keys) => {
            const results: Map<string, boolean> = new Map();
            keys.forEach((key) => {
                results.set(key, true);
            });

            setTestData((oldData) => {
                const newData = new Map(oldData.entries());
                keys.forEach((key) => {
                    newData.delete(key);
                });
                return newData;
            });

            return results;
        },
        save: async (keys) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const results: Map<string, boolean> = new Map();
                    keys.forEach((key) => {
                        results.set(key, true);
                    });
                    resolve(results);
                }, 500);
            });
        },
    };

    const asyncCUDCallbacks: InstantModeCUDCallbacks<TestCRUDData, "id"> = {
        // TODO: Create
        update: async (values) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const results: Map<string, UpdateResult> = new Map();
                    values.forEach((item, key) => {
                        results.set(key, true);
                    });
                    setTestData((oldData) => {
                        const newData = new Map(oldData.entries());
                        values.forEach((item, key) => {
                            newData.set(key, item);
                        });
                        return newData;
                    });
                    resolve(results);
                }, 500);
            });
        },
        delete: async (keys) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const results: Map<string, boolean> = new Map();
                    keys.forEach((key) => {
                        results.set(key, true);
                    });
                    setTestData((oldData) => {
                        const newData = new Map(oldData.entries());
                        keys.forEach((key) => {
                            newData.delete(key);
                        });
                        return newData;
                    });
                    resolve(results);
                }, 500);
            });
        },
    };

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
                            defaultValue: "Awesome string value",
                            isHidden: false,
                            isEditable: true,
                            insert: (item, value) => {
                                return { ...item, stringField1: value };
                            },
                            extract: (v) => v.stringField1,
                            spec: stringFieldSpec,
                            validate: (v) =>
                                v.length >= 10 || [
                                    "Must be at least 10 characters",
                                ],
                        },
                        bool1Field: {
                            heading: "Bool1",
                            ariaLabel: "Boolean field 1",
                            description: "Boolean field 1",
                            defaultValue: true,
                            isHidden: false,
                            isEditable: true,
                            editorFalseLabel: "Deny",
                            editorTrueLabel: "Allow",
                            insert: (item, value) => {
                                return { ...item, boolField1: value };
                            },
                            extract: (v) => v.boolField1,
                            spec: boolFieldSpec,
                            validate: (_v) => true,
                        },
                    },
                }}
                csud={{
                    cudCallbacks: bacthCUDMode
                        ? syncCUDCallbacks
                        : asyncCUDCallbacks,
                }}
                secondaryFields={{
                    editSingle: (key, onClose) => {
                        return {
                            includeCloseButton: false,
                            editorElement: <>Test</>,
                            footerButtons: [
                                {
                                    type: "ordinary",
                                    colorScheme: "green",
                                    action: () => {
                                        alert("TODO");
                                        onClose();
                                    },
                                    children: <>Save</>,
                                    label: "Save",
                                },
                            ],
                        };
                    },
                }}
            />
        </>
    );
}
