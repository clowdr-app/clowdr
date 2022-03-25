import React, { useState } from "react";
import Card from "../Card/Card";
import { CRUDCardsList } from "./CRUDCardsList";
import type { CRUDableFields, CRUDableRecord } from "./Types";
import { CRUDableFieldType } from "./Types";

export function getCRUDableField<K extends keyof any, T extends CRUDableFields<K>, K2 extends K>(
    fields: T,
    record: CRUDableRecord<K, T>,
    key: K2
): {
    readonly field: T[K2];
    readonly value: CRUDableRecord<K, T>[K2];
} {
    return {
        field: fields[key],
        value: record[key],
    };
}

export function testFunc() {
    const testFields: CRUDableFields<"test"> = {
        id: {
            name: "id",
            optional: false,
            type: CRUDableFieldType.UUID,
        },
        test: {
            name: "test",
            optional: true,
            type: CRUDableFieldType.String,
        },
    };
    const testRecord: CRUDableRecord<"test", typeof testFields> = {
        id: "000...",
        test: null,
    };
    const testValue = getCRUDableField(testFields, testRecord, "test");
    console.log(testValue);
}

export default function CRUDCards<K extends keyof any, T extends CRUDableFields<K>>({
    fields,
    records,
}: {
    readonly fields: T;
    readonly records: readonly CRUDableRecord<K, T>[];
}): JSX.Element {
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set<string>());

    return (
        <CRUDCardsList<K, T>
            fields={fields}
            records={records}
            Card={(_props) => {
                return <Card />;
            }}
            selectedIds={selectedIds}
            onSelect={(id) => {
                setSelectedIds((old) => {
                    if (!old.has(id)) {
                        const result = new Set(old);
                        result.add(id);
                        return result;
                    }
                    return old;
                });
            }}
            onDeselect={(id) => {
                setSelectedIds((old) => {
                    if (old.has(id)) {
                        const result = new Set(old);
                        result.delete(id);
                        return result;
                    }
                    return old;
                });
            }}
        />
    );
}
