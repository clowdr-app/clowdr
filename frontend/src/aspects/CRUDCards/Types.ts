import type React from "react";

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
