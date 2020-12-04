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
import assert from "assert";
import React, { useCallback, useMemo, useState } from "react";
import FAIcon from "../Icons/FAIcon";
import useDebouncedState from "./useDebouncedState";

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

// TODO: Button field type

export type StringFieldSpec<S> = {
    fieldType: FieldType.string;

    multiLine?: boolean; // TODO: Render text area
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

export interface Field<S, T, FieldSpecT extends FieldSpec<T> = FieldSpec<T>> {
    spec: Readonly<FieldSpecT>;

    heading: string;
    ariaLabel: string;
    description: string;

    isHidden: boolean;
    isEditable?: boolean;
    isMultiEditable?: boolean;

    defaultValue?: T;

    extract: (d: S) => T;
    validate?: (d: T) => ValidatationResult;

    //
    // - TODO: Field sizing / re-sizing (inc default implementations)
}

export interface PrimaryField<
    S,
    T,
    FieldSpecT extends FieldSpec<T> = FieldSpec<T>
> extends Field<S, T, FieldSpecT> {
    defaultSortPriority?: number;
}

export interface SecondaryField<
    S,
    T,
    FieldSpecT extends FieldSpec<T> = FieldSpec<T>
> extends Field<S, T, FieldSpecT> {}

export type PrimaryKeyFieldSpec<S> =
    | StringFieldSpec<S>
    | IntegerFieldSpec<S>
    | SelectFieldSpec<S>;

export interface PrimaryFields<T, PK extends keyof T> {
    keyField: Readonly<PrimaryField<T, T[PK], PrimaryKeyFieldSpec<T[PK]>>>;

    otherFields?: {
        [K in string]?: Readonly<PrimaryField<T, any>>;
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
    create?: (temporaryKey: T[PK], value: Partial<Omit<T, PK>>) => boolean;
    update?: (values: Map<T[PK], T>) => Map<T[PK], UpdateResult>;
    delete?: (values: Set<T[PK]>) => Map<T[PK], boolean>;
    save: (keys: Set<T[PK]>) => Promise<Map<T[PK], boolean>>;
};

/** For "instant CUD mode" - i.e. save CUD changes immediately to server */
export type InstantModeCUDCallbacks<T, PK extends keyof T> = {
    create?: (value: Partial<T>) => Promise<T[PK] | null>;
    /** For "instant CUD mode" - i.e. save CUD changes immediately to server */
    update?: (values: Map<T[PK], T>) => Promise<Map<T[PK], UpdateResult>>;
    /** For "instant CUD mode" - i.e. save CUD changes immediately to server */
    delete?: (values: Set<T[PK]>) => Promise<Map<T[PK], boolean>>;
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

export interface CRUDTableRowProps<T, PK extends keyof T> {
    /**
     * The row source data
     */
    rowData: {
        index: number;
        key: string;
        item: Readonly<T>;
        isSelected: boolean;
        isHighlighted?: boolean;
    };

    editMode: "single" | "multi" | false;

    /**
     * Fields which are shown in the table and may be editable within the table.
     */
    visibleFields: Readonly<PrimaryField<T, keyof T, FieldSpec<keyof T>>>[];

    /**
     * Create, Select, Update, Delete callbacks
     */
    csud?: CUDCallbacks<T, PK>;
}

export interface CRUDTableProps<T, PK extends keyof T> {
    /**
     * The source data
     */
    data: ReadonlyMap<string, Readonly<T>>;

    /**
     * Fields which may be shown in the table and may be editable within the table.
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

    //
    // - TODO: Import from: CSV, JSON, XML
    //   - Simple import (columns/fields directly mapped)
    //   - And / or complex import using processing function

    //
    // - TODO: Export to: CSV, JSON, XML
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

// General:
// - TODO: Ensure that operations act on the set of "selected and filtered" keys
//   not just the set of selected keys (since that would produce unexpected
//   results).
//
// Filtering:
// - TODO: Supply set of "selected & filtered keys" to custom button click
//   events
//
// Primary Fields:
// - TODO: Render string editor
// - TODO: Implement & test string editor
// - TODO: Apply string editor limits
// - TODO: Apply string custom equality test or default equality test
// - TODO: Render integer editor
// - TODO: Implement & test integer editor
// - TODO: Apply integer editor limits
// - TODO: Apply integer custom equality test or default equality test
// - TODO: Render boolean editor inc. checkbox vs toggle format
// - TODO: Implement & test boolean editor
// - TODO: Render select editor (inc. multi-select)
// - TODO: Implement & test select editor (inc. multi-select)
// - TODO: Implement & test select create option modal
// - TODO: Apply field validation to edits
// - TODO: Apply field aria labels
// - TODO: Apply field descriptions in more places
// - TODO: Apply field isEditable
// - TODO: Apply field isMultiEditable
// - TODO: Apply field default value
// - TODO: Apply default sorting priority
//
// Secondary Fields (+ primary ones in Create modal):
// - TODO: Apply secondary field mode
// - TODO: Render string editor
// - TODO: Implement & test string editor
//
// - TODO: Apply string editor limits
// - TODO: Apply string custom equality test or default equality test
// - TODO: Render integer editor
// - TODO: Implement & test integer editor
// - TODO: Apply integer editor limits
// - TODO: Apply integer custom equality test or default equality test
// - TODO: Render boolean editor inc. checkbox vs toggle format
// - TODO: Implement & test boolean editor
// - TODO: Render select editor (inc. multi-select)
// - TODO: Implement & test select editor (inc. multi-select)
// - TODO: Implement & test select create option modal
// - TODO: Apply field validation to edits
// - TODO: Apply field aria labels
// - TODO: Apply field descriptions in more places
// - TODO: Apply field isEditable
// - TODO: Apply field isMultiEditable
// - TODO: Apply field default value
//
// Highlighting:
// - TODO: Render highlighting options dropdown menu
// - TODO: Toggle highlighting options on/off
// - TODO: Apply highlighting options to cells
//
// CSUD:
// - TODO: Implement & test multi-select
// - TODO: Implement sync creation via modal
// - TODO: Implement async creation via modal
// - TODO: Implement sync single-update via modal
// - TODO: Implement async single-update via modal
// - TODO: Implement sync multi-update via modal
// - TODO: Implement async multi-update via modal
// - TODO: Implement sync single-delete
// - TODO: Implement async single-delete
//
// - TODO: Implement sync multi-delete
// - TODO: Implement async multi-delete
//
// Buttons:
// - TODO: Save changes button (when in batch mode)
// - TODO: Changes being saved badge (when in instant mode)
// - TODO: Multi-delete button
// - TODO: Multi-update (aka multi-edit) button
// - TODO: Select all / deselect all button / clear selection (inc. hidden
//   selections)
// - TODO: Render & implement custom buttons
//
// Other:
// - TODO: Unsaved changes prompt
// - TODO: Hide individual delete buttons when multi-selected
// - TODO: Double-click any cell to add to selection

function CRUDCell({
    rowKey,
    columnKey,
    contents,
    rowIdx,
    colIdx,
    totalCols,
    isSelected,
}: {
    rowKey: string;
    columnKey: string;
    contents: JSX.Element;
    rowIdx: number;
    colIdx: number;
    totalCols: number;
    isSelected?: boolean;
    isHighlighted?: boolean; // TODO: Apply isHighlighted
}): JSX.Element {
    const selectionBgColor = useColorModeValue("purple.50", "purple.900");
    const selectionTextColor = useColorModeValue("black", "white");

    return (
        <GridItem
            key={`${rowKey}-${columnKey}`}
            textAlign="center"
            colSpan={1}
            padding={[2, 4]}
            border={"solid"}
            borderLeftWidth={colIdx >= 0 ? 1 : 0}
            borderRightWidth={colIdx === totalCols - 1 && rowIdx >= 0 ? 1 : 0}
            borderTopWidth={rowIdx >= 0 ? 1 : 0}
            borderBottomWidth={0}
            borderColor={isSelected ? "purple.500" : "gray.700"}
            bgColor={isSelected ? selectionBgColor : undefined}
            color={isSelected ? selectionTextColor : undefined}
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            {contents}
        </GridItem>
    );
}

type CRUDRowElement = JSX.Element;
function CRUDRow<T, PK extends keyof T>({
    rowData: { index: rowIndex, key, item, isSelected, isHighlighted },
    editMode,
    visibleFields,
    csud,
}: Readonly<CRUDTableRowProps<T, PK>>): CRUDRowElement {
    // const enableUpdate = editMode && !!csud?.cudCallbacks?.update;
    // const enableDelete = editMode && !!csud?.cudCallbacks?.delete;

    const cellsOut = useMemo(() => {
        const cells: Array<JSX.Element> = [];

        visibleFields.forEach((field, fieldIdx) => {
            const value = field.extract(item);
            cells.push(
                <CRUDCell
                    key={`${key}-${fieldIdx}-row`}
                    rowKey={key}
                    columnKey={fieldIdx.toString()}
                    contents={defaultRenderers[field.spec.fieldType](
                        field.spec.convertToUI(value)
                    )}
                    rowIdx={rowIndex}
                    colIdx={fieldIdx}
                    totalCols={visibleFields.length}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted}
                />
            );
        });

        return cells;
    }, [rowIndex, key, item, isSelected, isHighlighted, visibleFields]);

    return <>{cellsOut}</>;
}

function CRUDSelectionBox<T, PK extends keyof T>({
    item,
    primaryKeyField,
    isSelected,
    setSelectedKeys,
}: {
    item: T;
    primaryKeyField: Readonly<
        PrimaryField<T, T[PK], PrimaryKeyFieldSpec<T[PK]>>
    >;
    isSelected: boolean;
    setSelectedKeys: React.Dispatch<React.SetStateAction<Set<T[PK]>>>;
}): JSX.Element {
    const keyV = primaryKeyField.extract(item);
    return (
        <Checkbox
            isChecked={isSelected}
            onChange={(ev) => {
                if (!ev.target.checked) {
                    setSelectedKeys((oldSelectedKeys) => {
                        const newSelectedKeys = new Set(oldSelectedKeys);
                        newSelectedKeys.delete(keyV);
                        return newSelectedKeys;
                    });
                } else {
                    setSelectedKeys((oldSelectedKeys) => {
                        const newSelectedKeys = new Set(oldSelectedKeys);
                        newSelectedKeys.add(keyV);
                        return newSelectedKeys;
                    });
                }
            }}
        />
    );
}

export default function CRUDTable<T, PK extends keyof T>({
    data,
    primaryFields: {
        keyField: primaryKeyField,
        otherFields: otherPrimaryFields,
    },
    secondaryFields,
    csud,
}: // TODO: highlighting,
// TODO: customButtons,
Readonly<CRUDTableProps<T, PK>>): JSX.Element {
    const [selectedKeys, setSelectedKeys] = useState<Set<T[PK]>>(new Set());
    const [
        filterValues,
        debouncedFilterValues,
        setFilterValues,
    ] = useDebouncedState<Map<string, unknown>>(new Map());

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
    const filterFields = useMemo(
        () => visibleFields.filter((x) => !!x.spec.filter),
        [visibleFields]
    );

    const hasSecondaryFields = !!secondaryFields;
    const isFilterable = visibleFields.some((field) => !!field.spec.filter);
    const includeDeleteColumn = !!csud?.cudCallbacks?.delete;
    const includeSelectorColumn =
        includeDeleteColumn || hasSecondaryFields || isFilterable;
    const editMode =
        selectedKeys.size === 1
            ? "single"
            : selectedKeys.size > 0
            ? "multi"
            : false;

    const allRows = useMemo(() => {
        const result: Map<string, CRUDRowElement> = new Map();

        data.forEach((item, key) => {
            const keyV = primaryKeyField.extract(item);
            const isSelected = selectedKeys.has(keyV);
            result.set(
                key,
                <CRUDRow
                    key={`crud-row-${key}`}
                    rowData={{
                        index: result.size,
                        key,
                        item,
                        isSelected,
                    }}
                    editMode={editMode}
                    visibleFields={visibleFields}
                    csud={csud}
                />
            );
        });

        return result;
    }, [csud, data, editMode, primaryKeyField, selectedKeys, visibleFields]);

    const applyFieldFilter = useCallback(
        function _applyFieldFilter<S, J extends keyof S>(
            field: Field<S, J>,
            item: S
        ): boolean {
            switch (field.spec.fieldType) {
                case FieldType.string: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        debouncedFilterValues.get(field.heading) as
                            | string
                            | undefined,
                        field.spec.shouldNotTrim,
                        field.spec.disallowSpaces
                    );
                }
                case FieldType.integer: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        debouncedFilterValues.get(field.heading) as
                            | number
                            | undefined
                    );
                }
                case FieldType.boolean: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        debouncedFilterValues.get(field.heading) as
                            | boolean
                            | undefined
                    );
                }
                case FieldType.select: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        debouncedFilterValues.get(field.heading) as
                            | string[]
                            | undefined
                    );
                }
            }
        },
        [debouncedFilterValues]
    );

    const headingsRow = useMemo(() => {
        console.log("re-rendering headings row");

        const rowIdx = -2;
        return visibleFields.reduce(
            (acc, field, fieldIdx) => [
                ...acc,
                <CRUDCell
                    key={`heading-${fieldIdx}`}
                    rowKey={"heading"}
                    columnKey={fieldIdx.toString()}
                    contents={
                        <Tooltip label={field.description}>
                            <Heading as="h3" fontSize="1.2rem">
                                {field.heading}
                            </Heading>
                        </Tooltip>
                    }
                    rowIdx={rowIdx}
                    colIdx={fieldIdx}
                    totalCols={visibleFields.length}
                />,
            ],
            [] as JSX.Element[]
        );
    }, [visibleFields]);

    const filtersRow = useMemo(() => {
        const result: JSX.Element[] = [];
        if (visibleFields.some((field) => field.spec.filter)) {
            const rowIdx = -1;
            result.push(
                <CRUDCell
                    key={"filter-<<<###filter-title###>>>"}
                    rowKey={"filter"}
                    columnKey={"<<<###filter-title###>>>"}
                    contents={
                        <Text as="span" fontStyle="italic">
                            Filters
                        </Text>
                    }
                    rowIdx={rowIdx}
                    colIdx={-1}
                    totalCols={visibleFields.length}
                />
            );
            visibleFields.forEach((field, fieldIdx) => {
                result.push(
                    <CRUDCell
                        key={`filter-${field.heading}`}
                        rowKey={"filter"}
                        columnKey={field.heading}
                        contents={
                            field.spec.filter ? (
                                <FilterInput
                                    fieldType={field.spec.fieldType}
                                    value={filterValues.get(field.heading)}
                                    label={field.ariaLabel}
                                    onChange={(value) => {
                                        setFilterValues((oldVals) => {
                                            const newVals = new Map(
                                                oldVals.entries()
                                            );
                                            newVals.set(field.heading, value);
                                            return newVals;
                                        });
                                    }}
                                />
                            ) : (
                                <></>
                            )
                        }
                        rowIdx={rowIdx}
                        colIdx={fieldIdx}
                        totalCols={visibleFields.length}
                    />
                );
            });
        }
        return result;
    }, [filterValues, setFilterValues, visibleFields]);

    const rowEls = useMemo(() => {
        const result: Array<JSX.Element[]> = [];

        if (!isFilterable) {
            allRows.forEach((rowEl, key) => {
                if (includeSelectorColumn) {
                    const item = data.get(key);
                    assert(item);
                    const keyV = primaryKeyField.extract(item);
                    const isSelected = selectedKeys.has(keyV);

                    result.push([
                        <CRUDCell
                            key={`${key}-selection`}
                            rowKey={key}
                            columnKey={"selection"}
                            contents={
                                <CRUDSelectionBox
                                    item={item}
                                    primaryKeyField={primaryKeyField}
                                    isSelected={isSelected}
                                    setSelectedKeys={setSelectedKeys}
                                />
                            }
                            rowIdx={result.length}
                            colIdx={-1}
                            totalCols={visibleFields.length}
                        />,
                        rowEl,
                    ]);
                } else {
                    result.push([rowEl]);
                }
            });
        } else {
            data.forEach((item, key) => {
                if (
                    filterFields.every((field) => applyFieldFilter(field, item))
                ) {
                    const rowEl = allRows.get(key);
                    assert(rowEl);
                    if (includeSelectorColumn) {
                        const item = data.get(key);
                        assert(item);
                        const keyV = primaryKeyField.extract(item);
                        const isSelected = selectedKeys.has(keyV);

                        result.push([
                            <CRUDCell
                                key={`${key}-selection`}
                                rowKey={key}
                                columnKey={"selection"}
                                contents={
                                    <CRUDSelectionBox
                                        item={item}
                                        primaryKeyField={primaryKeyField}
                                        isSelected={isSelected}
                                        setSelectedKeys={setSelectedKeys}
                                    />
                                }
                                rowIdx={result.length}
                                colIdx={-1}
                                totalCols={visibleFields.length}
                            />,
                            rowEl,
                        ]);
                    } else {
                        result.push([rowEl]);
                    }
                }
            });
        }

        return result;
    }, [
        allRows,
        applyFieldFilter,
        data,
        filterFields,
        includeSelectorColumn,
        isFilterable,
        primaryKeyField,
        selectedKeys,
        visibleFields.length,
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
                {includeSelectorColumn ? (
                    <CRUDCell
                        key={"heading-selection"}
                        rowKey={"heading"}
                        columnKey={"selection"}
                        contents={
                            <Text as="span">
                                ({rowEls.length} row
                                {rowEls.length > 1 ? "s" : ""})
                            </Text>
                        }
                        rowIdx={-2}
                        colIdx={-1}
                        totalCols={visibleFields.length}
                    />
                ) : (
                    <></>
                )}
                {headingsRow}
                {filtersRow}
                {rowEls.reduce((acc, cells) => [...acc, ...cells], [])}
            </Grid>
        </VStack>
    );
}
