import type React from "react";

export enum CRUDableFieldType {
    UUID,
    String,
    Number,
    Date,
    SingleSelect,
    MultiSelect,
}

export type CRUDableStringField = {
    type: CRUDableFieldType.String;
};

export type CRUDableNumberField = {
    type: CRUDableFieldType.Number;
};

export type CRUDableDateField = {
    type: CRUDableFieldType.Date;
};

export type CRUDableSingleSelectField = {
    type: CRUDableFieldType.SingleSelect;
};

export type CRUDableMultiSelectField = {
    type: CRUDableFieldType.MultiSelect;
};

export type CRUDableFieldBaseProps<K> = {
    name: K;
    optional: boolean;
};

export type CRUDableField<K> = CRUDableFieldBaseProps<K> &
    (
        | CRUDableStringField
        | CRUDableNumberField
        | CRUDableDateField
        | CRUDableSingleSelectField
        | CRUDableMultiSelectField
    );

export type CRUDableFields<K extends keyof any> = {
    [P in K]: "id" extends P ? never : CRUDableField<P>;
} & {
    id: { name: "id"; optional: false; type: CRUDableFieldType.UUID };
};

export type CRUDableRecord<K extends keyof any, T extends CRUDableFields<K>> = {
    readonly [K in keyof T]: "id" extends K
        ? string
        :
              | (true extends T[K]["optional"] ? null | undefined : never)
              | (CRUDableFieldType.String extends T[K]["type"]
                    ? string
                    : CRUDableFieldType.Number extends T[K]["type"]
                    ? number
                    : CRUDableFieldType.Date extends T[K]["type"]
                    ? Date | string
                    : CRUDableFieldType.SingleSelect extends T[K]["type"]
                    ? string
                    : CRUDableFieldType.MultiSelect extends T[K]["type"]
                    ? readonly string[]
                    : CRUDableFieldType.UUID extends T[K]["type"]
                    ? string
                    : never);
};

export type Primitive = null | undefined | string | number | Date;

export type Defined<T> = T extends infer S | undefined ? S : T;

export type DeepPartial<T> = {
    [K in keyof T]+?: T[K] extends Primitive
        ? T[K]
        : T[K] extends ReadonlyArray<infer S>
        ? Primitive extends S
            ? ReadonlyArray<S>
            : ReadonlyArray<DeepPartial<S>>
        : DeepPartial<T[K]>;
};

export interface ValidationError {
    error: string;
}
export type ValidationState = "no error" | ValidationError;

export interface PanelProps<T> {
    isCreate: boolean;
    isDisabled: boolean;
    firstInputRef: React.MutableRefObject<HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null>;
    clearState: React.MutableRefObject<(() => void) | null>;

    record: DeepPartial<T>;
    updateRecord: (record: DeepPartial<T> | ((old: DeepPartial<T>) => DeepPartial<T>)) => void;

    onValid: () => void;
    onInvalid: (error: ValidationError) => void;

    onAnyChange: () => void;
}

export interface Step<T> {
    name: string;

    panel: React.FunctionComponent<PanelProps<T>>;
}
