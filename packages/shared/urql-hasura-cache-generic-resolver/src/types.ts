export interface AugmentedIntrospectionData {
    __schema: AugmentedIntrospectionSchema;
}

export interface AugmentedIntrospectionSchema {
    types: ReadonlyArray<AugmentedIntrospectionType>;
}

export type AugmentedIntrospectionType = AugmentedIntrospectionObjectType;

export interface AugmentedIntrospectionObjectType {
    readonly kind: "OBJECT";
    readonly name: string;
    readonly schemaName: string;
    readonly tableName: string;
    readonly fields: ReadonlyArray<AugmentedIntrospectionField>;
}

export interface AugmentedIntrospectionField {
    readonly name: string;
    readonly description?: string | null;
    readonly type: AugmentedIntrospectionOutputTypeRef;
}

export interface AugmentedIntrospectionOutputTypeRef {
    kind: "OBJECT_RELATIONSHIP_KEY_MAP" | "ARRAY_RELATIONSHIP_KEY_MAP";
    columns: Record<string, string>;
}

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;

export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    bigint: number;
    jsonb: any;
    name: string;
    numeric: number;
    timestamptz: string | Date;
    uuid: string;
};

export type Bigint_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["bigint"]>;
    readonly _gt?: InputMaybe<Scalars["bigint"]>;
    readonly _gte?: InputMaybe<Scalars["bigint"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["bigint"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["bigint"]>;
    readonly _lte?: InputMaybe<Scalars["bigint"]>;
    readonly _neq?: InputMaybe<Scalars["bigint"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["bigint"]>>;
};

export type Boolean_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["Boolean"]>;
    readonly _gt?: InputMaybe<Scalars["Boolean"]>;
    readonly _gte?: InputMaybe<Scalars["Boolean"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["Boolean"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["Boolean"]>;
    readonly _lte?: InputMaybe<Scalars["Boolean"]>;
    readonly _neq?: InputMaybe<Scalars["Boolean"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["Boolean"]>>;
};

export type Float_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["Float"]>;
    readonly _gt?: InputMaybe<Scalars["Float"]>;
    readonly _gte?: InputMaybe<Scalars["Float"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["Float"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["Float"]>;
    readonly _lte?: InputMaybe<Scalars["Float"]>;
    readonly _neq?: InputMaybe<Scalars["Float"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["Float"]>>;
};

export type Int_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["Int"]>;
    readonly _gt?: InputMaybe<Scalars["Int"]>;
    readonly _gte?: InputMaybe<Scalars["Int"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["Int"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["Int"]>;
    readonly _lte?: InputMaybe<Scalars["Int"]>;
    readonly _neq?: InputMaybe<Scalars["Int"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["Int"]>>;
};

export type Jsonb_Comparison_Exp = {
    /** is the column contained in the given json value */
    readonly _contained_in?: InputMaybe<Scalars["jsonb"]>;
    /** does the column contain the given json value at the top level */
    readonly _contains?: InputMaybe<Scalars["jsonb"]>;
    readonly _eq?: InputMaybe<Scalars["jsonb"]>;
    readonly _gt?: InputMaybe<Scalars["jsonb"]>;
    readonly _gte?: InputMaybe<Scalars["jsonb"]>;
    /** does the string exist as a top-level key in the column */
    readonly _has_key?: InputMaybe<Scalars["String"]>;
    /** do all of these strings exist as top-level keys in the column */
    readonly _has_keys_all?: InputMaybe<ReadonlyArray<Scalars["String"]>>;
    /** do any of these strings exist as top-level keys in the column */
    readonly _has_keys_any?: InputMaybe<ReadonlyArray<Scalars["String"]>>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["jsonb"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["jsonb"]>;
    readonly _lte?: InputMaybe<Scalars["jsonb"]>;
    readonly _neq?: InputMaybe<Scalars["jsonb"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["jsonb"]>>;
};

export type Numeric_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["numeric"]>;
    readonly _gt?: InputMaybe<Scalars["numeric"]>;
    readonly _gte?: InputMaybe<Scalars["numeric"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["numeric"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["numeric"]>;
    readonly _lte?: InputMaybe<Scalars["numeric"]>;
    readonly _neq?: InputMaybe<Scalars["numeric"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["numeric"]>>;
};

export type String_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["String"]>;
    readonly _gt?: InputMaybe<Scalars["String"]>;
    readonly _gte?: InputMaybe<Scalars["String"]>;
    /** does the column match the given case-insensitive pattern */
    readonly _ilike?: InputMaybe<Scalars["String"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["String"]>>;
    /** does the column match the given POSIX regular expression, case insensitive */
    readonly _iregex?: InputMaybe<Scalars["String"]>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    /** does the column match the given pattern */
    readonly _like?: InputMaybe<Scalars["String"]>;
    readonly _lt?: InputMaybe<Scalars["String"]>;
    readonly _lte?: InputMaybe<Scalars["String"]>;
    readonly _neq?: InputMaybe<Scalars["String"]>;
    /** does the column NOT match the given case-insensitive pattern */
    readonly _nilike?: InputMaybe<Scalars["String"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["String"]>>;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    readonly _niregex?: InputMaybe<Scalars["String"]>;
    /** does the column NOT match the given pattern */
    readonly _nlike?: InputMaybe<Scalars["String"]>;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    readonly _nregex?: InputMaybe<Scalars["String"]>;
    /** does the column NOT match the given SQL regular expression */
    readonly _nsimilar?: InputMaybe<Scalars["String"]>;
    /** does the column match the given POSIX regular expression, case sensitive */
    readonly _regex?: InputMaybe<Scalars["String"]>;
    /** does the column match the given SQL regular expression */
    readonly _similar?: InputMaybe<Scalars["String"]>;
};

export type Timestamptz_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["timestamptz"]>;
    readonly _gt?: InputMaybe<Scalars["timestamptz"]>;
    readonly _gte?: InputMaybe<Scalars["timestamptz"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["timestamptz"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["timestamptz"]>;
    readonly _lte?: InputMaybe<Scalars["timestamptz"]>;
    readonly _neq?: InputMaybe<Scalars["timestamptz"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["timestamptz"]>>;
};

export type Uuid_Comparison_Exp = {
    readonly _eq?: InputMaybe<Scalars["uuid"]>;
    readonly _gt?: InputMaybe<Scalars["uuid"]>;
    readonly _gte?: InputMaybe<Scalars["uuid"]>;
    readonly _in?: InputMaybe<ReadonlyArray<Scalars["uuid"]>>;
    readonly _is_null?: InputMaybe<Scalars["Boolean"]>;
    readonly _lt?: InputMaybe<Scalars["uuid"]>;
    readonly _lte?: InputMaybe<Scalars["uuid"]>;
    readonly _neq?: InputMaybe<Scalars["uuid"]>;
    readonly _nin?: InputMaybe<ReadonlyArray<Scalars["uuid"]>>;
};
