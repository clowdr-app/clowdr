import {
    Box,
    Button,
    Center,
    chakra,
    Checkbox,
    HStack,
    Input,
    NumberInput,
    NumberInputField,
    Select,
} from "@chakra-ui/react";
import React from "react";
import MultiSelect from "../Chakra/MultiSelect";
import { DateTimePicker } from "../CRUDTable/DateTimePicker";
import { FAIcon } from "../Icons/FAIcon";
import type { FilterFunction, FilterProps } from "./CRUDTable2";

// Define a default UI for filtering
export function TextColumnFilter({ value, onChange, onBlur }: FilterProps<string>): JSX.Element {
    return (
        <Input
            size="sm"
            value={value || ""}
            onChange={(e) => {
                onChange(e.target.value || null);
            }}
            onBlur={onBlur}
            placeholder="Filter..."
        />
    );
}

export function CheckBoxColumnFilter({ value, onChange, onBlur }: FilterProps<boolean>): JSX.Element {
    return (
        <Center justifyContent="center" alignItems="center" minH="5ex">
            <Checkbox
                size="sm"
                isChecked={value === true}
                isIndeterminate={value === null}
                onChange={(e) => {
                    onChange(e.target.indeterminate ? null : e.target.checked);
                }}
                onBlur={onBlur}
            />
            <Button
                aria-label="Clear filter"
                onClick={() => {
                    onChange(null);
                }}
                variant="ghost"
                size="xs"
                rounded="full"
                ml={1}
                p={0}
                isDisabled={value === null}
            >
                <FAIcon iconStyle="s" icon="ban" />
            </Button>
        </Center>
    );
}

// This is a custom filter UI for selecting
// a unique option from a list
export function SelectColumnFilter(options: (string | { label: string; value: string })[]) {
    return function SelectColumnFilterInner({ value, onChange, onBlur }: FilterProps<string>): JSX.Element {
        // Render a multi-select box
        return (
            <Select
                size="sm"
                value={value ?? ""}
                onChange={(e) => {
                    onChange(e.target.value || null);
                }}
                onBlur={onBlur}
            >
                <option value="">All</option>
                {options.map((option, i) => (
                    <option key={i} value={typeof option === "string" ? option : option.value}>
                        {typeof option === "string" ? option : option.label}
                    </option>
                ))}
            </Select>
        );
    };
}

export function MultiSelectColumnFilter(options: { label: string; value: string }[]) {
    return function SelectColumnFilterInner({
        value,
        onChange,
        onBlur,
    }: FilterProps<ReadonlyArray<{ label: string; value: string }>>): JSX.Element {
        // Render a multi-select box
        return (
            <Box fontSize="sm" textTransform="none" maxW={400}>
                <MultiSelect
                    options={options}
                    value={value ?? []}
                    onChange={(e) => {
                        onChange(e);
                    }}
                    onBlur={onBlur}
                />
            </Box>
        );
    };
}

// // This is a custom filter UI that uses a
// // slider to set the filter value between a column's
// // min and max values
// function SliderColumnFilter({
//     column: { filterValue, setFilter, preFilteredRows, id },
// }: FilterProps<EventInfoFragment>) {
//     // Calculate the min and max
//     // using the preFilteredRows

//     const [min, max] = React.useMemo(() => {
//         let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
//         let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
//         preFilteredRows.forEach((row) => {
//             min = Math.min(row.values[id], min);
//             max = Math.max(row.values[id], max);
//         });
//         return [min, max];
//     }, [id, preFilteredRows]);

//     return (
//         <>
//             <Input
//                 type="range"
//                 min={min}
//                 max={max}
//                 value={filterValue || min}
//                 onChange={(e) => {
//                     setFilter(parseInt(e.target.value, 10));
//                 }}
//             />
//             <Button onClick={() => setFilter(undefined)}>Off</Button>
//         </>
//     );
// }

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
export function NumberRangeColumnFilter(min: number, max: number) {
    return function NumberRangeColumnFilter({
        value,
        onChange,
        onBlur,
    }: FilterProps<{
        min?: number;
        max?: number;
    }>): JSX.Element {
        return (
            <HStack justifyContent="center">
                <NumberInput
                    size="sm"
                    value={value?.min ?? ""}
                    onChange={(val) => {
                        onChange({ min: val !== "" ? parseInt(val, 10) : undefined, max: value?.max });
                    }}
                    placeholder={`Min (${min})`}
                >
                    <NumberInputField
                        onBlur={onBlur}
                        style={{
                            width: "70px",
                            marginRight: "0.5rem",
                        }}
                    />
                </NumberInput>
                <chakra.span>to</chakra.span>
                <NumberInput
                    size="sm"
                    value={value?.max ?? ""}
                    onChange={(val) => {
                        onChange({ max: val !== "" ? parseInt(val, 10) : undefined, min: value?.min });
                    }}
                    placeholder={`Max (${max})`}
                >
                    <NumberInputField
                        onBlur={onBlur}
                        style={{
                            width: "70px",
                            marginLeft: "0.5rem",
                        }}
                    />
                </NumberInput>
            </HStack>
        );
    };
}

