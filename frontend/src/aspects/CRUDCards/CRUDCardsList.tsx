import { VStack } from "@chakra-ui/react";
import React from "react";
import type { CardProps } from "../Card/Card";
import type { CRUDableFields, CRUDableRecord } from "./Types";

export function CRUDCardsList<K extends keyof any, T extends CRUDableFields<K>>({
    Card,
    records,
    selectedIds,
    onSelect,
    onDeselect,
}: {
    readonly fields: T;
    readonly records: readonly CRUDableRecord<K, T>[];
    Card: (props: Partial<CardProps> & { record: CRUDableRecord<K, T> }) => JSX.Element;

    selectedIds: ReadonlySet<string>;
    onSelect: (id: string) => void;
    onDeselect: (id: string) => void;
}): JSX.Element {
    return (
        <VStack alignItems="flex-start" w="100%" spacing={4}>
            {records.map((record) => (
                <Card
                    key={record.id}
                    record={record}
                    isSelectable
                    onSelectToggle={() => {
                        if (selectedIds.has(record.id)) {
                            onDeselect(record.id);
                        } else {
                            onSelect(record.id);
                        }
                    }}
                />
            ))}
        </VStack>
    );
}
