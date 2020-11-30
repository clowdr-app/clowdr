import { Divider, Grid, GridItem, Heading, Tooltip, VStack } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
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

function defaultStringFilter(
    item: string,
    search: string | undefined,
    shouldNotTrim: boolean,
    disallowSpaces: boolean
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

function defaultIntegerFilter(
    item: number,
    searchLower?: number,
    searchUpper?: number
): boolean {
    return (
        (searchLower === undefined || searchLower <= item) &&
        (searchUpper === undefined || item <= searchUpper)
    );
}

function defaultBooleanFilter(item: boolean, search?: boolean) {
    if (search === undefined) {
        return true;
    }

    return item === search;
}

function defaultSelectFilter(itemKey: string, searchKeys?: Array<string>) {
    if (searchKeys === undefined) {
        return true;
    }

    return searchKeys.some((key) => itemKey === key);
}

const defaultFilters: {
    readonly [K in FieldType]: (...args: Array<any>) => boolean;
} = {
    [FieldType.string]: defaultStringFilter,
    [FieldType.integer]: defaultIntegerFilter,
    [FieldType.boolean]: defaultBooleanFilter,
    [FieldType.select]: defaultSelectFilter,
};

function defaultStringSorter(itemX: string, itemY: string): number {
    return itemX.toLowerCase().localeCompare(itemY.toLowerCase());
}

function defaultIntegerSorter(itemX: number, itemY: number): number {
    return itemX - itemY;
}

function defaultBooleanSorter(itemX: boolean, itemY: boolean): number {
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

function defaultSelectSorter(
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

const defaultSorters: {
    readonly [K in FieldType]: (...args: Array<any>) => number;
} = {
    [FieldType.string]: defaultStringSorter,
    [FieldType.integer]: defaultIntegerSorter,
    [FieldType.boolean]: defaultBooleanSorter,
    [FieldType.select]: defaultSelectSorter,
};

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

    filter?: (item: string, search?: string) => boolean;
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
    ariaLabel: string; // TODO: Do we need this? If so, where?
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
    title: string;
    description?: string;
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
    selected?: {
        one: (key: T[PK]) => boolean;
        many?: (keys: Array<T[PK]>) => Array<T[PK]>;
    };

    cudCallbacks: BatchModeCUDCallbacks<T, PK> | InstantModeCUDCallbacks<T, PK>;
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
        }
        else {
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
    // TODO: Buttons
    // TODO: Changes to save prompt
    // TODO: Primary fields
    // TODO: Secondary fields
    // TODO: Selection(s)
    // TODO: Asynchronous single-edit CUD operations
    // TODO: Synchronous single-edit CUD operations
    // TODO: Asynchronous multi-edit CUD operations
    // TODO: Synchronous multi-edit CUD operations
    // TODO: Highlighting

    // TODO: Maybe Selector column
    // TODO: Maybe Delete column

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

    const renderCell = useCallback(
        (rowKey: string, columnKey: string, contents: JSX.Element) => (
            <GridItem
                key={`${rowKey}-${columnKey}`}
                textAlign="center"
                colSpan={1}
                padding={[2, 4]}
            >
                {contents}
            </GridItem>
        ),
        []
    );

    const headingsRow = useMemo(() => {
        const result = visibleFields.reduce(
            (acc, field, fieldIdx) => [
                ...acc,
                renderCell(
                    "heading",
                    fieldIdx.toString(),
                    <Tooltip label={field.description}>
                        <Heading as="h3" fontSize="1.2rem">
                            {field.heading}
                        </Heading>
                    </Tooltip>
                ),
                <GridItem key={`heading-col-divider-${fieldIdx}`}>
                    <Divider orientation="vertical" />
                </GridItem>,
            ],
            [] as JSX.Element[]
        );
        if (result.length > 0) {
            result.splice(result.length - 1, 1);
        }
        return result;
    }, [renderCell, visibleFields]);

    const rows = useMemo(() => {
        const result: Array<Array<JSX.Element>> = [];

        data.forEach((item, key) => {
            const cells: Array<JSX.Element> = [];
            visibleFields.forEach((field, fieldIdx) => {
                const value = field.extract(item);
                cells.push(
                    renderCell(
                        key,
                        fieldIdx.toString(),
                        defaultRenderers[field.spec.fieldType](
                            field.spec.convertToUI(value)
                        )
                    )
                );
                cells.push(
                    <GridItem key={`row-${key}-col-divider-${fieldIdx}`}>
                        <Divider orientation="vertical" />
                    </GridItem>
                );
            });
            if (cells.length > 0) {
                cells.splice(cells.length - 1, 1);
            }
            result.push(cells);
        });

        return result;
    }, [data, renderCell, visibleFields]);

    const fullColumnCount = visibleFields.length * 2 - 1;
    const templateColumnsStr = visibleFields.reduce(
        (acc, field, idx) => `${acc} ${idx > 0 ? "min-content auto" : "auto"}`,
        ""
    );
    return (
        <VStack width="100%">
            <Grid width="100%" templateColumns={templateColumnsStr}>
                {headingsRow}
                {rows.reduce(
                    (acc, cells, idx) => [
                        ...acc,
                        <GridItem
                            key={`row-divider-${idx}`}
                            colSpan={fullColumnCount}
                        >
                            <Divider orientation="horizontal" />
                        </GridItem>,
                        ...cells,
                    ],
                    []
                )}
            </Grid>
        </VStack>
    );
}
