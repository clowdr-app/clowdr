import {
    Checkbox,
    Grid,
    GridItem,
    Heading,
    Input,
    Text,
    Tooltip,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import FAIcon from "../Icons/FAIcon";

export enum FieldType {
    string,
    integer,
    boolean,
    select,
}

export enum BooleanFieldFormat {
    toggle,
    checkbox,
}

export function defaultStringFilter(
    item: string,
    search?: string,
    shouldNotTrim?: boolean,
    disallowSpaces?: boolean
): boolean {
    if (search === undefined) {
        return true;
    }

    function normalise(v: string) {
        let r = v.toLowerCase();
        if (disallowSpaces) {
            r = r.replace(/\s+/g, "");
        } else if (!shouldNotTrim) {
            r = r.trim();
        }
        return r;
    }
    const itemNormalised = normalise(item);
    const searchNormalised = normalise(search);
    return itemNormalised.includes(searchNormalised);
}

export function defaultIntegerFilter(
    item: number,
    searchLower?: number,
    searchUpper?: number
): boolean {
    return (
        (searchLower === undefined || searchLower <= item) &&
        (searchUpper === undefined || item <= searchUpper)
    );
}

export function defaultBooleanFilter(item: boolean, search?: boolean): boolean {
    if (search === undefined) {
        return true;
    }

    return item === search;
}

export function defaultSelectFilter(
    itemKey: string,
    searchKeys?: Array<string>
): boolean {
    if (searchKeys === undefined) {
        return true;
    }

    return searchKeys.some((key) => itemKey === key);
}

export function defaultStringSorter(itemX: string, itemY: string): number {
    return itemX.toLowerCase().localeCompare(itemY.toLowerCase());
}

export function defaultIntegerSorter(itemX: number, itemY: number): number {
    return itemX - itemY;
}

export function defaultBooleanSorter(itemX: boolean, itemY: boolean): number {
    if (!itemX) {
        if (!itemY) {
            return 0;
        } else {
            return -1;
        }
    } else {
        if (!itemY) {
            return 1;
        } else {
            return 0;
        }
    }
}

export function defaultSelectSorter(
    itemKeyX: string,
    itemKeyY: string,
    options: Array<SelectOption>
): number {
    const itemValueX = options.find((x) => x.key === itemKeyX)?.value;
    const itemValueY = options.find((y) => y.key === itemKeyY)?.value;

    if (!itemValueX) {
        if (!itemValueY) {
            return 0;
        }
        return 1;
    } else if (!itemValueY) {
        return -1;
    } else {
        return defaultStringSorter(itemValueX, itemValueY);
    }
}

export interface SelectOption {
    key: string;
    value: string;
}

export type StringFieldSpec<S> = {
    fieldType: FieldType.string;

    minLength?: number;
    maxLength?: number;

    shouldNotTrim?: boolean;
    disallowSpaces?: boolean;

    convertToUI: (v: S) => string;
    convertFromUI?: (v: string) => S;

    filter?: (
        item: string,
        search?: string,
        shouldNotTrim?: boolean,
        disallowSpaces?: boolean
    ) => boolean;
    sort?: (itemX: string, itemY: string) => number;

    areEqual?: (itemX: string, itemY: string) => boolean;
};

export type IntegerFieldSpec<S> = {
    fieldType: FieldType.integer;

    min?: number;
    max?: number;

    convertToUI: (v: S) => number;
    convertFromUI?: (v: number) => S;

    filter?: (
        item: number,
        searchLower?: number,
        searchUpper?: number
    ) => boolean;
    sort?: (itemX: number, itemY: number) => number;

    areEqual?: (itemX: number, itemY: number) => boolean;
};

export type BooleanFieldSpec<S> = {
    fieldType: FieldType.boolean;

    format: BooleanFieldFormat;

    convertToUI: (v: S) => boolean;
    convertFromUI?: (v: boolean) => S;

    filter?: (item: boolean, search?: boolean) => boolean;
    sort?: (itemX: boolean, itemY: boolean) => number;

    areEqual?: (itemX: boolean, itemY: boolean) => boolean;
};

export type SelectFieldSpec<S> = {
    fieldType: FieldType.select;
    multiSelect: boolean;

    options: () => Array<SelectOption>;

    /** Return the key of the option to select. */
    convertToUI: (v: S | Array<S>) => string | Array<string>;
    /** Provides the key of the selected option. */
    convertFromUI?: (v: string | Array<string>) => S | Array<S>;

    filter?: (
        itemKey: string | Array<string>,
        searchKeys?: Array<string>
    ) => boolean;
    sort?: (
        itemKeyX: string | Array<string>,
        itemKeyY: string | Array<string>,
        options: Array<SelectOption>
    ) => number;

    areEqual?: (
        itemKeyX: string | Array<string>,
        itemKeyY: string | Array<string>
    ) => boolean;

    /** Intended to be used for a modal dialog to create new items. */
    create?: Readonly<{
        begin: (onCompleted: () => void) => boolean;
    }>;
};

export type FieldSpec<S> =
    | StringFieldSpec<S>
    | IntegerFieldSpec<S>
    | BooleanFieldSpec<S>
    | SelectFieldSpec<S>;

export type ValidatationResult = true | Array<string>;
export type UpdateResult = true | Array<string>;

export interface Field<
    T,
    K extends keyof T,
    FieldSpecT extends FieldSpec<T[K]> = FieldSpec<T[K]>
> {
    spec: Readonly<FieldSpecT>;

    heading: string;
    ariaLabel: string;
    description: string;

    isHidden: boolean;
    isEditable?: boolean;
    isMultiEditable?: boolean;

    defaultValue?: T[K];

    extract: (d: T) => T[K];
    validate?: (d: T[K]) => ValidatationResult;

    // TODO: Field sizing / re-sizing (inc default implementations)
}

export interface PrimaryField<
    T,
    K extends keyof T,
    FieldSpecT extends FieldSpec<T[K]> = FieldSpec<T[K]>
> extends Field<T, K, FieldSpecT> {
    defaultSortPriority?: number;
}

export interface SecondaryField<
    T,
    K extends keyof T,
    FieldSpecT extends FieldSpec<T[K]> = FieldSpec<T[K]>
> extends Field<T, K, FieldSpecT> {}

export type PrimaryKeyFieldSpec<S> =
    | StringFieldSpec<S>
    | IntegerFieldSpec<S>
    | SelectFieldSpec<S>;

export interface PrimaryFields<T, PK extends keyof T> {
    keyField: Readonly<PrimaryField<T, PK, PrimaryKeyFieldSpec<T[PK]>>>;

    otherFields?: {
        [K in string]?: Readonly<PrimaryField<T, keyof T>>;
    };
}

export enum SecondaryFieldsMode {
    hidden,
    modal,
    sidepanel,
}

export interface SecondaryFields<T> {
    mode: SecondaryFieldsMode;
    fields: {
        [K in string]?: Readonly<SecondaryField<T, keyof T>>;
    };
}

export interface HighlightingOption<T> {
    name: string;
    ariaLabel: string;
    apply: (value: T) => boolean;
}

export type HighlightingOptions<T> = Array<HighlightingOption<T>>;

/** For "delayed CUD mode" - i.e. CUD many then save in a batch */
export type BatchModeCUDCallbacks<T, PK extends keyof T> = {
    hideLeavingPageWithUnsavedChangesWarning?: boolean;

    generateTemporaryKey: () => T[PK];
    create: (temporaryKey: T[PK], value: Partial<Omit<T, PK>>) => boolean;
    update: (values: Map<T[PK], T>) => Map<T[PK], UpdateResult>;
    delete: (values: Set<T[PK]>) => Map<T[PK], boolean>;
    save: (keys: Set<T[PK]>) => Promise<Map<T[PK], boolean>>;
};

/** For "instant CUD mode" - i.e. save CUD changes immediately to server */
export type InstantModeCUDCallbacks<T, PK extends keyof T> = {
    create: (value: Partial<T>) => Promise<T[PK] | null>;
    /** For "instant CUD mode" - i.e. save CUD changes immediately to server */
    update: (values: Map<T[PK], T>) => Promise<Map<T[PK], UpdateResult>>;
    /** For "instant CUD mode" - i.e. save CUD changes immediately to server */
    delete: (values: Set<T[PK]>) => Promise<Map<T[PK], boolean>>;
};

export interface CUDCallbacks<T, PK extends keyof T> {
    cudCallbacks?:
        | BatchModeCUDCallbacks<T, PK>
        | InstantModeCUDCallbacks<T, PK>;
}

const defaultRenderers: {
    readonly [K in FieldType]: (...args: Array<any>) => JSX.Element;
} = {
    [FieldType.string]: function renderStringField(value: string) {
        return <span>{value}</span>;
    },
    [FieldType.integer]: function renderIntegerField(value: number) {
        return <span>{value}</span>;
    },
    [FieldType.boolean]: function renderBooleanField(value: boolean) {
        if (value) {
            return <FAIcon iconStyle="s" icon="check" color="green.400" />;
        } else {
            return <FAIcon iconStyle="s" icon="times" color="red.400" />;
        }
    },
    [FieldType.select]: function renderSelectField(
        keys: string | Array<string>
    ) {
        if (keys instanceof Array) {
            return (
                <span>
                    {keys.reduce((acc, key) => `${acc}, ${key}`, "").substr(2)}
                </span>
            );
        } else {
            return <span>{keys}</span>;
        }
    },
};

export interface CRUDTableProps<T, PK extends keyof T> {
    /**
     * The source data
     */
    data: ReadonlyMap<string, Readonly<T>>;

    /**
     * Fields which are shown in the table and may be editable within the table.
     */
    primaryFields: Readonly<PrimaryFields<Readonly<T>, PK>>;

    /**
     * Fields which are hidden or editable through a side-panel or popout.
     */
    secondaryFields?: Readonly<SecondaryFields<Readonly<T>>>;

    /**
     * Options for highlighting (without filtering) rows
     */
    highlighting?: Readonly<HighlightingOptions<Readonly<T>>>;

    /**
     * Create, Select, Update, Delete callbacks
     */
    csud?: CUDCallbacks<T, PK>;

    /**
     * Buttons to show in the controls bar - e.g. "send emails to selected
     * attendees."
     */
    customButtons?: Array<JSX.Element>;

    // TODO: Import from: CSV, JSON, XML
    //   - Simple import (columns/fields directly mapped)
    //   - And / or complex import using processing function

    // TODO: Export to: CSV, JSON, XML
    //   - Simple export (columns/fields directly mapped)
    //   - And / or complex export using processing function
}

function StringFilterInput({
    value,
    placeholder,
    label,
    onChange,
}: {
    value: string;
    placeholder?: string;
    label: string;
    onChange?: (value: string) => void;
}) {
    return (
        <Input
            value={value ?? ""}
            placeholder={placeholder ?? "Filter..."}
            aria-label={label}
            onChange={onChange ? (ev) => onChange(ev.target.value) : undefined}
        />
    );
}

function FilterInput({
    fieldType,
    ...props
}: {
    fieldType: FieldType;
    value: any;
    placeholder?: string;
    label: string;
    onChange: (value: unknown) => void;
}) {
    switch (fieldType) {
        case FieldType.string:
            return <StringFilterInput {...props} />;
        default:
            return <Text as="span">TODO: Filter type ({fieldType})</Text>;
    }
}

// General: TODO: Ensure that operations act on the set of "selected and
// filtered" keys not just the set of selected keys (since that would produce
// unexpected results).
//
// Filtering: TODO: Supply set of "selected & filtered keys" to custom button
// click events
//
// Primary Fields: TODO: Render string editor TODO: Implement & test string
// editor TODO: Apply string editor limits TODO: Apply string custom equality
// test or default equality test TODO: Render integer editor TODO: Implement &
// test integer editor TODO: Apply integer editor limits TODO: Apply integer
// custom equality test or default equality test TODO: Render boolean editor
// inc. checkbox vs toggle format TODO: Implement & test boolean editor TODO:
// Render select editor (inc. multi-select) TODO: Implement & test select editor
// (inc. multi-select) TODO: Implement & test select create option modal TODO:
// Apply field validation to edits TODO: Apply field aria labels TODO: Apply
// field descriptions in more places TODO: Apply field isEditable TODO: Apply
// field isMultiEditable TODO: Apply field default value TODO: Apply default
// sorting priority
//
// Secondary Fields (+ primary ones in Create modal): TODO: Apply secondary
// field mode TODO: Render string editor TODO: Implement & test string editor
// TODO: Apply string editor limits TODO: Apply string custom equality test or
// default equality test TODO: Render integer editor TODO: Implement & test
// integer editor TODO: Apply integer editor limits TODO: Apply integer custom
// equality test or default equality test TODO: Render boolean editor inc.
// checkbox vs toggle format TODO: Implement & test boolean editor TODO: Render
// select editor (inc. multi-select) TODO: Implement & test select editor (inc.
// multi-select) TODO: Implement & test select create option modal TODO: Apply
// field validation to edits TODO: Apply field aria labels TODO: Apply field
// descriptions in more places TODO: Apply field isEditable TODO: Apply field
// isMultiEditable TODO: Apply field default value
//
// Highlighting: TODO: Render highlighting options dropdown menu TODO: Toggle
// highlighting options on/off TODO: Apply highlighting options to cells
//
// CSUD: TODO: Implement & test multi-select TODO: Implement sync creation via
// modal TODO: Implement async creation via modal TODO: Implement sync
// single-update via modal TODO: Implement async single-update via modal TODO:
// Implement sync multi-update via modal TODO: Implement async multi-update via
// modal TODO: Implement sync single-delete TODO: Implement async single-delete
// TODO: Implement sync multi-delete TODO: Implement async multi-delete
//
// Buttons: TODO: Save changes button (when in batch mode) TODO: Changes being
// saved badge (when in instant mode) TODO: Multi-delete button TODO:
// Multi-update (aka multi-edit) button TODO: Select all / deselect all button /
// clear selection (inc. hidden selections) TODO: Render & implement custom
// buttons
//
// Other: TODO: Unsaved changes prompt TODO: Hide individual delete buttons when
// multi-selected TODO: Double-click any cell to add to selection
export default function CRUDTable<T, PK extends keyof T>({
    data,
    primaryFields: {
        keyField: primaryKeyField,
        otherFields: otherPrimaryFields,
    },
    secondaryFields,
    csud,
    highlighting,
    customButtons,
}: Readonly<CRUDTableProps<T, PK>>): JSX.Element {
    const [selectedKeys, setSelectedKeys] = useState<Set<T[PK]>>(new Set());
    const [filterValues, setFilterValues] = useState<Map<string, unknown>>(
        new Map()
    );

    const selectionBgColor = useColorModeValue("purple.50", "purple.900");
    const selectionTextColor = useColorModeValue("black", "white");

    const visibleFields = useMemo(
        () =>
            (primaryKeyField.isHidden
                ? []
                : [
                      (primaryKeyField as unknown) as Readonly<
                          PrimaryField<T, keyof T>
                      >,
                  ]
            ).concat(
                otherPrimaryFields
                    ? (Object.values(otherPrimaryFields) as Array<
                          Readonly<PrimaryField<T, keyof T>>
                      >).filter((x) => !x.isHidden)
                    : []
            ),
        [otherPrimaryFields, primaryKeyField]
    );

    const hasSecondaryFields = !!secondaryFields;
    const isFilterable = visibleFields.some((field) => !!field.spec.filter);
    const includeDeleteColumn = !!csud?.cudCallbacks?.delete;
    const includeSelectorColumn =
        includeDeleteColumn || hasSecondaryFields || isFilterable;

    // TODO: Reverse this whole thing - render every item to an element, then
    //       only include those elements which pass the filter!
    const dataToRender = useMemo(() => {
        if (!isFilterable) {
            return data;
        }

        function applyFieldFilter<S, J extends keyof S>(
            field: Field<S, J>,
            item: S
        ): boolean {
            switch (field.spec.fieldType) {
                case FieldType.string: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        filterValues.get(field.heading) as string | undefined,
                        field.spec.shouldNotTrim,
                        field.spec.disallowSpaces
                    );
                }
                case FieldType.integer: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        filterValues.get(field.heading) as number | undefined
                    );
                }
                case FieldType.boolean: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        filterValues.get(field.heading) as boolean | undefined
                    );
                }
                case FieldType.select: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        filterValues.get(field.heading) as string[] | undefined
                    );
                }
            }
        }

        const filterFields = visibleFields.filter((x) => !!x.spec.filter);
        const result = new Map<string, Readonly<T>>();
        data.forEach((item, key) => {
            if (filterFields.every((field) => applyFieldFilter(field, item))) {
                result.set(key, item);
            }
        });
        return result;
    }, [data, filterValues, isFilterable, visibleFields]);

    const renderCell = useCallback(
        (
            rowKey: string,
            columnKey: string,
            contents: JSX.Element,
            rowIdx: number,
            colIdx: number,
            totalRows: number,
            totalCols: number,
            selected?: boolean
        ) => (
            <GridItem
                key={`${rowKey}-${columnKey}`}
                textAlign="center"
                colSpan={1}
                padding={[2, 4]}
                border={"solid"}
                borderLeftWidth={colIdx >= 0 ? 1 : 0}
                borderRightWidth={
                    colIdx === totalCols - 1 && rowIdx >= 0 ? 1 : 0
                }
                borderTopWidth={rowIdx >= 0 ? 1 : 0}
                borderBottomWidth={rowIdx < totalRows - 1 ? 0 : 1}
                borderColor={selected ? "purple.500" : "gray.700"}
                bgColor={selected ? selectionBgColor : undefined}
                color={selected ? selectionTextColor : undefined}
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                {contents}
            </GridItem>
        ),
        [selectionBgColor, selectionTextColor]
    );

    const headingsRow = useMemo(() => {
        let result: Array<JSX.Element> = [];
        const rowIdx = -2;

        if (includeSelectorColumn) {
            result = [
                renderCell(
                    "heading",
                    "selection",
                    <Text as="span">
                        ({dataToRender.size} row
                        {dataToRender.size > 1 ? "s" : ""})
                    </Text>,
                    rowIdx,
                    -1,
                    dataToRender.size,
                    visibleFields.length
                ),
                ...result,
            ];
        }

        result = result.concat(
            visibleFields.reduce(
                (acc, field, fieldIdx) => [
                    ...acc,
                    renderCell(
                        "heading",
                        fieldIdx.toString(),
                        <Tooltip label={field.description}>
                            <Heading as="h3" fontSize="1.2rem">
                                {field.heading}
                            </Heading>
                        </Tooltip>,
                        rowIdx,
                        fieldIdx,
                        dataToRender.size,
                        visibleFields.length
                    ),
                ],
                [] as JSX.Element[]
            )
        );
        return result;
    }, [dataToRender.size, includeSelectorColumn, renderCell, visibleFields]);

    const filtersRow = useMemo(() => {
        if (!visibleFields.some((field) => field.spec.filter)) {
            return undefined;
        }

        const rowIdx = -1;

        const result: JSX.Element[] = [];
        result.push(
            renderCell(
                "filter",
                "<<<###name###>>>",
                <Text as="span" fontStyle="italic">
                    Filters
                </Text>,
                rowIdx,
                -1,
                dataToRender.size,
                visibleFields.length
            )
        );
        visibleFields.forEach((field, fieldIdx) => {
            result.push(
                renderCell(
                    "filter",
                    field.heading,
                    field.spec.filter ? (
                        <FilterInput
                            fieldType={field.spec.fieldType}
                            value={filterValues.get(field.heading)}
                            label={field.ariaLabel}
                            onChange={(value) => {
                                setFilterValues((oldVals) => {
                                    const newVals = new Map(oldVals.entries());
                                    newVals.set(field.heading, value);
                                    return newVals;
                                });
                            }}
                        />
                    ) : (
                        <></>
                    ),
                    rowIdx,
                    fieldIdx,
                    dataToRender.size,
                    visibleFields.length
                )
            );
        });
        return result;
    }, [dataToRender.size, filterValues, renderCell, visibleFields]);

    const selectionBoxes = useMemo(() => {
        if (!includeSelectorColumn) {
            return new Map();
        }

        const result: Map<string, JSX.Element> = new Map();

        dataToRender.forEach((item, key) => {
            const keyV = primaryKeyField.extract(item);
            result.set(
                key,
                <Checkbox
                    isChecked={selectedKeys.has(keyV)}
                    onChange={(ev) => {
                        if (!ev.target.checked) {
                            setSelectedKeys((oldSelectedKeys) => {
                                const newSelectedKeys = new Set(
                                    oldSelectedKeys
                                );
                                newSelectedKeys.delete(keyV);
                                return newSelectedKeys;
                            });
                        } else {
                            setSelectedKeys((oldSelectedKeys) => {
                                const newSelectedKeys = new Set(
                                    oldSelectedKeys
                                );
                                newSelectedKeys.add(keyV);
                                return newSelectedKeys;
                            });
                        }
                    }}
                />
            );
        });

        return result;
    }, [dataToRender, includeSelectorColumn, primaryKeyField, selectedKeys]);

    const rows = useMemo(() => {
        const result: Array<Array<JSX.Element>> = [];

        dataToRender.forEach((item, key) => {
            const cells: Array<JSX.Element> = [];
            if (includeSelectorColumn) {
                cells.push(
                    renderCell(
                        key,
                        "selection",
                        selectionBoxes.get(key),
                        result.length,
                        -1,
                        dataToRender.size,
                        visibleFields.length
                    )
                );
            }
            const keyV = primaryKeyField.extract(item);
            visibleFields.forEach((field, fieldIdx) => {
                const value = field.extract(item);
                cells.push(
                    renderCell(
                        key,
                        fieldIdx.toString(),
                        defaultRenderers[field.spec.fieldType](
                            field.spec.convertToUI(value)
                        ),
                        result.length,
                        fieldIdx,
                        dataToRender.size,
                        visibleFields.length,
                        selectedKeys.has(keyV)
                    )
                );
            });
            result.push(cells);
        });

        return result;
    }, [
        dataToRender,
        includeSelectorColumn,
        primaryKeyField,
        renderCell,
        selectedKeys,
        selectionBoxes,
        visibleFields,
    ]);

    const columnCount =
        (includeSelectorColumn ? 1 : 0) +
        (includeDeleteColumn ? 1 : 0) +
        visibleFields.length;
    let templateColumnsStr = "";
    for (let i = 0; i < columnCount; i++) {
        templateColumnsStr += " auto";
    }

    return (
        <VStack width="100%">
            <Grid width="100%" templateColumns={templateColumnsStr}>
                {headingsRow}
                {filtersRow}
                {rows.reduce((acc, cells) => [...acc, ...cells], [])}
            </Grid>
        </VStack>
    );
}
