import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    json: any;
    jsonb: any;
    timestamptz: any;
    uuid: any;
};

/** columns and relationships of "Attendee" */
export type Attendee = {
    __typename?: "Attendee";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An array relationship */
    contentPeople: Array<ContentPerson>;
    /** An aggregated array relationship */
    contentPeople_aggregate: ContentPerson_Aggregate;
    createdAt: Scalars["timestamptz"];
    displayName: Scalars["String"];
    /** An array relationship */
    eventPeople: Array<EventPerson>;
    /** An aggregated array relationship */
    eventPeople_aggregate: EventPerson_Aggregate;
    /** An array relationship */
    groupAttendees: Array<GroupAttendee>;
    /** An aggregated array relationship */
    groupAttendees_aggregate: GroupAttendee_Aggregate;
    id: Scalars["uuid"];
    /** An object relationship */
    invitation?: Maybe<Invitation>;
    /** A computed field, executes function "hasbeeninvited" */
    inviteSent?: Maybe<Scalars["Boolean"]>;
    /** An array relationship */
    roomParticipants: Array<RoomParticipant>;
    /** An aggregated array relationship */
    roomParticipants_aggregate: RoomParticipant_Aggregate;
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user?: Maybe<User>;
    userId?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "Attendee" */
export type AttendeeContentPeopleArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeContentPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeEventPeopleArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeEventPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeGroupAttendeesArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeGroupAttendees_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeRoomParticipantsArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** columns and relationships of "Attendee" */
export type AttendeeRoomParticipants_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** aggregated selection of "Attendee" */
export type Attendee_Aggregate = {
    __typename?: "Attendee_aggregate";
    aggregate?: Maybe<Attendee_Aggregate_Fields>;
    nodes: Array<Attendee>;
};

/** aggregate fields of "Attendee" */
export type Attendee_Aggregate_Fields = {
    __typename?: "Attendee_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Attendee_Max_Fields>;
    min?: Maybe<Attendee_Min_Fields>;
};

/** aggregate fields of "Attendee" */
export type Attendee_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Attendee_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Attendee" */
export type Attendee_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Attendee_Max_Order_By>;
    min?: Maybe<Attendee_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Attendee" */
export type Attendee_Arr_Rel_Insert_Input = {
    data: Array<Attendee_Insert_Input>;
    on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Attendee". All fields are combined with a logical 'AND'. */
export type Attendee_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Attendee_Bool_Exp>>>;
    _not?: Maybe<Attendee_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Attendee_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentPeople?: Maybe<ContentPerson_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    displayName?: Maybe<String_Comparison_Exp>;
    eventPeople?: Maybe<EventPerson_Bool_Exp>;
    groupAttendees?: Maybe<GroupAttendee_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    invitation?: Maybe<Invitation_Bool_Exp>;
    roomParticipants?: Maybe<RoomParticipant_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Attendee" */
export enum Attendee_Constraint {
    /** unique or primary key constraint */
    AttendeeConferenceIdUserIdKey = "Attendee_conferenceId_userId_key",
    /** unique or primary key constraint */
    AttendeePkey = "Attendee_pkey",
}

/** input type for inserting data into table "Attendee" */
export type Attendee_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    displayName?: Maybe<Scalars["String"]>;
    eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
    groupAttendees?: Maybe<GroupAttendee_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    invitation?: Maybe<Invitation_Obj_Rel_Insert_Input>;
    roomParticipants?: Maybe<RoomParticipant_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Attendee_Max_Fields = {
    __typename?: "Attendee_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    displayName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Attendee" */
export type Attendee_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    displayName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Attendee_Min_Fields = {
    __typename?: "Attendee_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    displayName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Attendee" */
export type Attendee_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    displayName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "Attendee" */
export type Attendee_Mutation_Response = {
    __typename?: "Attendee_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Attendee>;
};

/** input type for inserting object relation for remote table "Attendee" */
export type Attendee_Obj_Rel_Insert_Input = {
    data: Attendee_Insert_Input;
    on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** on conflict condition type for table "Attendee" */
export type Attendee_On_Conflict = {
    constraint: Attendee_Constraint;
    update_columns: Array<Attendee_Update_Column>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** ordering options when selecting data from "Attendee" */
export type Attendee_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    displayName?: Maybe<Order_By>;
    eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
    groupAttendees_aggregate?: Maybe<GroupAttendee_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    invitation?: Maybe<Invitation_Order_By>;
    roomParticipants_aggregate?: Maybe<RoomParticipant_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "Attendee" */
export type Attendee_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Attendee" */
export enum Attendee_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    DisplayName = "displayName",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "Attendee" */
export type Attendee_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    displayName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "Attendee" */
export enum Attendee_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    DisplayName = "displayName",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** expression to compare columns of type Boolean. All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
    _eq?: Maybe<Scalars["Boolean"]>;
    _gt?: Maybe<Scalars["Boolean"]>;
    _gte?: Maybe<Scalars["Boolean"]>;
    _in?: Maybe<Array<Scalars["Boolean"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["Boolean"]>;
    _lte?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<Scalars["Boolean"]>;
    _nin?: Maybe<Array<Scalars["Boolean"]>>;
};

/** columns and relationships of "Broadcast" */
export type Broadcast = {
    __typename?: "Broadcast";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    data: Scalars["jsonb"];
    /** An object relationship */
    event: Event;
    eventId: Scalars["uuid"];
    id: Scalars["uuid"];
    to: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Broadcast" */
export type BroadcastDataArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItem = {
    __typename?: "BroadcastContentItem";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    contentItem: ContentItem;
    contentItemId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    executedTransitions: Array<ExecutedTransitions>;
    /** An aggregated array relationship */
    executedTransitions_aggregate: ExecutedTransitions_Aggregate;
    /** An array relationship */
    fallbackForTransitions: Array<Transitions>;
    /** An aggregated array relationship */
    fallbackForTransitions_aggregate: Transitions_Aggregate;
    id: Scalars["uuid"];
    input: Scalars["jsonb"];
    /** An object relationship */
    inputType: InputType;
    inputTypeName: InputType_Enum;
    /** An array relationship */
    transitions: Array<Transitions>;
    /** An aggregated array relationship */
    transitions_aggregate: Transitions_Aggregate;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemExecutedTransitionsArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemExecutedTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemFallbackForTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemFallbackForTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemInputArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** aggregated selection of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate = {
    __typename?: "BroadcastContentItem_aggregate";
    aggregate?: Maybe<BroadcastContentItem_Aggregate_Fields>;
    nodes: Array<BroadcastContentItem>;
};

/** aggregate fields of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_Fields = {
    __typename?: "BroadcastContentItem_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<BroadcastContentItem_Max_Fields>;
    min?: Maybe<BroadcastContentItem_Min_Fields>;
};

/** aggregate fields of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<BroadcastContentItem_Max_Order_By>;
    min?: Maybe<BroadcastContentItem_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type BroadcastContentItem_Append_Input = {
    input?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "BroadcastContentItem" */
export type BroadcastContentItem_Arr_Rel_Insert_Input = {
    data: Array<BroadcastContentItem_Insert_Input>;
    on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "BroadcastContentItem". All fields are combined with a logical 'AND'. */
export type BroadcastContentItem_Bool_Exp = {
    _and?: Maybe<Array<Maybe<BroadcastContentItem_Bool_Exp>>>;
    _not?: Maybe<BroadcastContentItem_Bool_Exp>;
    _or?: Maybe<Array<Maybe<BroadcastContentItem_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentItem?: Maybe<ContentItem_Bool_Exp>;
    contentItemId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
    fallbackForTransitions?: Maybe<Transitions_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    input?: Maybe<Jsonb_Comparison_Exp>;
    inputType?: Maybe<InputType_Bool_Exp>;
    inputTypeName?: Maybe<InputType_Enum_Comparison_Exp>;
    transitions?: Maybe<Transitions_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "BroadcastContentItem" */
export enum BroadcastContentItem_Constraint {
    /** unique or primary key constraint */
    BroadcastContentItemContentItemIdKey = "BroadcastContentItem_contentItemId_key",
    /** unique or primary key constraint */
    BroadcastContentItemPkey = "BroadcastContentItem_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type BroadcastContentItem_Delete_At_Path_Input = {
    input?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type BroadcastContentItem_Delete_Elem_Input = {
    input?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type BroadcastContentItem_Delete_Key_Input = {
    input?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "BroadcastContentItem" */
export type BroadcastContentItem_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentItem?: Maybe<ContentItem_Obj_Rel_Insert_Input>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
    fallbackForTransitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    input?: Maybe<Scalars["jsonb"]>;
    inputType?: Maybe<InputType_Obj_Rel_Insert_Input>;
    inputTypeName?: Maybe<InputType_Enum>;
    transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type BroadcastContentItem_Max_Fields = {
    __typename?: "BroadcastContentItem_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "BroadcastContentItem" */
export type BroadcastContentItem_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type BroadcastContentItem_Min_Fields = {
    __typename?: "BroadcastContentItem_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "BroadcastContentItem" */
export type BroadcastContentItem_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "BroadcastContentItem" */
export type BroadcastContentItem_Mutation_Response = {
    __typename?: "BroadcastContentItem_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<BroadcastContentItem>;
};

/** input type for inserting object relation for remote table "BroadcastContentItem" */
export type BroadcastContentItem_Obj_Rel_Insert_Input = {
    data: BroadcastContentItem_Insert_Input;
    on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** on conflict condition type for table "BroadcastContentItem" */
export type BroadcastContentItem_On_Conflict = {
    constraint: BroadcastContentItem_Constraint;
    update_columns: Array<BroadcastContentItem_Update_Column>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "BroadcastContentItem" */
export type BroadcastContentItem_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentItem?: Maybe<ContentItem_Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
    fallbackForTransitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    input?: Maybe<Order_By>;
    inputType?: Maybe<InputType_Order_By>;
    inputTypeName?: Maybe<Order_By>;
    transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "BroadcastContentItem" */
export type BroadcastContentItem_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type BroadcastContentItem_Prepend_Input = {
    input?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "BroadcastContentItem" */
export enum BroadcastContentItem_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentItemId = "contentItemId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Input = "input",
    /** column name */
    InputTypeName = "inputTypeName",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "BroadcastContentItem" */
export type BroadcastContentItem_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    input?: Maybe<Scalars["jsonb"]>;
    inputTypeName?: Maybe<InputType_Enum>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "BroadcastContentItem" */
export enum BroadcastContentItem_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentItemId = "contentItemId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Input = "input",
    /** column name */
    InputTypeName = "inputTypeName",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregated selection of "Broadcast" */
export type Broadcast_Aggregate = {
    __typename?: "Broadcast_aggregate";
    aggregate?: Maybe<Broadcast_Aggregate_Fields>;
    nodes: Array<Broadcast>;
};

/** aggregate fields of "Broadcast" */
export type Broadcast_Aggregate_Fields = {
    __typename?: "Broadcast_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Broadcast_Max_Fields>;
    min?: Maybe<Broadcast_Min_Fields>;
};

/** aggregate fields of "Broadcast" */
export type Broadcast_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Broadcast_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Broadcast" */
export type Broadcast_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Broadcast_Max_Order_By>;
    min?: Maybe<Broadcast_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Broadcast_Append_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "Broadcast" */
export type Broadcast_Arr_Rel_Insert_Input = {
    data: Array<Broadcast_Insert_Input>;
    on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Broadcast". All fields are combined with a logical 'AND'. */
export type Broadcast_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Broadcast_Bool_Exp>>>;
    _not?: Maybe<Broadcast_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Broadcast_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    data?: Maybe<Jsonb_Comparison_Exp>;
    event?: Maybe<Event_Bool_Exp>;
    eventId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    to?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Broadcast" */
export enum Broadcast_Constraint {
    /** unique or primary key constraint */
    BroadcastPkey = "Broadcast_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Broadcast_Delete_At_Path_Input = {
    data?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Broadcast_Delete_Elem_Input = {
    data?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Broadcast_Delete_Key_Input = {
    data?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "Broadcast" */
export type Broadcast_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    event?: Maybe<Event_Obj_Rel_Insert_Input>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    to?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Broadcast_Max_Fields = {
    __typename?: "Broadcast_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    to?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Broadcast" */
export type Broadcast_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    to?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Broadcast_Min_Fields = {
    __typename?: "Broadcast_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    to?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Broadcast" */
export type Broadcast_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    to?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Broadcast" */
export type Broadcast_Mutation_Response = {
    __typename?: "Broadcast_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Broadcast>;
};

/** input type for inserting object relation for remote table "Broadcast" */
export type Broadcast_Obj_Rel_Insert_Input = {
    data: Broadcast_Insert_Input;
    on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** on conflict condition type for table "Broadcast" */
export type Broadcast_On_Conflict = {
    constraint: Broadcast_Constraint;
    update_columns: Array<Broadcast_Update_Column>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** ordering options when selecting data from "Broadcast" */
export type Broadcast_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    data?: Maybe<Order_By>;
    event?: Maybe<Event_Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    to?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Broadcast" */
export type Broadcast_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Broadcast_Prepend_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "Broadcast" */
export enum Broadcast_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    To = "to",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Broadcast" */
export type Broadcast_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    to?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Broadcast" */
export enum Broadcast_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    To = "to",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Chat" */
export type Chat = {
    __typename?: "Chat";
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    creator: User;
    creatorId: Scalars["String"];
    description?: Maybe<Scalars["String"]>;
    /** An array relationship */
    flaggedMessages: Array<FlaggedChatMessage>;
    /** An aggregated array relationship */
    flaggedMessages_aggregate: FlaggedChatMessage_Aggregate;
    id: Scalars["uuid"];
    isAutoNotify: Scalars["Boolean"];
    isAutoPin: Scalars["Boolean"];
    /** An array relationship */
    members: Array<ChatMember>;
    /** An aggregated array relationship */
    members_aggregate: ChatMember_Aggregate;
    /** An array relationship */
    messages: Array<ChatMessage>;
    /** An aggregated array relationship */
    messages_aggregate: ChatMessage_Aggregate;
    mode: Scalars["String"];
    name: Scalars["String"];
    /** An array relationship */
    typers: Array<ChatTyper>;
    /** An aggregated array relationship */
    typers_aggregate: ChatTyper_Aggregate;
    updatedAt: Scalars["timestamptz"];
    /** An array relationship */
    viewers: Array<ChatViewer>;
    /** An aggregated array relationship */
    viewers_aggregate: ChatViewer_Aggregate;
};

/** columns and relationships of "Chat" */
export type ChatFlaggedMessagesArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatFlaggedMessages_AggregateArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatMembersArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatMembers_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatMessagesArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatMessages_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatTypersArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatTypers_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatViewersArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** columns and relationships of "Chat" */
export type ChatViewers_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** columns and relationships of "ChatMember" */
export type ChatMember = {
    __typename?: "ChatMember";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    invitationAcceptedAt?: Maybe<Scalars["timestamptz"]>;
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "ChatMember" */
export type ChatMember_Aggregate = {
    __typename?: "ChatMember_aggregate";
    aggregate?: Maybe<ChatMember_Aggregate_Fields>;
    nodes: Array<ChatMember>;
};

/** aggregate fields of "ChatMember" */
export type ChatMember_Aggregate_Fields = {
    __typename?: "ChatMember_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatMember_Max_Fields>;
    min?: Maybe<ChatMember_Min_Fields>;
};

/** aggregate fields of "ChatMember" */
export type ChatMember_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatMember_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatMember" */
export type ChatMember_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ChatMember_Max_Order_By>;
    min?: Maybe<ChatMember_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatMember" */
export type ChatMember_Arr_Rel_Insert_Input = {
    data: Array<ChatMember_Insert_Input>;
    on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatMember". All fields are combined with a logical 'AND'. */
export type ChatMember_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatMember_Bool_Exp>>>;
    _not?: Maybe<ChatMember_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatMember_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    invitationAcceptedAt?: Maybe<Timestamptz_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatMember" */
export enum ChatMember_Constraint {
    /** unique or primary key constraint */
    ChatMemberChatIdUserIdKey = "ChatMember_chatId_userId_key",
    /** unique or primary key constraint */
    ChatMemberPkey = "ChatMember_pkey",
}

/** input type for inserting data into table "ChatMember" */
export type ChatMember_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationAcceptedAt?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ChatMember_Max_Fields = {
    __typename?: "ChatMember_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationAcceptedAt?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ChatMember" */
export type ChatMember_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitationAcceptedAt?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatMember_Min_Fields = {
    __typename?: "ChatMember_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationAcceptedAt?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ChatMember" */
export type ChatMember_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitationAcceptedAt?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatMember" */
export type ChatMember_Mutation_Response = {
    __typename?: "ChatMember_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatMember>;
};

/** input type for inserting object relation for remote table "ChatMember" */
export type ChatMember_Obj_Rel_Insert_Input = {
    data: ChatMember_Insert_Input;
    on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** on conflict condition type for table "ChatMember" */
export type ChatMember_On_Conflict = {
    constraint: ChatMember_Constraint;
    update_columns: Array<ChatMember_Update_Column>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** ordering options when selecting data from "ChatMember" */
export type ChatMember_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitationAcceptedAt?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatMember" */
export type ChatMember_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ChatMember" */
export enum ChatMember_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    InvitationAcceptedAt = "invitationAcceptedAt",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "ChatMember" */
export type ChatMember_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationAcceptedAt?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "ChatMember" */
export enum ChatMember_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    InvitationAcceptedAt = "invitationAcceptedAt",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** columns and relationships of "ChatMessage" */
export type ChatMessage = {
    __typename?: "ChatMessage";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    content: Scalars["jsonb"];
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    flags: Array<FlaggedChatMessage>;
    /** An aggregated array relationship */
    flags_aggregate: FlaggedChatMessage_Aggregate;
    id: Scalars["uuid"];
    index: Scalars["Int"];
    isHighlighted: Scalars["Boolean"];
    /** An array relationship */
    reactions: Array<ChatReaction>;
    /** An aggregated array relationship */
    reactions_aggregate: ChatReaction_Aggregate;
    /** An object relationship */
    sender: User;
    senderId: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "ChatMessage" */
export type ChatMessageContentArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "ChatMessage" */
export type ChatMessageFlagsArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "ChatMessage" */
export type ChatMessageFlags_AggregateArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "ChatMessage" */
export type ChatMessageReactionsArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** columns and relationships of "ChatMessage" */
export type ChatMessageReactions_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** aggregated selection of "ChatMessage" */
export type ChatMessage_Aggregate = {
    __typename?: "ChatMessage_aggregate";
    aggregate?: Maybe<ChatMessage_Aggregate_Fields>;
    nodes: Array<ChatMessage>;
};

/** aggregate fields of "ChatMessage" */
export type ChatMessage_Aggregate_Fields = {
    __typename?: "ChatMessage_aggregate_fields";
    avg?: Maybe<ChatMessage_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatMessage_Max_Fields>;
    min?: Maybe<ChatMessage_Min_Fields>;
    stddev?: Maybe<ChatMessage_Stddev_Fields>;
    stddev_pop?: Maybe<ChatMessage_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<ChatMessage_Stddev_Samp_Fields>;
    sum?: Maybe<ChatMessage_Sum_Fields>;
    var_pop?: Maybe<ChatMessage_Var_Pop_Fields>;
    var_samp?: Maybe<ChatMessage_Var_Samp_Fields>;
    variance?: Maybe<ChatMessage_Variance_Fields>;
};

/** aggregate fields of "ChatMessage" */
export type ChatMessage_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatMessage_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatMessage" */
export type ChatMessage_Aggregate_Order_By = {
    avg?: Maybe<ChatMessage_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<ChatMessage_Max_Order_By>;
    min?: Maybe<ChatMessage_Min_Order_By>;
    stddev?: Maybe<ChatMessage_Stddev_Order_By>;
    stddev_pop?: Maybe<ChatMessage_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<ChatMessage_Stddev_Samp_Order_By>;
    sum?: Maybe<ChatMessage_Sum_Order_By>;
    var_pop?: Maybe<ChatMessage_Var_Pop_Order_By>;
    var_samp?: Maybe<ChatMessage_Var_Samp_Order_By>;
    variance?: Maybe<ChatMessage_Variance_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ChatMessage_Append_Input = {
    content?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "ChatMessage" */
export type ChatMessage_Arr_Rel_Insert_Input = {
    data: Array<ChatMessage_Insert_Input>;
    on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** aggregate avg on columns */
export type ChatMessage_Avg_Fields = {
    __typename?: "ChatMessage_avg_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "ChatMessage" */
export type ChatMessage_Avg_Order_By = {
    index?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ChatMessage". All fields are combined with a logical 'AND'. */
export type ChatMessage_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatMessage_Bool_Exp>>>;
    _not?: Maybe<ChatMessage_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatMessage_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    content?: Maybe<Jsonb_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    flags?: Maybe<FlaggedChatMessage_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    index?: Maybe<Int_Comparison_Exp>;
    isHighlighted?: Maybe<Boolean_Comparison_Exp>;
    reactions?: Maybe<ChatReaction_Bool_Exp>;
    sender?: Maybe<User_Bool_Exp>;
    senderId?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatMessage" */
export enum ChatMessage_Constraint {
    /** unique or primary key constraint */
    ChatMessageChatIdIndexKey = "ChatMessage_chatId_index_key",
    /** unique or primary key constraint */
    ChatMessagePkey = "ChatMessage_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ChatMessage_Delete_At_Path_Input = {
    content?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ChatMessage_Delete_Elem_Input = {
    content?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ChatMessage_Delete_Key_Input = {
    content?: Maybe<Scalars["String"]>;
};

/** input type for incrementing integer column in table "ChatMessage" */
export type ChatMessage_Inc_Input = {
    index?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "ChatMessage" */
export type ChatMessage_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    content?: Maybe<Scalars["jsonb"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    flags?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    isHighlighted?: Maybe<Scalars["Boolean"]>;
    reactions?: Maybe<ChatReaction_Arr_Rel_Insert_Input>;
    sender?: Maybe<User_Obj_Rel_Insert_Input>;
    senderId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type ChatMessage_Max_Fields = {
    __typename?: "ChatMessage_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    senderId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ChatMessage" */
export type ChatMessage_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    senderId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatMessage_Min_Fields = {
    __typename?: "ChatMessage_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    senderId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ChatMessage" */
export type ChatMessage_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    senderId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatMessage" */
export type ChatMessage_Mutation_Response = {
    __typename?: "ChatMessage_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatMessage>;
};

/** input type for inserting object relation for remote table "ChatMessage" */
export type ChatMessage_Obj_Rel_Insert_Input = {
    data: ChatMessage_Insert_Input;
    on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** on conflict condition type for table "ChatMessage" */
export type ChatMessage_On_Conflict = {
    constraint: ChatMessage_Constraint;
    update_columns: Array<ChatMessage_Update_Column>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** ordering options when selecting data from "ChatMessage" */
export type ChatMessage_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    content?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    flags_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    isHighlighted?: Maybe<Order_By>;
    reactions_aggregate?: Maybe<ChatReaction_Aggregate_Order_By>;
    sender?: Maybe<User_Order_By>;
    senderId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatMessage" */
export type ChatMessage_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ChatMessage_Prepend_Input = {
    content?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "ChatMessage" */
export enum ChatMessage_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Content = "content",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Index = "index",
    /** column name */
    IsHighlighted = "isHighlighted",
    /** column name */
    SenderId = "senderId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "ChatMessage" */
export type ChatMessage_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    content?: Maybe<Scalars["jsonb"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    isHighlighted?: Maybe<Scalars["Boolean"]>;
    senderId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type ChatMessage_Stddev_Fields = {
    __typename?: "ChatMessage_stddev_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ChatMessage_Stddev_Pop_Fields = {
    __typename?: "ChatMessage_stddev_pop_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Pop_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ChatMessage_Stddev_Samp_Fields = {
    __typename?: "ChatMessage_stddev_samp_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Samp_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ChatMessage_Sum_Fields = {
    __typename?: "ChatMessage_sum_fields";
    index?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "ChatMessage" */
export type ChatMessage_Sum_Order_By = {
    index?: Maybe<Order_By>;
};

/** update columns of table "ChatMessage" */
export enum ChatMessage_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Content = "content",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Index = "index",
    /** column name */
    IsHighlighted = "isHighlighted",
    /** column name */
    SenderId = "senderId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregate var_pop on columns */
export type ChatMessage_Var_Pop_Fields = {
    __typename?: "ChatMessage_var_pop_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "ChatMessage" */
export type ChatMessage_Var_Pop_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ChatMessage_Var_Samp_Fields = {
    __typename?: "ChatMessage_var_samp_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "ChatMessage" */
export type ChatMessage_Var_Samp_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ChatMessage_Variance_Fields = {
    __typename?: "ChatMessage_variance_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "ChatMessage" */
export type ChatMessage_Variance_Order_By = {
    index?: Maybe<Order_By>;
};

/** columns and relationships of "ChatReaction" */
export type ChatReaction = {
    __typename?: "ChatReaction";
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    /** An object relationship */
    message: ChatMessage;
    messageId: Scalars["uuid"];
    reaction: Scalars["String"];
    /** An object relationship */
    reactor: User;
    reactorId: Scalars["String"];
};

/** aggregated selection of "ChatReaction" */
export type ChatReaction_Aggregate = {
    __typename?: "ChatReaction_aggregate";
    aggregate?: Maybe<ChatReaction_Aggregate_Fields>;
    nodes: Array<ChatReaction>;
};

/** aggregate fields of "ChatReaction" */
export type ChatReaction_Aggregate_Fields = {
    __typename?: "ChatReaction_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatReaction_Max_Fields>;
    min?: Maybe<ChatReaction_Min_Fields>;
};

/** aggregate fields of "ChatReaction" */
export type ChatReaction_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatReaction_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatReaction" */
export type ChatReaction_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ChatReaction_Max_Order_By>;
    min?: Maybe<ChatReaction_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatReaction" */
export type ChatReaction_Arr_Rel_Insert_Input = {
    data: Array<ChatReaction_Insert_Input>;
    on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatReaction". All fields are combined with a logical 'AND'. */
export type ChatReaction_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatReaction_Bool_Exp>>>;
    _not?: Maybe<ChatReaction_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatReaction_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    message?: Maybe<ChatMessage_Bool_Exp>;
    messageId?: Maybe<Uuid_Comparison_Exp>;
    reaction?: Maybe<String_Comparison_Exp>;
    reactor?: Maybe<User_Bool_Exp>;
    reactorId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatReaction" */
export enum ChatReaction_Constraint {
    /** unique or primary key constraint */
    ChatReactionMessageIdReactorIdReactionKey = "ChatReaction_messageId_reactorId_reaction_key",
    /** unique or primary key constraint */
    ChatReactionPkey = "ChatReaction_pkey",
}

/** input type for inserting data into table "ChatReaction" */
export type ChatReaction_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<ChatMessage_Obj_Rel_Insert_Input>;
    messageId?: Maybe<Scalars["uuid"]>;
    reaction?: Maybe<Scalars["String"]>;
    reactor?: Maybe<User_Obj_Rel_Insert_Input>;
    reactorId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ChatReaction_Max_Fields = {
    __typename?: "ChatReaction_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    reaction?: Maybe<Scalars["String"]>;
    reactorId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ChatReaction" */
export type ChatReaction_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    messageId?: Maybe<Order_By>;
    reaction?: Maybe<Order_By>;
    reactorId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatReaction_Min_Fields = {
    __typename?: "ChatReaction_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    reaction?: Maybe<Scalars["String"]>;
    reactorId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ChatReaction" */
export type ChatReaction_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    messageId?: Maybe<Order_By>;
    reaction?: Maybe<Order_By>;
    reactorId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatReaction" */
export type ChatReaction_Mutation_Response = {
    __typename?: "ChatReaction_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatReaction>;
};

/** input type for inserting object relation for remote table "ChatReaction" */
export type ChatReaction_Obj_Rel_Insert_Input = {
    data: ChatReaction_Insert_Input;
    on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** on conflict condition type for table "ChatReaction" */
export type ChatReaction_On_Conflict = {
    constraint: ChatReaction_Constraint;
    update_columns: Array<ChatReaction_Update_Column>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** ordering options when selecting data from "ChatReaction" */
export type ChatReaction_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<ChatMessage_Order_By>;
    messageId?: Maybe<Order_By>;
    reaction?: Maybe<Order_By>;
    reactor?: Maybe<User_Order_By>;
    reactorId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatReaction" */
export type ChatReaction_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ChatReaction" */
export enum ChatReaction_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    MessageId = "messageId",
    /** column name */
    Reaction = "reaction",
    /** column name */
    ReactorId = "reactorId",
}

/** input type for updating data in table "ChatReaction" */
export type ChatReaction_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    reaction?: Maybe<Scalars["String"]>;
    reactorId?: Maybe<Scalars["String"]>;
};

/** update columns of table "ChatReaction" */
export enum ChatReaction_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    MessageId = "messageId",
    /** column name */
    Reaction = "reaction",
    /** column name */
    ReactorId = "reactorId",
}

/** columns and relationships of "ChatTyper" */
export type ChatTyper = {
    __typename?: "ChatTyper";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    id: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "ChatTyper" */
export type ChatTyper_Aggregate = {
    __typename?: "ChatTyper_aggregate";
    aggregate?: Maybe<ChatTyper_Aggregate_Fields>;
    nodes: Array<ChatTyper>;
};

/** aggregate fields of "ChatTyper" */
export type ChatTyper_Aggregate_Fields = {
    __typename?: "ChatTyper_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatTyper_Max_Fields>;
    min?: Maybe<ChatTyper_Min_Fields>;
};

/** aggregate fields of "ChatTyper" */
export type ChatTyper_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatTyper_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatTyper" */
export type ChatTyper_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ChatTyper_Max_Order_By>;
    min?: Maybe<ChatTyper_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatTyper" */
export type ChatTyper_Arr_Rel_Insert_Input = {
    data: Array<ChatTyper_Insert_Input>;
    on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatTyper". All fields are combined with a logical 'AND'. */
export type ChatTyper_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatTyper_Bool_Exp>>>;
    _not?: Maybe<ChatTyper_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatTyper_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatTyper" */
export enum ChatTyper_Constraint {
    /** unique or primary key constraint */
    ChatTyperChatIdUserIdKey = "ChatTyper_chatId_userId_key",
    /** unique or primary key constraint */
    ChatTypersPkey = "ChatTypers_pkey",
}

/** input type for inserting data into table "ChatTyper" */
export type ChatTyper_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ChatTyper_Max_Fields = {
    __typename?: "ChatTyper_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ChatTyper" */
export type ChatTyper_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatTyper_Min_Fields = {
    __typename?: "ChatTyper_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ChatTyper" */
export type ChatTyper_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatTyper" */
export type ChatTyper_Mutation_Response = {
    __typename?: "ChatTyper_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatTyper>;
};

/** input type for inserting object relation for remote table "ChatTyper" */
export type ChatTyper_Obj_Rel_Insert_Input = {
    data: ChatTyper_Insert_Input;
    on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** on conflict condition type for table "ChatTyper" */
export type ChatTyper_On_Conflict = {
    constraint: ChatTyper_Constraint;
    update_columns: Array<ChatTyper_Update_Column>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** ordering options when selecting data from "ChatTyper" */
export type ChatTyper_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatTyper" */
export type ChatTyper_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ChatTyper" */
export enum ChatTyper_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "ChatTyper" */
export type ChatTyper_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "ChatTyper" */
export enum ChatTyper_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** columns and relationships of "ChatUnreadIndex" */
export type ChatUnreadIndex = {
    __typename?: "ChatUnreadIndex";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    id: Scalars["uuid"];
    index?: Maybe<Scalars["Int"]>;
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate = {
    __typename?: "ChatUnreadIndex_aggregate";
    aggregate?: Maybe<ChatUnreadIndex_Aggregate_Fields>;
    nodes: Array<ChatUnreadIndex>;
};

/** aggregate fields of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_Fields = {
    __typename?: "ChatUnreadIndex_aggregate_fields";
    avg?: Maybe<ChatUnreadIndex_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatUnreadIndex_Max_Fields>;
    min?: Maybe<ChatUnreadIndex_Min_Fields>;
    stddev?: Maybe<ChatUnreadIndex_Stddev_Fields>;
    stddev_pop?: Maybe<ChatUnreadIndex_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<ChatUnreadIndex_Stddev_Samp_Fields>;
    sum?: Maybe<ChatUnreadIndex_Sum_Fields>;
    var_pop?: Maybe<ChatUnreadIndex_Var_Pop_Fields>;
    var_samp?: Maybe<ChatUnreadIndex_Var_Samp_Fields>;
    variance?: Maybe<ChatUnreadIndex_Variance_Fields>;
};

/** aggregate fields of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_Order_By = {
    avg?: Maybe<ChatUnreadIndex_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<ChatUnreadIndex_Max_Order_By>;
    min?: Maybe<ChatUnreadIndex_Min_Order_By>;
    stddev?: Maybe<ChatUnreadIndex_Stddev_Order_By>;
    stddev_pop?: Maybe<ChatUnreadIndex_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<ChatUnreadIndex_Stddev_Samp_Order_By>;
    sum?: Maybe<ChatUnreadIndex_Sum_Order_By>;
    var_pop?: Maybe<ChatUnreadIndex_Var_Pop_Order_By>;
    var_samp?: Maybe<ChatUnreadIndex_Var_Samp_Order_By>;
    variance?: Maybe<ChatUnreadIndex_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "ChatUnreadIndex" */
export type ChatUnreadIndex_Arr_Rel_Insert_Input = {
    data: Array<ChatUnreadIndex_Insert_Input>;
    on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** aggregate avg on columns */
export type ChatUnreadIndex_Avg_Fields = {
    __typename?: "ChatUnreadIndex_avg_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Avg_Order_By = {
    index?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ChatUnreadIndex". All fields are combined with a logical 'AND'. */
export type ChatUnreadIndex_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatUnreadIndex_Bool_Exp>>>;
    _not?: Maybe<ChatUnreadIndex_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatUnreadIndex_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    index?: Maybe<Int_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Constraint {
    /** unique or primary key constraint */
    ChatUnreadIndexChatIdUserIdKey = "ChatUnreadIndex_chatId_userId_key",
    /** unique or primary key constraint */
    ChatUnreadIndexPkey = "ChatUnreadIndex_pkey",
}

/** input type for incrementing integer column in table "ChatUnreadIndex" */
export type ChatUnreadIndex_Inc_Input = {
    index?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "ChatUnreadIndex" */
export type ChatUnreadIndex_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ChatUnreadIndex_Max_Fields = {
    __typename?: "ChatUnreadIndex_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatUnreadIndex_Min_Fields = {
    __typename?: "ChatUnreadIndex_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatUnreadIndex" */
export type ChatUnreadIndex_Mutation_Response = {
    __typename?: "ChatUnreadIndex_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatUnreadIndex>;
};

/** input type for inserting object relation for remote table "ChatUnreadIndex" */
export type ChatUnreadIndex_Obj_Rel_Insert_Input = {
    data: ChatUnreadIndex_Insert_Input;
    on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** on conflict condition type for table "ChatUnreadIndex" */
export type ChatUnreadIndex_On_Conflict = {
    constraint: ChatUnreadIndex_Constraint;
    update_columns: Array<ChatUnreadIndex_Update_Column>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** ordering options when selecting data from "ChatUnreadIndex" */
export type ChatUnreadIndex_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    index?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatUnreadIndex" */
export type ChatUnreadIndex_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Index = "index",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "ChatUnreadIndex" */
export type ChatUnreadIndex_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    index?: Maybe<Scalars["Int"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate stddev on columns */
export type ChatUnreadIndex_Stddev_Fields = {
    __typename?: "ChatUnreadIndex_stddev_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ChatUnreadIndex_Stddev_Pop_Fields = {
    __typename?: "ChatUnreadIndex_stddev_pop_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Pop_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ChatUnreadIndex_Stddev_Samp_Fields = {
    __typename?: "ChatUnreadIndex_stddev_samp_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Samp_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ChatUnreadIndex_Sum_Fields = {
    __typename?: "ChatUnreadIndex_sum_fields";
    index?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Sum_Order_By = {
    index?: Maybe<Order_By>;
};

/** update columns of table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Index = "index",
    /** column name */
    UserId = "userId",
}

/** aggregate var_pop on columns */
export type ChatUnreadIndex_Var_Pop_Fields = {
    __typename?: "ChatUnreadIndex_var_pop_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Var_Pop_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ChatUnreadIndex_Var_Samp_Fields = {
    __typename?: "ChatUnreadIndex_var_samp_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Var_Samp_Order_By = {
    index?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ChatUnreadIndex_Variance_Fields = {
    __typename?: "ChatUnreadIndex_variance_fields";
    index?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Variance_Order_By = {
    index?: Maybe<Order_By>;
};

/** columns and relationships of "ChatViewer" */
export type ChatViewer = {
    __typename?: "ChatViewer";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    id: Scalars["uuid"];
    lastSeen: Scalars["timestamptz"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "ChatViewer" */
export type ChatViewer_Aggregate = {
    __typename?: "ChatViewer_aggregate";
    aggregate?: Maybe<ChatViewer_Aggregate_Fields>;
    nodes: Array<ChatViewer>;
};

/** aggregate fields of "ChatViewer" */
export type ChatViewer_Aggregate_Fields = {
    __typename?: "ChatViewer_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ChatViewer_Max_Fields>;
    min?: Maybe<ChatViewer_Min_Fields>;
};

/** aggregate fields of "ChatViewer" */
export type ChatViewer_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ChatViewer_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ChatViewer" */
export type ChatViewer_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ChatViewer_Max_Order_By>;
    min?: Maybe<ChatViewer_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatViewer" */
export type ChatViewer_Arr_Rel_Insert_Input = {
    data: Array<ChatViewer_Insert_Input>;
    on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatViewer". All fields are combined with a logical 'AND'. */
export type ChatViewer_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ChatViewer_Bool_Exp>>>;
    _not?: Maybe<ChatViewer_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ChatViewer_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    lastSeen?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatViewer" */
export enum ChatViewer_Constraint {
    /** unique or primary key constraint */
    ChatViewerChatIdUserIdKey = "ChatViewer_chatId_userId_key",
    /** unique or primary key constraint */
    ChatViewerPkey = "ChatViewer_pkey",
}

/** input type for inserting data into table "ChatViewer" */
export type ChatViewer_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ChatViewer_Max_Fields = {
    __typename?: "ChatViewer_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ChatViewer" */
export type ChatViewer_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatViewer_Min_Fields = {
    __typename?: "ChatViewer_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ChatViewer" */
export type ChatViewer_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatViewer" */
export type ChatViewer_Mutation_Response = {
    __typename?: "ChatViewer_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ChatViewer>;
};

/** input type for inserting object relation for remote table "ChatViewer" */
export type ChatViewer_Obj_Rel_Insert_Input = {
    data: ChatViewer_Insert_Input;
    on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** on conflict condition type for table "ChatViewer" */
export type ChatViewer_On_Conflict = {
    constraint: ChatViewer_Constraint;
    update_columns: Array<ChatViewer_Update_Column>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** ordering options when selecting data from "ChatViewer" */
export type ChatViewer_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatViewer" */
export type ChatViewer_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ChatViewer" */
export enum ChatViewer_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    LastSeen = "lastSeen",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "ChatViewer" */
export type ChatViewer_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "ChatViewer" */
export enum ChatViewer_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    LastSeen = "lastSeen",
    /** column name */
    UserId = "userId",
}

/** aggregated selection of "Chat" */
export type Chat_Aggregate = {
    __typename?: "Chat_aggregate";
    aggregate?: Maybe<Chat_Aggregate_Fields>;
    nodes: Array<Chat>;
};

/** aggregate fields of "Chat" */
export type Chat_Aggregate_Fields = {
    __typename?: "Chat_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Chat_Max_Fields>;
    min?: Maybe<Chat_Min_Fields>;
};

/** aggregate fields of "Chat" */
export type Chat_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Chat_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Chat" */
export type Chat_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Chat_Max_Order_By>;
    min?: Maybe<Chat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Chat" */
export type Chat_Arr_Rel_Insert_Input = {
    data: Array<Chat_Insert_Input>;
    on_conflict?: Maybe<Chat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Chat". All fields are combined with a logical 'AND'. */
export type Chat_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Chat_Bool_Exp>>>;
    _not?: Maybe<Chat_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Chat_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    creator?: Maybe<User_Bool_Exp>;
    creatorId?: Maybe<String_Comparison_Exp>;
    description?: Maybe<String_Comparison_Exp>;
    flaggedMessages?: Maybe<FlaggedChatMessage_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    isAutoNotify?: Maybe<Boolean_Comparison_Exp>;
    isAutoPin?: Maybe<Boolean_Comparison_Exp>;
    members?: Maybe<ChatMember_Bool_Exp>;
    messages?: Maybe<ChatMessage_Bool_Exp>;
    mode?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    typers?: Maybe<ChatTyper_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    viewers?: Maybe<ChatViewer_Bool_Exp>;
};

/** unique or primary key constraints on table "Chat" */
export enum Chat_Constraint {
    /** unique or primary key constraint */
    ChatPkey = "Chat_pkey",
}

/** input type for inserting data into table "Chat" */
export type Chat_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    creator?: Maybe<User_Obj_Rel_Insert_Input>;
    creatorId?: Maybe<Scalars["String"]>;
    description?: Maybe<Scalars["String"]>;
    flaggedMessages?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    isAutoNotify?: Maybe<Scalars["Boolean"]>;
    isAutoPin?: Maybe<Scalars["Boolean"]>;
    members?: Maybe<ChatMember_Arr_Rel_Insert_Input>;
    messages?: Maybe<ChatMessage_Arr_Rel_Insert_Input>;
    mode?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    typers?: Maybe<ChatTyper_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    viewers?: Maybe<ChatViewer_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Chat_Max_Fields = {
    __typename?: "Chat_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    creatorId?: Maybe<Scalars["String"]>;
    description?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    mode?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Chat" */
export type Chat_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    creatorId?: Maybe<Order_By>;
    description?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    mode?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Chat_Min_Fields = {
    __typename?: "Chat_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    creatorId?: Maybe<Scalars["String"]>;
    description?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    mode?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Chat" */
export type Chat_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    creatorId?: Maybe<Order_By>;
    description?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    mode?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Chat" */
export type Chat_Mutation_Response = {
    __typename?: "Chat_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Chat>;
};

/** input type for inserting object relation for remote table "Chat" */
export type Chat_Obj_Rel_Insert_Input = {
    data: Chat_Insert_Input;
    on_conflict?: Maybe<Chat_On_Conflict>;
};

/** on conflict condition type for table "Chat" */
export type Chat_On_Conflict = {
    constraint: Chat_Constraint;
    update_columns: Array<Chat_Update_Column>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** ordering options when selecting data from "Chat" */
export type Chat_Order_By = {
    createdAt?: Maybe<Order_By>;
    creator?: Maybe<User_Order_By>;
    creatorId?: Maybe<Order_By>;
    description?: Maybe<Order_By>;
    flaggedMessages_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    isAutoNotify?: Maybe<Order_By>;
    isAutoPin?: Maybe<Order_By>;
    members_aggregate?: Maybe<ChatMember_Aggregate_Order_By>;
    messages_aggregate?: Maybe<ChatMessage_Aggregate_Order_By>;
    mode?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    typers_aggregate?: Maybe<ChatTyper_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
    viewers_aggregate?: Maybe<ChatViewer_Aggregate_Order_By>;
};

/** primary key columns input for table: "Chat" */
export type Chat_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Chat" */
export enum Chat_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    CreatorId = "creatorId",
    /** column name */
    Description = "description",
    /** column name */
    Id = "id",
    /** column name */
    IsAutoNotify = "isAutoNotify",
    /** column name */
    IsAutoPin = "isAutoPin",
    /** column name */
    Mode = "mode",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Chat" */
export type Chat_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    creatorId?: Maybe<Scalars["String"]>;
    description?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    isAutoNotify?: Maybe<Scalars["Boolean"]>;
    isAutoPin?: Maybe<Scalars["Boolean"]>;
    mode?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Chat" */
export enum Chat_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    CreatorId = "creatorId",
    /** column name */
    Description = "description",
    /** column name */
    Id = "id",
    /** column name */
    IsAutoNotify = "isAutoNotify",
    /** column name */
    IsAutoPin = "isAutoPin",
    /** column name */
    Mode = "mode",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Conference" */
export type Conference = {
    __typename?: "Conference";
    /** An array relationship */
    attendees: Array<Attendee>;
    /** An aggregated array relationship */
    attendees_aggregate: Attendee_Aggregate;
    /** An array relationship */
    configurations: Array<ConferenceConfiguration>;
    /** An aggregated array relationship */
    configurations_aggregate: ConferenceConfiguration_Aggregate;
    /** An array relationship */
    contentGroups: Array<ContentGroup>;
    /** An aggregated array relationship */
    contentGroups_aggregate: ContentGroup_Aggregate;
    /** An array relationship */
    contentPeople: Array<ContentPerson>;
    /** An aggregated array relationship */
    contentPeople_aggregate: ContentPerson_Aggregate;
    createdAt: Scalars["timestamptz"];
    createdBy: Scalars["String"];
    /** An object relationship */
    creator: User;
    /** An object relationship */
    demoCode: ConferenceDemoCode;
    demoCodeId: Scalars["uuid"];
    /** An array relationship */
    groups: Array<Group>;
    /** An aggregated array relationship */
    groups_aggregate: Group_Aggregate;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An array relationship */
    originatingDatas: Array<OriginatingData>;
    /** An aggregated array relationship */
    originatingDatas_aggregate: OriginatingData_Aggregate;
    /** An array relationship */
    roles: Array<Role>;
    /** An aggregated array relationship */
    roles_aggregate: Role_Aggregate;
    /** An array relationship */
    rooms: Array<Room>;
    /** An aggregated array relationship */
    rooms_aggregate: Room_Aggregate;
    shortName: Scalars["String"];
    slug: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Conference" */
export type ConferenceAttendeesArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceAttendees_AggregateArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceConfigurationsArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceConfigurations_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceContentGroupsArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceContentGroups_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceContentPeopleArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceContentPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceGroupsArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceGroups_AggregateArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceOriginatingDatasArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceOriginatingDatas_AggregateArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceRolesArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceRoles_AggregateArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceRoomsArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "Conference" */
export type ConferenceRooms_AggregateArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "ConferenceConfiguration" */
export type ConferenceConfiguration = {
    __typename?: "ConferenceConfiguration";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    key: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
    value: Scalars["jsonb"];
};

/** columns and relationships of "ConferenceConfiguration" */
export type ConferenceConfigurationValueArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate = {
    __typename?: "ConferenceConfiguration_aggregate";
    aggregate?: Maybe<ConferenceConfiguration_Aggregate_Fields>;
    nodes: Array<ConferenceConfiguration>;
};

/** aggregate fields of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_Fields = {
    __typename?: "ConferenceConfiguration_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ConferenceConfiguration_Max_Fields>;
    min?: Maybe<ConferenceConfiguration_Min_Fields>;
};

/** aggregate fields of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ConferenceConfiguration_Max_Order_By>;
    min?: Maybe<ConferenceConfiguration_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ConferenceConfiguration_Append_Input = {
    value?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "ConferenceConfiguration" */
export type ConferenceConfiguration_Arr_Rel_Insert_Input = {
    data: Array<ConferenceConfiguration_Insert_Input>;
    on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ConferenceConfiguration". All fields are combined with a logical 'AND'. */
export type ConferenceConfiguration_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ConferenceConfiguration_Bool_Exp>>>;
    _not?: Maybe<ConferenceConfiguration_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ConferenceConfiguration_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    key?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    value?: Maybe<Jsonb_Comparison_Exp>;
};

/** unique or primary key constraints on table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Constraint {
    /** unique or primary key constraint */
    ConferenceConfigurationConferenceIdKeyKey = "ConferenceConfiguration_conferenceId_key_key",
    /** unique or primary key constraint */
    ConferenceConfigurationPkey = "ConferenceConfiguration_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ConferenceConfiguration_Delete_At_Path_Input = {
    value?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ConferenceConfiguration_Delete_Elem_Input = {
    value?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ConferenceConfiguration_Delete_Key_Input = {
    value?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "ConferenceConfiguration" */
export type ConferenceConfiguration_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    key?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    value?: Maybe<Scalars["jsonb"]>;
};

/** aggregate max on columns */
export type ConferenceConfiguration_Max_Fields = {
    __typename?: "ConferenceConfiguration_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    key?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    key?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ConferenceConfiguration_Min_Fields = {
    __typename?: "ConferenceConfiguration_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    key?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    key?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ConferenceConfiguration" */
export type ConferenceConfiguration_Mutation_Response = {
    __typename?: "ConferenceConfiguration_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ConferenceConfiguration>;
};

/** input type for inserting object relation for remote table "ConferenceConfiguration" */
export type ConferenceConfiguration_Obj_Rel_Insert_Input = {
    data: ConferenceConfiguration_Insert_Input;
    on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** on conflict condition type for table "ConferenceConfiguration" */
export type ConferenceConfiguration_On_Conflict = {
    constraint: ConferenceConfiguration_Constraint;
    update_columns: Array<ConferenceConfiguration_Update_Column>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** ordering options when selecting data from "ConferenceConfiguration" */
export type ConferenceConfiguration_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    key?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    value?: Maybe<Order_By>;
};

/** primary key columns input for table: "ConferenceConfiguration" */
export type ConferenceConfiguration_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ConferenceConfiguration_Prepend_Input = {
    value?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Key = "key",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    Value = "value",
}

/** input type for updating data in table "ConferenceConfiguration" */
export type ConferenceConfiguration_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    key?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    value?: Maybe<Scalars["jsonb"]>;
};

/** update columns of table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Key = "key",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    Value = "value",
}

/** columns and relationships of "ConferenceDemoCode" */
export type ConferenceDemoCode = {
    __typename?: "ConferenceDemoCode";
    /** An object relationship */
    conference?: Maybe<Conference>;
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    note?: Maybe<Scalars["String"]>;
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    usedBy?: Maybe<User>;
    usedById?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate = {
    __typename?: "ConferenceDemoCode_aggregate";
    aggregate?: Maybe<ConferenceDemoCode_Aggregate_Fields>;
    nodes: Array<ConferenceDemoCode>;
};

/** aggregate fields of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_Fields = {
    __typename?: "ConferenceDemoCode_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ConferenceDemoCode_Max_Fields>;
    min?: Maybe<ConferenceDemoCode_Min_Fields>;
};

/** aggregate fields of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ConferenceDemoCode_Max_Order_By>;
    min?: Maybe<ConferenceDemoCode_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ConferenceDemoCode" */
export type ConferenceDemoCode_Arr_Rel_Insert_Input = {
    data: Array<ConferenceDemoCode_Insert_Input>;
    on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ConferenceDemoCode". All fields are combined with a logical 'AND'. */
export type ConferenceDemoCode_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ConferenceDemoCode_Bool_Exp>>>;
    _not?: Maybe<ConferenceDemoCode_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ConferenceDemoCode_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    note?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    usedBy?: Maybe<User_Bool_Exp>;
    usedById?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Constraint {
    /** unique or primary key constraint */
    ConferenceDemoCodesPkey = "ConferenceDemoCodes_pkey",
}

/** input type for inserting data into table "ConferenceDemoCode" */
export type ConferenceDemoCode_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    note?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    usedBy?: Maybe<User_Obj_Rel_Insert_Input>;
    usedById?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ConferenceDemoCode_Max_Fields = {
    __typename?: "ConferenceDemoCode_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    note?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    usedById?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    note?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    usedById?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ConferenceDemoCode_Min_Fields = {
    __typename?: "ConferenceDemoCode_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    note?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    usedById?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    note?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    usedById?: Maybe<Order_By>;
};

/** response of any mutation on the table "ConferenceDemoCode" */
export type ConferenceDemoCode_Mutation_Response = {
    __typename?: "ConferenceDemoCode_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ConferenceDemoCode>;
};

/** input type for inserting object relation for remote table "ConferenceDemoCode" */
export type ConferenceDemoCode_Obj_Rel_Insert_Input = {
    data: ConferenceDemoCode_Insert_Input;
    on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** on conflict condition type for table "ConferenceDemoCode" */
export type ConferenceDemoCode_On_Conflict = {
    constraint: ConferenceDemoCode_Constraint;
    update_columns: Array<ConferenceDemoCode_Update_Column>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** ordering options when selecting data from "ConferenceDemoCode" */
export type ConferenceDemoCode_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    note?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    usedBy?: Maybe<User_Order_By>;
    usedById?: Maybe<Order_By>;
};

/** primary key columns input for table: "ConferenceDemoCode" */
export type ConferenceDemoCode_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Note = "note",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UsedById = "usedById",
}

/** input type for updating data in table "ConferenceDemoCode" */
export type ConferenceDemoCode_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    note?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    usedById?: Maybe<Scalars["String"]>;
};

/** update columns of table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Note = "note",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UsedById = "usedById",
}

/** columns and relationships of "ConferencePrepareJob" */
export type ConferencePrepareJob = {
    __typename?: "ConferencePrepareJob";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    /** An object relationship */
    jobStatus: JobStatus;
    jobStatusName: JobStatus_Enum;
    message?: Maybe<Scalars["String"]>;
    updatedAt: Scalars["timestamptz"];
    /** An array relationship */
    videoRenderJobs: Array<VideoRenderJob>;
    /** An aggregated array relationship */
    videoRenderJobs_aggregate: VideoRenderJob_Aggregate;
};

/** columns and relationships of "ConferencePrepareJob" */
export type ConferencePrepareJobVideoRenderJobsArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** columns and relationships of "ConferencePrepareJob" */
export type ConferencePrepareJobVideoRenderJobs_AggregateArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** aggregated selection of "ConferencePrepareJob" */
export type ConferencePrepareJob_Aggregate = {
    __typename?: "ConferencePrepareJob_aggregate";
    aggregate?: Maybe<ConferencePrepareJob_Aggregate_Fields>;
    nodes: Array<ConferencePrepareJob>;
};

/** aggregate fields of "ConferencePrepareJob" */
export type ConferencePrepareJob_Aggregate_Fields = {
    __typename?: "ConferencePrepareJob_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ConferencePrepareJob_Max_Fields>;
    min?: Maybe<ConferencePrepareJob_Min_Fields>;
};

/** aggregate fields of "ConferencePrepareJob" */
export type ConferencePrepareJob_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ConferencePrepareJob_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ConferencePrepareJob" */
export type ConferencePrepareJob_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ConferencePrepareJob_Max_Order_By>;
    min?: Maybe<ConferencePrepareJob_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ConferencePrepareJob" */
export type ConferencePrepareJob_Arr_Rel_Insert_Input = {
    data: Array<ConferencePrepareJob_Insert_Input>;
    on_conflict?: Maybe<ConferencePrepareJob_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ConferencePrepareJob". All fields are combined with a logical 'AND'. */
export type ConferencePrepareJob_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ConferencePrepareJob_Bool_Exp>>>;
    _not?: Maybe<ConferencePrepareJob_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ConferencePrepareJob_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    jobStatus?: Maybe<JobStatus_Bool_Exp>;
    jobStatusName?: Maybe<JobStatus_Enum_Comparison_Exp>;
    message?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    videoRenderJobs?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** unique or primary key constraints on table "ConferencePrepareJob" */
export enum ConferencePrepareJob_Constraint {
    /** unique or primary key constraint */
    ConferencePrepareJobPkey = "ConferencePrepareJob_pkey",
}

/** input type for inserting data into table "ConferencePrepareJob" */
export type ConferencePrepareJob_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    jobStatus?: Maybe<JobStatus_Obj_Rel_Insert_Input>;
    jobStatusName?: Maybe<JobStatus_Enum>;
    message?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    videoRenderJobs?: Maybe<VideoRenderJob_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type ConferencePrepareJob_Max_Fields = {
    __typename?: "ConferencePrepareJob_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ConferencePrepareJob" */
export type ConferencePrepareJob_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ConferencePrepareJob_Min_Fields = {
    __typename?: "ConferencePrepareJob_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ConferencePrepareJob" */
export type ConferencePrepareJob_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ConferencePrepareJob" */
export type ConferencePrepareJob_Mutation_Response = {
    __typename?: "ConferencePrepareJob_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ConferencePrepareJob>;
};

/** input type for inserting object relation for remote table "ConferencePrepareJob" */
export type ConferencePrepareJob_Obj_Rel_Insert_Input = {
    data: ConferencePrepareJob_Insert_Input;
    on_conflict?: Maybe<ConferencePrepareJob_On_Conflict>;
};

/** on conflict condition type for table "ConferencePrepareJob" */
export type ConferencePrepareJob_On_Conflict = {
    constraint: ConferencePrepareJob_Constraint;
    update_columns: Array<ConferencePrepareJob_Update_Column>;
    where?: Maybe<ConferencePrepareJob_Bool_Exp>;
};

/** ordering options when selecting data from "ConferencePrepareJob" */
export type ConferencePrepareJob_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    jobStatus?: Maybe<JobStatus_Order_By>;
    jobStatusName?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    videoRenderJobs_aggregate?: Maybe<VideoRenderJob_Aggregate_Order_By>;
};

/** primary key columns input for table: "ConferencePrepareJob" */
export type ConferencePrepareJob_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ConferencePrepareJob" */
export enum ConferencePrepareJob_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    JobStatusName = "jobStatusName",
    /** column name */
    Message = "message",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "ConferencePrepareJob" */
export type ConferencePrepareJob_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    jobStatusName?: Maybe<JobStatus_Enum>;
    message?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "ConferencePrepareJob" */
export enum ConferencePrepareJob_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    JobStatusName = "jobStatusName",
    /** column name */
    Message = "message",
    /** column name */
    UpdatedAt = "updatedAt",
}

export type ConferencePrepareOutput = {
    __typename?: "ConferencePrepareOutput";
    message?: Maybe<Scalars["String"]>;
    success: Scalars["Boolean"];
};

/** aggregated selection of "Conference" */
export type Conference_Aggregate = {
    __typename?: "Conference_aggregate";
    aggregate?: Maybe<Conference_Aggregate_Fields>;
    nodes: Array<Conference>;
};

/** aggregate fields of "Conference" */
export type Conference_Aggregate_Fields = {
    __typename?: "Conference_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Conference_Max_Fields>;
    min?: Maybe<Conference_Min_Fields>;
};

/** aggregate fields of "Conference" */
export type Conference_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Conference_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Conference" */
export type Conference_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Conference_Max_Order_By>;
    min?: Maybe<Conference_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Conference" */
export type Conference_Arr_Rel_Insert_Input = {
    data: Array<Conference_Insert_Input>;
    on_conflict?: Maybe<Conference_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Conference". All fields are combined with a logical 'AND'. */
export type Conference_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Conference_Bool_Exp>>>;
    _not?: Maybe<Conference_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Conference_Bool_Exp>>>;
    attendees?: Maybe<Attendee_Bool_Exp>;
    configurations?: Maybe<ConferenceConfiguration_Bool_Exp>;
    contentGroups?: Maybe<ContentGroup_Bool_Exp>;
    contentPeople?: Maybe<ContentPerson_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    createdBy?: Maybe<String_Comparison_Exp>;
    creator?: Maybe<User_Bool_Exp>;
    demoCode?: Maybe<ConferenceDemoCode_Bool_Exp>;
    demoCodeId?: Maybe<Uuid_Comparison_Exp>;
    groups?: Maybe<Group_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingDatas?: Maybe<OriginatingData_Bool_Exp>;
    roles?: Maybe<Role_Bool_Exp>;
    rooms?: Maybe<Room_Bool_Exp>;
    shortName?: Maybe<String_Comparison_Exp>;
    slug?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Conference" */
export enum Conference_Constraint {
    /** unique or primary key constraint */
    ConferenceDemoCodeIdKey = "Conference_demoCodeId_key",
    /** unique or primary key constraint */
    ConferenceNameKey = "Conference_name_key",
    /** unique or primary key constraint */
    ConferencePkey = "Conference_pkey",
    /** unique or primary key constraint */
    ConferenceShortNameKey = "Conference_shortName_key",
    /** unique or primary key constraint */
    ConferenceSlugKey = "Conference_slug_key",
}

/** input type for inserting data into table "Conference" */
export type Conference_Insert_Input = {
    attendees?: Maybe<Attendee_Arr_Rel_Insert_Input>;
    configurations?: Maybe<ConferenceConfiguration_Arr_Rel_Insert_Input>;
    contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
    contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    createdBy?: Maybe<Scalars["String"]>;
    creator?: Maybe<User_Obj_Rel_Insert_Input>;
    demoCode?: Maybe<ConferenceDemoCode_Obj_Rel_Insert_Input>;
    demoCodeId?: Maybe<Scalars["uuid"]>;
    groups?: Maybe<Group_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDatas?: Maybe<OriginatingData_Arr_Rel_Insert_Input>;
    roles?: Maybe<Role_Arr_Rel_Insert_Input>;
    rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
    shortName?: Maybe<Scalars["String"]>;
    slug?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Conference_Max_Fields = {
    __typename?: "Conference_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    createdBy?: Maybe<Scalars["String"]>;
    demoCodeId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    shortName?: Maybe<Scalars["String"]>;
    slug?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Conference" */
export type Conference_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    createdBy?: Maybe<Order_By>;
    demoCodeId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    shortName?: Maybe<Order_By>;
    slug?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Conference_Min_Fields = {
    __typename?: "Conference_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    createdBy?: Maybe<Scalars["String"]>;
    demoCodeId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    shortName?: Maybe<Scalars["String"]>;
    slug?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Conference" */
export type Conference_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    createdBy?: Maybe<Order_By>;
    demoCodeId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    shortName?: Maybe<Order_By>;
    slug?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Conference" */
export type Conference_Mutation_Response = {
    __typename?: "Conference_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Conference>;
};

/** input type for inserting object relation for remote table "Conference" */
export type Conference_Obj_Rel_Insert_Input = {
    data: Conference_Insert_Input;
    on_conflict?: Maybe<Conference_On_Conflict>;
};

/** on conflict condition type for table "Conference" */
export type Conference_On_Conflict = {
    constraint: Conference_Constraint;
    update_columns: Array<Conference_Update_Column>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** ordering options when selecting data from "Conference" */
export type Conference_Order_By = {
    attendees_aggregate?: Maybe<Attendee_Aggregate_Order_By>;
    configurations_aggregate?: Maybe<ConferenceConfiguration_Aggregate_Order_By>;
    contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
    contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    createdBy?: Maybe<Order_By>;
    creator?: Maybe<User_Order_By>;
    demoCode?: Maybe<ConferenceDemoCode_Order_By>;
    demoCodeId?: Maybe<Order_By>;
    groups_aggregate?: Maybe<Group_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDatas_aggregate?: Maybe<OriginatingData_Aggregate_Order_By>;
    roles_aggregate?: Maybe<Role_Aggregate_Order_By>;
    rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
    shortName?: Maybe<Order_By>;
    slug?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Conference" */
export type Conference_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Conference" */
export enum Conference_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    CreatedBy = "createdBy",
    /** column name */
    DemoCodeId = "demoCodeId",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    ShortName = "shortName",
    /** column name */
    Slug = "slug",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Conference" */
export type Conference_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    createdBy?: Maybe<Scalars["String"]>;
    demoCodeId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    shortName?: Maybe<Scalars["String"]>;
    slug?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Conference" */
export enum Conference_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    CreatedBy = "createdBy",
    /** column name */
    DemoCodeId = "demoCodeId",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    ShortName = "shortName",
    /** column name */
    Slug = "slug",
    /** column name */
    UpdatedAt = "updatedAt",
}

export type ConfirmInvitationInput = {
    confirmationCode: Scalars["String"];
    inviteCode: Scalars["uuid"];
};

export type ConfirmInvitationOutput = {
    __typename?: "ConfirmInvitationOutput";
    confSlug?: Maybe<Scalars["String"]>;
    ok: Scalars["Boolean"];
};

/** columns and relationships of "ContentGroup" */
export type ContentGroup = {
    __typename?: "ContentGroup";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An array relationship */
    contentGroupTags: Array<ContentGroupTag>;
    /** An aggregated array relationship */
    contentGroupTags_aggregate: ContentGroupTag_Aggregate;
    /** An object relationship */
    contentGroupType: ContentGroupType;
    contentGroupTypeName: ContentGroupType_Enum;
    /** An array relationship */
    contentItems: Array<ContentItem>;
    /** An aggregated array relationship */
    contentItems_aggregate: ContentItem_Aggregate;
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    events: Array<Event>;
    /** An aggregated array relationship */
    events_aggregate: Event_Aggregate;
    id: Scalars["uuid"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    /** An array relationship */
    people: Array<ContentGroupPerson>;
    /** An aggregated array relationship */
    people_aggregate: ContentGroupPerson_Aggregate;
    /** An array relationship */
    requiredContentItems: Array<RequiredContentItem>;
    /** An aggregated array relationship */
    requiredContentItems_aggregate: RequiredContentItem_Aggregate;
    shortTitle?: Maybe<Scalars["String"]>;
    title: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupContentGroupTagsArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupContentGroupTags_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupContentItemsArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupEventsArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupEvents_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupPeopleArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupRequiredContentItemsArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentGroup" */
export type ContentGroupRequiredContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentGroupPerson" */
export type ContentGroupPerson = {
    __typename?: "ContentGroupPerson";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    group: ContentGroup;
    groupId: Scalars["uuid"];
    id: Scalars["uuid"];
    /** An object relationship */
    person: ContentPerson;
    personId: Scalars["uuid"];
    priority?: Maybe<Scalars["Int"]>;
    roleName: Scalars["String"];
};

/** aggregated selection of "ContentGroupPerson" */
export type ContentGroupPerson_Aggregate = {
    __typename?: "ContentGroupPerson_aggregate";
    aggregate?: Maybe<ContentGroupPerson_Aggregate_Fields>;
    nodes: Array<ContentGroupPerson>;
};

/** aggregate fields of "ContentGroupPerson" */
export type ContentGroupPerson_Aggregate_Fields = {
    __typename?: "ContentGroupPerson_aggregate_fields";
    avg?: Maybe<ContentGroupPerson_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentGroupPerson_Max_Fields>;
    min?: Maybe<ContentGroupPerson_Min_Fields>;
    stddev?: Maybe<ContentGroupPerson_Stddev_Fields>;
    stddev_pop?: Maybe<ContentGroupPerson_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<ContentGroupPerson_Stddev_Samp_Fields>;
    sum?: Maybe<ContentGroupPerson_Sum_Fields>;
    var_pop?: Maybe<ContentGroupPerson_Var_Pop_Fields>;
    var_samp?: Maybe<ContentGroupPerson_Var_Samp_Fields>;
    variance?: Maybe<ContentGroupPerson_Variance_Fields>;
};

/** aggregate fields of "ContentGroupPerson" */
export type ContentGroupPerson_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentGroupPerson" */
export type ContentGroupPerson_Aggregate_Order_By = {
    avg?: Maybe<ContentGroupPerson_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<ContentGroupPerson_Max_Order_By>;
    min?: Maybe<ContentGroupPerson_Min_Order_By>;
    stddev?: Maybe<ContentGroupPerson_Stddev_Order_By>;
    stddev_pop?: Maybe<ContentGroupPerson_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<ContentGroupPerson_Stddev_Samp_Order_By>;
    sum?: Maybe<ContentGroupPerson_Sum_Order_By>;
    var_pop?: Maybe<ContentGroupPerson_Var_Pop_Order_By>;
    var_samp?: Maybe<ContentGroupPerson_Var_Samp_Order_By>;
    variance?: Maybe<ContentGroupPerson_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroupPerson" */
export type ContentGroupPerson_Arr_Rel_Insert_Input = {
    data: Array<ContentGroupPerson_Insert_Input>;
    on_conflict?: Maybe<ContentGroupPerson_On_Conflict>;
};

/** aggregate avg on columns */
export type ContentGroupPerson_Avg_Fields = {
    __typename?: "ContentGroupPerson_avg_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Avg_Order_By = {
    priority?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ContentGroupPerson". All fields are combined with a logical 'AND'. */
export type ContentGroupPerson_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentGroupPerson_Bool_Exp>>>;
    _not?: Maybe<ContentGroupPerson_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentGroupPerson_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    group?: Maybe<ContentGroup_Bool_Exp>;
    groupId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    person?: Maybe<ContentPerson_Bool_Exp>;
    personId?: Maybe<Uuid_Comparison_Exp>;
    priority?: Maybe<Int_Comparison_Exp>;
    roleName?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroupPerson" */
export enum ContentGroupPerson_Constraint {
    /** unique or primary key constraint */
    ContentItemPersonPkey = "ContentItemPerson_pkey",
    /** unique or primary key constraint */
    ContentItemPersonRoleNamePersonIdGroupIdKey = "ContentItemPerson_roleName_personId_groupId_key",
}

/** input type for incrementing integer column in table "ContentGroupPerson" */
export type ContentGroupPerson_Inc_Input = {
    priority?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "ContentGroupPerson" */
export type ContentGroupPerson_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    group?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    person?: Maybe<ContentPerson_Obj_Rel_Insert_Input>;
    personId?: Maybe<Scalars["uuid"]>;
    priority?: Maybe<Scalars["Int"]>;
    roleName?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ContentGroupPerson_Max_Fields = {
    __typename?: "ContentGroupPerson_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    personId?: Maybe<Scalars["uuid"]>;
    priority?: Maybe<Scalars["Int"]>;
    roleName?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    personId?: Maybe<Order_By>;
    priority?: Maybe<Order_By>;
    roleName?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroupPerson_Min_Fields = {
    __typename?: "ContentGroupPerson_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    personId?: Maybe<Scalars["uuid"]>;
    priority?: Maybe<Scalars["Int"]>;
    roleName?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    personId?: Maybe<Order_By>;
    priority?: Maybe<Order_By>;
    roleName?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroupPerson" */
export type ContentGroupPerson_Mutation_Response = {
    __typename?: "ContentGroupPerson_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentGroupPerson>;
};

/** input type for inserting object relation for remote table "ContentGroupPerson" */
export type ContentGroupPerson_Obj_Rel_Insert_Input = {
    data: ContentGroupPerson_Insert_Input;
    on_conflict?: Maybe<ContentGroupPerson_On_Conflict>;
};

/** on conflict condition type for table "ContentGroupPerson" */
export type ContentGroupPerson_On_Conflict = {
    constraint: ContentGroupPerson_Constraint;
    update_columns: Array<ContentGroupPerson_Update_Column>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroupPerson" */
export type ContentGroupPerson_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    group?: Maybe<ContentGroup_Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    person?: Maybe<ContentPerson_Order_By>;
    personId?: Maybe<Order_By>;
    priority?: Maybe<Order_By>;
    roleName?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroupPerson" */
export type ContentGroupPerson_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ContentGroupPerson" */
export enum ContentGroupPerson_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    PersonId = "personId",
    /** column name */
    Priority = "priority",
    /** column name */
    RoleName = "roleName",
}

/** input type for updating data in table "ContentGroupPerson" */
export type ContentGroupPerson_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    personId?: Maybe<Scalars["uuid"]>;
    priority?: Maybe<Scalars["Int"]>;
    roleName?: Maybe<Scalars["String"]>;
};

/** aggregate stddev on columns */
export type ContentGroupPerson_Stddev_Fields = {
    __typename?: "ContentGroupPerson_stddev_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Stddev_Order_By = {
    priority?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ContentGroupPerson_Stddev_Pop_Fields = {
    __typename?: "ContentGroupPerson_stddev_pop_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Stddev_Pop_Order_By = {
    priority?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ContentGroupPerson_Stddev_Samp_Fields = {
    __typename?: "ContentGroupPerson_stddev_samp_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Stddev_Samp_Order_By = {
    priority?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ContentGroupPerson_Sum_Fields = {
    __typename?: "ContentGroupPerson_sum_fields";
    priority?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Sum_Order_By = {
    priority?: Maybe<Order_By>;
};

/** update columns of table "ContentGroupPerson" */
export enum ContentGroupPerson_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    PersonId = "personId",
    /** column name */
    Priority = "priority",
    /** column name */
    RoleName = "roleName",
}

/** aggregate var_pop on columns */
export type ContentGroupPerson_Var_Pop_Fields = {
    __typename?: "ContentGroupPerson_var_pop_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Var_Pop_Order_By = {
    priority?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ContentGroupPerson_Var_Samp_Fields = {
    __typename?: "ContentGroupPerson_var_samp_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Var_Samp_Order_By = {
    priority?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ContentGroupPerson_Variance_Fields = {
    __typename?: "ContentGroupPerson_variance_fields";
    priority?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "ContentGroupPerson" */
export type ContentGroupPerson_Variance_Order_By = {
    priority?: Maybe<Order_By>;
};

/** columns and relationships of "ContentGroupTag" */
export type ContentGroupTag = {
    __typename?: "ContentGroupTag";
    /** An object relationship */
    contentGroup: ContentGroup;
    contentGroupId: Scalars["uuid"];
    id: Scalars["uuid"];
    /** An object relationship */
    tag: Tag;
    tagId: Scalars["uuid"];
};

/** aggregated selection of "ContentGroupTag" */
export type ContentGroupTag_Aggregate = {
    __typename?: "ContentGroupTag_aggregate";
    aggregate?: Maybe<ContentGroupTag_Aggregate_Fields>;
    nodes: Array<ContentGroupTag>;
};

/** aggregate fields of "ContentGroupTag" */
export type ContentGroupTag_Aggregate_Fields = {
    __typename?: "ContentGroupTag_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentGroupTag_Max_Fields>;
    min?: Maybe<ContentGroupTag_Min_Fields>;
};

/** aggregate fields of "ContentGroupTag" */
export type ContentGroupTag_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentGroupTag_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentGroupTag" */
export type ContentGroupTag_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentGroupTag_Max_Order_By>;
    min?: Maybe<ContentGroupTag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroupTag" */
export type ContentGroupTag_Arr_Rel_Insert_Input = {
    data: Array<ContentGroupTag_Insert_Input>;
    on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroupTag". All fields are combined with a logical 'AND'. */
export type ContentGroupTag_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentGroupTag_Bool_Exp>>>;
    _not?: Maybe<ContentGroupTag_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentGroupTag_Bool_Exp>>>;
    contentGroup?: Maybe<ContentGroup_Bool_Exp>;
    contentGroupId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    tag?: Maybe<Tag_Bool_Exp>;
    tagId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroupTag" */
export enum ContentGroupTag_Constraint {
    /** unique or primary key constraint */
    ContentGroupTagContentGroupIdTagIdKey = "ContentGroupTag_contentGroupId_tagId_key",
    /** unique or primary key constraint */
    ContentGroupTagPkey = "ContentGroupTag_pkey",
}

/** input type for inserting data into table "ContentGroupTag" */
export type ContentGroupTag_Insert_Input = {
    contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tag?: Maybe<Tag_Obj_Rel_Insert_Input>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type ContentGroupTag_Max_Fields = {
    __typename?: "ContentGroupTag_max_fields";
    contentGroupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "ContentGroupTag" */
export type ContentGroupTag_Max_Order_By = {
    contentGroupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tagId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroupTag_Min_Fields = {
    __typename?: "ContentGroupTag_min_fields";
    contentGroupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "ContentGroupTag" */
export type ContentGroupTag_Min_Order_By = {
    contentGroupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tagId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroupTag" */
export type ContentGroupTag_Mutation_Response = {
    __typename?: "ContentGroupTag_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentGroupTag>;
};

/** input type for inserting object relation for remote table "ContentGroupTag" */
export type ContentGroupTag_Obj_Rel_Insert_Input = {
    data: ContentGroupTag_Insert_Input;
    on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** on conflict condition type for table "ContentGroupTag" */
export type ContentGroupTag_On_Conflict = {
    constraint: ContentGroupTag_Constraint;
    update_columns: Array<ContentGroupTag_Update_Column>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroupTag" */
export type ContentGroupTag_Order_By = {
    contentGroup?: Maybe<ContentGroup_Order_By>;
    contentGroupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tag?: Maybe<Tag_Order_By>;
    tagId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroupTag" */
export type ContentGroupTag_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ContentGroupTag" */
export enum ContentGroupTag_Select_Column {
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    Id = "id",
    /** column name */
    TagId = "tagId",
}

/** input type for updating data in table "ContentGroupTag" */
export type ContentGroupTag_Set_Input = {
    contentGroupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "ContentGroupTag" */
export enum ContentGroupTag_Update_Column {
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    Id = "id",
    /** column name */
    TagId = "tagId",
}

/** columns and relationships of "ContentGroupType" */
export type ContentGroupType = {
    __typename?: "ContentGroupType";
    /** An array relationship */
    contentGroups: Array<ContentGroup>;
    /** An aggregated array relationship */
    contentGroups_aggregate: ContentGroup_Aggregate;
    description: Scalars["String"];
    name: Scalars["String"];
};

/** columns and relationships of "ContentGroupType" */
export type ContentGroupTypeContentGroupsArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** columns and relationships of "ContentGroupType" */
export type ContentGroupTypeContentGroups_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** aggregated selection of "ContentGroupType" */
export type ContentGroupType_Aggregate = {
    __typename?: "ContentGroupType_aggregate";
    aggregate?: Maybe<ContentGroupType_Aggregate_Fields>;
    nodes: Array<ContentGroupType>;
};

/** aggregate fields of "ContentGroupType" */
export type ContentGroupType_Aggregate_Fields = {
    __typename?: "ContentGroupType_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentGroupType_Max_Fields>;
    min?: Maybe<ContentGroupType_Min_Fields>;
};

/** aggregate fields of "ContentGroupType" */
export type ContentGroupType_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentGroupType_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentGroupType" */
export type ContentGroupType_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentGroupType_Max_Order_By>;
    min?: Maybe<ContentGroupType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroupType" */
export type ContentGroupType_Arr_Rel_Insert_Input = {
    data: Array<ContentGroupType_Insert_Input>;
    on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroupType". All fields are combined with a logical 'AND'. */
export type ContentGroupType_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentGroupType_Bool_Exp>>>;
    _not?: Maybe<ContentGroupType_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentGroupType_Bool_Exp>>>;
    contentGroups?: Maybe<ContentGroup_Bool_Exp>;
    description?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroupType" */
export enum ContentGroupType_Constraint {
    /** unique or primary key constraint */
    ContentGroupTypePkey = "ContentGroupType_pkey",
}

export enum ContentGroupType_Enum {
    /** A keynote. */
    Keynote = "KEYNOTE",
    /** A generic group type - use sparingly. */
    Other = "OTHER",
    /** A paper. */
    Paper = "PAPER",
    /** A poster. */
    Poster = "POSTER",
    /** A sponsor. */
    Sponsor = "SPONSOR",
    /** A symposium. */
    Symposium = "SYMPOSIUM",
    /** A workshop. */
    Workshop = "WORKSHOP",
}

/** expression to compare columns of type ContentGroupType_enum. All fields are combined with logical 'AND'. */
export type ContentGroupType_Enum_Comparison_Exp = {
    _eq?: Maybe<ContentGroupType_Enum>;
    _in?: Maybe<Array<ContentGroupType_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<ContentGroupType_Enum>;
    _nin?: Maybe<Array<ContentGroupType_Enum>>;
};

/** input type for inserting data into table "ContentGroupType" */
export type ContentGroupType_Insert_Input = {
    contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type ContentGroupType_Max_Fields = {
    __typename?: "ContentGroupType_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ContentGroupType" */
export type ContentGroupType_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroupType_Min_Fields = {
    __typename?: "ContentGroupType_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ContentGroupType" */
export type ContentGroupType_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroupType" */
export type ContentGroupType_Mutation_Response = {
    __typename?: "ContentGroupType_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentGroupType>;
};

/** input type for inserting object relation for remote table "ContentGroupType" */
export type ContentGroupType_Obj_Rel_Insert_Input = {
    data: ContentGroupType_Insert_Input;
    on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** on conflict condition type for table "ContentGroupType" */
export type ContentGroupType_On_Conflict = {
    constraint: ContentGroupType_Constraint;
    update_columns: Array<ContentGroupType_Update_Column>;
    where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroupType" */
export type ContentGroupType_Order_By = {
    contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroupType" */
export type ContentGroupType_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "ContentGroupType" */
export enum ContentGroupType_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "ContentGroupType" */
export type ContentGroupType_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "ContentGroupType" */
export enum ContentGroupType_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** aggregated selection of "ContentGroup" */
export type ContentGroup_Aggregate = {
    __typename?: "ContentGroup_aggregate";
    aggregate?: Maybe<ContentGroup_Aggregate_Fields>;
    nodes: Array<ContentGroup>;
};

/** aggregate fields of "ContentGroup" */
export type ContentGroup_Aggregate_Fields = {
    __typename?: "ContentGroup_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentGroup_Max_Fields>;
    min?: Maybe<ContentGroup_Min_Fields>;
};

/** aggregate fields of "ContentGroup" */
export type ContentGroup_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentGroup_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentGroup" */
export type ContentGroup_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentGroup_Max_Order_By>;
    min?: Maybe<ContentGroup_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroup" */
export type ContentGroup_Arr_Rel_Insert_Input = {
    data: Array<ContentGroup_Insert_Input>;
    on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroup". All fields are combined with a logical 'AND'. */
export type ContentGroup_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentGroup_Bool_Exp>>>;
    _not?: Maybe<ContentGroup_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentGroup_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroupTags?: Maybe<ContentGroupTag_Bool_Exp>;
    contentGroupType?: Maybe<ContentGroupType_Bool_Exp>;
    contentGroupTypeName?: Maybe<ContentGroupType_Enum_Comparison_Exp>;
    contentItems?: Maybe<ContentItem_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    events?: Maybe<Event_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    people?: Maybe<ContentGroupPerson_Bool_Exp>;
    requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
    shortTitle?: Maybe<String_Comparison_Exp>;
    title?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroup" */
export enum ContentGroup_Constraint {
    /** unique or primary key constraint */
    ContentGroupPkey = "ContentGroup_pkey",
}

/** input type for inserting data into table "ContentGroup" */
export type ContentGroup_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupTags?: Maybe<ContentGroupTag_Arr_Rel_Insert_Input>;
    contentGroupType?: Maybe<ContentGroupType_Obj_Rel_Insert_Input>;
    contentGroupTypeName?: Maybe<ContentGroupType_Enum>;
    contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    events?: Maybe<Event_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    people?: Maybe<ContentGroupPerson_Arr_Rel_Insert_Input>;
    requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
    shortTitle?: Maybe<Scalars["String"]>;
    title?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type ContentGroup_Max_Fields = {
    __typename?: "ContentGroup_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    shortTitle?: Maybe<Scalars["String"]>;
    title?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ContentGroup" */
export type ContentGroup_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    shortTitle?: Maybe<Order_By>;
    title?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroup_Min_Fields = {
    __typename?: "ContentGroup_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    shortTitle?: Maybe<Scalars["String"]>;
    title?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ContentGroup" */
export type ContentGroup_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    shortTitle?: Maybe<Order_By>;
    title?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroup" */
export type ContentGroup_Mutation_Response = {
    __typename?: "ContentGroup_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentGroup>;
};

/** input type for inserting object relation for remote table "ContentGroup" */
export type ContentGroup_Obj_Rel_Insert_Input = {
    data: ContentGroup_Insert_Input;
    on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** on conflict condition type for table "ContentGroup" */
export type ContentGroup_On_Conflict = {
    constraint: ContentGroup_Constraint;
    update_columns: Array<ContentGroup_Update_Column>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroup" */
export type ContentGroup_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroupTags_aggregate?: Maybe<ContentGroupTag_Aggregate_Order_By>;
    contentGroupType?: Maybe<ContentGroupType_Order_By>;
    contentGroupTypeName?: Maybe<Order_By>;
    contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    events_aggregate?: Maybe<Event_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    people_aggregate?: Maybe<ContentGroupPerson_Aggregate_Order_By>;
    requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
    shortTitle?: Maybe<Order_By>;
    title?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroup" */
export type ContentGroup_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ContentGroup" */
export enum ContentGroup_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupTypeName = "contentGroupTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    ShortTitle = "shortTitle",
    /** column name */
    Title = "title",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "ContentGroup" */
export type ContentGroup_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupTypeName?: Maybe<ContentGroupType_Enum>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    shortTitle?: Maybe<Scalars["String"]>;
    title?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "ContentGroup" */
export enum ContentGroup_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupTypeName = "contentGroupTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    ShortTitle = "shortTitle",
    /** column name */
    Title = "title",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "ContentItem" */
export type ContentItem = {
    __typename?: "ContentItem";
    /** An object relationship */
    broadcastContentItem?: Maybe<BroadcastContentItem>;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    contentGroup: ContentGroup;
    contentGroupId: Scalars["uuid"];
    /** An object relationship */
    contentType: ContentType;
    contentTypeName: ContentType_Enum;
    createdAt: Scalars["timestamptz"];
    data: Scalars["jsonb"];
    id: Scalars["uuid"];
    isHidden: Scalars["Boolean"];
    layoutData?: Maybe<Scalars["jsonb"]>;
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    requiredContentId?: Maybe<Scalars["uuid"]>;
    /** An object relationship */
    requiredContentItem?: Maybe<RequiredContentItem>;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "ContentItem" */
export type ContentItemDataArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "ContentItem" */
export type ContentItemLayoutDataArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "ContentItem" */
export type ContentItem_Aggregate = {
    __typename?: "ContentItem_aggregate";
    aggregate?: Maybe<ContentItem_Aggregate_Fields>;
    nodes: Array<ContentItem>;
};

/** aggregate fields of "ContentItem" */
export type ContentItem_Aggregate_Fields = {
    __typename?: "ContentItem_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentItem_Max_Fields>;
    min?: Maybe<ContentItem_Min_Fields>;
};

/** aggregate fields of "ContentItem" */
export type ContentItem_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentItem_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentItem" */
export type ContentItem_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentItem_Max_Order_By>;
    min?: Maybe<ContentItem_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ContentItem_Append_Input = {
    data?: Maybe<Scalars["jsonb"]>;
    layoutData?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "ContentItem" */
export type ContentItem_Arr_Rel_Insert_Input = {
    data: Array<ContentItem_Insert_Input>;
    on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentItem". All fields are combined with a logical 'AND'. */
export type ContentItem_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentItem_Bool_Exp>>>;
    _not?: Maybe<ContentItem_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentItem_Bool_Exp>>>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroup?: Maybe<ContentGroup_Bool_Exp>;
    contentGroupId?: Maybe<Uuid_Comparison_Exp>;
    contentType?: Maybe<ContentType_Bool_Exp>;
    contentTypeName?: Maybe<ContentType_Enum_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    data?: Maybe<Jsonb_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    isHidden?: Maybe<Boolean_Comparison_Exp>;
    layoutData?: Maybe<Jsonb_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    requiredContentId?: Maybe<Uuid_Comparison_Exp>;
    requiredContentItem?: Maybe<RequiredContentItem_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentItem" */
export enum ContentItem_Constraint {
    /** unique or primary key constraint */
    ContentItemPkey = "ContentItem_pkey",
    /** unique or primary key constraint */
    ContentItemRequiredContentIdKey = "ContentItem_requiredContentId_key",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ContentItem_Delete_At_Path_Input = {
    data?: Maybe<Array<Maybe<Scalars["String"]>>>;
    layoutData?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ContentItem_Delete_Elem_Input = {
    data?: Maybe<Scalars["Int"]>;
    layoutData?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ContentItem_Delete_Key_Input = {
    data?: Maybe<Scalars["String"]>;
    layoutData?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "ContentItem" */
export type ContentItem_Insert_Input = {
    broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    contentType?: Maybe<ContentType_Obj_Rel_Insert_Input>;
    contentTypeName?: Maybe<ContentType_Enum>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    id?: Maybe<Scalars["uuid"]>;
    isHidden?: Maybe<Scalars["Boolean"]>;
    layoutData?: Maybe<Scalars["jsonb"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    requiredContentId?: Maybe<Scalars["uuid"]>;
    requiredContentItem?: Maybe<RequiredContentItem_Obj_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type ContentItem_Max_Fields = {
    __typename?: "ContentItem_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    requiredContentId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ContentItem" */
export type ContentItem_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    requiredContentId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentItem_Min_Fields = {
    __typename?: "ContentItem_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    requiredContentId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ContentItem" */
export type ContentItem_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    requiredContentId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentItem" */
export type ContentItem_Mutation_Response = {
    __typename?: "ContentItem_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentItem>;
};

/** input type for inserting object relation for remote table "ContentItem" */
export type ContentItem_Obj_Rel_Insert_Input = {
    data: ContentItem_Insert_Input;
    on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** on conflict condition type for table "ContentItem" */
export type ContentItem_On_Conflict = {
    constraint: ContentItem_Constraint;
    update_columns: Array<ContentItem_Update_Column>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "ContentItem" */
export type ContentItem_Order_By = {
    broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroup?: Maybe<ContentGroup_Order_By>;
    contentGroupId?: Maybe<Order_By>;
    contentType?: Maybe<ContentType_Order_By>;
    contentTypeName?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    data?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    isHidden?: Maybe<Order_By>;
    layoutData?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    requiredContentId?: Maybe<Order_By>;
    requiredContentItem?: Maybe<RequiredContentItem_Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentItem" */
export type ContentItem_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ContentItem_Prepend_Input = {
    data?: Maybe<Scalars["jsonb"]>;
    layoutData?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "ContentItem" */
export enum ContentItem_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    ContentTypeName = "contentTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    IsHidden = "isHidden",
    /** column name */
    LayoutData = "layoutData",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RequiredContentId = "requiredContentId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "ContentItem" */
export type ContentItem_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    contentTypeName?: Maybe<ContentType_Enum>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    id?: Maybe<Scalars["uuid"]>;
    isHidden?: Maybe<Scalars["Boolean"]>;
    layoutData?: Maybe<Scalars["jsonb"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    requiredContentId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "ContentItem" */
export enum ContentItem_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    ContentTypeName = "contentTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    IsHidden = "isHidden",
    /** column name */
    LayoutData = "layoutData",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RequiredContentId = "requiredContentId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "ContentPerson" */
export type ContentPerson = {
    __typename?: "ContentPerson";
    affiliation?: Maybe<Scalars["String"]>;
    /** An object relationship */
    attendee?: Maybe<Attendee>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An array relationship */
    contentItemPeople: Array<ContentGroupPerson>;
    /** An aggregated array relationship */
    contentItemPeople_aggregate: ContentGroupPerson_Aggregate;
    email?: Maybe<Scalars["String"]>;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** columns and relationships of "ContentPerson" */
export type ContentPersonContentItemPeopleArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** columns and relationships of "ContentPerson" */
export type ContentPersonContentItemPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** aggregated selection of "ContentPerson" */
export type ContentPerson_Aggregate = {
    __typename?: "ContentPerson_aggregate";
    aggregate?: Maybe<ContentPerson_Aggregate_Fields>;
    nodes: Array<ContentPerson>;
};

/** aggregate fields of "ContentPerson" */
export type ContentPerson_Aggregate_Fields = {
    __typename?: "ContentPerson_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentPerson_Max_Fields>;
    min?: Maybe<ContentPerson_Min_Fields>;
};

/** aggregate fields of "ContentPerson" */
export type ContentPerson_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentPerson_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentPerson" */
export type ContentPerson_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentPerson_Max_Order_By>;
    min?: Maybe<ContentPerson_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentPerson" */
export type ContentPerson_Arr_Rel_Insert_Input = {
    data: Array<ContentPerson_Insert_Input>;
    on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentPerson". All fields are combined with a logical 'AND'. */
export type ContentPerson_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentPerson_Bool_Exp>>>;
    _not?: Maybe<ContentPerson_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentPerson_Bool_Exp>>>;
    affiliation?: Maybe<String_Comparison_Exp>;
    attendee?: Maybe<Attendee_Bool_Exp>;
    attendeeId?: Maybe<Uuid_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentItemPeople?: Maybe<ContentGroupPerson_Bool_Exp>;
    email?: Maybe<String_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentPerson" */
export enum ContentPerson_Constraint {
    /** unique or primary key constraint */
    ContentPersonConferenceIdNameAffiliationKey = "ContentPerson_conferenceId_name_affiliation_key",
    /** unique or primary key constraint */
    ContentPersonPkey = "ContentPerson_pkey",
}

/** input type for inserting data into table "ContentPerson" */
export type ContentPerson_Insert_Input = {
    affiliation?: Maybe<Scalars["String"]>;
    attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentItemPeople?: Maybe<ContentGroupPerson_Arr_Rel_Insert_Input>;
    email?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type ContentPerson_Max_Fields = {
    __typename?: "ContentPerson_max_fields";
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    email?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "ContentPerson" */
export type ContentPerson_Max_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentPerson_Min_Fields = {
    __typename?: "ContentPerson_min_fields";
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    email?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "ContentPerson" */
export type ContentPerson_Min_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentPerson" */
export type ContentPerson_Mutation_Response = {
    __typename?: "ContentPerson_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentPerson>;
};

/** input type for inserting object relation for remote table "ContentPerson" */
export type ContentPerson_Obj_Rel_Insert_Input = {
    data: ContentPerson_Insert_Input;
    on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** on conflict condition type for table "ContentPerson" */
export type ContentPerson_On_Conflict = {
    constraint: ContentPerson_Constraint;
    update_columns: Array<ContentPerson_Update_Column>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** ordering options when selecting data from "ContentPerson" */
export type ContentPerson_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendee?: Maybe<Attendee_Order_By>;
    attendeeId?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentItemPeople_aggregate?: Maybe<ContentGroupPerson_Aggregate_Order_By>;
    email?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentPerson" */
export type ContentPerson_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ContentPerson" */
export enum ContentPerson_Select_Column {
    /** column name */
    Affiliation = "affiliation",
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    Email = "email",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
}

/** input type for updating data in table "ContentPerson" */
export type ContentPerson_Set_Input = {
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    email?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "ContentPerson" */
export enum ContentPerson_Update_Column {
    /** column name */
    Affiliation = "affiliation",
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    Email = "email",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
}

/** columns and relationships of "ContentType" */
export type ContentType = {
    __typename?: "ContentType";
    /** An array relationship */
    contentItems: Array<ContentItem>;
    /** An aggregated array relationship */
    contentItems_aggregate: ContentItem_Aggregate;
    description: Scalars["String"];
    name: Scalars["String"];
    /** An array relationship */
    requiredContentItems: Array<RequiredContentItem>;
    /** An aggregated array relationship */
    requiredContentItems_aggregate: RequiredContentItem_Aggregate;
};

/** columns and relationships of "ContentType" */
export type ContentTypeContentItemsArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentType" */
export type ContentTypeContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentType" */
export type ContentTypeRequiredContentItemsArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentType" */
export type ContentTypeRequiredContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** aggregated selection of "ContentType" */
export type ContentType_Aggregate = {
    __typename?: "ContentType_aggregate";
    aggregate?: Maybe<ContentType_Aggregate_Fields>;
    nodes: Array<ContentType>;
};

/** aggregate fields of "ContentType" */
export type ContentType_Aggregate_Fields = {
    __typename?: "ContentType_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ContentType_Max_Fields>;
    min?: Maybe<ContentType_Min_Fields>;
};

/** aggregate fields of "ContentType" */
export type ContentType_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ContentType_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ContentType" */
export type ContentType_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ContentType_Max_Order_By>;
    min?: Maybe<ContentType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentType" */
export type ContentType_Arr_Rel_Insert_Input = {
    data: Array<ContentType_Insert_Input>;
    on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentType". All fields are combined with a logical 'AND'. */
export type ContentType_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ContentType_Bool_Exp>>>;
    _not?: Maybe<ContentType_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ContentType_Bool_Exp>>>;
    contentItems?: Maybe<ContentItem_Bool_Exp>;
    description?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** unique or primary key constraints on table "ContentType" */
export enum ContentType_Constraint {
    /** unique or primary key constraint */
    ContentTypePkey = "ContentType_pkey",
}

export enum ContentType_Enum {
    /** Abstract Markdown text. */
    Abstract = "ABSTRACT",
    /** File for an image (stored by Clowdr). */
    ImageFile = "IMAGE_FILE",
    /** URL to an image (embedded in Clowdr UI). */
    ImageUrl = "IMAGE_URL",
    /** A generic URL. */
    Link = "LINK",
    /** A URL for a link button. */
    LinkButton = "LINK_BUTTON",
    /** File for a paper (stored by Clowdr). */
    PaperFile = "PAPER_FILE",
    /** Link for a paper (preview is not embedded in Clowdr UI). */
    PaperLink = "PAPER_LINK",
    /** URL to a paper (preview may be embedded in Clowdr UI e.g. PDF JS viewer). */
    PaperUrl = "PAPER_URL",
    /** File for a poster image (stored by Clowdr). */
    PosterFile = "POSTER_FILE",
    /** URL to a poster image (embedded in Clowdr UI). */
    PosterUrl = "POSTER_URL",
    /** General-purpose Markdown text. */
    Text = "TEXT",
    /** Video file to be broadcast. */
    VideoBroadcast = "VIDEO_BROADCAST",
    /** Video file for counting down to a transition in a broadcast. */
    VideoCountdown = "VIDEO_COUNTDOWN",
    /** File for a video (stored by Clowdr). */
    VideoFile = "VIDEO_FILE",
    /** Video file for filler loop between events/during breaks in a broadcast. */
    VideoFiller = "VIDEO_FILLER",
    /** Link to a video (video is not embedded in Clowdr UI). */
    VideoLink = "VIDEO_LINK",
    /** Video file to be published in advance of the conference. */
    VideoPrepublish = "VIDEO_PREPUBLISH",
    /** Video file for sponsors filler loop between events/during breaks in a broadcast. */
    VideoSponsorsFiller = "VIDEO_SPONSORS_FILLER",
    /** Video file for titles introducing an event during a broadcast. */
    VideoTitles = "VIDEO_TITLES",
    /** URL for a video (video is embedded in Clowdr UI). */
    VideoUrl = "VIDEO_URL",
}

/** expression to compare columns of type ContentType_enum. All fields are combined with logical 'AND'. */
export type ContentType_Enum_Comparison_Exp = {
    _eq?: Maybe<ContentType_Enum>;
    _in?: Maybe<Array<ContentType_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<ContentType_Enum>;
    _nin?: Maybe<Array<ContentType_Enum>>;
};

/** input type for inserting data into table "ContentType" */
export type ContentType_Insert_Input = {
    contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type ContentType_Max_Fields = {
    __typename?: "ContentType_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "ContentType" */
export type ContentType_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentType_Min_Fields = {
    __typename?: "ContentType_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "ContentType" */
export type ContentType_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentType" */
export type ContentType_Mutation_Response = {
    __typename?: "ContentType_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ContentType>;
};

/** input type for inserting object relation for remote table "ContentType" */
export type ContentType_Obj_Rel_Insert_Input = {
    data: ContentType_Insert_Input;
    on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** on conflict condition type for table "ContentType" */
export type ContentType_On_Conflict = {
    constraint: ContentType_Constraint;
    update_columns: Array<ContentType_Update_Column>;
    where?: Maybe<ContentType_Bool_Exp>;
};

/** ordering options when selecting data from "ContentType" */
export type ContentType_Order_By = {
    contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
};

/** primary key columns input for table: "ContentType" */
export type ContentType_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "ContentType" */
export enum ContentType_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "ContentType" */
export type ContentType_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "ContentType" */
export enum ContentType_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

export type EchoInput = {
    message: Scalars["String"];
};

export type EchoOutput = {
    __typename?: "EchoOutput";
    message: Scalars["String"];
};

/** columns and relationships of "Email" */
export type Email = {
    __typename?: "Email";
    createdAt: Scalars["timestamptz"];
    emailAddress: Scalars["String"];
    htmlContents: Scalars["String"];
    id: Scalars["uuid"];
    /** An object relationship */
    invitation?: Maybe<Invitation>;
    invitationId?: Maybe<Scalars["uuid"]>;
    plainTextContents: Scalars["String"];
    reason: Scalars["String"];
    retriesCount: Scalars["Int"];
    sentAt?: Maybe<Scalars["timestamptz"]>;
    subject: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user?: Maybe<User>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "Email" */
export type Email_Aggregate = {
    __typename?: "Email_aggregate";
    aggregate?: Maybe<Email_Aggregate_Fields>;
    nodes: Array<Email>;
};

/** aggregate fields of "Email" */
export type Email_Aggregate_Fields = {
    __typename?: "Email_aggregate_fields";
    avg?: Maybe<Email_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Email_Max_Fields>;
    min?: Maybe<Email_Min_Fields>;
    stddev?: Maybe<Email_Stddev_Fields>;
    stddev_pop?: Maybe<Email_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<Email_Stddev_Samp_Fields>;
    sum?: Maybe<Email_Sum_Fields>;
    var_pop?: Maybe<Email_Var_Pop_Fields>;
    var_samp?: Maybe<Email_Var_Samp_Fields>;
    variance?: Maybe<Email_Variance_Fields>;
};

/** aggregate fields of "Email" */
export type Email_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Email_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Email" */
export type Email_Aggregate_Order_By = {
    avg?: Maybe<Email_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<Email_Max_Order_By>;
    min?: Maybe<Email_Min_Order_By>;
    stddev?: Maybe<Email_Stddev_Order_By>;
    stddev_pop?: Maybe<Email_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<Email_Stddev_Samp_Order_By>;
    sum?: Maybe<Email_Sum_Order_By>;
    var_pop?: Maybe<Email_Var_Pop_Order_By>;
    var_samp?: Maybe<Email_Var_Samp_Order_By>;
    variance?: Maybe<Email_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Email" */
export type Email_Arr_Rel_Insert_Input = {
    data: Array<Email_Insert_Input>;
    on_conflict?: Maybe<Email_On_Conflict>;
};

/** aggregate avg on columns */
export type Email_Avg_Fields = {
    __typename?: "Email_avg_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Email" */
export type Email_Avg_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Email". All fields are combined with a logical 'AND'. */
export type Email_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Email_Bool_Exp>>>;
    _not?: Maybe<Email_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Email_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    emailAddress?: Maybe<String_Comparison_Exp>;
    htmlContents?: Maybe<String_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    invitation?: Maybe<Invitation_Bool_Exp>;
    invitationId?: Maybe<Uuid_Comparison_Exp>;
    plainTextContents?: Maybe<String_Comparison_Exp>;
    reason?: Maybe<String_Comparison_Exp>;
    retriesCount?: Maybe<Int_Comparison_Exp>;
    sentAt?: Maybe<Timestamptz_Comparison_Exp>;
    subject?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Email" */
export enum Email_Constraint {
    /** unique or primary key constraint */
    EmailPkey = "Email_pkey",
}

/** input type for incrementing integer column in table "Email" */
export type Email_Inc_Input = {
    retriesCount?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Email" */
export type Email_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    emailAddress?: Maybe<Scalars["String"]>;
    htmlContents?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitation?: Maybe<Invitation_Obj_Rel_Insert_Input>;
    invitationId?: Maybe<Scalars["uuid"]>;
    plainTextContents?: Maybe<Scalars["String"]>;
    reason?: Maybe<Scalars["String"]>;
    retriesCount?: Maybe<Scalars["Int"]>;
    sentAt?: Maybe<Scalars["timestamptz"]>;
    subject?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Email_Max_Fields = {
    __typename?: "Email_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    emailAddress?: Maybe<Scalars["String"]>;
    htmlContents?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationId?: Maybe<Scalars["uuid"]>;
    plainTextContents?: Maybe<Scalars["String"]>;
    reason?: Maybe<Scalars["String"]>;
    retriesCount?: Maybe<Scalars["Int"]>;
    sentAt?: Maybe<Scalars["timestamptz"]>;
    subject?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Email" */
export type Email_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    emailAddress?: Maybe<Order_By>;
    htmlContents?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitationId?: Maybe<Order_By>;
    plainTextContents?: Maybe<Order_By>;
    reason?: Maybe<Order_By>;
    retriesCount?: Maybe<Order_By>;
    sentAt?: Maybe<Order_By>;
    subject?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Email_Min_Fields = {
    __typename?: "Email_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    emailAddress?: Maybe<Scalars["String"]>;
    htmlContents?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationId?: Maybe<Scalars["uuid"]>;
    plainTextContents?: Maybe<Scalars["String"]>;
    reason?: Maybe<Scalars["String"]>;
    retriesCount?: Maybe<Scalars["Int"]>;
    sentAt?: Maybe<Scalars["timestamptz"]>;
    subject?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Email" */
export type Email_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    emailAddress?: Maybe<Order_By>;
    htmlContents?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitationId?: Maybe<Order_By>;
    plainTextContents?: Maybe<Order_By>;
    reason?: Maybe<Order_By>;
    retriesCount?: Maybe<Order_By>;
    sentAt?: Maybe<Order_By>;
    subject?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "Email" */
export type Email_Mutation_Response = {
    __typename?: "Email_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Email>;
};

/** input type for inserting object relation for remote table "Email" */
export type Email_Obj_Rel_Insert_Input = {
    data: Email_Insert_Input;
    on_conflict?: Maybe<Email_On_Conflict>;
};

/** on conflict condition type for table "Email" */
export type Email_On_Conflict = {
    constraint: Email_Constraint;
    update_columns: Array<Email_Update_Column>;
    where?: Maybe<Email_Bool_Exp>;
};

/** ordering options when selecting data from "Email" */
export type Email_Order_By = {
    createdAt?: Maybe<Order_By>;
    emailAddress?: Maybe<Order_By>;
    htmlContents?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    invitation?: Maybe<Invitation_Order_By>;
    invitationId?: Maybe<Order_By>;
    plainTextContents?: Maybe<Order_By>;
    reason?: Maybe<Order_By>;
    retriesCount?: Maybe<Order_By>;
    sentAt?: Maybe<Order_By>;
    subject?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "Email" */
export type Email_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Email" */
export enum Email_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EmailAddress = "emailAddress",
    /** column name */
    HtmlContents = "htmlContents",
    /** column name */
    Id = "id",
    /** column name */
    InvitationId = "invitationId",
    /** column name */
    PlainTextContents = "plainTextContents",
    /** column name */
    Reason = "reason",
    /** column name */
    RetriesCount = "retriesCount",
    /** column name */
    SentAt = "sentAt",
    /** column name */
    Subject = "subject",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "Email" */
export type Email_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    emailAddress?: Maybe<Scalars["String"]>;
    htmlContents?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    invitationId?: Maybe<Scalars["uuid"]>;
    plainTextContents?: Maybe<Scalars["String"]>;
    reason?: Maybe<Scalars["String"]>;
    retriesCount?: Maybe<Scalars["Int"]>;
    sentAt?: Maybe<Scalars["timestamptz"]>;
    subject?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate stddev on columns */
export type Email_Stddev_Fields = {
    __typename?: "Email_stddev_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Email" */
export type Email_Stddev_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Email_Stddev_Pop_Fields = {
    __typename?: "Email_stddev_pop_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Email" */
export type Email_Stddev_Pop_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Email_Stddev_Samp_Fields = {
    __typename?: "Email_stddev_samp_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Email" */
export type Email_Stddev_Samp_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Email_Sum_Fields = {
    __typename?: "Email_sum_fields";
    retriesCount?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Email" */
export type Email_Sum_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** update columns of table "Email" */
export enum Email_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EmailAddress = "emailAddress",
    /** column name */
    HtmlContents = "htmlContents",
    /** column name */
    Id = "id",
    /** column name */
    InvitationId = "invitationId",
    /** column name */
    PlainTextContents = "plainTextContents",
    /** column name */
    Reason = "reason",
    /** column name */
    RetriesCount = "retriesCount",
    /** column name */
    SentAt = "sentAt",
    /** column name */
    Subject = "subject",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** aggregate var_pop on columns */
export type Email_Var_Pop_Fields = {
    __typename?: "Email_var_pop_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Email" */
export type Email_Var_Pop_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Email_Var_Samp_Fields = {
    __typename?: "Email_var_samp_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Email" */
export type Email_Var_Samp_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Email_Variance_Fields = {
    __typename?: "Email_variance_fields";
    retriesCount?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Email" */
export type Email_Variance_Order_By = {
    retriesCount?: Maybe<Order_By>;
};

/** columns and relationships of "Event" */
export type Event = {
    __typename?: "Event";
    /** An array relationship */
    broadcasts: Array<Broadcast>;
    /** An aggregated array relationship */
    broadcasts_aggregate: Broadcast_Aggregate;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    contentGroup?: Maybe<ContentGroup>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt: Scalars["timestamptz"];
    durationSeconds: Scalars["Int"];
    /** An array relationship */
    eventPeople: Array<EventPerson>;
    /** An aggregated array relationship */
    eventPeople_aggregate: EventPerson_Aggregate;
    /** An array relationship */
    eventTags: Array<EventTag>;
    /** An aggregated array relationship */
    eventTags_aggregate: EventTag_Aggregate;
    /** An array relationship */
    executedTransitions: Array<ExecutedTransitions>;
    /** An aggregated array relationship */
    executedTransitions_aggregate: ExecutedTransitions_Aggregate;
    id: Scalars["uuid"];
    intendedRoomModeName: RoomMode_Enum;
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    /** An object relationship */
    room: Room;
    roomId: Scalars["uuid"];
    /** An object relationship */
    roomMode: RoomMode;
    startTime: Scalars["timestamptz"];
    /** An array relationship */
    transitions: Array<Transitions>;
    /** An aggregated array relationship */
    transitions_aggregate: Transitions_Aggregate;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Event" */
export type EventBroadcastsArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventBroadcasts_AggregateArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventEventPeopleArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventEventPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventEventTagsArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventEventTags_AggregateArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventExecutedTransitionsArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventExecutedTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "Event" */
export type EventTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "EventPerson" */
export type EventPerson = {
    __typename?: "EventPerson";
    affiliation?: Maybe<Scalars["String"]>;
    /** An object relationship */
    attendee?: Maybe<Attendee>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    event: Event;
    eventId: Scalars["uuid"];
    /** An object relationship */
    eventPersonRole: EventPersonRole;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roleName: EventPersonRole_Enum;
};

/** columns and relationships of "EventPersonRole" */
export type EventPersonRole = {
    __typename?: "EventPersonRole";
    description: Scalars["String"];
    /** An array relationship */
    eventPeople: Array<EventPerson>;
    /** An aggregated array relationship */
    eventPeople_aggregate: EventPerson_Aggregate;
    name: Scalars["String"];
};

/** columns and relationships of "EventPersonRole" */
export type EventPersonRoleEventPeopleArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "EventPersonRole" */
export type EventPersonRoleEventPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** aggregated selection of "EventPersonRole" */
export type EventPersonRole_Aggregate = {
    __typename?: "EventPersonRole_aggregate";
    aggregate?: Maybe<EventPersonRole_Aggregate_Fields>;
    nodes: Array<EventPersonRole>;
};

/** aggregate fields of "EventPersonRole" */
export type EventPersonRole_Aggregate_Fields = {
    __typename?: "EventPersonRole_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<EventPersonRole_Max_Fields>;
    min?: Maybe<EventPersonRole_Min_Fields>;
};

/** aggregate fields of "EventPersonRole" */
export type EventPersonRole_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<EventPersonRole_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "EventPersonRole" */
export type EventPersonRole_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<EventPersonRole_Max_Order_By>;
    min?: Maybe<EventPersonRole_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventPersonRole" */
export type EventPersonRole_Arr_Rel_Insert_Input = {
    data: Array<EventPersonRole_Insert_Input>;
    on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventPersonRole". All fields are combined with a logical 'AND'. */
export type EventPersonRole_Bool_Exp = {
    _and?: Maybe<Array<Maybe<EventPersonRole_Bool_Exp>>>;
    _not?: Maybe<EventPersonRole_Bool_Exp>;
    _or?: Maybe<Array<Maybe<EventPersonRole_Bool_Exp>>>;
    description?: Maybe<String_Comparison_Exp>;
    eventPeople?: Maybe<EventPerson_Bool_Exp>;
    name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventPersonRole" */
export enum EventPersonRole_Constraint {
    /** unique or primary key constraint */
    EventPersonRolePkey = "EventPersonRole_pkey",
}

export enum EventPersonRole_Enum {
    /** Chair/moderator of the event */
    Chair = "CHAIR",
    /** A presenter. */
    Presenter = "PRESENTER",
}

/** expression to compare columns of type EventPersonRole_enum. All fields are combined with logical 'AND'. */
export type EventPersonRole_Enum_Comparison_Exp = {
    _eq?: Maybe<EventPersonRole_Enum>;
    _in?: Maybe<Array<EventPersonRole_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<EventPersonRole_Enum>;
    _nin?: Maybe<Array<EventPersonRole_Enum>>;
};

/** input type for inserting data into table "EventPersonRole" */
export type EventPersonRole_Insert_Input = {
    description?: Maybe<Scalars["String"]>;
    eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
    name?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type EventPersonRole_Max_Fields = {
    __typename?: "EventPersonRole_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "EventPersonRole" */
export type EventPersonRole_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventPersonRole_Min_Fields = {
    __typename?: "EventPersonRole_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "EventPersonRole" */
export type EventPersonRole_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventPersonRole" */
export type EventPersonRole_Mutation_Response = {
    __typename?: "EventPersonRole_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<EventPersonRole>;
};

/** input type for inserting object relation for remote table "EventPersonRole" */
export type EventPersonRole_Obj_Rel_Insert_Input = {
    data: EventPersonRole_Insert_Input;
    on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** on conflict condition type for table "EventPersonRole" */
export type EventPersonRole_On_Conflict = {
    constraint: EventPersonRole_Constraint;
    update_columns: Array<EventPersonRole_Update_Column>;
    where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** ordering options when selecting data from "EventPersonRole" */
export type EventPersonRole_Order_By = {
    description?: Maybe<Order_By>;
    eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
    name?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventPersonRole" */
export type EventPersonRole_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "EventPersonRole" */
export enum EventPersonRole_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "EventPersonRole" */
export type EventPersonRole_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "EventPersonRole" */
export enum EventPersonRole_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** aggregated selection of "EventPerson" */
export type EventPerson_Aggregate = {
    __typename?: "EventPerson_aggregate";
    aggregate?: Maybe<EventPerson_Aggregate_Fields>;
    nodes: Array<EventPerson>;
};

/** aggregate fields of "EventPerson" */
export type EventPerson_Aggregate_Fields = {
    __typename?: "EventPerson_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<EventPerson_Max_Fields>;
    min?: Maybe<EventPerson_Min_Fields>;
};

/** aggregate fields of "EventPerson" */
export type EventPerson_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<EventPerson_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "EventPerson" */
export type EventPerson_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<EventPerson_Max_Order_By>;
    min?: Maybe<EventPerson_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventPerson" */
export type EventPerson_Arr_Rel_Insert_Input = {
    data: Array<EventPerson_Insert_Input>;
    on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventPerson". All fields are combined with a logical 'AND'. */
export type EventPerson_Bool_Exp = {
    _and?: Maybe<Array<Maybe<EventPerson_Bool_Exp>>>;
    _not?: Maybe<EventPerson_Bool_Exp>;
    _or?: Maybe<Array<Maybe<EventPerson_Bool_Exp>>>;
    affiliation?: Maybe<String_Comparison_Exp>;
    attendee?: Maybe<Attendee_Bool_Exp>;
    attendeeId?: Maybe<Uuid_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    event?: Maybe<Event_Bool_Exp>;
    eventId?: Maybe<Uuid_Comparison_Exp>;
    eventPersonRole?: Maybe<EventPersonRole_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    roleName?: Maybe<EventPersonRole_Enum_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventPerson" */
export enum EventPerson_Constraint {
    /** unique or primary key constraint */
    EventPersonEventIdAttendeeIdRoleNameKey = "EventPerson_eventId_attendeeId_roleName_key",
    /** unique or primary key constraint */
    EventPersonEventIdNameAffiliationKey = "EventPerson_eventId_name_affiliation_key",
    /** unique or primary key constraint */
    EventPersonPkey = "EventPerson_pkey",
}

/** input type for inserting data into table "EventPerson" */
export type EventPerson_Insert_Input = {
    affiliation?: Maybe<Scalars["String"]>;
    attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    event?: Maybe<Event_Obj_Rel_Insert_Input>;
    eventId?: Maybe<Scalars["uuid"]>;
    eventPersonRole?: Maybe<EventPersonRole_Obj_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roleName?: Maybe<EventPersonRole_Enum>;
};

/** aggregate max on columns */
export type EventPerson_Max_Fields = {
    __typename?: "EventPerson_max_fields";
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "EventPerson" */
export type EventPerson_Max_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventPerson_Min_Fields = {
    __typename?: "EventPerson_min_fields";
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "EventPerson" */
export type EventPerson_Min_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventPerson" */
export type EventPerson_Mutation_Response = {
    __typename?: "EventPerson_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<EventPerson>;
};

/** input type for inserting object relation for remote table "EventPerson" */
export type EventPerson_Obj_Rel_Insert_Input = {
    data: EventPerson_Insert_Input;
    on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** on conflict condition type for table "EventPerson" */
export type EventPerson_On_Conflict = {
    constraint: EventPerson_Constraint;
    update_columns: Array<EventPerson_Update_Column>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** ordering options when selecting data from "EventPerson" */
export type EventPerson_Order_By = {
    affiliation?: Maybe<Order_By>;
    attendee?: Maybe<Attendee_Order_By>;
    attendeeId?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    event?: Maybe<Event_Order_By>;
    eventId?: Maybe<Order_By>;
    eventPersonRole?: Maybe<EventPersonRole_Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    roleName?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventPerson" */
export type EventPerson_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "EventPerson" */
export enum EventPerson_Select_Column {
    /** column name */
    Affiliation = "affiliation",
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RoleName = "roleName",
}

/** input type for updating data in table "EventPerson" */
export type EventPerson_Set_Input = {
    affiliation?: Maybe<Scalars["String"]>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roleName?: Maybe<EventPersonRole_Enum>;
};

/** update columns of table "EventPerson" */
export enum EventPerson_Update_Column {
    /** column name */
    Affiliation = "affiliation",
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RoleName = "roleName",
}

/** columns and relationships of "EventTag" */
export type EventTag = {
    __typename?: "EventTag";
    /** An object relationship */
    event: Event;
    eventId: Scalars["uuid"];
    id: Scalars["uuid"];
    /** An object relationship */
    tag: Tag;
    tagId: Scalars["uuid"];
};

/** aggregated selection of "EventTag" */
export type EventTag_Aggregate = {
    __typename?: "EventTag_aggregate";
    aggregate?: Maybe<EventTag_Aggregate_Fields>;
    nodes: Array<EventTag>;
};

/** aggregate fields of "EventTag" */
export type EventTag_Aggregate_Fields = {
    __typename?: "EventTag_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<EventTag_Max_Fields>;
    min?: Maybe<EventTag_Min_Fields>;
};

/** aggregate fields of "EventTag" */
export type EventTag_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<EventTag_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "EventTag" */
export type EventTag_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<EventTag_Max_Order_By>;
    min?: Maybe<EventTag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventTag" */
export type EventTag_Arr_Rel_Insert_Input = {
    data: Array<EventTag_Insert_Input>;
    on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventTag". All fields are combined with a logical 'AND'. */
export type EventTag_Bool_Exp = {
    _and?: Maybe<Array<Maybe<EventTag_Bool_Exp>>>;
    _not?: Maybe<EventTag_Bool_Exp>;
    _or?: Maybe<Array<Maybe<EventTag_Bool_Exp>>>;
    event?: Maybe<Event_Bool_Exp>;
    eventId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    tag?: Maybe<Tag_Bool_Exp>;
    tagId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventTag" */
export enum EventTag_Constraint {
    /** unique or primary key constraint */
    EventTagPkey = "EventTag_pkey",
    /** unique or primary key constraint */
    EventTagTagIdEventIdKey = "EventTag_tagId_eventId_key",
}

/** input type for inserting data into table "EventTag" */
export type EventTag_Insert_Input = {
    event?: Maybe<Event_Obj_Rel_Insert_Input>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tag?: Maybe<Tag_Obj_Rel_Insert_Input>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type EventTag_Max_Fields = {
    __typename?: "EventTag_max_fields";
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "EventTag" */
export type EventTag_Max_Order_By = {
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tagId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventTag_Min_Fields = {
    __typename?: "EventTag_min_fields";
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "EventTag" */
export type EventTag_Min_Order_By = {
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tagId?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventTag" */
export type EventTag_Mutation_Response = {
    __typename?: "EventTag_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<EventTag>;
};

/** input type for inserting object relation for remote table "EventTag" */
export type EventTag_Obj_Rel_Insert_Input = {
    data: EventTag_Insert_Input;
    on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** on conflict condition type for table "EventTag" */
export type EventTag_On_Conflict = {
    constraint: EventTag_Constraint;
    update_columns: Array<EventTag_Update_Column>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** ordering options when selecting data from "EventTag" */
export type EventTag_Order_By = {
    event?: Maybe<Event_Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    tag?: Maybe<Tag_Order_By>;
    tagId?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventTag" */
export type EventTag_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "EventTag" */
export enum EventTag_Select_Column {
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    TagId = "tagId",
}

/** input type for updating data in table "EventTag" */
export type EventTag_Set_Input = {
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    tagId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "EventTag" */
export enum EventTag_Update_Column {
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    TagId = "tagId",
}

/** aggregated selection of "Event" */
export type Event_Aggregate = {
    __typename?: "Event_aggregate";
    aggregate?: Maybe<Event_Aggregate_Fields>;
    nodes: Array<Event>;
};

/** aggregate fields of "Event" */
export type Event_Aggregate_Fields = {
    __typename?: "Event_aggregate_fields";
    avg?: Maybe<Event_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Event_Max_Fields>;
    min?: Maybe<Event_Min_Fields>;
    stddev?: Maybe<Event_Stddev_Fields>;
    stddev_pop?: Maybe<Event_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<Event_Stddev_Samp_Fields>;
    sum?: Maybe<Event_Sum_Fields>;
    var_pop?: Maybe<Event_Var_Pop_Fields>;
    var_samp?: Maybe<Event_Var_Samp_Fields>;
    variance?: Maybe<Event_Variance_Fields>;
};

/** aggregate fields of "Event" */
export type Event_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Event_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Event" */
export type Event_Aggregate_Order_By = {
    avg?: Maybe<Event_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<Event_Max_Order_By>;
    min?: Maybe<Event_Min_Order_By>;
    stddev?: Maybe<Event_Stddev_Order_By>;
    stddev_pop?: Maybe<Event_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<Event_Stddev_Samp_Order_By>;
    sum?: Maybe<Event_Sum_Order_By>;
    var_pop?: Maybe<Event_Var_Pop_Order_By>;
    var_samp?: Maybe<Event_Var_Samp_Order_By>;
    variance?: Maybe<Event_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Event" */
export type Event_Arr_Rel_Insert_Input = {
    data: Array<Event_Insert_Input>;
    on_conflict?: Maybe<Event_On_Conflict>;
};

/** aggregate avg on columns */
export type Event_Avg_Fields = {
    __typename?: "Event_avg_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Event" */
export type Event_Avg_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Event". All fields are combined with a logical 'AND'. */
export type Event_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Event_Bool_Exp>>>;
    _not?: Maybe<Event_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Event_Bool_Exp>>>;
    broadcasts?: Maybe<Broadcast_Bool_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroup?: Maybe<ContentGroup_Bool_Exp>;
    contentGroupId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    durationSeconds?: Maybe<Int_Comparison_Exp>;
    eventPeople?: Maybe<EventPerson_Bool_Exp>;
    eventTags?: Maybe<EventTag_Bool_Exp>;
    executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    intendedRoomModeName?: Maybe<RoomMode_Enum_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    room?: Maybe<Room_Bool_Exp>;
    roomId?: Maybe<Uuid_Comparison_Exp>;
    roomMode?: Maybe<RoomMode_Bool_Exp>;
    startTime?: Maybe<Timestamptz_Comparison_Exp>;
    transitions?: Maybe<Transitions_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Event" */
export enum Event_Constraint {
    /** unique or primary key constraint */
    EventPkey = "Event_pkey",
}

/** input type for incrementing integer column in table "Event" */
export type Event_Inc_Input = {
    durationSeconds?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Event" */
export type Event_Insert_Input = {
    broadcasts?: Maybe<Broadcast_Arr_Rel_Insert_Input>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    durationSeconds?: Maybe<Scalars["Int"]>;
    eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
    eventTags?: Maybe<EventTag_Arr_Rel_Insert_Input>;
    executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    intendedRoomModeName?: Maybe<RoomMode_Enum>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    room?: Maybe<Room_Obj_Rel_Insert_Input>;
    roomId?: Maybe<Scalars["uuid"]>;
    roomMode?: Maybe<RoomMode_Obj_Rel_Insert_Input>;
    startTime?: Maybe<Scalars["timestamptz"]>;
    transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Event_Max_Fields = {
    __typename?: "Event_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    durationSeconds?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    startTime?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Event" */
export type Event_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    durationSeconds?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    startTime?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Event_Min_Fields = {
    __typename?: "Event_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    durationSeconds?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    startTime?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Event" */
export type Event_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    durationSeconds?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    startTime?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Event" */
export type Event_Mutation_Response = {
    __typename?: "Event_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Event>;
};

/** input type for inserting object relation for remote table "Event" */
export type Event_Obj_Rel_Insert_Input = {
    data: Event_Insert_Input;
    on_conflict?: Maybe<Event_On_Conflict>;
};

/** on conflict condition type for table "Event" */
export type Event_On_Conflict = {
    constraint: Event_Constraint;
    update_columns: Array<Event_Update_Column>;
    where?: Maybe<Event_Bool_Exp>;
};

/** ordering options when selecting data from "Event" */
export type Event_Order_By = {
    broadcasts_aggregate?: Maybe<Broadcast_Aggregate_Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroup?: Maybe<ContentGroup_Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    durationSeconds?: Maybe<Order_By>;
    eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
    eventTags_aggregate?: Maybe<EventTag_Aggregate_Order_By>;
    executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    intendedRoomModeName?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    room?: Maybe<Room_Order_By>;
    roomId?: Maybe<Order_By>;
    roomMode?: Maybe<RoomMode_Order_By>;
    startTime?: Maybe<Order_By>;
    transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Event" */
export type Event_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Event" */
export enum Event_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    DurationSeconds = "durationSeconds",
    /** column name */
    Id = "id",
    /** column name */
    IntendedRoomModeName = "intendedRoomModeName",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RoomId = "roomId",
    /** column name */
    StartTime = "startTime",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Event" */
export type Event_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    durationSeconds?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    intendedRoomModeName?: Maybe<RoomMode_Enum>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    startTime?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type Event_Stddev_Fields = {
    __typename?: "Event_stddev_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Event" */
export type Event_Stddev_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Event_Stddev_Pop_Fields = {
    __typename?: "Event_stddev_pop_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Event" */
export type Event_Stddev_Pop_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Event_Stddev_Samp_Fields = {
    __typename?: "Event_stddev_samp_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Event" */
export type Event_Stddev_Samp_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Event_Sum_Fields = {
    __typename?: "Event_sum_fields";
    durationSeconds?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Event" */
export type Event_Sum_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** update columns of table "Event" */
export enum Event_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    DurationSeconds = "durationSeconds",
    /** column name */
    Id = "id",
    /** column name */
    IntendedRoomModeName = "intendedRoomModeName",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    RoomId = "roomId",
    /** column name */
    StartTime = "startTime",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregate var_pop on columns */
export type Event_Var_Pop_Fields = {
    __typename?: "Event_var_pop_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Event" */
export type Event_Var_Pop_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Event_Var_Samp_Fields = {
    __typename?: "Event_var_samp_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Event" */
export type Event_Var_Samp_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Event_Variance_Fields = {
    __typename?: "Event_variance_fields";
    durationSeconds?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Event" */
export type Event_Variance_Order_By = {
    durationSeconds?: Maybe<Order_By>;
};

/** columns and relationships of "ExecutedTransitions" */
export type ExecutedTransitions = {
    __typename?: "ExecutedTransitions";
    broadcastContentId: Scalars["uuid"];
    /** An object relationship */
    broadcastContentItem: BroadcastContentItem;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    event: Event;
    eventId: Scalars["uuid"];
    id: Scalars["uuid"];
    /** An object relationship */
    room: Room;
    roomId: Scalars["uuid"];
    time: Scalars["timestamptz"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate = {
    __typename?: "ExecutedTransitions_aggregate";
    aggregate?: Maybe<ExecutedTransitions_Aggregate_Fields>;
    nodes: Array<ExecutedTransitions>;
};

/** aggregate fields of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_Fields = {
    __typename?: "ExecutedTransitions_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<ExecutedTransitions_Max_Fields>;
    min?: Maybe<ExecutedTransitions_Min_Fields>;
};

/** aggregate fields of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<ExecutedTransitions_Max_Order_By>;
    min?: Maybe<ExecutedTransitions_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ExecutedTransitions" */
export type ExecutedTransitions_Arr_Rel_Insert_Input = {
    data: Array<ExecutedTransitions_Insert_Input>;
    on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ExecutedTransitions". All fields are combined with a logical 'AND'. */
export type ExecutedTransitions_Bool_Exp = {
    _and?: Maybe<Array<Maybe<ExecutedTransitions_Bool_Exp>>>;
    _not?: Maybe<ExecutedTransitions_Bool_Exp>;
    _or?: Maybe<Array<Maybe<ExecutedTransitions_Bool_Exp>>>;
    broadcastContentId?: Maybe<Uuid_Comparison_Exp>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    event?: Maybe<Event_Bool_Exp>;
    eventId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    room?: Maybe<Room_Bool_Exp>;
    roomId?: Maybe<Uuid_Comparison_Exp>;
    time?: Maybe<Timestamptz_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ExecutedTransitions" */
export enum ExecutedTransitions_Constraint {
    /** unique or primary key constraint */
    ExecutedTransitionsPkey = "ExecutedTransitions_pkey",
}

/** input type for inserting data into table "ExecutedTransitions" */
export type ExecutedTransitions_Insert_Input = {
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    event?: Maybe<Event_Obj_Rel_Insert_Input>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    room?: Maybe<Room_Obj_Rel_Insert_Input>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type ExecutedTransitions_Max_Fields = {
    __typename?: "ExecutedTransitions_max_fields";
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "ExecutedTransitions" */
export type ExecutedTransitions_Max_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ExecutedTransitions_Min_Fields = {
    __typename?: "ExecutedTransitions_min_fields";
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "ExecutedTransitions" */
export type ExecutedTransitions_Min_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ExecutedTransitions" */
export type ExecutedTransitions_Mutation_Response = {
    __typename?: "ExecutedTransitions_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<ExecutedTransitions>;
};

/** input type for inserting object relation for remote table "ExecutedTransitions" */
export type ExecutedTransitions_Obj_Rel_Insert_Input = {
    data: ExecutedTransitions_Insert_Input;
    on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** on conflict condition type for table "ExecutedTransitions" */
export type ExecutedTransitions_On_Conflict = {
    constraint: ExecutedTransitions_Constraint;
    update_columns: Array<ExecutedTransitions_Update_Column>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** ordering options when selecting data from "ExecutedTransitions" */
export type ExecutedTransitions_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    event?: Maybe<Event_Order_By>;
    eventId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    room?: Maybe<Room_Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ExecutedTransitions" */
export type ExecutedTransitions_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "ExecutedTransitions" */
export enum ExecutedTransitions_Select_Column {
    /** column name */
    BroadcastContentId = "broadcastContentId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    Time = "time",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "ExecutedTransitions" */
export type ExecutedTransitions_Set_Input = {
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "ExecutedTransitions" */
export enum ExecutedTransitions_Update_Column {
    /** column name */
    BroadcastContentId = "broadcastContentId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EventId = "eventId",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    Time = "time",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "FlaggedChatMessage" */
export type FlaggedChatMessage = {
    __typename?: "FlaggedChatMessage";
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    flaggedBy: User;
    flaggedById: Scalars["String"];
    id: Scalars["uuid"];
    /** An object relationship */
    message: ChatMessage;
    messageId: Scalars["uuid"];
    /** An object relationship */
    moderationChat?: Maybe<Chat>;
    moderationChatId?: Maybe<Scalars["uuid"]>;
    notes?: Maybe<Scalars["String"]>;
    resolutionAction?: Maybe<Scalars["String"]>;
    resolvedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregated selection of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate = {
    __typename?: "FlaggedChatMessage_aggregate";
    aggregate?: Maybe<FlaggedChatMessage_Aggregate_Fields>;
    nodes: Array<FlaggedChatMessage>;
};

/** aggregate fields of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_Fields = {
    __typename?: "FlaggedChatMessage_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<FlaggedChatMessage_Max_Fields>;
    min?: Maybe<FlaggedChatMessage_Min_Fields>;
};

/** aggregate fields of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<FlaggedChatMessage_Max_Order_By>;
    min?: Maybe<FlaggedChatMessage_Min_Order_By>;
};

/** input type for inserting array relation for remote table "FlaggedChatMessage" */
export type FlaggedChatMessage_Arr_Rel_Insert_Input = {
    data: Array<FlaggedChatMessage_Insert_Input>;
    on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** Boolean expression to filter rows from the table "FlaggedChatMessage". All fields are combined with a logical 'AND'. */
export type FlaggedChatMessage_Bool_Exp = {
    _and?: Maybe<Array<Maybe<FlaggedChatMessage_Bool_Exp>>>;
    _not?: Maybe<FlaggedChatMessage_Bool_Exp>;
    _or?: Maybe<Array<Maybe<FlaggedChatMessage_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    flaggedBy?: Maybe<User_Bool_Exp>;
    flaggedById?: Maybe<String_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    message?: Maybe<ChatMessage_Bool_Exp>;
    messageId?: Maybe<Uuid_Comparison_Exp>;
    moderationChat?: Maybe<Chat_Bool_Exp>;
    moderationChatId?: Maybe<Uuid_Comparison_Exp>;
    notes?: Maybe<String_Comparison_Exp>;
    resolutionAction?: Maybe<String_Comparison_Exp>;
    resolvedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Constraint {
    /** unique or primary key constraint */
    FlaggedChatMessageMessageIdFlaggedByIdKey = "FlaggedChatMessage_messageId_flaggedById_key",
    /** unique or primary key constraint */
    FlaggedChatMessagePkey = "FlaggedChatMessage_pkey",
}

/** input type for inserting data into table "FlaggedChatMessage" */
export type FlaggedChatMessage_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    flaggedBy?: Maybe<User_Obj_Rel_Insert_Input>;
    flaggedById?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<ChatMessage_Obj_Rel_Insert_Input>;
    messageId?: Maybe<Scalars["uuid"]>;
    moderationChat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    moderationChatId?: Maybe<Scalars["uuid"]>;
    notes?: Maybe<Scalars["String"]>;
    resolutionAction?: Maybe<Scalars["String"]>;
    resolvedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type FlaggedChatMessage_Max_Fields = {
    __typename?: "FlaggedChatMessage_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    flaggedById?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    moderationChatId?: Maybe<Scalars["uuid"]>;
    notes?: Maybe<Scalars["String"]>;
    resolutionAction?: Maybe<Scalars["String"]>;
    resolvedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    flaggedById?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    messageId?: Maybe<Order_By>;
    moderationChatId?: Maybe<Order_By>;
    notes?: Maybe<Order_By>;
    resolutionAction?: Maybe<Order_By>;
    resolvedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type FlaggedChatMessage_Min_Fields = {
    __typename?: "FlaggedChatMessage_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    flaggedById?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    moderationChatId?: Maybe<Scalars["uuid"]>;
    notes?: Maybe<Scalars["String"]>;
    resolutionAction?: Maybe<Scalars["String"]>;
    resolvedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    flaggedById?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    messageId?: Maybe<Order_By>;
    moderationChatId?: Maybe<Order_By>;
    notes?: Maybe<Order_By>;
    resolutionAction?: Maybe<Order_By>;
    resolvedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "FlaggedChatMessage" */
export type FlaggedChatMessage_Mutation_Response = {
    __typename?: "FlaggedChatMessage_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<FlaggedChatMessage>;
};

/** input type for inserting object relation for remote table "FlaggedChatMessage" */
export type FlaggedChatMessage_Obj_Rel_Insert_Input = {
    data: FlaggedChatMessage_Insert_Input;
    on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** on conflict condition type for table "FlaggedChatMessage" */
export type FlaggedChatMessage_On_Conflict = {
    constraint: FlaggedChatMessage_Constraint;
    update_columns: Array<FlaggedChatMessage_Update_Column>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** ordering options when selecting data from "FlaggedChatMessage" */
export type FlaggedChatMessage_Order_By = {
    createdAt?: Maybe<Order_By>;
    flaggedBy?: Maybe<User_Order_By>;
    flaggedById?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<ChatMessage_Order_By>;
    messageId?: Maybe<Order_By>;
    moderationChat?: Maybe<Chat_Order_By>;
    moderationChatId?: Maybe<Order_By>;
    notes?: Maybe<Order_By>;
    resolutionAction?: Maybe<Order_By>;
    resolvedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "FlaggedChatMessage" */
export type FlaggedChatMessage_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    FlaggedById = "flaggedById",
    /** column name */
    Id = "id",
    /** column name */
    MessageId = "messageId",
    /** column name */
    ModerationChatId = "moderationChatId",
    /** column name */
    Notes = "notes",
    /** column name */
    ResolutionAction = "resolutionAction",
    /** column name */
    ResolvedAt = "resolvedAt",
}

/** input type for updating data in table "FlaggedChatMessage" */
export type FlaggedChatMessage_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    flaggedById?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["uuid"]>;
    messageId?: Maybe<Scalars["uuid"]>;
    moderationChatId?: Maybe<Scalars["uuid"]>;
    notes?: Maybe<Scalars["String"]>;
    resolutionAction?: Maybe<Scalars["String"]>;
    resolvedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    FlaggedById = "flaggedById",
    /** column name */
    Id = "id",
    /** column name */
    MessageId = "messageId",
    /** column name */
    ModerationChatId = "moderationChatId",
    /** column name */
    Notes = "notes",
    /** column name */
    ResolutionAction = "resolutionAction",
    /** column name */
    ResolvedAt = "resolvedAt",
}

/** columns and relationships of "FollowedChat" */
export type FollowedChat = {
    __typename?: "FollowedChat";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    id: Scalars["uuid"];
    manual: Scalars["Boolean"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "FollowedChat" */
export type FollowedChat_Aggregate = {
    __typename?: "FollowedChat_aggregate";
    aggregate?: Maybe<FollowedChat_Aggregate_Fields>;
    nodes: Array<FollowedChat>;
};

/** aggregate fields of "FollowedChat" */
export type FollowedChat_Aggregate_Fields = {
    __typename?: "FollowedChat_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<FollowedChat_Max_Fields>;
    min?: Maybe<FollowedChat_Min_Fields>;
};

/** aggregate fields of "FollowedChat" */
export type FollowedChat_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<FollowedChat_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "FollowedChat" */
export type FollowedChat_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<FollowedChat_Max_Order_By>;
    min?: Maybe<FollowedChat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "FollowedChat" */
export type FollowedChat_Arr_Rel_Insert_Input = {
    data: Array<FollowedChat_Insert_Input>;
    on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "FollowedChat". All fields are combined with a logical 'AND'. */
export type FollowedChat_Bool_Exp = {
    _and?: Maybe<Array<Maybe<FollowedChat_Bool_Exp>>>;
    _not?: Maybe<FollowedChat_Bool_Exp>;
    _or?: Maybe<Array<Maybe<FollowedChat_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    manual?: Maybe<Boolean_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "FollowedChat" */
export enum FollowedChat_Constraint {
    /** unique or primary key constraint */
    FollowedChatChatIdUserIdKey = "FollowedChat_chatId_userId_key",
    /** unique or primary key constraint */
    FollowedChatPkey = "FollowedChat_pkey",
}

/** input type for inserting data into table "FollowedChat" */
export type FollowedChat_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    manual?: Maybe<Scalars["Boolean"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type FollowedChat_Max_Fields = {
    __typename?: "FollowedChat_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "FollowedChat" */
export type FollowedChat_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type FollowedChat_Min_Fields = {
    __typename?: "FollowedChat_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "FollowedChat" */
export type FollowedChat_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "FollowedChat" */
export type FollowedChat_Mutation_Response = {
    __typename?: "FollowedChat_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<FollowedChat>;
};

/** input type for inserting object relation for remote table "FollowedChat" */
export type FollowedChat_Obj_Rel_Insert_Input = {
    data: FollowedChat_Insert_Input;
    on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** on conflict condition type for table "FollowedChat" */
export type FollowedChat_On_Conflict = {
    constraint: FollowedChat_Constraint;
    update_columns: Array<FollowedChat_Update_Column>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** ordering options when selecting data from "FollowedChat" */
export type FollowedChat_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    manual?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "FollowedChat" */
export type FollowedChat_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "FollowedChat" */
export enum FollowedChat_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Manual = "manual",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "FollowedChat" */
export type FollowedChat_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    manual?: Maybe<Scalars["Boolean"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "FollowedChat" */
export enum FollowedChat_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Manual = "manual",
    /** column name */
    UserId = "userId",
}

export type GetContentItemOutput = {
    __typename?: "GetContentItemOutput";
    contentTypeName: Scalars["String"];
    data: Scalars["jsonb"];
    id: Scalars["String"];
    layoutData?: Maybe<Scalars["jsonb"]>;
    name: Scalars["String"];
};

export type GetUploadAgreementOutput = {
    __typename?: "GetUploadAgreementOutput";
    agreementText?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "Group" */
export type Group = {
    __typename?: "Group";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    enabled: Scalars["Boolean"];
    /** An array relationship */
    groupAttendees: Array<GroupAttendee>;
    /** An aggregated array relationship */
    groupAttendees_aggregate: GroupAttendee_Aggregate;
    /** An array relationship */
    groupRoles: Array<GroupRole>;
    /** An aggregated array relationship */
    groupRoles_aggregate: GroupRole_Aggregate;
    id: Scalars["uuid"];
    includeUnauthenticated: Scalars["Boolean"];
    name: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Group" */
export type GroupGroupAttendeesArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** columns and relationships of "Group" */
export type GroupGroupAttendees_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** columns and relationships of "Group" */
export type GroupGroupRolesArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** columns and relationships of "Group" */
export type GroupGroupRoles_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** columns and relationships of "GroupAttendee" */
export type GroupAttendee = {
    __typename?: "GroupAttendee";
    /** An object relationship */
    attendee: Attendee;
    attendeeId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    group: Group;
    groupId: Scalars["uuid"];
    id: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "GroupAttendee" */
export type GroupAttendee_Aggregate = {
    __typename?: "GroupAttendee_aggregate";
    aggregate?: Maybe<GroupAttendee_Aggregate_Fields>;
    nodes: Array<GroupAttendee>;
};

/** aggregate fields of "GroupAttendee" */
export type GroupAttendee_Aggregate_Fields = {
    __typename?: "GroupAttendee_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<GroupAttendee_Max_Fields>;
    min?: Maybe<GroupAttendee_Min_Fields>;
};

/** aggregate fields of "GroupAttendee" */
export type GroupAttendee_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<GroupAttendee_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "GroupAttendee" */
export type GroupAttendee_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<GroupAttendee_Max_Order_By>;
    min?: Maybe<GroupAttendee_Min_Order_By>;
};

/** input type for inserting array relation for remote table "GroupAttendee" */
export type GroupAttendee_Arr_Rel_Insert_Input = {
    data: Array<GroupAttendee_Insert_Input>;
    on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** Boolean expression to filter rows from the table "GroupAttendee". All fields are combined with a logical 'AND'. */
export type GroupAttendee_Bool_Exp = {
    _and?: Maybe<Array<Maybe<GroupAttendee_Bool_Exp>>>;
    _not?: Maybe<GroupAttendee_Bool_Exp>;
    _or?: Maybe<Array<Maybe<GroupAttendee_Bool_Exp>>>;
    attendee?: Maybe<Attendee_Bool_Exp>;
    attendeeId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    group?: Maybe<Group_Bool_Exp>;
    groupId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "GroupAttendee" */
export enum GroupAttendee_Constraint {
    /** unique or primary key constraint */
    GroupAttendeeGroupIdAttendeeIdKey = "GroupAttendee_groupId_attendeeId_key",
    /** unique or primary key constraint */
    GroupAttendeePkey = "GroupAttendee_pkey",
}

/** input type for inserting data into table "GroupAttendee" */
export type GroupAttendee_Insert_Input = {
    attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    group?: Maybe<Group_Obj_Rel_Insert_Input>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type GroupAttendee_Max_Fields = {
    __typename?: "GroupAttendee_max_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "GroupAttendee" */
export type GroupAttendee_Max_Order_By = {
    attendeeId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type GroupAttendee_Min_Fields = {
    __typename?: "GroupAttendee_min_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "GroupAttendee" */
export type GroupAttendee_Min_Order_By = {
    attendeeId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "GroupAttendee" */
export type GroupAttendee_Mutation_Response = {
    __typename?: "GroupAttendee_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<GroupAttendee>;
};

/** input type for inserting object relation for remote table "GroupAttendee" */
export type GroupAttendee_Obj_Rel_Insert_Input = {
    data: GroupAttendee_Insert_Input;
    on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** on conflict condition type for table "GroupAttendee" */
export type GroupAttendee_On_Conflict = {
    constraint: GroupAttendee_Constraint;
    update_columns: Array<GroupAttendee_Update_Column>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** ordering options when selecting data from "GroupAttendee" */
export type GroupAttendee_Order_By = {
    attendee?: Maybe<Attendee_Order_By>;
    attendeeId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    group?: Maybe<Group_Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "GroupAttendee" */
export type GroupAttendee_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "GroupAttendee" */
export enum GroupAttendee_Select_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "GroupAttendee" */
export type GroupAttendee_Set_Input = {
    attendeeId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "GroupAttendee" */
export enum GroupAttendee_Update_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "GroupRole" */
export type GroupRole = {
    __typename?: "GroupRole";
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    group: Group;
    groupId: Scalars["uuid"];
    id: Scalars["uuid"];
    /** An object relationship */
    role: Role;
    roleId: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "GroupRole" */
export type GroupRole_Aggregate = {
    __typename?: "GroupRole_aggregate";
    aggregate?: Maybe<GroupRole_Aggregate_Fields>;
    nodes: Array<GroupRole>;
};

/** aggregate fields of "GroupRole" */
export type GroupRole_Aggregate_Fields = {
    __typename?: "GroupRole_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<GroupRole_Max_Fields>;
    min?: Maybe<GroupRole_Min_Fields>;
};

/** aggregate fields of "GroupRole" */
export type GroupRole_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<GroupRole_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "GroupRole" */
export type GroupRole_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<GroupRole_Max_Order_By>;
    min?: Maybe<GroupRole_Min_Order_By>;
};

/** input type for inserting array relation for remote table "GroupRole" */
export type GroupRole_Arr_Rel_Insert_Input = {
    data: Array<GroupRole_Insert_Input>;
    on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** Boolean expression to filter rows from the table "GroupRole". All fields are combined with a logical 'AND'. */
export type GroupRole_Bool_Exp = {
    _and?: Maybe<Array<Maybe<GroupRole_Bool_Exp>>>;
    _not?: Maybe<GroupRole_Bool_Exp>;
    _or?: Maybe<Array<Maybe<GroupRole_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    group?: Maybe<Group_Bool_Exp>;
    groupId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    role?: Maybe<Role_Bool_Exp>;
    roleId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "GroupRole" */
export enum GroupRole_Constraint {
    /** unique or primary key constraint */
    GroupRoleGroupIdRoleIdKey = "GroupRole_groupId_roleId_key",
    /** unique or primary key constraint */
    GroupRolePkey = "GroupRole_pkey",
}

/** input type for inserting data into table "GroupRole" */
export type GroupRole_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    group?: Maybe<Group_Obj_Rel_Insert_Input>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    role?: Maybe<Role_Obj_Rel_Insert_Input>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type GroupRole_Max_Fields = {
    __typename?: "GroupRole_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "GroupRole" */
export type GroupRole_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type GroupRole_Min_Fields = {
    __typename?: "GroupRole_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "GroupRole" */
export type GroupRole_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "GroupRole" */
export type GroupRole_Mutation_Response = {
    __typename?: "GroupRole_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<GroupRole>;
};

/** input type for inserting object relation for remote table "GroupRole" */
export type GroupRole_Obj_Rel_Insert_Input = {
    data: GroupRole_Insert_Input;
    on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** on conflict condition type for table "GroupRole" */
export type GroupRole_On_Conflict = {
    constraint: GroupRole_Constraint;
    update_columns: Array<GroupRole_Update_Column>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** ordering options when selecting data from "GroupRole" */
export type GroupRole_Order_By = {
    createdAt?: Maybe<Order_By>;
    group?: Maybe<Group_Order_By>;
    groupId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    role?: Maybe<Role_Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "GroupRole" */
export type GroupRole_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "GroupRole" */
export enum GroupRole_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    RoleId = "roleId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "GroupRole" */
export type GroupRole_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "GroupRole" */
export enum GroupRole_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    GroupId = "groupId",
    /** column name */
    Id = "id",
    /** column name */
    RoleId = "roleId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregated selection of "Group" */
export type Group_Aggregate = {
    __typename?: "Group_aggregate";
    aggregate?: Maybe<Group_Aggregate_Fields>;
    nodes: Array<Group>;
};

/** aggregate fields of "Group" */
export type Group_Aggregate_Fields = {
    __typename?: "Group_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Group_Max_Fields>;
    min?: Maybe<Group_Min_Fields>;
};

/** aggregate fields of "Group" */
export type Group_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Group_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Group" */
export type Group_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Group_Max_Order_By>;
    min?: Maybe<Group_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Group" */
export type Group_Arr_Rel_Insert_Input = {
    data: Array<Group_Insert_Input>;
    on_conflict?: Maybe<Group_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Group". All fields are combined with a logical 'AND'. */
export type Group_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Group_Bool_Exp>>>;
    _not?: Maybe<Group_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Group_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    enabled?: Maybe<Boolean_Comparison_Exp>;
    groupAttendees?: Maybe<GroupAttendee_Bool_Exp>;
    groupRoles?: Maybe<GroupRole_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    includeUnauthenticated?: Maybe<Boolean_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Group" */
export enum Group_Constraint {
    /** unique or primary key constraint */
    GroupConferenceIdNameKey = "Group_conferenceId_name_key",
    /** unique or primary key constraint */
    GroupPkey = "Group_pkey",
}

/** input type for inserting data into table "Group" */
export type Group_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    enabled?: Maybe<Scalars["Boolean"]>;
    groupAttendees?: Maybe<GroupAttendee_Arr_Rel_Insert_Input>;
    groupRoles?: Maybe<GroupRole_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    includeUnauthenticated?: Maybe<Scalars["Boolean"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Group_Max_Fields = {
    __typename?: "Group_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Group" */
export type Group_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Group_Min_Fields = {
    __typename?: "Group_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Group" */
export type Group_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Group" */
export type Group_Mutation_Response = {
    __typename?: "Group_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Group>;
};

/** input type for inserting object relation for remote table "Group" */
export type Group_Obj_Rel_Insert_Input = {
    data: Group_Insert_Input;
    on_conflict?: Maybe<Group_On_Conflict>;
};

/** on conflict condition type for table "Group" */
export type Group_On_Conflict = {
    constraint: Group_Constraint;
    update_columns: Array<Group_Update_Column>;
    where?: Maybe<Group_Bool_Exp>;
};

/** ordering options when selecting data from "Group" */
export type Group_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    enabled?: Maybe<Order_By>;
    groupAttendees_aggregate?: Maybe<GroupAttendee_Aggregate_Order_By>;
    groupRoles_aggregate?: Maybe<GroupRole_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    includeUnauthenticated?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Group" */
export type Group_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Group" */
export enum Group_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Enabled = "enabled",
    /** column name */
    Id = "id",
    /** column name */
    IncludeUnauthenticated = "includeUnauthenticated",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Group" */
export type Group_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    enabled?: Maybe<Scalars["Boolean"]>;
    id?: Maybe<Scalars["uuid"]>;
    includeUnauthenticated?: Maybe<Scalars["Boolean"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Group" */
export enum Group_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Enabled = "enabled",
    /** column name */
    Id = "id",
    /** column name */
    IncludeUnauthenticated = "includeUnauthenticated",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "InputType" */
export type InputType = {
    __typename?: "InputType";
    /** An array relationship */
    broadcastContentItems: Array<BroadcastContentItem>;
    /** An aggregated array relationship */
    broadcastContentItems_aggregate: BroadcastContentItem_Aggregate;
    description: Scalars["String"];
    name: Scalars["String"];
};

/** columns and relationships of "InputType" */
export type InputTypeBroadcastContentItemsArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** columns and relationships of "InputType" */
export type InputTypeBroadcastContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** aggregated selection of "InputType" */
export type InputType_Aggregate = {
    __typename?: "InputType_aggregate";
    aggregate?: Maybe<InputType_Aggregate_Fields>;
    nodes: Array<InputType>;
};

/** aggregate fields of "InputType" */
export type InputType_Aggregate_Fields = {
    __typename?: "InputType_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<InputType_Max_Fields>;
    min?: Maybe<InputType_Min_Fields>;
};

/** aggregate fields of "InputType" */
export type InputType_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<InputType_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "InputType" */
export type InputType_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<InputType_Max_Order_By>;
    min?: Maybe<InputType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "InputType" */
export type InputType_Arr_Rel_Insert_Input = {
    data: Array<InputType_Insert_Input>;
    on_conflict?: Maybe<InputType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "InputType". All fields are combined with a logical 'AND'. */
export type InputType_Bool_Exp = {
    _and?: Maybe<Array<Maybe<InputType_Bool_Exp>>>;
    _not?: Maybe<InputType_Bool_Exp>;
    _or?: Maybe<Array<Maybe<InputType_Bool_Exp>>>;
    broadcastContentItems?: Maybe<BroadcastContentItem_Bool_Exp>;
    description?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "InputType" */
export enum InputType_Constraint {
    /** unique or primary key constraint */
    InputTypeNamePkey = "InputTypeName_pkey",
}

export enum InputType_Enum {
    /** GIF image. */
    Gif = "GIF",
    /** JPEG image (jay-peg). */
    Jpeg = "JPEG",
    /** MP4 video file. */
    Mp4 = "MP4",
    /** PNG image. */
    Png = "PNG",
    /** RTMP stream in push mode. */
    RtmpPush = "RTMP_PUSH",
}

/** expression to compare columns of type InputType_enum. All fields are combined with logical 'AND'. */
export type InputType_Enum_Comparison_Exp = {
    _eq?: Maybe<InputType_Enum>;
    _in?: Maybe<Array<InputType_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<InputType_Enum>;
    _nin?: Maybe<Array<InputType_Enum>>;
};

/** input type for inserting data into table "InputType" */
export type InputType_Insert_Input = {
    broadcastContentItems?: Maybe<BroadcastContentItem_Arr_Rel_Insert_Input>;
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type InputType_Max_Fields = {
    __typename?: "InputType_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "InputType" */
export type InputType_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type InputType_Min_Fields = {
    __typename?: "InputType_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "InputType" */
export type InputType_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "InputType" */
export type InputType_Mutation_Response = {
    __typename?: "InputType_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<InputType>;
};

/** input type for inserting object relation for remote table "InputType" */
export type InputType_Obj_Rel_Insert_Input = {
    data: InputType_Insert_Input;
    on_conflict?: Maybe<InputType_On_Conflict>;
};

/** on conflict condition type for table "InputType" */
export type InputType_On_Conflict = {
    constraint: InputType_Constraint;
    update_columns: Array<InputType_Update_Column>;
    where?: Maybe<InputType_Bool_Exp>;
};

/** ordering options when selecting data from "InputType" */
export type InputType_Order_By = {
    broadcastContentItems_aggregate?: Maybe<BroadcastContentItem_Aggregate_Order_By>;
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** primary key columns input for table: "InputType" */
export type InputType_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "InputType" */
export enum InputType_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "InputType" */
export type InputType_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "InputType" */
export enum InputType_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** expression to compare columns of type Int. All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
    _eq?: Maybe<Scalars["Int"]>;
    _gt?: Maybe<Scalars["Int"]>;
    _gte?: Maybe<Scalars["Int"]>;
    _in?: Maybe<Array<Scalars["Int"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["Int"]>;
    _lte?: Maybe<Scalars["Int"]>;
    _neq?: Maybe<Scalars["Int"]>;
    _nin?: Maybe<Array<Scalars["Int"]>>;
};

/** columns and relationships of "Invitation" */
export type Invitation = {
    __typename?: "Invitation";
    /** An object relationship */
    attendee: Attendee;
    attendeeId: Scalars["uuid"];
    confirmationCode?: Maybe<Scalars["uuid"]>;
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    emails: Array<Email>;
    /** An aggregated array relationship */
    emails_aggregate: Email_Aggregate;
    /** A computed field, executes function "invitationhash" */
    hash?: Maybe<Scalars["String"]>;
    id: Scalars["uuid"];
    inviteCode: Scalars["uuid"];
    invitedEmailAddress: Scalars["String"];
    linkToUserId?: Maybe<Scalars["String"]>;
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user?: Maybe<User>;
};

/** columns and relationships of "Invitation" */
export type InvitationEmailsArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** columns and relationships of "Invitation" */
export type InvitationEmails_AggregateArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

export type InvitationConfirmationEmailInput = {
    inviteCode: Scalars["uuid"];
};

export type InvitationConfirmationEmailOutput = {
    __typename?: "InvitationConfirmationEmailOutput";
    sent: Scalars["Boolean"];
};

export type InvitationSendEmailResult = {
    __typename?: "InvitationSendEmailResult";
    attendeeId: Scalars["String"];
    sent: Scalars["Boolean"];
};

/** aggregated selection of "Invitation" */
export type Invitation_Aggregate = {
    __typename?: "Invitation_aggregate";
    aggregate?: Maybe<Invitation_Aggregate_Fields>;
    nodes: Array<Invitation>;
};

/** aggregate fields of "Invitation" */
export type Invitation_Aggregate_Fields = {
    __typename?: "Invitation_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Invitation_Max_Fields>;
    min?: Maybe<Invitation_Min_Fields>;
};

/** aggregate fields of "Invitation" */
export type Invitation_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Invitation_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Invitation" */
export type Invitation_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Invitation_Max_Order_By>;
    min?: Maybe<Invitation_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Invitation" */
export type Invitation_Arr_Rel_Insert_Input = {
    data: Array<Invitation_Insert_Input>;
    on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Invitation". All fields are combined with a logical 'AND'. */
export type Invitation_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Invitation_Bool_Exp>>>;
    _not?: Maybe<Invitation_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Invitation_Bool_Exp>>>;
    attendee?: Maybe<Attendee_Bool_Exp>;
    attendeeId?: Maybe<Uuid_Comparison_Exp>;
    confirmationCode?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    emails?: Maybe<Email_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    inviteCode?: Maybe<Uuid_Comparison_Exp>;
    invitedEmailAddress?: Maybe<String_Comparison_Exp>;
    linkToUserId?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
};

/** unique or primary key constraints on table "Invitation" */
export enum Invitation_Constraint {
    /** unique or primary key constraint */
    InivitationAttendeeIdKey = "Inivitation_attendeeId_key",
    /** unique or primary key constraint */
    InivitationConfirmationCodeKey = "Inivitation_confirmationCode_key",
    /** unique or primary key constraint */
    InivitationInviteCodeKey = "Inivitation_inviteCode_key",
    /** unique or primary key constraint */
    InivitationPkey = "Inivitation_pkey",
}

/** input type for inserting data into table "Invitation" */
export type Invitation_Insert_Input = {
    attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    confirmationCode?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    emails?: Maybe<Email_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    inviteCode?: Maybe<Scalars["uuid"]>;
    invitedEmailAddress?: Maybe<Scalars["String"]>;
    linkToUserId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Invitation_Max_Fields = {
    __typename?: "Invitation_max_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    confirmationCode?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    inviteCode?: Maybe<Scalars["uuid"]>;
    invitedEmailAddress?: Maybe<Scalars["String"]>;
    linkToUserId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Invitation" */
export type Invitation_Max_Order_By = {
    attendeeId?: Maybe<Order_By>;
    confirmationCode?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    inviteCode?: Maybe<Order_By>;
    invitedEmailAddress?: Maybe<Order_By>;
    linkToUserId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Invitation_Min_Fields = {
    __typename?: "Invitation_min_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    confirmationCode?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    inviteCode?: Maybe<Scalars["uuid"]>;
    invitedEmailAddress?: Maybe<Scalars["String"]>;
    linkToUserId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Invitation" */
export type Invitation_Min_Order_By = {
    attendeeId?: Maybe<Order_By>;
    confirmationCode?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    inviteCode?: Maybe<Order_By>;
    invitedEmailAddress?: Maybe<Order_By>;
    linkToUserId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Invitation" */
export type Invitation_Mutation_Response = {
    __typename?: "Invitation_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Invitation>;
};

/** input type for inserting object relation for remote table "Invitation" */
export type Invitation_Obj_Rel_Insert_Input = {
    data: Invitation_Insert_Input;
    on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** on conflict condition type for table "Invitation" */
export type Invitation_On_Conflict = {
    constraint: Invitation_Constraint;
    update_columns: Array<Invitation_Update_Column>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** ordering options when selecting data from "Invitation" */
export type Invitation_Order_By = {
    attendee?: Maybe<Attendee_Order_By>;
    attendeeId?: Maybe<Order_By>;
    confirmationCode?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    emails_aggregate?: Maybe<Email_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    inviteCode?: Maybe<Order_By>;
    invitedEmailAddress?: Maybe<Order_By>;
    linkToUserId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
};

/** primary key columns input for table: "Invitation" */
export type Invitation_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Invitation" */
export enum Invitation_Select_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConfirmationCode = "confirmationCode",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    InviteCode = "inviteCode",
    /** column name */
    InvitedEmailAddress = "invitedEmailAddress",
    /** column name */
    LinkToUserId = "linkToUserId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Invitation" */
export type Invitation_Set_Input = {
    attendeeId?: Maybe<Scalars["uuid"]>;
    confirmationCode?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    inviteCode?: Maybe<Scalars["uuid"]>;
    invitedEmailAddress?: Maybe<Scalars["String"]>;
    linkToUserId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Invitation" */
export enum Invitation_Update_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConfirmationCode = "confirmationCode",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    InviteCode = "inviteCode",
    /** column name */
    InvitedEmailAddress = "invitedEmailAddress",
    /** column name */
    LinkToUserId = "linkToUserId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "JobStatus" */
export type JobStatus = {
    __typename?: "JobStatus";
    description: Scalars["String"];
    name: Scalars["String"];
};

/** aggregated selection of "JobStatus" */
export type JobStatus_Aggregate = {
    __typename?: "JobStatus_aggregate";
    aggregate?: Maybe<JobStatus_Aggregate_Fields>;
    nodes: Array<JobStatus>;
};

/** aggregate fields of "JobStatus" */
export type JobStatus_Aggregate_Fields = {
    __typename?: "JobStatus_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<JobStatus_Max_Fields>;
    min?: Maybe<JobStatus_Min_Fields>;
};

/** aggregate fields of "JobStatus" */
export type JobStatus_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<JobStatus_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "JobStatus" */
export type JobStatus_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<JobStatus_Max_Order_By>;
    min?: Maybe<JobStatus_Min_Order_By>;
};

/** input type for inserting array relation for remote table "JobStatus" */
export type JobStatus_Arr_Rel_Insert_Input = {
    data: Array<JobStatus_Insert_Input>;
    on_conflict?: Maybe<JobStatus_On_Conflict>;
};

/** Boolean expression to filter rows from the table "JobStatus". All fields are combined with a logical 'AND'. */
export type JobStatus_Bool_Exp = {
    _and?: Maybe<Array<Maybe<JobStatus_Bool_Exp>>>;
    _not?: Maybe<JobStatus_Bool_Exp>;
    _or?: Maybe<Array<Maybe<JobStatus_Bool_Exp>>>;
    description?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "JobStatus" */
export enum JobStatus_Constraint {
    /** unique or primary key constraint */
    JobStatusPkey = "JobStatus_pkey",
}

export enum JobStatus_Enum {
    /** Job completed successfully. */
    Completed = "COMPLETED",
    /** Job failed during execution. */
    Failed = "FAILED",
    /** Job is currently in progress. */
    InProgress = "IN_PROGRESS",
    /** Job has not yet started execution. */
    New = "NEW",
}

/** expression to compare columns of type JobStatus_enum. All fields are combined with logical 'AND'. */
export type JobStatus_Enum_Comparison_Exp = {
    _eq?: Maybe<JobStatus_Enum>;
    _in?: Maybe<Array<JobStatus_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<JobStatus_Enum>;
    _nin?: Maybe<Array<JobStatus_Enum>>;
};

/** input type for inserting data into table "JobStatus" */
export type JobStatus_Insert_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type JobStatus_Max_Fields = {
    __typename?: "JobStatus_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "JobStatus" */
export type JobStatus_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type JobStatus_Min_Fields = {
    __typename?: "JobStatus_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "JobStatus" */
export type JobStatus_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "JobStatus" */
export type JobStatus_Mutation_Response = {
    __typename?: "JobStatus_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<JobStatus>;
};

/** input type for inserting object relation for remote table "JobStatus" */
export type JobStatus_Obj_Rel_Insert_Input = {
    data: JobStatus_Insert_Input;
    on_conflict?: Maybe<JobStatus_On_Conflict>;
};

/** on conflict condition type for table "JobStatus" */
export type JobStatus_On_Conflict = {
    constraint: JobStatus_Constraint;
    update_columns: Array<JobStatus_Update_Column>;
    where?: Maybe<JobStatus_Bool_Exp>;
};

/** ordering options when selecting data from "JobStatus" */
export type JobStatus_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** primary key columns input for table: "JobStatus" */
export type JobStatus_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "JobStatus" */
export enum JobStatus_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "JobStatus" */
export type JobStatus_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "JobStatus" */
export enum JobStatus_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** columns and relationships of "OnlineStatus" */
export type OnlineStatus = {
    __typename?: "OnlineStatus";
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    isIncognito: Scalars["Boolean"];
    lastSeen: Scalars["timestamptz"];
    updatedAt: Scalars["timestamptz"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "OnlineStatus" */
export type OnlineStatus_Aggregate = {
    __typename?: "OnlineStatus_aggregate";
    aggregate?: Maybe<OnlineStatus_Aggregate_Fields>;
    nodes: Array<OnlineStatus>;
};

/** aggregate fields of "OnlineStatus" */
export type OnlineStatus_Aggregate_Fields = {
    __typename?: "OnlineStatus_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<OnlineStatus_Max_Fields>;
    min?: Maybe<OnlineStatus_Min_Fields>;
};

/** aggregate fields of "OnlineStatus" */
export type OnlineStatus_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<OnlineStatus_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "OnlineStatus" */
export type OnlineStatus_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<OnlineStatus_Max_Order_By>;
    min?: Maybe<OnlineStatus_Min_Order_By>;
};

/** input type for inserting array relation for remote table "OnlineStatus" */
export type OnlineStatus_Arr_Rel_Insert_Input = {
    data: Array<OnlineStatus_Insert_Input>;
    on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** Boolean expression to filter rows from the table "OnlineStatus". All fields are combined with a logical 'AND'. */
export type OnlineStatus_Bool_Exp = {
    _and?: Maybe<Array<Maybe<OnlineStatus_Bool_Exp>>>;
    _not?: Maybe<OnlineStatus_Bool_Exp>;
    _or?: Maybe<Array<Maybe<OnlineStatus_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    isIncognito?: Maybe<Boolean_Comparison_Exp>;
    lastSeen?: Maybe<Timestamptz_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "OnlineStatus" */
export enum OnlineStatus_Constraint {
    /** unique or primary key constraint */
    OnlineStatusPkey = "OnlineStatus_pkey",
    /** unique or primary key constraint */
    OnlineStatusUserIdKey = "OnlineStatus_userId_key",
}

/** input type for inserting data into table "OnlineStatus" */
export type OnlineStatus_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    isIncognito?: Maybe<Scalars["Boolean"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type OnlineStatus_Max_Fields = {
    __typename?: "OnlineStatus_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "OnlineStatus" */
export type OnlineStatus_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type OnlineStatus_Min_Fields = {
    __typename?: "OnlineStatus_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "OnlineStatus" */
export type OnlineStatus_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "OnlineStatus" */
export type OnlineStatus_Mutation_Response = {
    __typename?: "OnlineStatus_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<OnlineStatus>;
};

/** input type for inserting object relation for remote table "OnlineStatus" */
export type OnlineStatus_Obj_Rel_Insert_Input = {
    data: OnlineStatus_Insert_Input;
    on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** on conflict condition type for table "OnlineStatus" */
export type OnlineStatus_On_Conflict = {
    constraint: OnlineStatus_Constraint;
    update_columns: Array<OnlineStatus_Update_Column>;
    where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** ordering options when selecting data from "OnlineStatus" */
export type OnlineStatus_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    isIncognito?: Maybe<Order_By>;
    lastSeen?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "OnlineStatus" */
export type OnlineStatus_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "OnlineStatus" */
export enum OnlineStatus_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    IsIncognito = "isIncognito",
    /** column name */
    LastSeen = "lastSeen",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "OnlineStatus" */
export type OnlineStatus_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    isIncognito?: Maybe<Scalars["Boolean"]>;
    lastSeen?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "OnlineStatus" */
export enum OnlineStatus_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    IsIncognito = "isIncognito",
    /** column name */
    LastSeen = "lastSeen",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    UserId = "userId",
}

/** columns and relationships of "OriginatingData" */
export type OriginatingData = {
    __typename?: "OriginatingData";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An array relationship */
    contentGroups: Array<ContentGroup>;
    /** An aggregated array relationship */
    contentGroups_aggregate: ContentGroup_Aggregate;
    /** An array relationship */
    contentItems: Array<ContentItem>;
    /** An aggregated array relationship */
    contentItems_aggregate: ContentItem_Aggregate;
    /** An array relationship */
    contentPeople: Array<ContentPerson>;
    /** An aggregated array relationship */
    contentPeople_aggregate: ContentPerson_Aggregate;
    createdAt: Scalars["timestamptz"];
    data?: Maybe<Scalars["jsonb"]>;
    /** An array relationship */
    eventPeople: Array<EventPerson>;
    /** An aggregated array relationship */
    eventPeople_aggregate: EventPerson_Aggregate;
    /** An array relationship */
    events: Array<Event>;
    /** An aggregated array relationship */
    events_aggregate: Event_Aggregate;
    id: Scalars["uuid"];
    /** An array relationship */
    requiredContentItems: Array<RequiredContentItem>;
    /** An aggregated array relationship */
    requiredContentItems_aggregate: RequiredContentItem_Aggregate;
    /** An array relationship */
    rooms: Array<Room>;
    /** An aggregated array relationship */
    rooms_aggregate: Room_Aggregate;
    sourceId: Scalars["String"];
    /** An array relationship */
    tags: Array<Tag>;
    /** An aggregated array relationship */
    tags_aggregate: Tag_Aggregate;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentGroupsArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentGroups_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentItemsArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentPeopleArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataDataArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventPeopleArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventPeople_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventsArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataEvents_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataRequiredContentItemsArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataRequiredContentItems_AggregateArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataRoomsArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataRooms_AggregateArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataTagsArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** columns and relationships of "OriginatingData" */
export type OriginatingDataTags_AggregateArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** aggregated selection of "OriginatingData" */
export type OriginatingData_Aggregate = {
    __typename?: "OriginatingData_aggregate";
    aggregate?: Maybe<OriginatingData_Aggregate_Fields>;
    nodes: Array<OriginatingData>;
};

/** aggregate fields of "OriginatingData" */
export type OriginatingData_Aggregate_Fields = {
    __typename?: "OriginatingData_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<OriginatingData_Max_Fields>;
    min?: Maybe<OriginatingData_Min_Fields>;
};

/** aggregate fields of "OriginatingData" */
export type OriginatingData_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<OriginatingData_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "OriginatingData" */
export type OriginatingData_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<OriginatingData_Max_Order_By>;
    min?: Maybe<OriginatingData_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type OriginatingData_Append_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "OriginatingData" */
export type OriginatingData_Arr_Rel_Insert_Input = {
    data: Array<OriginatingData_Insert_Input>;
    on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** Boolean expression to filter rows from the table "OriginatingData". All fields are combined with a logical 'AND'. */
export type OriginatingData_Bool_Exp = {
    _and?: Maybe<Array<Maybe<OriginatingData_Bool_Exp>>>;
    _not?: Maybe<OriginatingData_Bool_Exp>;
    _or?: Maybe<Array<Maybe<OriginatingData_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroups?: Maybe<ContentGroup_Bool_Exp>;
    contentItems?: Maybe<ContentItem_Bool_Exp>;
    contentPeople?: Maybe<ContentPerson_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    data?: Maybe<Jsonb_Comparison_Exp>;
    eventPeople?: Maybe<EventPerson_Bool_Exp>;
    events?: Maybe<Event_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
    rooms?: Maybe<Room_Bool_Exp>;
    sourceId?: Maybe<String_Comparison_Exp>;
    tags?: Maybe<Tag_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "OriginatingData" */
export enum OriginatingData_Constraint {
    /** unique or primary key constraint */
    OriginatingDataPkey = "OriginatingData_pkey",
    /** unique or primary key constraint */
    OriginatingDataSourceIdConferenceIdKey = "OriginatingData_sourceId_conferenceId_key",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type OriginatingData_Delete_At_Path_Input = {
    data?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type OriginatingData_Delete_Elem_Input = {
    data?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type OriginatingData_Delete_Key_Input = {
    data?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "OriginatingData" */
export type OriginatingData_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
    contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
    contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
    events?: Maybe<Event_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
    rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
    sourceId?: Maybe<Scalars["String"]>;
    tags?: Maybe<Tag_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type OriginatingData_Max_Fields = {
    __typename?: "OriginatingData_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    sourceId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "OriginatingData" */
export type OriginatingData_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    sourceId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type OriginatingData_Min_Fields = {
    __typename?: "OriginatingData_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    sourceId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "OriginatingData" */
export type OriginatingData_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    sourceId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "OriginatingData" */
export type OriginatingData_Mutation_Response = {
    __typename?: "OriginatingData_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<OriginatingData>;
};

/** input type for inserting object relation for remote table "OriginatingData" */
export type OriginatingData_Obj_Rel_Insert_Input = {
    data: OriginatingData_Insert_Input;
    on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** on conflict condition type for table "OriginatingData" */
export type OriginatingData_On_Conflict = {
    constraint: OriginatingData_Constraint;
    update_columns: Array<OriginatingData_Update_Column>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** ordering options when selecting data from "OriginatingData" */
export type OriginatingData_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
    contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
    contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    data?: Maybe<Order_By>;
    eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
    events_aggregate?: Maybe<Event_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
    rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
    sourceId?: Maybe<Order_By>;
    tags_aggregate?: Maybe<Tag_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "OriginatingData" */
export type OriginatingData_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type OriginatingData_Prepend_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "OriginatingData" */
export enum OriginatingData_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    SourceId = "sourceId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "OriginatingData" */
export type OriginatingData_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    id?: Maybe<Scalars["uuid"]>;
    sourceId?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "OriginatingData" */
export enum OriginatingData_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    SourceId = "sourceId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Permission" */
export type Permission = {
    __typename?: "Permission";
    description: Scalars["String"];
    name: Scalars["String"];
    /** An array relationship */
    rolePermissions: Array<RolePermission>;
    /** An aggregated array relationship */
    rolePermissions_aggregate: RolePermission_Aggregate;
};

/** columns and relationships of "Permission" */
export type PermissionRolePermissionsArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** columns and relationships of "Permission" */
export type PermissionRolePermissions_AggregateArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** aggregated selection of "Permission" */
export type Permission_Aggregate = {
    __typename?: "Permission_aggregate";
    aggregate?: Maybe<Permission_Aggregate_Fields>;
    nodes: Array<Permission>;
};

/** aggregate fields of "Permission" */
export type Permission_Aggregate_Fields = {
    __typename?: "Permission_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Permission_Max_Fields>;
    min?: Maybe<Permission_Min_Fields>;
};

/** aggregate fields of "Permission" */
export type Permission_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Permission_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Permission" */
export type Permission_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Permission_Max_Order_By>;
    min?: Maybe<Permission_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Permission" */
export type Permission_Arr_Rel_Insert_Input = {
    data: Array<Permission_Insert_Input>;
    on_conflict?: Maybe<Permission_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Permission". All fields are combined with a logical 'AND'. */
export type Permission_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Permission_Bool_Exp>>>;
    _not?: Maybe<Permission_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Permission_Bool_Exp>>>;
    description?: Maybe<String_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    rolePermissions?: Maybe<RolePermission_Bool_Exp>;
};

/** unique or primary key constraints on table "Permission" */
export enum Permission_Constraint {
    /** unique or primary key constraint */
    PermissionPkey = "Permission_pkey",
}

export enum Permission_Enum {
    /** Manage (create/update/delete) conference attendees. */
    ConferenceManageAttendees = "CONFERENCE_MANAGE_ATTENDEES",
    /** Manage Content tables. */
    ConferenceManageContent = "CONFERENCE_MANAGE_CONTENT",
    /** Manage groups of a conference. */
    ConferenceManageGroups = "CONFERENCE_MANAGE_GROUPS",
    /** Manage (update only) conference name, short name and slug. */
    ConferenceManageName = "CONFERENCE_MANAGE_NAME",
    /** Manage roles of a conference. */
    ConferenceManageRoles = "CONFERENCE_MANAGE_ROLES",
    /** Manage Schedule tables. */
    ConferenceManageSchedule = "CONFERENCE_MANAGE_SCHEDULE",
    /** Moderate (update only) conference attendees. */
    ConferenceModerateAttendees = "CONFERENCE_MODERATE_ATTENDEES",
    /** View the conference. */
    ConferenceView = "CONFERENCE_VIEW",
    /** View conference active attendees. */
    ConferenceViewAttendees = "CONFERENCE_VIEW_ATTENDEES",
}

/** expression to compare columns of type Permission_enum. All fields are combined with logical 'AND'. */
export type Permission_Enum_Comparison_Exp = {
    _eq?: Maybe<Permission_Enum>;
    _in?: Maybe<Array<Permission_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<Permission_Enum>;
    _nin?: Maybe<Array<Permission_Enum>>;
};

/** input type for inserting data into table "Permission" */
export type Permission_Insert_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
    rolePermissions?: Maybe<RolePermission_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Permission_Max_Fields = {
    __typename?: "Permission_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Permission" */
export type Permission_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Permission_Min_Fields = {
    __typename?: "Permission_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Permission" */
export type Permission_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "Permission" */
export type Permission_Mutation_Response = {
    __typename?: "Permission_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Permission>;
};

/** input type for inserting object relation for remote table "Permission" */
export type Permission_Obj_Rel_Insert_Input = {
    data: Permission_Insert_Input;
    on_conflict?: Maybe<Permission_On_Conflict>;
};

/** on conflict condition type for table "Permission" */
export type Permission_On_Conflict = {
    constraint: Permission_Constraint;
    update_columns: Array<Permission_Update_Column>;
    where?: Maybe<Permission_Bool_Exp>;
};

/** ordering options when selecting data from "Permission" */
export type Permission_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    rolePermissions_aggregate?: Maybe<RolePermission_Aggregate_Order_By>;
};

/** primary key columns input for table: "Permission" */
export type Permission_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "Permission" */
export enum Permission_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "Permission" */
export type Permission_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "Permission" */
export enum Permission_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** columns and relationships of "PinnedChat" */
export type PinnedChat = {
    __typename?: "PinnedChat";
    /** An object relationship */
    chat: Chat;
    chatId: Scalars["uuid"];
    id: Scalars["uuid"];
    manual: Scalars["Boolean"];
    /** An object relationship */
    user: User;
    userId: Scalars["String"];
};

/** aggregated selection of "PinnedChat" */
export type PinnedChat_Aggregate = {
    __typename?: "PinnedChat_aggregate";
    aggregate?: Maybe<PinnedChat_Aggregate_Fields>;
    nodes: Array<PinnedChat>;
};

/** aggregate fields of "PinnedChat" */
export type PinnedChat_Aggregate_Fields = {
    __typename?: "PinnedChat_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<PinnedChat_Max_Fields>;
    min?: Maybe<PinnedChat_Min_Fields>;
};

/** aggregate fields of "PinnedChat" */
export type PinnedChat_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<PinnedChat_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "PinnedChat" */
export type PinnedChat_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<PinnedChat_Max_Order_By>;
    min?: Maybe<PinnedChat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "PinnedChat" */
export type PinnedChat_Arr_Rel_Insert_Input = {
    data: Array<PinnedChat_Insert_Input>;
    on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "PinnedChat". All fields are combined with a logical 'AND'. */
export type PinnedChat_Bool_Exp = {
    _and?: Maybe<Array<Maybe<PinnedChat_Bool_Exp>>>;
    _not?: Maybe<PinnedChat_Bool_Exp>;
    _or?: Maybe<Array<Maybe<PinnedChat_Bool_Exp>>>;
    chat?: Maybe<Chat_Bool_Exp>;
    chatId?: Maybe<Uuid_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    manual?: Maybe<Boolean_Comparison_Exp>;
    user?: Maybe<User_Bool_Exp>;
    userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "PinnedChat" */
export enum PinnedChat_Constraint {
    /** unique or primary key constraint */
    PinnedChatChatIdUserIdKey = "PinnedChat_chatId_userId_key",
    /** unique or primary key constraint */
    PinnedChatPkey = "PinnedChat_pkey",
}

/** input type for inserting data into table "PinnedChat" */
export type PinnedChat_Insert_Input = {
    chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    manual?: Maybe<Scalars["Boolean"]>;
    user?: Maybe<User_Obj_Rel_Insert_Input>;
    userId?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type PinnedChat_Max_Fields = {
    __typename?: "PinnedChat_max_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "PinnedChat" */
export type PinnedChat_Max_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type PinnedChat_Min_Fields = {
    __typename?: "PinnedChat_min_fields";
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "PinnedChat" */
export type PinnedChat_Min_Order_By = {
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "PinnedChat" */
export type PinnedChat_Mutation_Response = {
    __typename?: "PinnedChat_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<PinnedChat>;
};

/** input type for inserting object relation for remote table "PinnedChat" */
export type PinnedChat_Obj_Rel_Insert_Input = {
    data: PinnedChat_Insert_Input;
    on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** on conflict condition type for table "PinnedChat" */
export type PinnedChat_On_Conflict = {
    constraint: PinnedChat_Constraint;
    update_columns: Array<PinnedChat_Update_Column>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** ordering options when selecting data from "PinnedChat" */
export type PinnedChat_Order_By = {
    chat?: Maybe<Chat_Order_By>;
    chatId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    manual?: Maybe<Order_By>;
    user?: Maybe<User_Order_By>;
    userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "PinnedChat" */
export type PinnedChat_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "PinnedChat" */
export enum PinnedChat_Select_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Manual = "manual",
    /** column name */
    UserId = "userId",
}

/** input type for updating data in table "PinnedChat" */
export type PinnedChat_Set_Input = {
    chatId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    manual?: Maybe<Scalars["Boolean"]>;
    userId?: Maybe<Scalars["String"]>;
};

/** update columns of table "PinnedChat" */
export enum PinnedChat_Update_Column {
    /** column name */
    ChatId = "chatId",
    /** column name */
    Id = "id",
    /** column name */
    Manual = "manual",
    /** column name */
    UserId = "userId",
}

export type ProtectedEchoOutput = {
    __typename?: "ProtectedEchoOutput";
    message: Scalars["String"];
};

/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItem = {
    __typename?: "RequiredContentItem";
    accessToken?: Maybe<Scalars["String"]>;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    contentGroup: ContentGroup;
    contentGroupId: Scalars["uuid"];
    /** An object relationship */
    contentItem?: Maybe<ContentItem>;
    /** An object relationship */
    contentType: ContentType;
    contentTypeName: ContentType_Enum;
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt: Scalars["timestamptz"];
    /** An array relationship */
    uploaders: Array<Uploader>;
    /** An aggregated array relationship */
    uploaders_aggregate: Uploader_Aggregate;
};

/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItemUploadersArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItemUploaders_AggregateArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** aggregated selection of "RequiredContentItem" */
export type RequiredContentItem_Aggregate = {
    __typename?: "RequiredContentItem_aggregate";
    aggregate?: Maybe<RequiredContentItem_Aggregate_Fields>;
    nodes: Array<RequiredContentItem>;
};

/** aggregate fields of "RequiredContentItem" */
export type RequiredContentItem_Aggregate_Fields = {
    __typename?: "RequiredContentItem_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<RequiredContentItem_Max_Fields>;
    min?: Maybe<RequiredContentItem_Min_Fields>;
};

/** aggregate fields of "RequiredContentItem" */
export type RequiredContentItem_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<RequiredContentItem_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "RequiredContentItem" */
export type RequiredContentItem_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<RequiredContentItem_Max_Order_By>;
    min?: Maybe<RequiredContentItem_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RequiredContentItem" */
export type RequiredContentItem_Arr_Rel_Insert_Input = {
    data: Array<RequiredContentItem_Insert_Input>;
    on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RequiredContentItem". All fields are combined with a logical 'AND'. */
export type RequiredContentItem_Bool_Exp = {
    _and?: Maybe<Array<Maybe<RequiredContentItem_Bool_Exp>>>;
    _not?: Maybe<RequiredContentItem_Bool_Exp>;
    _or?: Maybe<Array<Maybe<RequiredContentItem_Bool_Exp>>>;
    accessToken?: Maybe<String_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroup?: Maybe<ContentGroup_Bool_Exp>;
    contentGroupId?: Maybe<Uuid_Comparison_Exp>;
    contentItem?: Maybe<ContentItem_Bool_Exp>;
    contentType?: Maybe<ContentType_Bool_Exp>;
    contentTypeName?: Maybe<ContentType_Enum_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    uploaders?: Maybe<Uploader_Bool_Exp>;
};

/** unique or primary key constraints on table "RequiredContentItem" */
export enum RequiredContentItem_Constraint {
    /** unique or primary key constraint */
    RequiredContentItemPkey = "RequiredContentItem_pkey",
}

/** input type for inserting data into table "RequiredContentItem" */
export type RequiredContentItem_Insert_Input = {
    accessToken?: Maybe<Scalars["String"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    contentItem?: Maybe<ContentItem_Obj_Rel_Insert_Input>;
    contentType?: Maybe<ContentType_Obj_Rel_Insert_Input>;
    contentTypeName?: Maybe<ContentType_Enum>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    uploaders?: Maybe<Uploader_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type RequiredContentItem_Max_Fields = {
    __typename?: "RequiredContentItem_max_fields";
    accessToken?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "RequiredContentItem" */
export type RequiredContentItem_Max_Order_By = {
    accessToken?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RequiredContentItem_Min_Fields = {
    __typename?: "RequiredContentItem_min_fields";
    accessToken?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "RequiredContentItem" */
export type RequiredContentItem_Min_Order_By = {
    accessToken?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroupId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RequiredContentItem" */
export type RequiredContentItem_Mutation_Response = {
    __typename?: "RequiredContentItem_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<RequiredContentItem>;
};

/** input type for inserting object relation for remote table "RequiredContentItem" */
export type RequiredContentItem_Obj_Rel_Insert_Input = {
    data: RequiredContentItem_Insert_Input;
    on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** on conflict condition type for table "RequiredContentItem" */
export type RequiredContentItem_On_Conflict = {
    constraint: RequiredContentItem_Constraint;
    update_columns: Array<RequiredContentItem_Update_Column>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "RequiredContentItem" */
export type RequiredContentItem_Order_By = {
    accessToken?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroup?: Maybe<ContentGroup_Order_By>;
    contentGroupId?: Maybe<Order_By>;
    contentItem?: Maybe<ContentItem_Order_By>;
    contentType?: Maybe<ContentType_Order_By>;
    contentTypeName?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    uploaders_aggregate?: Maybe<Uploader_Aggregate_Order_By>;
};

/** primary key columns input for table: "RequiredContentItem" */
export type RequiredContentItem_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "RequiredContentItem" */
export enum RequiredContentItem_Select_Column {
    /** column name */
    AccessToken = "accessToken",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    ContentTypeName = "contentTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "RequiredContentItem" */
export type RequiredContentItem_Set_Input = {
    accessToken?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupId?: Maybe<Scalars["uuid"]>;
    contentTypeName?: Maybe<ContentType_Enum>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "RequiredContentItem" */
export enum RequiredContentItem_Update_Column {
    /** column name */
    AccessToken = "accessToken",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ContentGroupId = "contentGroupId",
    /** column name */
    ContentTypeName = "contentTypeName",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Role" */
export type Role = {
    __typename?: "Role";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    groupRoles: Array<GroupRole>;
    /** An aggregated array relationship */
    groupRoles_aggregate: GroupRole_Aggregate;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An array relationship */
    rolePermissions: Array<RolePermission>;
    /** An aggregated array relationship */
    rolePermissions_aggregate: RolePermission_Aggregate;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Role" */
export type RoleGroupRolesArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** columns and relationships of "Role" */
export type RoleGroupRoles_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** columns and relationships of "Role" */
export type RoleRolePermissionsArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** columns and relationships of "Role" */
export type RoleRolePermissions_AggregateArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** columns and relationships of "RolePermission" */
export type RolePermission = {
    __typename?: "RolePermission";
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    /** An object relationship */
    permission: Permission;
    permissionName: Permission_Enum;
    /** An object relationship */
    role: Role;
    roleId: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "RolePermission" */
export type RolePermission_Aggregate = {
    __typename?: "RolePermission_aggregate";
    aggregate?: Maybe<RolePermission_Aggregate_Fields>;
    nodes: Array<RolePermission>;
};

/** aggregate fields of "RolePermission" */
export type RolePermission_Aggregate_Fields = {
    __typename?: "RolePermission_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<RolePermission_Max_Fields>;
    min?: Maybe<RolePermission_Min_Fields>;
};

/** aggregate fields of "RolePermission" */
export type RolePermission_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<RolePermission_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "RolePermission" */
export type RolePermission_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<RolePermission_Max_Order_By>;
    min?: Maybe<RolePermission_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RolePermission" */
export type RolePermission_Arr_Rel_Insert_Input = {
    data: Array<RolePermission_Insert_Input>;
    on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RolePermission". All fields are combined with a logical 'AND'. */
export type RolePermission_Bool_Exp = {
    _and?: Maybe<Array<Maybe<RolePermission_Bool_Exp>>>;
    _not?: Maybe<RolePermission_Bool_Exp>;
    _or?: Maybe<Array<Maybe<RolePermission_Bool_Exp>>>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    permission?: Maybe<Permission_Bool_Exp>;
    permissionName?: Maybe<Permission_Enum_Comparison_Exp>;
    role?: Maybe<Role_Bool_Exp>;
    roleId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "RolePermission" */
export enum RolePermission_Constraint {
    /** unique or primary key constraint */
    RolePermissionPkey = "RolePermission_pkey",
    /** unique or primary key constraint */
    RolePermissionRoleIdPermissionKey = "RolePermission_roleId_permission_key",
}

/** input type for inserting data into table "RolePermission" */
export type RolePermission_Insert_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    permission?: Maybe<Permission_Obj_Rel_Insert_Input>;
    permissionName?: Maybe<Permission_Enum>;
    role?: Maybe<Role_Obj_Rel_Insert_Input>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type RolePermission_Max_Fields = {
    __typename?: "RolePermission_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "RolePermission" */
export type RolePermission_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RolePermission_Min_Fields = {
    __typename?: "RolePermission_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "RolePermission" */
export type RolePermission_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RolePermission" */
export type RolePermission_Mutation_Response = {
    __typename?: "RolePermission_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<RolePermission>;
};

/** input type for inserting object relation for remote table "RolePermission" */
export type RolePermission_Obj_Rel_Insert_Input = {
    data: RolePermission_Insert_Input;
    on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** on conflict condition type for table "RolePermission" */
export type RolePermission_On_Conflict = {
    constraint: RolePermission_Constraint;
    update_columns: Array<RolePermission_Update_Column>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** ordering options when selecting data from "RolePermission" */
export type RolePermission_Order_By = {
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    permission?: Maybe<Permission_Order_By>;
    permissionName?: Maybe<Order_By>;
    role?: Maybe<Role_Order_By>;
    roleId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "RolePermission" */
export type RolePermission_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "RolePermission" */
export enum RolePermission_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    PermissionName = "permissionName",
    /** column name */
    RoleId = "roleId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "RolePermission" */
export type RolePermission_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    permissionName?: Maybe<Permission_Enum>;
    roleId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "RolePermission" */
export enum RolePermission_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    PermissionName = "permissionName",
    /** column name */
    RoleId = "roleId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregated selection of "Role" */
export type Role_Aggregate = {
    __typename?: "Role_aggregate";
    aggregate?: Maybe<Role_Aggregate_Fields>;
    nodes: Array<Role>;
};

/** aggregate fields of "Role" */
export type Role_Aggregate_Fields = {
    __typename?: "Role_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Role_Max_Fields>;
    min?: Maybe<Role_Min_Fields>;
};

/** aggregate fields of "Role" */
export type Role_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Role_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Role" */
export type Role_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Role_Max_Order_By>;
    min?: Maybe<Role_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Role" */
export type Role_Arr_Rel_Insert_Input = {
    data: Array<Role_Insert_Input>;
    on_conflict?: Maybe<Role_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Role". All fields are combined with a logical 'AND'. */
export type Role_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Role_Bool_Exp>>>;
    _not?: Maybe<Role_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Role_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    groupRoles?: Maybe<GroupRole_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    rolePermissions?: Maybe<RolePermission_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Role" */
export enum Role_Constraint {
    /** unique or primary key constraint */
    RoleConferenceNameKey = "Role_conference_name_key",
    /** unique or primary key constraint */
    RolePkey = "Role_pkey",
}

/** input type for inserting data into table "Role" */
export type Role_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    groupRoles?: Maybe<GroupRole_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    rolePermissions?: Maybe<RolePermission_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Role_Max_Fields = {
    __typename?: "Role_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Role" */
export type Role_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Role_Min_Fields = {
    __typename?: "Role_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Role" */
export type Role_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Role" */
export type Role_Mutation_Response = {
    __typename?: "Role_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Role>;
};

/** input type for inserting object relation for remote table "Role" */
export type Role_Obj_Rel_Insert_Input = {
    data: Role_Insert_Input;
    on_conflict?: Maybe<Role_On_Conflict>;
};

/** on conflict condition type for table "Role" */
export type Role_On_Conflict = {
    constraint: Role_Constraint;
    update_columns: Array<Role_Update_Column>;
    where?: Maybe<Role_Bool_Exp>;
};

/** ordering options when selecting data from "Role" */
export type Role_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    groupRoles_aggregate?: Maybe<GroupRole_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    rolePermissions_aggregate?: Maybe<RolePermission_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Role" */
export type Role_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Role" */
export enum Role_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Role" */
export type Role_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Role" */
export enum Role_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Room" */
export type Room = {
    __typename?: "Room";
    capacity?: Maybe<Scalars["Int"]>;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    created_at: Scalars["timestamptz"];
    /** An object relationship */
    currentMode: RoomMode;
    currentModeName: RoomMode_Enum;
    /** An array relationship */
    events: Array<Event>;
    /** An aggregated array relationship */
    events_aggregate: Event_Aggregate;
    /** An array relationship */
    executedTransitions: Array<ExecutedTransitions>;
    /** An aggregated array relationship */
    executedTransitions_aggregate: ExecutedTransitions_Aggregate;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    /** An array relationship */
    participants: Array<RoomParticipant>;
    /** An aggregated array relationship */
    participants_aggregate: RoomParticipant_Aggregate;
    /** An array relationship */
    transitions: Array<Transitions>;
    /** An aggregated array relationship */
    transitions_aggregate: Transitions_Aggregate;
    updated_at: Scalars["timestamptz"];
};

/** columns and relationships of "Room" */
export type RoomEventsArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomEvents_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomExecutedTransitionsArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomExecutedTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomParticipantsArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomParticipants_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "Room" */
export type RoomTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "RoomMode" */
export type RoomMode = {
    __typename?: "RoomMode";
    description: Scalars["String"];
    /** An array relationship */
    events: Array<Event>;
    /** An aggregated array relationship */
    events_aggregate: Event_Aggregate;
    name: Scalars["String"];
    /** An array relationship */
    rooms: Array<Room>;
    /** An aggregated array relationship */
    rooms_aggregate: Room_Aggregate;
};

/** columns and relationships of "RoomMode" */
export type RoomModeEventsArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "RoomMode" */
export type RoomModeEvents_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** columns and relationships of "RoomMode" */
export type RoomModeRoomsArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "RoomMode" */
export type RoomModeRooms_AggregateArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** aggregated selection of "RoomMode" */
export type RoomMode_Aggregate = {
    __typename?: "RoomMode_aggregate";
    aggregate?: Maybe<RoomMode_Aggregate_Fields>;
    nodes: Array<RoomMode>;
};

/** aggregate fields of "RoomMode" */
export type RoomMode_Aggregate_Fields = {
    __typename?: "RoomMode_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<RoomMode_Max_Fields>;
    min?: Maybe<RoomMode_Min_Fields>;
};

/** aggregate fields of "RoomMode" */
export type RoomMode_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<RoomMode_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "RoomMode" */
export type RoomMode_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<RoomMode_Max_Order_By>;
    min?: Maybe<RoomMode_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RoomMode" */
export type RoomMode_Arr_Rel_Insert_Input = {
    data: Array<RoomMode_Insert_Input>;
    on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RoomMode". All fields are combined with a logical 'AND'. */
export type RoomMode_Bool_Exp = {
    _and?: Maybe<Array<Maybe<RoomMode_Bool_Exp>>>;
    _not?: Maybe<RoomMode_Bool_Exp>;
    _or?: Maybe<Array<Maybe<RoomMode_Bool_Exp>>>;
    description?: Maybe<String_Comparison_Exp>;
    events?: Maybe<Event_Bool_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    rooms?: Maybe<Room_Bool_Exp>;
};

/** unique or primary key constraints on table "RoomMode" */
export enum RoomMode_Constraint {
    /** unique or primary key constraint */
    RoomModePkey = "RoomMode_pkey",
}

export enum RoomMode_Enum {
    /** Users may participate in the general video chat. */
    Breakout = "BREAKOUT",
    /** Pre-recorded content should be played out to attendees. The breakout and Q&A video chats may also be available to relevant users. */
    Prerecorded = "PRERECORDED",
    /** A live presentation should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
    Presentation = "PRESENTATION",
    /** A live Q&A/discussion should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
    QAndA = "Q_AND_A",
}

/** expression to compare columns of type RoomMode_enum. All fields are combined with logical 'AND'. */
export type RoomMode_Enum_Comparison_Exp = {
    _eq?: Maybe<RoomMode_Enum>;
    _in?: Maybe<Array<RoomMode_Enum>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _neq?: Maybe<RoomMode_Enum>;
    _nin?: Maybe<Array<RoomMode_Enum>>;
};

/** input type for inserting data into table "RoomMode" */
export type RoomMode_Insert_Input = {
    description?: Maybe<Scalars["String"]>;
    events?: Maybe<Event_Arr_Rel_Insert_Input>;
    name?: Maybe<Scalars["String"]>;
    rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type RoomMode_Max_Fields = {
    __typename?: "RoomMode_max_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "RoomMode" */
export type RoomMode_Max_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RoomMode_Min_Fields = {
    __typename?: "RoomMode_min_fields";
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "RoomMode" */
export type RoomMode_Min_Order_By = {
    description?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
};

/** response of any mutation on the table "RoomMode" */
export type RoomMode_Mutation_Response = {
    __typename?: "RoomMode_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<RoomMode>;
};

/** input type for inserting object relation for remote table "RoomMode" */
export type RoomMode_Obj_Rel_Insert_Input = {
    data: RoomMode_Insert_Input;
    on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** on conflict condition type for table "RoomMode" */
export type RoomMode_On_Conflict = {
    constraint: RoomMode_Constraint;
    update_columns: Array<RoomMode_Update_Column>;
    where?: Maybe<RoomMode_Bool_Exp>;
};

/** ordering options when selecting data from "RoomMode" */
export type RoomMode_Order_By = {
    description?: Maybe<Order_By>;
    events_aggregate?: Maybe<Event_Aggregate_Order_By>;
    name?: Maybe<Order_By>;
    rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
};

/** primary key columns input for table: "RoomMode" */
export type RoomMode_Pk_Columns_Input = {
    name: Scalars["String"];
};

/** select columns of table "RoomMode" */
export enum RoomMode_Select_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** input type for updating data in table "RoomMode" */
export type RoomMode_Set_Input = {
    description?: Maybe<Scalars["String"]>;
    name?: Maybe<Scalars["String"]>;
};

/** update columns of table "RoomMode" */
export enum RoomMode_Update_Column {
    /** column name */
    Description = "description",
    /** column name */
    Name = "name",
}

/** columns and relationships of "RoomParticipant" */
export type RoomParticipant = {
    __typename?: "RoomParticipant";
    /** An object relationship */
    attendee: Attendee;
    attendeeId: Scalars["uuid"];
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    /** An object relationship */
    room: Room;
    roomId: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "RoomParticipant" */
export type RoomParticipant_Aggregate = {
    __typename?: "RoomParticipant_aggregate";
    aggregate?: Maybe<RoomParticipant_Aggregate_Fields>;
    nodes: Array<RoomParticipant>;
};

/** aggregate fields of "RoomParticipant" */
export type RoomParticipant_Aggregate_Fields = {
    __typename?: "RoomParticipant_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<RoomParticipant_Max_Fields>;
    min?: Maybe<RoomParticipant_Min_Fields>;
};

/** aggregate fields of "RoomParticipant" */
export type RoomParticipant_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<RoomParticipant_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "RoomParticipant" */
export type RoomParticipant_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<RoomParticipant_Max_Order_By>;
    min?: Maybe<RoomParticipant_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RoomParticipant" */
export type RoomParticipant_Arr_Rel_Insert_Input = {
    data: Array<RoomParticipant_Insert_Input>;
    on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RoomParticipant". All fields are combined with a logical 'AND'. */
export type RoomParticipant_Bool_Exp = {
    _and?: Maybe<Array<Maybe<RoomParticipant_Bool_Exp>>>;
    _not?: Maybe<RoomParticipant_Bool_Exp>;
    _or?: Maybe<Array<Maybe<RoomParticipant_Bool_Exp>>>;
    attendee?: Maybe<Attendee_Bool_Exp>;
    attendeeId?: Maybe<Uuid_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    room?: Maybe<Room_Bool_Exp>;
    roomId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "RoomParticipant" */
export enum RoomParticipant_Constraint {
    /** unique or primary key constraint */
    RoomParticipantPkey = "RoomParticipant_pkey",
    /** unique or primary key constraint */
    RoomParticipantRoomIdAttendeeIdKey = "RoomParticipant_roomId_attendeeId_key",
}

/** input type for inserting data into table "RoomParticipant" */
export type RoomParticipant_Insert_Input = {
    attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
    attendeeId?: Maybe<Scalars["uuid"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    room?: Maybe<Room_Obj_Rel_Insert_Input>;
    roomId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type RoomParticipant_Max_Fields = {
    __typename?: "RoomParticipant_max_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "RoomParticipant" */
export type RoomParticipant_Max_Order_By = {
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RoomParticipant_Min_Fields = {
    __typename?: "RoomParticipant_min_fields";
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "RoomParticipant" */
export type RoomParticipant_Min_Order_By = {
    attendeeId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RoomParticipant" */
export type RoomParticipant_Mutation_Response = {
    __typename?: "RoomParticipant_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<RoomParticipant>;
};

/** input type for inserting object relation for remote table "RoomParticipant" */
export type RoomParticipant_Obj_Rel_Insert_Input = {
    data: RoomParticipant_Insert_Input;
    on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** on conflict condition type for table "RoomParticipant" */
export type RoomParticipant_On_Conflict = {
    constraint: RoomParticipant_Constraint;
    update_columns: Array<RoomParticipant_Update_Column>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** ordering options when selecting data from "RoomParticipant" */
export type RoomParticipant_Order_By = {
    attendee?: Maybe<Attendee_Order_By>;
    attendeeId?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    room?: Maybe<Room_Order_By>;
    roomId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "RoomParticipant" */
export type RoomParticipant_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "RoomParticipant" */
export enum RoomParticipant_Select_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "RoomParticipant" */
export type RoomParticipant_Set_Input = {
    attendeeId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "RoomParticipant" */
export enum RoomParticipant_Update_Column {
    /** column name */
    AttendeeId = "attendeeId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregated selection of "Room" */
export type Room_Aggregate = {
    __typename?: "Room_aggregate";
    aggregate?: Maybe<Room_Aggregate_Fields>;
    nodes: Array<Room>;
};

/** aggregate fields of "Room" */
export type Room_Aggregate_Fields = {
    __typename?: "Room_aggregate_fields";
    avg?: Maybe<Room_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Room_Max_Fields>;
    min?: Maybe<Room_Min_Fields>;
    stddev?: Maybe<Room_Stddev_Fields>;
    stddev_pop?: Maybe<Room_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<Room_Stddev_Samp_Fields>;
    sum?: Maybe<Room_Sum_Fields>;
    var_pop?: Maybe<Room_Var_Pop_Fields>;
    var_samp?: Maybe<Room_Var_Samp_Fields>;
    variance?: Maybe<Room_Variance_Fields>;
};

/** aggregate fields of "Room" */
export type Room_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Room_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Room" */
export type Room_Aggregate_Order_By = {
    avg?: Maybe<Room_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<Room_Max_Order_By>;
    min?: Maybe<Room_Min_Order_By>;
    stddev?: Maybe<Room_Stddev_Order_By>;
    stddev_pop?: Maybe<Room_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<Room_Stddev_Samp_Order_By>;
    sum?: Maybe<Room_Sum_Order_By>;
    var_pop?: Maybe<Room_Var_Pop_Order_By>;
    var_samp?: Maybe<Room_Var_Samp_Order_By>;
    variance?: Maybe<Room_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Room" */
export type Room_Arr_Rel_Insert_Input = {
    data: Array<Room_Insert_Input>;
    on_conflict?: Maybe<Room_On_Conflict>;
};

/** aggregate avg on columns */
export type Room_Avg_Fields = {
    __typename?: "Room_avg_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Room" */
export type Room_Avg_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Room". All fields are combined with a logical 'AND'. */
export type Room_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Room_Bool_Exp>>>;
    _not?: Maybe<Room_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Room_Bool_Exp>>>;
    capacity?: Maybe<Int_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    created_at?: Maybe<Timestamptz_Comparison_Exp>;
    currentMode?: Maybe<RoomMode_Bool_Exp>;
    currentModeName?: Maybe<RoomMode_Enum_Comparison_Exp>;
    events?: Maybe<Event_Bool_Exp>;
    executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    participants?: Maybe<RoomParticipant_Bool_Exp>;
    transitions?: Maybe<Transitions_Bool_Exp>;
    updated_at?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Room" */
export enum Room_Constraint {
    /** unique or primary key constraint */
    RoomConferenceIdNameKey = "Room_conferenceId_name_key",
    /** unique or primary key constraint */
    RoomPkey = "Room_pkey",
}

/** input type for incrementing integer column in table "Room" */
export type Room_Inc_Input = {
    capacity?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Room" */
export type Room_Insert_Input = {
    capacity?: Maybe<Scalars["Int"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    currentMode?: Maybe<RoomMode_Obj_Rel_Insert_Input>;
    currentModeName?: Maybe<RoomMode_Enum>;
    events?: Maybe<Event_Arr_Rel_Insert_Input>;
    executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    participants?: Maybe<RoomParticipant_Arr_Rel_Insert_Input>;
    transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Room_Max_Fields = {
    __typename?: "Room_max_fields";
    capacity?: Maybe<Scalars["Int"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Room" */
export type Room_Max_Order_By = {
    capacity?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Room_Min_Fields = {
    __typename?: "Room_min_fields";
    capacity?: Maybe<Scalars["Int"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Room" */
export type Room_Min_Order_By = {
    capacity?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** response of any mutation on the table "Room" */
export type Room_Mutation_Response = {
    __typename?: "Room_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Room>;
};

/** input type for inserting object relation for remote table "Room" */
export type Room_Obj_Rel_Insert_Input = {
    data: Room_Insert_Input;
    on_conflict?: Maybe<Room_On_Conflict>;
};

/** on conflict condition type for table "Room" */
export type Room_On_Conflict = {
    constraint: Room_Constraint;
    update_columns: Array<Room_Update_Column>;
    where?: Maybe<Room_Bool_Exp>;
};

/** ordering options when selecting data from "Room" */
export type Room_Order_By = {
    capacity?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    currentMode?: Maybe<RoomMode_Order_By>;
    currentModeName?: Maybe<Order_By>;
    events_aggregate?: Maybe<Event_Aggregate_Order_By>;
    executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    participants_aggregate?: Maybe<RoomParticipant_Aggregate_Order_By>;
    transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** primary key columns input for table: "Room" */
export type Room_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Room" */
export enum Room_Select_Column {
    /** column name */
    Capacity = "capacity",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    CurrentModeName = "currentModeName",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updated_at",
}

/** input type for updating data in table "Room" */
export type Room_Set_Input = {
    capacity?: Maybe<Scalars["Int"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    currentModeName?: Maybe<RoomMode_Enum>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type Room_Stddev_Fields = {
    __typename?: "Room_stddev_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Room" */
export type Room_Stddev_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Room_Stddev_Pop_Fields = {
    __typename?: "Room_stddev_pop_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Room" */
export type Room_Stddev_Pop_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Room_Stddev_Samp_Fields = {
    __typename?: "Room_stddev_samp_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Room" */
export type Room_Stddev_Samp_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Room_Sum_Fields = {
    __typename?: "Room_sum_fields";
    capacity?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Room" */
export type Room_Sum_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** update columns of table "Room" */
export enum Room_Update_Column {
    /** column name */
    Capacity = "capacity",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    CurrentModeName = "currentModeName",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updated_at",
}

/** aggregate var_pop on columns */
export type Room_Var_Pop_Fields = {
    __typename?: "Room_var_pop_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Room" */
export type Room_Var_Pop_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Room_Var_Samp_Fields = {
    __typename?: "Room_var_samp_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Room" */
export type Room_Var_Samp_Order_By = {
    capacity?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Room_Variance_Fields = {
    __typename?: "Room_variance_fields";
    capacity?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Room" */
export type Room_Variance_Order_By = {
    capacity?: Maybe<Order_By>;
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

export type SubmitContentItemInput = {
    contentItemData: Scalars["jsonb"];
};

export type SubmitContentItemOutput = {
    __typename?: "SubmitContentItemOutput";
    message: Scalars["String"];
    success: Scalars["Boolean"];
};

export type SubmitUpdatedSubtitlesInput = {
    accessToken: Scalars["String"];
    contentItemId: Scalars["String"];
    subtitleText: Scalars["String"];
};

export type SubmitUpdatedSubtitlesOutput = {
    __typename?: "SubmitUpdatedSubtitlesOutput";
    message: Scalars["String"];
    success: Scalars["Boolean"];
};

/** columns and relationships of "Tag" */
export type Tag = {
    __typename?: "Tag";
    colour: Scalars["String"];
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An array relationship */
    contentGroupTags: Array<ContentGroupTag>;
    /** An aggregated array relationship */
    contentGroupTags_aggregate: ContentGroupTag_Aggregate;
    createdAt: Scalars["timestamptz"];
    /** An array relationship */
    eventTags: Array<EventTag>;
    /** An aggregated array relationship */
    eventTags_aggregate: EventTag_Aggregate;
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    originatingData?: Maybe<OriginatingData>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "Tag" */
export type TagContentGroupTagsArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** columns and relationships of "Tag" */
export type TagContentGroupTags_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** columns and relationships of "Tag" */
export type TagEventTagsArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** columns and relationships of "Tag" */
export type TagEventTags_AggregateArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** aggregated selection of "Tag" */
export type Tag_Aggregate = {
    __typename?: "Tag_aggregate";
    aggregate?: Maybe<Tag_Aggregate_Fields>;
    nodes: Array<Tag>;
};

/** aggregate fields of "Tag" */
export type Tag_Aggregate_Fields = {
    __typename?: "Tag_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Tag_Max_Fields>;
    min?: Maybe<Tag_Min_Fields>;
};

/** aggregate fields of "Tag" */
export type Tag_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Tag_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Tag" */
export type Tag_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Tag_Max_Order_By>;
    min?: Maybe<Tag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Tag" */
export type Tag_Arr_Rel_Insert_Input = {
    data: Array<Tag_Insert_Input>;
    on_conflict?: Maybe<Tag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Tag". All fields are combined with a logical 'AND'. */
export type Tag_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Tag_Bool_Exp>>>;
    _not?: Maybe<Tag_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Tag_Bool_Exp>>>;
    colour?: Maybe<String_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    contentGroupTags?: Maybe<ContentGroupTag_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    eventTags?: Maybe<EventTag_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    originatingData?: Maybe<OriginatingData_Bool_Exp>;
    originatingDataId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Tag" */
export enum Tag_Constraint {
    /** unique or primary key constraint */
    TagPkey = "Tag_pkey",
}

/** input type for inserting data into table "Tag" */
export type Tag_Insert_Input = {
    colour?: Maybe<Scalars["String"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    contentGroupTags?: Maybe<ContentGroupTag_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventTags?: Maybe<EventTag_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Tag_Max_Fields = {
    __typename?: "Tag_max_fields";
    colour?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Tag" */
export type Tag_Max_Order_By = {
    colour?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Tag_Min_Fields = {
    __typename?: "Tag_min_fields";
    colour?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Tag" */
export type Tag_Min_Order_By = {
    colour?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Tag" */
export type Tag_Mutation_Response = {
    __typename?: "Tag_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Tag>;
};

/** input type for inserting object relation for remote table "Tag" */
export type Tag_Obj_Rel_Insert_Input = {
    data: Tag_Insert_Input;
    on_conflict?: Maybe<Tag_On_Conflict>;
};

/** on conflict condition type for table "Tag" */
export type Tag_On_Conflict = {
    constraint: Tag_Constraint;
    update_columns: Array<Tag_Update_Column>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** ordering options when selecting data from "Tag" */
export type Tag_Order_By = {
    colour?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    contentGroupTags_aggregate?: Maybe<ContentGroupTag_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    eventTags_aggregate?: Maybe<EventTag_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    originatingData?: Maybe<OriginatingData_Order_By>;
    originatingDataId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Tag" */
export type Tag_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Tag" */
export enum Tag_Select_Column {
    /** column name */
    Colour = "colour",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Tag" */
export type Tag_Set_Input = {
    colour?: Maybe<Scalars["String"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    originatingDataId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Tag" */
export enum Tag_Update_Column {
    /** column name */
    Colour = "colour",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    OriginatingDataId = "originatingDataId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "TranscriptionJob" */
export type TranscriptionJob = {
    __typename?: "TranscriptionJob";
    awsTranscribeJobName: Scalars["String"];
    contentItemId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    id: Scalars["uuid"];
    languageCode: Scalars["String"];
    transcriptionS3Url: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
    videoS3Url: Scalars["String"];
};

/** aggregated selection of "TranscriptionJob" */
export type TranscriptionJob_Aggregate = {
    __typename?: "TranscriptionJob_aggregate";
    aggregate?: Maybe<TranscriptionJob_Aggregate_Fields>;
    nodes: Array<TranscriptionJob>;
};

/** aggregate fields of "TranscriptionJob" */
export type TranscriptionJob_Aggregate_Fields = {
    __typename?: "TranscriptionJob_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<TranscriptionJob_Max_Fields>;
    min?: Maybe<TranscriptionJob_Min_Fields>;
};

/** aggregate fields of "TranscriptionJob" */
export type TranscriptionJob_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<TranscriptionJob_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "TranscriptionJob" */
export type TranscriptionJob_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<TranscriptionJob_Max_Order_By>;
    min?: Maybe<TranscriptionJob_Min_Order_By>;
};

/** input type for inserting array relation for remote table "TranscriptionJob" */
export type TranscriptionJob_Arr_Rel_Insert_Input = {
    data: Array<TranscriptionJob_Insert_Input>;
    on_conflict?: Maybe<TranscriptionJob_On_Conflict>;
};

/** Boolean expression to filter rows from the table "TranscriptionJob". All fields are combined with a logical 'AND'. */
export type TranscriptionJob_Bool_Exp = {
    _and?: Maybe<Array<Maybe<TranscriptionJob_Bool_Exp>>>;
    _not?: Maybe<TranscriptionJob_Bool_Exp>;
    _or?: Maybe<Array<Maybe<TranscriptionJob_Bool_Exp>>>;
    awsTranscribeJobName?: Maybe<String_Comparison_Exp>;
    contentItemId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    languageCode?: Maybe<String_Comparison_Exp>;
    transcriptionS3Url?: Maybe<String_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    videoS3Url?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "TranscriptionJob" */
export enum TranscriptionJob_Constraint {
    /** unique or primary key constraint */
    TranscriptionJobAwsTranscribeJobNameKey = "TranscriptionJob_awsTranscribeJobName_key",
    /** unique or primary key constraint */
    TranscriptionJobPkey = "TranscriptionJob_pkey",
}

/** input type for inserting data into table "TranscriptionJob" */
export type TranscriptionJob_Insert_Input = {
    awsTranscribeJobName?: Maybe<Scalars["String"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    languageCode?: Maybe<Scalars["String"]>;
    transcriptionS3Url?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    videoS3Url?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type TranscriptionJob_Max_Fields = {
    __typename?: "TranscriptionJob_max_fields";
    awsTranscribeJobName?: Maybe<Scalars["String"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    languageCode?: Maybe<Scalars["String"]>;
    transcriptionS3Url?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    videoS3Url?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "TranscriptionJob" */
export type TranscriptionJob_Max_Order_By = {
    awsTranscribeJobName?: Maybe<Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    languageCode?: Maybe<Order_By>;
    transcriptionS3Url?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    videoS3Url?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type TranscriptionJob_Min_Fields = {
    __typename?: "TranscriptionJob_min_fields";
    awsTranscribeJobName?: Maybe<Scalars["String"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    languageCode?: Maybe<Scalars["String"]>;
    transcriptionS3Url?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    videoS3Url?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "TranscriptionJob" */
export type TranscriptionJob_Min_Order_By = {
    awsTranscribeJobName?: Maybe<Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    languageCode?: Maybe<Order_By>;
    transcriptionS3Url?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    videoS3Url?: Maybe<Order_By>;
};

/** response of any mutation on the table "TranscriptionJob" */
export type TranscriptionJob_Mutation_Response = {
    __typename?: "TranscriptionJob_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<TranscriptionJob>;
};

/** input type for inserting object relation for remote table "TranscriptionJob" */
export type TranscriptionJob_Obj_Rel_Insert_Input = {
    data: TranscriptionJob_Insert_Input;
    on_conflict?: Maybe<TranscriptionJob_On_Conflict>;
};

/** on conflict condition type for table "TranscriptionJob" */
export type TranscriptionJob_On_Conflict = {
    constraint: TranscriptionJob_Constraint;
    update_columns: Array<TranscriptionJob_Update_Column>;
    where?: Maybe<TranscriptionJob_Bool_Exp>;
};

/** ordering options when selecting data from "TranscriptionJob" */
export type TranscriptionJob_Order_By = {
    awsTranscribeJobName?: Maybe<Order_By>;
    contentItemId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    languageCode?: Maybe<Order_By>;
    transcriptionS3Url?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
    videoS3Url?: Maybe<Order_By>;
};

/** primary key columns input for table: "TranscriptionJob" */
export type TranscriptionJob_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "TranscriptionJob" */
export enum TranscriptionJob_Select_Column {
    /** column name */
    AwsTranscribeJobName = "awsTranscribeJobName",
    /** column name */
    ContentItemId = "contentItemId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    LanguageCode = "languageCode",
    /** column name */
    TranscriptionS3Url = "transcriptionS3Url",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    VideoS3Url = "videoS3Url",
}

/** input type for updating data in table "TranscriptionJob" */
export type TranscriptionJob_Set_Input = {
    awsTranscribeJobName?: Maybe<Scalars["String"]>;
    contentItemId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    languageCode?: Maybe<Scalars["String"]>;
    transcriptionS3Url?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    videoS3Url?: Maybe<Scalars["String"]>;
};

/** update columns of table "TranscriptionJob" */
export enum TranscriptionJob_Update_Column {
    /** column name */
    AwsTranscribeJobName = "awsTranscribeJobName",
    /** column name */
    ContentItemId = "contentItemId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Id = "id",
    /** column name */
    LanguageCode = "languageCode",
    /** column name */
    TranscriptionS3Url = "transcriptionS3Url",
    /** column name */
    UpdatedAt = "updatedAt",
    /** column name */
    VideoS3Url = "videoS3Url",
}

/** columns and relationships of "Transitions" */
export type Transitions = {
    __typename?: "Transitions";
    broadcastContentId: Scalars["uuid"];
    /** An object relationship */
    broadcastContentItem: BroadcastContentItem;
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    /** An object relationship */
    event: Event;
    eventId: Scalars["uuid"];
    fallbackBroadcastContentId?: Maybe<Scalars["uuid"]>;
    /** An object relationship */
    fallbackBroadcastContentItem?: Maybe<BroadcastContentItem>;
    id: Scalars["uuid"];
    /** An object relationship */
    room: Room;
    roomId: Scalars["uuid"];
    time: Scalars["timestamptz"];
    updatedAt: Scalars["timestamptz"];
};

/** aggregated selection of "Transitions" */
export type Transitions_Aggregate = {
    __typename?: "Transitions_aggregate";
    aggregate?: Maybe<Transitions_Aggregate_Fields>;
    nodes: Array<Transitions>;
};

/** aggregate fields of "Transitions" */
export type Transitions_Aggregate_Fields = {
    __typename?: "Transitions_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Transitions_Max_Fields>;
    min?: Maybe<Transitions_Min_Fields>;
};

/** aggregate fields of "Transitions" */
export type Transitions_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Transitions_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Transitions" */
export type Transitions_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<Transitions_Max_Order_By>;
    min?: Maybe<Transitions_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Transitions" */
export type Transitions_Arr_Rel_Insert_Input = {
    data: Array<Transitions_Insert_Input>;
    on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Transitions". All fields are combined with a logical 'AND'. */
export type Transitions_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Transitions_Bool_Exp>>>;
    _not?: Maybe<Transitions_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Transitions_Bool_Exp>>>;
    broadcastContentId?: Maybe<Uuid_Comparison_Exp>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    event?: Maybe<Event_Bool_Exp>;
    eventId?: Maybe<Uuid_Comparison_Exp>;
    fallbackBroadcastContentId?: Maybe<Uuid_Comparison_Exp>;
    fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    room?: Maybe<Room_Bool_Exp>;
    roomId?: Maybe<Uuid_Comparison_Exp>;
    time?: Maybe<Timestamptz_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Transitions" */
export enum Transitions_Constraint {
    /** unique or primary key constraint */
    TransitionsPkey = "Transitions_pkey",
}

/** input type for inserting data into table "Transitions" */
export type Transitions_Insert_Input = {
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    event?: Maybe<Event_Obj_Rel_Insert_Input>;
    eventId?: Maybe<Scalars["uuid"]>;
    fallbackBroadcastContentId?: Maybe<Scalars["uuid"]>;
    fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
    id?: Maybe<Scalars["uuid"]>;
    room?: Maybe<Room_Obj_Rel_Insert_Input>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Transitions_Max_Fields = {
    __typename?: "Transitions_max_fields";
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    fallbackBroadcastContentId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Transitions" */
export type Transitions_Max_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    fallbackBroadcastContentId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Transitions_Min_Fields = {
    __typename?: "Transitions_min_fields";
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    fallbackBroadcastContentId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Transitions" */
export type Transitions_Min_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    eventId?: Maybe<Order_By>;
    fallbackBroadcastContentId?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Transitions" */
export type Transitions_Mutation_Response = {
    __typename?: "Transitions_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Transitions>;
};

/** input type for inserting object relation for remote table "Transitions" */
export type Transitions_Obj_Rel_Insert_Input = {
    data: Transitions_Insert_Input;
    on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** on conflict condition type for table "Transitions" */
export type Transitions_On_Conflict = {
    constraint: Transitions_Constraint;
    update_columns: Array<Transitions_Update_Column>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** ordering options when selecting data from "Transitions" */
export type Transitions_Order_By = {
    broadcastContentId?: Maybe<Order_By>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    event?: Maybe<Event_Order_By>;
    eventId?: Maybe<Order_By>;
    fallbackBroadcastContentId?: Maybe<Order_By>;
    fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
    id?: Maybe<Order_By>;
    room?: Maybe<Room_Order_By>;
    roomId?: Maybe<Order_By>;
    time?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Transitions" */
export type Transitions_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Transitions" */
export enum Transitions_Select_Column {
    /** column name */
    BroadcastContentId = "broadcastContentId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EventId = "eventId",
    /** column name */
    FallbackBroadcastContentId = "fallbackBroadcastContentId",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    Time = "time",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Transitions" */
export type Transitions_Set_Input = {
    broadcastContentId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    eventId?: Maybe<Scalars["uuid"]>;
    fallbackBroadcastContentId?: Maybe<Scalars["uuid"]>;
    id?: Maybe<Scalars["uuid"]>;
    roomId?: Maybe<Scalars["uuid"]>;
    time?: Maybe<Scalars["timestamptz"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "Transitions" */
export enum Transitions_Update_Column {
    /** column name */
    BroadcastContentId = "broadcastContentId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    EventId = "eventId",
    /** column name */
    FallbackBroadcastContentId = "fallbackBroadcastContentId",
    /** column name */
    Id = "id",
    /** column name */
    RoomId = "roomId",
    /** column name */
    Time = "time",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "Uploader" */
export type Uploader = {
    __typename?: "Uploader";
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    createdAt: Scalars["timestamptz"];
    email: Scalars["String"];
    emailsSentCount: Scalars["Int"];
    id: Scalars["uuid"];
    name: Scalars["String"];
    /** An object relationship */
    requiredContentItem: RequiredContentItem;
    requiredContentItemId: Scalars["uuid"];
    updatedAt: Scalars["timestamptz"];
};

export type UploaderSendSubmissionRequestResult = {
    __typename?: "UploaderSendSubmissionRequestResult";
    sent: Scalars["Boolean"];
    uploaderId: Scalars["uuid"];
};

/** aggregated selection of "Uploader" */
export type Uploader_Aggregate = {
    __typename?: "Uploader_aggregate";
    aggregate?: Maybe<Uploader_Aggregate_Fields>;
    nodes: Array<Uploader>;
};

/** aggregate fields of "Uploader" */
export type Uploader_Aggregate_Fields = {
    __typename?: "Uploader_aggregate_fields";
    avg?: Maybe<Uploader_Avg_Fields>;
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<Uploader_Max_Fields>;
    min?: Maybe<Uploader_Min_Fields>;
    stddev?: Maybe<Uploader_Stddev_Fields>;
    stddev_pop?: Maybe<Uploader_Stddev_Pop_Fields>;
    stddev_samp?: Maybe<Uploader_Stddev_Samp_Fields>;
    sum?: Maybe<Uploader_Sum_Fields>;
    var_pop?: Maybe<Uploader_Var_Pop_Fields>;
    var_samp?: Maybe<Uploader_Var_Samp_Fields>;
    variance?: Maybe<Uploader_Variance_Fields>;
};

/** aggregate fields of "Uploader" */
export type Uploader_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<Uploader_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Uploader" */
export type Uploader_Aggregate_Order_By = {
    avg?: Maybe<Uploader_Avg_Order_By>;
    count?: Maybe<Order_By>;
    max?: Maybe<Uploader_Max_Order_By>;
    min?: Maybe<Uploader_Min_Order_By>;
    stddev?: Maybe<Uploader_Stddev_Order_By>;
    stddev_pop?: Maybe<Uploader_Stddev_Pop_Order_By>;
    stddev_samp?: Maybe<Uploader_Stddev_Samp_Order_By>;
    sum?: Maybe<Uploader_Sum_Order_By>;
    var_pop?: Maybe<Uploader_Var_Pop_Order_By>;
    var_samp?: Maybe<Uploader_Var_Samp_Order_By>;
    variance?: Maybe<Uploader_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Uploader" */
export type Uploader_Arr_Rel_Insert_Input = {
    data: Array<Uploader_Insert_Input>;
    on_conflict?: Maybe<Uploader_On_Conflict>;
};

/** aggregate avg on columns */
export type Uploader_Avg_Fields = {
    __typename?: "Uploader_avg_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Uploader" */
export type Uploader_Avg_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Uploader". All fields are combined with a logical 'AND'. */
export type Uploader_Bool_Exp = {
    _and?: Maybe<Array<Maybe<Uploader_Bool_Exp>>>;
    _not?: Maybe<Uploader_Bool_Exp>;
    _or?: Maybe<Array<Maybe<Uploader_Bool_Exp>>>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    email?: Maybe<String_Comparison_Exp>;
    emailsSentCount?: Maybe<Int_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    name?: Maybe<String_Comparison_Exp>;
    requiredContentItem?: Maybe<RequiredContentItem_Bool_Exp>;
    requiredContentItemId?: Maybe<Uuid_Comparison_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Uploader" */
export enum Uploader_Constraint {
    /** unique or primary key constraint */
    UploaderEmailRequiredContentItemIdKey = "Uploader_email_requiredContentItemId_key",
    /** unique or primary key constraint */
    UploaderPkey = "Uploader_pkey",
}

/** input type for incrementing integer column in table "Uploader" */
export type Uploader_Inc_Input = {
    emailsSentCount?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Uploader" */
export type Uploader_Insert_Input = {
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    emailsSentCount?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    requiredContentItem?: Maybe<RequiredContentItem_Obj_Rel_Insert_Input>;
    requiredContentItemId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Uploader_Max_Fields = {
    __typename?: "Uploader_max_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    emailsSentCount?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    requiredContentItemId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Uploader" */
export type Uploader_Max_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    emailsSentCount?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    requiredContentItemId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Uploader_Min_Fields = {
    __typename?: "Uploader_min_fields";
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    emailsSentCount?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    requiredContentItemId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Uploader" */
export type Uploader_Min_Order_By = {
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    emailsSentCount?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    requiredContentItemId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Uploader" */
export type Uploader_Mutation_Response = {
    __typename?: "Uploader_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<Uploader>;
};

/** input type for inserting object relation for remote table "Uploader" */
export type Uploader_Obj_Rel_Insert_Input = {
    data: Uploader_Insert_Input;
    on_conflict?: Maybe<Uploader_On_Conflict>;
};

/** on conflict condition type for table "Uploader" */
export type Uploader_On_Conflict = {
    constraint: Uploader_Constraint;
    update_columns: Array<Uploader_Update_Column>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** ordering options when selecting data from "Uploader" */
export type Uploader_Order_By = {
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    emailsSentCount?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    name?: Maybe<Order_By>;
    requiredContentItem?: Maybe<RequiredContentItem_Order_By>;
    requiredContentItemId?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Uploader" */
export type Uploader_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** select columns of table "Uploader" */
export enum Uploader_Select_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Email = "email",
    /** column name */
    EmailsSentCount = "emailsSentCount",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    RequiredContentItemId = "requiredContentItemId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "Uploader" */
export type Uploader_Set_Input = {
    conferenceId?: Maybe<Scalars["uuid"]>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    emailsSentCount?: Maybe<Scalars["Int"]>;
    id?: Maybe<Scalars["uuid"]>;
    name?: Maybe<Scalars["String"]>;
    requiredContentItemId?: Maybe<Scalars["uuid"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type Uploader_Stddev_Fields = {
    __typename?: "Uploader_stddev_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Uploader" */
export type Uploader_Stddev_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Uploader_Stddev_Pop_Fields = {
    __typename?: "Uploader_stddev_pop_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Uploader" */
export type Uploader_Stddev_Pop_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Uploader_Stddev_Samp_Fields = {
    __typename?: "Uploader_stddev_samp_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Uploader" */
export type Uploader_Stddev_Samp_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Uploader_Sum_Fields = {
    __typename?: "Uploader_sum_fields";
    emailsSentCount?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Uploader" */
export type Uploader_Sum_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** update columns of table "Uploader" */
export enum Uploader_Update_Column {
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Email = "email",
    /** column name */
    EmailsSentCount = "emailsSentCount",
    /** column name */
    Id = "id",
    /** column name */
    Name = "name",
    /** column name */
    RequiredContentItemId = "requiredContentItemId",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** aggregate var_pop on columns */
export type Uploader_Var_Pop_Fields = {
    __typename?: "Uploader_var_pop_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Uploader" */
export type Uploader_Var_Pop_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Uploader_Var_Samp_Fields = {
    __typename?: "Uploader_var_samp_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Uploader" */
export type Uploader_Var_Samp_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Uploader_Variance_Fields = {
    __typename?: "Uploader_variance_fields";
    emailsSentCount?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Uploader" */
export type Uploader_Variance_Order_By = {
    emailsSentCount?: Maybe<Order_By>;
};

/** columns and relationships of "User" */
export type User = {
    __typename?: "User";
    /** An array relationship */
    attendees: Array<Attendee>;
    /** An aggregated array relationship */
    attendees_aggregate: Attendee_Aggregate;
    /** An array relationship */
    chats: Array<Chat>;
    /** An aggregated array relationship */
    chats_aggregate: Chat_Aggregate;
    /** An array relationship */
    conferenceDemoCodes: Array<ConferenceDemoCode>;
    /** An aggregated array relationship */
    conferenceDemoCodes_aggregate: ConferenceDemoCode_Aggregate;
    /** An array relationship */
    conferencesCreated: Array<Conference>;
    /** An aggregated array relationship */
    conferencesCreated_aggregate: Conference_Aggregate;
    createdAt: Scalars["timestamptz"];
    email?: Maybe<Scalars["String"]>;
    /** An array relationship */
    emails: Array<Email>;
    /** An aggregated array relationship */
    emails_aggregate: Email_Aggregate;
    firstName: Scalars["String"];
    /** An array relationship */
    flaggedMessages: Array<FlaggedChatMessage>;
    /** An aggregated array relationship */
    flaggedMessages_aggregate: FlaggedChatMessage_Aggregate;
    /** An array relationship */
    followedChats: Array<FollowedChat>;
    /** An aggregated array relationship */
    followedChats_aggregate: FollowedChat_Aggregate;
    id: Scalars["String"];
    /** An array relationship */
    invitationsPendingConfirmation: Array<Invitation>;
    /** An aggregated array relationship */
    invitationsPendingConfirmation_aggregate: Invitation_Aggregate;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName: Scalars["String"];
    /** An array relationship */
    memberOfChats: Array<ChatMember>;
    /** An aggregated array relationship */
    memberOfChats_aggregate: ChatMember_Aggregate;
    /** An object relationship */
    onlineStatus?: Maybe<OnlineStatus>;
    /** An array relationship */
    pinnedChats: Array<PinnedChat>;
    /** An aggregated array relationship */
    pinnedChats_aggregate: PinnedChat_Aggregate;
    /** An array relationship */
    reactions: Array<ChatReaction>;
    /** An aggregated array relationship */
    reactions_aggregate: ChatReaction_Aggregate;
    /** An array relationship */
    sentMessages: Array<ChatMessage>;
    /** An aggregated array relationship */
    sentMessages_aggregate: ChatMessage_Aggregate;
    /** An array relationship */
    typingInChats: Array<ChatTyper>;
    /** An aggregated array relationship */
    typingInChats_aggregate: ChatTyper_Aggregate;
    /** An array relationship */
    unreadIndices: Array<ChatUnreadIndex>;
    /** An aggregated array relationship */
    unreadIndices_aggregate: ChatUnreadIndex_Aggregate;
    updatedAt: Scalars["timestamptz"];
    /** An array relationship */
    viewingChats: Array<ChatViewer>;
    /** An aggregated array relationship */
    viewingChats_aggregate: ChatViewer_Aggregate;
};

/** columns and relationships of "User" */
export type UserAttendeesArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserAttendees_AggregateArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserChatsArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserChats_AggregateArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserConferenceDemoCodesArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserConferenceDemoCodes_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserConferencesCreatedArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserConferencesCreated_AggregateArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserEmailsArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserEmails_AggregateArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserFlaggedMessagesArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserFlaggedMessages_AggregateArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserFollowedChatsArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserFollowedChats_AggregateArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserInvitationsPendingConfirmationArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserInvitationsPendingConfirmation_AggregateArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserMemberOfChatsArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserMemberOfChats_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserPinnedChatsArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserPinnedChats_AggregateArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserReactionsArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserReactions_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserSentMessagesArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserSentMessages_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserTypingInChatsArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserTypingInChats_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserUnreadIndicesArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserUnreadIndices_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserViewingChatsArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** columns and relationships of "User" */
export type UserViewingChats_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** aggregated selection of "User" */
export type User_Aggregate = {
    __typename?: "User_aggregate";
    aggregate?: Maybe<User_Aggregate_Fields>;
    nodes: Array<User>;
};

/** aggregate fields of "User" */
export type User_Aggregate_Fields = {
    __typename?: "User_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<User_Max_Fields>;
    min?: Maybe<User_Min_Fields>;
};

/** aggregate fields of "User" */
export type User_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<User_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "User" */
export type User_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<User_Max_Order_By>;
    min?: Maybe<User_Min_Order_By>;
};

/** input type for inserting array relation for remote table "User" */
export type User_Arr_Rel_Insert_Input = {
    data: Array<User_Insert_Input>;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** Boolean expression to filter rows from the table "User". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
    _and?: Maybe<Array<Maybe<User_Bool_Exp>>>;
    _not?: Maybe<User_Bool_Exp>;
    _or?: Maybe<Array<Maybe<User_Bool_Exp>>>;
    attendees?: Maybe<Attendee_Bool_Exp>;
    chats?: Maybe<Chat_Bool_Exp>;
    conferenceDemoCodes?: Maybe<ConferenceDemoCode_Bool_Exp>;
    conferencesCreated?: Maybe<Conference_Bool_Exp>;
    createdAt?: Maybe<Timestamptz_Comparison_Exp>;
    email?: Maybe<String_Comparison_Exp>;
    emails?: Maybe<Email_Bool_Exp>;
    firstName?: Maybe<String_Comparison_Exp>;
    flaggedMessages?: Maybe<FlaggedChatMessage_Bool_Exp>;
    followedChats?: Maybe<FollowedChat_Bool_Exp>;
    id?: Maybe<String_Comparison_Exp>;
    invitationsPendingConfirmation?: Maybe<Invitation_Bool_Exp>;
    lastLoggedInAt?: Maybe<Timestamptz_Comparison_Exp>;
    lastName?: Maybe<String_Comparison_Exp>;
    memberOfChats?: Maybe<ChatMember_Bool_Exp>;
    onlineStatus?: Maybe<OnlineStatus_Bool_Exp>;
    pinnedChats?: Maybe<PinnedChat_Bool_Exp>;
    reactions?: Maybe<ChatReaction_Bool_Exp>;
    sentMessages?: Maybe<ChatMessage_Bool_Exp>;
    typingInChats?: Maybe<ChatTyper_Bool_Exp>;
    unreadIndices?: Maybe<ChatUnreadIndex_Bool_Exp>;
    updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
    viewingChats?: Maybe<ChatViewer_Bool_Exp>;
};

/** unique or primary key constraints on table "User" */
export enum User_Constraint {
    /** unique or primary key constraint */
    UserEmailKey = "user_email_key",
    /** unique or primary key constraint */
    UserPkey = "user_pkey",
}

/** input type for inserting data into table "User" */
export type User_Insert_Input = {
    attendees?: Maybe<Attendee_Arr_Rel_Insert_Input>;
    chats?: Maybe<Chat_Arr_Rel_Insert_Input>;
    conferenceDemoCodes?: Maybe<ConferenceDemoCode_Arr_Rel_Insert_Input>;
    conferencesCreated?: Maybe<Conference_Arr_Rel_Insert_Input>;
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    emails?: Maybe<Email_Arr_Rel_Insert_Input>;
    firstName?: Maybe<Scalars["String"]>;
    flaggedMessages?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
    followedChats?: Maybe<FollowedChat_Arr_Rel_Insert_Input>;
    id?: Maybe<Scalars["String"]>;
    invitationsPendingConfirmation?: Maybe<Invitation_Arr_Rel_Insert_Input>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    memberOfChats?: Maybe<ChatMember_Arr_Rel_Insert_Input>;
    onlineStatus?: Maybe<OnlineStatus_Obj_Rel_Insert_Input>;
    pinnedChats?: Maybe<PinnedChat_Arr_Rel_Insert_Input>;
    reactions?: Maybe<ChatReaction_Arr_Rel_Insert_Input>;
    sentMessages?: Maybe<ChatMessage_Arr_Rel_Insert_Input>;
    typingInChats?: Maybe<ChatTyper_Arr_Rel_Insert_Input>;
    unreadIndices?: Maybe<ChatUnreadIndex_Arr_Rel_Insert_Input>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
    viewingChats?: Maybe<ChatViewer_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type User_Max_Fields = {
    __typename?: "User_max_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "User" */
export type User_Max_Order_By = {
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    firstName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type User_Min_Fields = {
    __typename?: "User_min_fields";
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "User" */
export type User_Min_Order_By = {
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    firstName?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "User" */
export type User_Mutation_Response = {
    __typename?: "User_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<User>;
};

/** input type for inserting object relation for remote table "User" */
export type User_Obj_Rel_Insert_Input = {
    data: User_Insert_Input;
    on_conflict?: Maybe<User_On_Conflict>;
};

/** on conflict condition type for table "User" */
export type User_On_Conflict = {
    constraint: User_Constraint;
    update_columns: Array<User_Update_Column>;
    where?: Maybe<User_Bool_Exp>;
};

/** ordering options when selecting data from "User" */
export type User_Order_By = {
    attendees_aggregate?: Maybe<Attendee_Aggregate_Order_By>;
    chats_aggregate?: Maybe<Chat_Aggregate_Order_By>;
    conferenceDemoCodes_aggregate?: Maybe<ConferenceDemoCode_Aggregate_Order_By>;
    conferencesCreated_aggregate?: Maybe<Conference_Aggregate_Order_By>;
    createdAt?: Maybe<Order_By>;
    email?: Maybe<Order_By>;
    emails_aggregate?: Maybe<Email_Aggregate_Order_By>;
    firstName?: Maybe<Order_By>;
    flaggedMessages_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
    followedChats_aggregate?: Maybe<FollowedChat_Aggregate_Order_By>;
    id?: Maybe<Order_By>;
    invitationsPendingConfirmation_aggregate?: Maybe<Invitation_Aggregate_Order_By>;
    lastLoggedInAt?: Maybe<Order_By>;
    lastName?: Maybe<Order_By>;
    memberOfChats_aggregate?: Maybe<ChatMember_Aggregate_Order_By>;
    onlineStatus?: Maybe<OnlineStatus_Order_By>;
    pinnedChats_aggregate?: Maybe<PinnedChat_Aggregate_Order_By>;
    reactions_aggregate?: Maybe<ChatReaction_Aggregate_Order_By>;
    sentMessages_aggregate?: Maybe<ChatMessage_Aggregate_Order_By>;
    typingInChats_aggregate?: Maybe<ChatTyper_Aggregate_Order_By>;
    unreadIndices_aggregate?: Maybe<ChatUnreadIndex_Aggregate_Order_By>;
    updatedAt?: Maybe<Order_By>;
    viewingChats_aggregate?: Maybe<ChatViewer_Aggregate_Order_By>;
};

/** primary key columns input for table: "User" */
export type User_Pk_Columns_Input = {
    id: Scalars["String"];
};

/** select columns of table "User" */
export enum User_Select_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Email = "email",
    /** column name */
    FirstName = "firstName",
    /** column name */
    Id = "id",
    /** column name */
    LastLoggedInAt = "lastLoggedInAt",
    /** column name */
    LastName = "lastName",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** input type for updating data in table "User" */
export type User_Set_Input = {
    createdAt?: Maybe<Scalars["timestamptz"]>;
    email?: Maybe<Scalars["String"]>;
    firstName?: Maybe<Scalars["String"]>;
    id?: Maybe<Scalars["String"]>;
    lastLoggedInAt?: Maybe<Scalars["timestamptz"]>;
    lastName?: Maybe<Scalars["String"]>;
    updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "User" */
export enum User_Update_Column {
    /** column name */
    CreatedAt = "createdAt",
    /** column name */
    Email = "email",
    /** column name */
    FirstName = "firstName",
    /** column name */
    Id = "id",
    /** column name */
    LastLoggedInAt = "lastLoggedInAt",
    /** column name */
    LastName = "lastName",
    /** column name */
    UpdatedAt = "updatedAt",
}

/** columns and relationships of "VideoRenderJob" */
export type VideoRenderJob = {
    __typename?: "VideoRenderJob";
    /** An object relationship */
    broadcastContentItem: BroadcastContentItem;
    broadcastContentItemId: Scalars["uuid"];
    /** An object relationship */
    conference: Conference;
    conferenceId: Scalars["uuid"];
    /** An object relationship */
    conferencePrepareJob: ConferencePrepareJob;
    conferencePrepareJobId: Scalars["uuid"];
    created_at: Scalars["timestamptz"];
    data: Scalars["jsonb"];
    id: Scalars["uuid"];
    /** An object relationship */
    jobStatus: JobStatus;
    jobStatusName: JobStatus_Enum;
    message?: Maybe<Scalars["String"]>;
    updated_at: Scalars["timestamptz"];
};

/** columns and relationships of "VideoRenderJob" */
export type VideoRenderJobDataArgs = {
    path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "VideoRenderJob" */
export type VideoRenderJob_Aggregate = {
    __typename?: "VideoRenderJob_aggregate";
    aggregate?: Maybe<VideoRenderJob_Aggregate_Fields>;
    nodes: Array<VideoRenderJob>;
};

/** aggregate fields of "VideoRenderJob" */
export type VideoRenderJob_Aggregate_Fields = {
    __typename?: "VideoRenderJob_aggregate_fields";
    count?: Maybe<Scalars["Int"]>;
    max?: Maybe<VideoRenderJob_Max_Fields>;
    min?: Maybe<VideoRenderJob_Min_Fields>;
};

/** aggregate fields of "VideoRenderJob" */
export type VideoRenderJob_Aggregate_FieldsCountArgs = {
    columns?: Maybe<Array<VideoRenderJob_Select_Column>>;
    distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "VideoRenderJob" */
export type VideoRenderJob_Aggregate_Order_By = {
    count?: Maybe<Order_By>;
    max?: Maybe<VideoRenderJob_Max_Order_By>;
    min?: Maybe<VideoRenderJob_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type VideoRenderJob_Append_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "VideoRenderJob" */
export type VideoRenderJob_Arr_Rel_Insert_Input = {
    data: Array<VideoRenderJob_Insert_Input>;
    on_conflict?: Maybe<VideoRenderJob_On_Conflict>;
};

/** Boolean expression to filter rows from the table "VideoRenderJob". All fields are combined with a logical 'AND'. */
export type VideoRenderJob_Bool_Exp = {
    _and?: Maybe<Array<Maybe<VideoRenderJob_Bool_Exp>>>;
    _not?: Maybe<VideoRenderJob_Bool_Exp>;
    _or?: Maybe<Array<Maybe<VideoRenderJob_Bool_Exp>>>;
    broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
    broadcastContentItemId?: Maybe<Uuid_Comparison_Exp>;
    conference?: Maybe<Conference_Bool_Exp>;
    conferenceId?: Maybe<Uuid_Comparison_Exp>;
    conferencePrepareJob?: Maybe<ConferencePrepareJob_Bool_Exp>;
    conferencePrepareJobId?: Maybe<Uuid_Comparison_Exp>;
    created_at?: Maybe<Timestamptz_Comparison_Exp>;
    data?: Maybe<Jsonb_Comparison_Exp>;
    id?: Maybe<Uuid_Comparison_Exp>;
    jobStatus?: Maybe<JobStatus_Bool_Exp>;
    jobStatusName?: Maybe<JobStatus_Enum_Comparison_Exp>;
    message?: Maybe<String_Comparison_Exp>;
    updated_at?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "VideoRenderJob" */
export enum VideoRenderJob_Constraint {
    /** unique or primary key constraint */
    VideoRenderJobPkey = "VideoRenderJob_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type VideoRenderJob_Delete_At_Path_Input = {
    data?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type VideoRenderJob_Delete_Elem_Input = {
    data?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type VideoRenderJob_Delete_Key_Input = {
    data?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "VideoRenderJob" */
export type VideoRenderJob_Insert_Input = {
    broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
    broadcastContentItemId?: Maybe<Scalars["uuid"]>;
    conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    conferencePrepareJob?: Maybe<ConferencePrepareJob_Obj_Rel_Insert_Input>;
    conferencePrepareJobId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    id?: Maybe<Scalars["uuid"]>;
    jobStatus?: Maybe<JobStatus_Obj_Rel_Insert_Input>;
    jobStatusName?: Maybe<JobStatus_Enum>;
    message?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type VideoRenderJob_Max_Fields = {
    __typename?: "VideoRenderJob_max_fields";
    broadcastContentItemId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    conferencePrepareJobId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "VideoRenderJob" */
export type VideoRenderJob_Max_Order_By = {
    broadcastContentItemId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    conferencePrepareJobId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type VideoRenderJob_Min_Fields = {
    __typename?: "VideoRenderJob_min_fields";
    broadcastContentItemId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    conferencePrepareJobId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    id?: Maybe<Scalars["uuid"]>;
    message?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "VideoRenderJob" */
export type VideoRenderJob_Min_Order_By = {
    broadcastContentItemId?: Maybe<Order_By>;
    conferenceId?: Maybe<Order_By>;
    conferencePrepareJobId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** response of any mutation on the table "VideoRenderJob" */
export type VideoRenderJob_Mutation_Response = {
    __typename?: "VideoRenderJob_mutation_response";
    /** number of affected rows by the mutation */
    affected_rows: Scalars["Int"];
    /** data of the affected rows by the mutation */
    returning: Array<VideoRenderJob>;
};

/** input type for inserting object relation for remote table "VideoRenderJob" */
export type VideoRenderJob_Obj_Rel_Insert_Input = {
    data: VideoRenderJob_Insert_Input;
    on_conflict?: Maybe<VideoRenderJob_On_Conflict>;
};

/** on conflict condition type for table "VideoRenderJob" */
export type VideoRenderJob_On_Conflict = {
    constraint: VideoRenderJob_Constraint;
    update_columns: Array<VideoRenderJob_Update_Column>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** ordering options when selecting data from "VideoRenderJob" */
export type VideoRenderJob_Order_By = {
    broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
    broadcastContentItemId?: Maybe<Order_By>;
    conference?: Maybe<Conference_Order_By>;
    conferenceId?: Maybe<Order_By>;
    conferencePrepareJob?: Maybe<ConferencePrepareJob_Order_By>;
    conferencePrepareJobId?: Maybe<Order_By>;
    created_at?: Maybe<Order_By>;
    data?: Maybe<Order_By>;
    id?: Maybe<Order_By>;
    jobStatus?: Maybe<JobStatus_Order_By>;
    jobStatusName?: Maybe<Order_By>;
    message?: Maybe<Order_By>;
    updated_at?: Maybe<Order_By>;
};

/** primary key columns input for table: "VideoRenderJob" */
export type VideoRenderJob_Pk_Columns_Input = {
    id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type VideoRenderJob_Prepend_Input = {
    data?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "VideoRenderJob" */
export enum VideoRenderJob_Select_Column {
    /** column name */
    BroadcastContentItemId = "broadcastContentItemId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ConferencePrepareJobId = "conferencePrepareJobId",
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    JobStatusName = "jobStatusName",
    /** column name */
    Message = "message",
    /** column name */
    UpdatedAt = "updated_at",
}

/** input type for updating data in table "VideoRenderJob" */
export type VideoRenderJob_Set_Input = {
    broadcastContentItemId?: Maybe<Scalars["uuid"]>;
    conferenceId?: Maybe<Scalars["uuid"]>;
    conferencePrepareJobId?: Maybe<Scalars["uuid"]>;
    created_at?: Maybe<Scalars["timestamptz"]>;
    data?: Maybe<Scalars["jsonb"]>;
    id?: Maybe<Scalars["uuid"]>;
    jobStatusName?: Maybe<JobStatus_Enum>;
    message?: Maybe<Scalars["String"]>;
    updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "VideoRenderJob" */
export enum VideoRenderJob_Update_Column {
    /** column name */
    BroadcastContentItemId = "broadcastContentItemId",
    /** column name */
    ConferenceId = "conferenceId",
    /** column name */
    ConferencePrepareJobId = "conferencePrepareJobId",
    /** column name */
    CreatedAt = "created_at",
    /** column name */
    Data = "data",
    /** column name */
    Id = "id",
    /** column name */
    JobStatusName = "jobStatusName",
    /** column name */
    Message = "message",
    /** column name */
    UpdatedAt = "updated_at",
}

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

/** expression to compare columns of type jsonb. All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
    /** is the column contained in the given json value */
    _contained_in?: Maybe<Scalars["jsonb"]>;
    /** does the column contain the given json value at the top level */
    _contains?: Maybe<Scalars["jsonb"]>;
    _eq?: Maybe<Scalars["jsonb"]>;
    _gt?: Maybe<Scalars["jsonb"]>;
    _gte?: Maybe<Scalars["jsonb"]>;
    /** does the string exist as a top-level key in the column */
    _has_key?: Maybe<Scalars["String"]>;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Maybe<Array<Scalars["String"]>>;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Maybe<Array<Scalars["String"]>>;
    _in?: Maybe<Array<Scalars["jsonb"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["jsonb"]>;
    _lte?: Maybe<Scalars["jsonb"]>;
    _neq?: Maybe<Scalars["jsonb"]>;
    _nin?: Maybe<Array<Scalars["jsonb"]>>;
};

/** mutation root */
export type Mutation_Root = {
    __typename?: "mutation_root";
    /** delete data from the table: "Attendee" */
    delete_Attendee?: Maybe<Attendee_Mutation_Response>;
    /** delete single row from the table: "Attendee" */
    delete_Attendee_by_pk?: Maybe<Attendee>;
    /** delete data from the table: "Broadcast" */
    delete_Broadcast?: Maybe<Broadcast_Mutation_Response>;
    /** delete data from the table: "BroadcastContentItem" */
    delete_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
    /** delete single row from the table: "BroadcastContentItem" */
    delete_BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
    /** delete single row from the table: "Broadcast" */
    delete_Broadcast_by_pk?: Maybe<Broadcast>;
    /** delete data from the table: "Chat" */
    delete_Chat?: Maybe<Chat_Mutation_Response>;
    /** delete data from the table: "ChatMember" */
    delete_ChatMember?: Maybe<ChatMember_Mutation_Response>;
    /** delete single row from the table: "ChatMember" */
    delete_ChatMember_by_pk?: Maybe<ChatMember>;
    /** delete data from the table: "ChatMessage" */
    delete_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
    /** delete single row from the table: "ChatMessage" */
    delete_ChatMessage_by_pk?: Maybe<ChatMessage>;
    /** delete data from the table: "ChatReaction" */
    delete_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
    /** delete single row from the table: "ChatReaction" */
    delete_ChatReaction_by_pk?: Maybe<ChatReaction>;
    /** delete data from the table: "ChatTyper" */
    delete_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
    /** delete single row from the table: "ChatTyper" */
    delete_ChatTyper_by_pk?: Maybe<ChatTyper>;
    /** delete data from the table: "ChatUnreadIndex" */
    delete_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
    /** delete single row from the table: "ChatUnreadIndex" */
    delete_ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
    /** delete data from the table: "ChatViewer" */
    delete_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
    /** delete single row from the table: "ChatViewer" */
    delete_ChatViewer_by_pk?: Maybe<ChatViewer>;
    /** delete single row from the table: "Chat" */
    delete_Chat_by_pk?: Maybe<Chat>;
    /** delete data from the table: "Conference" */
    delete_Conference?: Maybe<Conference_Mutation_Response>;
    /** delete data from the table: "ConferenceConfiguration" */
    delete_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
    /** delete single row from the table: "ConferenceConfiguration" */
    delete_ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
    /** delete data from the table: "ConferenceDemoCode" */
    delete_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
    /** delete single row from the table: "ConferenceDemoCode" */
    delete_ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
    /** delete data from the table: "ConferencePrepareJob" */
    delete_ConferencePrepareJob?: Maybe<ConferencePrepareJob_Mutation_Response>;
    /** delete single row from the table: "ConferencePrepareJob" */
    delete_ConferencePrepareJob_by_pk?: Maybe<ConferencePrepareJob>;
    /** delete single row from the table: "Conference" */
    delete_Conference_by_pk?: Maybe<Conference>;
    /** delete data from the table: "ContentGroup" */
    delete_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
    /** delete data from the table: "ContentGroupPerson" */
    delete_ContentGroupPerson?: Maybe<ContentGroupPerson_Mutation_Response>;
    /** delete single row from the table: "ContentGroupPerson" */
    delete_ContentGroupPerson_by_pk?: Maybe<ContentGroupPerson>;
    /** delete data from the table: "ContentGroupTag" */
    delete_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
    /** delete single row from the table: "ContentGroupTag" */
    delete_ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
    /** delete data from the table: "ContentGroupType" */
    delete_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
    /** delete single row from the table: "ContentGroupType" */
    delete_ContentGroupType_by_pk?: Maybe<ContentGroupType>;
    /** delete single row from the table: "ContentGroup" */
    delete_ContentGroup_by_pk?: Maybe<ContentGroup>;
    /** delete data from the table: "ContentItem" */
    delete_ContentItem?: Maybe<ContentItem_Mutation_Response>;
    /** delete single row from the table: "ContentItem" */
    delete_ContentItem_by_pk?: Maybe<ContentItem>;
    /** delete data from the table: "ContentPerson" */
    delete_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
    /** delete single row from the table: "ContentPerson" */
    delete_ContentPerson_by_pk?: Maybe<ContentPerson>;
    /** delete data from the table: "ContentType" */
    delete_ContentType?: Maybe<ContentType_Mutation_Response>;
    /** delete single row from the table: "ContentType" */
    delete_ContentType_by_pk?: Maybe<ContentType>;
    /** delete data from the table: "Email" */
    delete_Email?: Maybe<Email_Mutation_Response>;
    /** delete single row from the table: "Email" */
    delete_Email_by_pk?: Maybe<Email>;
    /** delete data from the table: "Event" */
    delete_Event?: Maybe<Event_Mutation_Response>;
    /** delete data from the table: "EventPerson" */
    delete_EventPerson?: Maybe<EventPerson_Mutation_Response>;
    /** delete data from the table: "EventPersonRole" */
    delete_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
    /** delete single row from the table: "EventPersonRole" */
    delete_EventPersonRole_by_pk?: Maybe<EventPersonRole>;
    /** delete single row from the table: "EventPerson" */
    delete_EventPerson_by_pk?: Maybe<EventPerson>;
    /** delete data from the table: "EventTag" */
    delete_EventTag?: Maybe<EventTag_Mutation_Response>;
    /** delete single row from the table: "EventTag" */
    delete_EventTag_by_pk?: Maybe<EventTag>;
    /** delete single row from the table: "Event" */
    delete_Event_by_pk?: Maybe<Event>;
    /** delete data from the table: "ExecutedTransitions" */
    delete_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
    /** delete single row from the table: "ExecutedTransitions" */
    delete_ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
    /** delete data from the table: "FlaggedChatMessage" */
    delete_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
    /** delete single row from the table: "FlaggedChatMessage" */
    delete_FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
    /** delete data from the table: "FollowedChat" */
    delete_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
    /** delete single row from the table: "FollowedChat" */
    delete_FollowedChat_by_pk?: Maybe<FollowedChat>;
    /** delete data from the table: "Group" */
    delete_Group?: Maybe<Group_Mutation_Response>;
    /** delete data from the table: "GroupAttendee" */
    delete_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
    /** delete single row from the table: "GroupAttendee" */
    delete_GroupAttendee_by_pk?: Maybe<GroupAttendee>;
    /** delete data from the table: "GroupRole" */
    delete_GroupRole?: Maybe<GroupRole_Mutation_Response>;
    /** delete single row from the table: "GroupRole" */
    delete_GroupRole_by_pk?: Maybe<GroupRole>;
    /** delete single row from the table: "Group" */
    delete_Group_by_pk?: Maybe<Group>;
    /** delete data from the table: "InputType" */
    delete_InputType?: Maybe<InputType_Mutation_Response>;
    /** delete single row from the table: "InputType" */
    delete_InputType_by_pk?: Maybe<InputType>;
    /** delete data from the table: "Invitation" */
    delete_Invitation?: Maybe<Invitation_Mutation_Response>;
    /** delete single row from the table: "Invitation" */
    delete_Invitation_by_pk?: Maybe<Invitation>;
    /** delete data from the table: "JobStatus" */
    delete_JobStatus?: Maybe<JobStatus_Mutation_Response>;
    /** delete single row from the table: "JobStatus" */
    delete_JobStatus_by_pk?: Maybe<JobStatus>;
    /** delete data from the table: "OnlineStatus" */
    delete_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
    /** delete single row from the table: "OnlineStatus" */
    delete_OnlineStatus_by_pk?: Maybe<OnlineStatus>;
    /** delete data from the table: "OriginatingData" */
    delete_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
    /** delete single row from the table: "OriginatingData" */
    delete_OriginatingData_by_pk?: Maybe<OriginatingData>;
    /** delete data from the table: "Permission" */
    delete_Permission?: Maybe<Permission_Mutation_Response>;
    /** delete single row from the table: "Permission" */
    delete_Permission_by_pk?: Maybe<Permission>;
    /** delete data from the table: "PinnedChat" */
    delete_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
    /** delete single row from the table: "PinnedChat" */
    delete_PinnedChat_by_pk?: Maybe<PinnedChat>;
    /** delete data from the table: "RequiredContentItem" */
    delete_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
    /** delete single row from the table: "RequiredContentItem" */
    delete_RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
    /** delete data from the table: "Role" */
    delete_Role?: Maybe<Role_Mutation_Response>;
    /** delete data from the table: "RolePermission" */
    delete_RolePermission?: Maybe<RolePermission_Mutation_Response>;
    /** delete single row from the table: "RolePermission" */
    delete_RolePermission_by_pk?: Maybe<RolePermission>;
    /** delete single row from the table: "Role" */
    delete_Role_by_pk?: Maybe<Role>;
    /** delete data from the table: "Room" */
    delete_Room?: Maybe<Room_Mutation_Response>;
    /** delete data from the table: "RoomMode" */
    delete_RoomMode?: Maybe<RoomMode_Mutation_Response>;
    /** delete single row from the table: "RoomMode" */
    delete_RoomMode_by_pk?: Maybe<RoomMode>;
    /** delete data from the table: "RoomParticipant" */
    delete_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
    /** delete single row from the table: "RoomParticipant" */
    delete_RoomParticipant_by_pk?: Maybe<RoomParticipant>;
    /** delete single row from the table: "Room" */
    delete_Room_by_pk?: Maybe<Room>;
    /** delete data from the table: "Tag" */
    delete_Tag?: Maybe<Tag_Mutation_Response>;
    /** delete single row from the table: "Tag" */
    delete_Tag_by_pk?: Maybe<Tag>;
    /** delete data from the table: "TranscriptionJob" */
    delete_TranscriptionJob?: Maybe<TranscriptionJob_Mutation_Response>;
    /** delete single row from the table: "TranscriptionJob" */
    delete_TranscriptionJob_by_pk?: Maybe<TranscriptionJob>;
    /** delete data from the table: "Transitions" */
    delete_Transitions?: Maybe<Transitions_Mutation_Response>;
    /** delete single row from the table: "Transitions" */
    delete_Transitions_by_pk?: Maybe<Transitions>;
    /** delete data from the table: "Uploader" */
    delete_Uploader?: Maybe<Uploader_Mutation_Response>;
    /** delete single row from the table: "Uploader" */
    delete_Uploader_by_pk?: Maybe<Uploader>;
    /** delete data from the table: "User" */
    delete_User?: Maybe<User_Mutation_Response>;
    /** delete single row from the table: "User" */
    delete_User_by_pk?: Maybe<User>;
    /** delete data from the table: "VideoRenderJob" */
    delete_VideoRenderJob?: Maybe<VideoRenderJob_Mutation_Response>;
    /** delete single row from the table: "VideoRenderJob" */
    delete_VideoRenderJob_by_pk?: Maybe<VideoRenderJob>;
    /** insert data into the table: "Attendee" */
    insert_Attendee?: Maybe<Attendee_Mutation_Response>;
    /** insert a single row into the table: "Attendee" */
    insert_Attendee_one?: Maybe<Attendee>;
    /** insert data into the table: "Broadcast" */
    insert_Broadcast?: Maybe<Broadcast_Mutation_Response>;
    /** insert data into the table: "BroadcastContentItem" */
    insert_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
    /** insert a single row into the table: "BroadcastContentItem" */
    insert_BroadcastContentItem_one?: Maybe<BroadcastContentItem>;
    /** insert a single row into the table: "Broadcast" */
    insert_Broadcast_one?: Maybe<Broadcast>;
    /** insert data into the table: "Chat" */
    insert_Chat?: Maybe<Chat_Mutation_Response>;
    /** insert data into the table: "ChatMember" */
    insert_ChatMember?: Maybe<ChatMember_Mutation_Response>;
    /** insert a single row into the table: "ChatMember" */
    insert_ChatMember_one?: Maybe<ChatMember>;
    /** insert data into the table: "ChatMessage" */
    insert_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
    /** insert a single row into the table: "ChatMessage" */
    insert_ChatMessage_one?: Maybe<ChatMessage>;
    /** insert data into the table: "ChatReaction" */
    insert_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
    /** insert a single row into the table: "ChatReaction" */
    insert_ChatReaction_one?: Maybe<ChatReaction>;
    /** insert data into the table: "ChatTyper" */
    insert_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
    /** insert a single row into the table: "ChatTyper" */
    insert_ChatTyper_one?: Maybe<ChatTyper>;
    /** insert data into the table: "ChatUnreadIndex" */
    insert_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
    /** insert a single row into the table: "ChatUnreadIndex" */
    insert_ChatUnreadIndex_one?: Maybe<ChatUnreadIndex>;
    /** insert data into the table: "ChatViewer" */
    insert_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
    /** insert a single row into the table: "ChatViewer" */
    insert_ChatViewer_one?: Maybe<ChatViewer>;
    /** insert a single row into the table: "Chat" */
    insert_Chat_one?: Maybe<Chat>;
    /** insert data into the table: "Conference" */
    insert_Conference?: Maybe<Conference_Mutation_Response>;
    /** insert data into the table: "ConferenceConfiguration" */
    insert_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
    /** insert a single row into the table: "ConferenceConfiguration" */
    insert_ConferenceConfiguration_one?: Maybe<ConferenceConfiguration>;
    /** insert data into the table: "ConferenceDemoCode" */
    insert_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
    /** insert a single row into the table: "ConferenceDemoCode" */
    insert_ConferenceDemoCode_one?: Maybe<ConferenceDemoCode>;
    /** insert data into the table: "ConferencePrepareJob" */
    insert_ConferencePrepareJob?: Maybe<ConferencePrepareJob_Mutation_Response>;
    /** insert a single row into the table: "ConferencePrepareJob" */
    insert_ConferencePrepareJob_one?: Maybe<ConferencePrepareJob>;
    /** insert a single row into the table: "Conference" */
    insert_Conference_one?: Maybe<Conference>;
    /** insert data into the table: "ContentGroup" */
    insert_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
    /** insert data into the table: "ContentGroupPerson" */
    insert_ContentGroupPerson?: Maybe<ContentGroupPerson_Mutation_Response>;
    /** insert a single row into the table: "ContentGroupPerson" */
    insert_ContentGroupPerson_one?: Maybe<ContentGroupPerson>;
    /** insert data into the table: "ContentGroupTag" */
    insert_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
    /** insert a single row into the table: "ContentGroupTag" */
    insert_ContentGroupTag_one?: Maybe<ContentGroupTag>;
    /** insert data into the table: "ContentGroupType" */
    insert_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
    /** insert a single row into the table: "ContentGroupType" */
    insert_ContentGroupType_one?: Maybe<ContentGroupType>;
    /** insert a single row into the table: "ContentGroup" */
    insert_ContentGroup_one?: Maybe<ContentGroup>;
    /** insert data into the table: "ContentItem" */
    insert_ContentItem?: Maybe<ContentItem_Mutation_Response>;
    /** insert a single row into the table: "ContentItem" */
    insert_ContentItem_one?: Maybe<ContentItem>;
    /** insert data into the table: "ContentPerson" */
    insert_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
    /** insert a single row into the table: "ContentPerson" */
    insert_ContentPerson_one?: Maybe<ContentPerson>;
    /** insert data into the table: "ContentType" */
    insert_ContentType?: Maybe<ContentType_Mutation_Response>;
    /** insert a single row into the table: "ContentType" */
    insert_ContentType_one?: Maybe<ContentType>;
    /** insert data into the table: "Email" */
    insert_Email?: Maybe<Email_Mutation_Response>;
    /** insert a single row into the table: "Email" */
    insert_Email_one?: Maybe<Email>;
    /** insert data into the table: "Event" */
    insert_Event?: Maybe<Event_Mutation_Response>;
    /** insert data into the table: "EventPerson" */
    insert_EventPerson?: Maybe<EventPerson_Mutation_Response>;
    /** insert data into the table: "EventPersonRole" */
    insert_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
    /** insert a single row into the table: "EventPersonRole" */
    insert_EventPersonRole_one?: Maybe<EventPersonRole>;
    /** insert a single row into the table: "EventPerson" */
    insert_EventPerson_one?: Maybe<EventPerson>;
    /** insert data into the table: "EventTag" */
    insert_EventTag?: Maybe<EventTag_Mutation_Response>;
    /** insert a single row into the table: "EventTag" */
    insert_EventTag_one?: Maybe<EventTag>;
    /** insert a single row into the table: "Event" */
    insert_Event_one?: Maybe<Event>;
    /** insert data into the table: "ExecutedTransitions" */
    insert_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
    /** insert a single row into the table: "ExecutedTransitions" */
    insert_ExecutedTransitions_one?: Maybe<ExecutedTransitions>;
    /** insert data into the table: "FlaggedChatMessage" */
    insert_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
    /** insert a single row into the table: "FlaggedChatMessage" */
    insert_FlaggedChatMessage_one?: Maybe<FlaggedChatMessage>;
    /** insert data into the table: "FollowedChat" */
    insert_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
    /** insert a single row into the table: "FollowedChat" */
    insert_FollowedChat_one?: Maybe<FollowedChat>;
    /** insert data into the table: "Group" */
    insert_Group?: Maybe<Group_Mutation_Response>;
    /** insert data into the table: "GroupAttendee" */
    insert_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
    /** insert a single row into the table: "GroupAttendee" */
    insert_GroupAttendee_one?: Maybe<GroupAttendee>;
    /** insert data into the table: "GroupRole" */
    insert_GroupRole?: Maybe<GroupRole_Mutation_Response>;
    /** insert a single row into the table: "GroupRole" */
    insert_GroupRole_one?: Maybe<GroupRole>;
    /** insert a single row into the table: "Group" */
    insert_Group_one?: Maybe<Group>;
    /** insert data into the table: "InputType" */
    insert_InputType?: Maybe<InputType_Mutation_Response>;
    /** insert a single row into the table: "InputType" */
    insert_InputType_one?: Maybe<InputType>;
    /** insert data into the table: "Invitation" */
    insert_Invitation?: Maybe<Invitation_Mutation_Response>;
    /** insert a single row into the table: "Invitation" */
    insert_Invitation_one?: Maybe<Invitation>;
    /** insert data into the table: "JobStatus" */
    insert_JobStatus?: Maybe<JobStatus_Mutation_Response>;
    /** insert a single row into the table: "JobStatus" */
    insert_JobStatus_one?: Maybe<JobStatus>;
    /** insert data into the table: "OnlineStatus" */
    insert_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
    /** insert a single row into the table: "OnlineStatus" */
    insert_OnlineStatus_one?: Maybe<OnlineStatus>;
    /** insert data into the table: "OriginatingData" */
    insert_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
    /** insert a single row into the table: "OriginatingData" */
    insert_OriginatingData_one?: Maybe<OriginatingData>;
    /** insert data into the table: "Permission" */
    insert_Permission?: Maybe<Permission_Mutation_Response>;
    /** insert a single row into the table: "Permission" */
    insert_Permission_one?: Maybe<Permission>;
    /** insert data into the table: "PinnedChat" */
    insert_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
    /** insert a single row into the table: "PinnedChat" */
    insert_PinnedChat_one?: Maybe<PinnedChat>;
    /** insert data into the table: "RequiredContentItem" */
    insert_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
    /** insert a single row into the table: "RequiredContentItem" */
    insert_RequiredContentItem_one?: Maybe<RequiredContentItem>;
    /** insert data into the table: "Role" */
    insert_Role?: Maybe<Role_Mutation_Response>;
    /** insert data into the table: "RolePermission" */
    insert_RolePermission?: Maybe<RolePermission_Mutation_Response>;
    /** insert a single row into the table: "RolePermission" */
    insert_RolePermission_one?: Maybe<RolePermission>;
    /** insert a single row into the table: "Role" */
    insert_Role_one?: Maybe<Role>;
    /** insert data into the table: "Room" */
    insert_Room?: Maybe<Room_Mutation_Response>;
    /** insert data into the table: "RoomMode" */
    insert_RoomMode?: Maybe<RoomMode_Mutation_Response>;
    /** insert a single row into the table: "RoomMode" */
    insert_RoomMode_one?: Maybe<RoomMode>;
    /** insert data into the table: "RoomParticipant" */
    insert_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
    /** insert a single row into the table: "RoomParticipant" */
    insert_RoomParticipant_one?: Maybe<RoomParticipant>;
    /** insert a single row into the table: "Room" */
    insert_Room_one?: Maybe<Room>;
    /** insert data into the table: "Tag" */
    insert_Tag?: Maybe<Tag_Mutation_Response>;
    /** insert a single row into the table: "Tag" */
    insert_Tag_one?: Maybe<Tag>;
    /** insert data into the table: "TranscriptionJob" */
    insert_TranscriptionJob?: Maybe<TranscriptionJob_Mutation_Response>;
    /** insert a single row into the table: "TranscriptionJob" */
    insert_TranscriptionJob_one?: Maybe<TranscriptionJob>;
    /** insert data into the table: "Transitions" */
    insert_Transitions?: Maybe<Transitions_Mutation_Response>;
    /** insert a single row into the table: "Transitions" */
    insert_Transitions_one?: Maybe<Transitions>;
    /** insert data into the table: "Uploader" */
    insert_Uploader?: Maybe<Uploader_Mutation_Response>;
    /** insert a single row into the table: "Uploader" */
    insert_Uploader_one?: Maybe<Uploader>;
    /** insert data into the table: "User" */
    insert_User?: Maybe<User_Mutation_Response>;
    /** insert a single row into the table: "User" */
    insert_User_one?: Maybe<User>;
    /** insert data into the table: "VideoRenderJob" */
    insert_VideoRenderJob?: Maybe<VideoRenderJob_Mutation_Response>;
    /** insert a single row into the table: "VideoRenderJob" */
    insert_VideoRenderJob_one?: Maybe<VideoRenderJob>;
    /** perform the action: "invitationConfirmCurrent" */
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    /** perform the action: "invitationConfirmSendInitialEmail" */
    invitationConfirmSendInitialEmail?: Maybe<InvitationConfirmationEmailOutput>;
    /** perform the action: "invitationConfirmSendRepeatEmail" */
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    /** perform the action: "invitationConfirmWithCode" */
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    /** perform the action: "invitationSendInitialEmail" */
    invitationSendInitialEmail: Array<InvitationSendEmailResult>;
    /** perform the action: "invitationSendRepeatEmail" */
    invitationSendRepeatEmail: Array<InvitationSendEmailResult>;
    /** perform the action: "submitContentItem" */
    submitContentItem?: Maybe<SubmitContentItemOutput>;
    /** perform the action: "updateSubtitles" */
    updateSubtitles?: Maybe<SubmitUpdatedSubtitlesOutput>;
    /** update data of the table: "Attendee" */
    update_Attendee?: Maybe<Attendee_Mutation_Response>;
    /** update single row of the table: "Attendee" */
    update_Attendee_by_pk?: Maybe<Attendee>;
    /** update data of the table: "Broadcast" */
    update_Broadcast?: Maybe<Broadcast_Mutation_Response>;
    /** update data of the table: "BroadcastContentItem" */
    update_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
    /** update single row of the table: "BroadcastContentItem" */
    update_BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
    /** update single row of the table: "Broadcast" */
    update_Broadcast_by_pk?: Maybe<Broadcast>;
    /** update data of the table: "Chat" */
    update_Chat?: Maybe<Chat_Mutation_Response>;
    /** update data of the table: "ChatMember" */
    update_ChatMember?: Maybe<ChatMember_Mutation_Response>;
    /** update single row of the table: "ChatMember" */
    update_ChatMember_by_pk?: Maybe<ChatMember>;
    /** update data of the table: "ChatMessage" */
    update_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
    /** update single row of the table: "ChatMessage" */
    update_ChatMessage_by_pk?: Maybe<ChatMessage>;
    /** update data of the table: "ChatReaction" */
    update_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
    /** update single row of the table: "ChatReaction" */
    update_ChatReaction_by_pk?: Maybe<ChatReaction>;
    /** update data of the table: "ChatTyper" */
    update_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
    /** update single row of the table: "ChatTyper" */
    update_ChatTyper_by_pk?: Maybe<ChatTyper>;
    /** update data of the table: "ChatUnreadIndex" */
    update_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
    /** update single row of the table: "ChatUnreadIndex" */
    update_ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
    /** update data of the table: "ChatViewer" */
    update_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
    /** update single row of the table: "ChatViewer" */
    update_ChatViewer_by_pk?: Maybe<ChatViewer>;
    /** update single row of the table: "Chat" */
    update_Chat_by_pk?: Maybe<Chat>;
    /** update data of the table: "Conference" */
    update_Conference?: Maybe<Conference_Mutation_Response>;
    /** update data of the table: "ConferenceConfiguration" */
    update_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
    /** update single row of the table: "ConferenceConfiguration" */
    update_ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
    /** update data of the table: "ConferenceDemoCode" */
    update_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
    /** update single row of the table: "ConferenceDemoCode" */
    update_ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
    /** update data of the table: "ConferencePrepareJob" */
    update_ConferencePrepareJob?: Maybe<ConferencePrepareJob_Mutation_Response>;
    /** update single row of the table: "ConferencePrepareJob" */
    update_ConferencePrepareJob_by_pk?: Maybe<ConferencePrepareJob>;
    /** update single row of the table: "Conference" */
    update_Conference_by_pk?: Maybe<Conference>;
    /** update data of the table: "ContentGroup" */
    update_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
    /** update data of the table: "ContentGroupPerson" */
    update_ContentGroupPerson?: Maybe<ContentGroupPerson_Mutation_Response>;
    /** update single row of the table: "ContentGroupPerson" */
    update_ContentGroupPerson_by_pk?: Maybe<ContentGroupPerson>;
    /** update data of the table: "ContentGroupTag" */
    update_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
    /** update single row of the table: "ContentGroupTag" */
    update_ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
    /** update data of the table: "ContentGroupType" */
    update_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
    /** update single row of the table: "ContentGroupType" */
    update_ContentGroupType_by_pk?: Maybe<ContentGroupType>;
    /** update single row of the table: "ContentGroup" */
    update_ContentGroup_by_pk?: Maybe<ContentGroup>;
    /** update data of the table: "ContentItem" */
    update_ContentItem?: Maybe<ContentItem_Mutation_Response>;
    /** update single row of the table: "ContentItem" */
    update_ContentItem_by_pk?: Maybe<ContentItem>;
    /** update data of the table: "ContentPerson" */
    update_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
    /** update single row of the table: "ContentPerson" */
    update_ContentPerson_by_pk?: Maybe<ContentPerson>;
    /** update data of the table: "ContentType" */
    update_ContentType?: Maybe<ContentType_Mutation_Response>;
    /** update single row of the table: "ContentType" */
    update_ContentType_by_pk?: Maybe<ContentType>;
    /** update data of the table: "Email" */
    update_Email?: Maybe<Email_Mutation_Response>;
    /** update single row of the table: "Email" */
    update_Email_by_pk?: Maybe<Email>;
    /** update data of the table: "Event" */
    update_Event?: Maybe<Event_Mutation_Response>;
    /** update data of the table: "EventPerson" */
    update_EventPerson?: Maybe<EventPerson_Mutation_Response>;
    /** update data of the table: "EventPersonRole" */
    update_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
    /** update single row of the table: "EventPersonRole" */
    update_EventPersonRole_by_pk?: Maybe<EventPersonRole>;
    /** update single row of the table: "EventPerson" */
    update_EventPerson_by_pk?: Maybe<EventPerson>;
    /** update data of the table: "EventTag" */
    update_EventTag?: Maybe<EventTag_Mutation_Response>;
    /** update single row of the table: "EventTag" */
    update_EventTag_by_pk?: Maybe<EventTag>;
    /** update single row of the table: "Event" */
    update_Event_by_pk?: Maybe<Event>;
    /** update data of the table: "ExecutedTransitions" */
    update_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
    /** update single row of the table: "ExecutedTransitions" */
    update_ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
    /** update data of the table: "FlaggedChatMessage" */
    update_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
    /** update single row of the table: "FlaggedChatMessage" */
    update_FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
    /** update data of the table: "FollowedChat" */
    update_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
    /** update single row of the table: "FollowedChat" */
    update_FollowedChat_by_pk?: Maybe<FollowedChat>;
    /** update data of the table: "Group" */
    update_Group?: Maybe<Group_Mutation_Response>;
    /** update data of the table: "GroupAttendee" */
    update_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
    /** update single row of the table: "GroupAttendee" */
    update_GroupAttendee_by_pk?: Maybe<GroupAttendee>;
    /** update data of the table: "GroupRole" */
    update_GroupRole?: Maybe<GroupRole_Mutation_Response>;
    /** update single row of the table: "GroupRole" */
    update_GroupRole_by_pk?: Maybe<GroupRole>;
    /** update single row of the table: "Group" */
    update_Group_by_pk?: Maybe<Group>;
    /** update data of the table: "InputType" */
    update_InputType?: Maybe<InputType_Mutation_Response>;
    /** update single row of the table: "InputType" */
    update_InputType_by_pk?: Maybe<InputType>;
    /** update data of the table: "Invitation" */
    update_Invitation?: Maybe<Invitation_Mutation_Response>;
    /** update single row of the table: "Invitation" */
    update_Invitation_by_pk?: Maybe<Invitation>;
    /** update data of the table: "JobStatus" */
    update_JobStatus?: Maybe<JobStatus_Mutation_Response>;
    /** update single row of the table: "JobStatus" */
    update_JobStatus_by_pk?: Maybe<JobStatus>;
    /** update data of the table: "OnlineStatus" */
    update_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
    /** update single row of the table: "OnlineStatus" */
    update_OnlineStatus_by_pk?: Maybe<OnlineStatus>;
    /** update data of the table: "OriginatingData" */
    update_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
    /** update single row of the table: "OriginatingData" */
    update_OriginatingData_by_pk?: Maybe<OriginatingData>;
    /** update data of the table: "Permission" */
    update_Permission?: Maybe<Permission_Mutation_Response>;
    /** update single row of the table: "Permission" */
    update_Permission_by_pk?: Maybe<Permission>;
    /** update data of the table: "PinnedChat" */
    update_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
    /** update single row of the table: "PinnedChat" */
    update_PinnedChat_by_pk?: Maybe<PinnedChat>;
    /** update data of the table: "RequiredContentItem" */
    update_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
    /** update single row of the table: "RequiredContentItem" */
    update_RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
    /** update data of the table: "Role" */
    update_Role?: Maybe<Role_Mutation_Response>;
    /** update data of the table: "RolePermission" */
    update_RolePermission?: Maybe<RolePermission_Mutation_Response>;
    /** update single row of the table: "RolePermission" */
    update_RolePermission_by_pk?: Maybe<RolePermission>;
    /** update single row of the table: "Role" */
    update_Role_by_pk?: Maybe<Role>;
    /** update data of the table: "Room" */
    update_Room?: Maybe<Room_Mutation_Response>;
    /** update data of the table: "RoomMode" */
    update_RoomMode?: Maybe<RoomMode_Mutation_Response>;
    /** update single row of the table: "RoomMode" */
    update_RoomMode_by_pk?: Maybe<RoomMode>;
    /** update data of the table: "RoomParticipant" */
    update_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
    /** update single row of the table: "RoomParticipant" */
    update_RoomParticipant_by_pk?: Maybe<RoomParticipant>;
    /** update single row of the table: "Room" */
    update_Room_by_pk?: Maybe<Room>;
    /** update data of the table: "Tag" */
    update_Tag?: Maybe<Tag_Mutation_Response>;
    /** update single row of the table: "Tag" */
    update_Tag_by_pk?: Maybe<Tag>;
    /** update data of the table: "TranscriptionJob" */
    update_TranscriptionJob?: Maybe<TranscriptionJob_Mutation_Response>;
    /** update single row of the table: "TranscriptionJob" */
    update_TranscriptionJob_by_pk?: Maybe<TranscriptionJob>;
    /** update data of the table: "Transitions" */
    update_Transitions?: Maybe<Transitions_Mutation_Response>;
    /** update single row of the table: "Transitions" */
    update_Transitions_by_pk?: Maybe<Transitions>;
    /** update data of the table: "Uploader" */
    update_Uploader?: Maybe<Uploader_Mutation_Response>;
    /** update single row of the table: "Uploader" */
    update_Uploader_by_pk?: Maybe<Uploader>;
    /** update data of the table: "User" */
    update_User?: Maybe<User_Mutation_Response>;
    /** update single row of the table: "User" */
    update_User_by_pk?: Maybe<User>;
    /** update data of the table: "VideoRenderJob" */
    update_VideoRenderJob?: Maybe<VideoRenderJob_Mutation_Response>;
    /** update single row of the table: "VideoRenderJob" */
    update_VideoRenderJob_by_pk?: Maybe<VideoRenderJob>;
    /** perform the action: "uploadSendSubmissionRequests" */
    uploadSendSubmissionRequests: Array<UploaderSendSubmissionRequestResult>;
};

/** mutation root */
export type Mutation_RootDelete_AttendeeArgs = {
    where: Attendee_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Attendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_BroadcastArgs = {
    where: Broadcast_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_BroadcastContentItemArgs = {
    where: BroadcastContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_BroadcastContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Broadcast_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatArgs = {
    where: Chat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatMemberArgs = {
    where: ChatMember_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatMember_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatMessageArgs = {
    where: ChatMessage_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatReactionArgs = {
    where: ChatReaction_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatReaction_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatTyperArgs = {
    where: ChatTyper_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatTyper_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatUnreadIndexArgs = {
    where: ChatUnreadIndex_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatUnreadIndex_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ChatViewerArgs = {
    where: ChatViewer_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ChatViewer_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Chat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ConferenceArgs = {
    where: Conference_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ConferenceConfigurationArgs = {
    where: ConferenceConfiguration_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ConferenceConfiguration_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ConferenceDemoCodeArgs = {
    where: ConferenceDemoCode_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ConferenceDemoCode_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ConferencePrepareJobArgs = {
    where: ConferencePrepareJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ConferencePrepareJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Conference_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupArgs = {
    where: ContentGroup_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupPersonArgs = {
    where: ContentGroupPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupTagArgs = {
    where: ContentGroupTag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupTypeArgs = {
    where: ContentGroupType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentGroupType_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_ContentGroup_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentItemArgs = {
    where: ContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentPersonArgs = {
    where: ContentPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ContentTypeArgs = {
    where: ContentType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ContentType_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_EmailArgs = {
    where: Email_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Email_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_EventArgs = {
    where: Event_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_EventPersonArgs = {
    where: EventPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_EventPersonRoleArgs = {
    where: EventPersonRole_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_EventPersonRole_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_EventPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_EventTagArgs = {
    where: EventTag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_EventTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Event_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ExecutedTransitionsArgs = {
    where: ExecutedTransitions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_ExecutedTransitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_FlaggedChatMessageArgs = {
    where: FlaggedChatMessage_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_FlaggedChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_FollowedChatArgs = {
    where: FollowedChat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_FollowedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_GroupArgs = {
    where: Group_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_GroupAttendeeArgs = {
    where: GroupAttendee_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_GroupAttendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_GroupRoleArgs = {
    where: GroupRole_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_GroupRole_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Group_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_InputTypeArgs = {
    where: InputType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_InputType_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_InvitationArgs = {
    where: Invitation_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Invitation_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_JobStatusArgs = {
    where: JobStatus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_JobStatus_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_OnlineStatusArgs = {
    where: OnlineStatus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_OnlineStatus_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_OriginatingDataArgs = {
    where: OriginatingData_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_OriginatingData_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_PermissionArgs = {
    where: Permission_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Permission_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_PinnedChatArgs = {
    where: PinnedChat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_PinnedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_RequiredContentItemArgs = {
    where: RequiredContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RequiredContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_RoleArgs = {
    where: Role_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RolePermissionArgs = {
    where: RolePermission_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RolePermission_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Role_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_RoomArgs = {
    where: Room_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RoomModeArgs = {
    where: RoomMode_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RoomMode_By_PkArgs = {
    name: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_RoomParticipantArgs = {
    where: RoomParticipant_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_RoomParticipant_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Room_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_TagArgs = {
    where: Tag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Tag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_TranscriptionJobArgs = {
    where: TranscriptionJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_TranscriptionJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_TransitionsArgs = {
    where: Transitions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Transitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_UploaderArgs = {
    where: Uploader_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Uploader_By_PkArgs = {
    id: Scalars["uuid"];
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
export type Mutation_RootDelete_VideoRenderJobArgs = {
    where: VideoRenderJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_VideoRenderJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootInsert_AttendeeArgs = {
    objects: Array<Attendee_Insert_Input>;
    on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Attendee_OneArgs = {
    object: Attendee_Insert_Input;
    on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_BroadcastArgs = {
    objects: Array<Broadcast_Insert_Input>;
    on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_BroadcastContentItemArgs = {
    objects: Array<BroadcastContentItem_Insert_Input>;
    on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_BroadcastContentItem_OneArgs = {
    object: BroadcastContentItem_Insert_Input;
    on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Broadcast_OneArgs = {
    object: Broadcast_Insert_Input;
    on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatArgs = {
    objects: Array<Chat_Insert_Input>;
    on_conflict?: Maybe<Chat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatMemberArgs = {
    objects: Array<ChatMember_Insert_Input>;
    on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatMember_OneArgs = {
    object: ChatMember_Insert_Input;
    on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatMessageArgs = {
    objects: Array<ChatMessage_Insert_Input>;
    on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatMessage_OneArgs = {
    object: ChatMessage_Insert_Input;
    on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatReactionArgs = {
    objects: Array<ChatReaction_Insert_Input>;
    on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatReaction_OneArgs = {
    object: ChatReaction_Insert_Input;
    on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatTyperArgs = {
    objects: Array<ChatTyper_Insert_Input>;
    on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatTyper_OneArgs = {
    object: ChatTyper_Insert_Input;
    on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatUnreadIndexArgs = {
    objects: Array<ChatUnreadIndex_Insert_Input>;
    on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatUnreadIndex_OneArgs = {
    object: ChatUnreadIndex_Insert_Input;
    on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatViewerArgs = {
    objects: Array<ChatViewer_Insert_Input>;
    on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ChatViewer_OneArgs = {
    object: ChatViewer_Insert_Input;
    on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Chat_OneArgs = {
    object: Chat_Insert_Input;
    on_conflict?: Maybe<Chat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferenceArgs = {
    objects: Array<Conference_Insert_Input>;
    on_conflict?: Maybe<Conference_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferenceConfigurationArgs = {
    objects: Array<ConferenceConfiguration_Insert_Input>;
    on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferenceConfiguration_OneArgs = {
    object: ConferenceConfiguration_Insert_Input;
    on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferenceDemoCodeArgs = {
    objects: Array<ConferenceDemoCode_Insert_Input>;
    on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferenceDemoCode_OneArgs = {
    object: ConferenceDemoCode_Insert_Input;
    on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferencePrepareJobArgs = {
    objects: Array<ConferencePrepareJob_Insert_Input>;
    on_conflict?: Maybe<ConferencePrepareJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ConferencePrepareJob_OneArgs = {
    object: ConferencePrepareJob_Insert_Input;
    on_conflict?: Maybe<ConferencePrepareJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Conference_OneArgs = {
    object: Conference_Insert_Input;
    on_conflict?: Maybe<Conference_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupArgs = {
    objects: Array<ContentGroup_Insert_Input>;
    on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupPersonArgs = {
    objects: Array<ContentGroupPerson_Insert_Input>;
    on_conflict?: Maybe<ContentGroupPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupPerson_OneArgs = {
    object: ContentGroupPerson_Insert_Input;
    on_conflict?: Maybe<ContentGroupPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupTagArgs = {
    objects: Array<ContentGroupTag_Insert_Input>;
    on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupTag_OneArgs = {
    object: ContentGroupTag_Insert_Input;
    on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupTypeArgs = {
    objects: Array<ContentGroupType_Insert_Input>;
    on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroupType_OneArgs = {
    object: ContentGroupType_Insert_Input;
    on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentGroup_OneArgs = {
    object: ContentGroup_Insert_Input;
    on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentItemArgs = {
    objects: Array<ContentItem_Insert_Input>;
    on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentItem_OneArgs = {
    object: ContentItem_Insert_Input;
    on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentPersonArgs = {
    objects: Array<ContentPerson_Insert_Input>;
    on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentPerson_OneArgs = {
    object: ContentPerson_Insert_Input;
    on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentTypeArgs = {
    objects: Array<ContentType_Insert_Input>;
    on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ContentType_OneArgs = {
    object: ContentType_Insert_Input;
    on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EmailArgs = {
    objects: Array<Email_Insert_Input>;
    on_conflict?: Maybe<Email_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Email_OneArgs = {
    object: Email_Insert_Input;
    on_conflict?: Maybe<Email_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventArgs = {
    objects: Array<Event_Insert_Input>;
    on_conflict?: Maybe<Event_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventPersonArgs = {
    objects: Array<EventPerson_Insert_Input>;
    on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventPersonRoleArgs = {
    objects: Array<EventPersonRole_Insert_Input>;
    on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventPersonRole_OneArgs = {
    object: EventPersonRole_Insert_Input;
    on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventPerson_OneArgs = {
    object: EventPerson_Insert_Input;
    on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventTagArgs = {
    objects: Array<EventTag_Insert_Input>;
    on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_EventTag_OneArgs = {
    object: EventTag_Insert_Input;
    on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Event_OneArgs = {
    object: Event_Insert_Input;
    on_conflict?: Maybe<Event_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ExecutedTransitionsArgs = {
    objects: Array<ExecutedTransitions_Insert_Input>;
    on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ExecutedTransitions_OneArgs = {
    object: ExecutedTransitions_Insert_Input;
    on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_FlaggedChatMessageArgs = {
    objects: Array<FlaggedChatMessage_Insert_Input>;
    on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_FlaggedChatMessage_OneArgs = {
    object: FlaggedChatMessage_Insert_Input;
    on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_FollowedChatArgs = {
    objects: Array<FollowedChat_Insert_Input>;
    on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_FollowedChat_OneArgs = {
    object: FollowedChat_Insert_Input;
    on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_GroupArgs = {
    objects: Array<Group_Insert_Input>;
    on_conflict?: Maybe<Group_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_GroupAttendeeArgs = {
    objects: Array<GroupAttendee_Insert_Input>;
    on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_GroupAttendee_OneArgs = {
    object: GroupAttendee_Insert_Input;
    on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_GroupRoleArgs = {
    objects: Array<GroupRole_Insert_Input>;
    on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_GroupRole_OneArgs = {
    object: GroupRole_Insert_Input;
    on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Group_OneArgs = {
    object: Group_Insert_Input;
    on_conflict?: Maybe<Group_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_InputTypeArgs = {
    objects: Array<InputType_Insert_Input>;
    on_conflict?: Maybe<InputType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_InputType_OneArgs = {
    object: InputType_Insert_Input;
    on_conflict?: Maybe<InputType_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_InvitationArgs = {
    objects: Array<Invitation_Insert_Input>;
    on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Invitation_OneArgs = {
    object: Invitation_Insert_Input;
    on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_JobStatusArgs = {
    objects: Array<JobStatus_Insert_Input>;
    on_conflict?: Maybe<JobStatus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_JobStatus_OneArgs = {
    object: JobStatus_Insert_Input;
    on_conflict?: Maybe<JobStatus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_OnlineStatusArgs = {
    objects: Array<OnlineStatus_Insert_Input>;
    on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_OnlineStatus_OneArgs = {
    object: OnlineStatus_Insert_Input;
    on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_OriginatingDataArgs = {
    objects: Array<OriginatingData_Insert_Input>;
    on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_OriginatingData_OneArgs = {
    object: OriginatingData_Insert_Input;
    on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_PermissionArgs = {
    objects: Array<Permission_Insert_Input>;
    on_conflict?: Maybe<Permission_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Permission_OneArgs = {
    object: Permission_Insert_Input;
    on_conflict?: Maybe<Permission_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_PinnedChatArgs = {
    objects: Array<PinnedChat_Insert_Input>;
    on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_PinnedChat_OneArgs = {
    object: PinnedChat_Insert_Input;
    on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RequiredContentItemArgs = {
    objects: Array<RequiredContentItem_Insert_Input>;
    on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RequiredContentItem_OneArgs = {
    object: RequiredContentItem_Insert_Input;
    on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoleArgs = {
    objects: Array<Role_Insert_Input>;
    on_conflict?: Maybe<Role_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RolePermissionArgs = {
    objects: Array<RolePermission_Insert_Input>;
    on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RolePermission_OneArgs = {
    object: RolePermission_Insert_Input;
    on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Role_OneArgs = {
    object: Role_Insert_Input;
    on_conflict?: Maybe<Role_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoomArgs = {
    objects: Array<Room_Insert_Input>;
    on_conflict?: Maybe<Room_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoomModeArgs = {
    objects: Array<RoomMode_Insert_Input>;
    on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoomMode_OneArgs = {
    object: RoomMode_Insert_Input;
    on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoomParticipantArgs = {
    objects: Array<RoomParticipant_Insert_Input>;
    on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoomParticipant_OneArgs = {
    object: RoomParticipant_Insert_Input;
    on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Room_OneArgs = {
    object: Room_Insert_Input;
    on_conflict?: Maybe<Room_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_TagArgs = {
    objects: Array<Tag_Insert_Input>;
    on_conflict?: Maybe<Tag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Tag_OneArgs = {
    object: Tag_Insert_Input;
    on_conflict?: Maybe<Tag_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_TranscriptionJobArgs = {
    objects: Array<TranscriptionJob_Insert_Input>;
    on_conflict?: Maybe<TranscriptionJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_TranscriptionJob_OneArgs = {
    object: TranscriptionJob_Insert_Input;
    on_conflict?: Maybe<TranscriptionJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_TransitionsArgs = {
    objects: Array<Transitions_Insert_Input>;
    on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Transitions_OneArgs = {
    object: Transitions_Insert_Input;
    on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_UploaderArgs = {
    objects: Array<Uploader_Insert_Input>;
    on_conflict?: Maybe<Uploader_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Uploader_OneArgs = {
    object: Uploader_Insert_Input;
    on_conflict?: Maybe<Uploader_On_Conflict>;
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
export type Mutation_RootInsert_VideoRenderJobArgs = {
    objects: Array<VideoRenderJob_Insert_Input>;
    on_conflict?: Maybe<VideoRenderJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_VideoRenderJob_OneArgs = {
    object: VideoRenderJob_Insert_Input;
    on_conflict?: Maybe<VideoRenderJob_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInvitationConfirmCurrentArgs = {
    inviteCode: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootInvitationConfirmSendInitialEmailArgs = {
    inviteInput: InvitationConfirmationEmailInput;
};

/** mutation root */
export type Mutation_RootInvitationConfirmSendRepeatEmailArgs = {
    inviteInput: InvitationConfirmationEmailInput;
};

/** mutation root */
export type Mutation_RootInvitationConfirmWithCodeArgs = {
    inviteInput: ConfirmInvitationInput;
};

/** mutation root */
export type Mutation_RootInvitationSendInitialEmailArgs = {
    attendeeIds: Array<Scalars["String"]>;
};

/** mutation root */
export type Mutation_RootInvitationSendRepeatEmailArgs = {
    attendeeIds: Array<Scalars["String"]>;
};

/** mutation root */
export type Mutation_RootSubmitContentItemArgs = {
    data: Scalars["jsonb"];
    magicToken: Scalars["String"];
};

/** mutation root */
export type Mutation_RootUpdateSubtitlesArgs = {
    contentItemId: Scalars["String"];
    magicToken: Scalars["String"];
    subtitleText: Scalars["String"];
};

/** mutation root */
export type Mutation_RootUpdate_AttendeeArgs = {
    _set?: Maybe<Attendee_Set_Input>;
    where: Attendee_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Attendee_By_PkArgs = {
    _set?: Maybe<Attendee_Set_Input>;
    pk_columns: Attendee_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_BroadcastArgs = {
    _append?: Maybe<Broadcast_Append_Input>;
    _delete_at_path?: Maybe<Broadcast_Delete_At_Path_Input>;
    _delete_elem?: Maybe<Broadcast_Delete_Elem_Input>;
    _delete_key?: Maybe<Broadcast_Delete_Key_Input>;
    _prepend?: Maybe<Broadcast_Prepend_Input>;
    _set?: Maybe<Broadcast_Set_Input>;
    where: Broadcast_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_BroadcastContentItemArgs = {
    _append?: Maybe<BroadcastContentItem_Append_Input>;
    _delete_at_path?: Maybe<BroadcastContentItem_Delete_At_Path_Input>;
    _delete_elem?: Maybe<BroadcastContentItem_Delete_Elem_Input>;
    _delete_key?: Maybe<BroadcastContentItem_Delete_Key_Input>;
    _prepend?: Maybe<BroadcastContentItem_Prepend_Input>;
    _set?: Maybe<BroadcastContentItem_Set_Input>;
    where: BroadcastContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_BroadcastContentItem_By_PkArgs = {
    _append?: Maybe<BroadcastContentItem_Append_Input>;
    _delete_at_path?: Maybe<BroadcastContentItem_Delete_At_Path_Input>;
    _delete_elem?: Maybe<BroadcastContentItem_Delete_Elem_Input>;
    _delete_key?: Maybe<BroadcastContentItem_Delete_Key_Input>;
    _prepend?: Maybe<BroadcastContentItem_Prepend_Input>;
    _set?: Maybe<BroadcastContentItem_Set_Input>;
    pk_columns: BroadcastContentItem_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Broadcast_By_PkArgs = {
    _append?: Maybe<Broadcast_Append_Input>;
    _delete_at_path?: Maybe<Broadcast_Delete_At_Path_Input>;
    _delete_elem?: Maybe<Broadcast_Delete_Elem_Input>;
    _delete_key?: Maybe<Broadcast_Delete_Key_Input>;
    _prepend?: Maybe<Broadcast_Prepend_Input>;
    _set?: Maybe<Broadcast_Set_Input>;
    pk_columns: Broadcast_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatArgs = {
    _set?: Maybe<Chat_Set_Input>;
    where: Chat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatMemberArgs = {
    _set?: Maybe<ChatMember_Set_Input>;
    where: ChatMember_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatMember_By_PkArgs = {
    _set?: Maybe<ChatMember_Set_Input>;
    pk_columns: ChatMember_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatMessageArgs = {
    _append?: Maybe<ChatMessage_Append_Input>;
    _delete_at_path?: Maybe<ChatMessage_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ChatMessage_Delete_Elem_Input>;
    _delete_key?: Maybe<ChatMessage_Delete_Key_Input>;
    _inc?: Maybe<ChatMessage_Inc_Input>;
    _prepend?: Maybe<ChatMessage_Prepend_Input>;
    _set?: Maybe<ChatMessage_Set_Input>;
    where: ChatMessage_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatMessage_By_PkArgs = {
    _append?: Maybe<ChatMessage_Append_Input>;
    _delete_at_path?: Maybe<ChatMessage_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ChatMessage_Delete_Elem_Input>;
    _delete_key?: Maybe<ChatMessage_Delete_Key_Input>;
    _inc?: Maybe<ChatMessage_Inc_Input>;
    _prepend?: Maybe<ChatMessage_Prepend_Input>;
    _set?: Maybe<ChatMessage_Set_Input>;
    pk_columns: ChatMessage_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatReactionArgs = {
    _set?: Maybe<ChatReaction_Set_Input>;
    where: ChatReaction_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatReaction_By_PkArgs = {
    _set?: Maybe<ChatReaction_Set_Input>;
    pk_columns: ChatReaction_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatTyperArgs = {
    _set?: Maybe<ChatTyper_Set_Input>;
    where: ChatTyper_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatTyper_By_PkArgs = {
    _set?: Maybe<ChatTyper_Set_Input>;
    pk_columns: ChatTyper_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatUnreadIndexArgs = {
    _inc?: Maybe<ChatUnreadIndex_Inc_Input>;
    _set?: Maybe<ChatUnreadIndex_Set_Input>;
    where: ChatUnreadIndex_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatUnreadIndex_By_PkArgs = {
    _inc?: Maybe<ChatUnreadIndex_Inc_Input>;
    _set?: Maybe<ChatUnreadIndex_Set_Input>;
    pk_columns: ChatUnreadIndex_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ChatViewerArgs = {
    _set?: Maybe<ChatViewer_Set_Input>;
    where: ChatViewer_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ChatViewer_By_PkArgs = {
    _set?: Maybe<ChatViewer_Set_Input>;
    pk_columns: ChatViewer_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Chat_By_PkArgs = {
    _set?: Maybe<Chat_Set_Input>;
    pk_columns: Chat_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ConferenceArgs = {
    _set?: Maybe<Conference_Set_Input>;
    where: Conference_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ConferenceConfigurationArgs = {
    _append?: Maybe<ConferenceConfiguration_Append_Input>;
    _delete_at_path?: Maybe<ConferenceConfiguration_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ConferenceConfiguration_Delete_Elem_Input>;
    _delete_key?: Maybe<ConferenceConfiguration_Delete_Key_Input>;
    _prepend?: Maybe<ConferenceConfiguration_Prepend_Input>;
    _set?: Maybe<ConferenceConfiguration_Set_Input>;
    where: ConferenceConfiguration_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ConferenceConfiguration_By_PkArgs = {
    _append?: Maybe<ConferenceConfiguration_Append_Input>;
    _delete_at_path?: Maybe<ConferenceConfiguration_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ConferenceConfiguration_Delete_Elem_Input>;
    _delete_key?: Maybe<ConferenceConfiguration_Delete_Key_Input>;
    _prepend?: Maybe<ConferenceConfiguration_Prepend_Input>;
    _set?: Maybe<ConferenceConfiguration_Set_Input>;
    pk_columns: ConferenceConfiguration_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ConferenceDemoCodeArgs = {
    _set?: Maybe<ConferenceDemoCode_Set_Input>;
    where: ConferenceDemoCode_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ConferenceDemoCode_By_PkArgs = {
    _set?: Maybe<ConferenceDemoCode_Set_Input>;
    pk_columns: ConferenceDemoCode_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ConferencePrepareJobArgs = {
    _set?: Maybe<ConferencePrepareJob_Set_Input>;
    where: ConferencePrepareJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ConferencePrepareJob_By_PkArgs = {
    _set?: Maybe<ConferencePrepareJob_Set_Input>;
    pk_columns: ConferencePrepareJob_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Conference_By_PkArgs = {
    _set?: Maybe<Conference_Set_Input>;
    pk_columns: Conference_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupArgs = {
    _set?: Maybe<ContentGroup_Set_Input>;
    where: ContentGroup_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupPersonArgs = {
    _inc?: Maybe<ContentGroupPerson_Inc_Input>;
    _set?: Maybe<ContentGroupPerson_Set_Input>;
    where: ContentGroupPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupPerson_By_PkArgs = {
    _inc?: Maybe<ContentGroupPerson_Inc_Input>;
    _set?: Maybe<ContentGroupPerson_Set_Input>;
    pk_columns: ContentGroupPerson_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupTagArgs = {
    _set?: Maybe<ContentGroupTag_Set_Input>;
    where: ContentGroupTag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupTag_By_PkArgs = {
    _set?: Maybe<ContentGroupTag_Set_Input>;
    pk_columns: ContentGroupTag_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupTypeArgs = {
    _set?: Maybe<ContentGroupType_Set_Input>;
    where: ContentGroupType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroupType_By_PkArgs = {
    _set?: Maybe<ContentGroupType_Set_Input>;
    pk_columns: ContentGroupType_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentGroup_By_PkArgs = {
    _set?: Maybe<ContentGroup_Set_Input>;
    pk_columns: ContentGroup_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentItemArgs = {
    _append?: Maybe<ContentItem_Append_Input>;
    _delete_at_path?: Maybe<ContentItem_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ContentItem_Delete_Elem_Input>;
    _delete_key?: Maybe<ContentItem_Delete_Key_Input>;
    _prepend?: Maybe<ContentItem_Prepend_Input>;
    _set?: Maybe<ContentItem_Set_Input>;
    where: ContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentItem_By_PkArgs = {
    _append?: Maybe<ContentItem_Append_Input>;
    _delete_at_path?: Maybe<ContentItem_Delete_At_Path_Input>;
    _delete_elem?: Maybe<ContentItem_Delete_Elem_Input>;
    _delete_key?: Maybe<ContentItem_Delete_Key_Input>;
    _prepend?: Maybe<ContentItem_Prepend_Input>;
    _set?: Maybe<ContentItem_Set_Input>;
    pk_columns: ContentItem_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentPersonArgs = {
    _set?: Maybe<ContentPerson_Set_Input>;
    where: ContentPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentPerson_By_PkArgs = {
    _set?: Maybe<ContentPerson_Set_Input>;
    pk_columns: ContentPerson_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ContentTypeArgs = {
    _set?: Maybe<ContentType_Set_Input>;
    where: ContentType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ContentType_By_PkArgs = {
    _set?: Maybe<ContentType_Set_Input>;
    pk_columns: ContentType_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_EmailArgs = {
    _inc?: Maybe<Email_Inc_Input>;
    _set?: Maybe<Email_Set_Input>;
    where: Email_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Email_By_PkArgs = {
    _inc?: Maybe<Email_Inc_Input>;
    _set?: Maybe<Email_Set_Input>;
    pk_columns: Email_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_EventArgs = {
    _inc?: Maybe<Event_Inc_Input>;
    _set?: Maybe<Event_Set_Input>;
    where: Event_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_EventPersonArgs = {
    _set?: Maybe<EventPerson_Set_Input>;
    where: EventPerson_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_EventPersonRoleArgs = {
    _set?: Maybe<EventPersonRole_Set_Input>;
    where: EventPersonRole_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_EventPersonRole_By_PkArgs = {
    _set?: Maybe<EventPersonRole_Set_Input>;
    pk_columns: EventPersonRole_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_EventPerson_By_PkArgs = {
    _set?: Maybe<EventPerson_Set_Input>;
    pk_columns: EventPerson_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_EventTagArgs = {
    _set?: Maybe<EventTag_Set_Input>;
    where: EventTag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_EventTag_By_PkArgs = {
    _set?: Maybe<EventTag_Set_Input>;
    pk_columns: EventTag_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Event_By_PkArgs = {
    _inc?: Maybe<Event_Inc_Input>;
    _set?: Maybe<Event_Set_Input>;
    pk_columns: Event_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_ExecutedTransitionsArgs = {
    _set?: Maybe<ExecutedTransitions_Set_Input>;
    where: ExecutedTransitions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_ExecutedTransitions_By_PkArgs = {
    _set?: Maybe<ExecutedTransitions_Set_Input>;
    pk_columns: ExecutedTransitions_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_FlaggedChatMessageArgs = {
    _set?: Maybe<FlaggedChatMessage_Set_Input>;
    where: FlaggedChatMessage_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_FlaggedChatMessage_By_PkArgs = {
    _set?: Maybe<FlaggedChatMessage_Set_Input>;
    pk_columns: FlaggedChatMessage_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_FollowedChatArgs = {
    _set?: Maybe<FollowedChat_Set_Input>;
    where: FollowedChat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_FollowedChat_By_PkArgs = {
    _set?: Maybe<FollowedChat_Set_Input>;
    pk_columns: FollowedChat_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_GroupArgs = {
    _set?: Maybe<Group_Set_Input>;
    where: Group_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_GroupAttendeeArgs = {
    _set?: Maybe<GroupAttendee_Set_Input>;
    where: GroupAttendee_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_GroupAttendee_By_PkArgs = {
    _set?: Maybe<GroupAttendee_Set_Input>;
    pk_columns: GroupAttendee_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_GroupRoleArgs = {
    _set?: Maybe<GroupRole_Set_Input>;
    where: GroupRole_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_GroupRole_By_PkArgs = {
    _set?: Maybe<GroupRole_Set_Input>;
    pk_columns: GroupRole_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Group_By_PkArgs = {
    _set?: Maybe<Group_Set_Input>;
    pk_columns: Group_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_InputTypeArgs = {
    _set?: Maybe<InputType_Set_Input>;
    where: InputType_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_InputType_By_PkArgs = {
    _set?: Maybe<InputType_Set_Input>;
    pk_columns: InputType_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_InvitationArgs = {
    _set?: Maybe<Invitation_Set_Input>;
    where: Invitation_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Invitation_By_PkArgs = {
    _set?: Maybe<Invitation_Set_Input>;
    pk_columns: Invitation_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_JobStatusArgs = {
    _set?: Maybe<JobStatus_Set_Input>;
    where: JobStatus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_JobStatus_By_PkArgs = {
    _set?: Maybe<JobStatus_Set_Input>;
    pk_columns: JobStatus_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_OnlineStatusArgs = {
    _set?: Maybe<OnlineStatus_Set_Input>;
    where: OnlineStatus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_OnlineStatus_By_PkArgs = {
    _set?: Maybe<OnlineStatus_Set_Input>;
    pk_columns: OnlineStatus_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_OriginatingDataArgs = {
    _append?: Maybe<OriginatingData_Append_Input>;
    _delete_at_path?: Maybe<OriginatingData_Delete_At_Path_Input>;
    _delete_elem?: Maybe<OriginatingData_Delete_Elem_Input>;
    _delete_key?: Maybe<OriginatingData_Delete_Key_Input>;
    _prepend?: Maybe<OriginatingData_Prepend_Input>;
    _set?: Maybe<OriginatingData_Set_Input>;
    where: OriginatingData_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_OriginatingData_By_PkArgs = {
    _append?: Maybe<OriginatingData_Append_Input>;
    _delete_at_path?: Maybe<OriginatingData_Delete_At_Path_Input>;
    _delete_elem?: Maybe<OriginatingData_Delete_Elem_Input>;
    _delete_key?: Maybe<OriginatingData_Delete_Key_Input>;
    _prepend?: Maybe<OriginatingData_Prepend_Input>;
    _set?: Maybe<OriginatingData_Set_Input>;
    pk_columns: OriginatingData_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_PermissionArgs = {
    _set?: Maybe<Permission_Set_Input>;
    where: Permission_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Permission_By_PkArgs = {
    _set?: Maybe<Permission_Set_Input>;
    pk_columns: Permission_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_PinnedChatArgs = {
    _set?: Maybe<PinnedChat_Set_Input>;
    where: PinnedChat_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_PinnedChat_By_PkArgs = {
    _set?: Maybe<PinnedChat_Set_Input>;
    pk_columns: PinnedChat_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_RequiredContentItemArgs = {
    _set?: Maybe<RequiredContentItem_Set_Input>;
    where: RequiredContentItem_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RequiredContentItem_By_PkArgs = {
    _set?: Maybe<RequiredContentItem_Set_Input>;
    pk_columns: RequiredContentItem_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_RoleArgs = {
    _set?: Maybe<Role_Set_Input>;
    where: Role_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RolePermissionArgs = {
    _set?: Maybe<RolePermission_Set_Input>;
    where: RolePermission_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RolePermission_By_PkArgs = {
    _set?: Maybe<RolePermission_Set_Input>;
    pk_columns: RolePermission_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Role_By_PkArgs = {
    _set?: Maybe<Role_Set_Input>;
    pk_columns: Role_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_RoomArgs = {
    _inc?: Maybe<Room_Inc_Input>;
    _set?: Maybe<Room_Set_Input>;
    where: Room_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RoomModeArgs = {
    _set?: Maybe<RoomMode_Set_Input>;
    where: RoomMode_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RoomMode_By_PkArgs = {
    _set?: Maybe<RoomMode_Set_Input>;
    pk_columns: RoomMode_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_RoomParticipantArgs = {
    _set?: Maybe<RoomParticipant_Set_Input>;
    where: RoomParticipant_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_RoomParticipant_By_PkArgs = {
    _set?: Maybe<RoomParticipant_Set_Input>;
    pk_columns: RoomParticipant_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Room_By_PkArgs = {
    _inc?: Maybe<Room_Inc_Input>;
    _set?: Maybe<Room_Set_Input>;
    pk_columns: Room_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_TagArgs = {
    _set?: Maybe<Tag_Set_Input>;
    where: Tag_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Tag_By_PkArgs = {
    _set?: Maybe<Tag_Set_Input>;
    pk_columns: Tag_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_TranscriptionJobArgs = {
    _set?: Maybe<TranscriptionJob_Set_Input>;
    where: TranscriptionJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_TranscriptionJob_By_PkArgs = {
    _set?: Maybe<TranscriptionJob_Set_Input>;
    pk_columns: TranscriptionJob_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_TransitionsArgs = {
    _set?: Maybe<Transitions_Set_Input>;
    where: Transitions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Transitions_By_PkArgs = {
    _set?: Maybe<Transitions_Set_Input>;
    pk_columns: Transitions_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_UploaderArgs = {
    _inc?: Maybe<Uploader_Inc_Input>;
    _set?: Maybe<Uploader_Set_Input>;
    where: Uploader_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Uploader_By_PkArgs = {
    _inc?: Maybe<Uploader_Inc_Input>;
    _set?: Maybe<Uploader_Set_Input>;
    pk_columns: Uploader_Pk_Columns_Input;
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

/** mutation root */
export type Mutation_RootUpdate_VideoRenderJobArgs = {
    _append?: Maybe<VideoRenderJob_Append_Input>;
    _delete_at_path?: Maybe<VideoRenderJob_Delete_At_Path_Input>;
    _delete_elem?: Maybe<VideoRenderJob_Delete_Elem_Input>;
    _delete_key?: Maybe<VideoRenderJob_Delete_Key_Input>;
    _prepend?: Maybe<VideoRenderJob_Prepend_Input>;
    _set?: Maybe<VideoRenderJob_Set_Input>;
    where: VideoRenderJob_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_VideoRenderJob_By_PkArgs = {
    _append?: Maybe<VideoRenderJob_Append_Input>;
    _delete_at_path?: Maybe<VideoRenderJob_Delete_At_Path_Input>;
    _delete_elem?: Maybe<VideoRenderJob_Delete_Elem_Input>;
    _delete_key?: Maybe<VideoRenderJob_Delete_Key_Input>;
    _prepend?: Maybe<VideoRenderJob_Prepend_Input>;
    _set?: Maybe<VideoRenderJob_Set_Input>;
    pk_columns: VideoRenderJob_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUploadSendSubmissionRequestsArgs = {
    uploaderIds: Array<Maybe<Scalars["uuid"]>>;
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
    /** fetch data from the table: "Attendee" */
    Attendee: Array<Attendee>;
    /** fetch aggregated fields from the table: "Attendee" */
    Attendee_aggregate: Attendee_Aggregate;
    /** fetch data from the table: "Attendee" using primary key columns */
    Attendee_by_pk?: Maybe<Attendee>;
    /** fetch data from the table: "Broadcast" */
    Broadcast: Array<Broadcast>;
    /** fetch data from the table: "BroadcastContentItem" */
    BroadcastContentItem: Array<BroadcastContentItem>;
    /** fetch aggregated fields from the table: "BroadcastContentItem" */
    BroadcastContentItem_aggregate: BroadcastContentItem_Aggregate;
    /** fetch data from the table: "BroadcastContentItem" using primary key columns */
    BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
    /** fetch aggregated fields from the table: "Broadcast" */
    Broadcast_aggregate: Broadcast_Aggregate;
    /** fetch data from the table: "Broadcast" using primary key columns */
    Broadcast_by_pk?: Maybe<Broadcast>;
    /** fetch data from the table: "Chat" */
    Chat: Array<Chat>;
    /** fetch data from the table: "ChatMember" */
    ChatMember: Array<ChatMember>;
    /** fetch aggregated fields from the table: "ChatMember" */
    ChatMember_aggregate: ChatMember_Aggregate;
    /** fetch data from the table: "ChatMember" using primary key columns */
    ChatMember_by_pk?: Maybe<ChatMember>;
    /** fetch data from the table: "ChatMessage" */
    ChatMessage: Array<ChatMessage>;
    /** fetch aggregated fields from the table: "ChatMessage" */
    ChatMessage_aggregate: ChatMessage_Aggregate;
    /** fetch data from the table: "ChatMessage" using primary key columns */
    ChatMessage_by_pk?: Maybe<ChatMessage>;
    /** fetch data from the table: "ChatReaction" */
    ChatReaction: Array<ChatReaction>;
    /** fetch aggregated fields from the table: "ChatReaction" */
    ChatReaction_aggregate: ChatReaction_Aggregate;
    /** fetch data from the table: "ChatReaction" using primary key columns */
    ChatReaction_by_pk?: Maybe<ChatReaction>;
    /** fetch data from the table: "ChatTyper" */
    ChatTyper: Array<ChatTyper>;
    /** fetch aggregated fields from the table: "ChatTyper" */
    ChatTyper_aggregate: ChatTyper_Aggregate;
    /** fetch data from the table: "ChatTyper" using primary key columns */
    ChatTyper_by_pk?: Maybe<ChatTyper>;
    /** fetch data from the table: "ChatUnreadIndex" */
    ChatUnreadIndex: Array<ChatUnreadIndex>;
    /** fetch aggregated fields from the table: "ChatUnreadIndex" */
    ChatUnreadIndex_aggregate: ChatUnreadIndex_Aggregate;
    /** fetch data from the table: "ChatUnreadIndex" using primary key columns */
    ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
    /** fetch data from the table: "ChatViewer" */
    ChatViewer: Array<ChatViewer>;
    /** fetch aggregated fields from the table: "ChatViewer" */
    ChatViewer_aggregate: ChatViewer_Aggregate;
    /** fetch data from the table: "ChatViewer" using primary key columns */
    ChatViewer_by_pk?: Maybe<ChatViewer>;
    /** fetch aggregated fields from the table: "Chat" */
    Chat_aggregate: Chat_Aggregate;
    /** fetch data from the table: "Chat" using primary key columns */
    Chat_by_pk?: Maybe<Chat>;
    /** fetch data from the table: "Conference" */
    Conference: Array<Conference>;
    /** fetch data from the table: "ConferenceConfiguration" */
    ConferenceConfiguration: Array<ConferenceConfiguration>;
    /** fetch aggregated fields from the table: "ConferenceConfiguration" */
    ConferenceConfiguration_aggregate: ConferenceConfiguration_Aggregate;
    /** fetch data from the table: "ConferenceConfiguration" using primary key columns */
    ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
    /** fetch data from the table: "ConferenceDemoCode" */
    ConferenceDemoCode: Array<ConferenceDemoCode>;
    /** fetch aggregated fields from the table: "ConferenceDemoCode" */
    ConferenceDemoCode_aggregate: ConferenceDemoCode_Aggregate;
    /** fetch data from the table: "ConferenceDemoCode" using primary key columns */
    ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
    /** fetch data from the table: "ConferencePrepareJob" */
    ConferencePrepareJob: Array<ConferencePrepareJob>;
    /** fetch aggregated fields from the table: "ConferencePrepareJob" */
    ConferencePrepareJob_aggregate: ConferencePrepareJob_Aggregate;
    /** fetch data from the table: "ConferencePrepareJob" using primary key columns */
    ConferencePrepareJob_by_pk?: Maybe<ConferencePrepareJob>;
    /** fetch aggregated fields from the table: "Conference" */
    Conference_aggregate: Conference_Aggregate;
    /** fetch data from the table: "Conference" using primary key columns */
    Conference_by_pk?: Maybe<Conference>;
    /** fetch data from the table: "ContentGroup" */
    ContentGroup: Array<ContentGroup>;
    /** fetch data from the table: "ContentGroupPerson" */
    ContentGroupPerson: Array<ContentGroupPerson>;
    /** fetch aggregated fields from the table: "ContentGroupPerson" */
    ContentGroupPerson_aggregate: ContentGroupPerson_Aggregate;
    /** fetch data from the table: "ContentGroupPerson" using primary key columns */
    ContentGroupPerson_by_pk?: Maybe<ContentGroupPerson>;
    /** fetch data from the table: "ContentGroupTag" */
    ContentGroupTag: Array<ContentGroupTag>;
    /** fetch aggregated fields from the table: "ContentGroupTag" */
    ContentGroupTag_aggregate: ContentGroupTag_Aggregate;
    /** fetch data from the table: "ContentGroupTag" using primary key columns */
    ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
    /** fetch data from the table: "ContentGroupType" */
    ContentGroupType: Array<ContentGroupType>;
    /** fetch aggregated fields from the table: "ContentGroupType" */
    ContentGroupType_aggregate: ContentGroupType_Aggregate;
    /** fetch data from the table: "ContentGroupType" using primary key columns */
    ContentGroupType_by_pk?: Maybe<ContentGroupType>;
    /** fetch aggregated fields from the table: "ContentGroup" */
    ContentGroup_aggregate: ContentGroup_Aggregate;
    /** fetch data from the table: "ContentGroup" using primary key columns */
    ContentGroup_by_pk?: Maybe<ContentGroup>;
    /** fetch data from the table: "ContentItem" */
    ContentItem: Array<ContentItem>;
    /** fetch aggregated fields from the table: "ContentItem" */
    ContentItem_aggregate: ContentItem_Aggregate;
    /** fetch data from the table: "ContentItem" using primary key columns */
    ContentItem_by_pk?: Maybe<ContentItem>;
    /** fetch data from the table: "ContentPerson" */
    ContentPerson: Array<ContentPerson>;
    /** fetch aggregated fields from the table: "ContentPerson" */
    ContentPerson_aggregate: ContentPerson_Aggregate;
    /** fetch data from the table: "ContentPerson" using primary key columns */
    ContentPerson_by_pk?: Maybe<ContentPerson>;
    /** fetch data from the table: "ContentType" */
    ContentType: Array<ContentType>;
    /** fetch aggregated fields from the table: "ContentType" */
    ContentType_aggregate: ContentType_Aggregate;
    /** fetch data from the table: "ContentType" using primary key columns */
    ContentType_by_pk?: Maybe<ContentType>;
    /** fetch data from the table: "Email" */
    Email: Array<Email>;
    /** fetch aggregated fields from the table: "Email" */
    Email_aggregate: Email_Aggregate;
    /** fetch data from the table: "Email" using primary key columns */
    Email_by_pk?: Maybe<Email>;
    /** fetch data from the table: "Event" */
    Event: Array<Event>;
    /** fetch data from the table: "EventPerson" */
    EventPerson: Array<EventPerson>;
    /** fetch data from the table: "EventPersonRole" */
    EventPersonRole: Array<EventPersonRole>;
    /** fetch aggregated fields from the table: "EventPersonRole" */
    EventPersonRole_aggregate: EventPersonRole_Aggregate;
    /** fetch data from the table: "EventPersonRole" using primary key columns */
    EventPersonRole_by_pk?: Maybe<EventPersonRole>;
    /** fetch aggregated fields from the table: "EventPerson" */
    EventPerson_aggregate: EventPerson_Aggregate;
    /** fetch data from the table: "EventPerson" using primary key columns */
    EventPerson_by_pk?: Maybe<EventPerson>;
    /** fetch data from the table: "EventTag" */
    EventTag: Array<EventTag>;
    /** fetch aggregated fields from the table: "EventTag" */
    EventTag_aggregate: EventTag_Aggregate;
    /** fetch data from the table: "EventTag" using primary key columns */
    EventTag_by_pk?: Maybe<EventTag>;
    /** fetch aggregated fields from the table: "Event" */
    Event_aggregate: Event_Aggregate;
    /** fetch data from the table: "Event" using primary key columns */
    Event_by_pk?: Maybe<Event>;
    /** fetch data from the table: "ExecutedTransitions" */
    ExecutedTransitions: Array<ExecutedTransitions>;
    /** fetch aggregated fields from the table: "ExecutedTransitions" */
    ExecutedTransitions_aggregate: ExecutedTransitions_Aggregate;
    /** fetch data from the table: "ExecutedTransitions" using primary key columns */
    ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
    /** fetch data from the table: "FlaggedChatMessage" */
    FlaggedChatMessage: Array<FlaggedChatMessage>;
    /** fetch aggregated fields from the table: "FlaggedChatMessage" */
    FlaggedChatMessage_aggregate: FlaggedChatMessage_Aggregate;
    /** fetch data from the table: "FlaggedChatMessage" using primary key columns */
    FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
    /** fetch data from the table: "FollowedChat" */
    FollowedChat: Array<FollowedChat>;
    /** fetch aggregated fields from the table: "FollowedChat" */
    FollowedChat_aggregate: FollowedChat_Aggregate;
    /** fetch data from the table: "FollowedChat" using primary key columns */
    FollowedChat_by_pk?: Maybe<FollowedChat>;
    /** fetch data from the table: "Group" */
    Group: Array<Group>;
    /** fetch data from the table: "GroupAttendee" */
    GroupAttendee: Array<GroupAttendee>;
    /** fetch aggregated fields from the table: "GroupAttendee" */
    GroupAttendee_aggregate: GroupAttendee_Aggregate;
    /** fetch data from the table: "GroupAttendee" using primary key columns */
    GroupAttendee_by_pk?: Maybe<GroupAttendee>;
    /** fetch data from the table: "GroupRole" */
    GroupRole: Array<GroupRole>;
    /** fetch aggregated fields from the table: "GroupRole" */
    GroupRole_aggregate: GroupRole_Aggregate;
    /** fetch data from the table: "GroupRole" using primary key columns */
    GroupRole_by_pk?: Maybe<GroupRole>;
    /** fetch aggregated fields from the table: "Group" */
    Group_aggregate: Group_Aggregate;
    /** fetch data from the table: "Group" using primary key columns */
    Group_by_pk?: Maybe<Group>;
    /** fetch data from the table: "InputType" */
    InputType: Array<InputType>;
    /** fetch aggregated fields from the table: "InputType" */
    InputType_aggregate: InputType_Aggregate;
    /** fetch data from the table: "InputType" using primary key columns */
    InputType_by_pk?: Maybe<InputType>;
    /** fetch data from the table: "Invitation" */
    Invitation: Array<Invitation>;
    /** fetch aggregated fields from the table: "Invitation" */
    Invitation_aggregate: Invitation_Aggregate;
    /** fetch data from the table: "Invitation" using primary key columns */
    Invitation_by_pk?: Maybe<Invitation>;
    /** fetch data from the table: "JobStatus" */
    JobStatus: Array<JobStatus>;
    /** fetch aggregated fields from the table: "JobStatus" */
    JobStatus_aggregate: JobStatus_Aggregate;
    /** fetch data from the table: "JobStatus" using primary key columns */
    JobStatus_by_pk?: Maybe<JobStatus>;
    /** fetch data from the table: "OnlineStatus" */
    OnlineStatus: Array<OnlineStatus>;
    /** fetch aggregated fields from the table: "OnlineStatus" */
    OnlineStatus_aggregate: OnlineStatus_Aggregate;
    /** fetch data from the table: "OnlineStatus" using primary key columns */
    OnlineStatus_by_pk?: Maybe<OnlineStatus>;
    /** fetch data from the table: "OriginatingData" */
    OriginatingData: Array<OriginatingData>;
    /** fetch aggregated fields from the table: "OriginatingData" */
    OriginatingData_aggregate: OriginatingData_Aggregate;
    /** fetch data from the table: "OriginatingData" using primary key columns */
    OriginatingData_by_pk?: Maybe<OriginatingData>;
    /** fetch data from the table: "Permission" */
    Permission: Array<Permission>;
    /** fetch aggregated fields from the table: "Permission" */
    Permission_aggregate: Permission_Aggregate;
    /** fetch data from the table: "Permission" using primary key columns */
    Permission_by_pk?: Maybe<Permission>;
    /** fetch data from the table: "PinnedChat" */
    PinnedChat: Array<PinnedChat>;
    /** fetch aggregated fields from the table: "PinnedChat" */
    PinnedChat_aggregate: PinnedChat_Aggregate;
    /** fetch data from the table: "PinnedChat" using primary key columns */
    PinnedChat_by_pk?: Maybe<PinnedChat>;
    /** fetch data from the table: "RequiredContentItem" */
    RequiredContentItem: Array<RequiredContentItem>;
    /** fetch aggregated fields from the table: "RequiredContentItem" */
    RequiredContentItem_aggregate: RequiredContentItem_Aggregate;
    /** fetch data from the table: "RequiredContentItem" using primary key columns */
    RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
    /** fetch data from the table: "Role" */
    Role: Array<Role>;
    /** fetch data from the table: "RolePermission" */
    RolePermission: Array<RolePermission>;
    /** fetch aggregated fields from the table: "RolePermission" */
    RolePermission_aggregate: RolePermission_Aggregate;
    /** fetch data from the table: "RolePermission" using primary key columns */
    RolePermission_by_pk?: Maybe<RolePermission>;
    /** fetch aggregated fields from the table: "Role" */
    Role_aggregate: Role_Aggregate;
    /** fetch data from the table: "Role" using primary key columns */
    Role_by_pk?: Maybe<Role>;
    /** fetch data from the table: "Room" */
    Room: Array<Room>;
    /** fetch data from the table: "RoomMode" */
    RoomMode: Array<RoomMode>;
    /** fetch aggregated fields from the table: "RoomMode" */
    RoomMode_aggregate: RoomMode_Aggregate;
    /** fetch data from the table: "RoomMode" using primary key columns */
    RoomMode_by_pk?: Maybe<RoomMode>;
    /** fetch data from the table: "RoomParticipant" */
    RoomParticipant: Array<RoomParticipant>;
    /** fetch aggregated fields from the table: "RoomParticipant" */
    RoomParticipant_aggregate: RoomParticipant_Aggregate;
    /** fetch data from the table: "RoomParticipant" using primary key columns */
    RoomParticipant_by_pk?: Maybe<RoomParticipant>;
    /** fetch aggregated fields from the table: "Room" */
    Room_aggregate: Room_Aggregate;
    /** fetch data from the table: "Room" using primary key columns */
    Room_by_pk?: Maybe<Room>;
    /** fetch data from the table: "Tag" */
    Tag: Array<Tag>;
    /** fetch aggregated fields from the table: "Tag" */
    Tag_aggregate: Tag_Aggregate;
    /** fetch data from the table: "Tag" using primary key columns */
    Tag_by_pk?: Maybe<Tag>;
    /** fetch data from the table: "TranscriptionJob" */
    TranscriptionJob: Array<TranscriptionJob>;
    /** fetch aggregated fields from the table: "TranscriptionJob" */
    TranscriptionJob_aggregate: TranscriptionJob_Aggregate;
    /** fetch data from the table: "TranscriptionJob" using primary key columns */
    TranscriptionJob_by_pk?: Maybe<TranscriptionJob>;
    /** fetch data from the table: "Transitions" */
    Transitions: Array<Transitions>;
    /** fetch aggregated fields from the table: "Transitions" */
    Transitions_aggregate: Transitions_Aggregate;
    /** fetch data from the table: "Transitions" using primary key columns */
    Transitions_by_pk?: Maybe<Transitions>;
    /** fetch data from the table: "Uploader" */
    Uploader: Array<Uploader>;
    /** fetch aggregated fields from the table: "Uploader" */
    Uploader_aggregate: Uploader_Aggregate;
    /** fetch data from the table: "Uploader" using primary key columns */
    Uploader_by_pk?: Maybe<Uploader>;
    /** fetch data from the table: "User" */
    User: Array<User>;
    /** fetch aggregated fields from the table: "User" */
    User_aggregate: User_Aggregate;
    /** fetch data from the table: "User" using primary key columns */
    User_by_pk?: Maybe<User>;
    /** fetch data from the table: "VideoRenderJob" */
    VideoRenderJob: Array<VideoRenderJob>;
    /** fetch aggregated fields from the table: "VideoRenderJob" */
    VideoRenderJob_aggregate: VideoRenderJob_Aggregate;
    /** fetch data from the table: "VideoRenderJob" using primary key columns */
    VideoRenderJob_by_pk?: Maybe<VideoRenderJob>;
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
    /** perform the action: "getContentItem" */
    getContentItem?: Maybe<Array<Maybe<GetContentItemOutput>>>;
    /** perform the action: "getUploadAgreement" */
    getUploadAgreement?: Maybe<GetUploadAgreementOutput>;
    /** perform the action: "protectedEcho" */
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

/** query root */
export type Query_RootAttendeeArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** query root */
export type Query_RootAttendee_AggregateArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** query root */
export type Query_RootAttendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootBroadcastArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** query root */
export type Query_RootBroadcastContentItemArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootBroadcastContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootBroadcastContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootBroadcast_AggregateArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** query root */
export type Query_RootBroadcast_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** query root */
export type Query_RootChatMemberArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** query root */
export type Query_RootChatMember_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** query root */
export type Query_RootChatMember_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatMessageArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** query root */
export type Query_RootChatMessage_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** query root */
export type Query_RootChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatReactionArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** query root */
export type Query_RootChatReaction_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** query root */
export type Query_RootChatReaction_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatTyperArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** query root */
export type Query_RootChatTyper_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** query root */
export type Query_RootChatTyper_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatUnreadIndexArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** query root */
export type Query_RootChatUnreadIndex_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** query root */
export type Query_RootChatUnreadIndex_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChatViewerArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** query root */
export type Query_RootChatViewer_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** query root */
export type Query_RootChatViewer_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootChat_AggregateArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** query root */
export type Query_RootChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootConferenceArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** query root */
export type Query_RootConferenceConfigurationArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** query root */
export type Query_RootConferenceConfiguration_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** query root */
export type Query_RootConferenceConfiguration_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootConferenceDemoCodeArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** query root */
export type Query_RootConferenceDemoCode_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** query root */
export type Query_RootConferenceDemoCode_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootConferencePrepareJobArgs = {
    distinct_on?: Maybe<Array<ConferencePrepareJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferencePrepareJob_Order_By>>;
    where?: Maybe<ConferencePrepareJob_Bool_Exp>;
};

/** query root */
export type Query_RootConferencePrepareJob_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferencePrepareJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferencePrepareJob_Order_By>>;
    where?: Maybe<ConferencePrepareJob_Bool_Exp>;
};

/** query root */
export type Query_RootConferencePrepareJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootConference_AggregateArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** query root */
export type Query_RootConference_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentGroupArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupPersonArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentGroupTagArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupTag_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentGroupTypeArgs = {
    distinct_on?: Maybe<Array<ContentGroupType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupType_Order_By>>;
    where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupType_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupType_Order_By>>;
    where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroupType_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootContentGroup_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** query root */
export type Query_RootContentGroup_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentItemArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentPersonArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** query root */
export type Query_RootContentPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** query root */
export type Query_RootContentPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootContentTypeArgs = {
    distinct_on?: Maybe<Array<ContentType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentType_Order_By>>;
    where?: Maybe<ContentType_Bool_Exp>;
};

/** query root */
export type Query_RootContentType_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentType_Order_By>>;
    where?: Maybe<ContentType_Bool_Exp>;
};

/** query root */
export type Query_RootContentType_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootEmailArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** query root */
export type Query_RootEmail_AggregateArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** query root */
export type Query_RootEmail_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootEventArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** query root */
export type Query_RootEventPersonArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** query root */
export type Query_RootEventPersonRoleArgs = {
    distinct_on?: Maybe<Array<EventPersonRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPersonRole_Order_By>>;
    where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** query root */
export type Query_RootEventPersonRole_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPersonRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPersonRole_Order_By>>;
    where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** query root */
export type Query_RootEventPersonRole_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootEventPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** query root */
export type Query_RootEventPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootEventTagArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** query root */
export type Query_RootEventTag_AggregateArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** query root */
export type Query_RootEventTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootEvent_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** query root */
export type Query_RootEvent_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootExecutedTransitionsArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** query root */
export type Query_RootExecutedTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** query root */
export type Query_RootExecutedTransitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootFlaggedChatMessageArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** query root */
export type Query_RootFlaggedChatMessage_AggregateArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** query root */
export type Query_RootFlaggedChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootFollowedChatArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** query root */
export type Query_RootFollowedChat_AggregateArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** query root */
export type Query_RootFollowedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootGroupArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** query root */
export type Query_RootGroupAttendeeArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** query root */
export type Query_RootGroupAttendee_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** query root */
export type Query_RootGroupAttendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootGroupRoleArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** query root */
export type Query_RootGroupRole_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** query root */
export type Query_RootGroupRole_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootGroup_AggregateArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** query root */
export type Query_RootGroup_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootInputTypeArgs = {
    distinct_on?: Maybe<Array<InputType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<InputType_Order_By>>;
    where?: Maybe<InputType_Bool_Exp>;
};

/** query root */
export type Query_RootInputType_AggregateArgs = {
    distinct_on?: Maybe<Array<InputType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<InputType_Order_By>>;
    where?: Maybe<InputType_Bool_Exp>;
};

/** query root */
export type Query_RootInputType_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootInvitationArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** query root */
export type Query_RootInvitation_AggregateArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** query root */
export type Query_RootInvitation_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootJobStatusArgs = {
    distinct_on?: Maybe<Array<JobStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<JobStatus_Order_By>>;
    where?: Maybe<JobStatus_Bool_Exp>;
};

/** query root */
export type Query_RootJobStatus_AggregateArgs = {
    distinct_on?: Maybe<Array<JobStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<JobStatus_Order_By>>;
    where?: Maybe<JobStatus_Bool_Exp>;
};

/** query root */
export type Query_RootJobStatus_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootOnlineStatusArgs = {
    distinct_on?: Maybe<Array<OnlineStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OnlineStatus_Order_By>>;
    where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** query root */
export type Query_RootOnlineStatus_AggregateArgs = {
    distinct_on?: Maybe<Array<OnlineStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OnlineStatus_Order_By>>;
    where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** query root */
export type Query_RootOnlineStatus_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootOriginatingDataArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** query root */
export type Query_RootOriginatingData_AggregateArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** query root */
export type Query_RootOriginatingData_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootPermissionArgs = {
    distinct_on?: Maybe<Array<Permission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Permission_Order_By>>;
    where?: Maybe<Permission_Bool_Exp>;
};

/** query root */
export type Query_RootPermission_AggregateArgs = {
    distinct_on?: Maybe<Array<Permission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Permission_Order_By>>;
    where?: Maybe<Permission_Bool_Exp>;
};

/** query root */
export type Query_RootPermission_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootPinnedChatArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** query root */
export type Query_RootPinnedChat_AggregateArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** query root */
export type Query_RootPinnedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootRequiredContentItemArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootRequiredContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** query root */
export type Query_RootRequiredContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootRoleArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** query root */
export type Query_RootRolePermissionArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** query root */
export type Query_RootRolePermission_AggregateArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** query root */
export type Query_RootRolePermission_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootRole_AggregateArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** query root */
export type Query_RootRole_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootRoomArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** query root */
export type Query_RootRoomModeArgs = {
    distinct_on?: Maybe<Array<RoomMode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomMode_Order_By>>;
    where?: Maybe<RoomMode_Bool_Exp>;
};

/** query root */
export type Query_RootRoomMode_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomMode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomMode_Order_By>>;
    where?: Maybe<RoomMode_Bool_Exp>;
};

/** query root */
export type Query_RootRoomMode_By_PkArgs = {
    name: Scalars["String"];
};

/** query root */
export type Query_RootRoomParticipantArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** query root */
export type Query_RootRoomParticipant_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** query root */
export type Query_RootRoomParticipant_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootRoom_AggregateArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** query root */
export type Query_RootRoom_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootTagArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** query root */
export type Query_RootTag_AggregateArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** query root */
export type Query_RootTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootTranscriptionJobArgs = {
    distinct_on?: Maybe<Array<TranscriptionJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<TranscriptionJob_Order_By>>;
    where?: Maybe<TranscriptionJob_Bool_Exp>;
};

/** query root */
export type Query_RootTranscriptionJob_AggregateArgs = {
    distinct_on?: Maybe<Array<TranscriptionJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<TranscriptionJob_Order_By>>;
    where?: Maybe<TranscriptionJob_Bool_Exp>;
};

/** query root */
export type Query_RootTranscriptionJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** query root */
export type Query_RootTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** query root */
export type Query_RootTransitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootUploaderArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** query root */
export type Query_RootUploader_AggregateArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** query root */
export type Query_RootUploader_By_PkArgs = {
    id: Scalars["uuid"];
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

/** query root */
export type Query_RootVideoRenderJobArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** query root */
export type Query_RootVideoRenderJob_AggregateArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** query root */
export type Query_RootVideoRenderJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** query root */
export type Query_RootEchoArgs = {
    message: Scalars["String"];
};

/** query root */
export type Query_RootGetContentItemArgs = {
    magicToken: Scalars["String"];
};

/** query root */
export type Query_RootGetUploadAgreementArgs = {
    magicToken: Scalars["String"];
};

/** query root */
export type Query_RootProtectedEchoArgs = {
    message: Scalars["String"];
};

/** subscription root */
export type Subscription_Root = {
    __typename?: "subscription_root";
    /** fetch data from the table: "Attendee" */
    Attendee: Array<Attendee>;
    /** fetch aggregated fields from the table: "Attendee" */
    Attendee_aggregate: Attendee_Aggregate;
    /** fetch data from the table: "Attendee" using primary key columns */
    Attendee_by_pk?: Maybe<Attendee>;
    /** fetch data from the table: "Broadcast" */
    Broadcast: Array<Broadcast>;
    /** fetch data from the table: "BroadcastContentItem" */
    BroadcastContentItem: Array<BroadcastContentItem>;
    /** fetch aggregated fields from the table: "BroadcastContentItem" */
    BroadcastContentItem_aggregate: BroadcastContentItem_Aggregate;
    /** fetch data from the table: "BroadcastContentItem" using primary key columns */
    BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
    /** fetch aggregated fields from the table: "Broadcast" */
    Broadcast_aggregate: Broadcast_Aggregate;
    /** fetch data from the table: "Broadcast" using primary key columns */
    Broadcast_by_pk?: Maybe<Broadcast>;
    /** fetch data from the table: "Chat" */
    Chat: Array<Chat>;
    /** fetch data from the table: "ChatMember" */
    ChatMember: Array<ChatMember>;
    /** fetch aggregated fields from the table: "ChatMember" */
    ChatMember_aggregate: ChatMember_Aggregate;
    /** fetch data from the table: "ChatMember" using primary key columns */
    ChatMember_by_pk?: Maybe<ChatMember>;
    /** fetch data from the table: "ChatMessage" */
    ChatMessage: Array<ChatMessage>;
    /** fetch aggregated fields from the table: "ChatMessage" */
    ChatMessage_aggregate: ChatMessage_Aggregate;
    /** fetch data from the table: "ChatMessage" using primary key columns */
    ChatMessage_by_pk?: Maybe<ChatMessage>;
    /** fetch data from the table: "ChatReaction" */
    ChatReaction: Array<ChatReaction>;
    /** fetch aggregated fields from the table: "ChatReaction" */
    ChatReaction_aggregate: ChatReaction_Aggregate;
    /** fetch data from the table: "ChatReaction" using primary key columns */
    ChatReaction_by_pk?: Maybe<ChatReaction>;
    /** fetch data from the table: "ChatTyper" */
    ChatTyper: Array<ChatTyper>;
    /** fetch aggregated fields from the table: "ChatTyper" */
    ChatTyper_aggregate: ChatTyper_Aggregate;
    /** fetch data from the table: "ChatTyper" using primary key columns */
    ChatTyper_by_pk?: Maybe<ChatTyper>;
    /** fetch data from the table: "ChatUnreadIndex" */
    ChatUnreadIndex: Array<ChatUnreadIndex>;
    /** fetch aggregated fields from the table: "ChatUnreadIndex" */
    ChatUnreadIndex_aggregate: ChatUnreadIndex_Aggregate;
    /** fetch data from the table: "ChatUnreadIndex" using primary key columns */
    ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
    /** fetch data from the table: "ChatViewer" */
    ChatViewer: Array<ChatViewer>;
    /** fetch aggregated fields from the table: "ChatViewer" */
    ChatViewer_aggregate: ChatViewer_Aggregate;
    /** fetch data from the table: "ChatViewer" using primary key columns */
    ChatViewer_by_pk?: Maybe<ChatViewer>;
    /** fetch aggregated fields from the table: "Chat" */
    Chat_aggregate: Chat_Aggregate;
    /** fetch data from the table: "Chat" using primary key columns */
    Chat_by_pk?: Maybe<Chat>;
    /** fetch data from the table: "Conference" */
    Conference: Array<Conference>;
    /** fetch data from the table: "ConferenceConfiguration" */
    ConferenceConfiguration: Array<ConferenceConfiguration>;
    /** fetch aggregated fields from the table: "ConferenceConfiguration" */
    ConferenceConfiguration_aggregate: ConferenceConfiguration_Aggregate;
    /** fetch data from the table: "ConferenceConfiguration" using primary key columns */
    ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
    /** fetch data from the table: "ConferenceDemoCode" */
    ConferenceDemoCode: Array<ConferenceDemoCode>;
    /** fetch aggregated fields from the table: "ConferenceDemoCode" */
    ConferenceDemoCode_aggregate: ConferenceDemoCode_Aggregate;
    /** fetch data from the table: "ConferenceDemoCode" using primary key columns */
    ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
    /** fetch data from the table: "ConferencePrepareJob" */
    ConferencePrepareJob: Array<ConferencePrepareJob>;
    /** fetch aggregated fields from the table: "ConferencePrepareJob" */
    ConferencePrepareJob_aggregate: ConferencePrepareJob_Aggregate;
    /** fetch data from the table: "ConferencePrepareJob" using primary key columns */
    ConferencePrepareJob_by_pk?: Maybe<ConferencePrepareJob>;
    /** fetch aggregated fields from the table: "Conference" */
    Conference_aggregate: Conference_Aggregate;
    /** fetch data from the table: "Conference" using primary key columns */
    Conference_by_pk?: Maybe<Conference>;
    /** fetch data from the table: "ContentGroup" */
    ContentGroup: Array<ContentGroup>;
    /** fetch data from the table: "ContentGroupPerson" */
    ContentGroupPerson: Array<ContentGroupPerson>;
    /** fetch aggregated fields from the table: "ContentGroupPerson" */
    ContentGroupPerson_aggregate: ContentGroupPerson_Aggregate;
    /** fetch data from the table: "ContentGroupPerson" using primary key columns */
    ContentGroupPerson_by_pk?: Maybe<ContentGroupPerson>;
    /** fetch data from the table: "ContentGroupTag" */
    ContentGroupTag: Array<ContentGroupTag>;
    /** fetch aggregated fields from the table: "ContentGroupTag" */
    ContentGroupTag_aggregate: ContentGroupTag_Aggregate;
    /** fetch data from the table: "ContentGroupTag" using primary key columns */
    ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
    /** fetch data from the table: "ContentGroupType" */
    ContentGroupType: Array<ContentGroupType>;
    /** fetch aggregated fields from the table: "ContentGroupType" */
    ContentGroupType_aggregate: ContentGroupType_Aggregate;
    /** fetch data from the table: "ContentGroupType" using primary key columns */
    ContentGroupType_by_pk?: Maybe<ContentGroupType>;
    /** fetch aggregated fields from the table: "ContentGroup" */
    ContentGroup_aggregate: ContentGroup_Aggregate;
    /** fetch data from the table: "ContentGroup" using primary key columns */
    ContentGroup_by_pk?: Maybe<ContentGroup>;
    /** fetch data from the table: "ContentItem" */
    ContentItem: Array<ContentItem>;
    /** fetch aggregated fields from the table: "ContentItem" */
    ContentItem_aggregate: ContentItem_Aggregate;
    /** fetch data from the table: "ContentItem" using primary key columns */
    ContentItem_by_pk?: Maybe<ContentItem>;
    /** fetch data from the table: "ContentPerson" */
    ContentPerson: Array<ContentPerson>;
    /** fetch aggregated fields from the table: "ContentPerson" */
    ContentPerson_aggregate: ContentPerson_Aggregate;
    /** fetch data from the table: "ContentPerson" using primary key columns */
    ContentPerson_by_pk?: Maybe<ContentPerson>;
    /** fetch data from the table: "ContentType" */
    ContentType: Array<ContentType>;
    /** fetch aggregated fields from the table: "ContentType" */
    ContentType_aggregate: ContentType_Aggregate;
    /** fetch data from the table: "ContentType" using primary key columns */
    ContentType_by_pk?: Maybe<ContentType>;
    /** fetch data from the table: "Email" */
    Email: Array<Email>;
    /** fetch aggregated fields from the table: "Email" */
    Email_aggregate: Email_Aggregate;
    /** fetch data from the table: "Email" using primary key columns */
    Email_by_pk?: Maybe<Email>;
    /** fetch data from the table: "Event" */
    Event: Array<Event>;
    /** fetch data from the table: "EventPerson" */
    EventPerson: Array<EventPerson>;
    /** fetch data from the table: "EventPersonRole" */
    EventPersonRole: Array<EventPersonRole>;
    /** fetch aggregated fields from the table: "EventPersonRole" */
    EventPersonRole_aggregate: EventPersonRole_Aggregate;
    /** fetch data from the table: "EventPersonRole" using primary key columns */
    EventPersonRole_by_pk?: Maybe<EventPersonRole>;
    /** fetch aggregated fields from the table: "EventPerson" */
    EventPerson_aggregate: EventPerson_Aggregate;
    /** fetch data from the table: "EventPerson" using primary key columns */
    EventPerson_by_pk?: Maybe<EventPerson>;
    /** fetch data from the table: "EventTag" */
    EventTag: Array<EventTag>;
    /** fetch aggregated fields from the table: "EventTag" */
    EventTag_aggregate: EventTag_Aggregate;
    /** fetch data from the table: "EventTag" using primary key columns */
    EventTag_by_pk?: Maybe<EventTag>;
    /** fetch aggregated fields from the table: "Event" */
    Event_aggregate: Event_Aggregate;
    /** fetch data from the table: "Event" using primary key columns */
    Event_by_pk?: Maybe<Event>;
    /** fetch data from the table: "ExecutedTransitions" */
    ExecutedTransitions: Array<ExecutedTransitions>;
    /** fetch aggregated fields from the table: "ExecutedTransitions" */
    ExecutedTransitions_aggregate: ExecutedTransitions_Aggregate;
    /** fetch data from the table: "ExecutedTransitions" using primary key columns */
    ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
    /** fetch data from the table: "FlaggedChatMessage" */
    FlaggedChatMessage: Array<FlaggedChatMessage>;
    /** fetch aggregated fields from the table: "FlaggedChatMessage" */
    FlaggedChatMessage_aggregate: FlaggedChatMessage_Aggregate;
    /** fetch data from the table: "FlaggedChatMessage" using primary key columns */
    FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
    /** fetch data from the table: "FollowedChat" */
    FollowedChat: Array<FollowedChat>;
    /** fetch aggregated fields from the table: "FollowedChat" */
    FollowedChat_aggregate: FollowedChat_Aggregate;
    /** fetch data from the table: "FollowedChat" using primary key columns */
    FollowedChat_by_pk?: Maybe<FollowedChat>;
    /** fetch data from the table: "Group" */
    Group: Array<Group>;
    /** fetch data from the table: "GroupAttendee" */
    GroupAttendee: Array<GroupAttendee>;
    /** fetch aggregated fields from the table: "GroupAttendee" */
    GroupAttendee_aggregate: GroupAttendee_Aggregate;
    /** fetch data from the table: "GroupAttendee" using primary key columns */
    GroupAttendee_by_pk?: Maybe<GroupAttendee>;
    /** fetch data from the table: "GroupRole" */
    GroupRole: Array<GroupRole>;
    /** fetch aggregated fields from the table: "GroupRole" */
    GroupRole_aggregate: GroupRole_Aggregate;
    /** fetch data from the table: "GroupRole" using primary key columns */
    GroupRole_by_pk?: Maybe<GroupRole>;
    /** fetch aggregated fields from the table: "Group" */
    Group_aggregate: Group_Aggregate;
    /** fetch data from the table: "Group" using primary key columns */
    Group_by_pk?: Maybe<Group>;
    /** fetch data from the table: "InputType" */
    InputType: Array<InputType>;
    /** fetch aggregated fields from the table: "InputType" */
    InputType_aggregate: InputType_Aggregate;
    /** fetch data from the table: "InputType" using primary key columns */
    InputType_by_pk?: Maybe<InputType>;
    /** fetch data from the table: "Invitation" */
    Invitation: Array<Invitation>;
    /** fetch aggregated fields from the table: "Invitation" */
    Invitation_aggregate: Invitation_Aggregate;
    /** fetch data from the table: "Invitation" using primary key columns */
    Invitation_by_pk?: Maybe<Invitation>;
    /** fetch data from the table: "JobStatus" */
    JobStatus: Array<JobStatus>;
    /** fetch aggregated fields from the table: "JobStatus" */
    JobStatus_aggregate: JobStatus_Aggregate;
    /** fetch data from the table: "JobStatus" using primary key columns */
    JobStatus_by_pk?: Maybe<JobStatus>;
    /** fetch data from the table: "OnlineStatus" */
    OnlineStatus: Array<OnlineStatus>;
    /** fetch aggregated fields from the table: "OnlineStatus" */
    OnlineStatus_aggregate: OnlineStatus_Aggregate;
    /** fetch data from the table: "OnlineStatus" using primary key columns */
    OnlineStatus_by_pk?: Maybe<OnlineStatus>;
    /** fetch data from the table: "OriginatingData" */
    OriginatingData: Array<OriginatingData>;
    /** fetch aggregated fields from the table: "OriginatingData" */
    OriginatingData_aggregate: OriginatingData_Aggregate;
    /** fetch data from the table: "OriginatingData" using primary key columns */
    OriginatingData_by_pk?: Maybe<OriginatingData>;
    /** fetch data from the table: "Permission" */
    Permission: Array<Permission>;
    /** fetch aggregated fields from the table: "Permission" */
    Permission_aggregate: Permission_Aggregate;
    /** fetch data from the table: "Permission" using primary key columns */
    Permission_by_pk?: Maybe<Permission>;
    /** fetch data from the table: "PinnedChat" */
    PinnedChat: Array<PinnedChat>;
    /** fetch aggregated fields from the table: "PinnedChat" */
    PinnedChat_aggregate: PinnedChat_Aggregate;
    /** fetch data from the table: "PinnedChat" using primary key columns */
    PinnedChat_by_pk?: Maybe<PinnedChat>;
    /** fetch data from the table: "RequiredContentItem" */
    RequiredContentItem: Array<RequiredContentItem>;
    /** fetch aggregated fields from the table: "RequiredContentItem" */
    RequiredContentItem_aggregate: RequiredContentItem_Aggregate;
    /** fetch data from the table: "RequiredContentItem" using primary key columns */
    RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
    /** fetch data from the table: "Role" */
    Role: Array<Role>;
    /** fetch data from the table: "RolePermission" */
    RolePermission: Array<RolePermission>;
    /** fetch aggregated fields from the table: "RolePermission" */
    RolePermission_aggregate: RolePermission_Aggregate;
    /** fetch data from the table: "RolePermission" using primary key columns */
    RolePermission_by_pk?: Maybe<RolePermission>;
    /** fetch aggregated fields from the table: "Role" */
    Role_aggregate: Role_Aggregate;
    /** fetch data from the table: "Role" using primary key columns */
    Role_by_pk?: Maybe<Role>;
    /** fetch data from the table: "Room" */
    Room: Array<Room>;
    /** fetch data from the table: "RoomMode" */
    RoomMode: Array<RoomMode>;
    /** fetch aggregated fields from the table: "RoomMode" */
    RoomMode_aggregate: RoomMode_Aggregate;
    /** fetch data from the table: "RoomMode" using primary key columns */
    RoomMode_by_pk?: Maybe<RoomMode>;
    /** fetch data from the table: "RoomParticipant" */
    RoomParticipant: Array<RoomParticipant>;
    /** fetch aggregated fields from the table: "RoomParticipant" */
    RoomParticipant_aggregate: RoomParticipant_Aggregate;
    /** fetch data from the table: "RoomParticipant" using primary key columns */
    RoomParticipant_by_pk?: Maybe<RoomParticipant>;
    /** fetch aggregated fields from the table: "Room" */
    Room_aggregate: Room_Aggregate;
    /** fetch data from the table: "Room" using primary key columns */
    Room_by_pk?: Maybe<Room>;
    /** fetch data from the table: "Tag" */
    Tag: Array<Tag>;
    /** fetch aggregated fields from the table: "Tag" */
    Tag_aggregate: Tag_Aggregate;
    /** fetch data from the table: "Tag" using primary key columns */
    Tag_by_pk?: Maybe<Tag>;
    /** fetch data from the table: "TranscriptionJob" */
    TranscriptionJob: Array<TranscriptionJob>;
    /** fetch aggregated fields from the table: "TranscriptionJob" */
    TranscriptionJob_aggregate: TranscriptionJob_Aggregate;
    /** fetch data from the table: "TranscriptionJob" using primary key columns */
    TranscriptionJob_by_pk?: Maybe<TranscriptionJob>;
    /** fetch data from the table: "Transitions" */
    Transitions: Array<Transitions>;
    /** fetch aggregated fields from the table: "Transitions" */
    Transitions_aggregate: Transitions_Aggregate;
    /** fetch data from the table: "Transitions" using primary key columns */
    Transitions_by_pk?: Maybe<Transitions>;
    /** fetch data from the table: "Uploader" */
    Uploader: Array<Uploader>;
    /** fetch aggregated fields from the table: "Uploader" */
    Uploader_aggregate: Uploader_Aggregate;
    /** fetch data from the table: "Uploader" using primary key columns */
    Uploader_by_pk?: Maybe<Uploader>;
    /** fetch data from the table: "User" */
    User: Array<User>;
    /** fetch aggregated fields from the table: "User" */
    User_aggregate: User_Aggregate;
    /** fetch data from the table: "User" using primary key columns */
    User_by_pk?: Maybe<User>;
    /** fetch data from the table: "VideoRenderJob" */
    VideoRenderJob: Array<VideoRenderJob>;
    /** fetch aggregated fields from the table: "VideoRenderJob" */
    VideoRenderJob_aggregate: VideoRenderJob_Aggregate;
    /** fetch data from the table: "VideoRenderJob" using primary key columns */
    VideoRenderJob_by_pk?: Maybe<VideoRenderJob>;
    /** perform the action: "echo" */
    echo?: Maybe<EchoOutput>;
    /** perform the action: "getContentItem" */
    getContentItem?: Maybe<Array<Maybe<GetContentItemOutput>>>;
    /** perform the action: "getUploadAgreement" */
    getUploadAgreement?: Maybe<GetUploadAgreementOutput>;
    /** perform the action: "protectedEcho" */
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

/** subscription root */
export type Subscription_RootAttendeeArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootAttendee_AggregateArgs = {
    distinct_on?: Maybe<Array<Attendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Attendee_Order_By>>;
    where?: Maybe<Attendee_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootAttendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootBroadcastArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootBroadcastContentItemArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootBroadcastContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<BroadcastContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<BroadcastContentItem_Order_By>>;
    where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootBroadcastContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootBroadcast_AggregateArgs = {
    distinct_on?: Maybe<Array<Broadcast_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Broadcast_Order_By>>;
    where?: Maybe<Broadcast_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootBroadcast_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatMemberArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatMember_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMember_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMember_Order_By>>;
    where?: Maybe<ChatMember_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatMember_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatMessageArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatMessage_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatMessage_Order_By>>;
    where?: Maybe<ChatMessage_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatReactionArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatReaction_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatReaction_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatReaction_Order_By>>;
    where?: Maybe<ChatReaction_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatReaction_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatTyperArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatTyper_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatTyper_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatTyper_Order_By>>;
    where?: Maybe<ChatTyper_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatTyper_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatUnreadIndexArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatUnreadIndex_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatUnreadIndex_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatUnreadIndex_Order_By>>;
    where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatUnreadIndex_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChatViewerArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatViewer_AggregateArgs = {
    distinct_on?: Maybe<Array<ChatViewer_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ChatViewer_Order_By>>;
    where?: Maybe<ChatViewer_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChatViewer_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootChat_AggregateArgs = {
    distinct_on?: Maybe<Array<Chat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Chat_Order_By>>;
    where?: Maybe<Chat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootConferenceArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferenceConfigurationArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferenceConfiguration_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceConfiguration_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceConfiguration_Order_By>>;
    where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferenceConfiguration_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootConferenceDemoCodeArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferenceDemoCode_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferenceDemoCode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferenceDemoCode_Order_By>>;
    where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferenceDemoCode_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootConferencePrepareJobArgs = {
    distinct_on?: Maybe<Array<ConferencePrepareJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferencePrepareJob_Order_By>>;
    where?: Maybe<ConferencePrepareJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferencePrepareJob_AggregateArgs = {
    distinct_on?: Maybe<Array<ConferencePrepareJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ConferencePrepareJob_Order_By>>;
    where?: Maybe<ConferencePrepareJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConferencePrepareJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootConference_AggregateArgs = {
    distinct_on?: Maybe<Array<Conference_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Conference_Order_By>>;
    where?: Maybe<Conference_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootConference_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentGroupArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupPersonArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupPerson_Order_By>>;
    where?: Maybe<ContentGroupPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentGroupTagArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupTag_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupTag_Order_By>>;
    where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentGroupTypeArgs = {
    distinct_on?: Maybe<Array<ContentGroupType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupType_Order_By>>;
    where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupType_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroupType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroupType_Order_By>>;
    where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroupType_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootContentGroup_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentGroup_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentGroup_Order_By>>;
    where?: Maybe<ContentGroup_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentGroup_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentItemArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentItem_Order_By>>;
    where?: Maybe<ContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentPersonArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentPerson_Order_By>>;
    where?: Maybe<ContentPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootContentTypeArgs = {
    distinct_on?: Maybe<Array<ContentType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentType_Order_By>>;
    where?: Maybe<ContentType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentType_AggregateArgs = {
    distinct_on?: Maybe<Array<ContentType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ContentType_Order_By>>;
    where?: Maybe<ContentType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootContentType_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootEmailArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEmail_AggregateArgs = {
    distinct_on?: Maybe<Array<Email_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Email_Order_By>>;
    where?: Maybe<Email_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEmail_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootEventArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventPersonArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventPersonRoleArgs = {
    distinct_on?: Maybe<Array<EventPersonRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPersonRole_Order_By>>;
    where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventPersonRole_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPersonRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPersonRole_Order_By>>;
    where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventPersonRole_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootEventPerson_AggregateArgs = {
    distinct_on?: Maybe<Array<EventPerson_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventPerson_Order_By>>;
    where?: Maybe<EventPerson_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventPerson_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootEventTagArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventTag_AggregateArgs = {
    distinct_on?: Maybe<Array<EventTag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<EventTag_Order_By>>;
    where?: Maybe<EventTag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEventTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootEvent_AggregateArgs = {
    distinct_on?: Maybe<Array<Event_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Event_Order_By>>;
    where?: Maybe<Event_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootEvent_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootExecutedTransitionsArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootExecutedTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<ExecutedTransitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<ExecutedTransitions_Order_By>>;
    where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootExecutedTransitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootFlaggedChatMessageArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootFlaggedChatMessage_AggregateArgs = {
    distinct_on?: Maybe<Array<FlaggedChatMessage_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FlaggedChatMessage_Order_By>>;
    where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootFlaggedChatMessage_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootFollowedChatArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootFollowedChat_AggregateArgs = {
    distinct_on?: Maybe<Array<FollowedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<FollowedChat_Order_By>>;
    where?: Maybe<FollowedChat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootFollowedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootGroupArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroupAttendeeArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroupAttendee_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupAttendee_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupAttendee_Order_By>>;
    where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroupAttendee_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootGroupRoleArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroupRole_AggregateArgs = {
    distinct_on?: Maybe<Array<GroupRole_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<GroupRole_Order_By>>;
    where?: Maybe<GroupRole_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroupRole_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootGroup_AggregateArgs = {
    distinct_on?: Maybe<Array<Group_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Group_Order_By>>;
    where?: Maybe<Group_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootGroup_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootInputTypeArgs = {
    distinct_on?: Maybe<Array<InputType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<InputType_Order_By>>;
    where?: Maybe<InputType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootInputType_AggregateArgs = {
    distinct_on?: Maybe<Array<InputType_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<InputType_Order_By>>;
    where?: Maybe<InputType_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootInputType_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootInvitationArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootInvitation_AggregateArgs = {
    distinct_on?: Maybe<Array<Invitation_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Invitation_Order_By>>;
    where?: Maybe<Invitation_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootInvitation_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootJobStatusArgs = {
    distinct_on?: Maybe<Array<JobStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<JobStatus_Order_By>>;
    where?: Maybe<JobStatus_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootJobStatus_AggregateArgs = {
    distinct_on?: Maybe<Array<JobStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<JobStatus_Order_By>>;
    where?: Maybe<JobStatus_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootJobStatus_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootOnlineStatusArgs = {
    distinct_on?: Maybe<Array<OnlineStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OnlineStatus_Order_By>>;
    where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootOnlineStatus_AggregateArgs = {
    distinct_on?: Maybe<Array<OnlineStatus_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OnlineStatus_Order_By>>;
    where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootOnlineStatus_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootOriginatingDataArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootOriginatingData_AggregateArgs = {
    distinct_on?: Maybe<Array<OriginatingData_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<OriginatingData_Order_By>>;
    where?: Maybe<OriginatingData_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootOriginatingData_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootPermissionArgs = {
    distinct_on?: Maybe<Array<Permission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Permission_Order_By>>;
    where?: Maybe<Permission_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootPermission_AggregateArgs = {
    distinct_on?: Maybe<Array<Permission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Permission_Order_By>>;
    where?: Maybe<Permission_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootPermission_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootPinnedChatArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootPinnedChat_AggregateArgs = {
    distinct_on?: Maybe<Array<PinnedChat_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<PinnedChat_Order_By>>;
    where?: Maybe<PinnedChat_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootPinnedChat_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootRequiredContentItemArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRequiredContentItem_AggregateArgs = {
    distinct_on?: Maybe<Array<RequiredContentItem_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RequiredContentItem_Order_By>>;
    where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRequiredContentItem_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootRoleArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRolePermissionArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRolePermission_AggregateArgs = {
    distinct_on?: Maybe<Array<RolePermission_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RolePermission_Order_By>>;
    where?: Maybe<RolePermission_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRolePermission_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootRole_AggregateArgs = {
    distinct_on?: Maybe<Array<Role_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Role_Order_By>>;
    where?: Maybe<Role_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRole_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootRoomArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoomModeArgs = {
    distinct_on?: Maybe<Array<RoomMode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomMode_Order_By>>;
    where?: Maybe<RoomMode_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoomMode_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomMode_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomMode_Order_By>>;
    where?: Maybe<RoomMode_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoomMode_By_PkArgs = {
    name: Scalars["String"];
};

/** subscription root */
export type Subscription_RootRoomParticipantArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoomParticipant_AggregateArgs = {
    distinct_on?: Maybe<Array<RoomParticipant_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<RoomParticipant_Order_By>>;
    where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoomParticipant_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootRoom_AggregateArgs = {
    distinct_on?: Maybe<Array<Room_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Room_Order_By>>;
    where?: Maybe<Room_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootRoom_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootTagArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTag_AggregateArgs = {
    distinct_on?: Maybe<Array<Tag_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Tag_Order_By>>;
    where?: Maybe<Tag_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTag_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootTranscriptionJobArgs = {
    distinct_on?: Maybe<Array<TranscriptionJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<TranscriptionJob_Order_By>>;
    where?: Maybe<TranscriptionJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTranscriptionJob_AggregateArgs = {
    distinct_on?: Maybe<Array<TranscriptionJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<TranscriptionJob_Order_By>>;
    where?: Maybe<TranscriptionJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTranscriptionJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootTransitionsArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTransitions_AggregateArgs = {
    distinct_on?: Maybe<Array<Transitions_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Transitions_Order_By>>;
    where?: Maybe<Transitions_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootTransitions_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootUploaderArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootUploader_AggregateArgs = {
    distinct_on?: Maybe<Array<Uploader_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<Uploader_Order_By>>;
    where?: Maybe<Uploader_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootUploader_By_PkArgs = {
    id: Scalars["uuid"];
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

/** subscription root */
export type Subscription_RootVideoRenderJobArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootVideoRenderJob_AggregateArgs = {
    distinct_on?: Maybe<Array<VideoRenderJob_Select_Column>>;
    limit?: Maybe<Scalars["Int"]>;
    offset?: Maybe<Scalars["Int"]>;
    order_by?: Maybe<Array<VideoRenderJob_Order_By>>;
    where?: Maybe<VideoRenderJob_Bool_Exp>;
};

/** subscription root */
export type Subscription_RootVideoRenderJob_By_PkArgs = {
    id: Scalars["uuid"];
};

/** subscription root */
export type Subscription_RootEchoArgs = {
    message: Scalars["String"];
};

/** subscription root */
export type Subscription_RootGetContentItemArgs = {
    magicToken: Scalars["String"];
};

/** subscription root */
export type Subscription_RootGetUploadAgreementArgs = {
    magicToken: Scalars["String"];
};

/** subscription root */
export type Subscription_RootProtectedEchoArgs = {
    message: Scalars["String"];
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

/** expression to compare columns of type uuid. All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
    _eq?: Maybe<Scalars["uuid"]>;
    _gt?: Maybe<Scalars["uuid"]>;
    _gte?: Maybe<Scalars["uuid"]>;
    _in?: Maybe<Array<Scalars["uuid"]>>;
    _is_null?: Maybe<Scalars["Boolean"]>;
    _lt?: Maybe<Scalars["uuid"]>;
    _lte?: Maybe<Scalars["uuid"]>;
    _neq?: Maybe<Scalars["uuid"]>;
    _nin?: Maybe<Array<Scalars["uuid"]>>;
};

export type ContentItemAddNewVersionMutationVariables = Exact<{
    id: Scalars["uuid"];
    newVersion: Scalars["jsonb"];
}>;

export type ContentItemAddNewVersionMutation = { __typename?: "mutation_root" } & {
    update_ContentItem_by_pk?: Maybe<{ __typename?: "ContentItem" } & Pick<ContentItem, "id">>;
};

export type GetContentItemDetailsQueryVariables = Exact<{
    contentItemId: Scalars["uuid"];
}>;

export type GetContentItemDetailsQuery = { __typename?: "query_root" } & {
    ContentItem_by_pk?: Maybe<
        { __typename?: "ContentItem" } & Pick<ContentItem, "id"> & {
                conference: { __typename?: "Conference" } & Pick<Conference, "name">;
                contentGroup: { __typename?: "ContentGroup" } & Pick<ContentGroup, "title">;
            }
    >;
};

export type GetUploadersForContentItemQueryVariables = Exact<{
    contentItemId: Scalars["uuid"];
}>;

export type GetUploadersForContentItemQuery = { __typename?: "query_root" } & {
    Uploader: Array<{ __typename?: "Uploader" } & Pick<Uploader, "name" | "id" | "email">>;
};

export type GetRequiredContentItemQueryVariables = Exact<{
    contentItemId: Scalars["uuid"];
}>;

export type GetRequiredContentItemQuery = { __typename?: "query_root" } & {
    RequiredContentItem: Array<
        { __typename?: "RequiredContentItem" } & Pick<RequiredContentItem, "accessToken" | "id">
    >;
};

export type GetContentItemByRequiredItemQueryVariables = Exact<{
    accessToken: Scalars["String"];
}>;

export type GetContentItemByRequiredItemQuery = { __typename?: "query_root" } & {
    ContentItem: Array<
        { __typename?: "ContentItem" } & Pick<ContentItem, "id" | "contentTypeName" | "data" | "layoutData" | "name">
    >;
};

export type GetUploadAgreementQueryVariables = Exact<{
    accessToken: Scalars["String"];
}>;

export type GetUploadAgreementQuery = { __typename?: "query_root" } & {
    RequiredContentItem: Array<
        { __typename?: "RequiredContentItem" } & {
            conference: { __typename?: "Conference" } & {
                configurations: Array<
                    { __typename?: "ConferenceConfiguration" } & Pick<ConferenceConfiguration, "value">
                >;
            };
        }
    >;
};

export type UpdateEmailMutationVariables = Exact<{
    id: Scalars["uuid"];
    sentAt?: Maybe<Scalars["timestamptz"]>;
}>;

export type UpdateEmailMutation = { __typename?: "mutation_root" } & {
    update_Email?: Maybe<{ __typename?: "Email_mutation_response" } & Pick<Email_Mutation_Response, "affected_rows">>;
};

export type InsertEmailsMutationVariables = Exact<{
    objects: Array<Email_Insert_Input>;
}>;

export type InsertEmailsMutation = { __typename?: "mutation_root" } & {
    insert_Email?: Maybe<{ __typename?: "Email_mutation_response" } & Pick<Email_Mutation_Response, "affected_rows">>;
};

export type InvitationPartsFragment = { __typename?: "Invitation" } & Pick<
    Invitation,
    | "attendeeId"
    | "confirmationCode"
    | "id"
    | "inviteCode"
    | "invitedEmailAddress"
    | "linkToUserId"
    | "updatedAt"
    | "createdAt"
> & {
        attendee: { __typename?: "Attendee" } & Pick<Attendee, "displayName" | "userId"> & {
                conference: { __typename?: "Conference" } & Pick<Conference, "name" | "slug">;
            };
        user?: Maybe<{ __typename?: "User" } & Pick<User, "email">>;
    };

export type InvitedUserPartsFragment = { __typename?: "User" } & Pick<User, "id" | "email">;

export type SelectInvitationAndUserQueryVariables = Exact<{
    inviteCode: Scalars["uuid"];
    userId: Scalars["String"];
}>;

export type SelectInvitationAndUserQuery = { __typename?: "query_root" } & {
    Invitation: Array<{ __typename?: "Invitation" } & InvitationPartsFragment>;
    User_by_pk?: Maybe<{ __typename?: "User" } & InvitedUserPartsFragment>;
};

export type UpdateInvitationMutationVariables = Exact<{
    confirmationCode: Scalars["uuid"];
    invitationId: Scalars["uuid"];
    userId: Scalars["String"];
    updatedAt: Scalars["timestamptz"];
}>;

export type UpdateInvitationMutation = { __typename?: "mutation_root" } & {
    update_Invitation?: Maybe<
        { __typename?: "Invitation_mutation_response" } & Pick<Invitation_Mutation_Response, "affected_rows">
    >;
};

export type SendFreshInviteConfirmationEmailMutationVariables = Exact<{
    emailAddress: Scalars["String"];
    htmlContents: Scalars["String"];
    invitationId: Scalars["uuid"];
    plainTextContents: Scalars["String"];
    subject: Scalars["String"];
    userId: Scalars["String"];
}>;

export type SendFreshInviteConfirmationEmailMutation = { __typename?: "mutation_root" } & {
    insert_Email_one?: Maybe<{ __typename?: "Email" } & Pick<Email, "id">>;
};

export type SetAttendeeUserIdMutationVariables = Exact<{
    attendeeId: Scalars["uuid"];
    userId: Scalars["String"];
}>;

export type SetAttendeeUserIdMutation = { __typename?: "mutation_root" } & {
    update_Attendee?: Maybe<
        { __typename?: "Attendee_mutation_response" } & Pick<Attendee_Mutation_Response, "affected_rows">
    >;
};

export type AttendeeWithInvitePartsFragment = { __typename?: "Attendee" } & Pick<
    Attendee,
    "id" | "displayName" | "userId"
> & {
        conference: { __typename?: "Conference" } & Pick<Conference, "id" | "name" | "shortName" | "slug">;
        invitation?: Maybe<
            { __typename?: "Invitation" } & Pick<Invitation, "id" | "inviteCode" | "invitedEmailAddress"> & {
                    emails: Array<{ __typename?: "Email" } & Pick<Email, "reason">>;
                }
        >;
    };

export type SelectPermittedAttendeesWithInvitationQueryVariables = Exact<{
    attendeeIds: Array<Scalars["uuid"]>;
    userId: Scalars["String"];
}>;

export type SelectPermittedAttendeesWithInvitationQuery = { __typename?: "query_root" } & {
    Attendee: Array<{ __typename?: "Attendee" } & AttendeeWithInvitePartsFragment>;
};

export type CompleteVideoRenderJobMutationVariables = Exact<{
    videoRenderJobId: Scalars["uuid"];
}>;

export type CompleteVideoRenderJobMutation = { __typename?: "mutation_root" } & {
    update_VideoRenderJob_by_pk?: Maybe<
        { __typename?: "VideoRenderJob" } & Pick<VideoRenderJob, "id" | "broadcastContentItemId">
    >;
};

export type GetVideoRenderJobQueryVariables = Exact<{
    videoRenderJobId: Scalars["uuid"];
}>;

export type GetVideoRenderJobQuery = { __typename?: "query_root" } & {
    VideoRenderJob_by_pk?: Maybe<{ __typename?: "VideoRenderJob" } & Pick<VideoRenderJob, "id" | "data">>;
};

export type UpdateMp4BroadcastContentItemMutationVariables = Exact<{
    broadcastContentItemId: Scalars["uuid"];
    input: Scalars["jsonb"];
}>;

export type UpdateMp4BroadcastContentItemMutation = { __typename?: "mutation_root" } & {
    update_BroadcastContentItem_by_pk?: Maybe<
        { __typename?: "BroadcastContentItem" } & Pick<BroadcastContentItem, "id">
    >;
};

export type OtherConferencePrepareJobsQueryVariables = Exact<{
    conferenceId: Scalars["uuid"];
    conferencePrepareJobId: Scalars["uuid"];
}>;

export type OtherConferencePrepareJobsQuery = { __typename?: "query_root" } & {
    ConferencePrepareJob: Array<
        { __typename?: "ConferencePrepareJob" } & Pick<ConferencePrepareJob, "id" | "updatedAt">
    >;
};

export type GetVideoBroadcastContentItemsQueryVariables = Exact<{
    conferenceId?: Maybe<Scalars["uuid"]>;
}>;

export type GetVideoBroadcastContentItemsQuery = { __typename?: "query_root" } & {
    ContentItem: Array<{ __typename?: "ContentItem" } & Pick<ContentItem, "id" | "data">>;
};

export type GetConfigurationValueQueryVariables = Exact<{
    key: Scalars["String"];
    conferenceId: Scalars["uuid"];
}>;

export type GetConfigurationValueQuery = { __typename?: "query_root" } & {
    ConferenceConfiguration: Array<
        { __typename?: "ConferenceConfiguration" } & Pick<ConferenceConfiguration, "id" | "value">
    >;
};

export type CreateBroadcastContentItemMutationVariables = Exact<{
    conferenceId: Scalars["uuid"];
    contentItemId: Scalars["uuid"];
    input: Scalars["jsonb"];
}>;

export type CreateBroadcastContentItemMutation = { __typename?: "mutation_root" } & {
    insert_BroadcastContentItem_one?: Maybe<{ __typename?: "BroadcastContentItem" } & Pick<BroadcastContentItem, "id">>;
};

export type GetEventTitleDetailsQueryVariables = Exact<{
    conferenceId: Scalars["uuid"];
}>;

export type GetEventTitleDetailsQuery = { __typename?: "query_root" } & {
    Event: Array<
        { __typename?: "Event" } & Pick<Event, "id" | "intendedRoomModeName" | "name"> & {
                contentGroup?: Maybe<
                    { __typename?: "ContentGroup" } & Pick<ContentGroup, "id" | "title"> & {
                            people: Array<
                                { __typename?: "ContentGroupPerson" } & Pick<ContentGroupPerson, "id"> & {
                                        person: { __typename?: "ContentPerson" } & Pick<ContentPerson, "name" | "id">;
                                    }
                            >;
                            contentItems: Array<
                                { __typename?: "ContentItem" } & Pick<
                                    ContentItem,
                                    "contentTypeName" | "id" | "contentGroupId"
                                >
                            >;
                        }
                >;
            }
    >;
};

export type CreateVideoTitlesContentItemMutationVariables = Exact<{
    conferenceId: Scalars["uuid"];
    contentGroupId: Scalars["uuid"];
    title: Scalars["String"];
}>;

export type CreateVideoTitlesContentItemMutation = { __typename?: "mutation_root" } & {
    insert_ContentItem_one?: Maybe<{ __typename?: "ContentItem" } & Pick<ContentItem, "id">>;
};

export type GetVideoTitlesContentItemQueryVariables = Exact<{
    contentGroupId: Scalars["uuid"];
    title: Scalars["String"];
}>;

export type GetVideoTitlesContentItemQuery = { __typename?: "query_root" } & {
    ContentItem: Array<{ __typename?: "ContentItem" } & Pick<ContentItem, "id">>;
};

export type CreateVideoRenderJobMutationVariables = Exact<{
    conferenceId: Scalars["uuid"];
    conferencePrepareJobId: Scalars["uuid"];
    broadcastContentItemId: Scalars["uuid"];
    data: Scalars["jsonb"];
}>;

export type CreateVideoRenderJobMutation = { __typename?: "mutation_root" } & {
    insert_VideoRenderJob_one?: Maybe<{ __typename?: "VideoRenderJob" } & Pick<VideoRenderJob, "id">>;
};

export type EchoQueryVariables = Exact<{
    message: Scalars["String"];
}>;

export type EchoQuery = { __typename?: "query_root" } & {
    echo?: Maybe<{ __typename?: "EchoOutput" } & Pick<EchoOutput, "message">>;
};

export type RequiredItemQueryVariables = Exact<{
    accessToken: Scalars["String"];
}>;

export type RequiredItemQuery = { __typename?: "query_root" } & {
    RequiredContentItem: Array<{ __typename?: "RequiredContentItem" } & RequiredItemFieldsFragment>;
};

export type RequiredItemFieldsFragment = { __typename?: "RequiredContentItem" } & Pick<
    RequiredContentItem,
    "id" | "contentTypeName" | "accessToken" | "name"
> & {
        conference: { __typename?: "Conference" } & Pick<Conference, "id" | "name">;
        contentItem?: Maybe<{ __typename?: "ContentItem" } & Pick<ContentItem, "id" | "data" | "contentTypeName">>;
        contentGroup: { __typename?: "ContentGroup" } & Pick<ContentGroup, "id" | "title">;
    };

export type CreateContentItemMutationVariables = Exact<{
    conferenceId: Scalars["uuid"];
    contentGroupId: Scalars["uuid"];
    contentTypeName: ContentType_Enum;
    data: Scalars["jsonb"];
    isHidden: Scalars["Boolean"];
    layoutData: Scalars["jsonb"];
    name: Scalars["String"];
    requiredContentId: Scalars["uuid"];
}>;

export type CreateContentItemMutation = { __typename?: "mutation_root" } & {
    insert_ContentItem_one?: Maybe<{ __typename?: "ContentItem" } & Pick<ContentItem, "id">>;
};

export type GetUploadersQueryVariables = Exact<{
    requiredContentItemId: Scalars["uuid"];
}>;

export type GetUploadersQuery = { __typename?: "query_root" } & {
    Uploader: Array<{ __typename?: "Uploader" } & Pick<Uploader, "name" | "id" | "email">>;
};

export type UploaderPartsFragment = { __typename?: "Uploader" } & Pick<
    Uploader,
    "id" | "email" | "emailsSentCount" | "name"
> & {
        conference: { __typename?: "Conference" } & Pick<Conference, "id" | "name">;
        requiredContentItem: { __typename?: "RequiredContentItem" } & RequiredItemFieldsFragment;
    };

export type SelectUploadersAndUserQueryVariables = Exact<{
    uploaderIds: Array<Scalars["uuid"]>;
    userId: Scalars["String"];
}>;

export type SelectUploadersAndUserQuery = { __typename?: "query_root" } & {
    Uploader: Array<{ __typename?: "Uploader" } & UploaderPartsFragment>;
    User_by_pk?: Maybe<{ __typename?: "User" } & Pick<User, "id">>;
};

export type InsertSubmissionRequestEmailsMutationVariables = Exact<{
    emails: Array<Email_Insert_Input>;
    uploaderIds: Array<Scalars["uuid"]>;
}>;

export type InsertSubmissionRequestEmailsMutation = { __typename?: "mutation_root" } & {
    insert_Email?: Maybe<{ __typename?: "Email_mutation_response" } & Pick<Email_Mutation_Response, "affected_rows">>;
    update_Uploader?: Maybe<
        { __typename?: "Uploader_mutation_response" } & Pick<Uploader_Mutation_Response, "affected_rows">
    >;
};

export type FailConferencePrepareJobMutationVariables = Exact<{
    id: Scalars["uuid"];
    message: Scalars["String"];
}>;

export type FailConferencePrepareJobMutation = { __typename?: "mutation_root" } & {
    update_ConferencePrepareJob_by_pk?: Maybe<
        { __typename?: "ConferencePrepareJob" } & Pick<ConferencePrepareJob, "id">
    >;
};

export type GetContentItemByIdQueryVariables = Exact<{
    contentItemId: Scalars["uuid"];
}>;

export type GetContentItemByIdQuery = { __typename?: "query_root" } & {
    ContentItem_by_pk?: Maybe<{ __typename?: "ContentItem" } & Pick<ContentItem, "id" | "data">>;
};

export type CreateTranscriptionJobMutationVariables = Exact<{
    awsTranscribeJobName: Scalars["String"];
    contentItemId: Scalars["uuid"];
    videoS3Url: Scalars["String"];
    transcriptionS3Url: Scalars["String"];
    languageCode: Scalars["String"];
}>;

export type CreateTranscriptionJobMutation = { __typename?: "mutation_root" } & {
    insert_TranscriptionJob_one?: Maybe<{ __typename?: "TranscriptionJob" } & Pick<TranscriptionJob, "id">>;
};

export type GetTranscriptionJobQueryVariables = Exact<{
    awsTranscribeJobName: Scalars["String"];
}>;

export type GetTranscriptionJobQuery = { __typename?: "query_root" } & {
    TranscriptionJob: Array<
        { __typename?: "TranscriptionJob" } & Pick<
            TranscriptionJob,
            "videoS3Url" | "contentItemId" | "transcriptionS3Url" | "languageCode" | "id"
        >
    >;
};

export type FailVideoRenderJobMutationVariables = Exact<{
    videoRenderJobId: Scalars["uuid"];
    message: Scalars["String"];
}>;

export type FailVideoRenderJobMutation = { __typename?: "mutation_root" } & {
    update_VideoRenderJob_by_pk?: Maybe<
        { __typename?: "VideoRenderJob" } & Pick<VideoRenderJob, "id" | "conferencePrepareJobId">
    >;
};

export type StartVideoRenderJobMutationVariables = Exact<{
    videoRenderJobId: Scalars["uuid"];
    data: Scalars["jsonb"];
}>;

export type StartVideoRenderJobMutation = { __typename?: "mutation_root" } & {
    update_VideoRenderJob_by_pk?: Maybe<{ __typename?: "VideoRenderJob" } & Pick<VideoRenderJob, "id">>;
};

export const InvitationPartsFragmentDoc: DocumentNode<InvitationPartsFragment, unknown> = {
    kind: "Document",
    definitions: [
        {
            kind: "FragmentDefinition",
            name: { kind: "Name", value: "InvitationParts" },
            typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Invitation" } },
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    { kind: "Field", name: { kind: "Name", value: "attendeeId" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "attendee" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "displayName" } },
                                { kind: "Field", name: { kind: "Name", value: "userId" } },
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "conference" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [
                                            { kind: "Field", name: { kind: "Name", value: "name" } },
                                            { kind: "Field", name: { kind: "Name", value: "slug" } },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    { kind: "Field", name: { kind: "Name", value: "confirmationCode" } },
                    { kind: "Field", name: { kind: "Name", value: "id" } },
                    { kind: "Field", name: { kind: "Name", value: "inviteCode" } },
                    { kind: "Field", name: { kind: "Name", value: "invitedEmailAddress" } },
                    { kind: "Field", name: { kind: "Name", value: "linkToUserId" } },
                    { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                    { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "user" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "email" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const InvitedUserPartsFragmentDoc: DocumentNode<InvitedUserPartsFragment, unknown> = {
    kind: "Document",
    definitions: [
        {
            kind: "FragmentDefinition",
            name: { kind: "Name", value: "InvitedUserParts" },
            typeCondition: { kind: "NamedType", name: { kind: "Name", value: "User" } },
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    { kind: "Field", name: { kind: "Name", value: "id" } },
                    { kind: "Field", name: { kind: "Name", value: "email" } },
                ],
            },
        },
    ],
};
export const AttendeeWithInvitePartsFragmentDoc: DocumentNode<AttendeeWithInvitePartsFragment, unknown> = {
    kind: "Document",
    definitions: [
        {
            kind: "FragmentDefinition",
            name: { kind: "Name", value: "AttendeeWithInviteParts" },
            typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Attendee" } },
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    { kind: "Field", name: { kind: "Name", value: "id" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "conference" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                                { kind: "Field", name: { kind: "Name", value: "shortName" } },
                                { kind: "Field", name: { kind: "Name", value: "slug" } },
                            ],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "invitation" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "emails" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [{ kind: "Field", name: { kind: "Name", value: "reason" } }],
                                    },
                                },
                                { kind: "Field", name: { kind: "Name", value: "inviteCode" } },
                                { kind: "Field", name: { kind: "Name", value: "invitedEmailAddress" } },
                            ],
                        },
                    },
                    { kind: "Field", name: { kind: "Name", value: "displayName" } },
                    { kind: "Field", name: { kind: "Name", value: "userId" } },
                ],
            },
        },
    ],
};
export const RequiredItemFieldsFragmentDoc: DocumentNode<RequiredItemFieldsFragment, unknown> = {
    kind: "Document",
    definitions: [
        {
            kind: "FragmentDefinition",
            name: { kind: "Name", value: "RequiredItemFields" },
            typeCondition: { kind: "NamedType", name: { kind: "Name", value: "RequiredContentItem" } },
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    { kind: "Field", name: { kind: "Name", value: "id" } },
                    { kind: "Field", name: { kind: "Name", value: "contentTypeName" } },
                    { kind: "Field", name: { kind: "Name", value: "accessToken" } },
                    { kind: "Field", name: { kind: "Name", value: "name" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "conference" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                            ],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "contentItem" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "data" } },
                                { kind: "Field", name: { kind: "Name", value: "contentTypeName" } },
                            ],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "contentGroup" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "title" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const UploaderPartsFragmentDoc: DocumentNode<UploaderPartsFragment, unknown> = {
    kind: "Document",
    definitions: [
        {
            kind: "FragmentDefinition",
            name: { kind: "Name", value: "UploaderParts" },
            typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Uploader" } },
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    { kind: "Field", name: { kind: "Name", value: "id" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "conference" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                            ],
                        },
                    },
                    { kind: "Field", name: { kind: "Name", value: "email" } },
                    { kind: "Field", name: { kind: "Name", value: "emailsSentCount" } },
                    { kind: "Field", name: { kind: "Name", value: "name" } },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "requiredContentItem" },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "FragmentSpread", name: { kind: "Name", value: "RequiredItemFields" } },
                            ],
                        },
                    },
                ],
            },
        },
        ...RequiredItemFieldsFragmentDoc.definitions,
    ],
};
export const ContentItemAddNewVersionDocument: DocumentNode<
    ContentItemAddNewVersionMutation,
    ContentItemAddNewVersionMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "ContentItemAddNewVersion" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "newVersion" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_ContentItem_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "id" } },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_append" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "data" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "newVersion" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetContentItemDetailsDocument: DocumentNode<
    GetContentItemDetailsQuery,
    GetContentItemDetailsQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetContentItemDetails" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ContentItem_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "id" },
                                value: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "conference" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [{ kind: "Field", name: { kind: "Name", value: "name" } }],
                                    },
                                },
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "contentGroup" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [{ kind: "Field", name: { kind: "Name", value: "title" } }],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetUploadersForContentItemDocument: DocumentNode<
    GetUploadersForContentItemQuery,
    GetUploadersForContentItemQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetUploadersForContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Uploader" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "requiredContentItem" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "contentItem" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "id" },
                                                                    value: {
                                                                        kind: "ObjectValue",
                                                                        fields: [
                                                                            {
                                                                                kind: "ObjectField",
                                                                                name: { kind: "Name", value: "_eq" },
                                                                                value: {
                                                                                    kind: "Variable",
                                                                                    name: {
                                                                                        kind: "Name",
                                                                                        value: "contentItemId",
                                                                                    },
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "email" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetRequiredContentItemDocument: DocumentNode<
    GetRequiredContentItemQuery,
    GetRequiredContentItemQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetRequiredContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "RequiredContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentItem" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "id" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "_eq" },
                                                                    value: {
                                                                        kind: "Variable",
                                                                        name: { kind: "Name", value: "contentItemId" },
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetContentItemByRequiredItemDocument: DocumentNode<
    GetContentItemByRequiredItemQuery,
    GetContentItemByRequiredItemQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetContentItemByRequiredItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "accessToken" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "requiredContentItem" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "accessToken" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "_eq" },
                                                                    value: {
                                                                        kind: "Variable",
                                                                        name: { kind: "Name", value: "accessToken" },
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "contentTypeName" } },
                                { kind: "Field", name: { kind: "Name", value: "data" } },
                                { kind: "Field", name: { kind: "Name", value: "layoutData" } },
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetUploadAgreementDocument: DocumentNode<GetUploadAgreementQuery, GetUploadAgreementQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetUploadAgreement" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "accessToken" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "RequiredContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "accessToken" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "accessToken" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "conference" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [
                                            {
                                                kind: "Field",
                                                name: { kind: "Name", value: "configurations" },
                                                arguments: [
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "where" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "key" },
                                                                    value: {
                                                                        kind: "ObjectValue",
                                                                        fields: [
                                                                            {
                                                                                kind: "ObjectField",
                                                                                name: { kind: "Name", value: "_eq" },
                                                                                value: {
                                                                                    kind: "StringValue",
                                                                                    value: "UPLOAD_AGREEMENT",
                                                                                    block: false,
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                                selectionSet: {
                                                    kind: "SelectionSet",
                                                    selections: [
                                                        { kind: "Field", name: { kind: "Name", value: "value" } },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const UpdateEmailDocument: DocumentNode<UpdateEmailMutation, UpdateEmailMutationVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "UpdateEmail" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "sentAt" } },
                    type: { kind: "NamedType", name: { kind: "Name", value: "timestamptz" } },
                    defaultValue: { kind: "NullValue" },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_Email" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "id" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "sentAt" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "sentAt" } },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_inc" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "retriesCount" },
                                            value: { kind: "IntValue", value: "1" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const InsertEmailsDocument: DocumentNode<InsertEmailsMutation, InsertEmailsMutationVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "InsertEmails" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "objects" } },
                    type: {
                        kind: "NonNullType",
                        type: {
                            kind: "ListType",
                            type: {
                                kind: "NonNullType",
                                type: { kind: "NamedType", name: { kind: "Name", value: "Email_insert_input" } },
                            },
                        },
                    },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_Email" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "objects" },
                                value: { kind: "Variable", name: { kind: "Name", value: "objects" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const SelectInvitationAndUserDocument: DocumentNode<
    SelectInvitationAndUserQuery,
    SelectInvitationAndUserQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "SelectInvitationAndUser" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "inviteCode" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Invitation" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "inviteCode" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "inviteCode" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "InvitationParts" } }],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "User_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "id" },
                                value: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "InvitedUserParts" } }],
                        },
                    },
                ],
            },
        },
        ...InvitationPartsFragmentDoc.definitions,
        ...InvitedUserPartsFragmentDoc.definitions,
    ],
};
export const UpdateInvitationDocument: DocumentNode<UpdateInvitationMutation, UpdateInvitationMutationVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "UpdateInvitation" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "confirmationCode" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "invitationId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "updatedAt" } },
                    type: {
                        kind: "NonNullType",
                        type: { kind: "NamedType", name: { kind: "Name", value: "timestamptz" } },
                    },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_Invitation" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "invitationId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "updatedAt" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "updatedAt" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "confirmationCode" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "confirmationCode" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "linkToUserId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const SendFreshInviteConfirmationEmailDocument: DocumentNode<
    SendFreshInviteConfirmationEmailMutation,
    SendFreshInviteConfirmationEmailMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "SendFreshInviteConfirmationEmail" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "emailAddress" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "htmlContents" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "invitationId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "plainTextContents" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "subject" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_Email_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "emailAddress" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "emailAddress" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "htmlContents" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "htmlContents" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "invitationId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "invitationId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "plainTextContents" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "plainTextContents" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "reason" },
                                            value: { kind: "StringValue", value: "confirm-invite", block: false },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "subject" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "subject" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "userId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const SetAttendeeUserIdDocument: DocumentNode<SetAttendeeUserIdMutation, SetAttendeeUserIdMutationVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "SetAttendeeUserId" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "attendeeId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_Attendee" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "attendeeId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "userId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const SelectPermittedAttendeesWithInvitationDocument: DocumentNode<
    SelectPermittedAttendeesWithInvitationQuery,
    SelectPermittedAttendeesWithInvitationQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "SelectPermittedAttendeesWithInvitation" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "attendeeIds" } },
                    type: {
                        kind: "NonNullType",
                        type: {
                            kind: "ListType",
                            type: {
                                kind: "NonNullType",
                                type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } },
                            },
                        },
                    },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Attendee" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_in" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "attendeeIds" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conference" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_or" },
                                                        value: {
                                                            kind: "ListValue",
                                                            values: [
                                                                {
                                                                    kind: "ObjectValue",
                                                                    fields: [
                                                                        {
                                                                            kind: "ObjectField",
                                                                            name: { kind: "Name", value: "createdBy" },
                                                                            value: {
                                                                                kind: "ObjectValue",
                                                                                fields: [
                                                                                    {
                                                                                        kind: "ObjectField",
                                                                                        name: {
                                                                                            kind: "Name",
                                                                                            value: "_eq",
                                                                                        },
                                                                                        value: {
                                                                                            kind: "Variable",
                                                                                            name: {
                                                                                                kind: "Name",
                                                                                                value: "userId",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                ],
                                                                            },
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    kind: "ObjectValue",
                                                                    fields: [
                                                                        {
                                                                            kind: "ObjectField",
                                                                            name: { kind: "Name", value: "groups" },
                                                                            value: {
                                                                                kind: "ObjectValue",
                                                                                fields: [
                                                                                    {
                                                                                        kind: "ObjectField",
                                                                                        name: {
                                                                                            kind: "Name",
                                                                                            value: "groupAttendees",
                                                                                        },
                                                                                        value: {
                                                                                            kind: "ObjectValue",
                                                                                            fields: [
                                                                                                {
                                                                                                    kind: "ObjectField",
                                                                                                    name: {
                                                                                                        kind: "Name",
                                                                                                        value:
                                                                                                            "attendee",
                                                                                                    },
                                                                                                    value: {
                                                                                                        kind:
                                                                                                            "ObjectValue",
                                                                                                        fields: [
                                                                                                            {
                                                                                                                kind:
                                                                                                                    "ObjectField",
                                                                                                                name: {
                                                                                                                    kind:
                                                                                                                        "Name",
                                                                                                                    value:
                                                                                                                        "userId",
                                                                                                                },
                                                                                                                value: {
                                                                                                                    kind:
                                                                                                                        "ObjectValue",
                                                                                                                    fields: [
                                                                                                                        {
                                                                                                                            kind:
                                                                                                                                "ObjectField",
                                                                                                                            name: {
                                                                                                                                kind:
                                                                                                                                    "Name",
                                                                                                                                value:
                                                                                                                                    "_eq",
                                                                                                                            },
                                                                                                                            value: {
                                                                                                                                kind:
                                                                                                                                    "Variable",
                                                                                                                                name: {
                                                                                                                                    kind:
                                                                                                                                        "Name",
                                                                                                                                    value:
                                                                                                                                        "userId",
                                                                                                                                },
                                                                                                                            },
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            },
                                                                                                        ],
                                                                                                    },
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    },
                                                                                    {
                                                                                        kind: "ObjectField",
                                                                                        name: {
                                                                                            kind: "Name",
                                                                                            value: "groupRoles",
                                                                                        },
                                                                                        value: {
                                                                                            kind: "ObjectValue",
                                                                                            fields: [
                                                                                                {
                                                                                                    kind: "ObjectField",
                                                                                                    name: {
                                                                                                        kind: "Name",
                                                                                                        value: "role",
                                                                                                    },
                                                                                                    value: {
                                                                                                        kind:
                                                                                                            "ObjectValue",
                                                                                                        fields: [
                                                                                                            {
                                                                                                                kind:
                                                                                                                    "ObjectField",
                                                                                                                name: {
                                                                                                                    kind:
                                                                                                                        "Name",
                                                                                                                    value:
                                                                                                                        "rolePermissions",
                                                                                                                },
                                                                                                                value: {
                                                                                                                    kind:
                                                                                                                        "ObjectValue",
                                                                                                                    fields: [
                                                                                                                        {
                                                                                                                            kind:
                                                                                                                                "ObjectField",
                                                                                                                            name: {
                                                                                                                                kind:
                                                                                                                                    "Name",
                                                                                                                                value:
                                                                                                                                    "permissionName",
                                                                                                                            },
                                                                                                                            value: {
                                                                                                                                kind:
                                                                                                                                    "ObjectValue",
                                                                                                                                fields: [
                                                                                                                                    {
                                                                                                                                        kind:
                                                                                                                                            "ObjectField",
                                                                                                                                        name: {
                                                                                                                                            kind:
                                                                                                                                                "Name",
                                                                                                                                            value:
                                                                                                                                                "_in",
                                                                                                                                        },
                                                                                                                                        value: {
                                                                                                                                            kind:
                                                                                                                                                "ListValue",
                                                                                                                                            values: [
                                                                                                                                                {
                                                                                                                                                    kind:
                                                                                                                                                        "EnumValue",
                                                                                                                                                    value:
                                                                                                                                                        "CONFERENCE_MANAGE_ATTENDEES",
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    kind:
                                                                                                                                                        "EnumValue",
                                                                                                                                                    value:
                                                                                                                                                        "CONFERENCE_MANAGE_GROUPS",
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    kind:
                                                                                                                                                        "EnumValue",
                                                                                                                                                    value:
                                                                                                                                                        "CONFERENCE_MANAGE_ROLES",
                                                                                                                                                },
                                                                                                                                            ],
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            },
                                                                                                        ],
                                                                                                    },
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    },
                                                                                ],
                                                                            },
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "FragmentSpread", name: { kind: "Name", value: "AttendeeWithInviteParts" } },
                            ],
                        },
                    },
                ],
            },
        },
        ...AttendeeWithInvitePartsFragmentDoc.definitions,
    ],
};
export const CompleteVideoRenderJobDocument: DocumentNode<
    CompleteVideoRenderJobMutation,
    CompleteVideoRenderJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CompleteVideoRenderJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "videoRenderJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_VideoRenderJob_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "videoRenderJobId" },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: { kind: "EnumValue", value: "COMPLETED" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "broadcastContentItemId" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetVideoRenderJobDocument: DocumentNode<GetVideoRenderJobQuery, GetVideoRenderJobQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetVideoRenderJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "videoRenderJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "VideoRenderJob_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "id" },
                                value: { kind: "Variable", name: { kind: "Name", value: "videoRenderJobId" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "data" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const UpdateMp4BroadcastContentItemDocument: DocumentNode<
    UpdateMp4BroadcastContentItemMutation,
    UpdateMp4BroadcastContentItemMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "UpdateMP4BroadcastContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "broadcastContentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_BroadcastContentItem_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "broadcastContentItemId" },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "input" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "input" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "inputTypeName" },
                                            value: { kind: "EnumValue", value: "MP4" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const OtherConferencePrepareJobsDocument: DocumentNode<
    OtherConferencePrepareJobsQuery,
    OtherConferencePrepareJobsQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "OtherConferencePrepareJobs" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferencePrepareJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ConferencePrepareJob" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: { kind: "EnumValue", value: "IN_PROGRESS" },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "conferenceId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_neq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "conferencePrepareJobId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetVideoBroadcastContentItemsDocument: DocumentNode<
    GetVideoBroadcastContentItemsQuery,
    GetVideoBroadcastContentItemsQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetVideoBroadcastContentItems" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "conferenceId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentTypeName" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: { kind: "EnumValue", value: "VIDEO_BROADCAST" },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "data" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetConfigurationValueDocument: DocumentNode<
    GetConfigurationValueQuery,
    GetConfigurationValueQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetConfigurationValue" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "key" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ConferenceConfiguration" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "key" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "key" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "conferenceId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "value" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const CreateBroadcastContentItemDocument: DocumentNode<
    CreateBroadcastContentItemMutation,
    CreateBroadcastContentItemMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CreateBroadcastContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_BroadcastContentItem_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentItemId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "inputTypeName" },
                                            value: { kind: "EnumValue", value: "MP4" },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "input" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "input" } },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "on_conflict" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "constraint" },
                                            value: {
                                                kind: "EnumValue",
                                                value: "BroadcastContentItem_contentItemId_key",
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "update_columns" },
                                            value: {
                                                kind: "ListValue",
                                                values: [
                                                    { kind: "EnumValue", value: "conferenceId" },
                                                    { kind: "EnumValue", value: "input" },
                                                    { kind: "EnumValue", value: "inputTypeName" },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetEventTitleDetailsDocument: DocumentNode<
    GetEventTitleDetailsQuery,
    GetEventTitleDetailsQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetEventTitleDetails" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Event" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "conferenceId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentGroup" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "contentItems" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "contentTypeName" },
                                                                    value: {
                                                                        kind: "ObjectValue",
                                                                        fields: [
                                                                            {
                                                                                kind: "ObjectField",
                                                                                name: { kind: "Name", value: "_in" },
                                                                                value: {
                                                                                    kind: "ListValue",
                                                                                    values: [
                                                                                        {
                                                                                            kind: "EnumValue",
                                                                                            value: "VIDEO_BROADCAST",
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "intendedRoomModeName" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: { kind: "EnumValue", value: "PRERECORDED" },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                {
                                    kind: "Field",
                                    name: { kind: "Name", value: "contentGroup" },
                                    selectionSet: {
                                        kind: "SelectionSet",
                                        selections: [
                                            { kind: "Field", name: { kind: "Name", value: "id" } },
                                            { kind: "Field", name: { kind: "Name", value: "title" } },
                                            {
                                                kind: "Field",
                                                name: { kind: "Name", value: "people" },
                                                arguments: [
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "distinct_on" },
                                                        value: { kind: "EnumValue", value: "id" },
                                                    },
                                                ],
                                                selectionSet: {
                                                    kind: "SelectionSet",
                                                    selections: [
                                                        {
                                                            kind: "Field",
                                                            name: { kind: "Name", value: "person" },
                                                            selectionSet: {
                                                                kind: "SelectionSet",
                                                                selections: [
                                                                    {
                                                                        kind: "Field",
                                                                        name: { kind: "Name", value: "name" },
                                                                    },
                                                                    {
                                                                        kind: "Field",
                                                                        name: { kind: "Name", value: "id" },
                                                                    },
                                                                ],
                                                            },
                                                        },
                                                        { kind: "Field", name: { kind: "Name", value: "id" } },
                                                    ],
                                                },
                                            },
                                            {
                                                kind: "Field",
                                                name: { kind: "Name", value: "contentItems" },
                                                arguments: [
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "distinct_on" },
                                                        value: { kind: "EnumValue", value: "contentTypeName" },
                                                    },
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "where" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "contentTypeName" },
                                                                    value: {
                                                                        kind: "ObjectValue",
                                                                        fields: [
                                                                            {
                                                                                kind: "ObjectField",
                                                                                name: { kind: "Name", value: "_eq" },
                                                                                value: {
                                                                                    kind: "EnumValue",
                                                                                    value: "VIDEO_BROADCAST",
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "order_by" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "contentTypeName" },
                                                                    value: { kind: "EnumValue", value: "asc" },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    {
                                                        kind: "Argument",
                                                        name: { kind: "Name", value: "limit" },
                                                        value: { kind: "IntValue", value: "1" },
                                                    },
                                                ],
                                                selectionSet: {
                                                    kind: "SelectionSet",
                                                    selections: [
                                                        {
                                                            kind: "Field",
                                                            name: { kind: "Name", value: "contentTypeName" },
                                                        },
                                                        { kind: "Field", name: { kind: "Name", value: "id" } },
                                                        {
                                                            kind: "Field",
                                                            name: { kind: "Name", value: "contentGroupId" },
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                                { kind: "Field", name: { kind: "Name", value: "intendedRoomModeName" } },
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const CreateVideoTitlesContentItemDocument: DocumentNode<
    CreateVideoTitlesContentItemMutation,
    CreateVideoTitlesContentItemMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CreateVideoTitlesContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentGroupId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "title" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_ContentItem_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentGroupId" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "contentGroupId" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentTypeName" },
                                            value: { kind: "EnumValue", value: "VIDEO_TITLES" },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "data" },
                                            value: { kind: "ListValue", values: [] },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "name" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "title" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetVideoTitlesContentItemDocument: DocumentNode<
    GetVideoTitlesContentItemQuery,
    GetVideoTitlesContentItemQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetVideoTitlesContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentGroupId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "title" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentGroupId" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "contentGroupId" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentTypeName" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: { kind: "EnumValue", value: "VIDEO_TITLES" },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "name" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "title" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "limit" },
                                value: { kind: "IntValue", value: "1" },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "order_by" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "createdAt" },
                                            value: { kind: "EnumValue", value: "desc" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const CreateVideoRenderJobDocument: DocumentNode<
    CreateVideoRenderJobMutation,
    CreateVideoRenderJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CreateVideoRenderJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferencePrepareJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "broadcastContentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "data" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_VideoRenderJob_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferencePrepareJobId" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "conferencePrepareJobId" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "broadcastContentItemId" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "broadcastContentItemId" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "data" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "data" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: { kind: "EnumValue", value: "NEW" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const EchoDocument: DocumentNode<EchoQuery, EchoQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "Echo" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "message" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "echo" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "message" },
                                value: { kind: "Variable", name: { kind: "Name", value: "message" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "message" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const RequiredItemDocument: DocumentNode<RequiredItemQuery, RequiredItemQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "RequiredItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "accessToken" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "RequiredContentItem" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "accessToken" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "accessToken" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "FragmentSpread", name: { kind: "Name", value: "RequiredItemFields" } },
                            ],
                        },
                    },
                ],
            },
        },
        ...RequiredItemFieldsFragmentDoc.definitions,
    ],
};
export const CreateContentItemDocument: DocumentNode<CreateContentItemMutation, CreateContentItemMutationVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CreateContentItem" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentGroupId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentTypeName" } },
                    type: {
                        kind: "NonNullType",
                        type: { kind: "NamedType", name: { kind: "Name", value: "ContentType_enum" } },
                    },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "data" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
                    type: {
                        kind: "NonNullType",
                        type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
                    },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "layoutData" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "name" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "requiredContentId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_ContentItem_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "conferenceId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "conferenceId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentGroupId" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "contentGroupId" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentTypeName" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "contentTypeName" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "data" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "data" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "isHidden" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "layoutData" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "layoutData" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "name" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "name" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "requiredContentId" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "requiredContentId" },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "on_conflict" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "constraint" },
                                            value: { kind: "EnumValue", value: "ContentItem_requiredContentId_key" },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "update_columns" },
                                            value: { kind: "EnumValue", value: "data" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetUploadersDocument: DocumentNode<GetUploadersQuery, GetUploadersQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetUploaders" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "requiredContentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Uploader" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "requiredContentItem" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "id" },
                                                        value: {
                                                            kind: "ObjectValue",
                                                            fields: [
                                                                {
                                                                    kind: "ObjectField",
                                                                    name: { kind: "Name", value: "_eq" },
                                                                    value: {
                                                                        kind: "Variable",
                                                                        name: {
                                                                            kind: "Name",
                                                                            value: "requiredContentItemId",
                                                                        },
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "name" } },
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "email" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const SelectUploadersAndUserDocument: DocumentNode<
    SelectUploadersAndUserQuery,
    SelectUploadersAndUserQueryVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "SelectUploadersAndUser" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "uploaderIds" } },
                    type: {
                        kind: "NonNullType",
                        type: {
                            kind: "ListType",
                            type: {
                                kind: "NonNullType",
                                type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } },
                            },
                        },
                    },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "Uploader" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_in" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "uploaderIds" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "UploaderParts" } }],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "User_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "id" },
                                value: { kind: "Variable", name: { kind: "Name", value: "userId" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
        ...UploaderPartsFragmentDoc.definitions,
    ],
};
export const InsertSubmissionRequestEmailsDocument: DocumentNode<
    InsertSubmissionRequestEmailsMutation,
    InsertSubmissionRequestEmailsMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "InsertSubmissionRequestEmails" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "emails" } },
                    type: {
                        kind: "NonNullType",
                        type: {
                            kind: "ListType",
                            type: {
                                kind: "NonNullType",
                                type: { kind: "NamedType", name: { kind: "Name", value: "Email_insert_input" } },
                            },
                        },
                    },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "uploaderIds" } },
                    type: {
                        kind: "NonNullType",
                        type: {
                            kind: "ListType",
                            type: {
                                kind: "NonNullType",
                                type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } },
                            },
                        },
                    },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_Email" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "objects" },
                                value: { kind: "Variable", name: { kind: "Name", value: "emails" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_Uploader" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_in" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "uploaderIds" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_inc" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "emailsSentCount" },
                                            value: { kind: "IntValue", value: "1" },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "affected_rows" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const FailConferencePrepareJobDocument: DocumentNode<
    FailConferencePrepareJobMutation,
    FailConferencePrepareJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "FailConferencePrepareJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "message" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_ConferencePrepareJob_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "id" } },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: { kind: "EnumValue", value: "FAILED" },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "message" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "message" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetContentItemByIdDocument: DocumentNode<GetContentItemByIdQuery, GetContentItemByIdQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetContentItemById" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "ContentItem_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "id" },
                                value: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "data" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const CreateTranscriptionJobDocument: DocumentNode<
    CreateTranscriptionJobMutation,
    CreateTranscriptionJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "CreateTranscriptionJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "awsTranscribeJobName" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "videoS3Url" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "transcriptionS3Url" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "languageCode" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "insert_TranscriptionJob_one" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "object" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "awsTranscribeJobName" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "awsTranscribeJobName" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "contentItemId" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "contentItemId" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "videoS3Url" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "videoS3Url" } },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "transcriptionS3Url" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "transcriptionS3Url" },
                                            },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "languageCode" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "languageCode" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
export const GetTranscriptionJobDocument: DocumentNode<GetTranscriptionJobQuery, GetTranscriptionJobQueryVariables> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "query",
            name: { kind: "Name", value: "GetTranscriptionJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "awsTranscribeJobName" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "TranscriptionJob" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "where" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "awsTranscribeJobName" },
                                            value: {
                                                kind: "ObjectValue",
                                                fields: [
                                                    {
                                                        kind: "ObjectField",
                                                        name: { kind: "Name", value: "_eq" },
                                                        value: {
                                                            kind: "Variable",
                                                            name: { kind: "Name", value: "awsTranscribeJobName" },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "videoS3Url" } },
                                { kind: "Field", name: { kind: "Name", value: "contentItemId" } },
                                { kind: "Field", name: { kind: "Name", value: "transcriptionS3Url" } },
                                { kind: "Field", name: { kind: "Name", value: "languageCode" } },
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const FailVideoRenderJobDocument: DocumentNode<
    FailVideoRenderJobMutation,
    FailVideoRenderJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "FailVideoRenderJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "videoRenderJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "message" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "String" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_VideoRenderJob_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "videoRenderJobId" },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: { kind: "EnumValue", value: "FAILED" },
                                        },
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "message" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "message" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                                { kind: "Field", name: { kind: "Name", value: "id" } },
                                { kind: "Field", name: { kind: "Name", value: "conferencePrepareJobId" } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
};
export const StartVideoRenderJobDocument: DocumentNode<
    StartVideoRenderJobMutation,
    StartVideoRenderJobMutationVariables
> = {
    kind: "Document",
    definitions: [
        {
            kind: "OperationDefinition",
            operation: "mutation",
            name: { kind: "Name", value: "StartVideoRenderJob" },
            variableDefinitions: [
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "videoRenderJobId" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "uuid" } } },
                },
                {
                    kind: "VariableDefinition",
                    variable: { kind: "Variable", name: { kind: "Name", value: "data" } },
                    type: { kind: "NonNullType", type: { kind: "NamedType", name: { kind: "Name", value: "jsonb" } } },
                },
            ],
            selectionSet: {
                kind: "SelectionSet",
                selections: [
                    {
                        kind: "Field",
                        name: { kind: "Name", value: "update_VideoRenderJob_by_pk" },
                        arguments: [
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "pk_columns" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "id" },
                                            value: {
                                                kind: "Variable",
                                                name: { kind: "Name", value: "videoRenderJobId" },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_set" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "jobStatusName" },
                                            value: { kind: "EnumValue", value: "IN_PROGRESS" },
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "Argument",
                                name: { kind: "Name", value: "_append" },
                                value: {
                                    kind: "ObjectValue",
                                    fields: [
                                        {
                                            kind: "ObjectField",
                                            name: { kind: "Name", value: "data" },
                                            value: { kind: "Variable", name: { kind: "Name", value: "data" } },
                                        },
                                    ],
                                },
                            },
                        ],
                        selectionSet: {
                            kind: "SelectionSet",
                            selections: [{ kind: "Field", name: { kind: "Name", value: "id" } }],
                        },
                    },
                ],
            },
        },
    ],
};
