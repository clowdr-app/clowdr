import * as Apollo from "@apollo/client";
import { gql } from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K];
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    json: any;
    timestamptz: any;
    uuid: any;
};

export type EchoInput = {
    message: Scalars["String"];
};

export type EchoOutput = {
    __typename?: "EchoOutput";
    message: Scalars["String"];
};

export type ProtectedEchoOutput = {
    __typename?: "ProtectedEchoOutput";
    message: Scalars["String"];
};

export type SampleInput = {
    password: Scalars["String"];
    username: Scalars["String"];
};

export type SampleOutput = {
    __typename?: "SampleOutput";
    accessToken: Scalars["String"];
};

/** expression to compare columns of type String. All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
    _eq?: Maybe<Scalars["String"]>;
    _gt?: Maybe<Scalars["String"]>;
    _gte?: Maybe<Scalars["String"]>;
    _ilike?: Maybe<Scalars["String"]>;
    _in?: Maybe<Array<Scalars["String"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _like?: Maybe<Scalars["String"]>;
    _lt?: Maybe<Scalars["String"]>;
    _lte?: Maybe<Scalars["String"]>;
    _neq?: Maybe<Scalars["String"]>;
    _nilike?: Maybe<Scalars["String"]>;
    _nin?: Maybe<Array<Scalars["String"]>>;
    _nlike?: Maybe<Scalars["String"]>;
    _nsimilar?: Maybe<Scalars["String"]>;
    _similar?: Maybe<Scalars["String"]>;
};

/** expression to compare columns of type json. All fields are combined with logical 'AND'. */
export type Json_Comparison_Exp = {
    _eq?: Maybe<Scalars["json"]>;
    _gt?: Maybe<Scalars["json"]>;
    _gte?: Maybe<Scalars["json"]>;
    _in?: Maybe<Array<Scalars["json"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["json"]>;
    _lte?: Maybe<Scalars["json"]>;
    _neq?: Maybe<Scalars["json"]>;
    _nin?: Maybe<Array<Scalars["json"]>>;
};

/** mutation root */
export type Mutation_Root = {
    __typename?: "mutation_root";
    /** delete data from the table: "user" */
    delete_user?: Maybe<User_Mutation_Response>;
    /** delete single row from the table: "user" */
    delete_user_by_pk?: Maybe<User>;
    /** insert data into the table: "user" */
    insert_user?: Maybe<User_Mutation_Response>;
    /** insert a single row into the table: "user" */
    insert_user_one?: Maybe<User>;
    /** update data of the table: "user" */
    update_user?: Maybe<User_Mutation_Response>;
    /** update single row of the table: "user" */
    update_user_by_pk?: Maybe<User>;
};

/** mutation root */
export type Mutation_RootDelete_UserArgs = {
    where: User_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_User_By_PkArgs = {
    id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootInsert_UserArgs = {
    objects: Array<User_Insert_Input>;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_User_OneArgs = {
    object: User_Insert_Input;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** mutation root */
export type Mutation_RootUpdate_UserArgs = {
    _set?: Maybe<User_Set_Input>;
    where: User_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_User_By_PkArgs = {
    _set?: Maybe<User_Set_Input>;
    pk_columns: User_Pk_Columns_Input;
};

/** column ordering options */
export enum Order_By {
    /** in the ascending order, nulls last */
    Asc = "asc",
    /** in the ascending order, nulls first */
    AscNullsFirst = "asc_nulls_first",
    /** in the ascending order, nulls last */
    AscNullsLast = "asc_nulls_last",
    /** in the descending order, nulls first */
    Desc = "desc",
    /** in the descending order, nulls first */
    DescNullsFirst = "desc_nulls_first",
    /** in the descending order, nulls last */
    DescNullsLast = "desc_nulls_last",
}

/** query root */
export type Query_Root = {
    __typename?: "query_root";
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
    /** perform the action: "protectedEcho" */
    protectedEcho?: Maybe<ProtectedEchoOutput>;
    /** fetch data from the table: "user" */
    user: Array<User>;
    /** fetch aggregated fields from the table: "user" */
    user_aggregate: User_Aggregate;
    /** fetch data from the table: "user" using primary key columns */
    user_by_pk?: Maybe<User>;
};

/** query root */
export type Query_RootEchoArgs = {
    message: Scalars["String"];
};

/** query root */
export type Query_RootProtectedEchoArgs = {
    message: Scalars["String"];
};

/** query root */
export type Query_RootUserArgs = {
    distinct_on?: Maybe<Array<User_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<User_Order_By>>;
    where?: Maybe<User_Bool_Exp>;
};

/** query root */
export type Query_RootUser_AggregateArgs = {
    distinct_on?: Maybe<Array<User_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<User_Order_By>>;
    where?: Maybe<User_Bool_Exp>;
};

/** query root */
export type Query_RootUser_By_PkArgs = {
    id: Scalars["String"];
};

/** subscription root */
export type Subscription_Root = {
    __typename?: "subscription_root";
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
    /** perform the action: "protectedEcho" */
    protectedEcho?: Maybe<ProtectedEchoOutput>;
    /** fetch data from the table: "user" */
    user: Array<User>;
    /** fetch aggregated fields from the table: "user" */
    user_aggregate: User_Aggregate;
    /** fetch data from the table: "user" using primary key columns */
    user_by_pk?: Maybe<User>;
};

/** subscription root */
export type Subscription_RootEchoArgs = {
    message: Scalars["String"];
};

/** subscription root */
export type Subscription_RootProtectedEchoArgs = {
    message: Scalars["String"];
};

/** subscription root */
export type Subscription_RootUserArgs = {
    distinct_on?: Maybe<Array<User_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<User_Order_By>>;
    where?: Maybe<User_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootUser_AggregateArgs = {
    distinct_on?: Maybe<Array<User_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<User_Order_By>>;
    where?: Maybe<User_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootUser_By_PkArgs = {
    id: Scalars["String"];
};

/** expression to compare columns of type timestamptz. All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
    _eq?: Maybe<Scalars["timestamptz"]>;
    _gt?: Maybe<Scalars["timestamptz"]>;
    _gte?: Maybe<Scalars["timestamptz"]>;
    _in?: Maybe<Array<Scalars["timestamptz"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["timestamptz"]>;
    _lte?: Maybe<Scalars["timestamptz"]>;
    _neq?: Maybe<Scalars["timestamptz"]>;
    _nin?: Maybe<Array<Scalars["timestamptz"]>>;
};

/** columns and relationships of "user" */
export type User = {
    __typename?: "user";
    created_at?: Maybe<Scalars["timestamptz"]>;
    firstName: Scalars["String"];
    id: Scalars["String"];
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName: Scalars["String"];
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregated selection of "user" */
export type User_Aggregate = {
    __typename?: "user_aggregate";
    aggregate?: Maybe<User_Aggregate_Fields>;
    nodes: Array<User>;
};

/** aggregate fields of "user" */
export type User_Aggregate_Fields = {
    __typename?: "user_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<User_Max_Fields>;
    min?: Maybe<User_Min_Fields>;
};

/** aggregate fields of "user" */
export type User_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<User_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "user" */
export type User_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<User_Max_Order_By>;
    min?: Maybe<User_Min_Order_By>;
};

/** input type for inserting array relation for remote table "user" */
export type User_Arr_Rel_Insert_Input = {
    data: Array<User_Insert_Input>;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** Boolean expression to filter rows from the table "user". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
    _and?: Maybe<Array<Maybe<User_Bool_Exp>>>;
    _not?: Maybe<User_Bool_Exp>;
    _or?: Maybe<Array<Maybe<User_Bool_Exp>>>;
    created_at?: Maybe<Timestamptz_Comparison_Exp>;
    firstName?: Maybe<String_Comparison_Exp>;
    id?: Maybe<String_Comparison_Exp>;
    lastLoggedInAt?: Maybe<Timestamptz_Comparison_Exp>;
    lastName?: Maybe<String_Comparison_Exp>;
    updated_at?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "user" */
export enum User_Constraint {
    /** unique or primary key constraint */
    UserPkey = "user_pkey",
}

/** input type for inserting data into table "user" */
export type User_Insert_Input = {
    created_at?: Maybe<Scalars["timestamptz"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type User_Max_Fields = {
    __typename?: "user_max_fields";
    created_at?: Maybe<Scalars["timestamptz"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "user" */
export type User_Max_Order_By = {
    created_at?: Maybe<Order_By>;
    firstName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type User_Min_Fields = {
    __typename?: "user_min_fields";
    created_at?: Maybe<Scalars["timestamptz"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "user" */
export type User_Min_Order_By = {
    created_at?: Maybe<Order_By>;
    firstName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** response of any mutation on the table "user" */
export type User_Mutation_Response = {
    __typename?: "user_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<User>;
};

/** input type for inserting object relation for remote table "user" */
export type User_Obj_Rel_Insert_Input = {
    data: User_Insert_Input;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** on conflict condition type for table "user" */
export type User_On_Conflict = {
    constraint: User_Constraint;
    update_columns: Array<User_Update_Column>;
    where?: Maybe<User_Bool_Exp>;
};

/** ordering options when selecting data from "user" */
export type User_Order_By = {
    created_at?: Maybe<Order_By>;
    firstName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** primary key columns input for table: "user" */
export type User_Pk_Columns_Input = {
    id: Scalars["String"];
};

/** select columns of table "user" */
export enum User_Select_Column {
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    FirstName = "firstName",
    /** column name */
    Id = "id",
    /** column name */
    LastLoggedInAt = "lastLoggedInAt",
    /** column name */
    LastName = "lastName",
    /** column name */
    UpdatedAt = "updated_at",
}

/** input type for updating data in table "user" */
export type User_Set_Input = {
    created_at?: Maybe<Scalars["timestamptz"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "user" */
export enum User_Update_Column {
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    FirstName = "firstName",
    /** column name */
    Id = "id",
    /** column name */
    LastLoggedInAt = "lastLoggedInAt",
    /** column name */
    LastName = "lastName",
    /** column name */
    UpdatedAt = "updated_at",
}

export type UsersQueryVariables = Exact<{ [key: string]: never }>;

export type UsersQuery = { __typename?: "query_root" } & {
    user: Array<
        { __typename?: "user" } & Pick<
            User,
            "firstName" | "id" | "lastLoggedInAt" | "lastName"
        >
    >;
};

export type EchoQueryVariables = Exact<{
    message: Scalars["String"];
}>;

export type EchoQuery = { __typename?: "query_root" } & {
    echo?: Maybe<{ __typename?: "EchoOutput" } & Pick<EchoOutput, "message">>;
};

export type ProtectedEchoQueryVariables = Exact<{
    message: Scalars["String"];
}>;

export type ProtectedEchoQuery = { __typename?: "query_root" } & {
    protectedEcho?: Maybe<
        { __typename?: "ProtectedEchoOutput" } & Pick<
            ProtectedEchoOutput,
            "message"
        >
    >;
};

export const UsersDocument = gql`
    query Users {
        user {
            firstName
            id
            lastLoggedInAt
            lastName
        }
    }
`;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useUsersQuery(
    baseOptions?: Apollo.QueryHookOptions<UsersQuery, UsersQueryVariables>
) {
    return Apollo.useQuery<UsersQuery, UsersQueryVariables>(
        UsersDocument,
        baseOptions
    );
}
export function useUsersLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<UsersQuery, UsersQueryVariables>
) {
    return Apollo.useLazyQuery<UsersQuery, UsersQueryVariables>(
        UsersDocument,
        baseOptions
    );
}
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersQueryResult = Apollo.QueryResult<
    UsersQuery,
    UsersQueryVariables
>;
export const EchoDocument = gql`
    query Echo($message: String!) {
        echo(message: $message) {
            message
        }
    }
`;

/**
 * __useEchoQuery__
 *
 * To run a query within a React component, call `useEchoQuery` and pass it any options that fit your needs.
 * When your component renders, `useEchoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEchoQuery({
 *   variables: {
 *      message: // value for 'message'
 *   },
 * });
 */
export function useEchoQuery(
    baseOptions: Apollo.QueryHookOptions<EchoQuery, EchoQueryVariables>
) {
    return Apollo.useQuery<EchoQuery, EchoQueryVariables>(
        EchoDocument,
        baseOptions
    );
}
export function useEchoLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<EchoQuery, EchoQueryVariables>
) {
    return Apollo.useLazyQuery<EchoQuery, EchoQueryVariables>(
        EchoDocument,
        baseOptions
    );
}
export type EchoQueryHookResult = ReturnType<typeof useEchoQuery>;
export type EchoLazyQueryHookResult = ReturnType<typeof useEchoLazyQuery>;
export type EchoQueryResult = Apollo.QueryResult<EchoQuery, EchoQueryVariables>;
export const ProtectedEchoDocument = gql`
    query ProtectedEcho($message: String!) {
        protectedEcho(message: $message) {
            message
        }
    }
`;

/**
 * __useProtectedEchoQuery__
 *
 * To run a query within a React component, call `useProtectedEchoQuery` and pass it any options that fit your needs.
 * When your component renders, `useProtectedEchoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProtectedEchoQuery({
 *   variables: {
 *      message: // value for 'message'
 *   },
 * });
 */
export function useProtectedEchoQuery(
    baseOptions: Apollo.QueryHookOptions<
        ProtectedEchoQuery,
        ProtectedEchoQueryVariables
    >
) {
    return Apollo.useQuery<ProtectedEchoQuery, ProtectedEchoQueryVariables>(
        ProtectedEchoDocument,
        baseOptions
    );
}
export function useProtectedEchoLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<
        ProtectedEchoQuery,
        ProtectedEchoQueryVariables
    >
) {
    return Apollo.useLazyQuery<ProtectedEchoQuery, ProtectedEchoQueryVariables>(
        ProtectedEchoDocument,
        baseOptions
    );
}
export type ProtectedEchoQueryHookResult = ReturnType<
    typeof useProtectedEchoQuery
>;
export type ProtectedEchoLazyQueryHookResult = ReturnType<
    typeof useProtectedEchoLazyQuery
>;
export type ProtectedEchoQueryResult = Apollo.QueryResult<
    ProtectedEchoQuery,
    ProtectedEchoQueryVariables
>;