// const startsWithTextFilerFn: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
//     return rows.filter((row) => {
//         return columnIds.every((id) => {
//             const rowValue = row.values[id];
//             return rowValue !== undefined
//                 ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
//                 : true;
//         });
//     });
// };

// const fuzzyTextFilterFn: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
//     return columnIds.reduce((acc, id) => matchSorter(acc, filterValue, { keys: [(row) => row.values[id]] }), rows);
// };

// // Let the table remove the filter if the string is empty
// fuzzyTextFilterFn.autoRemove = (val: string) => !val;

// // Define a custom filter filter function!
// const filterGreaterThan: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
//     return columnIds.reduce(
//         (acc, id) =>
//             acc.filter((row) => {
//                 const rowValue = row.values[id];
//                 return rowValue >= filterValue;
//             }),
//         rows
//     );
// };

export const dateTimeFilterFn: <T = any>(
    columnIds: (keyof T)[]
) => FilterFunction<
    T,
    {
        value: Date;
        mode: "before" | "after" | "exact";
    }
> = (columnIds) => {
    return (
        rows,
        {
            value: valueD,
            mode,
        }: {
            value: Date;
            mode: "after" | "before" | "exact";
        }
    ) => {
        return columnIds.reduce((acc, id) => {
            let value = valueD.getTime();
            if (mode === "after") {
                return acc.filter((row) => Date.parse((row[id] as unknown) as string) >= value);
            } else if (mode === "before") {
                return acc.filter((row) => Date.parse((row[id] as unknown) as string) <= value);
            } else {
                value = Math.round(value / 1000);
                return acc.filter((row) => Math.round(Date.parse((row[id] as unknown) as string) / 1000) === value);
            }
        }, rows);
    };
};

// // This is an autoRemove method on the filter function that
// // when given the new filter value and returns true, the filter
// // will be automatically removed. Normally this is just an undefined
// // check, but here, we want to remove the filter if it's not a number
// filterGreaterThan.autoRemove = (val: any) => typeof val !== "number";

// // This is a custom aggregator that
// // takes in an array of leaf values and
// // returns the rounded median
// function roundedMedian(leafValues: number[]) {
//     let min = leafValues[0] || 0;
//     let max = leafValues[0] || 0;

//     leafValues.forEach((value) => {
//         min = Math.min(min, value);
//         max = Math.max(max, value);
//     });

//     return Math.round((min + max) / 2);
// }

export function DateTimeColumnFilter({
    value,
    onChange,
    onBlur,
}: FilterProps<{
    value: Date;
    mode: "before" | "after" | "exact";
}>): JSX.Element {
    return (
        <HStack flexWrap="wrap" justifyContent="flex-start" alignItems="flex-start" gridRowGap={2} minW="max-content">
            <Select
                size="sm"
                width="auto"
                value={value?.mode ?? ""}
                onChange={(ev) => {
                    onChange(
                        ev.target.value === ""
                            ? null
                            : value
                            ? { ...value, mode: ev.target.value as "before" | "after" | "exact" }
                            : {
                                  value: new Date(),
                                  mode: ev.target.value as "before" | "after" | "exact",
                              }
                    );
                }}
                onBlur={() => onBlur()}
            >
                <option value="">🗙</option>
                <option value="after">≥</option>
                <option value="exact">=</option>
                <option value="before">≤</option>
            </Select>
            <DateTimePicker
                size="sm"
                allowUndefined={true}
                value={value?.value ?? undefined}
                onChange={(d) =>
                    onChange(
                        !d
                            ? null
                            : value
                            ? { ...value, value: d }
                            : {
                                  value: d,
                                  mode: "after",
                              }
                    )
                }
                onBlur={() => onBlur()}
            />
        </HStack>
    );
}

export function formatEnumValuePart(part: string): string {
    if (part.length === 0) {
        return "";
    }
    return part[0] + part.substr(1).toLowerCase();
}

export function formatEnumValue(key: string): string {
    const parts = key.split("_");
    return parts.reduce((acc, part) => `${acc} ${formatEnumValuePart(part)}`, "").substr(1);
}
