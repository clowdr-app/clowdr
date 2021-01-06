import {
    Button,
    Checkbox,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    FormControl,
    FormHelperText,
    FormLabel,
    Grid,
    GridItem,
    Heading,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Spinner,
    Stack,
    Switch,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import { formatISO9075 } from "date-fns";
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import FAIcon from "../Icons/FAIcon";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";
import { DateTimePicker } from "./DateTimePicker";
import useDebouncedState from "./useDebouncedState";

export enum FieldType {
    string,
    integer,
    boolean,
    select,
    datetime,
}

export enum BooleanFieldFormat {
    switch,
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

export function defaultIntegerFilter(item: number, searchLower?: number, searchUpper?: number): boolean {
    return (searchLower === undefined || searchLower <= item) && (searchUpper === undefined || item <= searchUpper);
}

export function defaultBooleanFilter(item: boolean, search?: boolean): boolean {
    if (search === undefined) {
        return true;
    }

    return item === search;
}

export function defaultSelectFilter(
    itemOptions: SelectOption | Array<SelectOption>,
    searchValues?: Array<string>
): boolean {
    if (searchValues === undefined) {
        return true;
    }

    return searchValues.some((key) =>
        itemOptions instanceof Array ? itemOptions.some((x) => x.value === key) : itemOptions.value === key
    );
}

export function defaultDateTimeFilter(item: Date, search?: string): boolean {
    // TODO: provide a filter method with upper and lower bound
    return search ? item.toISOString().includes(search) : true;
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

export function defaultSelectSorter(itemKeyX: string, itemKeyY: string, options: Array<SelectOption>): number {
    const itemValueX = options.find((x) => x.value === itemKeyX)?.label;
    const itemValueY = options.find((y) => y.value === itemKeyY)?.label;

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
    value: string;
    label: string;
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

    filter?: (item: string, search?: string, shouldNotTrim?: boolean, disallowSpaces?: boolean) => boolean;
    sort?: (itemX: string, itemY: string) => number;

    areEqual?: (itemX: string, itemY: string) => boolean;
};

export type IntegerFieldSpec<S> = {
    fieldType: FieldType.integer;

    min?: number;
    max?: number;

    convertToUI: (v: S) => number;
    convertFromUI?: (v: number) => S;

    filter?: (item: number, searchLower?: number, searchUpper?: number) => boolean;
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
    convertToUI: (v: S | Array<S>) => SelectOption | Array<SelectOption>;
    /** Provides the key of the selected option. */
    convertFromUI?: (v: SelectOption | Array<SelectOption>) => S | Array<S>;

    filter?: (itemOptions: SelectOption | Array<SelectOption>, searchValues?: Array<string>) => boolean;
    sort?: (
        itemKeyX: SelectOption | Array<SelectOption>,
        itemKeyY: SelectOption | Array<SelectOption>,
        options: Array<SelectOption>
    ) => number;

    areEqual?: (itemKeyX: SelectOption | Array<SelectOption>, itemKeyY: SelectOption | Array<SelectOption>) => boolean;

    /** Intended to be used for a modal dialog to create new items. */
    create?: Readonly<{
        begin: (onCompleted: () => void) => boolean;
    }>;
};

export type DateTimeFieldSpec<S> = {
    fieldType: FieldType.datetime;

    convertToUI: (v: S) => Date;
    convertFromUI: (v: Date) => S;

    filter?: (item: Date, search?: string) => boolean;
    sort?: (itemX: Date, itemY: Date) => number;

    areEqual?: (itemX: Date, itemY: Date) => boolean;
};

export type FieldSpec<S> =
    | StringFieldSpec<S>
    | IntegerFieldSpec<S>
    | BooleanFieldSpec<S>
    | SelectFieldSpec<S>
    | DateTimeFieldSpec<S>;

export type ValidatationResult = true | Array<string>;
export type UpdateResult = true | Array<string>;

export interface Field<S, T, FieldSpecT extends FieldSpec<T> = FieldSpec<T>> {
    spec: Readonly<FieldSpecT>;

    heading: string;
    ariaLabel: string;
    description: string;

    isHidden: boolean;
    isEditableAtCreate?: boolean;
    isEditable?: boolean;
    // TODO: String editor input type (text, email, multiline, etc)

    editorFalseLabel?: string;
    editorTrueLabel?: string;

    defaultValue?: T;

    extract: (d: S) => T;
    insert?: <U extends Partial<S>>(item: U, value: T) => U;
    validate?: (d: T) => ValidatationResult;

    //
    // - TODO: Field sizing / re-sizing (inc default implementations)
}

export interface PrimaryField<S, T, FieldSpecT extends FieldSpec<T> = FieldSpec<T>> extends Field<S, T, FieldSpecT> {
    defaultSortPriority?: number;
}

export type PrimaryKeyFieldSpec<S> = StringFieldSpec<S> | IntegerFieldSpec<S> | SelectFieldSpec<S>;

export type PrimaryKeyField<T, PK extends keyof T> = PrimaryField<T, T[PK], PrimaryKeyFieldSpec<T[PK]>> & {
    getRowTitle: (item: T) => string;
};

export interface PrimaryFields<T, PK extends keyof T> {
    keyField: Readonly<PrimaryKeyField<T, PK>>;

    otherFields?: {
        [K in string]?: Readonly<PrimaryField<T, any>>;
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
    create?: (temporaryKey: T[PK], value: Partial<T>) => boolean;
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
    cudCallbacks?: BatchModeCUDCallbacks<T, PK> | InstantModeCUDCallbacks<T, PK>;
}

export type EditMode = {
    label: string;
    onChange: (value: any) => void;
    opts?: any;
    isDisabled?: boolean;
};

const defaultRenderers: {
    readonly [K in FieldType]: (value: any, editMode?: EditMode) => JSX.Element;
} = {
    [FieldType.string]: function renderStringField(value: string, editMode) {
        if (editMode) {
            return (
                <Input
                    value={value ?? ""}
                    onChange={(ev) => editMode.onChange(ev.target.value)}
                    aria-label={editMode.label}
                    disabled={editMode.isDisabled}
                    maxWidth="100%"
                />
            );
        } else {
            return (
                <Text as="span" maxWidth="100%">
                    {value}
                </Text>
            );
        }
    },
    [FieldType.integer]: function renderIntegerField(value: number, editMode) {
        if (editMode) {
            return (
                <NumberInput
                    precision={0}
                    value={value ?? ""}
                    onChange={(value) => editMode.onChange(value.length === 0 ? null : parseInt(value, 10))}
                    aria-label={editMode.label}
                    disabled={editMode.isDisabled}
                    maxWidth="100%"
                    max={editMode.opts.max}
                    min={editMode.opts.min}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            );
        }
        return (
            <Text as="span" maxWidth="100%">
                {value}
            </Text>
        );
    },
    [FieldType.boolean]: function renderBooleanField(value: boolean, editMode) {
        if (editMode) {
            return (
                <HStack align="center">
                    {editMode.opts?.falseLabel ? <Text as="span">{editMode.opts?.falseLabel}</Text> : undefined}
                    {editMode.opts?.format === BooleanFieldFormat.switch ? (
                        <Switch
                            isChecked={value}
                            colorScheme="blue"
                            onChange={(ev) => editMode.onChange(ev.target.checked)}
                            aria-label={editMode.label}
                            disabled={editMode.isDisabled}
                        />
                    ) : (
                        <Checkbox
                            isChecked={value}
                            colorScheme="blue"
                            onChange={(ev) => editMode.onChange(ev.target.checked)}
                            aria-label={editMode.label}
                            disabled={editMode.isDisabled}
                        />
                    )}
                    {editMode.opts?.trueLabel ? <Text as="span">{editMode.opts?.trueLabel}</Text> : undefined}
                </HStack>
            );
        } else {
            if (value) {
                return <FAIcon iconStyle="s" icon="check" color="green.400" />;
            } else {
                return <FAIcon iconStyle="s" icon="times" color="red.400" />;
            }
        }
    },
    [FieldType.select]: function renderSelectField(options: SelectOption | Array<SelectOption>, editMode) {
        if (editMode) {
            return (
                <Select
                    aria-label={editMode.label}
                    isDisabled={editMode.isDisabled}
                    options={editMode.opts.options}
                    isMulti={editMode.opts.multiSelect}
                    closeMenuOnSelect={true}
                    value={options as any}
                    onChange={(value) => {
                        editMode.onChange(value);
                    }}
                    styles={{
                        container: (provided: any, _state: any) => ({
                            ...provided,
                            width: "100%",
                            backgroundColor: "#322659",
                            color: "white",
                        }),
                        control: (provided: any, _state: any) => ({
                            ...provided,
                            backgroundColor: "inherit",
                            color: "inherit",
                        }),
                        menu: (provided: any, _state: any) => ({
                            ...provided,
                            backgroundColor: "inherit",
                            color: "inherit",
                        }),
                        menuList: (provided: any, _state: any) => ({
                            ...provided,
                            maxHeight: "120px",
                            scrollBehavior: "smooth",
                        }),
                        multiValue: (provided: any, _state: any) => ({
                            ...provided,
                            backgroundColor: "#f0edf7",
                            color: "black",
                        }),
                        singleValue: (provided: any, _state: any) => ({
                            ...provided,
                            color: "white",
                        }),
                        multiValueLabel: (provided: any, _state: any) => ({
                            ...provided,
                            color: "black",
                        }),
                        option: (styles: any, { isDisabled, isFocused, isSelected }: any) => {
                            return {
                                ...styles,
                                backgroundColor: isDisabled
                                    ? null
                                    : isSelected
                                    ? "#322659"
                                    : isFocused
                                    ? "#47367d"
                                    : null,
                                color: isDisabled ? "#ccc" : "white",
                                cursor: isDisabled ? "not-allowed" : "default",

                                ":active": {
                                    ...styles[":active"],
                                    backgroundColor: !isDisabled && (isSelected ? "#47367d" : "#47367d"),
                                },
                            };
                        },
                    }}
                />
            );
        } else {
            if (options instanceof Array) {
                return (
                    <Text as="span" maxWidth="100%">
                        {options.reduce((acc, option) => `${acc}, ${option.label}`, "").substr(2)}
                    </Text>
                );
            } else {
                return (
                    <Text as="span" maxWidth="100%">
                        {options.label}
                    </Text>
                );
            }
        }
    },
    [FieldType.datetime]: function renderDateTimeField(value: Date, editMode) {
        if (editMode) {
            return <DateTimePicker value={value} editMode={editMode} />;
        } else {
            return <>{formatISO9075(value)}</>;
        }
    },
};

export interface CRUDTableRowProps<S, T, PK extends keyof S> {
    /**
     * The row source data
     */
    rowData: {
        index: number;
        key: string;
        primaryKey: S[PK];
        item: Readonly<S>;
        isSelected: boolean;
        isHighlighted?: boolean;
        isDisabled?: boolean;
    };

    addDirtyKey: (key: S[PK]) => void;

    edit?:
        | {
              mode: "single";
          }
        | { mode: "multi" };

    beginEdit: () => string;
    endEdit: (id: string) => void;

    /**
     * Fields which are shown in the table and may be editable within the table.
     */
    visibleFields: Readonly<PrimaryField<S, T, FieldSpec<T>>>[];

    /**
     * Create, Select, Update, Delete callbacks
     */
    csud?: CUDCallbacks<S, PK>;
}

export type SecondaryEditorFooterButton =
    | {
          type: "close";
      }
    | {
          colorScheme?: string;
          type: "ordinary";
          action: () => void;
          children: JSX.Element;
          label: string;
      };

export type SecondaryEditorComponents = {
    includeCloseButton: boolean;
    editorElement: JSX.Element;
    footerButtons: SecondaryEditorFooterButton[];
};

export interface CustomButton<T, PK extends keyof T> {
    text: string | JSX.Element;
    label: string;
    colorScheme: string;
    enabledWhenNothingSelected: boolean;
    enabledWhenDirty: boolean;
    tooltipWhenEnabled: string;
    tooltipWhenDisabled: string;
    action: (keys: Set<T[PK]>) => Promise<void>;
    isRunning: boolean;
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
    secondaryFields?: {
        editSingle?: (
            key: T[PK],
            onClose: () => void,
            isDirty: boolean,
            markDirty: () => void
        ) => SecondaryEditorComponents;
        editMultiple?: (
            keys: Set<T[PK]>,
            onClose: () => void,
            markDirty: (keys: Set<T[PK]>) => void
        ) => SecondaryEditorComponents;
    };

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
    customButtons?: Array<CustomButton<T, PK>>;

    /**
     * Whether some outer editor has unsaved changes or not.
     * Used to make the table's "No/unsaved changes" messages less confusing.
     */
    externalUnsavedChanges?: boolean;
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
            return <></>;
        // return <Text as="span">TODO: Filter type ({fieldType})</Text>;
    }
}

// Primary Fields:
// - TODO: Apply string editor limits
// - TODO: Apply string custom equality test or default equality test
//
// - TODO: Render integer editor
// - TODO: Implement & test integer editor
// - TODO: Apply integer editor limits
// - TODO: Apply integer custom equality test or default equality test
//
// - TODO: Implement & test select create option modal
//
// - TODO: Apply field validation to create/update
// - TODO: Apply field aria labels
// - TODO: Apply field descriptions in more places
// - TODO: Apply default sorting priority
//
// Highlighting:
// - TODO: Render highlighting options dropdown menu
// - TODO: Toggle highlighting options on/off
// - TODO: Apply highlighting options to cells
//
// Buttons:
// - TODO: Multi-edit button
//
// Other:
// - TODO: Double-click any cell to add to selection

function CRUDCell({
    rowKey,
    columnKey,
    children,
    rowIdx,
    colIdx,
    isDisabled,
    isSelected,
    minW = 200,
}: {
    rowKey: string;
    columnKey: string;
    children: JSX.Element;
    rowIdx: number;
    colIdx: number;
    isDisabled?: boolean;
    isSelected?: boolean;
    isHighlighted?: boolean; // TODO: Apply isHighlighted
    inEditingMode?: boolean;
    minW?: number;
}): JSX.Element {
    const selectionBgColor = useColorModeValue("purple.50", "purple.900");
    const selectionTextColor = useColorModeValue("black", "white");

    return (
        <GridItem
            key={`${rowKey}-${columnKey}`}
            textAlign="center"
            colSpan={1}
            padding={1}
            border={"solid"}
            borderLeftWidth={colIdx >= 0 ? 1 : 0}
            borderRightWidth={0}
            borderTopWidth={rowIdx >= 0 ? 1 : 0}
            borderBottomWidth={0}
            borderColor={isSelected ? "purple.500" : "gray.700"}
            bgColor={isSelected ? selectionBgColor : undefined}
            color={!isDisabled && isSelected ? selectionTextColor : undefined}
            display="flex"
            justifyContent="center"
            alignItems="center"
            minW={minW}
            overflowWrap="break-word"
        >
            {children}
        </GridItem>
    );
}

type CRUDRowElement = JSX.Element;
function CRUDRow<S, T, PK extends keyof S>({
    rowData: { index: rowIndex, key, primaryKey, item, isSelected, isHighlighted, isDisabled },
    beginEdit,
    endEdit,
    addDirtyKey,
    edit,
    visibleFields,
    csud,
}: Readonly<CRUDTableRowProps<S, T, PK>>): CRUDRowElement {
    const enableUpdate = edit?.mode === "single" && !!csud?.cudCallbacks?.update && isSelected;
    const showDelete = !!csud?.cudCallbacks?.delete;
    const toast = useToast();

    const cellsOut = useMemo(() => {
        const cells: Array<JSX.Element> = [];

        visibleFields.forEach((field, fieldIdx) => {
            const value = field.extract(item);
            cells.push(
                <CRUDCell
                    key={`${key}-${fieldIdx}-row`}
                    rowKey={key}
                    columnKey={fieldIdx.toString()}
                    rowIdx={rowIndex}
                    colIdx={fieldIdx}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted}
                    isDisabled={isDisabled && isSelected}
                >
                    {defaultRenderers[field.spec.fieldType](
                        field.spec.convertToUI(value),
                        enableUpdate && field.isEditable
                            ? {
                                  label: field.ariaLabel,
                                  isDisabled,
                                  opts: {
                                      falseLabel: field.editorFalseLabel,
                                      trueLabel: field.editorTrueLabel,
                                      format:
                                          field.spec.fieldType === FieldType.boolean ? field.spec.format : undefined,
                                      options:
                                          field.spec.fieldType === FieldType.select ? field.spec.options() : undefined,
                                      multiSelect:
                                          field.spec.fieldType === FieldType.select
                                              ? field.spec.multiSelect
                                              : undefined,
                                      max: field.spec.fieldType === FieldType.integer ? field.spec.max : undefined,
                                      min: field.spec.fieldType === FieldType.integer ? field.spec.min : undefined,
                                  },
                                  onChange: async (value) => {
                                      const convertFromUI = field.spec.convertFromUI as ((v: any) => T) | undefined;
                                      if (convertFromUI && field.insert) {
                                          const newVal = convertFromUI(value);
                                          const newItem: S = field.insert(item, newVal);

                                          assert(edit?.mode === "single");
                                          const p = csud?.cudCallbacks?.update?.(new Map([[primaryKey, newItem]]));
                                          if (p) {
                                              let results: Map<S[PK], UpdateResult>;
                                              const isInstant = p instanceof Promise;
                                              if (isInstant) {
                                                  const editId = beginEdit();
                                                  results = await p;
                                                  endEdit(editId);
                                              } else {
                                                  assert(!(p instanceof Promise));
                                                  results = p;
                                              }
                                              results.forEach((result, key) => {
                                                  if (result !== true) {
                                                      toast({
                                                          description: result
                                                              .reduce((acc, err) => `${acc}; ${err}`, "")
                                                              .substring(2),
                                                          isClosable: true,
                                                          status: "error",
                                                          title: `Error applying update to item ${key}`,
                                                      });
                                                  } else if (!isInstant) {
                                                      addDirtyKey(key);
                                                  }
                                              });
                                          }
                                      }
                                  },
                              }
                            : undefined
                    )}
                </CRUDCell>
            );
        });

        return cells;
    }, [
        visibleFields,
        item,
        key,
        rowIndex,
        isSelected,
        isHighlighted,
        isDisabled,
        enableUpdate,
        edit?.mode,
        csud?.cudCallbacks,
        primaryKey,
        beginEdit,
        endEdit,
        toast,
        addDirtyKey,
    ]);

    let deleteButton: JSX.Element | undefined;
    if (showDelete) {
        deleteButton = (
            <CRUDCell
                key={`${key}-delete`}
                rowKey={key}
                columnKey="delete"
                rowIdx={rowIndex}
                colIdx={visibleFields.length}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                minW={50}
            >
                <Button
                    colorScheme="red"
                    isDisabled={isDisabled || edit?.mode === "multi"}
                    aria-label="Delete this row"
                    fontSize={["0.6rem", "0.8rem"]}
                    lineHeight={[0.6, 0.8]}
                    height={["1.5rem", "2rem"]}
                    minWidth={["1.5rem", "2rem"]}
                    paddingLeft="0.5rem"
                    paddingRight="0.5rem"
                    onClick={async () => {
                        const p = csud?.cudCallbacks?.delete?.(new Set([primaryKey]));
                        if (p) {
                            let results: Map<S[PK], boolean>;
                            const isInstant = p instanceof Promise;
                            if (isInstant) {
                                const editId = beginEdit();
                                results = await p;
                                endEdit(editId);
                            } else {
                                assert(!(p instanceof Promise));
                                results = p;
                            }

                            results.forEach((result, key) => {
                                if (result === true) {
                                    if (!isInstant) {
                                        addDirtyKey(key);
                                    }
                                } else {
                                    toast({
                                        isClosable: true,
                                        status: "error",
                                        title: `Error deleting item ${key}`,
                                    });
                                }
                            });
                        }
                    }}
                >
                    <FAIcon iconStyle="s" icon="trash-alt" />
                </Button>
            </CRUDCell>
        );
    }

    return (
        <>
            {cellsOut}
            {deleteButton}
        </>
    );
}

function CRUDSelectionBox<T, PK extends keyof T>({
    item,
    primaryKeyField,
    isSelected,
    setSelectedKeys,
}: {
    item: T;
    primaryKeyField: Readonly<PrimaryKeyField<T, PK>>;
    isSelected: boolean;
    setSelectedKeys: React.Dispatch<React.SetStateAction<Set<T[PK]>>>;
}): JSX.Element {
    const keyV = primaryKeyField.extract(item);
    const title = primaryKeyField.getRowTitle(item);
    return (
        <Checkbox
            isChecked={isSelected}
            aria-label={isSelected ? `Deselect row: ${title}` : `Select row: ${title}`}
            title={isSelected ? `Deselect row: ${title}` : `Select row: ${title}`}
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

function CRUDDeleteSelectedButton<T, PK extends keyof T>({
    isDisabled,
    csud,
    addDirtyKey,
    selectedKeys,
    beginEdit,
    endEdit,
    marginRight,
}: Readonly<CRUDTableProps<T, PK>> & {
    isDisabled: boolean;
    addDirtyKey: (key: T[PK]) => void;
    selectedKeys: Set<T[PK]>;
    beginEdit: () => string;
    endEdit: (id: string) => void;
    marginRight: any;
}): JSX.Element {
    const toast = useToast();

    async function onDelete() {
        if (csud && csud.cudCallbacks) {
            const cbs = csud.cudCallbacks;
            if (cbs.delete) {
                const p = csud?.cudCallbacks?.delete?.(selectedKeys);
                if (p) {
                    let results: Map<T[PK], boolean>;
                    const isInstant = p instanceof Promise;
                    if (isInstant) {
                        const editId = beginEdit();
                        results = await p;
                        endEdit(editId);
                    } else {
                        assert(!(p instanceof Promise));
                        results = p;
                    }

                    results.forEach((result, key) => {
                        if (result === true) {
                            if (!isInstant) {
                                addDirtyKey(key);
                            }
                        } else {
                            toast({
                                isClosable: true,
                                status: "error",
                                title: `Error deleting item ${key}`,
                            });
                        }
                    });
                }
            }
        }
    }

    return (
        <Button
            onClick={(_ev) => {
                onDelete();
            }}
            disabled={isDisabled}
            colorScheme="red"
            marginRight={marginRight}
        >
            Delete selected
        </Button>
    );
}

function CRUDCreateButton<T, PK extends keyof T>({
    isDisabled,
    primaryFields: { keyField: primaryKeyField, otherFields: otherPrimaryFields },
    csud,
    addDirtyKey,
    setSelectedKeys,
    beginEdit,
    endEdit,
}: Readonly<CRUDTableProps<T, PK>> & {
    isDisabled: boolean;
    addDirtyKey: (key: T[PK]) => void;
    setSelectedKeys: React.Dispatch<React.SetStateAction<Set<T[PK]>>>;
    beginEdit: () => string;
    endEdit: (id: string) => void;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const visibleFields = useMemo(
        () =>
            (primaryKeyField.isHidden
                ? []
                : [(primaryKeyField as unknown) as Readonly<PrimaryField<T, keyof T>>]
            ).concat(
                otherPrimaryFields
                    ? (Object.values(otherPrimaryFields) as Array<Readonly<PrimaryField<T, keyof T>>>).filter(
                          (x) => !x.isHidden && (x.isEditable || x.isEditableAtCreate)
                      )
                    : []
            ),
        [otherPrimaryFields, primaryKeyField]
    );

    const defaultValues = useMemo(() => {
        const result: Map<string, any> = new Map();
        if (otherPrimaryFields) {
            const fields = Object.values(otherPrimaryFields) as Array<Readonly<PrimaryField<T, any>>>;
            fields.forEach((field) => {
                result.set(field.heading, field.defaultValue);
            });
        }
        return result;
    }, [otherPrimaryFields]);
    const [fieldValues, setFieldValues] = useState<Map<string, any>>(defaultValues);

    const fieldEls = useMemo(
        () =>
            visibleFields.map((field, fieldIdx) => (
                <FormControl key={`create-field-${fieldIdx}`}>
                    <FormLabel>{field.heading}</FormLabel>
                    {defaultRenderers[field.spec.fieldType](fieldValues.get(field.heading), {
                        label: field.ariaLabel,
                        opts: {
                            falseLabel: field.editorFalseLabel,
                            trueLabel: field.editorTrueLabel,
                            format: field.spec.fieldType === FieldType.boolean ? field.spec.format : undefined,
                            options: field.spec.fieldType === FieldType.select ? field.spec.options() : undefined,
                            multiSelect: field.spec.fieldType === FieldType.select ? field.spec.multiSelect : undefined,
                        },
                        onChange: (value) => {
                            setFieldValues((oldValues) => {
                                const newValues = new Map(oldValues);
                                newValues.set(field.heading, value);
                                return newValues;
                            });
                        },
                    })}
                    <FormHelperText>{field.description}</FormHelperText>
                </FormControl>
            )),
        [fieldValues, visibleFields]
    );

    function onCreate() {
        let ok = false;

        if (csud && csud.cudCallbacks) {
            const cbs = csud.cudCallbacks;
            if (cbs.create) {
                if ("generateTemporaryKey" in cbs) {
                    const tempKey = cbs.generateTemporaryKey();
                    let newItem: Partial<T> = {};
                    primaryKeyField.insert?.(newItem, tempKey);
                    if (otherPrimaryFields) {
                        const fields = Object.values(otherPrimaryFields) as Array<Readonly<PrimaryField<T, any>>>;
                        fields.forEach((field) => {
                            const uiValue = fieldValues.get(field.heading);
                            const convertFromUI = field.spec.convertFromUI as ((v: any) => T) | undefined;
                            if (convertFromUI && field.insert) {
                                const value = convertFromUI(uiValue);
                                newItem = field.insert(newItem, value);
                            }
                        });
                    }
                    if (cbs.create(tempKey, newItem)) {
                        addDirtyKey(tempKey);
                        setSelectedKeys(() => {
                            return new Set([tempKey]);
                        });

                        setFieldValues(defaultValues);
                        ok = true;
                    } else {
                        toast({
                            title: "Error! Unable to create new item",
                            status: "error",
                            isClosable: true,
                        });
                    }

                    if (ok) {
                        onClose();
                    }
                } else {
                    const editId = beginEdit();
                    (async function doAsyncCreate() {
                        try {
                            let newItem: Partial<T> = {};
                            if (otherPrimaryFields) {
                                const fields = Object.values(otherPrimaryFields) as Array<
                                    Readonly<PrimaryField<T, any>>
                                >;
                                fields.forEach((field) => {
                                    const uiValue = fieldValues.get(field.heading);
                                    const convertFromUI = field.spec.convertFromUI as ((v: any) => T) | undefined;
                                    if (convertFromUI && field.insert) {
                                        const value = convertFromUI(uiValue);
                                        newItem = field.insert(newItem, value);
                                    }
                                });
                            }
                            assert(cbs.create);
                            const tempKey = await cbs.create(newItem);
                            if (tempKey) {
                                setSelectedKeys(() => {
                                    return new Set([tempKey]);
                                });

                                setFieldValues(defaultValues);
                                ok = true;
                            } else {
                                toast({
                                    title: "Error! Unable to create new item",
                                    status: "error",
                                    isClosable: true,
                                });
                            }
                        } finally {
                            endEdit(editId);

                            if (ok) {
                                onClose();
                            }
                        }
                    })();
                }
            }
        }
    }

    return (
        <>
            <Button onClick={onOpen} disabled={isDisabled} colorScheme="blue">
                Create new
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create new</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>{fieldEls}</VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="red" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" onClick={onCreate}>
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export default function CRUDTable<T, PK extends keyof T>(props: Readonly<CRUDTableProps<T, PK>>): JSX.Element {
    const {
        data,
        externalUnsavedChanges,
        primaryFields: { keyField: primaryKeyField, otherFields: otherPrimaryFields },
        secondaryFields,
        csud,
        // TODO: highlighting,
        customButtons,
    } = props;

    const [selectedKeys, _setSelectedKeys] = useState<Set<T[PK]>>(new Set());
    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const setSelectedKeys: Dispatch<SetStateAction<Set<T[PK]>>> = useCallback(
        (f: Set<T[PK]> | ((keys: Set<T[PK]>) => Set<T[PK]>)) => {
            let newKeys: Set<T[PK]>;
            if (f instanceof Set) {
                newKeys = f;
            } else {
                newKeys = f(selectedKeys);
            }
            _setSelectedKeys(newKeys);

            if (secondaryFields?.editSingle) {
                if (newKeys.size === 1) {
                    onSecondaryPanelOpen();
                }
            }
        },
        [onSecondaryPanelOpen, secondaryFields?.editSingle, selectedKeys]
    );
    const [filterValues, debouncedFilterValues, setFilterValues] = useDebouncedState<Map<string, unknown>>(new Map());

    const [dirtyKeys, setDirtyKeys] = useState<Set<T[PK]>>(new Set());
    const [ongoingEdits, setOngoingEdits] = useState<Set<string>>(new Set());

    const toast = useToast();

    const beginEdit = useCallback(() => {
        const newId = uuidv4().toString();
        setOngoingEdits((oldEdits) => {
            const newEdits = new Set(oldEdits);
            newEdits.add(newId);
            return newEdits;
        });
        return newId;
    }, []);

    const endEdit = useCallback((id: string) => {
        setOngoingEdits((oldEdits) => {
            const newEdits = new Set(oldEdits);
            newEdits.delete(id);
            return newEdits;
        });
    }, []);

    const addDirtyKey = useCallback((key: T[PK]) => {
        setDirtyKeys((oldKeys) => {
            const newKeys = new Set(oldKeys);
            newKeys.add(key);
            return newKeys;
        });
    }, []);

    const visibleFields = useMemo(
        () =>
            (primaryKeyField.isHidden
                ? []
                : [(primaryKeyField as unknown) as Readonly<PrimaryField<T, keyof T>>]
            ).concat(
                otherPrimaryFields
                    ? (Object.values(otherPrimaryFields) as Array<Readonly<PrimaryField<T, keyof T>>>).filter(
                          (x) => !x.isHidden
                      )
                    : []
            ),
        [otherPrimaryFields, primaryKeyField]
    );
    const filterFields = useMemo(() => visibleFields.filter((x) => !!x.spec.filter), [visibleFields]);

    const hasSecondaryFields = !!secondaryFields;
    const isFilterable = visibleFields.some((field) => !!field.spec.filter);
    const includeDeleteColumn = !!csud?.cudCallbacks?.delete;
    const includeSelectorColumn = includeDeleteColumn || hasSecondaryFields || isFilterable;
    const editMode = selectedKeys.size === 1 ? "single" : selectedKeys.size > 0 ? "multi" : false;
    const isDisabled = ongoingEdits.size > 0;
    const isBatchEditMode = csud && csud.cudCallbacks && "generateTemporaryKey" in csud.cudCallbacks;
    const showCreate = !!csud?.cudCallbacks?.create;
    const showDeleteAll = !!csud?.cudCallbacks?.delete;

    const allRows = useMemo(() => {
        const result: Map<string, CRUDRowElement> = new Map();

        data.forEach((item, key) => {
            const primaryKey = primaryKeyField.extract(item);
            const isSelected = selectedKeys.has(primaryKey);
            result.set(
                key,
                <CRUDRow
                    key={`crud-row-${key}`}
                    rowData={{
                        index: result.size,
                        key,
                        item,
                        isSelected,
                        primaryKey,
                        isDisabled,
                    }}
                    edit={
                        editMode
                            ? {
                                  mode: editMode,
                              }
                            : undefined
                    }
                    beginEdit={beginEdit}
                    endEdit={endEdit}
                    addDirtyKey={addDirtyKey}
                    visibleFields={visibleFields}
                    csud={csud}
                />
            );
        });

        return result;
    }, [
        addDirtyKey,
        beginEdit,
        csud,
        data,
        editMode,
        endEdit,
        isDisabled,
        primaryKeyField,
        selectedKeys,
        visibleFields,
    ]);

    const applyFieldFilter = useCallback(
        function _applyFieldFilter<S, J extends keyof S>(field: Field<S, J>, item: S): boolean {
            switch (field.spec.fieldType) {
                case FieldType.string: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(
                        v,
                        debouncedFilterValues.get(field.heading) as string | undefined,
                        field.spec.shouldNotTrim,
                        field.spec.disallowSpaces
                    );
                }
                case FieldType.integer: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(v, debouncedFilterValues.get(field.heading) as number | undefined);
                }
                case FieldType.boolean: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(v, debouncedFilterValues.get(field.heading) as boolean | undefined);
                }
                case FieldType.select: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(v, debouncedFilterValues.get(field.heading) as string[] | undefined);
                }
                case FieldType.datetime: {
                    const v = field.spec.convertToUI(field.extract(item));
                    return !!field.spec.filter?.(v, debouncedFilterValues.get(field.heading) as string | undefined);
                }
            }
        },
        [debouncedFilterValues]
    );

    const headingsRow = useMemo(() => {
        const rowIdx = -2;
        return visibleFields.reduce(
            (acc, field, fieldIdx) => [
                ...acc,
                <CRUDCell
                    key={`heading-${fieldIdx}`}
                    rowKey={"heading"}
                    columnKey={fieldIdx.toString()}
                    rowIdx={rowIdx}
                    colIdx={fieldIdx}
                >
                    <Tooltip label={field.description}>
                        <Heading as="h3" fontSize="1.2rem">
                            {field.heading}
                        </Heading>
                    </Tooltip>
                </CRUDCell>,
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
                    rowIdx={rowIdx}
                    colIdx={-1}
                    minW={50}
                >
                    <Text as="span" fontStyle="italic">
                        Filters
                    </Text>
                </CRUDCell>
            );
            visibleFields.forEach((field, fieldIdx) => {
                result.push(
                    <CRUDCell
                        key={`filter-${field.heading}`}
                        rowKey={"filter"}
                        columnKey={field.heading}
                        rowIdx={rowIdx}
                        colIdx={fieldIdx}
                    >
                        {field.spec.filter ? (
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
                        )}
                    </CRUDCell>
                );
            });

            if (includeDeleteColumn) {
                result.push(
                    <CRUDCell
                        key="filter-<<<###delete###>>>"
                        rowKey="filter"
                        columnKey="<<<###delete###>>>"
                        rowIdx={rowIdx}
                        colIdx={visibleFields.length}
                        minW={50}
                    >
                        <></>
                    </CRUDCell>
                );
            }
        }
        return result;
    }, [filterValues, includeDeleteColumn, setFilterValues, visibleFields]);

    const [rowEls, visibleKeys] = useMemo(() => {
        const resultRowEls: Array<JSX.Element[]> = [];
        const resultVisibleKeys: Set<T[PK]> = new Set();

        if (!isFilterable) {
            allRows.forEach((rowEl, key) => {
                const item = data.get(key);
                if (item) {
                    const keyV = primaryKeyField.extract(item);

                    if (includeSelectorColumn) {
                        const isSelected = selectedKeys.has(keyV);

                        resultRowEls.push([
                            <CRUDCell
                                key={`${key}-selection`}
                                rowKey={key}
                                columnKey={"selection"}
                                rowIdx={resultRowEls.length}
                                colIdx={-1}
                                minW={50}
                            >
                                <CRUDSelectionBox
                                    item={item}
                                    primaryKeyField={primaryKeyField}
                                    isSelected={isSelected}
                                    setSelectedKeys={setSelectedKeys}
                                />
                            </CRUDCell>,
                            rowEl,
                        ]);
                    } else {
                        resultRowEls.push([rowEl]);
                    }

                    resultVisibleKeys.add(keyV);
                }
            });
        } else {
            data.forEach((item, key) => {
                if (filterFields.every((field) => applyFieldFilter(field, item))) {
                    const keyV = primaryKeyField.extract(item);

                    const rowEl = allRows.get(key);
                    if (rowEl) {
                        if (includeSelectorColumn) {
                            const isSelected = selectedKeys.has(keyV);

                            resultRowEls.push([
                                <CRUDCell
                                    key={`${key}-selection`}
                                    rowKey={key}
                                    columnKey={"selection"}
                                    rowIdx={resultRowEls.length}
                                    colIdx={-1}
                                    minW={50}
                                >
                                    <CRUDSelectionBox
                                        item={item}
                                        primaryKeyField={primaryKeyField}
                                        isSelected={isSelected}
                                        setSelectedKeys={setSelectedKeys}
                                    />
                                </CRUDCell>,
                                rowEl,
                            ]);
                        } else {
                            resultRowEls.push([rowEl]);
                        }

                        resultVisibleKeys.add(keyV);
                    }
                }
            });
        }

        return [resultRowEls, resultVisibleKeys];
    }, [
        allRows,
        applyFieldFilter,
        data,
        filterFields,
        includeSelectorColumn,
        isFilterable,
        primaryKeyField,
        selectedKeys,
        setSelectedKeys,
    ]);

    const secondaryEditor = useMemo(() => {
        if (selectedKeys.size === 1 && secondaryFields?.editSingle) {
            const key = selectedKeys.values().next().value;
            return secondaryFields.editSingle(key, onSecondaryPanelClose, dirtyKeys.has(key), () => {
                setTimeout(
                    () =>
                        setDirtyKeys((oldDirtyKeys) => {
                            if (!oldDirtyKeys.has(key)) {
                                const newDirtyKeys = new Set(oldDirtyKeys);
                                newDirtyKeys.add(key);
                                return newDirtyKeys;
                            }
                            return oldDirtyKeys;
                        }),
                    0
                );
            });
        } else if (selectedKeys.size > 1 && secondaryFields?.editMultiple) {
            return secondaryFields.editMultiple(selectedKeys, onSecondaryPanelClose, (keysToMark) => {
                setTimeout(
                    () =>
                        setDirtyKeys((oldDirtyKeys) => {
                            if (Array.from(keysToMark.values()).some((key) => !oldDirtyKeys.has(key))) {
                                const newDirtyKeys = new Set(oldDirtyKeys);
                                for (const key of keysToMark) {
                                    newDirtyKeys.add(key);
                                }
                                return newDirtyKeys;
                            }
                            return oldDirtyKeys;
                        }),
                    0
                );
            });
        } else {
            return undefined;
        }
    }, [dirtyKeys, onSecondaryPanelClose, secondaryFields, selectedKeys]);

    let templateColumnsStr = includeSelectorColumn ? "min-content" : "";
    for (let i = 0; i < visibleFields.length; i++) {
        templateColumnsStr += " auto";
    }
    templateColumnsStr += includeDeleteColumn ? " min-content" : "";

    const visibleSelectedKeys = useMemo(() => {
        let result = new Set<T[PK]>();
        if (!isFilterable) {
            result = new Set(selectedKeys);
        } else {
            const allItems = Array.from(data.values());
            selectedKeys.forEach((pk) => {
                const item = allItems.find((x) => primaryKeyField.extract(x) === pk);
                if (item) {
                    if (filterFields.every((field) => applyFieldFilter(field, item))) {
                        result.add(primaryKeyField.extract(item));
                    }
                }
            });
        }
        return result;
    }, [applyFieldFilter, data, filterFields, isFilterable, primaryKeyField, selectedKeys]);

    return (
        <>
            {csud &&
            csud.cudCallbacks &&
            (("generateTemporaryKey" in csud.cudCallbacks &&
                !csud.cudCallbacks.hideLeavingPageWithUnsavedChangesWarning) ||
                !("generateTemporaryKey" in csud.cudCallbacks)) ? (
                <UnsavedChangesWarning hasUnsavedChanges={dirtyKeys.size > 0} />
            ) : undefined}
            <VStack width="100%">
                <Stack
                    direction={["column", "row"]}
                    justify="flex-start"
                    align={["stretch", "flex-start"]}
                    width="100%"
                    flexWrap="wrap"
                    gridRowGap={[0, 2]}
                >
                    {isBatchEditMode ? (
                        <Button
                            colorScheme="green"
                            aria-label="Save changes"
                            disabled={ongoingEdits.size > 0 || (!externalUnsavedChanges && dirtyKeys.size === 0)}
                            onClick={async () => {
                                const editId = beginEdit();
                                if (csud && csud.cudCallbacks && "save" in csud.cudCallbacks) {
                                    const results = await csud.cudCallbacks.save(dirtyKeys);

                                    let anyFailures = false;
                                    results.forEach((result, key) => {
                                        if (result !== true) {
                                            anyFailures = true;
                                            toast({
                                                isClosable: true,
                                                status: "error",
                                                title: `Error saving changes to item ${key}`,
                                            });
                                        }
                                    });
                                    if (!anyFailures) {
                                        toast({
                                            duration: 2000,
                                            status: "success",
                                            title: "Changes saved",
                                        });
                                    }

                                    setDirtyKeys((oldKeys) => {
                                        const newKeys = new Set(oldKeys);
                                        results.forEach((result, key) => {
                                            if (result === true) {
                                                newKeys.delete(key);
                                            }
                                        });
                                        return newKeys;
                                    });
                                }
                                endEdit(editId);
                            }}
                        >
                            {ongoingEdits.size > 0 ? (
                                <HStack>
                                    <span>Saving</span>
                                    <Spinner />
                                </HStack>
                            ) : (
                                <>Save changes</>
                            )}
                        </Button>
                    ) : (
                        <HStack>
                            <span>
                                {ongoingEdits.size > 0
                                    ? "Saving"
                                    : dirtyKeys.size > 0 || externalUnsavedChanges
                                    ? "Unsaved changes"
                                    : "No changes"}
                            </span>
                            {ongoingEdits.size > 0 ? <Spinner /> : undefined}
                        </HStack>
                    )}
                    {showCreate ? (
                        <CRUDCreateButton
                            {...props}
                            isDisabled={isDisabled}
                            addDirtyKey={addDirtyKey}
                            setSelectedKeys={setSelectedKeys}
                            beginEdit={beginEdit}
                            endEdit={endEdit}
                        />
                    ) : undefined}
                    <Button
                        colorScheme="blue"
                        onClick={() => {
                            if (selectedKeys.size > 0) {
                                setSelectedKeys(new Set());
                            } else {
                                setSelectedKeys(visibleKeys);
                            }
                        }}
                        marginRight={!showDeleteAll ? [0, "auto"] : undefined}
                    >
                        {selectedKeys.size > 0 ? "Deselect all" : "Select all"}
                    </Button>
                    {showDeleteAll ? (
                        <CRUDDeleteSelectedButton
                            {...props}
                            isDisabled={isDisabled || visibleSelectedKeys.size === 0}
                            addDirtyKey={addDirtyKey}
                            selectedKeys={visibleSelectedKeys}
                            beginEdit={beginEdit}
                            endEdit={endEdit}
                            marginRight={[0, "auto"]}
                        />
                    ) : undefined}
                    {/* TODO: Edit multiple button using secondary view */}
                    {customButtons?.map((button, idx) => {
                        const isDisabledBecauseNoSelection =
                            !button.enabledWhenNothingSelected && visibleSelectedKeys.size === 0;
                        const isDisabledBecauseDirty = !button.enabledWhenDirty && dirtyKeys.size > 0;
                        const isDisabled = isDisabledBecauseNoSelection || button.isRunning || isDisabledBecauseDirty;
                        return (
                            <Tooltip
                                key={`custom-button-${idx}`}
                                label={isDisabledBecauseDirty ? button.tooltipWhenDisabled : button.tooltipWhenEnabled}
                                aria-label={
                                    isDisabledBecauseDirty ? button.tooltipWhenDisabled : button.tooltipWhenEnabled
                                }
                            >
                                {/* This additional box is necessary otherwise the tooltip doesn't show on a disabled button */}
                                <VStack align={["stretch", "flex-start"]}>
                                    <Button
                                        aria-label={button.label}
                                        isDisabled={isDisabled}
                                        colorScheme={button.colorScheme}
                                        onClick={(_ev) => {
                                            button.action(visibleSelectedKeys);
                                        }}
                                    >
                                        {button.isRunning ? <Spinner /> : undefined}
                                        {button.text}
                                    </Button>
                                </VStack>
                            </Tooltip>
                        );
                    })}
                </Stack>
                <Grid
                    width="100%"
                    overflowX="auto"
                    templateColumns={templateColumnsStr}
                    minH="30vh"
                    gridAutoRows="min-content"
                >
                    {includeSelectorColumn ? (
                        <CRUDCell
                            key={"heading-selection"}
                            rowKey={"heading"}
                            columnKey={"selection"}
                            rowIdx={-2}
                            colIdx={-1}
                            minW={50}
                        >
                            <Text as="span" wordBreak="keep-all" whiteSpace="nowrap">
                                ({visibleSelectedKeys.size > 0 ? `${visibleSelectedKeys.size} / ` : ""}
                                {rowEls.length} row
                                {rowEls.length !== 1 ? "s" : ""})
                            </Text>
                        </CRUDCell>
                    ) : (
                        <></>
                    )}
                    {headingsRow}
                    {includeDeleteColumn ? (
                        <CRUDCell
                            key={"heading-delete"}
                            rowKey={"heading"}
                            columnKey={"delete"}
                            rowIdx={-2}
                            colIdx={visibleFields.length}
                            minW={50}
                        >
                            <></>
                        </CRUDCell>
                    ) : (
                        <></>
                    )}
                    {filtersRow}
                    {rowEls.reduce((acc, cells) => [...acc, ...cells], [])}
                </Grid>
            </VStack>

            <Drawer
                isOpen={isSecondaryPanelOpen && !!secondaryEditor?.editorElement}
                placement="right"
                onClose={onSecondaryPanelClose}
                // finalFocusRef={btnRef}
                size="lg"
            >
                <DrawerOverlay>
                    <DrawerContent>
                        {secondaryEditor?.includeCloseButton ? <DrawerCloseButton /> : undefined}
                        <DrawerHeader>Edit</DrawerHeader>

                        <DrawerBody>{secondaryEditor?.editorElement}</DrawerBody>

                        {secondaryEditor?.footerButtons ? (
                            <DrawerFooter>
                                {secondaryEditor.footerButtons.map((button) => {
                                    if (button.type === "close") {
                                        return (
                                            <Button aria-label="Close editor" onClick={onSecondaryPanelClose}>
                                                Close
                                            </Button>
                                        );
                                    } else {
                                        return (
                                            <Button
                                                colorScheme={button.colorScheme}
                                                aria-label={button.label}
                                                onClick={button.action}
                                            >
                                                {button.children}
                                            </Button>
                                        );
                                    }
                                })}
                            </DrawerFooter>
                        ) : undefined}
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
        </>
    );
}
