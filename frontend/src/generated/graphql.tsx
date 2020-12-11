import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
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
  readonly __typename?: 'Attendee';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An array relationship */
  readonly contentPeople: ReadonlyArray<ContentPerson>;
  /** An aggregated array relationship */
  readonly contentPeople_aggregate: ContentPerson_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  readonly displayName: Scalars['String'];
  /** An array relationship */
  readonly eventPeople: ReadonlyArray<EventPerson>;
  /** An aggregated array relationship */
  readonly eventPeople_aggregate: EventPerson_Aggregate;
  /** An array relationship */
  readonly groupAttendees: ReadonlyArray<GroupAttendee>;
  /** An aggregated array relationship */
  readonly groupAttendees_aggregate: GroupAttendee_Aggregate;
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly invitation?: Maybe<Invitation>;
  /** A computed field, executes function "hasbeeninvited" */
  readonly inviteSent?: Maybe<Scalars['Boolean']>;
  /** An array relationship */
  readonly roomParticipants: ReadonlyArray<RoomParticipant>;
  /** An aggregated array relationship */
  readonly roomParticipants_aggregate: RoomParticipant_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user?: Maybe<User>;
  readonly userId?: Maybe<Scalars['String']>;
};


/** columns and relationships of "Attendee" */
export type AttendeeContentPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeContentPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeEventPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeEventPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeGroupAttendeesArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeGroupAttendees_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeRoomParticipantsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** columns and relationships of "Attendee" */
export type AttendeeRoomParticipants_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** aggregated selection of "Attendee" */
export type Attendee_Aggregate = {
  readonly __typename?: 'Attendee_aggregate';
  readonly aggregate?: Maybe<Attendee_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Attendee>;
};

/** aggregate fields of "Attendee" */
export type Attendee_Aggregate_Fields = {
  readonly __typename?: 'Attendee_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Attendee_Max_Fields>;
  readonly min?: Maybe<Attendee_Min_Fields>;
};


/** aggregate fields of "Attendee" */
export type Attendee_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Attendee" */
export type Attendee_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Attendee_Max_Order_By>;
  readonly min?: Maybe<Attendee_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Attendee" */
export type Attendee_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Attendee_Insert_Input>;
  readonly on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Attendee". All fields are combined with a logical 'AND'. */
export type Attendee_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Attendee_Bool_Exp>>>;
  readonly _not?: Maybe<Attendee_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Attendee_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentPeople?: Maybe<ContentPerson_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly displayName?: Maybe<String_Comparison_Exp>;
  readonly eventPeople?: Maybe<EventPerson_Bool_Exp>;
  readonly groupAttendees?: Maybe<GroupAttendee_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly invitation?: Maybe<Invitation_Bool_Exp>;
  readonly roomParticipants?: Maybe<RoomParticipant_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Attendee" */
export enum Attendee_Constraint {
  /** unique or primary key constraint */
  AttendeeConferenceIdUserIdKey = 'Attendee_conferenceId_userId_key',
  /** unique or primary key constraint */
  AttendeePkey = 'Attendee_pkey'
}

/** input type for inserting data into table "Attendee" */
export type Attendee_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly displayName?: Maybe<Scalars['String']>;
  readonly eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
  readonly groupAttendees?: Maybe<GroupAttendee_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitation?: Maybe<Invitation_Obj_Rel_Insert_Input>;
  readonly roomParticipants?: Maybe<RoomParticipant_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Attendee_Max_Fields = {
  readonly __typename?: 'Attendee_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly displayName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "Attendee" */
export type Attendee_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly displayName?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Attendee_Min_Fields = {
  readonly __typename?: 'Attendee_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly displayName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "Attendee" */
export type Attendee_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly displayName?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "Attendee" */
export type Attendee_Mutation_Response = {
  readonly __typename?: 'Attendee_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Attendee>;
};

/** input type for inserting object relation for remote table "Attendee" */
export type Attendee_Obj_Rel_Insert_Input = {
  readonly data: Attendee_Insert_Input;
  readonly on_conflict?: Maybe<Attendee_On_Conflict>;
};

/** on conflict condition type for table "Attendee" */
export type Attendee_On_Conflict = {
  readonly constraint: Attendee_Constraint;
  readonly update_columns: ReadonlyArray<Attendee_Update_Column>;
  readonly where?: Maybe<Attendee_Bool_Exp>;
};

/** ordering options when selecting data from "Attendee" */
export type Attendee_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly displayName?: Maybe<Order_By>;
  readonly eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
  readonly groupAttendees_aggregate?: Maybe<GroupAttendee_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitation?: Maybe<Invitation_Order_By>;
  readonly roomParticipants_aggregate?: Maybe<RoomParticipant_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "Attendee" */
export type Attendee_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Attendee" */
export enum Attendee_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  DisplayName = 'displayName',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "Attendee" */
export type Attendee_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly displayName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "Attendee" */
export enum Attendee_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  DisplayName = 'displayName',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** expression to compare columns of type Boolean. All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['Boolean']>;
  readonly _gt?: Maybe<Scalars['Boolean']>;
  readonly _gte?: Maybe<Scalars['Boolean']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['Boolean']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['Boolean']>;
  readonly _lte?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<Scalars['Boolean']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['Boolean']>>;
};

/** columns and relationships of "Broadcast" */
export type Broadcast = {
  readonly __typename?: 'Broadcast';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly data: Scalars['jsonb'];
  /** An object relationship */
  readonly event: Event;
  readonly eventId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly to: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Broadcast" */
export type BroadcastDataArgs = {
  path?: Maybe<Scalars['String']>;
};

/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItem = {
  readonly __typename?: 'BroadcastContentItem';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An object relationship */
  readonly contentItem: ContentItem;
  readonly contentItemId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly executedTransitions: ReadonlyArray<ExecutedTransitions>;
  /** An aggregated array relationship */
  readonly executedTransitions_aggregate: ExecutedTransitions_Aggregate;
  /** An array relationship */
  readonly fallbackForTransitions: ReadonlyArray<Transitions>;
  /** An aggregated array relationship */
  readonly fallbackForTransitions_aggregate: Transitions_Aggregate;
  readonly id: Scalars['uuid'];
  readonly input: Scalars['jsonb'];
  /** An object relationship */
  readonly inputType: InputType;
  readonly inputTypeName: InputType_Enum;
  /** An array relationship */
  readonly transitions: ReadonlyArray<Transitions>;
  /** An aggregated array relationship */
  readonly transitions_aggregate: Transitions_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemExecutedTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemExecutedTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemFallbackForTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemFallbackForTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemInputArgs = {
  path?: Maybe<Scalars['String']>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** columns and relationships of "BroadcastContentItem" */
export type BroadcastContentItemTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};

/** aggregated selection of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate = {
  readonly __typename?: 'BroadcastContentItem_aggregate';
  readonly aggregate?: Maybe<BroadcastContentItem_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<BroadcastContentItem>;
};

/** aggregate fields of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_Fields = {
  readonly __typename?: 'BroadcastContentItem_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<BroadcastContentItem_Max_Fields>;
  readonly min?: Maybe<BroadcastContentItem_Min_Fields>;
};


/** aggregate fields of "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "BroadcastContentItem" */
export type BroadcastContentItem_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<BroadcastContentItem_Max_Order_By>;
  readonly min?: Maybe<BroadcastContentItem_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type BroadcastContentItem_Append_Input = {
  readonly input?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "BroadcastContentItem" */
export type BroadcastContentItem_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<BroadcastContentItem_Insert_Input>;
  readonly on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "BroadcastContentItem". All fields are combined with a logical 'AND'. */
export type BroadcastContentItem_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<BroadcastContentItem_Bool_Exp>>>;
  readonly _not?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<BroadcastContentItem_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentItem?: Maybe<ContentItem_Bool_Exp>;
  readonly contentItemId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
  readonly fallbackForTransitions?: Maybe<Transitions_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly input?: Maybe<Jsonb_Comparison_Exp>;
  readonly inputType?: Maybe<InputType_Bool_Exp>;
  readonly inputTypeName?: Maybe<InputType_Enum_Comparison_Exp>;
  readonly transitions?: Maybe<Transitions_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "BroadcastContentItem" */
export enum BroadcastContentItem_Constraint {
  /** unique or primary key constraint */
  BroadcastContentItemContentItemIdKey = 'BroadcastContentItem_contentItemId_key',
  /** unique or primary key constraint */
  BroadcastContentItemPkey = 'BroadcastContentItem_pkey'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type BroadcastContentItem_Delete_At_Path_Input = {
  readonly input?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type BroadcastContentItem_Delete_Elem_Input = {
  readonly input?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type BroadcastContentItem_Delete_Key_Input = {
  readonly input?: Maybe<Scalars['String']>;
};

/** input type for inserting data into table "BroadcastContentItem" */
export type BroadcastContentItem_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentItem?: Maybe<ContentItem_Obj_Rel_Insert_Input>;
  readonly contentItemId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
  readonly fallbackForTransitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly input?: Maybe<Scalars['jsonb']>;
  readonly inputType?: Maybe<InputType_Obj_Rel_Insert_Input>;
  readonly inputTypeName?: Maybe<InputType_Enum>;
  readonly transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type BroadcastContentItem_Max_Fields = {
  readonly __typename?: 'BroadcastContentItem_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentItemId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "BroadcastContentItem" */
export type BroadcastContentItem_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentItemId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type BroadcastContentItem_Min_Fields = {
  readonly __typename?: 'BroadcastContentItem_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentItemId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "BroadcastContentItem" */
export type BroadcastContentItem_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentItemId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "BroadcastContentItem" */
export type BroadcastContentItem_Mutation_Response = {
  readonly __typename?: 'BroadcastContentItem_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<BroadcastContentItem>;
};

/** input type for inserting object relation for remote table "BroadcastContentItem" */
export type BroadcastContentItem_Obj_Rel_Insert_Input = {
  readonly data: BroadcastContentItem_Insert_Input;
  readonly on_conflict?: Maybe<BroadcastContentItem_On_Conflict>;
};

/** on conflict condition type for table "BroadcastContentItem" */
export type BroadcastContentItem_On_Conflict = {
  readonly constraint: BroadcastContentItem_Constraint;
  readonly update_columns: ReadonlyArray<BroadcastContentItem_Update_Column>;
  readonly where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "BroadcastContentItem" */
export type BroadcastContentItem_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentItem?: Maybe<ContentItem_Order_By>;
  readonly contentItemId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
  readonly fallbackForTransitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly input?: Maybe<Order_By>;
  readonly inputType?: Maybe<InputType_Order_By>;
  readonly inputTypeName?: Maybe<Order_By>;
  readonly transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "BroadcastContentItem" */
export type BroadcastContentItem_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type BroadcastContentItem_Prepend_Input = {
  readonly input?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "BroadcastContentItem" */
export enum BroadcastContentItem_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentItemId = 'contentItemId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Input = 'input',
  /** column name */
  InputTypeName = 'inputTypeName',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "BroadcastContentItem" */
export type BroadcastContentItem_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentItemId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly input?: Maybe<Scalars['jsonb']>;
  readonly inputTypeName?: Maybe<InputType_Enum>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "BroadcastContentItem" */
export enum BroadcastContentItem_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentItemId = 'contentItemId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Input = 'input',
  /** column name */
  InputTypeName = 'inputTypeName',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregated selection of "Broadcast" */
export type Broadcast_Aggregate = {
  readonly __typename?: 'Broadcast_aggregate';
  readonly aggregate?: Maybe<Broadcast_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Broadcast>;
};

/** aggregate fields of "Broadcast" */
export type Broadcast_Aggregate_Fields = {
  readonly __typename?: 'Broadcast_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Broadcast_Max_Fields>;
  readonly min?: Maybe<Broadcast_Min_Fields>;
};


/** aggregate fields of "Broadcast" */
export type Broadcast_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Broadcast" */
export type Broadcast_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Broadcast_Max_Order_By>;
  readonly min?: Maybe<Broadcast_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Broadcast_Append_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "Broadcast" */
export type Broadcast_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Broadcast_Insert_Input>;
  readonly on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Broadcast". All fields are combined with a logical 'AND'. */
export type Broadcast_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Broadcast_Bool_Exp>>>;
  readonly _not?: Maybe<Broadcast_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Broadcast_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly data?: Maybe<Jsonb_Comparison_Exp>;
  readonly event?: Maybe<Event_Bool_Exp>;
  readonly eventId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly to?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Broadcast" */
export enum Broadcast_Constraint {
  /** unique or primary key constraint */
  BroadcastPkey = 'Broadcast_pkey'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Broadcast_Delete_At_Path_Input = {
  readonly data?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Broadcast_Delete_Elem_Input = {
  readonly data?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Broadcast_Delete_Key_Input = {
  readonly data?: Maybe<Scalars['String']>;
};

/** input type for inserting data into table "Broadcast" */
export type Broadcast_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly event?: Maybe<Event_Obj_Rel_Insert_Input>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly to?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Broadcast_Max_Fields = {
  readonly __typename?: 'Broadcast_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly to?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Broadcast" */
export type Broadcast_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly to?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Broadcast_Min_Fields = {
  readonly __typename?: 'Broadcast_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly to?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Broadcast" */
export type Broadcast_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly to?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Broadcast" */
export type Broadcast_Mutation_Response = {
  readonly __typename?: 'Broadcast_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Broadcast>;
};

/** input type for inserting object relation for remote table "Broadcast" */
export type Broadcast_Obj_Rel_Insert_Input = {
  readonly data: Broadcast_Insert_Input;
  readonly on_conflict?: Maybe<Broadcast_On_Conflict>;
};

/** on conflict condition type for table "Broadcast" */
export type Broadcast_On_Conflict = {
  readonly constraint: Broadcast_Constraint;
  readonly update_columns: ReadonlyArray<Broadcast_Update_Column>;
  readonly where?: Maybe<Broadcast_Bool_Exp>;
};

/** ordering options when selecting data from "Broadcast" */
export type Broadcast_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly data?: Maybe<Order_By>;
  readonly event?: Maybe<Event_Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly to?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Broadcast" */
export type Broadcast_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Broadcast_Prepend_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "Broadcast" */
export enum Broadcast_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  To = 'to',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Broadcast" */
export type Broadcast_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly to?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Broadcast" */
export enum Broadcast_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  To = 'to',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Chat" */
export type Chat = {
  readonly __typename?: 'Chat';
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly creator: User;
  readonly creatorId: Scalars['String'];
  readonly description?: Maybe<Scalars['String']>;
  /** An array relationship */
  readonly flaggedMessages: ReadonlyArray<FlaggedChatMessage>;
  /** An aggregated array relationship */
  readonly flaggedMessages_aggregate: FlaggedChatMessage_Aggregate;
  readonly id: Scalars['uuid'];
  readonly isAutoNotify: Scalars['Boolean'];
  readonly isAutoPin: Scalars['Boolean'];
  /** An array relationship */
  readonly members: ReadonlyArray<ChatMember>;
  /** An aggregated array relationship */
  readonly members_aggregate: ChatMember_Aggregate;
  /** An array relationship */
  readonly messages: ReadonlyArray<ChatMessage>;
  /** An aggregated array relationship */
  readonly messages_aggregate: ChatMessage_Aggregate;
  readonly mode: Scalars['String'];
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly typers: ReadonlyArray<ChatTyper>;
  /** An aggregated array relationship */
  readonly typers_aggregate: ChatTyper_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly viewers: ReadonlyArray<ChatViewer>;
  /** An aggregated array relationship */
  readonly viewers_aggregate: ChatViewer_Aggregate;
};


/** columns and relationships of "Chat" */
export type ChatFlaggedMessagesArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatFlaggedMessages_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatMembersArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatMembers_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatMessagesArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatMessages_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatTypersArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatTypers_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatViewersArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** columns and relationships of "Chat" */
export type ChatViewers_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};

/** columns and relationships of "ChatMember" */
export type ChatMember = {
  readonly __typename?: 'ChatMember';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  readonly invitationAcceptedAt?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "ChatMember" */
export type ChatMember_Aggregate = {
  readonly __typename?: 'ChatMember_aggregate';
  readonly aggregate?: Maybe<ChatMember_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatMember>;
};

/** aggregate fields of "ChatMember" */
export type ChatMember_Aggregate_Fields = {
  readonly __typename?: 'ChatMember_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatMember_Max_Fields>;
  readonly min?: Maybe<ChatMember_Min_Fields>;
};


/** aggregate fields of "ChatMember" */
export type ChatMember_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatMember" */
export type ChatMember_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatMember_Max_Order_By>;
  readonly min?: Maybe<ChatMember_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatMember" */
export type ChatMember_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatMember_Insert_Input>;
  readonly on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatMember". All fields are combined with a logical 'AND'. */
export type ChatMember_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatMember_Bool_Exp>>>;
  readonly _not?: Maybe<ChatMember_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatMember_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly invitationAcceptedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatMember" */
export enum ChatMember_Constraint {
  /** unique or primary key constraint */
  ChatMemberChatIdUserIdKey = 'ChatMember_chatId_userId_key',
  /** unique or primary key constraint */
  ChatMemberPkey = 'ChatMember_pkey'
}

/** input type for inserting data into table "ChatMember" */
export type ChatMember_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationAcceptedAt?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ChatMember_Max_Fields = {
  readonly __typename?: 'ChatMember_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationAcceptedAt?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ChatMember" */
export type ChatMember_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationAcceptedAt?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatMember_Min_Fields = {
  readonly __typename?: 'ChatMember_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationAcceptedAt?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ChatMember" */
export type ChatMember_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationAcceptedAt?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatMember" */
export type ChatMember_Mutation_Response = {
  readonly __typename?: 'ChatMember_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatMember>;
};

/** input type for inserting object relation for remote table "ChatMember" */
export type ChatMember_Obj_Rel_Insert_Input = {
  readonly data: ChatMember_Insert_Input;
  readonly on_conflict?: Maybe<ChatMember_On_Conflict>;
};

/** on conflict condition type for table "ChatMember" */
export type ChatMember_On_Conflict = {
  readonly constraint: ChatMember_Constraint;
  readonly update_columns: ReadonlyArray<ChatMember_Update_Column>;
  readonly where?: Maybe<ChatMember_Bool_Exp>;
};

/** ordering options when selecting data from "ChatMember" */
export type ChatMember_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationAcceptedAt?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatMember" */
export type ChatMember_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ChatMember" */
export enum ChatMember_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  InvitationAcceptedAt = 'invitationAcceptedAt',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "ChatMember" */
export type ChatMember_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationAcceptedAt?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "ChatMember" */
export enum ChatMember_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  InvitationAcceptedAt = 'invitationAcceptedAt',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** columns and relationships of "ChatMessage" */
export type ChatMessage = {
  readonly __typename?: 'ChatMessage';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly content: Scalars['jsonb'];
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly flags: ReadonlyArray<FlaggedChatMessage>;
  /** An aggregated array relationship */
  readonly flags_aggregate: FlaggedChatMessage_Aggregate;
  readonly id: Scalars['uuid'];
  readonly index: Scalars['Int'];
  readonly isHighlighted: Scalars['Boolean'];
  /** An array relationship */
  readonly reactions: ReadonlyArray<ChatReaction>;
  /** An aggregated array relationship */
  readonly reactions_aggregate: ChatReaction_Aggregate;
  /** An object relationship */
  readonly sender: User;
  readonly senderId: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "ChatMessage" */
export type ChatMessageContentArgs = {
  path?: Maybe<Scalars['String']>;
};


/** columns and relationships of "ChatMessage" */
export type ChatMessageFlagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "ChatMessage" */
export type ChatMessageFlags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "ChatMessage" */
export type ChatMessageReactionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** columns and relationships of "ChatMessage" */
export type ChatMessageReactions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};

/** aggregated selection of "ChatMessage" */
export type ChatMessage_Aggregate = {
  readonly __typename?: 'ChatMessage_aggregate';
  readonly aggregate?: Maybe<ChatMessage_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatMessage>;
};

/** aggregate fields of "ChatMessage" */
export type ChatMessage_Aggregate_Fields = {
  readonly __typename?: 'ChatMessage_aggregate_fields';
  readonly avg?: Maybe<ChatMessage_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatMessage_Max_Fields>;
  readonly min?: Maybe<ChatMessage_Min_Fields>;
  readonly stddev?: Maybe<ChatMessage_Stddev_Fields>;
  readonly stddev_pop?: Maybe<ChatMessage_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<ChatMessage_Stddev_Samp_Fields>;
  readonly sum?: Maybe<ChatMessage_Sum_Fields>;
  readonly var_pop?: Maybe<ChatMessage_Var_Pop_Fields>;
  readonly var_samp?: Maybe<ChatMessage_Var_Samp_Fields>;
  readonly variance?: Maybe<ChatMessage_Variance_Fields>;
};


/** aggregate fields of "ChatMessage" */
export type ChatMessage_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatMessage" */
export type ChatMessage_Aggregate_Order_By = {
  readonly avg?: Maybe<ChatMessage_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatMessage_Max_Order_By>;
  readonly min?: Maybe<ChatMessage_Min_Order_By>;
  readonly stddev?: Maybe<ChatMessage_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<ChatMessage_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<ChatMessage_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<ChatMessage_Sum_Order_By>;
  readonly var_pop?: Maybe<ChatMessage_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<ChatMessage_Var_Samp_Order_By>;
  readonly variance?: Maybe<ChatMessage_Variance_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ChatMessage_Append_Input = {
  readonly content?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "ChatMessage" */
export type ChatMessage_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatMessage_Insert_Input>;
  readonly on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** aggregate avg on columns */
export type ChatMessage_Avg_Fields = {
  readonly __typename?: 'ChatMessage_avg_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "ChatMessage" */
export type ChatMessage_Avg_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ChatMessage". All fields are combined with a logical 'AND'. */
export type ChatMessage_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatMessage_Bool_Exp>>>;
  readonly _not?: Maybe<ChatMessage_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatMessage_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly content?: Maybe<Jsonb_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly flags?: Maybe<FlaggedChatMessage_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly index?: Maybe<Int_Comparison_Exp>;
  readonly isHighlighted?: Maybe<Boolean_Comparison_Exp>;
  readonly reactions?: Maybe<ChatReaction_Bool_Exp>;
  readonly sender?: Maybe<User_Bool_Exp>;
  readonly senderId?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatMessage" */
export enum ChatMessage_Constraint {
  /** unique or primary key constraint */
  ChatMessageChatIdIndexKey = 'ChatMessage_chatId_index_key',
  /** unique or primary key constraint */
  ChatMessagePkey = 'ChatMessage_pkey'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ChatMessage_Delete_At_Path_Input = {
  readonly content?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ChatMessage_Delete_Elem_Input = {
  readonly content?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ChatMessage_Delete_Key_Input = {
  readonly content?: Maybe<Scalars['String']>;
};

/** input type for incrementing integer column in table "ChatMessage" */
export type ChatMessage_Inc_Input = {
  readonly index?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "ChatMessage" */
export type ChatMessage_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly content?: Maybe<Scalars['jsonb']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly flags?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly isHighlighted?: Maybe<Scalars['Boolean']>;
  readonly reactions?: Maybe<ChatReaction_Arr_Rel_Insert_Input>;
  readonly sender?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly senderId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type ChatMessage_Max_Fields = {
  readonly __typename?: 'ChatMessage_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly senderId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "ChatMessage" */
export type ChatMessage_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly senderId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatMessage_Min_Fields = {
  readonly __typename?: 'ChatMessage_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly senderId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "ChatMessage" */
export type ChatMessage_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly senderId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatMessage" */
export type ChatMessage_Mutation_Response = {
  readonly __typename?: 'ChatMessage_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatMessage>;
};

/** input type for inserting object relation for remote table "ChatMessage" */
export type ChatMessage_Obj_Rel_Insert_Input = {
  readonly data: ChatMessage_Insert_Input;
  readonly on_conflict?: Maybe<ChatMessage_On_Conflict>;
};

/** on conflict condition type for table "ChatMessage" */
export type ChatMessage_On_Conflict = {
  readonly constraint: ChatMessage_Constraint;
  readonly update_columns: ReadonlyArray<ChatMessage_Update_Column>;
  readonly where?: Maybe<ChatMessage_Bool_Exp>;
};

/** ordering options when selecting data from "ChatMessage" */
export type ChatMessage_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly content?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly flags_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly isHighlighted?: Maybe<Order_By>;
  readonly reactions_aggregate?: Maybe<ChatReaction_Aggregate_Order_By>;
  readonly sender?: Maybe<User_Order_By>;
  readonly senderId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatMessage" */
export type ChatMessage_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ChatMessage_Prepend_Input = {
  readonly content?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "ChatMessage" */
export enum ChatMessage_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Index = 'index',
  /** column name */
  IsHighlighted = 'isHighlighted',
  /** column name */
  SenderId = 'senderId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "ChatMessage" */
export type ChatMessage_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly content?: Maybe<Scalars['jsonb']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly isHighlighted?: Maybe<Scalars['Boolean']>;
  readonly senderId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate stddev on columns */
export type ChatMessage_Stddev_Fields = {
  readonly __typename?: 'ChatMessage_stddev_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ChatMessage_Stddev_Pop_Fields = {
  readonly __typename?: 'ChatMessage_stddev_pop_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Pop_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ChatMessage_Stddev_Samp_Fields = {
  readonly __typename?: 'ChatMessage_stddev_samp_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "ChatMessage" */
export type ChatMessage_Stddev_Samp_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ChatMessage_Sum_Fields = {
  readonly __typename?: 'ChatMessage_sum_fields';
  readonly index?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "ChatMessage" */
export type ChatMessage_Sum_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** update columns of table "ChatMessage" */
export enum ChatMessage_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Index = 'index',
  /** column name */
  IsHighlighted = 'isHighlighted',
  /** column name */
  SenderId = 'senderId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregate var_pop on columns */
export type ChatMessage_Var_Pop_Fields = {
  readonly __typename?: 'ChatMessage_var_pop_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "ChatMessage" */
export type ChatMessage_Var_Pop_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ChatMessage_Var_Samp_Fields = {
  readonly __typename?: 'ChatMessage_var_samp_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "ChatMessage" */
export type ChatMessage_Var_Samp_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ChatMessage_Variance_Fields = {
  readonly __typename?: 'ChatMessage_variance_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "ChatMessage" */
export type ChatMessage_Variance_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** columns and relationships of "ChatReaction" */
export type ChatReaction = {
  readonly __typename?: 'ChatReaction';
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly message: ChatMessage;
  readonly messageId: Scalars['uuid'];
  readonly reaction: Scalars['String'];
  /** An object relationship */
  readonly reactor: User;
  readonly reactorId: Scalars['String'];
};

/** aggregated selection of "ChatReaction" */
export type ChatReaction_Aggregate = {
  readonly __typename?: 'ChatReaction_aggregate';
  readonly aggregate?: Maybe<ChatReaction_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatReaction>;
};

/** aggregate fields of "ChatReaction" */
export type ChatReaction_Aggregate_Fields = {
  readonly __typename?: 'ChatReaction_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatReaction_Max_Fields>;
  readonly min?: Maybe<ChatReaction_Min_Fields>;
};


/** aggregate fields of "ChatReaction" */
export type ChatReaction_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatReaction" */
export type ChatReaction_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatReaction_Max_Order_By>;
  readonly min?: Maybe<ChatReaction_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatReaction" */
export type ChatReaction_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatReaction_Insert_Input>;
  readonly on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatReaction". All fields are combined with a logical 'AND'. */
export type ChatReaction_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatReaction_Bool_Exp>>>;
  readonly _not?: Maybe<ChatReaction_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatReaction_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly message?: Maybe<ChatMessage_Bool_Exp>;
  readonly messageId?: Maybe<Uuid_Comparison_Exp>;
  readonly reaction?: Maybe<String_Comparison_Exp>;
  readonly reactor?: Maybe<User_Bool_Exp>;
  readonly reactorId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatReaction" */
export enum ChatReaction_Constraint {
  /** unique or primary key constraint */
  ChatReactionMessageIdReactorIdReactionKey = 'ChatReaction_messageId_reactorId_reaction_key',
  /** unique or primary key constraint */
  ChatReactionPkey = 'ChatReaction_pkey'
}

/** input type for inserting data into table "ChatReaction" */
export type ChatReaction_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly message?: Maybe<ChatMessage_Obj_Rel_Insert_Input>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly reaction?: Maybe<Scalars['String']>;
  readonly reactor?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly reactorId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ChatReaction_Max_Fields = {
  readonly __typename?: 'ChatReaction_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly reaction?: Maybe<Scalars['String']>;
  readonly reactorId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ChatReaction" */
export type ChatReaction_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly reaction?: Maybe<Order_By>;
  readonly reactorId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatReaction_Min_Fields = {
  readonly __typename?: 'ChatReaction_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly reaction?: Maybe<Scalars['String']>;
  readonly reactorId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ChatReaction" */
export type ChatReaction_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly reaction?: Maybe<Order_By>;
  readonly reactorId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatReaction" */
export type ChatReaction_Mutation_Response = {
  readonly __typename?: 'ChatReaction_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatReaction>;
};

/** input type for inserting object relation for remote table "ChatReaction" */
export type ChatReaction_Obj_Rel_Insert_Input = {
  readonly data: ChatReaction_Insert_Input;
  readonly on_conflict?: Maybe<ChatReaction_On_Conflict>;
};

/** on conflict condition type for table "ChatReaction" */
export type ChatReaction_On_Conflict = {
  readonly constraint: ChatReaction_Constraint;
  readonly update_columns: ReadonlyArray<ChatReaction_Update_Column>;
  readonly where?: Maybe<ChatReaction_Bool_Exp>;
};

/** ordering options when selecting data from "ChatReaction" */
export type ChatReaction_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly message?: Maybe<ChatMessage_Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly reaction?: Maybe<Order_By>;
  readonly reactor?: Maybe<User_Order_By>;
  readonly reactorId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatReaction" */
export type ChatReaction_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ChatReaction" */
export enum ChatReaction_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  MessageId = 'messageId',
  /** column name */
  Reaction = 'reaction',
  /** column name */
  ReactorId = 'reactorId'
}

/** input type for updating data in table "ChatReaction" */
export type ChatReaction_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly reaction?: Maybe<Scalars['String']>;
  readonly reactorId?: Maybe<Scalars['String']>;
};

/** update columns of table "ChatReaction" */
export enum ChatReaction_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  MessageId = 'messageId',
  /** column name */
  Reaction = 'reaction',
  /** column name */
  ReactorId = 'reactorId'
}

/** columns and relationships of "ChatTyper" */
export type ChatTyper = {
  readonly __typename?: 'ChatTyper';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "ChatTyper" */
export type ChatTyper_Aggregate = {
  readonly __typename?: 'ChatTyper_aggregate';
  readonly aggregate?: Maybe<ChatTyper_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatTyper>;
};

/** aggregate fields of "ChatTyper" */
export type ChatTyper_Aggregate_Fields = {
  readonly __typename?: 'ChatTyper_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatTyper_Max_Fields>;
  readonly min?: Maybe<ChatTyper_Min_Fields>;
};


/** aggregate fields of "ChatTyper" */
export type ChatTyper_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatTyper" */
export type ChatTyper_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatTyper_Max_Order_By>;
  readonly min?: Maybe<ChatTyper_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatTyper" */
export type ChatTyper_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatTyper_Insert_Input>;
  readonly on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatTyper". All fields are combined with a logical 'AND'. */
export type ChatTyper_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatTyper_Bool_Exp>>>;
  readonly _not?: Maybe<ChatTyper_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatTyper_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatTyper" */
export enum ChatTyper_Constraint {
  /** unique or primary key constraint */
  ChatTyperChatIdUserIdKey = 'ChatTyper_chatId_userId_key',
  /** unique or primary key constraint */
  ChatTypersPkey = 'ChatTypers_pkey'
}

/** input type for inserting data into table "ChatTyper" */
export type ChatTyper_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ChatTyper_Max_Fields = {
  readonly __typename?: 'ChatTyper_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ChatTyper" */
export type ChatTyper_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatTyper_Min_Fields = {
  readonly __typename?: 'ChatTyper_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ChatTyper" */
export type ChatTyper_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatTyper" */
export type ChatTyper_Mutation_Response = {
  readonly __typename?: 'ChatTyper_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatTyper>;
};

/** input type for inserting object relation for remote table "ChatTyper" */
export type ChatTyper_Obj_Rel_Insert_Input = {
  readonly data: ChatTyper_Insert_Input;
  readonly on_conflict?: Maybe<ChatTyper_On_Conflict>;
};

/** on conflict condition type for table "ChatTyper" */
export type ChatTyper_On_Conflict = {
  readonly constraint: ChatTyper_Constraint;
  readonly update_columns: ReadonlyArray<ChatTyper_Update_Column>;
  readonly where?: Maybe<ChatTyper_Bool_Exp>;
};

/** ordering options when selecting data from "ChatTyper" */
export type ChatTyper_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatTyper" */
export type ChatTyper_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ChatTyper" */
export enum ChatTyper_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "ChatTyper" */
export type ChatTyper_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "ChatTyper" */
export enum ChatTyper_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** columns and relationships of "ChatUnreadIndex" */
export type ChatUnreadIndex = {
  readonly __typename?: 'ChatUnreadIndex';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly index?: Maybe<Scalars['Int']>;
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate = {
  readonly __typename?: 'ChatUnreadIndex_aggregate';
  readonly aggregate?: Maybe<ChatUnreadIndex_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatUnreadIndex>;
};

/** aggregate fields of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_Fields = {
  readonly __typename?: 'ChatUnreadIndex_aggregate_fields';
  readonly avg?: Maybe<ChatUnreadIndex_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatUnreadIndex_Max_Fields>;
  readonly min?: Maybe<ChatUnreadIndex_Min_Fields>;
  readonly stddev?: Maybe<ChatUnreadIndex_Stddev_Fields>;
  readonly stddev_pop?: Maybe<ChatUnreadIndex_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<ChatUnreadIndex_Stddev_Samp_Fields>;
  readonly sum?: Maybe<ChatUnreadIndex_Sum_Fields>;
  readonly var_pop?: Maybe<ChatUnreadIndex_Var_Pop_Fields>;
  readonly var_samp?: Maybe<ChatUnreadIndex_Var_Samp_Fields>;
  readonly variance?: Maybe<ChatUnreadIndex_Variance_Fields>;
};


/** aggregate fields of "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Aggregate_Order_By = {
  readonly avg?: Maybe<ChatUnreadIndex_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatUnreadIndex_Max_Order_By>;
  readonly min?: Maybe<ChatUnreadIndex_Min_Order_By>;
  readonly stddev?: Maybe<ChatUnreadIndex_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<ChatUnreadIndex_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<ChatUnreadIndex_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<ChatUnreadIndex_Sum_Order_By>;
  readonly var_pop?: Maybe<ChatUnreadIndex_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<ChatUnreadIndex_Var_Samp_Order_By>;
  readonly variance?: Maybe<ChatUnreadIndex_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "ChatUnreadIndex" */
export type ChatUnreadIndex_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatUnreadIndex_Insert_Input>;
  readonly on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** aggregate avg on columns */
export type ChatUnreadIndex_Avg_Fields = {
  readonly __typename?: 'ChatUnreadIndex_avg_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Avg_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ChatUnreadIndex". All fields are combined with a logical 'AND'. */
export type ChatUnreadIndex_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatUnreadIndex_Bool_Exp>>>;
  readonly _not?: Maybe<ChatUnreadIndex_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatUnreadIndex_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly index?: Maybe<Int_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Constraint {
  /** unique or primary key constraint */
  ChatUnreadIndexChatIdUserIdKey = 'ChatUnreadIndex_chatId_userId_key',
  /** unique or primary key constraint */
  ChatUnreadIndexPkey = 'ChatUnreadIndex_pkey'
}

/** input type for incrementing integer column in table "ChatUnreadIndex" */
export type ChatUnreadIndex_Inc_Input = {
  readonly index?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "ChatUnreadIndex" */
export type ChatUnreadIndex_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ChatUnreadIndex_Max_Fields = {
  readonly __typename?: 'ChatUnreadIndex_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatUnreadIndex_Min_Fields = {
  readonly __typename?: 'ChatUnreadIndex_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatUnreadIndex" */
export type ChatUnreadIndex_Mutation_Response = {
  readonly __typename?: 'ChatUnreadIndex_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatUnreadIndex>;
};

/** input type for inserting object relation for remote table "ChatUnreadIndex" */
export type ChatUnreadIndex_Obj_Rel_Insert_Input = {
  readonly data: ChatUnreadIndex_Insert_Input;
  readonly on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};

/** on conflict condition type for table "ChatUnreadIndex" */
export type ChatUnreadIndex_On_Conflict = {
  readonly constraint: ChatUnreadIndex_Constraint;
  readonly update_columns: ReadonlyArray<ChatUnreadIndex_Update_Column>;
  readonly where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};

/** ordering options when selecting data from "ChatUnreadIndex" */
export type ChatUnreadIndex_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly index?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatUnreadIndex" */
export type ChatUnreadIndex_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Index = 'index',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "ChatUnreadIndex" */
export type ChatUnreadIndex_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly index?: Maybe<Scalars['Int']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate stddev on columns */
export type ChatUnreadIndex_Stddev_Fields = {
  readonly __typename?: 'ChatUnreadIndex_stddev_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ChatUnreadIndex_Stddev_Pop_Fields = {
  readonly __typename?: 'ChatUnreadIndex_stddev_pop_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Pop_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ChatUnreadIndex_Stddev_Samp_Fields = {
  readonly __typename?: 'ChatUnreadIndex_stddev_samp_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Stddev_Samp_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ChatUnreadIndex_Sum_Fields = {
  readonly __typename?: 'ChatUnreadIndex_sum_fields';
  readonly index?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Sum_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** update columns of table "ChatUnreadIndex" */
export enum ChatUnreadIndex_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Index = 'index',
  /** column name */
  UserId = 'userId'
}

/** aggregate var_pop on columns */
export type ChatUnreadIndex_Var_Pop_Fields = {
  readonly __typename?: 'ChatUnreadIndex_var_pop_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Var_Pop_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ChatUnreadIndex_Var_Samp_Fields = {
  readonly __typename?: 'ChatUnreadIndex_var_samp_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Var_Samp_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ChatUnreadIndex_Variance_Fields = {
  readonly __typename?: 'ChatUnreadIndex_variance_fields';
  readonly index?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "ChatUnreadIndex" */
export type ChatUnreadIndex_Variance_Order_By = {
  readonly index?: Maybe<Order_By>;
};

/** columns and relationships of "ChatViewer" */
export type ChatViewer = {
  readonly __typename?: 'ChatViewer';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly lastSeen: Scalars['timestamptz'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "ChatViewer" */
export type ChatViewer_Aggregate = {
  readonly __typename?: 'ChatViewer_aggregate';
  readonly aggregate?: Maybe<ChatViewer_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ChatViewer>;
};

/** aggregate fields of "ChatViewer" */
export type ChatViewer_Aggregate_Fields = {
  readonly __typename?: 'ChatViewer_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ChatViewer_Max_Fields>;
  readonly min?: Maybe<ChatViewer_Min_Fields>;
};


/** aggregate fields of "ChatViewer" */
export type ChatViewer_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ChatViewer" */
export type ChatViewer_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ChatViewer_Max_Order_By>;
  readonly min?: Maybe<ChatViewer_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ChatViewer" */
export type ChatViewer_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ChatViewer_Insert_Input>;
  readonly on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ChatViewer". All fields are combined with a logical 'AND'. */
export type ChatViewer_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ChatViewer_Bool_Exp>>>;
  readonly _not?: Maybe<ChatViewer_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ChatViewer_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly lastSeen?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ChatViewer" */
export enum ChatViewer_Constraint {
  /** unique or primary key constraint */
  ChatViewerChatIdUserIdKey = 'ChatViewer_chatId_userId_key',
  /** unique or primary key constraint */
  ChatViewerPkey = 'ChatViewer_pkey'
}

/** input type for inserting data into table "ChatViewer" */
export type ChatViewer_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ChatViewer_Max_Fields = {
  readonly __typename?: 'ChatViewer_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ChatViewer" */
export type ChatViewer_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ChatViewer_Min_Fields = {
  readonly __typename?: 'ChatViewer_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ChatViewer" */
export type ChatViewer_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ChatViewer" */
export type ChatViewer_Mutation_Response = {
  readonly __typename?: 'ChatViewer_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ChatViewer>;
};

/** input type for inserting object relation for remote table "ChatViewer" */
export type ChatViewer_Obj_Rel_Insert_Input = {
  readonly data: ChatViewer_Insert_Input;
  readonly on_conflict?: Maybe<ChatViewer_On_Conflict>;
};

/** on conflict condition type for table "ChatViewer" */
export type ChatViewer_On_Conflict = {
  readonly constraint: ChatViewer_Constraint;
  readonly update_columns: ReadonlyArray<ChatViewer_Update_Column>;
  readonly where?: Maybe<ChatViewer_Bool_Exp>;
};

/** ordering options when selecting data from "ChatViewer" */
export type ChatViewer_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ChatViewer" */
export type ChatViewer_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ChatViewer" */
export enum ChatViewer_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  LastSeen = 'lastSeen',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "ChatViewer" */
export type ChatViewer_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "ChatViewer" */
export enum ChatViewer_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  LastSeen = 'lastSeen',
  /** column name */
  UserId = 'userId'
}

/** aggregated selection of "Chat" */
export type Chat_Aggregate = {
  readonly __typename?: 'Chat_aggregate';
  readonly aggregate?: Maybe<Chat_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Chat>;
};

/** aggregate fields of "Chat" */
export type Chat_Aggregate_Fields = {
  readonly __typename?: 'Chat_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Chat_Max_Fields>;
  readonly min?: Maybe<Chat_Min_Fields>;
};


/** aggregate fields of "Chat" */
export type Chat_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Chat" */
export type Chat_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Chat_Max_Order_By>;
  readonly min?: Maybe<Chat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Chat" */
export type Chat_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Chat_Insert_Input>;
  readonly on_conflict?: Maybe<Chat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Chat". All fields are combined with a logical 'AND'. */
export type Chat_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Chat_Bool_Exp>>>;
  readonly _not?: Maybe<Chat_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Chat_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly creator?: Maybe<User_Bool_Exp>;
  readonly creatorId?: Maybe<String_Comparison_Exp>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly flaggedMessages?: Maybe<FlaggedChatMessage_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly isAutoNotify?: Maybe<Boolean_Comparison_Exp>;
  readonly isAutoPin?: Maybe<Boolean_Comparison_Exp>;
  readonly members?: Maybe<ChatMember_Bool_Exp>;
  readonly messages?: Maybe<ChatMessage_Bool_Exp>;
  readonly mode?: Maybe<String_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly typers?: Maybe<ChatTyper_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly viewers?: Maybe<ChatViewer_Bool_Exp>;
};

/** unique or primary key constraints on table "Chat" */
export enum Chat_Constraint {
  /** unique or primary key constraint */
  ChatPkey = 'Chat_pkey'
}

/** input type for inserting data into table "Chat" */
export type Chat_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly creator?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly creatorId?: Maybe<Scalars['String']>;
  readonly description?: Maybe<Scalars['String']>;
  readonly flaggedMessages?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isAutoNotify?: Maybe<Scalars['Boolean']>;
  readonly isAutoPin?: Maybe<Scalars['Boolean']>;
  readonly members?: Maybe<ChatMember_Arr_Rel_Insert_Input>;
  readonly messages?: Maybe<ChatMessage_Arr_Rel_Insert_Input>;
  readonly mode?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly typers?: Maybe<ChatTyper_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly viewers?: Maybe<ChatViewer_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Chat_Max_Fields = {
  readonly __typename?: 'Chat_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly creatorId?: Maybe<Scalars['String']>;
  readonly description?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly mode?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Chat" */
export type Chat_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly creatorId?: Maybe<Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly mode?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Chat_Min_Fields = {
  readonly __typename?: 'Chat_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly creatorId?: Maybe<Scalars['String']>;
  readonly description?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly mode?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Chat" */
export type Chat_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly creatorId?: Maybe<Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly mode?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Chat" */
export type Chat_Mutation_Response = {
  readonly __typename?: 'Chat_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Chat>;
};

/** input type for inserting object relation for remote table "Chat" */
export type Chat_Obj_Rel_Insert_Input = {
  readonly data: Chat_Insert_Input;
  readonly on_conflict?: Maybe<Chat_On_Conflict>;
};

/** on conflict condition type for table "Chat" */
export type Chat_On_Conflict = {
  readonly constraint: Chat_Constraint;
  readonly update_columns: ReadonlyArray<Chat_Update_Column>;
  readonly where?: Maybe<Chat_Bool_Exp>;
};

/** ordering options when selecting data from "Chat" */
export type Chat_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly creator?: Maybe<User_Order_By>;
  readonly creatorId?: Maybe<Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly flaggedMessages_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly isAutoNotify?: Maybe<Order_By>;
  readonly isAutoPin?: Maybe<Order_By>;
  readonly members_aggregate?: Maybe<ChatMember_Aggregate_Order_By>;
  readonly messages_aggregate?: Maybe<ChatMessage_Aggregate_Order_By>;
  readonly mode?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly typers_aggregate?: Maybe<ChatTyper_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly viewers_aggregate?: Maybe<ChatViewer_Aggregate_Order_By>;
};

/** primary key columns input for table: "Chat" */
export type Chat_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Chat" */
export enum Chat_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  CreatorId = 'creatorId',
  /** column name */
  Description = 'description',
  /** column name */
  Id = 'id',
  /** column name */
  IsAutoNotify = 'isAutoNotify',
  /** column name */
  IsAutoPin = 'isAutoPin',
  /** column name */
  Mode = 'mode',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Chat" */
export type Chat_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly creatorId?: Maybe<Scalars['String']>;
  readonly description?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isAutoNotify?: Maybe<Scalars['Boolean']>;
  readonly isAutoPin?: Maybe<Scalars['Boolean']>;
  readonly mode?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Chat" */
export enum Chat_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  CreatorId = 'creatorId',
  /** column name */
  Description = 'description',
  /** column name */
  Id = 'id',
  /** column name */
  IsAutoNotify = 'isAutoNotify',
  /** column name */
  IsAutoPin = 'isAutoPin',
  /** column name */
  Mode = 'mode',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Conference" */
export type Conference = {
  readonly __typename?: 'Conference';
  /** An array relationship */
  readonly attendees: ReadonlyArray<Attendee>;
  /** An aggregated array relationship */
  readonly attendees_aggregate: Attendee_Aggregate;
  /** An array relationship */
  readonly configurations: ReadonlyArray<ConferenceConfiguration>;
  /** An aggregated array relationship */
  readonly configurations_aggregate: ConferenceConfiguration_Aggregate;
  /** An array relationship */
  readonly contentGroups: ReadonlyArray<ContentGroup>;
  /** An aggregated array relationship */
  readonly contentGroups_aggregate: ContentGroup_Aggregate;
  /** An array relationship */
  readonly contentPeople: ReadonlyArray<ContentPerson>;
  /** An aggregated array relationship */
  readonly contentPeople_aggregate: ContentPerson_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  readonly createdBy: Scalars['String'];
  /** An object relationship */
  readonly creator: User;
  /** An object relationship */
  readonly demoCode: ConferenceDemoCode;
  readonly demoCodeId: Scalars['uuid'];
  /** An array relationship */
  readonly groups: ReadonlyArray<Group>;
  /** An aggregated array relationship */
  readonly groups_aggregate: Group_Aggregate;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly originatingDatas: ReadonlyArray<OriginatingData>;
  /** An aggregated array relationship */
  readonly originatingDatas_aggregate: OriginatingData_Aggregate;
  /** An array relationship */
  readonly roles: ReadonlyArray<Role>;
  /** An aggregated array relationship */
  readonly roles_aggregate: Role_Aggregate;
  /** An array relationship */
  readonly rooms: ReadonlyArray<Room>;
  /** An aggregated array relationship */
  readonly rooms_aggregate: Room_Aggregate;
  readonly shortName: Scalars['String'];
  readonly slug: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Conference" */
export type ConferenceAttendeesArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceAttendees_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceConfigurationsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceConfigurations_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceContentGroupsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceContentGroups_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceContentPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceContentPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceGroupsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceGroups_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceOriginatingDatasArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceOriginatingDatas_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceRolesArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceRoles_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceRoomsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** columns and relationships of "Conference" */
export type ConferenceRooms_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};

/** columns and relationships of "ConferenceConfiguration" */
export type ConferenceConfiguration = {
  readonly __typename?: 'ConferenceConfiguration';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  readonly key: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
  readonly value: Scalars['jsonb'];
};


/** columns and relationships of "ConferenceConfiguration" */
export type ConferenceConfigurationValueArgs = {
  path?: Maybe<Scalars['String']>;
};

/** aggregated selection of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate = {
  readonly __typename?: 'ConferenceConfiguration_aggregate';
  readonly aggregate?: Maybe<ConferenceConfiguration_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ConferenceConfiguration>;
};

/** aggregate fields of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_Fields = {
  readonly __typename?: 'ConferenceConfiguration_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ConferenceConfiguration_Max_Fields>;
  readonly min?: Maybe<ConferenceConfiguration_Min_Fields>;
};


/** aggregate fields of "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ConferenceConfiguration_Max_Order_By>;
  readonly min?: Maybe<ConferenceConfiguration_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ConferenceConfiguration_Append_Input = {
  readonly value?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "ConferenceConfiguration" */
export type ConferenceConfiguration_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ConferenceConfiguration_Insert_Input>;
  readonly on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ConferenceConfiguration". All fields are combined with a logical 'AND'. */
export type ConferenceConfiguration_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ConferenceConfiguration_Bool_Exp>>>;
  readonly _not?: Maybe<ConferenceConfiguration_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ConferenceConfiguration_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly key?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly value?: Maybe<Jsonb_Comparison_Exp>;
};

/** unique or primary key constraints on table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Constraint {
  /** unique or primary key constraint */
  ConferenceConfigurationConferenceIdKeyKey = 'ConferenceConfiguration_conferenceId_key_key',
  /** unique or primary key constraint */
  ConferenceConfigurationPkey = 'ConferenceConfiguration_pkey'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ConferenceConfiguration_Delete_At_Path_Input = {
  readonly value?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ConferenceConfiguration_Delete_Elem_Input = {
  readonly value?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ConferenceConfiguration_Delete_Key_Input = {
  readonly value?: Maybe<Scalars['String']>;
};

/** input type for inserting data into table "ConferenceConfiguration" */
export type ConferenceConfiguration_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly key?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly value?: Maybe<Scalars['jsonb']>;
};

/** aggregate max on columns */
export type ConferenceConfiguration_Max_Fields = {
  readonly __typename?: 'ConferenceConfiguration_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly key?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly key?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ConferenceConfiguration_Min_Fields = {
  readonly __typename?: 'ConferenceConfiguration_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly key?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "ConferenceConfiguration" */
export type ConferenceConfiguration_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly key?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ConferenceConfiguration" */
export type ConferenceConfiguration_Mutation_Response = {
  readonly __typename?: 'ConferenceConfiguration_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ConferenceConfiguration>;
};

/** input type for inserting object relation for remote table "ConferenceConfiguration" */
export type ConferenceConfiguration_Obj_Rel_Insert_Input = {
  readonly data: ConferenceConfiguration_Insert_Input;
  readonly on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};

/** on conflict condition type for table "ConferenceConfiguration" */
export type ConferenceConfiguration_On_Conflict = {
  readonly constraint: ConferenceConfiguration_Constraint;
  readonly update_columns: ReadonlyArray<ConferenceConfiguration_Update_Column>;
  readonly where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};

/** ordering options when selecting data from "ConferenceConfiguration" */
export type ConferenceConfiguration_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly key?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly value?: Maybe<Order_By>;
};

/** primary key columns input for table: "ConferenceConfiguration" */
export type ConferenceConfiguration_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ConferenceConfiguration_Prepend_Input = {
  readonly value?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Key = 'key',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  Value = 'value'
}

/** input type for updating data in table "ConferenceConfiguration" */
export type ConferenceConfiguration_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly key?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly value?: Maybe<Scalars['jsonb']>;
};

/** update columns of table "ConferenceConfiguration" */
export enum ConferenceConfiguration_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Key = 'key',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  Value = 'value'
}

/** columns and relationships of "ConferenceDemoCode" */
export type ConferenceDemoCode = {
  readonly __typename?: 'ConferenceDemoCode';
  /** An object relationship */
  readonly conference?: Maybe<Conference>;
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  readonly note?: Maybe<Scalars['String']>;
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly usedBy?: Maybe<User>;
  readonly usedById?: Maybe<Scalars['String']>;
};

/** aggregated selection of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate = {
  readonly __typename?: 'ConferenceDemoCode_aggregate';
  readonly aggregate?: Maybe<ConferenceDemoCode_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ConferenceDemoCode>;
};

/** aggregate fields of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_Fields = {
  readonly __typename?: 'ConferenceDemoCode_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ConferenceDemoCode_Max_Fields>;
  readonly min?: Maybe<ConferenceDemoCode_Min_Fields>;
};


/** aggregate fields of "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ConferenceDemoCode_Max_Order_By>;
  readonly min?: Maybe<ConferenceDemoCode_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ConferenceDemoCode" */
export type ConferenceDemoCode_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ConferenceDemoCode_Insert_Input>;
  readonly on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ConferenceDemoCode". All fields are combined with a logical 'AND'. */
export type ConferenceDemoCode_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ConferenceDemoCode_Bool_Exp>>>;
  readonly _not?: Maybe<ConferenceDemoCode_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ConferenceDemoCode_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly note?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly usedBy?: Maybe<User_Bool_Exp>;
  readonly usedById?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Constraint {
  /** unique or primary key constraint */
  ConferenceDemoCodesPkey = 'ConferenceDemoCodes_pkey'
}

/** input type for inserting data into table "ConferenceDemoCode" */
export type ConferenceDemoCode_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly note?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly usedBy?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly usedById?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ConferenceDemoCode_Max_Fields = {
  readonly __typename?: 'ConferenceDemoCode_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly note?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly usedById?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly note?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly usedById?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ConferenceDemoCode_Min_Fields = {
  readonly __typename?: 'ConferenceDemoCode_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly note?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly usedById?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ConferenceDemoCode" */
export type ConferenceDemoCode_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly note?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly usedById?: Maybe<Order_By>;
};

/** response of any mutation on the table "ConferenceDemoCode" */
export type ConferenceDemoCode_Mutation_Response = {
  readonly __typename?: 'ConferenceDemoCode_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ConferenceDemoCode>;
};

/** input type for inserting object relation for remote table "ConferenceDemoCode" */
export type ConferenceDemoCode_Obj_Rel_Insert_Input = {
  readonly data: ConferenceDemoCode_Insert_Input;
  readonly on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};

/** on conflict condition type for table "ConferenceDemoCode" */
export type ConferenceDemoCode_On_Conflict = {
  readonly constraint: ConferenceDemoCode_Constraint;
  readonly update_columns: ReadonlyArray<ConferenceDemoCode_Update_Column>;
  readonly where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};

/** ordering options when selecting data from "ConferenceDemoCode" */
export type ConferenceDemoCode_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly note?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly usedBy?: Maybe<User_Order_By>;
  readonly usedById?: Maybe<Order_By>;
};

/** primary key columns input for table: "ConferenceDemoCode" */
export type ConferenceDemoCode_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Note = 'note',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UsedById = 'usedById'
}

/** input type for updating data in table "ConferenceDemoCode" */
export type ConferenceDemoCode_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly note?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly usedById?: Maybe<Scalars['String']>;
};

/** update columns of table "ConferenceDemoCode" */
export enum ConferenceDemoCode_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Note = 'note',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UsedById = 'usedById'
}

/** aggregated selection of "Conference" */
export type Conference_Aggregate = {
  readonly __typename?: 'Conference_aggregate';
  readonly aggregate?: Maybe<Conference_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Conference>;
};

/** aggregate fields of "Conference" */
export type Conference_Aggregate_Fields = {
  readonly __typename?: 'Conference_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Conference_Max_Fields>;
  readonly min?: Maybe<Conference_Min_Fields>;
};


/** aggregate fields of "Conference" */
export type Conference_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Conference" */
export type Conference_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Conference_Max_Order_By>;
  readonly min?: Maybe<Conference_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Conference" */
export type Conference_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Conference_Insert_Input>;
  readonly on_conflict?: Maybe<Conference_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Conference". All fields are combined with a logical 'AND'. */
export type Conference_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Conference_Bool_Exp>>>;
  readonly _not?: Maybe<Conference_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Conference_Bool_Exp>>>;
  readonly attendees?: Maybe<Attendee_Bool_Exp>;
  readonly configurations?: Maybe<ConferenceConfiguration_Bool_Exp>;
  readonly contentGroups?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentPeople?: Maybe<ContentPerson_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly createdBy?: Maybe<String_Comparison_Exp>;
  readonly creator?: Maybe<User_Bool_Exp>;
  readonly demoCode?: Maybe<ConferenceDemoCode_Bool_Exp>;
  readonly demoCodeId?: Maybe<Uuid_Comparison_Exp>;
  readonly groups?: Maybe<Group_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingDatas?: Maybe<OriginatingData_Bool_Exp>;
  readonly roles?: Maybe<Role_Bool_Exp>;
  readonly rooms?: Maybe<Room_Bool_Exp>;
  readonly shortName?: Maybe<String_Comparison_Exp>;
  readonly slug?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Conference" */
export enum Conference_Constraint {
  /** unique or primary key constraint */
  ConferenceDemoCodeIdKey = 'Conference_demoCodeId_key',
  /** unique or primary key constraint */
  ConferenceNameKey = 'Conference_name_key',
  /** unique or primary key constraint */
  ConferencePkey = 'Conference_pkey',
  /** unique or primary key constraint */
  ConferenceShortNameKey = 'Conference_shortName_key',
  /** unique or primary key constraint */
  ConferenceSlugKey = 'Conference_slug_key'
}

/** input type for inserting data into table "Conference" */
export type Conference_Insert_Input = {
  readonly attendees?: Maybe<Attendee_Arr_Rel_Insert_Input>;
  readonly configurations?: Maybe<ConferenceConfiguration_Arr_Rel_Insert_Input>;
  readonly contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
  readonly contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly createdBy?: Maybe<Scalars['String']>;
  readonly creator?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly demoCode?: Maybe<ConferenceDemoCode_Obj_Rel_Insert_Input>;
  readonly demoCodeId?: Maybe<Scalars['uuid']>;
  readonly groups?: Maybe<Group_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDatas?: Maybe<OriginatingData_Arr_Rel_Insert_Input>;
  readonly roles?: Maybe<Role_Arr_Rel_Insert_Input>;
  readonly rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
  readonly shortName?: Maybe<Scalars['String']>;
  readonly slug?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Conference_Max_Fields = {
  readonly __typename?: 'Conference_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly createdBy?: Maybe<Scalars['String']>;
  readonly demoCodeId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly shortName?: Maybe<Scalars['String']>;
  readonly slug?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Conference" */
export type Conference_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly createdBy?: Maybe<Order_By>;
  readonly demoCodeId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly shortName?: Maybe<Order_By>;
  readonly slug?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Conference_Min_Fields = {
  readonly __typename?: 'Conference_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly createdBy?: Maybe<Scalars['String']>;
  readonly demoCodeId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly shortName?: Maybe<Scalars['String']>;
  readonly slug?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Conference" */
export type Conference_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly createdBy?: Maybe<Order_By>;
  readonly demoCodeId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly shortName?: Maybe<Order_By>;
  readonly slug?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Conference" */
export type Conference_Mutation_Response = {
  readonly __typename?: 'Conference_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Conference>;
};

/** input type for inserting object relation for remote table "Conference" */
export type Conference_Obj_Rel_Insert_Input = {
  readonly data: Conference_Insert_Input;
  readonly on_conflict?: Maybe<Conference_On_Conflict>;
};

/** on conflict condition type for table "Conference" */
export type Conference_On_Conflict = {
  readonly constraint: Conference_Constraint;
  readonly update_columns: ReadonlyArray<Conference_Update_Column>;
  readonly where?: Maybe<Conference_Bool_Exp>;
};

/** ordering options when selecting data from "Conference" */
export type Conference_Order_By = {
  readonly attendees_aggregate?: Maybe<Attendee_Aggregate_Order_By>;
  readonly configurations_aggregate?: Maybe<ConferenceConfiguration_Aggregate_Order_By>;
  readonly contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
  readonly contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly createdBy?: Maybe<Order_By>;
  readonly creator?: Maybe<User_Order_By>;
  readonly demoCode?: Maybe<ConferenceDemoCode_Order_By>;
  readonly demoCodeId?: Maybe<Order_By>;
  readonly groups_aggregate?: Maybe<Group_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDatas_aggregate?: Maybe<OriginatingData_Aggregate_Order_By>;
  readonly roles_aggregate?: Maybe<Role_Aggregate_Order_By>;
  readonly rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
  readonly shortName?: Maybe<Order_By>;
  readonly slug?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Conference" */
export type Conference_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Conference" */
export enum Conference_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  CreatedBy = 'createdBy',
  /** column name */
  DemoCodeId = 'demoCodeId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  ShortName = 'shortName',
  /** column name */
  Slug = 'slug',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Conference" */
export type Conference_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly createdBy?: Maybe<Scalars['String']>;
  readonly demoCodeId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly shortName?: Maybe<Scalars['String']>;
  readonly slug?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Conference" */
export enum Conference_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  CreatedBy = 'createdBy',
  /** column name */
  DemoCodeId = 'demoCodeId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  ShortName = 'shortName',
  /** column name */
  Slug = 'slug',
  /** column name */
  UpdatedAt = 'updatedAt'
}

export type ConfirmInvitationInput = {
  readonly confirmationCode: Scalars['String'];
  readonly inviteCode: Scalars['uuid'];
};

export type ConfirmInvitationOutput = {
  readonly __typename?: 'ConfirmInvitationOutput';
  readonly confSlug?: Maybe<Scalars['String']>;
  readonly ok: Scalars['Boolean'];
};

/** columns and relationships of "ContentGroup" */
export type ContentGroup = {
  readonly __typename?: 'ContentGroup';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An array relationship */
  readonly contentGroupTags: ReadonlyArray<ContentGroupTag>;
  /** An aggregated array relationship */
  readonly contentGroupTags_aggregate: ContentGroupTag_Aggregate;
  /** An object relationship */
  readonly contentGroupType: ContentGroupType;
  readonly contentGroupTypeName: ContentGroupType_Enum;
  /** An array relationship */
  readonly contentItems: ReadonlyArray<ContentItem>;
  /** An aggregated array relationship */
  readonly contentItems_aggregate: ContentItem_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly events: ReadonlyArray<Event>;
  /** An aggregated array relationship */
  readonly events_aggregate: Event_Aggregate;
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  /** An array relationship */
  readonly requiredContentItems: ReadonlyArray<RequiredContentItem>;
  /** An aggregated array relationship */
  readonly requiredContentItems_aggregate: RequiredContentItem_Aggregate;
  readonly shortTitle?: Maybe<Scalars['String']>;
  readonly title: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupContentGroupTagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupContentGroupTags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupEventsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupEvents_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupRequiredContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentGroup" */
export type ContentGroupRequiredContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** columns and relationships of "ContentGroupTag" */
export type ContentGroupTag = {
  readonly __typename?: 'ContentGroupTag';
  /** An object relationship */
  readonly contentGroup: ContentGroup;
  readonly contentGroupId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly tag: Tag;
  readonly tagId: Scalars['uuid'];
};

/** aggregated selection of "ContentGroupTag" */
export type ContentGroupTag_Aggregate = {
  readonly __typename?: 'ContentGroupTag_aggregate';
  readonly aggregate?: Maybe<ContentGroupTag_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentGroupTag>;
};

/** aggregate fields of "ContentGroupTag" */
export type ContentGroupTag_Aggregate_Fields = {
  readonly __typename?: 'ContentGroupTag_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentGroupTag_Max_Fields>;
  readonly min?: Maybe<ContentGroupTag_Min_Fields>;
};


/** aggregate fields of "ContentGroupTag" */
export type ContentGroupTag_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentGroupTag" */
export type ContentGroupTag_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentGroupTag_Max_Order_By>;
  readonly min?: Maybe<ContentGroupTag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroupTag" */
export type ContentGroupTag_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentGroupTag_Insert_Input>;
  readonly on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroupTag". All fields are combined with a logical 'AND'. */
export type ContentGroupTag_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentGroupTag_Bool_Exp>>>;
  readonly _not?: Maybe<ContentGroupTag_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentGroupTag_Bool_Exp>>>;
  readonly contentGroup?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentGroupId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly tag?: Maybe<Tag_Bool_Exp>;
  readonly tagId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroupTag" */
export enum ContentGroupTag_Constraint {
  /** unique or primary key constraint */
  ContentGroupTagContentGroupIdTagIdKey = 'ContentGroupTag_contentGroupId_tagId_key',
  /** unique or primary key constraint */
  ContentGroupTagPkey = 'ContentGroupTag_pkey'
}

/** input type for inserting data into table "ContentGroupTag" */
export type ContentGroupTag_Insert_Input = {
  readonly contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tag?: Maybe<Tag_Obj_Rel_Insert_Input>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** aggregate max on columns */
export type ContentGroupTag_Max_Fields = {
  readonly __typename?: 'ContentGroupTag_max_fields';
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "ContentGroupTag" */
export type ContentGroupTag_Max_Order_By = {
  readonly contentGroupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroupTag_Min_Fields = {
  readonly __typename?: 'ContentGroupTag_min_fields';
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** order by min() on columns of table "ContentGroupTag" */
export type ContentGroupTag_Min_Order_By = {
  readonly contentGroupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroupTag" */
export type ContentGroupTag_Mutation_Response = {
  readonly __typename?: 'ContentGroupTag_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentGroupTag>;
};

/** input type for inserting object relation for remote table "ContentGroupTag" */
export type ContentGroupTag_Obj_Rel_Insert_Input = {
  readonly data: ContentGroupTag_Insert_Input;
  readonly on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};

/** on conflict condition type for table "ContentGroupTag" */
export type ContentGroupTag_On_Conflict = {
  readonly constraint: ContentGroupTag_Constraint;
  readonly update_columns: ReadonlyArray<ContentGroupTag_Update_Column>;
  readonly where?: Maybe<ContentGroupTag_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroupTag" */
export type ContentGroupTag_Order_By = {
  readonly contentGroup?: Maybe<ContentGroup_Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tag?: Maybe<Tag_Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroupTag" */
export type ContentGroupTag_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ContentGroupTag" */
export enum ContentGroupTag_Select_Column {
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  Id = 'id',
  /** column name */
  TagId = 'tagId'
}

/** input type for updating data in table "ContentGroupTag" */
export type ContentGroupTag_Set_Input = {
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** update columns of table "ContentGroupTag" */
export enum ContentGroupTag_Update_Column {
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  Id = 'id',
  /** column name */
  TagId = 'tagId'
}

/** columns and relationships of "ContentGroupType" */
export type ContentGroupType = {
  readonly __typename?: 'ContentGroupType';
  /** An array relationship */
  readonly contentGroups: ReadonlyArray<ContentGroup>;
  /** An aggregated array relationship */
  readonly contentGroups_aggregate: ContentGroup_Aggregate;
  readonly description: Scalars['String'];
  readonly name: Scalars['String'];
};


/** columns and relationships of "ContentGroupType" */
export type ContentGroupTypeContentGroupsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** columns and relationships of "ContentGroupType" */
export type ContentGroupTypeContentGroups_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};

/** aggregated selection of "ContentGroupType" */
export type ContentGroupType_Aggregate = {
  readonly __typename?: 'ContentGroupType_aggregate';
  readonly aggregate?: Maybe<ContentGroupType_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentGroupType>;
};

/** aggregate fields of "ContentGroupType" */
export type ContentGroupType_Aggregate_Fields = {
  readonly __typename?: 'ContentGroupType_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentGroupType_Max_Fields>;
  readonly min?: Maybe<ContentGroupType_Min_Fields>;
};


/** aggregate fields of "ContentGroupType" */
export type ContentGroupType_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentGroupType_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentGroupType" */
export type ContentGroupType_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentGroupType_Max_Order_By>;
  readonly min?: Maybe<ContentGroupType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroupType" */
export type ContentGroupType_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentGroupType_Insert_Input>;
  readonly on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroupType". All fields are combined with a logical 'AND'. */
export type ContentGroupType_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentGroupType_Bool_Exp>>>;
  readonly _not?: Maybe<ContentGroupType_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentGroupType_Bool_Exp>>>;
  readonly contentGroups?: Maybe<ContentGroup_Bool_Exp>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroupType" */
export enum ContentGroupType_Constraint {
  /** unique or primary key constraint */
  ContentGroupTypePkey = 'ContentGroupType_pkey'
}

export enum ContentGroupType_Enum {
  /** A keynote. */
  Keynote = 'KEYNOTE',
  /** A generic group type - use sparingly. */
  Other = 'OTHER',
  /** A paper. */
  Paper = 'PAPER',
  /** A poster. */
  Poster = 'POSTER',
  /** A sponsor. */
  Sponsor = 'SPONSOR',
  /** A symposium. */
  Symposium = 'SYMPOSIUM',
  /** A workshop. */
  Workshop = 'WORKSHOP'
}

/** expression to compare columns of type ContentGroupType_enum. All fields are combined with logical 'AND'. */
export type ContentGroupType_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<ContentGroupType_Enum>;
  readonly _in?: Maybe<ReadonlyArray<ContentGroupType_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<ContentGroupType_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<ContentGroupType_Enum>>;
};

/** input type for inserting data into table "ContentGroupType" */
export type ContentGroupType_Insert_Input = {
  readonly contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ContentGroupType_Max_Fields = {
  readonly __typename?: 'ContentGroupType_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ContentGroupType" */
export type ContentGroupType_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroupType_Min_Fields = {
  readonly __typename?: 'ContentGroupType_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ContentGroupType" */
export type ContentGroupType_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroupType" */
export type ContentGroupType_Mutation_Response = {
  readonly __typename?: 'ContentGroupType_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentGroupType>;
};

/** input type for inserting object relation for remote table "ContentGroupType" */
export type ContentGroupType_Obj_Rel_Insert_Input = {
  readonly data: ContentGroupType_Insert_Input;
  readonly on_conflict?: Maybe<ContentGroupType_On_Conflict>;
};

/** on conflict condition type for table "ContentGroupType" */
export type ContentGroupType_On_Conflict = {
  readonly constraint: ContentGroupType_Constraint;
  readonly update_columns: ReadonlyArray<ContentGroupType_Update_Column>;
  readonly where?: Maybe<ContentGroupType_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroupType" */
export type ContentGroupType_Order_By = {
  readonly contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroupType" */
export type ContentGroupType_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "ContentGroupType" */
export enum ContentGroupType_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "ContentGroupType" */
export type ContentGroupType_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "ContentGroupType" */
export enum ContentGroupType_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** aggregated selection of "ContentGroup" */
export type ContentGroup_Aggregate = {
  readonly __typename?: 'ContentGroup_aggregate';
  readonly aggregate?: Maybe<ContentGroup_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentGroup>;
};

/** aggregate fields of "ContentGroup" */
export type ContentGroup_Aggregate_Fields = {
  readonly __typename?: 'ContentGroup_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentGroup_Max_Fields>;
  readonly min?: Maybe<ContentGroup_Min_Fields>;
};


/** aggregate fields of "ContentGroup" */
export type ContentGroup_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentGroup" */
export type ContentGroup_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentGroup_Max_Order_By>;
  readonly min?: Maybe<ContentGroup_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentGroup" */
export type ContentGroup_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentGroup_Insert_Input>;
  readonly on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentGroup". All fields are combined with a logical 'AND'. */
export type ContentGroup_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentGroup_Bool_Exp>>>;
  readonly _not?: Maybe<ContentGroup_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentGroup_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentGroupTags?: Maybe<ContentGroupTag_Bool_Exp>;
  readonly contentGroupType?: Maybe<ContentGroupType_Bool_Exp>;
  readonly contentGroupTypeName?: Maybe<ContentGroupType_Enum_Comparison_Exp>;
  readonly contentItems?: Maybe<ContentItem_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly events?: Maybe<Event_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
  readonly shortTitle?: Maybe<String_Comparison_Exp>;
  readonly title?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentGroup" */
export enum ContentGroup_Constraint {
  /** unique or primary key constraint */
  ContentGroupPkey = 'ContentGroup_pkey'
}

/** input type for inserting data into table "ContentGroup" */
export type ContentGroup_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupTags?: Maybe<ContentGroupTag_Arr_Rel_Insert_Input>;
  readonly contentGroupType?: Maybe<ContentGroupType_Obj_Rel_Insert_Input>;
  readonly contentGroupTypeName?: Maybe<ContentGroupType_Enum>;
  readonly contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly events?: Maybe<Event_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
  readonly shortTitle?: Maybe<Scalars['String']>;
  readonly title?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type ContentGroup_Max_Fields = {
  readonly __typename?: 'ContentGroup_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly shortTitle?: Maybe<Scalars['String']>;
  readonly title?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "ContentGroup" */
export type ContentGroup_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly shortTitle?: Maybe<Order_By>;
  readonly title?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentGroup_Min_Fields = {
  readonly __typename?: 'ContentGroup_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly shortTitle?: Maybe<Scalars['String']>;
  readonly title?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "ContentGroup" */
export type ContentGroup_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly shortTitle?: Maybe<Order_By>;
  readonly title?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentGroup" */
export type ContentGroup_Mutation_Response = {
  readonly __typename?: 'ContentGroup_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentGroup>;
};

/** input type for inserting object relation for remote table "ContentGroup" */
export type ContentGroup_Obj_Rel_Insert_Input = {
  readonly data: ContentGroup_Insert_Input;
  readonly on_conflict?: Maybe<ContentGroup_On_Conflict>;
};

/** on conflict condition type for table "ContentGroup" */
export type ContentGroup_On_Conflict = {
  readonly constraint: ContentGroup_Constraint;
  readonly update_columns: ReadonlyArray<ContentGroup_Update_Column>;
  readonly where?: Maybe<ContentGroup_Bool_Exp>;
};

/** ordering options when selecting data from "ContentGroup" */
export type ContentGroup_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupTags_aggregate?: Maybe<ContentGroupTag_Aggregate_Order_By>;
  readonly contentGroupType?: Maybe<ContentGroupType_Order_By>;
  readonly contentGroupTypeName?: Maybe<Order_By>;
  readonly contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly events_aggregate?: Maybe<Event_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
  readonly shortTitle?: Maybe<Order_By>;
  readonly title?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentGroup" */
export type ContentGroup_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ContentGroup" */
export enum ContentGroup_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupTypeName = 'contentGroupTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  ShortTitle = 'shortTitle',
  /** column name */
  Title = 'title',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "ContentGroup" */
export type ContentGroup_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupTypeName?: Maybe<ContentGroupType_Enum>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly shortTitle?: Maybe<Scalars['String']>;
  readonly title?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "ContentGroup" */
export enum ContentGroup_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupTypeName = 'contentGroupTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  ShortTitle = 'shortTitle',
  /** column name */
  Title = 'title',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "ContentItem" */
export type ContentItem = {
  readonly __typename?: 'ContentItem';
  /** An object relationship */
  readonly broadcastContentItem?: Maybe<BroadcastContentItem>;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An object relationship */
  readonly contentGroup: ContentGroup;
  readonly contentGroupId: Scalars['uuid'];
  /** An array relationship */
  readonly contentItemPeople: ReadonlyArray<ContentItemPerson>;
  /** An aggregated array relationship */
  readonly contentItemPeople_aggregate: ContentItemPerson_Aggregate;
  /** An object relationship */
  readonly contentType: ContentType;
  readonly contentTypeName: ContentType_Enum;
  readonly createdAt: Scalars['timestamptz'];
  readonly data: Scalars['jsonb'];
  readonly id: Scalars['uuid'];
  readonly isHidden: Scalars['Boolean'];
  readonly layoutData?: Maybe<Scalars['jsonb']>;
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentId?: Maybe<Scalars['uuid']>;
  /** An object relationship */
  readonly requiredContentItem?: Maybe<RequiredContentItem>;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "ContentItem" */
export type ContentItemContentItemPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** columns and relationships of "ContentItem" */
export type ContentItemContentItemPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** columns and relationships of "ContentItem" */
export type ContentItemDataArgs = {
  path?: Maybe<Scalars['String']>;
};


/** columns and relationships of "ContentItem" */
export type ContentItemLayoutDataArgs = {
  path?: Maybe<Scalars['String']>;
};

/** columns and relationships of "ContentItemPerson" */
export type ContentItemPerson = {
  readonly __typename?: 'ContentItemPerson';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly item: ContentItem;
  readonly itemId: Scalars['uuid'];
  /** An object relationship */
  readonly person: ContentPerson;
  readonly personId: Scalars['uuid'];
  readonly priority?: Maybe<Scalars['Int']>;
  readonly roleName: Scalars['String'];
};

/** aggregated selection of "ContentItemPerson" */
export type ContentItemPerson_Aggregate = {
  readonly __typename?: 'ContentItemPerson_aggregate';
  readonly aggregate?: Maybe<ContentItemPerson_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentItemPerson>;
};

/** aggregate fields of "ContentItemPerson" */
export type ContentItemPerson_Aggregate_Fields = {
  readonly __typename?: 'ContentItemPerson_aggregate_fields';
  readonly avg?: Maybe<ContentItemPerson_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentItemPerson_Max_Fields>;
  readonly min?: Maybe<ContentItemPerson_Min_Fields>;
  readonly stddev?: Maybe<ContentItemPerson_Stddev_Fields>;
  readonly stddev_pop?: Maybe<ContentItemPerson_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<ContentItemPerson_Stddev_Samp_Fields>;
  readonly sum?: Maybe<ContentItemPerson_Sum_Fields>;
  readonly var_pop?: Maybe<ContentItemPerson_Var_Pop_Fields>;
  readonly var_samp?: Maybe<ContentItemPerson_Var_Samp_Fields>;
  readonly variance?: Maybe<ContentItemPerson_Variance_Fields>;
};


/** aggregate fields of "ContentItemPerson" */
export type ContentItemPerson_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentItemPerson" */
export type ContentItemPerson_Aggregate_Order_By = {
  readonly avg?: Maybe<ContentItemPerson_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentItemPerson_Max_Order_By>;
  readonly min?: Maybe<ContentItemPerson_Min_Order_By>;
  readonly stddev?: Maybe<ContentItemPerson_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<ContentItemPerson_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<ContentItemPerson_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<ContentItemPerson_Sum_Order_By>;
  readonly var_pop?: Maybe<ContentItemPerson_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<ContentItemPerson_Var_Samp_Order_By>;
  readonly variance?: Maybe<ContentItemPerson_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "ContentItemPerson" */
export type ContentItemPerson_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentItemPerson_Insert_Input>;
  readonly on_conflict?: Maybe<ContentItemPerson_On_Conflict>;
};

/** aggregate avg on columns */
export type ContentItemPerson_Avg_Fields = {
  readonly __typename?: 'ContentItemPerson_avg_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Avg_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "ContentItemPerson". All fields are combined with a logical 'AND'. */
export type ContentItemPerson_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentItemPerson_Bool_Exp>>>;
  readonly _not?: Maybe<ContentItemPerson_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentItemPerson_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly item?: Maybe<ContentItem_Bool_Exp>;
  readonly itemId?: Maybe<Uuid_Comparison_Exp>;
  readonly person?: Maybe<ContentPerson_Bool_Exp>;
  readonly personId?: Maybe<Uuid_Comparison_Exp>;
  readonly priority?: Maybe<Int_Comparison_Exp>;
  readonly roleName?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentItemPerson" */
export enum ContentItemPerson_Constraint {
  /** unique or primary key constraint */
  ContentItemPersonPkey = 'ContentItemPerson_pkey'
}

/** input type for incrementing integer column in table "ContentItemPerson" */
export type ContentItemPerson_Inc_Input = {
  readonly priority?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "ContentItemPerson" */
export type ContentItemPerson_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly item?: Maybe<ContentItem_Obj_Rel_Insert_Input>;
  readonly itemId?: Maybe<Scalars['uuid']>;
  readonly person?: Maybe<ContentPerson_Obj_Rel_Insert_Input>;
  readonly personId?: Maybe<Scalars['uuid']>;
  readonly priority?: Maybe<Scalars['Int']>;
  readonly roleName?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type ContentItemPerson_Max_Fields = {
  readonly __typename?: 'ContentItemPerson_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly itemId?: Maybe<Scalars['uuid']>;
  readonly personId?: Maybe<Scalars['uuid']>;
  readonly priority?: Maybe<Scalars['Int']>;
  readonly roleName?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly itemId?: Maybe<Order_By>;
  readonly personId?: Maybe<Order_By>;
  readonly priority?: Maybe<Order_By>;
  readonly roleName?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentItemPerson_Min_Fields = {
  readonly __typename?: 'ContentItemPerson_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly itemId?: Maybe<Scalars['uuid']>;
  readonly personId?: Maybe<Scalars['uuid']>;
  readonly priority?: Maybe<Scalars['Int']>;
  readonly roleName?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly itemId?: Maybe<Order_By>;
  readonly personId?: Maybe<Order_By>;
  readonly priority?: Maybe<Order_By>;
  readonly roleName?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentItemPerson" */
export type ContentItemPerson_Mutation_Response = {
  readonly __typename?: 'ContentItemPerson_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentItemPerson>;
};

/** input type for inserting object relation for remote table "ContentItemPerson" */
export type ContentItemPerson_Obj_Rel_Insert_Input = {
  readonly data: ContentItemPerson_Insert_Input;
  readonly on_conflict?: Maybe<ContentItemPerson_On_Conflict>;
};

/** on conflict condition type for table "ContentItemPerson" */
export type ContentItemPerson_On_Conflict = {
  readonly constraint: ContentItemPerson_Constraint;
  readonly update_columns: ReadonlyArray<ContentItemPerson_Update_Column>;
  readonly where?: Maybe<ContentItemPerson_Bool_Exp>;
};

/** ordering options when selecting data from "ContentItemPerson" */
export type ContentItemPerson_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly item?: Maybe<ContentItem_Order_By>;
  readonly itemId?: Maybe<Order_By>;
  readonly person?: Maybe<ContentPerson_Order_By>;
  readonly personId?: Maybe<Order_By>;
  readonly priority?: Maybe<Order_By>;
  readonly roleName?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentItemPerson" */
export type ContentItemPerson_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ContentItemPerson" */
export enum ContentItemPerson_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  Id = 'id',
  /** column name */
  ItemId = 'itemId',
  /** column name */
  PersonId = 'personId',
  /** column name */
  Priority = 'priority',
  /** column name */
  RoleName = 'roleName'
}

/** input type for updating data in table "ContentItemPerson" */
export type ContentItemPerson_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly itemId?: Maybe<Scalars['uuid']>;
  readonly personId?: Maybe<Scalars['uuid']>;
  readonly priority?: Maybe<Scalars['Int']>;
  readonly roleName?: Maybe<Scalars['String']>;
};

/** aggregate stddev on columns */
export type ContentItemPerson_Stddev_Fields = {
  readonly __typename?: 'ContentItemPerson_stddev_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Stddev_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type ContentItemPerson_Stddev_Pop_Fields = {
  readonly __typename?: 'ContentItemPerson_stddev_pop_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Stddev_Pop_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type ContentItemPerson_Stddev_Samp_Fields = {
  readonly __typename?: 'ContentItemPerson_stddev_samp_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Stddev_Samp_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type ContentItemPerson_Sum_Fields = {
  readonly __typename?: 'ContentItemPerson_sum_fields';
  readonly priority?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Sum_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** update columns of table "ContentItemPerson" */
export enum ContentItemPerson_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  Id = 'id',
  /** column name */
  ItemId = 'itemId',
  /** column name */
  PersonId = 'personId',
  /** column name */
  Priority = 'priority',
  /** column name */
  RoleName = 'roleName'
}

/** aggregate var_pop on columns */
export type ContentItemPerson_Var_Pop_Fields = {
  readonly __typename?: 'ContentItemPerson_var_pop_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Var_Pop_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type ContentItemPerson_Var_Samp_Fields = {
  readonly __typename?: 'ContentItemPerson_var_samp_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Var_Samp_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type ContentItemPerson_Variance_Fields = {
  readonly __typename?: 'ContentItemPerson_variance_fields';
  readonly priority?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "ContentItemPerson" */
export type ContentItemPerson_Variance_Order_By = {
  readonly priority?: Maybe<Order_By>;
};

/** aggregated selection of "ContentItem" */
export type ContentItem_Aggregate = {
  readonly __typename?: 'ContentItem_aggregate';
  readonly aggregate?: Maybe<ContentItem_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentItem>;
};

/** aggregate fields of "ContentItem" */
export type ContentItem_Aggregate_Fields = {
  readonly __typename?: 'ContentItem_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentItem_Max_Fields>;
  readonly min?: Maybe<ContentItem_Min_Fields>;
};


/** aggregate fields of "ContentItem" */
export type ContentItem_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentItem" */
export type ContentItem_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentItem_Max_Order_By>;
  readonly min?: Maybe<ContentItem_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type ContentItem_Append_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly layoutData?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "ContentItem" */
export type ContentItem_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentItem_Insert_Input>;
  readonly on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentItem". All fields are combined with a logical 'AND'. */
export type ContentItem_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentItem_Bool_Exp>>>;
  readonly _not?: Maybe<ContentItem_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentItem_Bool_Exp>>>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentGroup?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentGroupId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentItemPeople?: Maybe<ContentItemPerson_Bool_Exp>;
  readonly contentType?: Maybe<ContentType_Bool_Exp>;
  readonly contentTypeName?: Maybe<ContentType_Enum_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly data?: Maybe<Jsonb_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly isHidden?: Maybe<Boolean_Comparison_Exp>;
  readonly layoutData?: Maybe<Jsonb_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly requiredContentId?: Maybe<Uuid_Comparison_Exp>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentItem" */
export enum ContentItem_Constraint {
  /** unique or primary key constraint */
  ContentItemPkey = 'ContentItem_pkey',
  /** unique or primary key constraint */
  ContentItemRequiredContentIdKey = 'ContentItem_requiredContentId_key'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type ContentItem_Delete_At_Path_Input = {
  readonly data?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
  readonly layoutData?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type ContentItem_Delete_Elem_Input = {
  readonly data?: Maybe<Scalars['Int']>;
  readonly layoutData?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type ContentItem_Delete_Key_Input = {
  readonly data?: Maybe<Scalars['String']>;
  readonly layoutData?: Maybe<Scalars['String']>;
};

/** input type for inserting data into table "ContentItem" */
export type ContentItem_Insert_Input = {
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly contentItemPeople?: Maybe<ContentItemPerson_Arr_Rel_Insert_Input>;
  readonly contentType?: Maybe<ContentType_Obj_Rel_Insert_Input>;
  readonly contentTypeName?: Maybe<ContentType_Enum>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isHidden?: Maybe<Scalars['Boolean']>;
  readonly layoutData?: Maybe<Scalars['jsonb']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentId?: Maybe<Scalars['uuid']>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Obj_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type ContentItem_Max_Fields = {
  readonly __typename?: 'ContentItem_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "ContentItem" */
export type ContentItem_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly requiredContentId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentItem_Min_Fields = {
  readonly __typename?: 'ContentItem_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "ContentItem" */
export type ContentItem_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly requiredContentId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentItem" */
export type ContentItem_Mutation_Response = {
  readonly __typename?: 'ContentItem_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentItem>;
};

/** input type for inserting object relation for remote table "ContentItem" */
export type ContentItem_Obj_Rel_Insert_Input = {
  readonly data: ContentItem_Insert_Input;
  readonly on_conflict?: Maybe<ContentItem_On_Conflict>;
};

/** on conflict condition type for table "ContentItem" */
export type ContentItem_On_Conflict = {
  readonly constraint: ContentItem_Constraint;
  readonly update_columns: ReadonlyArray<ContentItem_Update_Column>;
  readonly where?: Maybe<ContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "ContentItem" */
export type ContentItem_Order_By = {
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroup?: Maybe<ContentGroup_Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly contentItemPeople_aggregate?: Maybe<ContentItemPerson_Aggregate_Order_By>;
  readonly contentType?: Maybe<ContentType_Order_By>;
  readonly contentTypeName?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly data?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly isHidden?: Maybe<Order_By>;
  readonly layoutData?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly requiredContentId?: Maybe<Order_By>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentItem" */
export type ContentItem_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type ContentItem_Prepend_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly layoutData?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "ContentItem" */
export enum ContentItem_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  ContentTypeName = 'contentTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  Id = 'id',
  /** column name */
  IsHidden = 'isHidden',
  /** column name */
  LayoutData = 'layoutData',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RequiredContentId = 'requiredContentId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "ContentItem" */
export type ContentItem_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly contentTypeName?: Maybe<ContentType_Enum>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isHidden?: Maybe<Scalars['Boolean']>;
  readonly layoutData?: Maybe<Scalars['jsonb']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly requiredContentId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "ContentItem" */
export enum ContentItem_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  ContentTypeName = 'contentTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  Id = 'id',
  /** column name */
  IsHidden = 'isHidden',
  /** column name */
  LayoutData = 'layoutData',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RequiredContentId = 'requiredContentId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "ContentPerson" */
export type ContentPerson = {
  readonly __typename?: 'ContentPerson';
  readonly affiliation?: Maybe<Scalars['String']>;
  /** An object relationship */
  readonly attendee?: Maybe<Attendee>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An array relationship */
  readonly contentItemPeople: ReadonlyArray<ContentItemPerson>;
  /** An aggregated array relationship */
  readonly contentItemPeople_aggregate: ContentItemPerson_Aggregate;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};


/** columns and relationships of "ContentPerson" */
export type ContentPersonContentItemPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** columns and relationships of "ContentPerson" */
export type ContentPersonContentItemPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};

/** aggregated selection of "ContentPerson" */
export type ContentPerson_Aggregate = {
  readonly __typename?: 'ContentPerson_aggregate';
  readonly aggregate?: Maybe<ContentPerson_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentPerson>;
};

/** aggregate fields of "ContentPerson" */
export type ContentPerson_Aggregate_Fields = {
  readonly __typename?: 'ContentPerson_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentPerson_Max_Fields>;
  readonly min?: Maybe<ContentPerson_Min_Fields>;
};


/** aggregate fields of "ContentPerson" */
export type ContentPerson_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentPerson" */
export type ContentPerson_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentPerson_Max_Order_By>;
  readonly min?: Maybe<ContentPerson_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentPerson" */
export type ContentPerson_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentPerson_Insert_Input>;
  readonly on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentPerson". All fields are combined with a logical 'AND'. */
export type ContentPerson_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentPerson_Bool_Exp>>>;
  readonly _not?: Maybe<ContentPerson_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentPerson_Bool_Exp>>>;
  readonly affiliation?: Maybe<String_Comparison_Exp>;
  readonly attendee?: Maybe<Attendee_Bool_Exp>;
  readonly attendeeId?: Maybe<Uuid_Comparison_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentItemPeople?: Maybe<ContentItemPerson_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "ContentPerson" */
export enum ContentPerson_Constraint {
  /** unique or primary key constraint */
  ContentPersonConferenceIdNameAffiliationKey = 'ContentPerson_conferenceId_name_affiliation_key',
  /** unique or primary key constraint */
  ContentPersonPkey = 'ContentPerson_pkey'
}

/** input type for inserting data into table "ContentPerson" */
export type ContentPerson_Insert_Input = {
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentItemPeople?: Maybe<ContentItemPerson_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** aggregate max on columns */
export type ContentPerson_Max_Fields = {
  readonly __typename?: 'ContentPerson_max_fields';
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "ContentPerson" */
export type ContentPerson_Max_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentPerson_Min_Fields = {
  readonly __typename?: 'ContentPerson_min_fields';
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** order by min() on columns of table "ContentPerson" */
export type ContentPerson_Min_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentPerson" */
export type ContentPerson_Mutation_Response = {
  readonly __typename?: 'ContentPerson_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentPerson>;
};

/** input type for inserting object relation for remote table "ContentPerson" */
export type ContentPerson_Obj_Rel_Insert_Input = {
  readonly data: ContentPerson_Insert_Input;
  readonly on_conflict?: Maybe<ContentPerson_On_Conflict>;
};

/** on conflict condition type for table "ContentPerson" */
export type ContentPerson_On_Conflict = {
  readonly constraint: ContentPerson_Constraint;
  readonly update_columns: ReadonlyArray<ContentPerson_Update_Column>;
  readonly where?: Maybe<ContentPerson_Bool_Exp>;
};

/** ordering options when selecting data from "ContentPerson" */
export type ContentPerson_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendee?: Maybe<Attendee_Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentItemPeople_aggregate?: Maybe<ContentItemPerson_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
};

/** primary key columns input for table: "ContentPerson" */
export type ContentPerson_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ContentPerson" */
export enum ContentPerson_Select_Column {
  /** column name */
  Affiliation = 'affiliation',
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId'
}

/** input type for updating data in table "ContentPerson" */
export type ContentPerson_Set_Input = {
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** update columns of table "ContentPerson" */
export enum ContentPerson_Update_Column {
  /** column name */
  Affiliation = 'affiliation',
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId'
}

/** columns and relationships of "ContentType" */
export type ContentType = {
  readonly __typename?: 'ContentType';
  /** An array relationship */
  readonly contentItems: ReadonlyArray<ContentItem>;
  /** An aggregated array relationship */
  readonly contentItems_aggregate: ContentItem_Aggregate;
  readonly description: Scalars['String'];
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly requiredContentItems: ReadonlyArray<RequiredContentItem>;
  /** An aggregated array relationship */
  readonly requiredContentItems_aggregate: RequiredContentItem_Aggregate;
};


/** columns and relationships of "ContentType" */
export type ContentTypeContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentType" */
export type ContentTypeContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentType" */
export type ContentTypeRequiredContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** columns and relationships of "ContentType" */
export type ContentTypeRequiredContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** aggregated selection of "ContentType" */
export type ContentType_Aggregate = {
  readonly __typename?: 'ContentType_aggregate';
  readonly aggregate?: Maybe<ContentType_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ContentType>;
};

/** aggregate fields of "ContentType" */
export type ContentType_Aggregate_Fields = {
  readonly __typename?: 'ContentType_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ContentType_Max_Fields>;
  readonly min?: Maybe<ContentType_Min_Fields>;
};


/** aggregate fields of "ContentType" */
export type ContentType_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ContentType_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ContentType" */
export type ContentType_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ContentType_Max_Order_By>;
  readonly min?: Maybe<ContentType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ContentType" */
export type ContentType_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ContentType_Insert_Input>;
  readonly on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ContentType". All fields are combined with a logical 'AND'. */
export type ContentType_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ContentType_Bool_Exp>>>;
  readonly _not?: Maybe<ContentType_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ContentType_Bool_Exp>>>;
  readonly contentItems?: Maybe<ContentItem_Bool_Exp>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** unique or primary key constraints on table "ContentType" */
export enum ContentType_Constraint {
  /** unique or primary key constraint */
  ContentTypePkey = 'ContentType_pkey'
}

export enum ContentType_Enum {
  /** Abstract Markdown text. */
  Abstract = 'ABSTRACT',
  /** File for an image (stored by Clowdr). */
  ImageFile = 'IMAGE_FILE',
  /** URL to an image (embedded in Clowdr UI). */
  ImageUrl = 'IMAGE_URL',
  /** A generic URL. */
  Link = 'LINK',
  /** A URL for a link button. */
  LinkButton = 'LINK_BUTTON',
  /** File for a paper (stored by Clowdr). */
  PaperFile = 'PAPER_FILE',
  /** Link for a paper (preview is not embedded in Clowdr UI). */
  PaperLink = 'PAPER_LINK',
  /** URL to a paper (preview may be embedded in Clowdr UI e.g. PDF JS viewer). */
  PaperUrl = 'PAPER_URL',
  /** File for a poster image (stored by Clowdr). */
  PosterFile = 'POSTER_FILE',
  /** URL to a poster image (embedded in Clowdr UI). */
  PosterUrl = 'POSTER_URL',
  /** General-purpose Markdown text. */
  Text = 'TEXT',
  /** Video file to be broadcast. */
  VideoBroadcast = 'VIDEO_BROADCAST',
  /** Video file for counting down to a transition in a broadcast. */
  VideoCountdown = 'VIDEO_COUNTDOWN',
  /** File for a video (stored by Clowdr). */
  VideoFile = 'VIDEO_FILE',
  /** Video file for filler loop between events/during breaks in a broadcast. */
  VideoFiller = 'VIDEO_FILLER',
  /** Link to a video (video is not embedded in Clowdr UI). */
  VideoLink = 'VIDEO_LINK',
  /** Video file to be published in advance of the conference. */
  VideoPrepublish = 'VIDEO_PREPUBLISH',
  /** Video file for sponsors filler loop between events/during breaks in a broadcast. */
  VideoSponsorsFiller = 'VIDEO_SPONSORS_FILLER',
  /** Video file for titles introducing an event during a broadcast. */
  VideoTitles = 'VIDEO_TITLES',
  /** URL for a video (video is embedded in Clowdr UI). */
  VideoUrl = 'VIDEO_URL'
}

/** expression to compare columns of type ContentType_enum. All fields are combined with logical 'AND'. */
export type ContentType_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<ContentType_Enum>;
  readonly _in?: Maybe<ReadonlyArray<ContentType_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<ContentType_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<ContentType_Enum>>;
};

/** input type for inserting data into table "ContentType" */
export type ContentType_Insert_Input = {
  readonly contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type ContentType_Max_Fields = {
  readonly __typename?: 'ContentType_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "ContentType" */
export type ContentType_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ContentType_Min_Fields = {
  readonly __typename?: 'ContentType_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "ContentType" */
export type ContentType_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "ContentType" */
export type ContentType_Mutation_Response = {
  readonly __typename?: 'ContentType_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ContentType>;
};

/** input type for inserting object relation for remote table "ContentType" */
export type ContentType_Obj_Rel_Insert_Input = {
  readonly data: ContentType_Insert_Input;
  readonly on_conflict?: Maybe<ContentType_On_Conflict>;
};

/** on conflict condition type for table "ContentType" */
export type ContentType_On_Conflict = {
  readonly constraint: ContentType_Constraint;
  readonly update_columns: ReadonlyArray<ContentType_Update_Column>;
  readonly where?: Maybe<ContentType_Bool_Exp>;
};

/** ordering options when selecting data from "ContentType" */
export type ContentType_Order_By = {
  readonly contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
};

/** primary key columns input for table: "ContentType" */
export type ContentType_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "ContentType" */
export enum ContentType_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "ContentType" */
export type ContentType_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "ContentType" */
export enum ContentType_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

export type EchoInput = {
  readonly message: Scalars['String'];
};

export type EchoOutput = {
  readonly __typename?: 'EchoOutput';
  readonly message: Scalars['String'];
};

/** columns and relationships of "Email" */
export type Email = {
  readonly __typename?: 'Email';
  readonly createdAt: Scalars['timestamptz'];
  readonly emailAddress: Scalars['String'];
  readonly htmlContents: Scalars['String'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly invitation?: Maybe<Invitation>;
  readonly invitationId?: Maybe<Scalars['uuid']>;
  readonly plainTextContents: Scalars['String'];
  readonly reason: Scalars['String'];
  readonly retriesCount: Scalars['Int'];
  readonly sentAt?: Maybe<Scalars['timestamptz']>;
  readonly subject: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user?: Maybe<User>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregated selection of "Email" */
export type Email_Aggregate = {
  readonly __typename?: 'Email_aggregate';
  readonly aggregate?: Maybe<Email_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Email>;
};

/** aggregate fields of "Email" */
export type Email_Aggregate_Fields = {
  readonly __typename?: 'Email_aggregate_fields';
  readonly avg?: Maybe<Email_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Email_Max_Fields>;
  readonly min?: Maybe<Email_Min_Fields>;
  readonly stddev?: Maybe<Email_Stddev_Fields>;
  readonly stddev_pop?: Maybe<Email_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<Email_Stddev_Samp_Fields>;
  readonly sum?: Maybe<Email_Sum_Fields>;
  readonly var_pop?: Maybe<Email_Var_Pop_Fields>;
  readonly var_samp?: Maybe<Email_Var_Samp_Fields>;
  readonly variance?: Maybe<Email_Variance_Fields>;
};


/** aggregate fields of "Email" */
export type Email_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Email_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Email" */
export type Email_Aggregate_Order_By = {
  readonly avg?: Maybe<Email_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Email_Max_Order_By>;
  readonly min?: Maybe<Email_Min_Order_By>;
  readonly stddev?: Maybe<Email_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<Email_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<Email_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<Email_Sum_Order_By>;
  readonly var_pop?: Maybe<Email_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<Email_Var_Samp_Order_By>;
  readonly variance?: Maybe<Email_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Email" */
export type Email_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Email_Insert_Input>;
  readonly on_conflict?: Maybe<Email_On_Conflict>;
};

/** aggregate avg on columns */
export type Email_Avg_Fields = {
  readonly __typename?: 'Email_avg_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "Email" */
export type Email_Avg_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Email". All fields are combined with a logical 'AND'. */
export type Email_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Email_Bool_Exp>>>;
  readonly _not?: Maybe<Email_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Email_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly emailAddress?: Maybe<String_Comparison_Exp>;
  readonly htmlContents?: Maybe<String_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly invitation?: Maybe<Invitation_Bool_Exp>;
  readonly invitationId?: Maybe<Uuid_Comparison_Exp>;
  readonly plainTextContents?: Maybe<String_Comparison_Exp>;
  readonly reason?: Maybe<String_Comparison_Exp>;
  readonly retriesCount?: Maybe<Int_Comparison_Exp>;
  readonly sentAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly subject?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Email" */
export enum Email_Constraint {
  /** unique or primary key constraint */
  EmailPkey = 'Email_pkey'
}

/** input type for incrementing integer column in table "Email" */
export type Email_Inc_Input = {
  readonly retriesCount?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "Email" */
export type Email_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly emailAddress?: Maybe<Scalars['String']>;
  readonly htmlContents?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitation?: Maybe<Invitation_Obj_Rel_Insert_Input>;
  readonly invitationId?: Maybe<Scalars['uuid']>;
  readonly plainTextContents?: Maybe<Scalars['String']>;
  readonly reason?: Maybe<Scalars['String']>;
  readonly retriesCount?: Maybe<Scalars['Int']>;
  readonly sentAt?: Maybe<Scalars['timestamptz']>;
  readonly subject?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Email_Max_Fields = {
  readonly __typename?: 'Email_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly emailAddress?: Maybe<Scalars['String']>;
  readonly htmlContents?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationId?: Maybe<Scalars['uuid']>;
  readonly plainTextContents?: Maybe<Scalars['String']>;
  readonly reason?: Maybe<Scalars['String']>;
  readonly retriesCount?: Maybe<Scalars['Int']>;
  readonly sentAt?: Maybe<Scalars['timestamptz']>;
  readonly subject?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "Email" */
export type Email_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly emailAddress?: Maybe<Order_By>;
  readonly htmlContents?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationId?: Maybe<Order_By>;
  readonly plainTextContents?: Maybe<Order_By>;
  readonly reason?: Maybe<Order_By>;
  readonly retriesCount?: Maybe<Order_By>;
  readonly sentAt?: Maybe<Order_By>;
  readonly subject?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Email_Min_Fields = {
  readonly __typename?: 'Email_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly emailAddress?: Maybe<Scalars['String']>;
  readonly htmlContents?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationId?: Maybe<Scalars['uuid']>;
  readonly plainTextContents?: Maybe<Scalars['String']>;
  readonly reason?: Maybe<Scalars['String']>;
  readonly retriesCount?: Maybe<Scalars['Int']>;
  readonly sentAt?: Maybe<Scalars['timestamptz']>;
  readonly subject?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "Email" */
export type Email_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly emailAddress?: Maybe<Order_By>;
  readonly htmlContents?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationId?: Maybe<Order_By>;
  readonly plainTextContents?: Maybe<Order_By>;
  readonly reason?: Maybe<Order_By>;
  readonly retriesCount?: Maybe<Order_By>;
  readonly sentAt?: Maybe<Order_By>;
  readonly subject?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "Email" */
export type Email_Mutation_Response = {
  readonly __typename?: 'Email_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Email>;
};

/** input type for inserting object relation for remote table "Email" */
export type Email_Obj_Rel_Insert_Input = {
  readonly data: Email_Insert_Input;
  readonly on_conflict?: Maybe<Email_On_Conflict>;
};

/** on conflict condition type for table "Email" */
export type Email_On_Conflict = {
  readonly constraint: Email_Constraint;
  readonly update_columns: ReadonlyArray<Email_Update_Column>;
  readonly where?: Maybe<Email_Bool_Exp>;
};

/** ordering options when selecting data from "Email" */
export type Email_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly emailAddress?: Maybe<Order_By>;
  readonly htmlContents?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitation?: Maybe<Invitation_Order_By>;
  readonly invitationId?: Maybe<Order_By>;
  readonly plainTextContents?: Maybe<Order_By>;
  readonly reason?: Maybe<Order_By>;
  readonly retriesCount?: Maybe<Order_By>;
  readonly sentAt?: Maybe<Order_By>;
  readonly subject?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "Email" */
export type Email_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Email" */
export enum Email_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EmailAddress = 'emailAddress',
  /** column name */
  HtmlContents = 'htmlContents',
  /** column name */
  Id = 'id',
  /** column name */
  InvitationId = 'invitationId',
  /** column name */
  PlainTextContents = 'plainTextContents',
  /** column name */
  Reason = 'reason',
  /** column name */
  RetriesCount = 'retriesCount',
  /** column name */
  SentAt = 'sentAt',
  /** column name */
  Subject = 'subject',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "Email" */
export type Email_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly emailAddress?: Maybe<Scalars['String']>;
  readonly htmlContents?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly invitationId?: Maybe<Scalars['uuid']>;
  readonly plainTextContents?: Maybe<Scalars['String']>;
  readonly reason?: Maybe<Scalars['String']>;
  readonly retriesCount?: Maybe<Scalars['Int']>;
  readonly sentAt?: Maybe<Scalars['timestamptz']>;
  readonly subject?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate stddev on columns */
export type Email_Stddev_Fields = {
  readonly __typename?: 'Email_stddev_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "Email" */
export type Email_Stddev_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Email_Stddev_Pop_Fields = {
  readonly __typename?: 'Email_stddev_pop_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "Email" */
export type Email_Stddev_Pop_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Email_Stddev_Samp_Fields = {
  readonly __typename?: 'Email_stddev_samp_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "Email" */
export type Email_Stddev_Samp_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Email_Sum_Fields = {
  readonly __typename?: 'Email_sum_fields';
  readonly retriesCount?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "Email" */
export type Email_Sum_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** update columns of table "Email" */
export enum Email_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EmailAddress = 'emailAddress',
  /** column name */
  HtmlContents = 'htmlContents',
  /** column name */
  Id = 'id',
  /** column name */
  InvitationId = 'invitationId',
  /** column name */
  PlainTextContents = 'plainTextContents',
  /** column name */
  Reason = 'reason',
  /** column name */
  RetriesCount = 'retriesCount',
  /** column name */
  SentAt = 'sentAt',
  /** column name */
  Subject = 'subject',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** aggregate var_pop on columns */
export type Email_Var_Pop_Fields = {
  readonly __typename?: 'Email_var_pop_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "Email" */
export type Email_Var_Pop_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Email_Var_Samp_Fields = {
  readonly __typename?: 'Email_var_samp_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "Email" */
export type Email_Var_Samp_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Email_Variance_Fields = {
  readonly __typename?: 'Email_variance_fields';
  readonly retriesCount?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "Email" */
export type Email_Variance_Order_By = {
  readonly retriesCount?: Maybe<Order_By>;
};

/** columns and relationships of "Event" */
export type Event = {
  readonly __typename?: 'Event';
  /** An array relationship */
  readonly broadcasts: ReadonlyArray<Broadcast>;
  /** An aggregated array relationship */
  readonly broadcasts_aggregate: Broadcast_Aggregate;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An object relationship */
  readonly contentGroup?: Maybe<ContentGroup>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt: Scalars['timestamptz'];
  readonly durationSeconds: Scalars['Int'];
  /** An array relationship */
  readonly eventPeople: ReadonlyArray<EventPerson>;
  /** An aggregated array relationship */
  readonly eventPeople_aggregate: EventPerson_Aggregate;
  /** An array relationship */
  readonly eventTags: ReadonlyArray<EventTag>;
  /** An aggregated array relationship */
  readonly eventTags_aggregate: EventTag_Aggregate;
  /** An array relationship */
  readonly executedTransitions: ReadonlyArray<ExecutedTransitions>;
  /** An aggregated array relationship */
  readonly executedTransitions_aggregate: ExecutedTransitions_Aggregate;
  readonly id: Scalars['uuid'];
  readonly intendedRoomModeName: RoomMode_Enum;
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  /** An object relationship */
  readonly room: Room;
  readonly roomId: Scalars['uuid'];
  /** An object relationship */
  readonly roomMode: RoomMode;
  readonly startTime: Scalars['timestamptz'];
  /** An array relationship */
  readonly transitions: ReadonlyArray<Transitions>;
  /** An aggregated array relationship */
  readonly transitions_aggregate: Transitions_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Event" */
export type EventBroadcastsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventBroadcasts_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventEventPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventEventPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventEventTagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventEventTags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventExecutedTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventExecutedTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** columns and relationships of "Event" */
export type EventTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "EventPerson" */
export type EventPerson = {
  readonly __typename?: 'EventPerson';
  readonly affiliation?: Maybe<Scalars['String']>;
  /** An object relationship */
  readonly attendee?: Maybe<Attendee>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An object relationship */
  readonly event: Event;
  readonly eventId: Scalars['uuid'];
  /** An object relationship */
  readonly eventPersonRole: EventPersonRole;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roleName: EventPersonRole_Enum;
};

/** columns and relationships of "EventPersonRole" */
export type EventPersonRole = {
  readonly __typename?: 'EventPersonRole';
  readonly description: Scalars['String'];
  /** An array relationship */
  readonly eventPeople: ReadonlyArray<EventPerson>;
  /** An aggregated array relationship */
  readonly eventPeople_aggregate: EventPerson_Aggregate;
  readonly name: Scalars['String'];
};


/** columns and relationships of "EventPersonRole" */
export type EventPersonRoleEventPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "EventPersonRole" */
export type EventPersonRoleEventPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};

/** aggregated selection of "EventPersonRole" */
export type EventPersonRole_Aggregate = {
  readonly __typename?: 'EventPersonRole_aggregate';
  readonly aggregate?: Maybe<EventPersonRole_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<EventPersonRole>;
};

/** aggregate fields of "EventPersonRole" */
export type EventPersonRole_Aggregate_Fields = {
  readonly __typename?: 'EventPersonRole_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<EventPersonRole_Max_Fields>;
  readonly min?: Maybe<EventPersonRole_Min_Fields>;
};


/** aggregate fields of "EventPersonRole" */
export type EventPersonRole_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<EventPersonRole_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "EventPersonRole" */
export type EventPersonRole_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<EventPersonRole_Max_Order_By>;
  readonly min?: Maybe<EventPersonRole_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventPersonRole" */
export type EventPersonRole_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<EventPersonRole_Insert_Input>;
  readonly on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventPersonRole". All fields are combined with a logical 'AND'. */
export type EventPersonRole_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<EventPersonRole_Bool_Exp>>>;
  readonly _not?: Maybe<EventPersonRole_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<EventPersonRole_Bool_Exp>>>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly eventPeople?: Maybe<EventPerson_Bool_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventPersonRole" */
export enum EventPersonRole_Constraint {
  /** unique or primary key constraint */
  EventPersonRolePkey = 'EventPersonRole_pkey'
}

export enum EventPersonRole_Enum {
  /** Chair/moderator of the event */
  Chair = 'CHAIR',
  /** A presenter. */
  Presenter = 'PRESENTER'
}

/** expression to compare columns of type EventPersonRole_enum. All fields are combined with logical 'AND'. */
export type EventPersonRole_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<EventPersonRole_Enum>;
  readonly _in?: Maybe<ReadonlyArray<EventPersonRole_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<EventPersonRole_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<EventPersonRole_Enum>>;
};

/** input type for inserting data into table "EventPersonRole" */
export type EventPersonRole_Insert_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
  readonly name?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type EventPersonRole_Max_Fields = {
  readonly __typename?: 'EventPersonRole_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "EventPersonRole" */
export type EventPersonRole_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventPersonRole_Min_Fields = {
  readonly __typename?: 'EventPersonRole_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "EventPersonRole" */
export type EventPersonRole_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventPersonRole" */
export type EventPersonRole_Mutation_Response = {
  readonly __typename?: 'EventPersonRole_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<EventPersonRole>;
};

/** input type for inserting object relation for remote table "EventPersonRole" */
export type EventPersonRole_Obj_Rel_Insert_Input = {
  readonly data: EventPersonRole_Insert_Input;
  readonly on_conflict?: Maybe<EventPersonRole_On_Conflict>;
};

/** on conflict condition type for table "EventPersonRole" */
export type EventPersonRole_On_Conflict = {
  readonly constraint: EventPersonRole_Constraint;
  readonly update_columns: ReadonlyArray<EventPersonRole_Update_Column>;
  readonly where?: Maybe<EventPersonRole_Bool_Exp>;
};

/** ordering options when selecting data from "EventPersonRole" */
export type EventPersonRole_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventPersonRole" */
export type EventPersonRole_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "EventPersonRole" */
export enum EventPersonRole_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "EventPersonRole" */
export type EventPersonRole_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "EventPersonRole" */
export enum EventPersonRole_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** aggregated selection of "EventPerson" */
export type EventPerson_Aggregate = {
  readonly __typename?: 'EventPerson_aggregate';
  readonly aggregate?: Maybe<EventPerson_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<EventPerson>;
};

/** aggregate fields of "EventPerson" */
export type EventPerson_Aggregate_Fields = {
  readonly __typename?: 'EventPerson_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<EventPerson_Max_Fields>;
  readonly min?: Maybe<EventPerson_Min_Fields>;
};


/** aggregate fields of "EventPerson" */
export type EventPerson_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "EventPerson" */
export type EventPerson_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<EventPerson_Max_Order_By>;
  readonly min?: Maybe<EventPerson_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventPerson" */
export type EventPerson_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<EventPerson_Insert_Input>;
  readonly on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventPerson". All fields are combined with a logical 'AND'. */
export type EventPerson_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<EventPerson_Bool_Exp>>>;
  readonly _not?: Maybe<EventPerson_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<EventPerson_Bool_Exp>>>;
  readonly affiliation?: Maybe<String_Comparison_Exp>;
  readonly attendee?: Maybe<Attendee_Bool_Exp>;
  readonly attendeeId?: Maybe<Uuid_Comparison_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly event?: Maybe<Event_Bool_Exp>;
  readonly eventId?: Maybe<Uuid_Comparison_Exp>;
  readonly eventPersonRole?: Maybe<EventPersonRole_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly roleName?: Maybe<EventPersonRole_Enum_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventPerson" */
export enum EventPerson_Constraint {
  /** unique or primary key constraint */
  EventPersonEventIdAttendeeIdRoleNameKey = 'EventPerson_eventId_attendeeId_roleName_key',
  /** unique or primary key constraint */
  EventPersonEventIdNameAffiliationKey = 'EventPerson_eventId_name_affiliation_key',
  /** unique or primary key constraint */
  EventPersonPkey = 'EventPerson_pkey'
}

/** input type for inserting data into table "EventPerson" */
export type EventPerson_Insert_Input = {
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly event?: Maybe<Event_Obj_Rel_Insert_Input>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly eventPersonRole?: Maybe<EventPersonRole_Obj_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roleName?: Maybe<EventPersonRole_Enum>;
};

/** aggregate max on columns */
export type EventPerson_Max_Fields = {
  readonly __typename?: 'EventPerson_max_fields';
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "EventPerson" */
export type EventPerson_Max_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventPerson_Min_Fields = {
  readonly __typename?: 'EventPerson_min_fields';
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
};

/** order by min() on columns of table "EventPerson" */
export type EventPerson_Min_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventPerson" */
export type EventPerson_Mutation_Response = {
  readonly __typename?: 'EventPerson_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<EventPerson>;
};

/** input type for inserting object relation for remote table "EventPerson" */
export type EventPerson_Obj_Rel_Insert_Input = {
  readonly data: EventPerson_Insert_Input;
  readonly on_conflict?: Maybe<EventPerson_On_Conflict>;
};

/** on conflict condition type for table "EventPerson" */
export type EventPerson_On_Conflict = {
  readonly constraint: EventPerson_Constraint;
  readonly update_columns: ReadonlyArray<EventPerson_Update_Column>;
  readonly where?: Maybe<EventPerson_Bool_Exp>;
};

/** ordering options when selecting data from "EventPerson" */
export type EventPerson_Order_By = {
  readonly affiliation?: Maybe<Order_By>;
  readonly attendee?: Maybe<Attendee_Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly event?: Maybe<Event_Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly eventPersonRole?: Maybe<EventPersonRole_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly roleName?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventPerson" */
export type EventPerson_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "EventPerson" */
export enum EventPerson_Select_Column {
  /** column name */
  Affiliation = 'affiliation',
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RoleName = 'roleName'
}

/** input type for updating data in table "EventPerson" */
export type EventPerson_Set_Input = {
  readonly affiliation?: Maybe<Scalars['String']>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roleName?: Maybe<EventPersonRole_Enum>;
};

/** update columns of table "EventPerson" */
export enum EventPerson_Update_Column {
  /** column name */
  Affiliation = 'affiliation',
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RoleName = 'roleName'
}

/** columns and relationships of "EventTag" */
export type EventTag = {
  readonly __typename?: 'EventTag';
  /** An object relationship */
  readonly event: Event;
  readonly eventId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly tag: Tag;
  readonly tagId: Scalars['uuid'];
};

/** aggregated selection of "EventTag" */
export type EventTag_Aggregate = {
  readonly __typename?: 'EventTag_aggregate';
  readonly aggregate?: Maybe<EventTag_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<EventTag>;
};

/** aggregate fields of "EventTag" */
export type EventTag_Aggregate_Fields = {
  readonly __typename?: 'EventTag_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<EventTag_Max_Fields>;
  readonly min?: Maybe<EventTag_Min_Fields>;
};


/** aggregate fields of "EventTag" */
export type EventTag_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "EventTag" */
export type EventTag_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<EventTag_Max_Order_By>;
  readonly min?: Maybe<EventTag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "EventTag" */
export type EventTag_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<EventTag_Insert_Input>;
  readonly on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "EventTag". All fields are combined with a logical 'AND'. */
export type EventTag_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<EventTag_Bool_Exp>>>;
  readonly _not?: Maybe<EventTag_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<EventTag_Bool_Exp>>>;
  readonly event?: Maybe<Event_Bool_Exp>;
  readonly eventId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly tag?: Maybe<Tag_Bool_Exp>;
  readonly tagId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "EventTag" */
export enum EventTag_Constraint {
  /** unique or primary key constraint */
  EventTagPkey = 'EventTag_pkey',
  /** unique or primary key constraint */
  EventTagTagIdEventIdKey = 'EventTag_tagId_eventId_key'
}

/** input type for inserting data into table "EventTag" */
export type EventTag_Insert_Input = {
  readonly event?: Maybe<Event_Obj_Rel_Insert_Input>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tag?: Maybe<Tag_Obj_Rel_Insert_Input>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** aggregate max on columns */
export type EventTag_Max_Fields = {
  readonly __typename?: 'EventTag_max_fields';
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "EventTag" */
export type EventTag_Max_Order_By = {
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type EventTag_Min_Fields = {
  readonly __typename?: 'EventTag_min_fields';
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** order by min() on columns of table "EventTag" */
export type EventTag_Min_Order_By = {
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** response of any mutation on the table "EventTag" */
export type EventTag_Mutation_Response = {
  readonly __typename?: 'EventTag_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<EventTag>;
};

/** input type for inserting object relation for remote table "EventTag" */
export type EventTag_Obj_Rel_Insert_Input = {
  readonly data: EventTag_Insert_Input;
  readonly on_conflict?: Maybe<EventTag_On_Conflict>;
};

/** on conflict condition type for table "EventTag" */
export type EventTag_On_Conflict = {
  readonly constraint: EventTag_Constraint;
  readonly update_columns: ReadonlyArray<EventTag_Update_Column>;
  readonly where?: Maybe<EventTag_Bool_Exp>;
};

/** ordering options when selecting data from "EventTag" */
export type EventTag_Order_By = {
  readonly event?: Maybe<Event_Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly tag?: Maybe<Tag_Order_By>;
  readonly tagId?: Maybe<Order_By>;
};

/** primary key columns input for table: "EventTag" */
export type EventTag_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "EventTag" */
export enum EventTag_Select_Column {
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  TagId = 'tagId'
}

/** input type for updating data in table "EventTag" */
export type EventTag_Set_Input = {
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly tagId?: Maybe<Scalars['uuid']>;
};

/** update columns of table "EventTag" */
export enum EventTag_Update_Column {
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  TagId = 'tagId'
}

/** aggregated selection of "Event" */
export type Event_Aggregate = {
  readonly __typename?: 'Event_aggregate';
  readonly aggregate?: Maybe<Event_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Event>;
};

/** aggregate fields of "Event" */
export type Event_Aggregate_Fields = {
  readonly __typename?: 'Event_aggregate_fields';
  readonly avg?: Maybe<Event_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Event_Max_Fields>;
  readonly min?: Maybe<Event_Min_Fields>;
  readonly stddev?: Maybe<Event_Stddev_Fields>;
  readonly stddev_pop?: Maybe<Event_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<Event_Stddev_Samp_Fields>;
  readonly sum?: Maybe<Event_Sum_Fields>;
  readonly var_pop?: Maybe<Event_Var_Pop_Fields>;
  readonly var_samp?: Maybe<Event_Var_Samp_Fields>;
  readonly variance?: Maybe<Event_Variance_Fields>;
};


/** aggregate fields of "Event" */
export type Event_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Event_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Event" */
export type Event_Aggregate_Order_By = {
  readonly avg?: Maybe<Event_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Event_Max_Order_By>;
  readonly min?: Maybe<Event_Min_Order_By>;
  readonly stddev?: Maybe<Event_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<Event_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<Event_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<Event_Sum_Order_By>;
  readonly var_pop?: Maybe<Event_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<Event_Var_Samp_Order_By>;
  readonly variance?: Maybe<Event_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Event" */
export type Event_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Event_Insert_Input>;
  readonly on_conflict?: Maybe<Event_On_Conflict>;
};

/** aggregate avg on columns */
export type Event_Avg_Fields = {
  readonly __typename?: 'Event_avg_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "Event" */
export type Event_Avg_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Event". All fields are combined with a logical 'AND'. */
export type Event_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Event_Bool_Exp>>>;
  readonly _not?: Maybe<Event_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Event_Bool_Exp>>>;
  readonly broadcasts?: Maybe<Broadcast_Bool_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentGroup?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentGroupId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly durationSeconds?: Maybe<Int_Comparison_Exp>;
  readonly eventPeople?: Maybe<EventPerson_Bool_Exp>;
  readonly eventTags?: Maybe<EventTag_Bool_Exp>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly intendedRoomModeName?: Maybe<RoomMode_Enum_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly room?: Maybe<Room_Bool_Exp>;
  readonly roomId?: Maybe<Uuid_Comparison_Exp>;
  readonly roomMode?: Maybe<RoomMode_Bool_Exp>;
  readonly startTime?: Maybe<Timestamptz_Comparison_Exp>;
  readonly transitions?: Maybe<Transitions_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Event" */
export enum Event_Constraint {
  /** unique or primary key constraint */
  EventPkey = 'Event_pkey'
}

/** input type for incrementing integer column in table "Event" */
export type Event_Inc_Input = {
  readonly durationSeconds?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "Event" */
export type Event_Insert_Input = {
  readonly broadcasts?: Maybe<Broadcast_Arr_Rel_Insert_Input>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly durationSeconds?: Maybe<Scalars['Int']>;
  readonly eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
  readonly eventTags?: Maybe<EventTag_Arr_Rel_Insert_Input>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly intendedRoomModeName?: Maybe<RoomMode_Enum>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly room?: Maybe<Room_Obj_Rel_Insert_Input>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly roomMode?: Maybe<RoomMode_Obj_Rel_Insert_Input>;
  readonly startTime?: Maybe<Scalars['timestamptz']>;
  readonly transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Event_Max_Fields = {
  readonly __typename?: 'Event_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly durationSeconds?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly startTime?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Event" */
export type Event_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly durationSeconds?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly startTime?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Event_Min_Fields = {
  readonly __typename?: 'Event_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly durationSeconds?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly startTime?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Event" */
export type Event_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly durationSeconds?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly startTime?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Event" */
export type Event_Mutation_Response = {
  readonly __typename?: 'Event_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Event>;
};

/** input type for inserting object relation for remote table "Event" */
export type Event_Obj_Rel_Insert_Input = {
  readonly data: Event_Insert_Input;
  readonly on_conflict?: Maybe<Event_On_Conflict>;
};

/** on conflict condition type for table "Event" */
export type Event_On_Conflict = {
  readonly constraint: Event_Constraint;
  readonly update_columns: ReadonlyArray<Event_Update_Column>;
  readonly where?: Maybe<Event_Bool_Exp>;
};

/** ordering options when selecting data from "Event" */
export type Event_Order_By = {
  readonly broadcasts_aggregate?: Maybe<Broadcast_Aggregate_Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroup?: Maybe<ContentGroup_Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly durationSeconds?: Maybe<Order_By>;
  readonly eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
  readonly eventTags_aggregate?: Maybe<EventTag_Aggregate_Order_By>;
  readonly executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly intendedRoomModeName?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly room?: Maybe<Room_Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly roomMode?: Maybe<RoomMode_Order_By>;
  readonly startTime?: Maybe<Order_By>;
  readonly transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Event" */
export type Event_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Event" */
export enum Event_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  DurationSeconds = 'durationSeconds',
  /** column name */
  Id = 'id',
  /** column name */
  IntendedRoomModeName = 'intendedRoomModeName',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  StartTime = 'startTime',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Event" */
export type Event_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly durationSeconds?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly intendedRoomModeName?: Maybe<RoomMode_Enum>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly startTime?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate stddev on columns */
export type Event_Stddev_Fields = {
  readonly __typename?: 'Event_stddev_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "Event" */
export type Event_Stddev_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Event_Stddev_Pop_Fields = {
  readonly __typename?: 'Event_stddev_pop_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "Event" */
export type Event_Stddev_Pop_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Event_Stddev_Samp_Fields = {
  readonly __typename?: 'Event_stddev_samp_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "Event" */
export type Event_Stddev_Samp_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Event_Sum_Fields = {
  readonly __typename?: 'Event_sum_fields';
  readonly durationSeconds?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "Event" */
export type Event_Sum_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** update columns of table "Event" */
export enum Event_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  DurationSeconds = 'durationSeconds',
  /** column name */
  Id = 'id',
  /** column name */
  IntendedRoomModeName = 'intendedRoomModeName',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  StartTime = 'startTime',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregate var_pop on columns */
export type Event_Var_Pop_Fields = {
  readonly __typename?: 'Event_var_pop_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "Event" */
export type Event_Var_Pop_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Event_Var_Samp_Fields = {
  readonly __typename?: 'Event_var_samp_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "Event" */
export type Event_Var_Samp_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Event_Variance_Fields = {
  readonly __typename?: 'Event_variance_fields';
  readonly durationSeconds?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "Event" */
export type Event_Variance_Order_By = {
  readonly durationSeconds?: Maybe<Order_By>;
};

/** columns and relationships of "ExecutedTransitions" */
export type ExecutedTransitions = {
  readonly __typename?: 'ExecutedTransitions';
  readonly broadcastContentId: Scalars['uuid'];
  /** An object relationship */
  readonly broadcastContentItem: BroadcastContentItem;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly event: Event;
  readonly eventId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly room: Room;
  readonly roomId: Scalars['uuid'];
  readonly time: Scalars['timestamptz'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate = {
  readonly __typename?: 'ExecutedTransitions_aggregate';
  readonly aggregate?: Maybe<ExecutedTransitions_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<ExecutedTransitions>;
};

/** aggregate fields of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_Fields = {
  readonly __typename?: 'ExecutedTransitions_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<ExecutedTransitions_Max_Fields>;
  readonly min?: Maybe<ExecutedTransitions_Min_Fields>;
};


/** aggregate fields of "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "ExecutedTransitions" */
export type ExecutedTransitions_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<ExecutedTransitions_Max_Order_By>;
  readonly min?: Maybe<ExecutedTransitions_Min_Order_By>;
};

/** input type for inserting array relation for remote table "ExecutedTransitions" */
export type ExecutedTransitions_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<ExecutedTransitions_Insert_Input>;
  readonly on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "ExecutedTransitions". All fields are combined with a logical 'AND'. */
export type ExecutedTransitions_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<ExecutedTransitions_Bool_Exp>>>;
  readonly _not?: Maybe<ExecutedTransitions_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<ExecutedTransitions_Bool_Exp>>>;
  readonly broadcastContentId?: Maybe<Uuid_Comparison_Exp>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly event?: Maybe<Event_Bool_Exp>;
  readonly eventId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly room?: Maybe<Room_Bool_Exp>;
  readonly roomId?: Maybe<Uuid_Comparison_Exp>;
  readonly time?: Maybe<Timestamptz_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "ExecutedTransitions" */
export enum ExecutedTransitions_Constraint {
  /** unique or primary key constraint */
  ExecutedTransitionsPkey = 'ExecutedTransitions_pkey'
}

/** input type for inserting data into table "ExecutedTransitions" */
export type ExecutedTransitions_Insert_Input = {
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly event?: Maybe<Event_Obj_Rel_Insert_Input>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly room?: Maybe<Room_Obj_Rel_Insert_Input>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type ExecutedTransitions_Max_Fields = {
  readonly __typename?: 'ExecutedTransitions_max_fields';
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "ExecutedTransitions" */
export type ExecutedTransitions_Max_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type ExecutedTransitions_Min_Fields = {
  readonly __typename?: 'ExecutedTransitions_min_fields';
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "ExecutedTransitions" */
export type ExecutedTransitions_Min_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "ExecutedTransitions" */
export type ExecutedTransitions_Mutation_Response = {
  readonly __typename?: 'ExecutedTransitions_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<ExecutedTransitions>;
};

/** input type for inserting object relation for remote table "ExecutedTransitions" */
export type ExecutedTransitions_Obj_Rel_Insert_Input = {
  readonly data: ExecutedTransitions_Insert_Input;
  readonly on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};

/** on conflict condition type for table "ExecutedTransitions" */
export type ExecutedTransitions_On_Conflict = {
  readonly constraint: ExecutedTransitions_Constraint;
  readonly update_columns: ReadonlyArray<ExecutedTransitions_Update_Column>;
  readonly where?: Maybe<ExecutedTransitions_Bool_Exp>;
};

/** ordering options when selecting data from "ExecutedTransitions" */
export type ExecutedTransitions_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly event?: Maybe<Event_Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly room?: Maybe<Room_Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "ExecutedTransitions" */
export type ExecutedTransitions_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "ExecutedTransitions" */
export enum ExecutedTransitions_Select_Column {
  /** column name */
  BroadcastContentId = 'broadcastContentId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  Time = 'time',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "ExecutedTransitions" */
export type ExecutedTransitions_Set_Input = {
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "ExecutedTransitions" */
export enum ExecutedTransitions_Update_Column {
  /** column name */
  BroadcastContentId = 'broadcastContentId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EventId = 'eventId',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  Time = 'time',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "FlaggedChatMessage" */
export type FlaggedChatMessage = {
  readonly __typename?: 'FlaggedChatMessage';
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly flaggedBy: User;
  readonly flaggedById: Scalars['String'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly message: ChatMessage;
  readonly messageId: Scalars['uuid'];
  /** An object relationship */
  readonly moderationChat?: Maybe<Chat>;
  readonly moderationChatId?: Maybe<Scalars['uuid']>;
  readonly notes?: Maybe<Scalars['String']>;
  readonly resolutionAction?: Maybe<Scalars['String']>;
  readonly resolvedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregated selection of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate = {
  readonly __typename?: 'FlaggedChatMessage_aggregate';
  readonly aggregate?: Maybe<FlaggedChatMessage_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<FlaggedChatMessage>;
};

/** aggregate fields of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_Fields = {
  readonly __typename?: 'FlaggedChatMessage_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<FlaggedChatMessage_Max_Fields>;
  readonly min?: Maybe<FlaggedChatMessage_Min_Fields>;
};


/** aggregate fields of "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<FlaggedChatMessage_Max_Order_By>;
  readonly min?: Maybe<FlaggedChatMessage_Min_Order_By>;
};

/** input type for inserting array relation for remote table "FlaggedChatMessage" */
export type FlaggedChatMessage_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<FlaggedChatMessage_Insert_Input>;
  readonly on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** Boolean expression to filter rows from the table "FlaggedChatMessage". All fields are combined with a logical 'AND'. */
export type FlaggedChatMessage_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<FlaggedChatMessage_Bool_Exp>>>;
  readonly _not?: Maybe<FlaggedChatMessage_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<FlaggedChatMessage_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly flaggedBy?: Maybe<User_Bool_Exp>;
  readonly flaggedById?: Maybe<String_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly message?: Maybe<ChatMessage_Bool_Exp>;
  readonly messageId?: Maybe<Uuid_Comparison_Exp>;
  readonly moderationChat?: Maybe<Chat_Bool_Exp>;
  readonly moderationChatId?: Maybe<Uuid_Comparison_Exp>;
  readonly notes?: Maybe<String_Comparison_Exp>;
  readonly resolutionAction?: Maybe<String_Comparison_Exp>;
  readonly resolvedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Constraint {
  /** unique or primary key constraint */
  FlaggedChatMessageMessageIdFlaggedByIdKey = 'FlaggedChatMessage_messageId_flaggedById_key',
  /** unique or primary key constraint */
  FlaggedChatMessagePkey = 'FlaggedChatMessage_pkey'
}

/** input type for inserting data into table "FlaggedChatMessage" */
export type FlaggedChatMessage_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly flaggedBy?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly flaggedById?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly message?: Maybe<ChatMessage_Obj_Rel_Insert_Input>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly moderationChat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly moderationChatId?: Maybe<Scalars['uuid']>;
  readonly notes?: Maybe<Scalars['String']>;
  readonly resolutionAction?: Maybe<Scalars['String']>;
  readonly resolvedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type FlaggedChatMessage_Max_Fields = {
  readonly __typename?: 'FlaggedChatMessage_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly flaggedById?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly moderationChatId?: Maybe<Scalars['uuid']>;
  readonly notes?: Maybe<Scalars['String']>;
  readonly resolutionAction?: Maybe<Scalars['String']>;
  readonly resolvedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly flaggedById?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly moderationChatId?: Maybe<Order_By>;
  readonly notes?: Maybe<Order_By>;
  readonly resolutionAction?: Maybe<Order_By>;
  readonly resolvedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type FlaggedChatMessage_Min_Fields = {
  readonly __typename?: 'FlaggedChatMessage_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly flaggedById?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly moderationChatId?: Maybe<Scalars['uuid']>;
  readonly notes?: Maybe<Scalars['String']>;
  readonly resolutionAction?: Maybe<Scalars['String']>;
  readonly resolvedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "FlaggedChatMessage" */
export type FlaggedChatMessage_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly flaggedById?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly moderationChatId?: Maybe<Order_By>;
  readonly notes?: Maybe<Order_By>;
  readonly resolutionAction?: Maybe<Order_By>;
  readonly resolvedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "FlaggedChatMessage" */
export type FlaggedChatMessage_Mutation_Response = {
  readonly __typename?: 'FlaggedChatMessage_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<FlaggedChatMessage>;
};

/** input type for inserting object relation for remote table "FlaggedChatMessage" */
export type FlaggedChatMessage_Obj_Rel_Insert_Input = {
  readonly data: FlaggedChatMessage_Insert_Input;
  readonly on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};

/** on conflict condition type for table "FlaggedChatMessage" */
export type FlaggedChatMessage_On_Conflict = {
  readonly constraint: FlaggedChatMessage_Constraint;
  readonly update_columns: ReadonlyArray<FlaggedChatMessage_Update_Column>;
  readonly where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};

/** ordering options when selecting data from "FlaggedChatMessage" */
export type FlaggedChatMessage_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly flaggedBy?: Maybe<User_Order_By>;
  readonly flaggedById?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly message?: Maybe<ChatMessage_Order_By>;
  readonly messageId?: Maybe<Order_By>;
  readonly moderationChat?: Maybe<Chat_Order_By>;
  readonly moderationChatId?: Maybe<Order_By>;
  readonly notes?: Maybe<Order_By>;
  readonly resolutionAction?: Maybe<Order_By>;
  readonly resolvedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "FlaggedChatMessage" */
export type FlaggedChatMessage_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  FlaggedById = 'flaggedById',
  /** column name */
  Id = 'id',
  /** column name */
  MessageId = 'messageId',
  /** column name */
  ModerationChatId = 'moderationChatId',
  /** column name */
  Notes = 'notes',
  /** column name */
  ResolutionAction = 'resolutionAction',
  /** column name */
  ResolvedAt = 'resolvedAt'
}

/** input type for updating data in table "FlaggedChatMessage" */
export type FlaggedChatMessage_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly flaggedById?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly messageId?: Maybe<Scalars['uuid']>;
  readonly moderationChatId?: Maybe<Scalars['uuid']>;
  readonly notes?: Maybe<Scalars['String']>;
  readonly resolutionAction?: Maybe<Scalars['String']>;
  readonly resolvedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "FlaggedChatMessage" */
export enum FlaggedChatMessage_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  FlaggedById = 'flaggedById',
  /** column name */
  Id = 'id',
  /** column name */
  MessageId = 'messageId',
  /** column name */
  ModerationChatId = 'moderationChatId',
  /** column name */
  Notes = 'notes',
  /** column name */
  ResolutionAction = 'resolutionAction',
  /** column name */
  ResolvedAt = 'resolvedAt'
}

/** columns and relationships of "FollowedChat" */
export type FollowedChat = {
  readonly __typename?: 'FollowedChat';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly manual: Scalars['Boolean'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "FollowedChat" */
export type FollowedChat_Aggregate = {
  readonly __typename?: 'FollowedChat_aggregate';
  readonly aggregate?: Maybe<FollowedChat_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<FollowedChat>;
};

/** aggregate fields of "FollowedChat" */
export type FollowedChat_Aggregate_Fields = {
  readonly __typename?: 'FollowedChat_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<FollowedChat_Max_Fields>;
  readonly min?: Maybe<FollowedChat_Min_Fields>;
};


/** aggregate fields of "FollowedChat" */
export type FollowedChat_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "FollowedChat" */
export type FollowedChat_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<FollowedChat_Max_Order_By>;
  readonly min?: Maybe<FollowedChat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "FollowedChat" */
export type FollowedChat_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<FollowedChat_Insert_Input>;
  readonly on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "FollowedChat". All fields are combined with a logical 'AND'. */
export type FollowedChat_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<FollowedChat_Bool_Exp>>>;
  readonly _not?: Maybe<FollowedChat_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<FollowedChat_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly manual?: Maybe<Boolean_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "FollowedChat" */
export enum FollowedChat_Constraint {
  /** unique or primary key constraint */
  FollowedChatChatIdUserIdKey = 'FollowedChat_chatId_userId_key',
  /** unique or primary key constraint */
  FollowedChatPkey = 'FollowedChat_pkey'
}

/** input type for inserting data into table "FollowedChat" */
export type FollowedChat_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly manual?: Maybe<Scalars['Boolean']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type FollowedChat_Max_Fields = {
  readonly __typename?: 'FollowedChat_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "FollowedChat" */
export type FollowedChat_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type FollowedChat_Min_Fields = {
  readonly __typename?: 'FollowedChat_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "FollowedChat" */
export type FollowedChat_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "FollowedChat" */
export type FollowedChat_Mutation_Response = {
  readonly __typename?: 'FollowedChat_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<FollowedChat>;
};

/** input type for inserting object relation for remote table "FollowedChat" */
export type FollowedChat_Obj_Rel_Insert_Input = {
  readonly data: FollowedChat_Insert_Input;
  readonly on_conflict?: Maybe<FollowedChat_On_Conflict>;
};

/** on conflict condition type for table "FollowedChat" */
export type FollowedChat_On_Conflict = {
  readonly constraint: FollowedChat_Constraint;
  readonly update_columns: ReadonlyArray<FollowedChat_Update_Column>;
  readonly where?: Maybe<FollowedChat_Bool_Exp>;
};

/** ordering options when selecting data from "FollowedChat" */
export type FollowedChat_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly manual?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "FollowedChat" */
export type FollowedChat_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "FollowedChat" */
export enum FollowedChat_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Manual = 'manual',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "FollowedChat" */
export type FollowedChat_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly manual?: Maybe<Scalars['Boolean']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "FollowedChat" */
export enum FollowedChat_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Manual = 'manual',
  /** column name */
  UserId = 'userId'
}

export type GetContentItemOutput = {
  readonly __typename?: 'GetContentItemOutput';
  readonly contentTypeName: Scalars['String'];
  readonly data: Scalars['jsonb'];
  readonly id: Scalars['String'];
  readonly layoutData?: Maybe<Scalars['jsonb']>;
  readonly name: Scalars['String'];
};

/** columns and relationships of "Group" */
export type Group = {
  readonly __typename?: 'Group';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly enabled: Scalars['Boolean'];
  /** An array relationship */
  readonly groupAttendees: ReadonlyArray<GroupAttendee>;
  /** An aggregated array relationship */
  readonly groupAttendees_aggregate: GroupAttendee_Aggregate;
  /** An array relationship */
  readonly groupRoles: ReadonlyArray<GroupRole>;
  /** An aggregated array relationship */
  readonly groupRoles_aggregate: GroupRole_Aggregate;
  readonly id: Scalars['uuid'];
  readonly includeUnauthenticated: Scalars['Boolean'];
  readonly name: Scalars['String'];
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Group" */
export type GroupGroupAttendeesArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** columns and relationships of "Group" */
export type GroupGroupAttendees_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** columns and relationships of "Group" */
export type GroupGroupRolesArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** columns and relationships of "Group" */
export type GroupGroupRoles_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};

/** columns and relationships of "GroupAttendee" */
export type GroupAttendee = {
  readonly __typename?: 'GroupAttendee';
  /** An object relationship */
  readonly attendee: Attendee;
  readonly attendeeId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly group: Group;
  readonly groupId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "GroupAttendee" */
export type GroupAttendee_Aggregate = {
  readonly __typename?: 'GroupAttendee_aggregate';
  readonly aggregate?: Maybe<GroupAttendee_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<GroupAttendee>;
};

/** aggregate fields of "GroupAttendee" */
export type GroupAttendee_Aggregate_Fields = {
  readonly __typename?: 'GroupAttendee_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<GroupAttendee_Max_Fields>;
  readonly min?: Maybe<GroupAttendee_Min_Fields>;
};


/** aggregate fields of "GroupAttendee" */
export type GroupAttendee_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "GroupAttendee" */
export type GroupAttendee_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<GroupAttendee_Max_Order_By>;
  readonly min?: Maybe<GroupAttendee_Min_Order_By>;
};

/** input type for inserting array relation for remote table "GroupAttendee" */
export type GroupAttendee_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<GroupAttendee_Insert_Input>;
  readonly on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** Boolean expression to filter rows from the table "GroupAttendee". All fields are combined with a logical 'AND'. */
export type GroupAttendee_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<GroupAttendee_Bool_Exp>>>;
  readonly _not?: Maybe<GroupAttendee_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<GroupAttendee_Bool_Exp>>>;
  readonly attendee?: Maybe<Attendee_Bool_Exp>;
  readonly attendeeId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly group?: Maybe<Group_Bool_Exp>;
  readonly groupId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "GroupAttendee" */
export enum GroupAttendee_Constraint {
  /** unique or primary key constraint */
  GroupAttendeeGroupIdAttendeeIdKey = 'GroupAttendee_groupId_attendeeId_key',
  /** unique or primary key constraint */
  GroupAttendeePkey = 'GroupAttendee_pkey'
}

/** input type for inserting data into table "GroupAttendee" */
export type GroupAttendee_Insert_Input = {
  readonly attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly group?: Maybe<Group_Obj_Rel_Insert_Input>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type GroupAttendee_Max_Fields = {
  readonly __typename?: 'GroupAttendee_max_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "GroupAttendee" */
export type GroupAttendee_Max_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type GroupAttendee_Min_Fields = {
  readonly __typename?: 'GroupAttendee_min_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "GroupAttendee" */
export type GroupAttendee_Min_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "GroupAttendee" */
export type GroupAttendee_Mutation_Response = {
  readonly __typename?: 'GroupAttendee_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<GroupAttendee>;
};

/** input type for inserting object relation for remote table "GroupAttendee" */
export type GroupAttendee_Obj_Rel_Insert_Input = {
  readonly data: GroupAttendee_Insert_Input;
  readonly on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};

/** on conflict condition type for table "GroupAttendee" */
export type GroupAttendee_On_Conflict = {
  readonly constraint: GroupAttendee_Constraint;
  readonly update_columns: ReadonlyArray<GroupAttendee_Update_Column>;
  readonly where?: Maybe<GroupAttendee_Bool_Exp>;
};

/** ordering options when selecting data from "GroupAttendee" */
export type GroupAttendee_Order_By = {
  readonly attendee?: Maybe<Attendee_Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly group?: Maybe<Group_Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "GroupAttendee" */
export type GroupAttendee_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "GroupAttendee" */
export enum GroupAttendee_Select_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  GroupId = 'groupId',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "GroupAttendee" */
export type GroupAttendee_Set_Input = {
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "GroupAttendee" */
export enum GroupAttendee_Update_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  GroupId = 'groupId',
  /** column name */
  Id = 'id',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "GroupRole" */
export type GroupRole = {
  readonly __typename?: 'GroupRole';
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly group: Group;
  readonly groupId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly role: Role;
  readonly roleId: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "GroupRole" */
export type GroupRole_Aggregate = {
  readonly __typename?: 'GroupRole_aggregate';
  readonly aggregate?: Maybe<GroupRole_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<GroupRole>;
};

/** aggregate fields of "GroupRole" */
export type GroupRole_Aggregate_Fields = {
  readonly __typename?: 'GroupRole_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<GroupRole_Max_Fields>;
  readonly min?: Maybe<GroupRole_Min_Fields>;
};


/** aggregate fields of "GroupRole" */
export type GroupRole_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "GroupRole" */
export type GroupRole_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<GroupRole_Max_Order_By>;
  readonly min?: Maybe<GroupRole_Min_Order_By>;
};

/** input type for inserting array relation for remote table "GroupRole" */
export type GroupRole_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<GroupRole_Insert_Input>;
  readonly on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** Boolean expression to filter rows from the table "GroupRole". All fields are combined with a logical 'AND'. */
export type GroupRole_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<GroupRole_Bool_Exp>>>;
  readonly _not?: Maybe<GroupRole_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<GroupRole_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly group?: Maybe<Group_Bool_Exp>;
  readonly groupId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly role?: Maybe<Role_Bool_Exp>;
  readonly roleId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "GroupRole" */
export enum GroupRole_Constraint {
  /** unique or primary key constraint */
  GroupRoleGroupIdRoleIdKey = 'GroupRole_groupId_roleId_key',
  /** unique or primary key constraint */
  GroupRolePkey = 'GroupRole_pkey'
}

/** input type for inserting data into table "GroupRole" */
export type GroupRole_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly group?: Maybe<Group_Obj_Rel_Insert_Input>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly role?: Maybe<Role_Obj_Rel_Insert_Input>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type GroupRole_Max_Fields = {
  readonly __typename?: 'GroupRole_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "GroupRole" */
export type GroupRole_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type GroupRole_Min_Fields = {
  readonly __typename?: 'GroupRole_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "GroupRole" */
export type GroupRole_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "GroupRole" */
export type GroupRole_Mutation_Response = {
  readonly __typename?: 'GroupRole_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<GroupRole>;
};

/** input type for inserting object relation for remote table "GroupRole" */
export type GroupRole_Obj_Rel_Insert_Input = {
  readonly data: GroupRole_Insert_Input;
  readonly on_conflict?: Maybe<GroupRole_On_Conflict>;
};

/** on conflict condition type for table "GroupRole" */
export type GroupRole_On_Conflict = {
  readonly constraint: GroupRole_Constraint;
  readonly update_columns: ReadonlyArray<GroupRole_Update_Column>;
  readonly where?: Maybe<GroupRole_Bool_Exp>;
};

/** ordering options when selecting data from "GroupRole" */
export type GroupRole_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly group?: Maybe<Group_Order_By>;
  readonly groupId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly role?: Maybe<Role_Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "GroupRole" */
export type GroupRole_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "GroupRole" */
export enum GroupRole_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  GroupId = 'groupId',
  /** column name */
  Id = 'id',
  /** column name */
  RoleId = 'roleId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "GroupRole" */
export type GroupRole_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "GroupRole" */
export enum GroupRole_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  GroupId = 'groupId',
  /** column name */
  Id = 'id',
  /** column name */
  RoleId = 'roleId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregated selection of "Group" */
export type Group_Aggregate = {
  readonly __typename?: 'Group_aggregate';
  readonly aggregate?: Maybe<Group_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Group>;
};

/** aggregate fields of "Group" */
export type Group_Aggregate_Fields = {
  readonly __typename?: 'Group_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Group_Max_Fields>;
  readonly min?: Maybe<Group_Min_Fields>;
};


/** aggregate fields of "Group" */
export type Group_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Group_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Group" */
export type Group_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Group_Max_Order_By>;
  readonly min?: Maybe<Group_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Group" */
export type Group_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Group_Insert_Input>;
  readonly on_conflict?: Maybe<Group_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Group". All fields are combined with a logical 'AND'. */
export type Group_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Group_Bool_Exp>>>;
  readonly _not?: Maybe<Group_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Group_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly enabled?: Maybe<Boolean_Comparison_Exp>;
  readonly groupAttendees?: Maybe<GroupAttendee_Bool_Exp>;
  readonly groupRoles?: Maybe<GroupRole_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly includeUnauthenticated?: Maybe<Boolean_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Group" */
export enum Group_Constraint {
  /** unique or primary key constraint */
  GroupConferenceIdNameKey = 'Group_conferenceId_name_key',
  /** unique or primary key constraint */
  GroupPkey = 'Group_pkey'
}

/** input type for inserting data into table "Group" */
export type Group_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly enabled?: Maybe<Scalars['Boolean']>;
  readonly groupAttendees?: Maybe<GroupAttendee_Arr_Rel_Insert_Input>;
  readonly groupRoles?: Maybe<GroupRole_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly includeUnauthenticated?: Maybe<Scalars['Boolean']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Group_Max_Fields = {
  readonly __typename?: 'Group_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Group" */
export type Group_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Group_Min_Fields = {
  readonly __typename?: 'Group_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Group" */
export type Group_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Group" */
export type Group_Mutation_Response = {
  readonly __typename?: 'Group_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Group>;
};

/** input type for inserting object relation for remote table "Group" */
export type Group_Obj_Rel_Insert_Input = {
  readonly data: Group_Insert_Input;
  readonly on_conflict?: Maybe<Group_On_Conflict>;
};

/** on conflict condition type for table "Group" */
export type Group_On_Conflict = {
  readonly constraint: Group_Constraint;
  readonly update_columns: ReadonlyArray<Group_Update_Column>;
  readonly where?: Maybe<Group_Bool_Exp>;
};

/** ordering options when selecting data from "Group" */
export type Group_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly enabled?: Maybe<Order_By>;
  readonly groupAttendees_aggregate?: Maybe<GroupAttendee_Aggregate_Order_By>;
  readonly groupRoles_aggregate?: Maybe<GroupRole_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly includeUnauthenticated?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Group" */
export type Group_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Group" */
export enum Group_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Enabled = 'enabled',
  /** column name */
  Id = 'id',
  /** column name */
  IncludeUnauthenticated = 'includeUnauthenticated',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Group" */
export type Group_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly enabled?: Maybe<Scalars['Boolean']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly includeUnauthenticated?: Maybe<Scalars['Boolean']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Group" */
export enum Group_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Enabled = 'enabled',
  /** column name */
  Id = 'id',
  /** column name */
  IncludeUnauthenticated = 'includeUnauthenticated',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "InputType" */
export type InputType = {
  readonly __typename?: 'InputType';
  /** An array relationship */
  readonly broadcastContentItems: ReadonlyArray<BroadcastContentItem>;
  /** An aggregated array relationship */
  readonly broadcastContentItems_aggregate: BroadcastContentItem_Aggregate;
  readonly description: Scalars['String'];
  readonly name: Scalars['String'];
};


/** columns and relationships of "InputType" */
export type InputTypeBroadcastContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};


/** columns and relationships of "InputType" */
export type InputTypeBroadcastContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};

/** aggregated selection of "InputType" */
export type InputType_Aggregate = {
  readonly __typename?: 'InputType_aggregate';
  readonly aggregate?: Maybe<InputType_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<InputType>;
};

/** aggregate fields of "InputType" */
export type InputType_Aggregate_Fields = {
  readonly __typename?: 'InputType_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<InputType_Max_Fields>;
  readonly min?: Maybe<InputType_Min_Fields>;
};


/** aggregate fields of "InputType" */
export type InputType_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<InputType_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "InputType" */
export type InputType_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<InputType_Max_Order_By>;
  readonly min?: Maybe<InputType_Min_Order_By>;
};

/** input type for inserting array relation for remote table "InputType" */
export type InputType_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<InputType_Insert_Input>;
  readonly on_conflict?: Maybe<InputType_On_Conflict>;
};

/** Boolean expression to filter rows from the table "InputType". All fields are combined with a logical 'AND'. */
export type InputType_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<InputType_Bool_Exp>>>;
  readonly _not?: Maybe<InputType_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<InputType_Bool_Exp>>>;
  readonly broadcastContentItems?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "InputType" */
export enum InputType_Constraint {
  /** unique or primary key constraint */
  InputTypeNamePkey = 'InputTypeName_pkey'
}

export enum InputType_Enum {
  /** GIF image. */
  Gif = 'GIF',
  /** JPEG image (jay-peg). */
  Jpeg = 'JPEG',
  /** MP4 video file. */
  Mp4 = 'MP4',
  /** PNG image. */
  Png = 'PNG',
  /** RTMP stream in push mode. */
  RtmpPush = 'RTMP_PUSH'
}

/** expression to compare columns of type InputType_enum. All fields are combined with logical 'AND'. */
export type InputType_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<InputType_Enum>;
  readonly _in?: Maybe<ReadonlyArray<InputType_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<InputType_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<InputType_Enum>>;
};

/** input type for inserting data into table "InputType" */
export type InputType_Insert_Input = {
  readonly broadcastContentItems?: Maybe<BroadcastContentItem_Arr_Rel_Insert_Input>;
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type InputType_Max_Fields = {
  readonly __typename?: 'InputType_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "InputType" */
export type InputType_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type InputType_Min_Fields = {
  readonly __typename?: 'InputType_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "InputType" */
export type InputType_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "InputType" */
export type InputType_Mutation_Response = {
  readonly __typename?: 'InputType_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<InputType>;
};

/** input type for inserting object relation for remote table "InputType" */
export type InputType_Obj_Rel_Insert_Input = {
  readonly data: InputType_Insert_Input;
  readonly on_conflict?: Maybe<InputType_On_Conflict>;
};

/** on conflict condition type for table "InputType" */
export type InputType_On_Conflict = {
  readonly constraint: InputType_Constraint;
  readonly update_columns: ReadonlyArray<InputType_Update_Column>;
  readonly where?: Maybe<InputType_Bool_Exp>;
};

/** ordering options when selecting data from "InputType" */
export type InputType_Order_By = {
  readonly broadcastContentItems_aggregate?: Maybe<BroadcastContentItem_Aggregate_Order_By>;
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** primary key columns input for table: "InputType" */
export type InputType_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "InputType" */
export enum InputType_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "InputType" */
export type InputType_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "InputType" */
export enum InputType_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** expression to compare columns of type Int. All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['Int']>;
  readonly _gt?: Maybe<Scalars['Int']>;
  readonly _gte?: Maybe<Scalars['Int']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['Int']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['Int']>;
  readonly _lte?: Maybe<Scalars['Int']>;
  readonly _neq?: Maybe<Scalars['Int']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['Int']>>;
};

/** columns and relationships of "Invitation" */
export type Invitation = {
  readonly __typename?: 'Invitation';
  /** An object relationship */
  readonly attendee: Attendee;
  readonly attendeeId: Scalars['uuid'];
  readonly confirmationCode?: Maybe<Scalars['uuid']>;
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly emails: ReadonlyArray<Email>;
  /** An aggregated array relationship */
  readonly emails_aggregate: Email_Aggregate;
  /** A computed field, executes function "invitationhash" */
  readonly hash?: Maybe<Scalars['String']>;
  readonly id: Scalars['uuid'];
  readonly inviteCode: Scalars['uuid'];
  readonly invitedEmailAddress: Scalars['String'];
  readonly linkToUserId?: Maybe<Scalars['String']>;
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user?: Maybe<User>;
};


/** columns and relationships of "Invitation" */
export type InvitationEmailsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** columns and relationships of "Invitation" */
export type InvitationEmails_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};

export type InvitationConfirmationEmailInput = {
  readonly inviteCode: Scalars['uuid'];
};

export type InvitationConfirmationEmailOutput = {
  readonly __typename?: 'InvitationConfirmationEmailOutput';
  readonly sent: Scalars['Boolean'];
};

export type InvitationSendEmailResult = {
  readonly __typename?: 'InvitationSendEmailResult';
  readonly attendeeId: Scalars['String'];
  readonly sent: Scalars['Boolean'];
};

/** aggregated selection of "Invitation" */
export type Invitation_Aggregate = {
  readonly __typename?: 'Invitation_aggregate';
  readonly aggregate?: Maybe<Invitation_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Invitation>;
};

/** aggregate fields of "Invitation" */
export type Invitation_Aggregate_Fields = {
  readonly __typename?: 'Invitation_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Invitation_Max_Fields>;
  readonly min?: Maybe<Invitation_Min_Fields>;
};


/** aggregate fields of "Invitation" */
export type Invitation_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Invitation" */
export type Invitation_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Invitation_Max_Order_By>;
  readonly min?: Maybe<Invitation_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Invitation" */
export type Invitation_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Invitation_Insert_Input>;
  readonly on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Invitation". All fields are combined with a logical 'AND'. */
export type Invitation_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Invitation_Bool_Exp>>>;
  readonly _not?: Maybe<Invitation_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Invitation_Bool_Exp>>>;
  readonly attendee?: Maybe<Attendee_Bool_Exp>;
  readonly attendeeId?: Maybe<Uuid_Comparison_Exp>;
  readonly confirmationCode?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly emails?: Maybe<Email_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly inviteCode?: Maybe<Uuid_Comparison_Exp>;
  readonly invitedEmailAddress?: Maybe<String_Comparison_Exp>;
  readonly linkToUserId?: Maybe<String_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
};

/** unique or primary key constraints on table "Invitation" */
export enum Invitation_Constraint {
  /** unique or primary key constraint */
  InivitationAttendeeIdKey = 'Inivitation_attendeeId_key',
  /** unique or primary key constraint */
  InivitationConfirmationCodeKey = 'Inivitation_confirmationCode_key',
  /** unique or primary key constraint */
  InivitationInviteCodeKey = 'Inivitation_inviteCode_key',
  /** unique or primary key constraint */
  InivitationPkey = 'Inivitation_pkey'
}

/** input type for inserting data into table "Invitation" */
export type Invitation_Insert_Input = {
  readonly attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly confirmationCode?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly emails?: Maybe<Email_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly inviteCode?: Maybe<Scalars['uuid']>;
  readonly invitedEmailAddress?: Maybe<Scalars['String']>;
  readonly linkToUserId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Invitation_Max_Fields = {
  readonly __typename?: 'Invitation_max_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly confirmationCode?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly inviteCode?: Maybe<Scalars['uuid']>;
  readonly invitedEmailAddress?: Maybe<Scalars['String']>;
  readonly linkToUserId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Invitation" */
export type Invitation_Max_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly confirmationCode?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly inviteCode?: Maybe<Order_By>;
  readonly invitedEmailAddress?: Maybe<Order_By>;
  readonly linkToUserId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Invitation_Min_Fields = {
  readonly __typename?: 'Invitation_min_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly confirmationCode?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly inviteCode?: Maybe<Scalars['uuid']>;
  readonly invitedEmailAddress?: Maybe<Scalars['String']>;
  readonly linkToUserId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Invitation" */
export type Invitation_Min_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly confirmationCode?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly inviteCode?: Maybe<Order_By>;
  readonly invitedEmailAddress?: Maybe<Order_By>;
  readonly linkToUserId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Invitation" */
export type Invitation_Mutation_Response = {
  readonly __typename?: 'Invitation_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Invitation>;
};

/** input type for inserting object relation for remote table "Invitation" */
export type Invitation_Obj_Rel_Insert_Input = {
  readonly data: Invitation_Insert_Input;
  readonly on_conflict?: Maybe<Invitation_On_Conflict>;
};

/** on conflict condition type for table "Invitation" */
export type Invitation_On_Conflict = {
  readonly constraint: Invitation_Constraint;
  readonly update_columns: ReadonlyArray<Invitation_Update_Column>;
  readonly where?: Maybe<Invitation_Bool_Exp>;
};

/** ordering options when selecting data from "Invitation" */
export type Invitation_Order_By = {
  readonly attendee?: Maybe<Attendee_Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly confirmationCode?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly emails_aggregate?: Maybe<Email_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly inviteCode?: Maybe<Order_By>;
  readonly invitedEmailAddress?: Maybe<Order_By>;
  readonly linkToUserId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
};

/** primary key columns input for table: "Invitation" */
export type Invitation_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Invitation" */
export enum Invitation_Select_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConfirmationCode = 'confirmationCode',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  InviteCode = 'inviteCode',
  /** column name */
  InvitedEmailAddress = 'invitedEmailAddress',
  /** column name */
  LinkToUserId = 'linkToUserId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Invitation" */
export type Invitation_Set_Input = {
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly confirmationCode?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly inviteCode?: Maybe<Scalars['uuid']>;
  readonly invitedEmailAddress?: Maybe<Scalars['String']>;
  readonly linkToUserId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Invitation" */
export enum Invitation_Update_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConfirmationCode = 'confirmationCode',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  InviteCode = 'inviteCode',
  /** column name */
  InvitedEmailAddress = 'invitedEmailAddress',
  /** column name */
  LinkToUserId = 'linkToUserId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "OnlineStatus" */
export type OnlineStatus = {
  readonly __typename?: 'OnlineStatus';
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  readonly isIncognito: Scalars['Boolean'];
  readonly lastSeen: Scalars['timestamptz'];
  readonly updatedAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "OnlineStatus" */
export type OnlineStatus_Aggregate = {
  readonly __typename?: 'OnlineStatus_aggregate';
  readonly aggregate?: Maybe<OnlineStatus_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<OnlineStatus>;
};

/** aggregate fields of "OnlineStatus" */
export type OnlineStatus_Aggregate_Fields = {
  readonly __typename?: 'OnlineStatus_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<OnlineStatus_Max_Fields>;
  readonly min?: Maybe<OnlineStatus_Min_Fields>;
};


/** aggregate fields of "OnlineStatus" */
export type OnlineStatus_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<OnlineStatus_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "OnlineStatus" */
export type OnlineStatus_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<OnlineStatus_Max_Order_By>;
  readonly min?: Maybe<OnlineStatus_Min_Order_By>;
};

/** input type for inserting array relation for remote table "OnlineStatus" */
export type OnlineStatus_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<OnlineStatus_Insert_Input>;
  readonly on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** Boolean expression to filter rows from the table "OnlineStatus". All fields are combined with a logical 'AND'. */
export type OnlineStatus_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<OnlineStatus_Bool_Exp>>>;
  readonly _not?: Maybe<OnlineStatus_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<OnlineStatus_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly isIncognito?: Maybe<Boolean_Comparison_Exp>;
  readonly lastSeen?: Maybe<Timestamptz_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "OnlineStatus" */
export enum OnlineStatus_Constraint {
  /** unique or primary key constraint */
  OnlineStatusPkey = 'OnlineStatus_pkey',
  /** unique or primary key constraint */
  OnlineStatusUserIdKey = 'OnlineStatus_userId_key'
}

/** input type for inserting data into table "OnlineStatus" */
export type OnlineStatus_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isIncognito?: Maybe<Scalars['Boolean']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type OnlineStatus_Max_Fields = {
  readonly __typename?: 'OnlineStatus_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "OnlineStatus" */
export type OnlineStatus_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type OnlineStatus_Min_Fields = {
  readonly __typename?: 'OnlineStatus_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "OnlineStatus" */
export type OnlineStatus_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "OnlineStatus" */
export type OnlineStatus_Mutation_Response = {
  readonly __typename?: 'OnlineStatus_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<OnlineStatus>;
};

/** input type for inserting object relation for remote table "OnlineStatus" */
export type OnlineStatus_Obj_Rel_Insert_Input = {
  readonly data: OnlineStatus_Insert_Input;
  readonly on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};

/** on conflict condition type for table "OnlineStatus" */
export type OnlineStatus_On_Conflict = {
  readonly constraint: OnlineStatus_Constraint;
  readonly update_columns: ReadonlyArray<OnlineStatus_Update_Column>;
  readonly where?: Maybe<OnlineStatus_Bool_Exp>;
};

/** ordering options when selecting data from "OnlineStatus" */
export type OnlineStatus_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly isIncognito?: Maybe<Order_By>;
  readonly lastSeen?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "OnlineStatus" */
export type OnlineStatus_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "OnlineStatus" */
export enum OnlineStatus_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  IsIncognito = 'isIncognito',
  /** column name */
  LastSeen = 'lastSeen',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "OnlineStatus" */
export type OnlineStatus_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly isIncognito?: Maybe<Scalars['Boolean']>;
  readonly lastSeen?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "OnlineStatus" */
export enum OnlineStatus_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  IsIncognito = 'isIncognito',
  /** column name */
  LastSeen = 'lastSeen',
  /** column name */
  UpdatedAt = 'updatedAt',
  /** column name */
  UserId = 'userId'
}

/** columns and relationships of "OriginatingData" */
export type OriginatingData = {
  readonly __typename?: 'OriginatingData';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An array relationship */
  readonly contentGroups: ReadonlyArray<ContentGroup>;
  /** An aggregated array relationship */
  readonly contentGroups_aggregate: ContentGroup_Aggregate;
  /** An array relationship */
  readonly contentItems: ReadonlyArray<ContentItem>;
  /** An aggregated array relationship */
  readonly contentItems_aggregate: ContentItem_Aggregate;
  /** An array relationship */
  readonly contentPeople: ReadonlyArray<ContentPerson>;
  /** An aggregated array relationship */
  readonly contentPeople_aggregate: ContentPerson_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  readonly data?: Maybe<Scalars['jsonb']>;
  /** An array relationship */
  readonly eventPeople: ReadonlyArray<EventPerson>;
  /** An aggregated array relationship */
  readonly eventPeople_aggregate: EventPerson_Aggregate;
  /** An array relationship */
  readonly events: ReadonlyArray<Event>;
  /** An aggregated array relationship */
  readonly events_aggregate: Event_Aggregate;
  readonly id: Scalars['uuid'];
  /** An array relationship */
  readonly requiredContentItems: ReadonlyArray<RequiredContentItem>;
  /** An aggregated array relationship */
  readonly requiredContentItems_aggregate: RequiredContentItem_Aggregate;
  /** An array relationship */
  readonly rooms: ReadonlyArray<Room>;
  /** An aggregated array relationship */
  readonly rooms_aggregate: Room_Aggregate;
  readonly sourceId: Scalars['String'];
  /** An array relationship */
  readonly tags: ReadonlyArray<Tag>;
  /** An aggregated array relationship */
  readonly tags_aggregate: Tag_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentGroupsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentGroups_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataContentPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataDataArgs = {
  path?: Maybe<Scalars['String']>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventPeopleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventPeople_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataEventsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataEvents_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataRequiredContentItemsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataRequiredContentItems_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataRoomsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataRooms_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataTagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};


/** columns and relationships of "OriginatingData" */
export type OriginatingDataTags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};

/** aggregated selection of "OriginatingData" */
export type OriginatingData_Aggregate = {
  readonly __typename?: 'OriginatingData_aggregate';
  readonly aggregate?: Maybe<OriginatingData_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<OriginatingData>;
};

/** aggregate fields of "OriginatingData" */
export type OriginatingData_Aggregate_Fields = {
  readonly __typename?: 'OriginatingData_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<OriginatingData_Max_Fields>;
  readonly min?: Maybe<OriginatingData_Min_Fields>;
};


/** aggregate fields of "OriginatingData" */
export type OriginatingData_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "OriginatingData" */
export type OriginatingData_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<OriginatingData_Max_Order_By>;
  readonly min?: Maybe<OriginatingData_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type OriginatingData_Append_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
};

/** input type for inserting array relation for remote table "OriginatingData" */
export type OriginatingData_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<OriginatingData_Insert_Input>;
  readonly on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** Boolean expression to filter rows from the table "OriginatingData". All fields are combined with a logical 'AND'. */
export type OriginatingData_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<OriginatingData_Bool_Exp>>>;
  readonly _not?: Maybe<OriginatingData_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<OriginatingData_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentGroups?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentItems?: Maybe<ContentItem_Bool_Exp>;
  readonly contentPeople?: Maybe<ContentPerson_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly data?: Maybe<Jsonb_Comparison_Exp>;
  readonly eventPeople?: Maybe<EventPerson_Bool_Exp>;
  readonly events?: Maybe<Event_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Bool_Exp>;
  readonly rooms?: Maybe<Room_Bool_Exp>;
  readonly sourceId?: Maybe<String_Comparison_Exp>;
  readonly tags?: Maybe<Tag_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "OriginatingData" */
export enum OriginatingData_Constraint {
  /** unique or primary key constraint */
  OriginatingDataPkey = 'OriginatingData_pkey',
  /** unique or primary key constraint */
  OriginatingDataSourceIdConferenceIdKey = 'OriginatingData_sourceId_conferenceId_key'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type OriginatingData_Delete_At_Path_Input = {
  readonly data?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type OriginatingData_Delete_Elem_Input = {
  readonly data?: Maybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type OriginatingData_Delete_Key_Input = {
  readonly data?: Maybe<Scalars['String']>;
};

/** input type for inserting data into table "OriginatingData" */
export type OriginatingData_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroups?: Maybe<ContentGroup_Arr_Rel_Insert_Input>;
  readonly contentItems?: Maybe<ContentItem_Arr_Rel_Insert_Input>;
  readonly contentPeople?: Maybe<ContentPerson_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly eventPeople?: Maybe<EventPerson_Arr_Rel_Insert_Input>;
  readonly events?: Maybe<Event_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly requiredContentItems?: Maybe<RequiredContentItem_Arr_Rel_Insert_Input>;
  readonly rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
  readonly sourceId?: Maybe<Scalars['String']>;
  readonly tags?: Maybe<Tag_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type OriginatingData_Max_Fields = {
  readonly __typename?: 'OriginatingData_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly sourceId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "OriginatingData" */
export type OriginatingData_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly sourceId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type OriginatingData_Min_Fields = {
  readonly __typename?: 'OriginatingData_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly sourceId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "OriginatingData" */
export type OriginatingData_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly sourceId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "OriginatingData" */
export type OriginatingData_Mutation_Response = {
  readonly __typename?: 'OriginatingData_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<OriginatingData>;
};

/** input type for inserting object relation for remote table "OriginatingData" */
export type OriginatingData_Obj_Rel_Insert_Input = {
  readonly data: OriginatingData_Insert_Input;
  readonly on_conflict?: Maybe<OriginatingData_On_Conflict>;
};

/** on conflict condition type for table "OriginatingData" */
export type OriginatingData_On_Conflict = {
  readonly constraint: OriginatingData_Constraint;
  readonly update_columns: ReadonlyArray<OriginatingData_Update_Column>;
  readonly where?: Maybe<OriginatingData_Bool_Exp>;
};

/** ordering options when selecting data from "OriginatingData" */
export type OriginatingData_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroups_aggregate?: Maybe<ContentGroup_Aggregate_Order_By>;
  readonly contentItems_aggregate?: Maybe<ContentItem_Aggregate_Order_By>;
  readonly contentPeople_aggregate?: Maybe<ContentPerson_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly data?: Maybe<Order_By>;
  readonly eventPeople_aggregate?: Maybe<EventPerson_Aggregate_Order_By>;
  readonly events_aggregate?: Maybe<Event_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly requiredContentItems_aggregate?: Maybe<RequiredContentItem_Aggregate_Order_By>;
  readonly rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
  readonly sourceId?: Maybe<Order_By>;
  readonly tags_aggregate?: Maybe<Tag_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "OriginatingData" */
export type OriginatingData_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type OriginatingData_Prepend_Input = {
  readonly data?: Maybe<Scalars['jsonb']>;
};

/** select columns of table "OriginatingData" */
export enum OriginatingData_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  Id = 'id',
  /** column name */
  SourceId = 'sourceId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "OriginatingData" */
export type OriginatingData_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly data?: Maybe<Scalars['jsonb']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly sourceId?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "OriginatingData" */
export enum OriginatingData_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Data = 'data',
  /** column name */
  Id = 'id',
  /** column name */
  SourceId = 'sourceId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Permission" */
export type Permission = {
  readonly __typename?: 'Permission';
  readonly description: Scalars['String'];
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly rolePermissions: ReadonlyArray<RolePermission>;
  /** An aggregated array relationship */
  readonly rolePermissions_aggregate: RolePermission_Aggregate;
};


/** columns and relationships of "Permission" */
export type PermissionRolePermissionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** columns and relationships of "Permission" */
export type PermissionRolePermissions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};

/** aggregated selection of "Permission" */
export type Permission_Aggregate = {
  readonly __typename?: 'Permission_aggregate';
  readonly aggregate?: Maybe<Permission_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Permission>;
};

/** aggregate fields of "Permission" */
export type Permission_Aggregate_Fields = {
  readonly __typename?: 'Permission_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Permission_Max_Fields>;
  readonly min?: Maybe<Permission_Min_Fields>;
};


/** aggregate fields of "Permission" */
export type Permission_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Permission_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Permission" */
export type Permission_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Permission_Max_Order_By>;
  readonly min?: Maybe<Permission_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Permission" */
export type Permission_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Permission_Insert_Input>;
  readonly on_conflict?: Maybe<Permission_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Permission". All fields are combined with a logical 'AND'. */
export type Permission_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Permission_Bool_Exp>>>;
  readonly _not?: Maybe<Permission_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Permission_Bool_Exp>>>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly rolePermissions?: Maybe<RolePermission_Bool_Exp>;
};

/** unique or primary key constraints on table "Permission" */
export enum Permission_Constraint {
  /** unique or primary key constraint */
  PermissionPkey = 'Permission_pkey'
}

export enum Permission_Enum {
  /** Manage (create/update/delete) conference attendees. */
  ConferenceManageAttendees = 'CONFERENCE_MANAGE_ATTENDEES',
  /** Manage Content tables. */
  ConferenceManageContent = 'CONFERENCE_MANAGE_CONTENT',
  /** Manage groups of a conference. */
  ConferenceManageGroups = 'CONFERENCE_MANAGE_GROUPS',
  /** Manage (update only) conference name, short name and slug. */
  ConferenceManageName = 'CONFERENCE_MANAGE_NAME',
  /** Manage roles of a conference. */
  ConferenceManageRoles = 'CONFERENCE_MANAGE_ROLES',
  /** Manage Schedule tables. */
  ConferenceManageSchedule = 'CONFERENCE_MANAGE_SCHEDULE',
  /** Moderate (update only) conference attendees. */
  ConferenceModerateAttendees = 'CONFERENCE_MODERATE_ATTENDEES',
  /** View the conference. */
  ConferenceView = 'CONFERENCE_VIEW',
  /** View conference attendees. */
  ConferenceViewAttendees = 'CONFERENCE_VIEW_ATTENDEES'
}

/** expression to compare columns of type Permission_enum. All fields are combined with logical 'AND'. */
export type Permission_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<Permission_Enum>;
  readonly _in?: Maybe<ReadonlyArray<Permission_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<Permission_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<Permission_Enum>>;
};

/** input type for inserting data into table "Permission" */
export type Permission_Insert_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly rolePermissions?: Maybe<RolePermission_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Permission_Max_Fields = {
  readonly __typename?: 'Permission_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "Permission" */
export type Permission_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Permission_Min_Fields = {
  readonly __typename?: 'Permission_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "Permission" */
export type Permission_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "Permission" */
export type Permission_Mutation_Response = {
  readonly __typename?: 'Permission_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Permission>;
};

/** input type for inserting object relation for remote table "Permission" */
export type Permission_Obj_Rel_Insert_Input = {
  readonly data: Permission_Insert_Input;
  readonly on_conflict?: Maybe<Permission_On_Conflict>;
};

/** on conflict condition type for table "Permission" */
export type Permission_On_Conflict = {
  readonly constraint: Permission_Constraint;
  readonly update_columns: ReadonlyArray<Permission_Update_Column>;
  readonly where?: Maybe<Permission_Bool_Exp>;
};

/** ordering options when selecting data from "Permission" */
export type Permission_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly rolePermissions_aggregate?: Maybe<RolePermission_Aggregate_Order_By>;
};

/** primary key columns input for table: "Permission" */
export type Permission_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "Permission" */
export enum Permission_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "Permission" */
export type Permission_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "Permission" */
export enum Permission_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** columns and relationships of "PinnedChat" */
export type PinnedChat = {
  readonly __typename?: 'PinnedChat';
  /** An object relationship */
  readonly chat: Chat;
  readonly chatId: Scalars['uuid'];
  readonly id: Scalars['uuid'];
  readonly manual: Scalars['Boolean'];
  /** An object relationship */
  readonly user: User;
  readonly userId: Scalars['String'];
};

/** aggregated selection of "PinnedChat" */
export type PinnedChat_Aggregate = {
  readonly __typename?: 'PinnedChat_aggregate';
  readonly aggregate?: Maybe<PinnedChat_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<PinnedChat>;
};

/** aggregate fields of "PinnedChat" */
export type PinnedChat_Aggregate_Fields = {
  readonly __typename?: 'PinnedChat_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<PinnedChat_Max_Fields>;
  readonly min?: Maybe<PinnedChat_Min_Fields>;
};


/** aggregate fields of "PinnedChat" */
export type PinnedChat_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "PinnedChat" */
export type PinnedChat_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<PinnedChat_Max_Order_By>;
  readonly min?: Maybe<PinnedChat_Min_Order_By>;
};

/** input type for inserting array relation for remote table "PinnedChat" */
export type PinnedChat_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<PinnedChat_Insert_Input>;
  readonly on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** Boolean expression to filter rows from the table "PinnedChat". All fields are combined with a logical 'AND'. */
export type PinnedChat_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<PinnedChat_Bool_Exp>>>;
  readonly _not?: Maybe<PinnedChat_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<PinnedChat_Bool_Exp>>>;
  readonly chat?: Maybe<Chat_Bool_Exp>;
  readonly chatId?: Maybe<Uuid_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly manual?: Maybe<Boolean_Comparison_Exp>;
  readonly user?: Maybe<User_Bool_Exp>;
  readonly userId?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "PinnedChat" */
export enum PinnedChat_Constraint {
  /** unique or primary key constraint */
  PinnedChatChatIdUserIdKey = 'PinnedChat_chatId_userId_key',
  /** unique or primary key constraint */
  PinnedChatPkey = 'PinnedChat_pkey'
}

/** input type for inserting data into table "PinnedChat" */
export type PinnedChat_Insert_Input = {
  readonly chat?: Maybe<Chat_Obj_Rel_Insert_Input>;
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly manual?: Maybe<Scalars['Boolean']>;
  readonly user?: Maybe<User_Obj_Rel_Insert_Input>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** aggregate max on columns */
export type PinnedChat_Max_Fields = {
  readonly __typename?: 'PinnedChat_max_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "PinnedChat" */
export type PinnedChat_Max_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type PinnedChat_Min_Fields = {
  readonly __typename?: 'PinnedChat_min_fields';
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "PinnedChat" */
export type PinnedChat_Min_Order_By = {
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "PinnedChat" */
export type PinnedChat_Mutation_Response = {
  readonly __typename?: 'PinnedChat_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<PinnedChat>;
};

/** input type for inserting object relation for remote table "PinnedChat" */
export type PinnedChat_Obj_Rel_Insert_Input = {
  readonly data: PinnedChat_Insert_Input;
  readonly on_conflict?: Maybe<PinnedChat_On_Conflict>;
};

/** on conflict condition type for table "PinnedChat" */
export type PinnedChat_On_Conflict = {
  readonly constraint: PinnedChat_Constraint;
  readonly update_columns: ReadonlyArray<PinnedChat_Update_Column>;
  readonly where?: Maybe<PinnedChat_Bool_Exp>;
};

/** ordering options when selecting data from "PinnedChat" */
export type PinnedChat_Order_By = {
  readonly chat?: Maybe<Chat_Order_By>;
  readonly chatId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly manual?: Maybe<Order_By>;
  readonly user?: Maybe<User_Order_By>;
  readonly userId?: Maybe<Order_By>;
};

/** primary key columns input for table: "PinnedChat" */
export type PinnedChat_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "PinnedChat" */
export enum PinnedChat_Select_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Manual = 'manual',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "PinnedChat" */
export type PinnedChat_Set_Input = {
  readonly chatId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly manual?: Maybe<Scalars['Boolean']>;
  readonly userId?: Maybe<Scalars['String']>;
};

/** update columns of table "PinnedChat" */
export enum PinnedChat_Update_Column {
  /** column name */
  ChatId = 'chatId',
  /** column name */
  Id = 'id',
  /** column name */
  Manual = 'manual',
  /** column name */
  UserId = 'userId'
}

export type ProtectedEchoOutput = {
  readonly __typename?: 'ProtectedEchoOutput';
  readonly message: Scalars['String'];
};

/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItem = {
  readonly __typename?: 'RequiredContentItem';
  readonly accessToken?: Maybe<Scalars['String']>;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  /** An object relationship */
  readonly contentGroup: ContentGroup;
  readonly contentGroupId: Scalars['uuid'];
  /** An object relationship */
  readonly contentItem?: Maybe<ContentItem>;
  /** An object relationship */
  readonly contentType: ContentType;
  readonly contentTypeName: ContentType_Enum;
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly uploaders: ReadonlyArray<Uploader>;
  /** An aggregated array relationship */
  readonly uploaders_aggregate: Uploader_Aggregate;
};


/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItemUploadersArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};


/** columns and relationships of "RequiredContentItem" */
export type RequiredContentItemUploaders_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};

/** aggregated selection of "RequiredContentItem" */
export type RequiredContentItem_Aggregate = {
  readonly __typename?: 'RequiredContentItem_aggregate';
  readonly aggregate?: Maybe<RequiredContentItem_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<RequiredContentItem>;
};

/** aggregate fields of "RequiredContentItem" */
export type RequiredContentItem_Aggregate_Fields = {
  readonly __typename?: 'RequiredContentItem_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<RequiredContentItem_Max_Fields>;
  readonly min?: Maybe<RequiredContentItem_Min_Fields>;
};


/** aggregate fields of "RequiredContentItem" */
export type RequiredContentItem_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "RequiredContentItem" */
export type RequiredContentItem_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<RequiredContentItem_Max_Order_By>;
  readonly min?: Maybe<RequiredContentItem_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RequiredContentItem" */
export type RequiredContentItem_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<RequiredContentItem_Insert_Input>;
  readonly on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RequiredContentItem". All fields are combined with a logical 'AND'. */
export type RequiredContentItem_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<RequiredContentItem_Bool_Exp>>>;
  readonly _not?: Maybe<RequiredContentItem_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<RequiredContentItem_Bool_Exp>>>;
  readonly accessToken?: Maybe<String_Comparison_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentGroup?: Maybe<ContentGroup_Bool_Exp>;
  readonly contentGroupId?: Maybe<Uuid_Comparison_Exp>;
  readonly contentItem?: Maybe<ContentItem_Bool_Exp>;
  readonly contentType?: Maybe<ContentType_Bool_Exp>;
  readonly contentTypeName?: Maybe<ContentType_Enum_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly uploaders?: Maybe<Uploader_Bool_Exp>;
};

/** unique or primary key constraints on table "RequiredContentItem" */
export enum RequiredContentItem_Constraint {
  /** unique or primary key constraint */
  RequiredContentItemPkey = 'RequiredContentItem_pkey'
}

/** input type for inserting data into table "RequiredContentItem" */
export type RequiredContentItem_Insert_Input = {
  readonly accessToken?: Maybe<Scalars['String']>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroup?: Maybe<ContentGroup_Obj_Rel_Insert_Input>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly contentItem?: Maybe<ContentItem_Obj_Rel_Insert_Input>;
  readonly contentType?: Maybe<ContentType_Obj_Rel_Insert_Input>;
  readonly contentTypeName?: Maybe<ContentType_Enum>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly uploaders?: Maybe<Uploader_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type RequiredContentItem_Max_Fields = {
  readonly __typename?: 'RequiredContentItem_max_fields';
  readonly accessToken?: Maybe<Scalars['String']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "RequiredContentItem" */
export type RequiredContentItem_Max_Order_By = {
  readonly accessToken?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RequiredContentItem_Min_Fields = {
  readonly __typename?: 'RequiredContentItem_min_fields';
  readonly accessToken?: Maybe<Scalars['String']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "RequiredContentItem" */
export type RequiredContentItem_Min_Order_By = {
  readonly accessToken?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RequiredContentItem" */
export type RequiredContentItem_Mutation_Response = {
  readonly __typename?: 'RequiredContentItem_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<RequiredContentItem>;
};

/** input type for inserting object relation for remote table "RequiredContentItem" */
export type RequiredContentItem_Obj_Rel_Insert_Input = {
  readonly data: RequiredContentItem_Insert_Input;
  readonly on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};

/** on conflict condition type for table "RequiredContentItem" */
export type RequiredContentItem_On_Conflict = {
  readonly constraint: RequiredContentItem_Constraint;
  readonly update_columns: ReadonlyArray<RequiredContentItem_Update_Column>;
  readonly where?: Maybe<RequiredContentItem_Bool_Exp>;
};

/** ordering options when selecting data from "RequiredContentItem" */
export type RequiredContentItem_Order_By = {
  readonly accessToken?: Maybe<Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly contentGroup?: Maybe<ContentGroup_Order_By>;
  readonly contentGroupId?: Maybe<Order_By>;
  readonly contentItem?: Maybe<ContentItem_Order_By>;
  readonly contentType?: Maybe<ContentType_Order_By>;
  readonly contentTypeName?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly uploaders_aggregate?: Maybe<Uploader_Aggregate_Order_By>;
};

/** primary key columns input for table: "RequiredContentItem" */
export type RequiredContentItem_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "RequiredContentItem" */
export enum RequiredContentItem_Select_Column {
  /** column name */
  AccessToken = 'accessToken',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  ContentTypeName = 'contentTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "RequiredContentItem" */
export type RequiredContentItem_Set_Input = {
  readonly accessToken?: Maybe<Scalars['String']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly contentGroupId?: Maybe<Scalars['uuid']>;
  readonly contentTypeName?: Maybe<ContentType_Enum>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "RequiredContentItem" */
export enum RequiredContentItem_Update_Column {
  /** column name */
  AccessToken = 'accessToken',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  ContentGroupId = 'contentGroupId',
  /** column name */
  ContentTypeName = 'contentTypeName',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Role" */
export type Role = {
  readonly __typename?: 'Role';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly groupRoles: ReadonlyArray<GroupRole>;
  /** An aggregated array relationship */
  readonly groupRoles_aggregate: GroupRole_Aggregate;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly rolePermissions: ReadonlyArray<RolePermission>;
  /** An aggregated array relationship */
  readonly rolePermissions_aggregate: RolePermission_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Role" */
export type RoleGroupRolesArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** columns and relationships of "Role" */
export type RoleGroupRoles_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** columns and relationships of "Role" */
export type RoleRolePermissionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** columns and relationships of "Role" */
export type RoleRolePermissions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};

/** columns and relationships of "RolePermission" */
export type RolePermission = {
  readonly __typename?: 'RolePermission';
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly permission: Permission;
  readonly permissionName: Permission_Enum;
  /** An object relationship */
  readonly role: Role;
  readonly roleId: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "RolePermission" */
export type RolePermission_Aggregate = {
  readonly __typename?: 'RolePermission_aggregate';
  readonly aggregate?: Maybe<RolePermission_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<RolePermission>;
};

/** aggregate fields of "RolePermission" */
export type RolePermission_Aggregate_Fields = {
  readonly __typename?: 'RolePermission_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<RolePermission_Max_Fields>;
  readonly min?: Maybe<RolePermission_Min_Fields>;
};


/** aggregate fields of "RolePermission" */
export type RolePermission_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "RolePermission" */
export type RolePermission_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<RolePermission_Max_Order_By>;
  readonly min?: Maybe<RolePermission_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RolePermission" */
export type RolePermission_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<RolePermission_Insert_Input>;
  readonly on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RolePermission". All fields are combined with a logical 'AND'. */
export type RolePermission_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<RolePermission_Bool_Exp>>>;
  readonly _not?: Maybe<RolePermission_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<RolePermission_Bool_Exp>>>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly permission?: Maybe<Permission_Bool_Exp>;
  readonly permissionName?: Maybe<Permission_Enum_Comparison_Exp>;
  readonly role?: Maybe<Role_Bool_Exp>;
  readonly roleId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "RolePermission" */
export enum RolePermission_Constraint {
  /** unique or primary key constraint */
  RolePermissionPkey = 'RolePermission_pkey',
  /** unique or primary key constraint */
  RolePermissionRoleIdPermissionKey = 'RolePermission_roleId_permission_key'
}

/** input type for inserting data into table "RolePermission" */
export type RolePermission_Insert_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly permission?: Maybe<Permission_Obj_Rel_Insert_Input>;
  readonly permissionName?: Maybe<Permission_Enum>;
  readonly role?: Maybe<Role_Obj_Rel_Insert_Input>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type RolePermission_Max_Fields = {
  readonly __typename?: 'RolePermission_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "RolePermission" */
export type RolePermission_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RolePermission_Min_Fields = {
  readonly __typename?: 'RolePermission_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "RolePermission" */
export type RolePermission_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RolePermission" */
export type RolePermission_Mutation_Response = {
  readonly __typename?: 'RolePermission_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<RolePermission>;
};

/** input type for inserting object relation for remote table "RolePermission" */
export type RolePermission_Obj_Rel_Insert_Input = {
  readonly data: RolePermission_Insert_Input;
  readonly on_conflict?: Maybe<RolePermission_On_Conflict>;
};

/** on conflict condition type for table "RolePermission" */
export type RolePermission_On_Conflict = {
  readonly constraint: RolePermission_Constraint;
  readonly update_columns: ReadonlyArray<RolePermission_Update_Column>;
  readonly where?: Maybe<RolePermission_Bool_Exp>;
};

/** ordering options when selecting data from "RolePermission" */
export type RolePermission_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly permission?: Maybe<Permission_Order_By>;
  readonly permissionName?: Maybe<Order_By>;
  readonly role?: Maybe<Role_Order_By>;
  readonly roleId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "RolePermission" */
export type RolePermission_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "RolePermission" */
export enum RolePermission_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  PermissionName = 'permissionName',
  /** column name */
  RoleId = 'roleId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "RolePermission" */
export type RolePermission_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly permissionName?: Maybe<Permission_Enum>;
  readonly roleId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "RolePermission" */
export enum RolePermission_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  PermissionName = 'permissionName',
  /** column name */
  RoleId = 'roleId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregated selection of "Role" */
export type Role_Aggregate = {
  readonly __typename?: 'Role_aggregate';
  readonly aggregate?: Maybe<Role_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Role>;
};

/** aggregate fields of "Role" */
export type Role_Aggregate_Fields = {
  readonly __typename?: 'Role_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Role_Max_Fields>;
  readonly min?: Maybe<Role_Min_Fields>;
};


/** aggregate fields of "Role" */
export type Role_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Role_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Role" */
export type Role_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Role_Max_Order_By>;
  readonly min?: Maybe<Role_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Role" */
export type Role_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Role_Insert_Input>;
  readonly on_conflict?: Maybe<Role_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Role". All fields are combined with a logical 'AND'. */
export type Role_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Role_Bool_Exp>>>;
  readonly _not?: Maybe<Role_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Role_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly groupRoles?: Maybe<GroupRole_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly rolePermissions?: Maybe<RolePermission_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Role" */
export enum Role_Constraint {
  /** unique or primary key constraint */
  RoleConferenceNameKey = 'Role_conference_name_key',
  /** unique or primary key constraint */
  RolePkey = 'Role_pkey'
}

/** input type for inserting data into table "Role" */
export type Role_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly groupRoles?: Maybe<GroupRole_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly rolePermissions?: Maybe<RolePermission_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Role_Max_Fields = {
  readonly __typename?: 'Role_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Role" */
export type Role_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Role_Min_Fields = {
  readonly __typename?: 'Role_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Role" */
export type Role_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Role" */
export type Role_Mutation_Response = {
  readonly __typename?: 'Role_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Role>;
};

/** input type for inserting object relation for remote table "Role" */
export type Role_Obj_Rel_Insert_Input = {
  readonly data: Role_Insert_Input;
  readonly on_conflict?: Maybe<Role_On_Conflict>;
};

/** on conflict condition type for table "Role" */
export type Role_On_Conflict = {
  readonly constraint: Role_Constraint;
  readonly update_columns: ReadonlyArray<Role_Update_Column>;
  readonly where?: Maybe<Role_Bool_Exp>;
};

/** ordering options when selecting data from "Role" */
export type Role_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly groupRoles_aggregate?: Maybe<GroupRole_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly rolePermissions_aggregate?: Maybe<RolePermission_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Role" */
export type Role_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Role" */
export enum Role_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Role" */
export type Role_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Role" */
export enum Role_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Room" */
export type Room = {
  readonly __typename?: 'Room';
  readonly capacity?: Maybe<Scalars['Int']>;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly created_at: Scalars['timestamptz'];
  /** An object relationship */
  readonly currentMode: RoomMode;
  readonly currentModeName: RoomMode_Enum;
  /** An array relationship */
  readonly events: ReadonlyArray<Event>;
  /** An aggregated array relationship */
  readonly events_aggregate: Event_Aggregate;
  /** An array relationship */
  readonly executedTransitions: ReadonlyArray<ExecutedTransitions>;
  /** An aggregated array relationship */
  readonly executedTransitions_aggregate: ExecutedTransitions_Aggregate;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  /** An array relationship */
  readonly participants: ReadonlyArray<RoomParticipant>;
  /** An aggregated array relationship */
  readonly participants_aggregate: RoomParticipant_Aggregate;
  /** An array relationship */
  readonly transitions: ReadonlyArray<Transitions>;
  /** An aggregated array relationship */
  readonly transitions_aggregate: Transitions_Aggregate;
  readonly updated_at: Scalars['timestamptz'];
};


/** columns and relationships of "Room" */
export type RoomEventsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomEvents_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomExecutedTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomExecutedTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomParticipantsArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomParticipants_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** columns and relationships of "Room" */
export type RoomTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};

/** columns and relationships of "RoomMode" */
export type RoomMode = {
  readonly __typename?: 'RoomMode';
  readonly description: Scalars['String'];
  /** An array relationship */
  readonly events: ReadonlyArray<Event>;
  /** An aggregated array relationship */
  readonly events_aggregate: Event_Aggregate;
  readonly name: Scalars['String'];
  /** An array relationship */
  readonly rooms: ReadonlyArray<Room>;
  /** An aggregated array relationship */
  readonly rooms_aggregate: Room_Aggregate;
};


/** columns and relationships of "RoomMode" */
export type RoomModeEventsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "RoomMode" */
export type RoomModeEvents_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** columns and relationships of "RoomMode" */
export type RoomModeRoomsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** columns and relationships of "RoomMode" */
export type RoomModeRooms_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};

/** aggregated selection of "RoomMode" */
export type RoomMode_Aggregate = {
  readonly __typename?: 'RoomMode_aggregate';
  readonly aggregate?: Maybe<RoomMode_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<RoomMode>;
};

/** aggregate fields of "RoomMode" */
export type RoomMode_Aggregate_Fields = {
  readonly __typename?: 'RoomMode_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<RoomMode_Max_Fields>;
  readonly min?: Maybe<RoomMode_Min_Fields>;
};


/** aggregate fields of "RoomMode" */
export type RoomMode_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<RoomMode_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "RoomMode" */
export type RoomMode_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<RoomMode_Max_Order_By>;
  readonly min?: Maybe<RoomMode_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RoomMode" */
export type RoomMode_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<RoomMode_Insert_Input>;
  readonly on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RoomMode". All fields are combined with a logical 'AND'. */
export type RoomMode_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<RoomMode_Bool_Exp>>>;
  readonly _not?: Maybe<RoomMode_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<RoomMode_Bool_Exp>>>;
  readonly description?: Maybe<String_Comparison_Exp>;
  readonly events?: Maybe<Event_Bool_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly rooms?: Maybe<Room_Bool_Exp>;
};

/** unique or primary key constraints on table "RoomMode" */
export enum RoomMode_Constraint {
  /** unique or primary key constraint */
  RoomModePkey = 'RoomMode_pkey'
}

export enum RoomMode_Enum {
  /** Users may participate in the general video chat. */
  Breakout = 'BREAKOUT',
  /** Pre-recorded content should be played out to attendees. The breakout and Q&A video chats may also be available to relevant users. */
  Prerecorded = 'PRERECORDED',
  /** A live presentation should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
  Presentation = 'PRESENTATION',
  /** A live Q&A/discussion should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
  QAndA = 'Q_AND_A'
}

/** expression to compare columns of type RoomMode_enum. All fields are combined with logical 'AND'. */
export type RoomMode_Enum_Comparison_Exp = {
  readonly _eq?: Maybe<RoomMode_Enum>;
  readonly _in?: Maybe<ReadonlyArray<RoomMode_Enum>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _neq?: Maybe<RoomMode_Enum>;
  readonly _nin?: Maybe<ReadonlyArray<RoomMode_Enum>>;
};

/** input type for inserting data into table "RoomMode" */
export type RoomMode_Insert_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly events?: Maybe<Event_Arr_Rel_Insert_Input>;
  readonly name?: Maybe<Scalars['String']>;
  readonly rooms?: Maybe<Room_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type RoomMode_Max_Fields = {
  readonly __typename?: 'RoomMode_max_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "RoomMode" */
export type RoomMode_Max_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RoomMode_Min_Fields = {
  readonly __typename?: 'RoomMode_min_fields';
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "RoomMode" */
export type RoomMode_Min_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
};

/** response of any mutation on the table "RoomMode" */
export type RoomMode_Mutation_Response = {
  readonly __typename?: 'RoomMode_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<RoomMode>;
};

/** input type for inserting object relation for remote table "RoomMode" */
export type RoomMode_Obj_Rel_Insert_Input = {
  readonly data: RoomMode_Insert_Input;
  readonly on_conflict?: Maybe<RoomMode_On_Conflict>;
};

/** on conflict condition type for table "RoomMode" */
export type RoomMode_On_Conflict = {
  readonly constraint: RoomMode_Constraint;
  readonly update_columns: ReadonlyArray<RoomMode_Update_Column>;
  readonly where?: Maybe<RoomMode_Bool_Exp>;
};

/** ordering options when selecting data from "RoomMode" */
export type RoomMode_Order_By = {
  readonly description?: Maybe<Order_By>;
  readonly events_aggregate?: Maybe<Event_Aggregate_Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly rooms_aggregate?: Maybe<Room_Aggregate_Order_By>;
};

/** primary key columns input for table: "RoomMode" */
export type RoomMode_Pk_Columns_Input = {
  readonly name: Scalars['String'];
};

/** select columns of table "RoomMode" */
export enum RoomMode_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "RoomMode" */
export type RoomMode_Set_Input = {
  readonly description?: Maybe<Scalars['String']>;
  readonly name?: Maybe<Scalars['String']>;
};

/** update columns of table "RoomMode" */
export enum RoomMode_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Name = 'name'
}

/** columns and relationships of "RoomParticipant" */
export type RoomParticipant = {
  readonly __typename?: 'RoomParticipant';
  /** An object relationship */
  readonly attendee: Attendee;
  readonly attendeeId: Scalars['uuid'];
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly room: Room;
  readonly roomId: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "RoomParticipant" */
export type RoomParticipant_Aggregate = {
  readonly __typename?: 'RoomParticipant_aggregate';
  readonly aggregate?: Maybe<RoomParticipant_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<RoomParticipant>;
};

/** aggregate fields of "RoomParticipant" */
export type RoomParticipant_Aggregate_Fields = {
  readonly __typename?: 'RoomParticipant_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<RoomParticipant_Max_Fields>;
  readonly min?: Maybe<RoomParticipant_Min_Fields>;
};


/** aggregate fields of "RoomParticipant" */
export type RoomParticipant_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "RoomParticipant" */
export type RoomParticipant_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<RoomParticipant_Max_Order_By>;
  readonly min?: Maybe<RoomParticipant_Min_Order_By>;
};

/** input type for inserting array relation for remote table "RoomParticipant" */
export type RoomParticipant_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<RoomParticipant_Insert_Input>;
  readonly on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** Boolean expression to filter rows from the table "RoomParticipant". All fields are combined with a logical 'AND'. */
export type RoomParticipant_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<RoomParticipant_Bool_Exp>>>;
  readonly _not?: Maybe<RoomParticipant_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<RoomParticipant_Bool_Exp>>>;
  readonly attendee?: Maybe<Attendee_Bool_Exp>;
  readonly attendeeId?: Maybe<Uuid_Comparison_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly room?: Maybe<Room_Bool_Exp>;
  readonly roomId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "RoomParticipant" */
export enum RoomParticipant_Constraint {
  /** unique or primary key constraint */
  RoomParticipantPkey = 'RoomParticipant_pkey',
  /** unique or primary key constraint */
  RoomParticipantRoomIdAttendeeIdKey = 'RoomParticipant_roomId_attendeeId_key'
}

/** input type for inserting data into table "RoomParticipant" */
export type RoomParticipant_Insert_Input = {
  readonly attendee?: Maybe<Attendee_Obj_Rel_Insert_Input>;
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly room?: Maybe<Room_Obj_Rel_Insert_Input>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type RoomParticipant_Max_Fields = {
  readonly __typename?: 'RoomParticipant_max_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "RoomParticipant" */
export type RoomParticipant_Max_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type RoomParticipant_Min_Fields = {
  readonly __typename?: 'RoomParticipant_min_fields';
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "RoomParticipant" */
export type RoomParticipant_Min_Order_By = {
  readonly attendeeId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "RoomParticipant" */
export type RoomParticipant_Mutation_Response = {
  readonly __typename?: 'RoomParticipant_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<RoomParticipant>;
};

/** input type for inserting object relation for remote table "RoomParticipant" */
export type RoomParticipant_Obj_Rel_Insert_Input = {
  readonly data: RoomParticipant_Insert_Input;
  readonly on_conflict?: Maybe<RoomParticipant_On_Conflict>;
};

/** on conflict condition type for table "RoomParticipant" */
export type RoomParticipant_On_Conflict = {
  readonly constraint: RoomParticipant_Constraint;
  readonly update_columns: ReadonlyArray<RoomParticipant_Update_Column>;
  readonly where?: Maybe<RoomParticipant_Bool_Exp>;
};

/** ordering options when selecting data from "RoomParticipant" */
export type RoomParticipant_Order_By = {
  readonly attendee?: Maybe<Attendee_Order_By>;
  readonly attendeeId?: Maybe<Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly room?: Maybe<Room_Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "RoomParticipant" */
export type RoomParticipant_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "RoomParticipant" */
export enum RoomParticipant_Select_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "RoomParticipant" */
export type RoomParticipant_Set_Input = {
  readonly attendeeId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "RoomParticipant" */
export enum RoomParticipant_Update_Column {
  /** column name */
  AttendeeId = 'attendeeId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregated selection of "Room" */
export type Room_Aggregate = {
  readonly __typename?: 'Room_aggregate';
  readonly aggregate?: Maybe<Room_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Room>;
};

/** aggregate fields of "Room" */
export type Room_Aggregate_Fields = {
  readonly __typename?: 'Room_aggregate_fields';
  readonly avg?: Maybe<Room_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Room_Max_Fields>;
  readonly min?: Maybe<Room_Min_Fields>;
  readonly stddev?: Maybe<Room_Stddev_Fields>;
  readonly stddev_pop?: Maybe<Room_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<Room_Stddev_Samp_Fields>;
  readonly sum?: Maybe<Room_Sum_Fields>;
  readonly var_pop?: Maybe<Room_Var_Pop_Fields>;
  readonly var_samp?: Maybe<Room_Var_Samp_Fields>;
  readonly variance?: Maybe<Room_Variance_Fields>;
};


/** aggregate fields of "Room" */
export type Room_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Room_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Room" */
export type Room_Aggregate_Order_By = {
  readonly avg?: Maybe<Room_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Room_Max_Order_By>;
  readonly min?: Maybe<Room_Min_Order_By>;
  readonly stddev?: Maybe<Room_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<Room_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<Room_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<Room_Sum_Order_By>;
  readonly var_pop?: Maybe<Room_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<Room_Var_Samp_Order_By>;
  readonly variance?: Maybe<Room_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Room" */
export type Room_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Room_Insert_Input>;
  readonly on_conflict?: Maybe<Room_On_Conflict>;
};

/** aggregate avg on columns */
export type Room_Avg_Fields = {
  readonly __typename?: 'Room_avg_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "Room" */
export type Room_Avg_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Room". All fields are combined with a logical 'AND'. */
export type Room_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Room_Bool_Exp>>>;
  readonly _not?: Maybe<Room_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Room_Bool_Exp>>>;
  readonly capacity?: Maybe<Int_Comparison_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly created_at?: Maybe<Timestamptz_Comparison_Exp>;
  readonly currentMode?: Maybe<RoomMode_Bool_Exp>;
  readonly currentModeName?: Maybe<RoomMode_Enum_Comparison_Exp>;
  readonly events?: Maybe<Event_Bool_Exp>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly participants?: Maybe<RoomParticipant_Bool_Exp>;
  readonly transitions?: Maybe<Transitions_Bool_Exp>;
  readonly updated_at?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Room" */
export enum Room_Constraint {
  /** unique or primary key constraint */
  RoomConferenceIdNameKey = 'Room_conferenceId_name_key',
  /** unique or primary key constraint */
  RoomPkey = 'Room_pkey'
}

/** input type for incrementing integer column in table "Room" */
export type Room_Inc_Input = {
  readonly capacity?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "Room" */
export type Room_Insert_Input = {
  readonly capacity?: Maybe<Scalars['Int']>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly created_at?: Maybe<Scalars['timestamptz']>;
  readonly currentMode?: Maybe<RoomMode_Obj_Rel_Insert_Input>;
  readonly currentModeName?: Maybe<RoomMode_Enum>;
  readonly events?: Maybe<Event_Arr_Rel_Insert_Input>;
  readonly executedTransitions?: Maybe<ExecutedTransitions_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly participants?: Maybe<RoomParticipant_Arr_Rel_Insert_Input>;
  readonly transitions?: Maybe<Transitions_Arr_Rel_Insert_Input>;
  readonly updated_at?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Room_Max_Fields = {
  readonly __typename?: 'Room_max_fields';
  readonly capacity?: Maybe<Scalars['Int']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly created_at?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updated_at?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Room" */
export type Room_Max_Order_By = {
  readonly capacity?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly created_at?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updated_at?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Room_Min_Fields = {
  readonly __typename?: 'Room_min_fields';
  readonly capacity?: Maybe<Scalars['Int']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly created_at?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updated_at?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Room" */
export type Room_Min_Order_By = {
  readonly capacity?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly created_at?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updated_at?: Maybe<Order_By>;
};

/** response of any mutation on the table "Room" */
export type Room_Mutation_Response = {
  readonly __typename?: 'Room_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Room>;
};

/** input type for inserting object relation for remote table "Room" */
export type Room_Obj_Rel_Insert_Input = {
  readonly data: Room_Insert_Input;
  readonly on_conflict?: Maybe<Room_On_Conflict>;
};

/** on conflict condition type for table "Room" */
export type Room_On_Conflict = {
  readonly constraint: Room_Constraint;
  readonly update_columns: ReadonlyArray<Room_Update_Column>;
  readonly where?: Maybe<Room_Bool_Exp>;
};

/** ordering options when selecting data from "Room" */
export type Room_Order_By = {
  readonly capacity?: Maybe<Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly created_at?: Maybe<Order_By>;
  readonly currentMode?: Maybe<RoomMode_Order_By>;
  readonly currentModeName?: Maybe<Order_By>;
  readonly events_aggregate?: Maybe<Event_Aggregate_Order_By>;
  readonly executedTransitions_aggregate?: Maybe<ExecutedTransitions_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly participants_aggregate?: Maybe<RoomParticipant_Aggregate_Order_By>;
  readonly transitions_aggregate?: Maybe<Transitions_Aggregate_Order_By>;
  readonly updated_at?: Maybe<Order_By>;
};

/** primary key columns input for table: "Room" */
export type Room_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Room" */
export enum Room_Select_Column {
  /** column name */
  Capacity = 'capacity',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  CurrentModeName = 'currentModeName',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** input type for updating data in table "Room" */
export type Room_Set_Input = {
  readonly capacity?: Maybe<Scalars['Int']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly created_at?: Maybe<Scalars['timestamptz']>;
  readonly currentModeName?: Maybe<RoomMode_Enum>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updated_at?: Maybe<Scalars['timestamptz']>;
};

/** aggregate stddev on columns */
export type Room_Stddev_Fields = {
  readonly __typename?: 'Room_stddev_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "Room" */
export type Room_Stddev_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Room_Stddev_Pop_Fields = {
  readonly __typename?: 'Room_stddev_pop_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "Room" */
export type Room_Stddev_Pop_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Room_Stddev_Samp_Fields = {
  readonly __typename?: 'Room_stddev_samp_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "Room" */
export type Room_Stddev_Samp_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Room_Sum_Fields = {
  readonly __typename?: 'Room_sum_fields';
  readonly capacity?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "Room" */
export type Room_Sum_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** update columns of table "Room" */
export enum Room_Update_Column {
  /** column name */
  Capacity = 'capacity',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  CurrentModeName = 'currentModeName',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** aggregate var_pop on columns */
export type Room_Var_Pop_Fields = {
  readonly __typename?: 'Room_var_pop_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "Room" */
export type Room_Var_Pop_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Room_Var_Samp_Fields = {
  readonly __typename?: 'Room_var_samp_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "Room" */
export type Room_Var_Samp_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Room_Variance_Fields = {
  readonly __typename?: 'Room_variance_fields';
  readonly capacity?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "Room" */
export type Room_Variance_Order_By = {
  readonly capacity?: Maybe<Order_By>;
};

export type SampleInput = {
  readonly password: Scalars['String'];
  readonly username: Scalars['String'];
};

export type SampleOutput = {
  readonly __typename?: 'SampleOutput';
  readonly accessToken: Scalars['String'];
};

/** expression to compare columns of type String. All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['String']>;
  readonly _gt?: Maybe<Scalars['String']>;
  readonly _gte?: Maybe<Scalars['String']>;
  readonly _ilike?: Maybe<Scalars['String']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['String']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _like?: Maybe<Scalars['String']>;
  readonly _lt?: Maybe<Scalars['String']>;
  readonly _lte?: Maybe<Scalars['String']>;
  readonly _neq?: Maybe<Scalars['String']>;
  readonly _nilike?: Maybe<Scalars['String']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['String']>>;
  readonly _nlike?: Maybe<Scalars['String']>;
  readonly _nsimilar?: Maybe<Scalars['String']>;
  readonly _similar?: Maybe<Scalars['String']>;
};

export type SubmitContentItemInput = {
  readonly contentItemData: Scalars['jsonb'];
};

export type SubmitContentItemOutput = {
  readonly __typename?: 'SubmitContentItemOutput';
  readonly message: Scalars['String'];
  readonly success: Scalars['Boolean'];
};

/** columns and relationships of "Tag" */
export type Tag = {
  readonly __typename?: 'Tag';
  readonly colour: Scalars['String'];
  /** An array relationship */
  readonly contentGroupTags: ReadonlyArray<ContentGroupTag>;
  /** An aggregated array relationship */
  readonly contentGroupTags_aggregate: ContentGroupTag_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly eventTags: ReadonlyArray<EventTag>;
  /** An aggregated array relationship */
  readonly eventTags_aggregate: EventTag_Aggregate;
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly originatingData?: Maybe<OriginatingData>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt: Scalars['timestamptz'];
};


/** columns and relationships of "Tag" */
export type TagContentGroupTagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** columns and relationships of "Tag" */
export type TagContentGroupTags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** columns and relationships of "Tag" */
export type TagEventTagsArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** columns and relationships of "Tag" */
export type TagEventTags_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};

/** aggregated selection of "Tag" */
export type Tag_Aggregate = {
  readonly __typename?: 'Tag_aggregate';
  readonly aggregate?: Maybe<Tag_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Tag>;
};

/** aggregate fields of "Tag" */
export type Tag_Aggregate_Fields = {
  readonly __typename?: 'Tag_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Tag_Max_Fields>;
  readonly min?: Maybe<Tag_Min_Fields>;
};


/** aggregate fields of "Tag" */
export type Tag_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Tag" */
export type Tag_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Tag_Max_Order_By>;
  readonly min?: Maybe<Tag_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Tag" */
export type Tag_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Tag_Insert_Input>;
  readonly on_conflict?: Maybe<Tag_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Tag". All fields are combined with a logical 'AND'. */
export type Tag_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Tag_Bool_Exp>>>;
  readonly _not?: Maybe<Tag_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Tag_Bool_Exp>>>;
  readonly colour?: Maybe<String_Comparison_Exp>;
  readonly contentGroupTags?: Maybe<ContentGroupTag_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly eventTags?: Maybe<EventTag_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly originatingData?: Maybe<OriginatingData_Bool_Exp>;
  readonly originatingDataId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Tag" */
export enum Tag_Constraint {
  /** unique or primary key constraint */
  TagPkey = 'Tag_pkey'
}

/** input type for inserting data into table "Tag" */
export type Tag_Insert_Input = {
  readonly colour?: Maybe<Scalars['String']>;
  readonly contentGroupTags?: Maybe<ContentGroupTag_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventTags?: Maybe<EventTag_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingData?: Maybe<OriginatingData_Obj_Rel_Insert_Input>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Tag_Max_Fields = {
  readonly __typename?: 'Tag_max_fields';
  readonly colour?: Maybe<Scalars['String']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Tag" */
export type Tag_Max_Order_By = {
  readonly colour?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Tag_Min_Fields = {
  readonly __typename?: 'Tag_min_fields';
  readonly colour?: Maybe<Scalars['String']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Tag" */
export type Tag_Min_Order_By = {
  readonly colour?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Tag" */
export type Tag_Mutation_Response = {
  readonly __typename?: 'Tag_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Tag>;
};

/** input type for inserting object relation for remote table "Tag" */
export type Tag_Obj_Rel_Insert_Input = {
  readonly data: Tag_Insert_Input;
  readonly on_conflict?: Maybe<Tag_On_Conflict>;
};

/** on conflict condition type for table "Tag" */
export type Tag_On_Conflict = {
  readonly constraint: Tag_Constraint;
  readonly update_columns: ReadonlyArray<Tag_Update_Column>;
  readonly where?: Maybe<Tag_Bool_Exp>;
};

/** ordering options when selecting data from "Tag" */
export type Tag_Order_By = {
  readonly colour?: Maybe<Order_By>;
  readonly contentGroupTags_aggregate?: Maybe<ContentGroupTag_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventTags_aggregate?: Maybe<EventTag_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly originatingData?: Maybe<OriginatingData_Order_By>;
  readonly originatingDataId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Tag" */
export type Tag_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Tag" */
export enum Tag_Select_Column {
  /** column name */
  Colour = 'colour',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Tag" */
export type Tag_Set_Input = {
  readonly colour?: Maybe<Scalars['String']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly originatingDataId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Tag" */
export enum Tag_Update_Column {
  /** column name */
  Colour = 'colour',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  OriginatingDataId = 'originatingDataId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Transitions" */
export type Transitions = {
  readonly __typename?: 'Transitions';
  readonly broadcastContentId: Scalars['uuid'];
  /** An object relationship */
  readonly broadcastContentItem: BroadcastContentItem;
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  /** An object relationship */
  readonly event: Event;
  readonly eventId: Scalars['uuid'];
  readonly fallbackBroadcastContentId?: Maybe<Scalars['uuid']>;
  /** An object relationship */
  readonly fallbackBroadcastContentItem?: Maybe<BroadcastContentItem>;
  readonly id: Scalars['uuid'];
  /** An object relationship */
  readonly room: Room;
  readonly roomId: Scalars['uuid'];
  readonly time: Scalars['timestamptz'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "Transitions" */
export type Transitions_Aggregate = {
  readonly __typename?: 'Transitions_aggregate';
  readonly aggregate?: Maybe<Transitions_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Transitions>;
};

/** aggregate fields of "Transitions" */
export type Transitions_Aggregate_Fields = {
  readonly __typename?: 'Transitions_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Transitions_Max_Fields>;
  readonly min?: Maybe<Transitions_Min_Fields>;
};


/** aggregate fields of "Transitions" */
export type Transitions_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Transitions" */
export type Transitions_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Transitions_Max_Order_By>;
  readonly min?: Maybe<Transitions_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Transitions" */
export type Transitions_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Transitions_Insert_Input>;
  readonly on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Transitions". All fields are combined with a logical 'AND'. */
export type Transitions_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Transitions_Bool_Exp>>>;
  readonly _not?: Maybe<Transitions_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Transitions_Bool_Exp>>>;
  readonly broadcastContentId?: Maybe<Uuid_Comparison_Exp>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly event?: Maybe<Event_Bool_Exp>;
  readonly eventId?: Maybe<Uuid_Comparison_Exp>;
  readonly fallbackBroadcastContentId?: Maybe<Uuid_Comparison_Exp>;
  readonly fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Bool_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly room?: Maybe<Room_Bool_Exp>;
  readonly roomId?: Maybe<Uuid_Comparison_Exp>;
  readonly time?: Maybe<Timestamptz_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Transitions" */
export enum Transitions_Constraint {
  /** unique or primary key constraint */
  TransitionsPkey = 'Transitions_pkey'
}

/** input type for inserting data into table "Transitions" */
export type Transitions_Insert_Input = {
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly event?: Maybe<Event_Obj_Rel_Insert_Input>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly fallbackBroadcastContentId?: Maybe<Scalars['uuid']>;
  readonly fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Obj_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly room?: Maybe<Room_Obj_Rel_Insert_Input>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Transitions_Max_Fields = {
  readonly __typename?: 'Transitions_max_fields';
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly fallbackBroadcastContentId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Transitions" */
export type Transitions_Max_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly fallbackBroadcastContentId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Transitions_Min_Fields = {
  readonly __typename?: 'Transitions_min_fields';
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly fallbackBroadcastContentId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Transitions" */
export type Transitions_Min_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly fallbackBroadcastContentId?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Transitions" */
export type Transitions_Mutation_Response = {
  readonly __typename?: 'Transitions_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Transitions>;
};

/** input type for inserting object relation for remote table "Transitions" */
export type Transitions_Obj_Rel_Insert_Input = {
  readonly data: Transitions_Insert_Input;
  readonly on_conflict?: Maybe<Transitions_On_Conflict>;
};

/** on conflict condition type for table "Transitions" */
export type Transitions_On_Conflict = {
  readonly constraint: Transitions_Constraint;
  readonly update_columns: ReadonlyArray<Transitions_Update_Column>;
  readonly where?: Maybe<Transitions_Bool_Exp>;
};

/** ordering options when selecting data from "Transitions" */
export type Transitions_Order_By = {
  readonly broadcastContentId?: Maybe<Order_By>;
  readonly broadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly event?: Maybe<Event_Order_By>;
  readonly eventId?: Maybe<Order_By>;
  readonly fallbackBroadcastContentId?: Maybe<Order_By>;
  readonly fallbackBroadcastContentItem?: Maybe<BroadcastContentItem_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly room?: Maybe<Room_Order_By>;
  readonly roomId?: Maybe<Order_By>;
  readonly time?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Transitions" */
export type Transitions_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Transitions" */
export enum Transitions_Select_Column {
  /** column name */
  BroadcastContentId = 'broadcastContentId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EventId = 'eventId',
  /** column name */
  FallbackBroadcastContentId = 'fallbackBroadcastContentId',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  Time = 'time',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Transitions" */
export type Transitions_Set_Input = {
  readonly broadcastContentId?: Maybe<Scalars['uuid']>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly eventId?: Maybe<Scalars['uuid']>;
  readonly fallbackBroadcastContentId?: Maybe<Scalars['uuid']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly roomId?: Maybe<Scalars['uuid']>;
  readonly time?: Maybe<Scalars['timestamptz']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "Transitions" */
export enum Transitions_Update_Column {
  /** column name */
  BroadcastContentId = 'broadcastContentId',
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  EventId = 'eventId',
  /** column name */
  FallbackBroadcastContentId = 'fallbackBroadcastContentId',
  /** column name */
  Id = 'id',
  /** column name */
  RoomId = 'roomId',
  /** column name */
  Time = 'time',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** columns and relationships of "Uploader" */
export type Uploader = {
  readonly __typename?: 'Uploader';
  /** An object relationship */
  readonly conference: Conference;
  readonly conferenceId: Scalars['uuid'];
  readonly createdAt: Scalars['timestamptz'];
  readonly email: Scalars['String'];
  readonly emailsSentCount: Scalars['Int'];
  readonly id: Scalars['uuid'];
  readonly name: Scalars['String'];
  /** An object relationship */
  readonly requiredContentItem: RequiredContentItem;
  readonly requiredContentItemId: Scalars['uuid'];
  readonly updatedAt: Scalars['timestamptz'];
};

/** aggregated selection of "Uploader" */
export type Uploader_Aggregate = {
  readonly __typename?: 'Uploader_aggregate';
  readonly aggregate?: Maybe<Uploader_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<Uploader>;
};

/** aggregate fields of "Uploader" */
export type Uploader_Aggregate_Fields = {
  readonly __typename?: 'Uploader_aggregate_fields';
  readonly avg?: Maybe<Uploader_Avg_Fields>;
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<Uploader_Max_Fields>;
  readonly min?: Maybe<Uploader_Min_Fields>;
  readonly stddev?: Maybe<Uploader_Stddev_Fields>;
  readonly stddev_pop?: Maybe<Uploader_Stddev_Pop_Fields>;
  readonly stddev_samp?: Maybe<Uploader_Stddev_Samp_Fields>;
  readonly sum?: Maybe<Uploader_Sum_Fields>;
  readonly var_pop?: Maybe<Uploader_Var_Pop_Fields>;
  readonly var_samp?: Maybe<Uploader_Var_Samp_Fields>;
  readonly variance?: Maybe<Uploader_Variance_Fields>;
};


/** aggregate fields of "Uploader" */
export type Uploader_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "Uploader" */
export type Uploader_Aggregate_Order_By = {
  readonly avg?: Maybe<Uploader_Avg_Order_By>;
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<Uploader_Max_Order_By>;
  readonly min?: Maybe<Uploader_Min_Order_By>;
  readonly stddev?: Maybe<Uploader_Stddev_Order_By>;
  readonly stddev_pop?: Maybe<Uploader_Stddev_Pop_Order_By>;
  readonly stddev_samp?: Maybe<Uploader_Stddev_Samp_Order_By>;
  readonly sum?: Maybe<Uploader_Sum_Order_By>;
  readonly var_pop?: Maybe<Uploader_Var_Pop_Order_By>;
  readonly var_samp?: Maybe<Uploader_Var_Samp_Order_By>;
  readonly variance?: Maybe<Uploader_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Uploader" */
export type Uploader_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<Uploader_Insert_Input>;
  readonly on_conflict?: Maybe<Uploader_On_Conflict>;
};

/** aggregate avg on columns */
export type Uploader_Avg_Fields = {
  readonly __typename?: 'Uploader_avg_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "Uploader" */
export type Uploader_Avg_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Uploader". All fields are combined with a logical 'AND'. */
export type Uploader_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<Uploader_Bool_Exp>>>;
  readonly _not?: Maybe<Uploader_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<Uploader_Bool_Exp>>>;
  readonly conference?: Maybe<Conference_Bool_Exp>;
  readonly conferenceId?: Maybe<Uuid_Comparison_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly email?: Maybe<String_Comparison_Exp>;
  readonly emailsSentCount?: Maybe<Int_Comparison_Exp>;
  readonly id?: Maybe<Uuid_Comparison_Exp>;
  readonly name?: Maybe<String_Comparison_Exp>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Bool_Exp>;
  readonly requiredContentItemId?: Maybe<Uuid_Comparison_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Uploader" */
export enum Uploader_Constraint {
  /** unique or primary key constraint */
  UploaderEmailRequiredContentItemIdKey = 'Uploader_email_requiredContentItemId_key',
  /** unique or primary key constraint */
  UploaderPkey = 'Uploader_pkey'
}

/** input type for incrementing integer column in table "Uploader" */
export type Uploader_Inc_Input = {
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
};

/** input type for inserting data into table "Uploader" */
export type Uploader_Insert_Input = {
  readonly conference?: Maybe<Conference_Obj_Rel_Insert_Input>;
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Obj_Rel_Insert_Input>;
  readonly requiredContentItemId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Uploader_Max_Fields = {
  readonly __typename?: 'Uploader_max_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly requiredContentItemId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "Uploader" */
export type Uploader_Max_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly emailsSentCount?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly requiredContentItemId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Uploader_Min_Fields = {
  readonly __typename?: 'Uploader_min_fields';
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly requiredContentItemId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "Uploader" */
export type Uploader_Min_Order_By = {
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly emailsSentCount?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly requiredContentItemId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "Uploader" */
export type Uploader_Mutation_Response = {
  readonly __typename?: 'Uploader_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<Uploader>;
};

/** input type for inserting object relation for remote table "Uploader" */
export type Uploader_Obj_Rel_Insert_Input = {
  readonly data: Uploader_Insert_Input;
  readonly on_conflict?: Maybe<Uploader_On_Conflict>;
};

/** on conflict condition type for table "Uploader" */
export type Uploader_On_Conflict = {
  readonly constraint: Uploader_Constraint;
  readonly update_columns: ReadonlyArray<Uploader_Update_Column>;
  readonly where?: Maybe<Uploader_Bool_Exp>;
};

/** ordering options when selecting data from "Uploader" */
export type Uploader_Order_By = {
  readonly conference?: Maybe<Conference_Order_By>;
  readonly conferenceId?: Maybe<Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly emailsSentCount?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly name?: Maybe<Order_By>;
  readonly requiredContentItem?: Maybe<RequiredContentItem_Order_By>;
  readonly requiredContentItemId?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: "Uploader" */
export type Uploader_Pk_Columns_Input = {
  readonly id: Scalars['uuid'];
};

/** select columns of table "Uploader" */
export enum Uploader_Select_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Email = 'email',
  /** column name */
  EmailsSentCount = 'emailsSentCount',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  RequiredContentItemId = 'requiredContentItemId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "Uploader" */
export type Uploader_Set_Input = {
  readonly conferenceId?: Maybe<Scalars['uuid']>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
  readonly id?: Maybe<Scalars['uuid']>;
  readonly name?: Maybe<Scalars['String']>;
  readonly requiredContentItemId?: Maybe<Scalars['uuid']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** aggregate stddev on columns */
export type Uploader_Stddev_Fields = {
  readonly __typename?: 'Uploader_stddev_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "Uploader" */
export type Uploader_Stddev_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Uploader_Stddev_Pop_Fields = {
  readonly __typename?: 'Uploader_stddev_pop_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "Uploader" */
export type Uploader_Stddev_Pop_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Uploader_Stddev_Samp_Fields = {
  readonly __typename?: 'Uploader_stddev_samp_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "Uploader" */
export type Uploader_Stddev_Samp_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** aggregate sum on columns */
export type Uploader_Sum_Fields = {
  readonly __typename?: 'Uploader_sum_fields';
  readonly emailsSentCount?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "Uploader" */
export type Uploader_Sum_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** update columns of table "Uploader" */
export enum Uploader_Update_Column {
  /** column name */
  ConferenceId = 'conferenceId',
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Email = 'email',
  /** column name */
  EmailsSentCount = 'emailsSentCount',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  RequiredContentItemId = 'requiredContentItemId',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** aggregate var_pop on columns */
export type Uploader_Var_Pop_Fields = {
  readonly __typename?: 'Uploader_var_pop_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "Uploader" */
export type Uploader_Var_Pop_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Uploader_Var_Samp_Fields = {
  readonly __typename?: 'Uploader_var_samp_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "Uploader" */
export type Uploader_Var_Samp_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Uploader_Variance_Fields = {
  readonly __typename?: 'Uploader_variance_fields';
  readonly emailsSentCount?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "Uploader" */
export type Uploader_Variance_Order_By = {
  readonly emailsSentCount?: Maybe<Order_By>;
};

/** columns and relationships of "User" */
export type User = {
  readonly __typename?: 'User';
  /** An array relationship */
  readonly attendees: ReadonlyArray<Attendee>;
  /** An aggregated array relationship */
  readonly attendees_aggregate: Attendee_Aggregate;
  /** An array relationship */
  readonly chats: ReadonlyArray<Chat>;
  /** An aggregated array relationship */
  readonly chats_aggregate: Chat_Aggregate;
  /** An array relationship */
  readonly conferenceDemoCodes: ReadonlyArray<ConferenceDemoCode>;
  /** An aggregated array relationship */
  readonly conferenceDemoCodes_aggregate: ConferenceDemoCode_Aggregate;
  /** An array relationship */
  readonly conferencesCreated: ReadonlyArray<Conference>;
  /** An aggregated array relationship */
  readonly conferencesCreated_aggregate: Conference_Aggregate;
  readonly createdAt: Scalars['timestamptz'];
  readonly email?: Maybe<Scalars['String']>;
  /** An array relationship */
  readonly emails: ReadonlyArray<Email>;
  /** An aggregated array relationship */
  readonly emails_aggregate: Email_Aggregate;
  readonly firstName: Scalars['String'];
  /** An array relationship */
  readonly flaggedMessages: ReadonlyArray<FlaggedChatMessage>;
  /** An aggregated array relationship */
  readonly flaggedMessages_aggregate: FlaggedChatMessage_Aggregate;
  /** An array relationship */
  readonly followedChats: ReadonlyArray<FollowedChat>;
  /** An aggregated array relationship */
  readonly followedChats_aggregate: FollowedChat_Aggregate;
  readonly id: Scalars['String'];
  /** An array relationship */
  readonly invitationsPendingConfirmation: ReadonlyArray<Invitation>;
  /** An aggregated array relationship */
  readonly invitationsPendingConfirmation_aggregate: Invitation_Aggregate;
  readonly lastLoggedInAt?: Maybe<Scalars['timestamptz']>;
  readonly lastName: Scalars['String'];
  /** An array relationship */
  readonly memberOfChats: ReadonlyArray<ChatMember>;
  /** An aggregated array relationship */
  readonly memberOfChats_aggregate: ChatMember_Aggregate;
  /** An object relationship */
  readonly onlineStatus?: Maybe<OnlineStatus>;
  /** An array relationship */
  readonly pinnedChats: ReadonlyArray<PinnedChat>;
  /** An aggregated array relationship */
  readonly pinnedChats_aggregate: PinnedChat_Aggregate;
  /** An array relationship */
  readonly reactions: ReadonlyArray<ChatReaction>;
  /** An aggregated array relationship */
  readonly reactions_aggregate: ChatReaction_Aggregate;
  /** An array relationship */
  readonly sentMessages: ReadonlyArray<ChatMessage>;
  /** An aggregated array relationship */
  readonly sentMessages_aggregate: ChatMessage_Aggregate;
  /** An array relationship */
  readonly typingInChats: ReadonlyArray<ChatTyper>;
  /** An aggregated array relationship */
  readonly typingInChats_aggregate: ChatTyper_Aggregate;
  /** An array relationship */
  readonly unreadIndices: ReadonlyArray<ChatUnreadIndex>;
  /** An aggregated array relationship */
  readonly unreadIndices_aggregate: ChatUnreadIndex_Aggregate;
  readonly updatedAt: Scalars['timestamptz'];
  /** An array relationship */
  readonly viewingChats: ReadonlyArray<ChatViewer>;
  /** An aggregated array relationship */
  readonly viewingChats_aggregate: ChatViewer_Aggregate;
};


/** columns and relationships of "User" */
export type UserAttendeesArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserAttendees_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserConferenceDemoCodesArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserConferenceDemoCodes_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserConferencesCreatedArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserConferencesCreated_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserEmailsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserEmails_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserFlaggedMessagesArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserFlaggedMessages_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserFollowedChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserFollowedChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserInvitationsPendingConfirmationArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserInvitationsPendingConfirmation_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserMemberOfChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserMemberOfChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserPinnedChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserPinnedChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserReactionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserReactions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserSentMessagesArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserSentMessages_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserTypingInChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserTypingInChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserUnreadIndicesArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserUnreadIndices_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserViewingChatsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** columns and relationships of "User" */
export type UserViewingChats_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};

/** aggregated selection of "User" */
export type User_Aggregate = {
  readonly __typename?: 'User_aggregate';
  readonly aggregate?: Maybe<User_Aggregate_Fields>;
  readonly nodes: ReadonlyArray<User>;
};

/** aggregate fields of "User" */
export type User_Aggregate_Fields = {
  readonly __typename?: 'User_aggregate_fields';
  readonly count?: Maybe<Scalars['Int']>;
  readonly max?: Maybe<User_Max_Fields>;
  readonly min?: Maybe<User_Min_Fields>;
};


/** aggregate fields of "User" */
export type User_Aggregate_FieldsCountArgs = {
  columns?: Maybe<ReadonlyArray<User_Select_Column>>;
  distinct?: Maybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "User" */
export type User_Aggregate_Order_By = {
  readonly count?: Maybe<Order_By>;
  readonly max?: Maybe<User_Max_Order_By>;
  readonly min?: Maybe<User_Min_Order_By>;
};

/** input type for inserting array relation for remote table "User" */
export type User_Arr_Rel_Insert_Input = {
  readonly data: ReadonlyArray<User_Insert_Input>;
  readonly on_conflict?: Maybe<User_On_Conflict>;
};

/** Boolean expression to filter rows from the table "User". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
  readonly _and?: Maybe<ReadonlyArray<Maybe<User_Bool_Exp>>>;
  readonly _not?: Maybe<User_Bool_Exp>;
  readonly _or?: Maybe<ReadonlyArray<Maybe<User_Bool_Exp>>>;
  readonly attendees?: Maybe<Attendee_Bool_Exp>;
  readonly chats?: Maybe<Chat_Bool_Exp>;
  readonly conferenceDemoCodes?: Maybe<ConferenceDemoCode_Bool_Exp>;
  readonly conferencesCreated?: Maybe<Conference_Bool_Exp>;
  readonly createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly email?: Maybe<String_Comparison_Exp>;
  readonly emails?: Maybe<Email_Bool_Exp>;
  readonly firstName?: Maybe<String_Comparison_Exp>;
  readonly flaggedMessages?: Maybe<FlaggedChatMessage_Bool_Exp>;
  readonly followedChats?: Maybe<FollowedChat_Bool_Exp>;
  readonly id?: Maybe<String_Comparison_Exp>;
  readonly invitationsPendingConfirmation?: Maybe<Invitation_Bool_Exp>;
  readonly lastLoggedInAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly lastName?: Maybe<String_Comparison_Exp>;
  readonly memberOfChats?: Maybe<ChatMember_Bool_Exp>;
  readonly onlineStatus?: Maybe<OnlineStatus_Bool_Exp>;
  readonly pinnedChats?: Maybe<PinnedChat_Bool_Exp>;
  readonly reactions?: Maybe<ChatReaction_Bool_Exp>;
  readonly sentMessages?: Maybe<ChatMessage_Bool_Exp>;
  readonly typingInChats?: Maybe<ChatTyper_Bool_Exp>;
  readonly unreadIndices?: Maybe<ChatUnreadIndex_Bool_Exp>;
  readonly updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  readonly viewingChats?: Maybe<ChatViewer_Bool_Exp>;
};

/** unique or primary key constraints on table "User" */
export enum User_Constraint {
  /** unique or primary key constraint */
  UserEmailKey = 'user_email_key',
  /** unique or primary key constraint */
  UserPkey = 'user_pkey'
}

/** input type for inserting data into table "User" */
export type User_Insert_Input = {
  readonly attendees?: Maybe<Attendee_Arr_Rel_Insert_Input>;
  readonly chats?: Maybe<Chat_Arr_Rel_Insert_Input>;
  readonly conferenceDemoCodes?: Maybe<ConferenceDemoCode_Arr_Rel_Insert_Input>;
  readonly conferencesCreated?: Maybe<Conference_Arr_Rel_Insert_Input>;
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly emails?: Maybe<Email_Arr_Rel_Insert_Input>;
  readonly firstName?: Maybe<Scalars['String']>;
  readonly flaggedMessages?: Maybe<FlaggedChatMessage_Arr_Rel_Insert_Input>;
  readonly followedChats?: Maybe<FollowedChat_Arr_Rel_Insert_Input>;
  readonly id?: Maybe<Scalars['String']>;
  readonly invitationsPendingConfirmation?: Maybe<Invitation_Arr_Rel_Insert_Input>;
  readonly lastLoggedInAt?: Maybe<Scalars['timestamptz']>;
  readonly lastName?: Maybe<Scalars['String']>;
  readonly memberOfChats?: Maybe<ChatMember_Arr_Rel_Insert_Input>;
  readonly onlineStatus?: Maybe<OnlineStatus_Obj_Rel_Insert_Input>;
  readonly pinnedChats?: Maybe<PinnedChat_Arr_Rel_Insert_Input>;
  readonly reactions?: Maybe<ChatReaction_Arr_Rel_Insert_Input>;
  readonly sentMessages?: Maybe<ChatMessage_Arr_Rel_Insert_Input>;
  readonly typingInChats?: Maybe<ChatTyper_Arr_Rel_Insert_Input>;
  readonly unreadIndices?: Maybe<ChatUnreadIndex_Arr_Rel_Insert_Input>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
  readonly viewingChats?: Maybe<ChatViewer_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type User_Max_Fields = {
  readonly __typename?: 'User_max_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly firstName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['String']>;
  readonly lastLoggedInAt?: Maybe<Scalars['timestamptz']>;
  readonly lastName?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by max() on columns of table "User" */
export type User_Max_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly firstName?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastLoggedInAt?: Maybe<Order_By>;
  readonly lastName?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type User_Min_Fields = {
  readonly __typename?: 'User_min_fields';
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly firstName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['String']>;
  readonly lastLoggedInAt?: Maybe<Scalars['timestamptz']>;
  readonly lastName?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** order by min() on columns of table "User" */
export type User_Min_Order_By = {
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly firstName?: Maybe<Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly lastLoggedInAt?: Maybe<Order_By>;
  readonly lastName?: Maybe<Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "User" */
export type User_Mutation_Response = {
  readonly __typename?: 'User_mutation_response';
  /** number of affected rows by the mutation */
  readonly affected_rows: Scalars['Int'];
  /** data of the affected rows by the mutation */
  readonly returning: ReadonlyArray<User>;
};

/** input type for inserting object relation for remote table "User" */
export type User_Obj_Rel_Insert_Input = {
  readonly data: User_Insert_Input;
  readonly on_conflict?: Maybe<User_On_Conflict>;
};

/** on conflict condition type for table "User" */
export type User_On_Conflict = {
  readonly constraint: User_Constraint;
  readonly update_columns: ReadonlyArray<User_Update_Column>;
  readonly where?: Maybe<User_Bool_Exp>;
};

/** ordering options when selecting data from "User" */
export type User_Order_By = {
  readonly attendees_aggregate?: Maybe<Attendee_Aggregate_Order_By>;
  readonly chats_aggregate?: Maybe<Chat_Aggregate_Order_By>;
  readonly conferenceDemoCodes_aggregate?: Maybe<ConferenceDemoCode_Aggregate_Order_By>;
  readonly conferencesCreated_aggregate?: Maybe<Conference_Aggregate_Order_By>;
  readonly createdAt?: Maybe<Order_By>;
  readonly email?: Maybe<Order_By>;
  readonly emails_aggregate?: Maybe<Email_Aggregate_Order_By>;
  readonly firstName?: Maybe<Order_By>;
  readonly flaggedMessages_aggregate?: Maybe<FlaggedChatMessage_Aggregate_Order_By>;
  readonly followedChats_aggregate?: Maybe<FollowedChat_Aggregate_Order_By>;
  readonly id?: Maybe<Order_By>;
  readonly invitationsPendingConfirmation_aggregate?: Maybe<Invitation_Aggregate_Order_By>;
  readonly lastLoggedInAt?: Maybe<Order_By>;
  readonly lastName?: Maybe<Order_By>;
  readonly memberOfChats_aggregate?: Maybe<ChatMember_Aggregate_Order_By>;
  readonly onlineStatus?: Maybe<OnlineStatus_Order_By>;
  readonly pinnedChats_aggregate?: Maybe<PinnedChat_Aggregate_Order_By>;
  readonly reactions_aggregate?: Maybe<ChatReaction_Aggregate_Order_By>;
  readonly sentMessages_aggregate?: Maybe<ChatMessage_Aggregate_Order_By>;
  readonly typingInChats_aggregate?: Maybe<ChatTyper_Aggregate_Order_By>;
  readonly unreadIndices_aggregate?: Maybe<ChatUnreadIndex_Aggregate_Order_By>;
  readonly updatedAt?: Maybe<Order_By>;
  readonly viewingChats_aggregate?: Maybe<ChatViewer_Aggregate_Order_By>;
};

/** primary key columns input for table: "User" */
export type User_Pk_Columns_Input = {
  readonly id: Scalars['String'];
};

/** select columns of table "User" */
export enum User_Select_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Email = 'email',
  /** column name */
  FirstName = 'firstName',
  /** column name */
  Id = 'id',
  /** column name */
  LastLoggedInAt = 'lastLoggedInAt',
  /** column name */
  LastName = 'lastName',
  /** column name */
  UpdatedAt = 'updatedAt'
}

/** input type for updating data in table "User" */
export type User_Set_Input = {
  readonly createdAt?: Maybe<Scalars['timestamptz']>;
  readonly email?: Maybe<Scalars['String']>;
  readonly firstName?: Maybe<Scalars['String']>;
  readonly id?: Maybe<Scalars['String']>;
  readonly lastLoggedInAt?: Maybe<Scalars['timestamptz']>;
  readonly lastName?: Maybe<Scalars['String']>;
  readonly updatedAt?: Maybe<Scalars['timestamptz']>;
};

/** update columns of table "User" */
export enum User_Update_Column {
  /** column name */
  CreatedAt = 'createdAt',
  /** column name */
  Email = 'email',
  /** column name */
  FirstName = 'firstName',
  /** column name */
  Id = 'id',
  /** column name */
  LastLoggedInAt = 'lastLoggedInAt',
  /** column name */
  LastName = 'lastName',
  /** column name */
  UpdatedAt = 'updatedAt'
}


/** expression to compare columns of type json. All fields are combined with logical 'AND'. */
export type Json_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['json']>;
  readonly _gt?: Maybe<Scalars['json']>;
  readonly _gte?: Maybe<Scalars['json']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['json']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['json']>;
  readonly _lte?: Maybe<Scalars['json']>;
  readonly _neq?: Maybe<Scalars['json']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['json']>>;
};


/** expression to compare columns of type jsonb. All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  /** is the column contained in the given json value */
  readonly _contained_in?: Maybe<Scalars['jsonb']>;
  /** does the column contain the given json value at the top level */
  readonly _contains?: Maybe<Scalars['jsonb']>;
  readonly _eq?: Maybe<Scalars['jsonb']>;
  readonly _gt?: Maybe<Scalars['jsonb']>;
  readonly _gte?: Maybe<Scalars['jsonb']>;
  /** does the string exist as a top-level key in the column */
  readonly _has_key?: Maybe<Scalars['String']>;
  /** do all of these strings exist as top-level keys in the column */
  readonly _has_keys_all?: Maybe<ReadonlyArray<Scalars['String']>>;
  /** do any of these strings exist as top-level keys in the column */
  readonly _has_keys_any?: Maybe<ReadonlyArray<Scalars['String']>>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['jsonb']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['jsonb']>;
  readonly _lte?: Maybe<Scalars['jsonb']>;
  readonly _neq?: Maybe<Scalars['jsonb']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['jsonb']>>;
};

/** mutation root */
export type Mutation_Root = {
  readonly __typename?: 'mutation_root';
  /** delete data from the table: "Attendee" */
  readonly delete_Attendee?: Maybe<Attendee_Mutation_Response>;
  /** delete single row from the table: "Attendee" */
  readonly delete_Attendee_by_pk?: Maybe<Attendee>;
  /** delete data from the table: "Broadcast" */
  readonly delete_Broadcast?: Maybe<Broadcast_Mutation_Response>;
  /** delete data from the table: "BroadcastContentItem" */
  readonly delete_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
  /** delete single row from the table: "BroadcastContentItem" */
  readonly delete_BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
  /** delete single row from the table: "Broadcast" */
  readonly delete_Broadcast_by_pk?: Maybe<Broadcast>;
  /** delete data from the table: "Chat" */
  readonly delete_Chat?: Maybe<Chat_Mutation_Response>;
  /** delete data from the table: "ChatMember" */
  readonly delete_ChatMember?: Maybe<ChatMember_Mutation_Response>;
  /** delete single row from the table: "ChatMember" */
  readonly delete_ChatMember_by_pk?: Maybe<ChatMember>;
  /** delete data from the table: "ChatMessage" */
  readonly delete_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
  /** delete single row from the table: "ChatMessage" */
  readonly delete_ChatMessage_by_pk?: Maybe<ChatMessage>;
  /** delete data from the table: "ChatReaction" */
  readonly delete_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
  /** delete single row from the table: "ChatReaction" */
  readonly delete_ChatReaction_by_pk?: Maybe<ChatReaction>;
  /** delete data from the table: "ChatTyper" */
  readonly delete_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
  /** delete single row from the table: "ChatTyper" */
  readonly delete_ChatTyper_by_pk?: Maybe<ChatTyper>;
  /** delete data from the table: "ChatUnreadIndex" */
  readonly delete_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
  /** delete single row from the table: "ChatUnreadIndex" */
  readonly delete_ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
  /** delete data from the table: "ChatViewer" */
  readonly delete_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
  /** delete single row from the table: "ChatViewer" */
  readonly delete_ChatViewer_by_pk?: Maybe<ChatViewer>;
  /** delete single row from the table: "Chat" */
  readonly delete_Chat_by_pk?: Maybe<Chat>;
  /** delete data from the table: "Conference" */
  readonly delete_Conference?: Maybe<Conference_Mutation_Response>;
  /** delete data from the table: "ConferenceConfiguration" */
  readonly delete_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
  /** delete single row from the table: "ConferenceConfiguration" */
  readonly delete_ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
  /** delete data from the table: "ConferenceDemoCode" */
  readonly delete_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
  /** delete single row from the table: "ConferenceDemoCode" */
  readonly delete_ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
  /** delete single row from the table: "Conference" */
  readonly delete_Conference_by_pk?: Maybe<Conference>;
  /** delete data from the table: "ContentGroup" */
  readonly delete_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
  /** delete data from the table: "ContentGroupTag" */
  readonly delete_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
  /** delete single row from the table: "ContentGroupTag" */
  readonly delete_ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
  /** delete data from the table: "ContentGroupType" */
  readonly delete_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
  /** delete single row from the table: "ContentGroupType" */
  readonly delete_ContentGroupType_by_pk?: Maybe<ContentGroupType>;
  /** delete single row from the table: "ContentGroup" */
  readonly delete_ContentGroup_by_pk?: Maybe<ContentGroup>;
  /** delete data from the table: "ContentItem" */
  readonly delete_ContentItem?: Maybe<ContentItem_Mutation_Response>;
  /** delete data from the table: "ContentItemPerson" */
  readonly delete_ContentItemPerson?: Maybe<ContentItemPerson_Mutation_Response>;
  /** delete single row from the table: "ContentItemPerson" */
  readonly delete_ContentItemPerson_by_pk?: Maybe<ContentItemPerson>;
  /** delete single row from the table: "ContentItem" */
  readonly delete_ContentItem_by_pk?: Maybe<ContentItem>;
  /** delete data from the table: "ContentPerson" */
  readonly delete_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
  /** delete single row from the table: "ContentPerson" */
  readonly delete_ContentPerson_by_pk?: Maybe<ContentPerson>;
  /** delete data from the table: "ContentType" */
  readonly delete_ContentType?: Maybe<ContentType_Mutation_Response>;
  /** delete single row from the table: "ContentType" */
  readonly delete_ContentType_by_pk?: Maybe<ContentType>;
  /** delete data from the table: "Email" */
  readonly delete_Email?: Maybe<Email_Mutation_Response>;
  /** delete single row from the table: "Email" */
  readonly delete_Email_by_pk?: Maybe<Email>;
  /** delete data from the table: "Event" */
  readonly delete_Event?: Maybe<Event_Mutation_Response>;
  /** delete data from the table: "EventPerson" */
  readonly delete_EventPerson?: Maybe<EventPerson_Mutation_Response>;
  /** delete data from the table: "EventPersonRole" */
  readonly delete_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
  /** delete single row from the table: "EventPersonRole" */
  readonly delete_EventPersonRole_by_pk?: Maybe<EventPersonRole>;
  /** delete single row from the table: "EventPerson" */
  readonly delete_EventPerson_by_pk?: Maybe<EventPerson>;
  /** delete data from the table: "EventTag" */
  readonly delete_EventTag?: Maybe<EventTag_Mutation_Response>;
  /** delete single row from the table: "EventTag" */
  readonly delete_EventTag_by_pk?: Maybe<EventTag>;
  /** delete single row from the table: "Event" */
  readonly delete_Event_by_pk?: Maybe<Event>;
  /** delete data from the table: "ExecutedTransitions" */
  readonly delete_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
  /** delete single row from the table: "ExecutedTransitions" */
  readonly delete_ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
  /** delete data from the table: "FlaggedChatMessage" */
  readonly delete_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
  /** delete single row from the table: "FlaggedChatMessage" */
  readonly delete_FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
  /** delete data from the table: "FollowedChat" */
  readonly delete_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
  /** delete single row from the table: "FollowedChat" */
  readonly delete_FollowedChat_by_pk?: Maybe<FollowedChat>;
  /** delete data from the table: "Group" */
  readonly delete_Group?: Maybe<Group_Mutation_Response>;
  /** delete data from the table: "GroupAttendee" */
  readonly delete_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
  /** delete single row from the table: "GroupAttendee" */
  readonly delete_GroupAttendee_by_pk?: Maybe<GroupAttendee>;
  /** delete data from the table: "GroupRole" */
  readonly delete_GroupRole?: Maybe<GroupRole_Mutation_Response>;
  /** delete single row from the table: "GroupRole" */
  readonly delete_GroupRole_by_pk?: Maybe<GroupRole>;
  /** delete single row from the table: "Group" */
  readonly delete_Group_by_pk?: Maybe<Group>;
  /** delete data from the table: "InputType" */
  readonly delete_InputType?: Maybe<InputType_Mutation_Response>;
  /** delete single row from the table: "InputType" */
  readonly delete_InputType_by_pk?: Maybe<InputType>;
  /** delete data from the table: "Invitation" */
  readonly delete_Invitation?: Maybe<Invitation_Mutation_Response>;
  /** delete single row from the table: "Invitation" */
  readonly delete_Invitation_by_pk?: Maybe<Invitation>;
  /** delete data from the table: "OnlineStatus" */
  readonly delete_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
  /** delete single row from the table: "OnlineStatus" */
  readonly delete_OnlineStatus_by_pk?: Maybe<OnlineStatus>;
  /** delete data from the table: "OriginatingData" */
  readonly delete_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
  /** delete single row from the table: "OriginatingData" */
  readonly delete_OriginatingData_by_pk?: Maybe<OriginatingData>;
  /** delete data from the table: "Permission" */
  readonly delete_Permission?: Maybe<Permission_Mutation_Response>;
  /** delete single row from the table: "Permission" */
  readonly delete_Permission_by_pk?: Maybe<Permission>;
  /** delete data from the table: "PinnedChat" */
  readonly delete_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
  /** delete single row from the table: "PinnedChat" */
  readonly delete_PinnedChat_by_pk?: Maybe<PinnedChat>;
  /** delete data from the table: "RequiredContentItem" */
  readonly delete_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
  /** delete single row from the table: "RequiredContentItem" */
  readonly delete_RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
  /** delete data from the table: "Role" */
  readonly delete_Role?: Maybe<Role_Mutation_Response>;
  /** delete data from the table: "RolePermission" */
  readonly delete_RolePermission?: Maybe<RolePermission_Mutation_Response>;
  /** delete single row from the table: "RolePermission" */
  readonly delete_RolePermission_by_pk?: Maybe<RolePermission>;
  /** delete single row from the table: "Role" */
  readonly delete_Role_by_pk?: Maybe<Role>;
  /** delete data from the table: "Room" */
  readonly delete_Room?: Maybe<Room_Mutation_Response>;
  /** delete data from the table: "RoomMode" */
  readonly delete_RoomMode?: Maybe<RoomMode_Mutation_Response>;
  /** delete single row from the table: "RoomMode" */
  readonly delete_RoomMode_by_pk?: Maybe<RoomMode>;
  /** delete data from the table: "RoomParticipant" */
  readonly delete_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
  /** delete single row from the table: "RoomParticipant" */
  readonly delete_RoomParticipant_by_pk?: Maybe<RoomParticipant>;
  /** delete single row from the table: "Room" */
  readonly delete_Room_by_pk?: Maybe<Room>;
  /** delete data from the table: "Tag" */
  readonly delete_Tag?: Maybe<Tag_Mutation_Response>;
  /** delete single row from the table: "Tag" */
  readonly delete_Tag_by_pk?: Maybe<Tag>;
  /** delete data from the table: "Transitions" */
  readonly delete_Transitions?: Maybe<Transitions_Mutation_Response>;
  /** delete single row from the table: "Transitions" */
  readonly delete_Transitions_by_pk?: Maybe<Transitions>;
  /** delete data from the table: "Uploader" */
  readonly delete_Uploader?: Maybe<Uploader_Mutation_Response>;
  /** delete single row from the table: "Uploader" */
  readonly delete_Uploader_by_pk?: Maybe<Uploader>;
  /** delete data from the table: "User" */
  readonly delete_User?: Maybe<User_Mutation_Response>;
  /** delete single row from the table: "User" */
  readonly delete_User_by_pk?: Maybe<User>;
  /** insert data into the table: "Attendee" */
  readonly insert_Attendee?: Maybe<Attendee_Mutation_Response>;
  /** insert a single row into the table: "Attendee" */
  readonly insert_Attendee_one?: Maybe<Attendee>;
  /** insert data into the table: "Broadcast" */
  readonly insert_Broadcast?: Maybe<Broadcast_Mutation_Response>;
  /** insert data into the table: "BroadcastContentItem" */
  readonly insert_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
  /** insert a single row into the table: "BroadcastContentItem" */
  readonly insert_BroadcastContentItem_one?: Maybe<BroadcastContentItem>;
  /** insert a single row into the table: "Broadcast" */
  readonly insert_Broadcast_one?: Maybe<Broadcast>;
  /** insert data into the table: "Chat" */
  readonly insert_Chat?: Maybe<Chat_Mutation_Response>;
  /** insert data into the table: "ChatMember" */
  readonly insert_ChatMember?: Maybe<ChatMember_Mutation_Response>;
  /** insert a single row into the table: "ChatMember" */
  readonly insert_ChatMember_one?: Maybe<ChatMember>;
  /** insert data into the table: "ChatMessage" */
  readonly insert_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
  /** insert a single row into the table: "ChatMessage" */
  readonly insert_ChatMessage_one?: Maybe<ChatMessage>;
  /** insert data into the table: "ChatReaction" */
  readonly insert_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
  /** insert a single row into the table: "ChatReaction" */
  readonly insert_ChatReaction_one?: Maybe<ChatReaction>;
  /** insert data into the table: "ChatTyper" */
  readonly insert_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
  /** insert a single row into the table: "ChatTyper" */
  readonly insert_ChatTyper_one?: Maybe<ChatTyper>;
  /** insert data into the table: "ChatUnreadIndex" */
  readonly insert_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
  /** insert a single row into the table: "ChatUnreadIndex" */
  readonly insert_ChatUnreadIndex_one?: Maybe<ChatUnreadIndex>;
  /** insert data into the table: "ChatViewer" */
  readonly insert_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
  /** insert a single row into the table: "ChatViewer" */
  readonly insert_ChatViewer_one?: Maybe<ChatViewer>;
  /** insert a single row into the table: "Chat" */
  readonly insert_Chat_one?: Maybe<Chat>;
  /** insert data into the table: "Conference" */
  readonly insert_Conference?: Maybe<Conference_Mutation_Response>;
  /** insert data into the table: "ConferenceConfiguration" */
  readonly insert_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
  /** insert a single row into the table: "ConferenceConfiguration" */
  readonly insert_ConferenceConfiguration_one?: Maybe<ConferenceConfiguration>;
  /** insert data into the table: "ConferenceDemoCode" */
  readonly insert_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
  /** insert a single row into the table: "ConferenceDemoCode" */
  readonly insert_ConferenceDemoCode_one?: Maybe<ConferenceDemoCode>;
  /** insert a single row into the table: "Conference" */
  readonly insert_Conference_one?: Maybe<Conference>;
  /** insert data into the table: "ContentGroup" */
  readonly insert_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
  /** insert data into the table: "ContentGroupTag" */
  readonly insert_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
  /** insert a single row into the table: "ContentGroupTag" */
  readonly insert_ContentGroupTag_one?: Maybe<ContentGroupTag>;
  /** insert data into the table: "ContentGroupType" */
  readonly insert_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
  /** insert a single row into the table: "ContentGroupType" */
  readonly insert_ContentGroupType_one?: Maybe<ContentGroupType>;
  /** insert a single row into the table: "ContentGroup" */
  readonly insert_ContentGroup_one?: Maybe<ContentGroup>;
  /** insert data into the table: "ContentItem" */
  readonly insert_ContentItem?: Maybe<ContentItem_Mutation_Response>;
  /** insert data into the table: "ContentItemPerson" */
  readonly insert_ContentItemPerson?: Maybe<ContentItemPerson_Mutation_Response>;
  /** insert a single row into the table: "ContentItemPerson" */
  readonly insert_ContentItemPerson_one?: Maybe<ContentItemPerson>;
  /** insert a single row into the table: "ContentItem" */
  readonly insert_ContentItem_one?: Maybe<ContentItem>;
  /** insert data into the table: "ContentPerson" */
  readonly insert_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
  /** insert a single row into the table: "ContentPerson" */
  readonly insert_ContentPerson_one?: Maybe<ContentPerson>;
  /** insert data into the table: "ContentType" */
  readonly insert_ContentType?: Maybe<ContentType_Mutation_Response>;
  /** insert a single row into the table: "ContentType" */
  readonly insert_ContentType_one?: Maybe<ContentType>;
  /** insert data into the table: "Email" */
  readonly insert_Email?: Maybe<Email_Mutation_Response>;
  /** insert a single row into the table: "Email" */
  readonly insert_Email_one?: Maybe<Email>;
  /** insert data into the table: "Event" */
  readonly insert_Event?: Maybe<Event_Mutation_Response>;
  /** insert data into the table: "EventPerson" */
  readonly insert_EventPerson?: Maybe<EventPerson_Mutation_Response>;
  /** insert data into the table: "EventPersonRole" */
  readonly insert_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
  /** insert a single row into the table: "EventPersonRole" */
  readonly insert_EventPersonRole_one?: Maybe<EventPersonRole>;
  /** insert a single row into the table: "EventPerson" */
  readonly insert_EventPerson_one?: Maybe<EventPerson>;
  /** insert data into the table: "EventTag" */
  readonly insert_EventTag?: Maybe<EventTag_Mutation_Response>;
  /** insert a single row into the table: "EventTag" */
  readonly insert_EventTag_one?: Maybe<EventTag>;
  /** insert a single row into the table: "Event" */
  readonly insert_Event_one?: Maybe<Event>;
  /** insert data into the table: "ExecutedTransitions" */
  readonly insert_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
  /** insert a single row into the table: "ExecutedTransitions" */
  readonly insert_ExecutedTransitions_one?: Maybe<ExecutedTransitions>;
  /** insert data into the table: "FlaggedChatMessage" */
  readonly insert_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
  /** insert a single row into the table: "FlaggedChatMessage" */
  readonly insert_FlaggedChatMessage_one?: Maybe<FlaggedChatMessage>;
  /** insert data into the table: "FollowedChat" */
  readonly insert_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
  /** insert a single row into the table: "FollowedChat" */
  readonly insert_FollowedChat_one?: Maybe<FollowedChat>;
  /** insert data into the table: "Group" */
  readonly insert_Group?: Maybe<Group_Mutation_Response>;
  /** insert data into the table: "GroupAttendee" */
  readonly insert_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
  /** insert a single row into the table: "GroupAttendee" */
  readonly insert_GroupAttendee_one?: Maybe<GroupAttendee>;
  /** insert data into the table: "GroupRole" */
  readonly insert_GroupRole?: Maybe<GroupRole_Mutation_Response>;
  /** insert a single row into the table: "GroupRole" */
  readonly insert_GroupRole_one?: Maybe<GroupRole>;
  /** insert a single row into the table: "Group" */
  readonly insert_Group_one?: Maybe<Group>;
  /** insert data into the table: "InputType" */
  readonly insert_InputType?: Maybe<InputType_Mutation_Response>;
  /** insert a single row into the table: "InputType" */
  readonly insert_InputType_one?: Maybe<InputType>;
  /** insert data into the table: "Invitation" */
  readonly insert_Invitation?: Maybe<Invitation_Mutation_Response>;
  /** insert a single row into the table: "Invitation" */
  readonly insert_Invitation_one?: Maybe<Invitation>;
  /** insert data into the table: "OnlineStatus" */
  readonly insert_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
  /** insert a single row into the table: "OnlineStatus" */
  readonly insert_OnlineStatus_one?: Maybe<OnlineStatus>;
  /** insert data into the table: "OriginatingData" */
  readonly insert_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
  /** insert a single row into the table: "OriginatingData" */
  readonly insert_OriginatingData_one?: Maybe<OriginatingData>;
  /** insert data into the table: "Permission" */
  readonly insert_Permission?: Maybe<Permission_Mutation_Response>;
  /** insert a single row into the table: "Permission" */
  readonly insert_Permission_one?: Maybe<Permission>;
  /** insert data into the table: "PinnedChat" */
  readonly insert_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
  /** insert a single row into the table: "PinnedChat" */
  readonly insert_PinnedChat_one?: Maybe<PinnedChat>;
  /** insert data into the table: "RequiredContentItem" */
  readonly insert_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
  /** insert a single row into the table: "RequiredContentItem" */
  readonly insert_RequiredContentItem_one?: Maybe<RequiredContentItem>;
  /** insert data into the table: "Role" */
  readonly insert_Role?: Maybe<Role_Mutation_Response>;
  /** insert data into the table: "RolePermission" */
  readonly insert_RolePermission?: Maybe<RolePermission_Mutation_Response>;
  /** insert a single row into the table: "RolePermission" */
  readonly insert_RolePermission_one?: Maybe<RolePermission>;
  /** insert a single row into the table: "Role" */
  readonly insert_Role_one?: Maybe<Role>;
  /** insert data into the table: "Room" */
  readonly insert_Room?: Maybe<Room_Mutation_Response>;
  /** insert data into the table: "RoomMode" */
  readonly insert_RoomMode?: Maybe<RoomMode_Mutation_Response>;
  /** insert a single row into the table: "RoomMode" */
  readonly insert_RoomMode_one?: Maybe<RoomMode>;
  /** insert data into the table: "RoomParticipant" */
  readonly insert_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
  /** insert a single row into the table: "RoomParticipant" */
  readonly insert_RoomParticipant_one?: Maybe<RoomParticipant>;
  /** insert a single row into the table: "Room" */
  readonly insert_Room_one?: Maybe<Room>;
  /** insert data into the table: "Tag" */
  readonly insert_Tag?: Maybe<Tag_Mutation_Response>;
  /** insert a single row into the table: "Tag" */
  readonly insert_Tag_one?: Maybe<Tag>;
  /** insert data into the table: "Transitions" */
  readonly insert_Transitions?: Maybe<Transitions_Mutation_Response>;
  /** insert a single row into the table: "Transitions" */
  readonly insert_Transitions_one?: Maybe<Transitions>;
  /** insert data into the table: "Uploader" */
  readonly insert_Uploader?: Maybe<Uploader_Mutation_Response>;
  /** insert a single row into the table: "Uploader" */
  readonly insert_Uploader_one?: Maybe<Uploader>;
  /** insert data into the table: "User" */
  readonly insert_User?: Maybe<User_Mutation_Response>;
  /** insert a single row into the table: "User" */
  readonly insert_User_one?: Maybe<User>;
  /** perform the action: "invitationConfirmCurrent" */
  readonly invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
  /** perform the action: "invitationConfirmSendInitialEmail" */
  readonly invitationConfirmSendInitialEmail?: Maybe<InvitationConfirmationEmailOutput>;
  /** perform the action: "invitationConfirmSendRepeatEmail" */
  readonly invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
  /** perform the action: "invitationConfirmWithCode" */
  readonly invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
  /** perform the action: "invitationSendInitialEmail" */
  readonly invitationSendInitialEmail: ReadonlyArray<InvitationSendEmailResult>;
  /** perform the action: "invitationSendRepeatEmail" */
  readonly invitationSendRepeatEmail: ReadonlyArray<InvitationSendEmailResult>;
  /** perform the action: "submitContentItem" */
  readonly submitContentItem?: Maybe<SubmitContentItemOutput>;
  /** update data of the table: "Attendee" */
  readonly update_Attendee?: Maybe<Attendee_Mutation_Response>;
  /** update single row of the table: "Attendee" */
  readonly update_Attendee_by_pk?: Maybe<Attendee>;
  /** update data of the table: "Broadcast" */
  readonly update_Broadcast?: Maybe<Broadcast_Mutation_Response>;
  /** update data of the table: "BroadcastContentItem" */
  readonly update_BroadcastContentItem?: Maybe<BroadcastContentItem_Mutation_Response>;
  /** update single row of the table: "BroadcastContentItem" */
  readonly update_BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
  /** update single row of the table: "Broadcast" */
  readonly update_Broadcast_by_pk?: Maybe<Broadcast>;
  /** update data of the table: "Chat" */
  readonly update_Chat?: Maybe<Chat_Mutation_Response>;
  /** update data of the table: "ChatMember" */
  readonly update_ChatMember?: Maybe<ChatMember_Mutation_Response>;
  /** update single row of the table: "ChatMember" */
  readonly update_ChatMember_by_pk?: Maybe<ChatMember>;
  /** update data of the table: "ChatMessage" */
  readonly update_ChatMessage?: Maybe<ChatMessage_Mutation_Response>;
  /** update single row of the table: "ChatMessage" */
  readonly update_ChatMessage_by_pk?: Maybe<ChatMessage>;
  /** update data of the table: "ChatReaction" */
  readonly update_ChatReaction?: Maybe<ChatReaction_Mutation_Response>;
  /** update single row of the table: "ChatReaction" */
  readonly update_ChatReaction_by_pk?: Maybe<ChatReaction>;
  /** update data of the table: "ChatTyper" */
  readonly update_ChatTyper?: Maybe<ChatTyper_Mutation_Response>;
  /** update single row of the table: "ChatTyper" */
  readonly update_ChatTyper_by_pk?: Maybe<ChatTyper>;
  /** update data of the table: "ChatUnreadIndex" */
  readonly update_ChatUnreadIndex?: Maybe<ChatUnreadIndex_Mutation_Response>;
  /** update single row of the table: "ChatUnreadIndex" */
  readonly update_ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
  /** update data of the table: "ChatViewer" */
  readonly update_ChatViewer?: Maybe<ChatViewer_Mutation_Response>;
  /** update single row of the table: "ChatViewer" */
  readonly update_ChatViewer_by_pk?: Maybe<ChatViewer>;
  /** update single row of the table: "Chat" */
  readonly update_Chat_by_pk?: Maybe<Chat>;
  /** update data of the table: "Conference" */
  readonly update_Conference?: Maybe<Conference_Mutation_Response>;
  /** update data of the table: "ConferenceConfiguration" */
  readonly update_ConferenceConfiguration?: Maybe<ConferenceConfiguration_Mutation_Response>;
  /** update single row of the table: "ConferenceConfiguration" */
  readonly update_ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
  /** update data of the table: "ConferenceDemoCode" */
  readonly update_ConferenceDemoCode?: Maybe<ConferenceDemoCode_Mutation_Response>;
  /** update single row of the table: "ConferenceDemoCode" */
  readonly update_ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
  /** update single row of the table: "Conference" */
  readonly update_Conference_by_pk?: Maybe<Conference>;
  /** update data of the table: "ContentGroup" */
  readonly update_ContentGroup?: Maybe<ContentGroup_Mutation_Response>;
  /** update data of the table: "ContentGroupTag" */
  readonly update_ContentGroupTag?: Maybe<ContentGroupTag_Mutation_Response>;
  /** update single row of the table: "ContentGroupTag" */
  readonly update_ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
  /** update data of the table: "ContentGroupType" */
  readonly update_ContentGroupType?: Maybe<ContentGroupType_Mutation_Response>;
  /** update single row of the table: "ContentGroupType" */
  readonly update_ContentGroupType_by_pk?: Maybe<ContentGroupType>;
  /** update single row of the table: "ContentGroup" */
  readonly update_ContentGroup_by_pk?: Maybe<ContentGroup>;
  /** update data of the table: "ContentItem" */
  readonly update_ContentItem?: Maybe<ContentItem_Mutation_Response>;
  /** update data of the table: "ContentItemPerson" */
  readonly update_ContentItemPerson?: Maybe<ContentItemPerson_Mutation_Response>;
  /** update single row of the table: "ContentItemPerson" */
  readonly update_ContentItemPerson_by_pk?: Maybe<ContentItemPerson>;
  /** update single row of the table: "ContentItem" */
  readonly update_ContentItem_by_pk?: Maybe<ContentItem>;
  /** update data of the table: "ContentPerson" */
  readonly update_ContentPerson?: Maybe<ContentPerson_Mutation_Response>;
  /** update single row of the table: "ContentPerson" */
  readonly update_ContentPerson_by_pk?: Maybe<ContentPerson>;
  /** update data of the table: "ContentType" */
  readonly update_ContentType?: Maybe<ContentType_Mutation_Response>;
  /** update single row of the table: "ContentType" */
  readonly update_ContentType_by_pk?: Maybe<ContentType>;
  /** update data of the table: "Email" */
  readonly update_Email?: Maybe<Email_Mutation_Response>;
  /** update single row of the table: "Email" */
  readonly update_Email_by_pk?: Maybe<Email>;
  /** update data of the table: "Event" */
  readonly update_Event?: Maybe<Event_Mutation_Response>;
  /** update data of the table: "EventPerson" */
  readonly update_EventPerson?: Maybe<EventPerson_Mutation_Response>;
  /** update data of the table: "EventPersonRole" */
  readonly update_EventPersonRole?: Maybe<EventPersonRole_Mutation_Response>;
  /** update single row of the table: "EventPersonRole" */
  readonly update_EventPersonRole_by_pk?: Maybe<EventPersonRole>;
  /** update single row of the table: "EventPerson" */
  readonly update_EventPerson_by_pk?: Maybe<EventPerson>;
  /** update data of the table: "EventTag" */
  readonly update_EventTag?: Maybe<EventTag_Mutation_Response>;
  /** update single row of the table: "EventTag" */
  readonly update_EventTag_by_pk?: Maybe<EventTag>;
  /** update single row of the table: "Event" */
  readonly update_Event_by_pk?: Maybe<Event>;
  /** update data of the table: "ExecutedTransitions" */
  readonly update_ExecutedTransitions?: Maybe<ExecutedTransitions_Mutation_Response>;
  /** update single row of the table: "ExecutedTransitions" */
  readonly update_ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
  /** update data of the table: "FlaggedChatMessage" */
  readonly update_FlaggedChatMessage?: Maybe<FlaggedChatMessage_Mutation_Response>;
  /** update single row of the table: "FlaggedChatMessage" */
  readonly update_FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
  /** update data of the table: "FollowedChat" */
  readonly update_FollowedChat?: Maybe<FollowedChat_Mutation_Response>;
  /** update single row of the table: "FollowedChat" */
  readonly update_FollowedChat_by_pk?: Maybe<FollowedChat>;
  /** update data of the table: "Group" */
  readonly update_Group?: Maybe<Group_Mutation_Response>;
  /** update data of the table: "GroupAttendee" */
  readonly update_GroupAttendee?: Maybe<GroupAttendee_Mutation_Response>;
  /** update single row of the table: "GroupAttendee" */
  readonly update_GroupAttendee_by_pk?: Maybe<GroupAttendee>;
  /** update data of the table: "GroupRole" */
  readonly update_GroupRole?: Maybe<GroupRole_Mutation_Response>;
  /** update single row of the table: "GroupRole" */
  readonly update_GroupRole_by_pk?: Maybe<GroupRole>;
  /** update single row of the table: "Group" */
  readonly update_Group_by_pk?: Maybe<Group>;
  /** update data of the table: "InputType" */
  readonly update_InputType?: Maybe<InputType_Mutation_Response>;
  /** update single row of the table: "InputType" */
  readonly update_InputType_by_pk?: Maybe<InputType>;
  /** update data of the table: "Invitation" */
  readonly update_Invitation?: Maybe<Invitation_Mutation_Response>;
  /** update single row of the table: "Invitation" */
  readonly update_Invitation_by_pk?: Maybe<Invitation>;
  /** update data of the table: "OnlineStatus" */
  readonly update_OnlineStatus?: Maybe<OnlineStatus_Mutation_Response>;
  /** update single row of the table: "OnlineStatus" */
  readonly update_OnlineStatus_by_pk?: Maybe<OnlineStatus>;
  /** update data of the table: "OriginatingData" */
  readonly update_OriginatingData?: Maybe<OriginatingData_Mutation_Response>;
  /** update single row of the table: "OriginatingData" */
  readonly update_OriginatingData_by_pk?: Maybe<OriginatingData>;
  /** update data of the table: "Permission" */
  readonly update_Permission?: Maybe<Permission_Mutation_Response>;
  /** update single row of the table: "Permission" */
  readonly update_Permission_by_pk?: Maybe<Permission>;
  /** update data of the table: "PinnedChat" */
  readonly update_PinnedChat?: Maybe<PinnedChat_Mutation_Response>;
  /** update single row of the table: "PinnedChat" */
  readonly update_PinnedChat_by_pk?: Maybe<PinnedChat>;
  /** update data of the table: "RequiredContentItem" */
  readonly update_RequiredContentItem?: Maybe<RequiredContentItem_Mutation_Response>;
  /** update single row of the table: "RequiredContentItem" */
  readonly update_RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
  /** update data of the table: "Role" */
  readonly update_Role?: Maybe<Role_Mutation_Response>;
  /** update data of the table: "RolePermission" */
  readonly update_RolePermission?: Maybe<RolePermission_Mutation_Response>;
  /** update single row of the table: "RolePermission" */
  readonly update_RolePermission_by_pk?: Maybe<RolePermission>;
  /** update single row of the table: "Role" */
  readonly update_Role_by_pk?: Maybe<Role>;
  /** update data of the table: "Room" */
  readonly update_Room?: Maybe<Room_Mutation_Response>;
  /** update data of the table: "RoomMode" */
  readonly update_RoomMode?: Maybe<RoomMode_Mutation_Response>;
  /** update single row of the table: "RoomMode" */
  readonly update_RoomMode_by_pk?: Maybe<RoomMode>;
  /** update data of the table: "RoomParticipant" */
  readonly update_RoomParticipant?: Maybe<RoomParticipant_Mutation_Response>;
  /** update single row of the table: "RoomParticipant" */
  readonly update_RoomParticipant_by_pk?: Maybe<RoomParticipant>;
  /** update single row of the table: "Room" */
  readonly update_Room_by_pk?: Maybe<Room>;
  /** update data of the table: "Tag" */
  readonly update_Tag?: Maybe<Tag_Mutation_Response>;
  /** update single row of the table: "Tag" */
  readonly update_Tag_by_pk?: Maybe<Tag>;
  /** update data of the table: "Transitions" */
  readonly update_Transitions?: Maybe<Transitions_Mutation_Response>;
  /** update single row of the table: "Transitions" */
  readonly update_Transitions_by_pk?: Maybe<Transitions>;
  /** update data of the table: "Uploader" */
  readonly update_Uploader?: Maybe<Uploader_Mutation_Response>;
  /** update single row of the table: "Uploader" */
  readonly update_Uploader_by_pk?: Maybe<Uploader>;
  /** update data of the table: "User" */
  readonly update_User?: Maybe<User_Mutation_Response>;
  /** update single row of the table: "User" */
  readonly update_User_by_pk?: Maybe<User>;
};


/** mutation root */
export type Mutation_RootDelete_AttendeeArgs = {
  where: Attendee_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Attendee_By_PkArgs = {
  id: Scalars['uuid'];
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
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Broadcast_By_PkArgs = {
  id: Scalars['uuid'];
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
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ChatMessageArgs = {
  where: ChatMessage_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ChatReactionArgs = {
  where: ChatReaction_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ChatReaction_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ChatTyperArgs = {
  where: ChatTyper_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ChatTyper_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ChatUnreadIndexArgs = {
  where: ChatUnreadIndex_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ChatUnreadIndex_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ChatViewerArgs = {
  where: ChatViewer_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ChatViewer_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Chat_By_PkArgs = {
  id: Scalars['uuid'];
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
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ConferenceDemoCodeArgs = {
  where: ConferenceDemoCode_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ConferenceDemoCode_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Conference_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentGroupArgs = {
  where: ContentGroup_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentGroupTagArgs = {
  where: ContentGroupTag_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentGroupTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentGroupTypeArgs = {
  where: ContentGroupType_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentGroupType_By_PkArgs = {
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_ContentGroup_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentItemArgs = {
  where: ContentItem_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentItemPersonArgs = {
  where: ContentItemPerson_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentItemPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentPersonArgs = {
  where: ContentPerson_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ContentTypeArgs = {
  where: ContentType_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ContentType_By_PkArgs = {
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_EmailArgs = {
  where: Email_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Email_By_PkArgs = {
  id: Scalars['uuid'];
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
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_EventPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_EventTagArgs = {
  where: EventTag_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_EventTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Event_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_ExecutedTransitionsArgs = {
  where: ExecutedTransitions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_ExecutedTransitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_FlaggedChatMessageArgs = {
  where: FlaggedChatMessage_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_FlaggedChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_FollowedChatArgs = {
  where: FollowedChat_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_FollowedChat_By_PkArgs = {
  id: Scalars['uuid'];
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
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_GroupRoleArgs = {
  where: GroupRole_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_GroupRole_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Group_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_InputTypeArgs = {
  where: InputType_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_InputType_By_PkArgs = {
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_InvitationArgs = {
  where: Invitation_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Invitation_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_OnlineStatusArgs = {
  where: OnlineStatus_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_OnlineStatus_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_OriginatingDataArgs = {
  where: OriginatingData_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_OriginatingData_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_PermissionArgs = {
  where: Permission_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Permission_By_PkArgs = {
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_PinnedChatArgs = {
  where: PinnedChat_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_PinnedChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_RequiredContentItemArgs = {
  where: RequiredContentItem_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_RequiredContentItem_By_PkArgs = {
  id: Scalars['uuid'];
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
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Role_By_PkArgs = {
  id: Scalars['uuid'];
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
  name: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_RoomParticipantArgs = {
  where: RoomParticipant_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_RoomParticipant_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Room_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_TagArgs = {
  where: Tag_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Tag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_TransitionsArgs = {
  where: Transitions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Transitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_UploaderArgs = {
  where: Uploader_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Uploader_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_UserArgs = {
  where: User_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_User_By_PkArgs = {
  id: Scalars['String'];
};


/** mutation root */
export type Mutation_RootInsert_AttendeeArgs = {
  objects: ReadonlyArray<Attendee_Insert_Input>;
  on_conflict?: Maybe<Attendee_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Attendee_OneArgs = {
  object: Attendee_Insert_Input;
  on_conflict?: Maybe<Attendee_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_BroadcastArgs = {
  objects: ReadonlyArray<Broadcast_Insert_Input>;
  on_conflict?: Maybe<Broadcast_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_BroadcastContentItemArgs = {
  objects: ReadonlyArray<BroadcastContentItem_Insert_Input>;
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
  objects: ReadonlyArray<Chat_Insert_Input>;
  on_conflict?: Maybe<Chat_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatMemberArgs = {
  objects: ReadonlyArray<ChatMember_Insert_Input>;
  on_conflict?: Maybe<ChatMember_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatMember_OneArgs = {
  object: ChatMember_Insert_Input;
  on_conflict?: Maybe<ChatMember_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatMessageArgs = {
  objects: ReadonlyArray<ChatMessage_Insert_Input>;
  on_conflict?: Maybe<ChatMessage_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatMessage_OneArgs = {
  object: ChatMessage_Insert_Input;
  on_conflict?: Maybe<ChatMessage_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatReactionArgs = {
  objects: ReadonlyArray<ChatReaction_Insert_Input>;
  on_conflict?: Maybe<ChatReaction_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatReaction_OneArgs = {
  object: ChatReaction_Insert_Input;
  on_conflict?: Maybe<ChatReaction_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatTyperArgs = {
  objects: ReadonlyArray<ChatTyper_Insert_Input>;
  on_conflict?: Maybe<ChatTyper_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatTyper_OneArgs = {
  object: ChatTyper_Insert_Input;
  on_conflict?: Maybe<ChatTyper_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatUnreadIndexArgs = {
  objects: ReadonlyArray<ChatUnreadIndex_Insert_Input>;
  on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatUnreadIndex_OneArgs = {
  object: ChatUnreadIndex_Insert_Input;
  on_conflict?: Maybe<ChatUnreadIndex_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ChatViewerArgs = {
  objects: ReadonlyArray<ChatViewer_Insert_Input>;
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
  objects: ReadonlyArray<Conference_Insert_Input>;
  on_conflict?: Maybe<Conference_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ConferenceConfigurationArgs = {
  objects: ReadonlyArray<ConferenceConfiguration_Insert_Input>;
  on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ConferenceConfiguration_OneArgs = {
  object: ConferenceConfiguration_Insert_Input;
  on_conflict?: Maybe<ConferenceConfiguration_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ConferenceDemoCodeArgs = {
  objects: ReadonlyArray<ConferenceDemoCode_Insert_Input>;
  on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ConferenceDemoCode_OneArgs = {
  object: ConferenceDemoCode_Insert_Input;
  on_conflict?: Maybe<ConferenceDemoCode_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Conference_OneArgs = {
  object: Conference_Insert_Input;
  on_conflict?: Maybe<Conference_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentGroupArgs = {
  objects: ReadonlyArray<ContentGroup_Insert_Input>;
  on_conflict?: Maybe<ContentGroup_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentGroupTagArgs = {
  objects: ReadonlyArray<ContentGroupTag_Insert_Input>;
  on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentGroupTag_OneArgs = {
  object: ContentGroupTag_Insert_Input;
  on_conflict?: Maybe<ContentGroupTag_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentGroupTypeArgs = {
  objects: ReadonlyArray<ContentGroupType_Insert_Input>;
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
  objects: ReadonlyArray<ContentItem_Insert_Input>;
  on_conflict?: Maybe<ContentItem_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentItemPersonArgs = {
  objects: ReadonlyArray<ContentItemPerson_Insert_Input>;
  on_conflict?: Maybe<ContentItemPerson_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentItemPerson_OneArgs = {
  object: ContentItemPerson_Insert_Input;
  on_conflict?: Maybe<ContentItemPerson_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentItem_OneArgs = {
  object: ContentItem_Insert_Input;
  on_conflict?: Maybe<ContentItem_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentPersonArgs = {
  objects: ReadonlyArray<ContentPerson_Insert_Input>;
  on_conflict?: Maybe<ContentPerson_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentPerson_OneArgs = {
  object: ContentPerson_Insert_Input;
  on_conflict?: Maybe<ContentPerson_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentTypeArgs = {
  objects: ReadonlyArray<ContentType_Insert_Input>;
  on_conflict?: Maybe<ContentType_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ContentType_OneArgs = {
  object: ContentType_Insert_Input;
  on_conflict?: Maybe<ContentType_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_EmailArgs = {
  objects: ReadonlyArray<Email_Insert_Input>;
  on_conflict?: Maybe<Email_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Email_OneArgs = {
  object: Email_Insert_Input;
  on_conflict?: Maybe<Email_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_EventArgs = {
  objects: ReadonlyArray<Event_Insert_Input>;
  on_conflict?: Maybe<Event_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_EventPersonArgs = {
  objects: ReadonlyArray<EventPerson_Insert_Input>;
  on_conflict?: Maybe<EventPerson_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_EventPersonRoleArgs = {
  objects: ReadonlyArray<EventPersonRole_Insert_Input>;
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
  objects: ReadonlyArray<EventTag_Insert_Input>;
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
  objects: ReadonlyArray<ExecutedTransitions_Insert_Input>;
  on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ExecutedTransitions_OneArgs = {
  object: ExecutedTransitions_Insert_Input;
  on_conflict?: Maybe<ExecutedTransitions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_FlaggedChatMessageArgs = {
  objects: ReadonlyArray<FlaggedChatMessage_Insert_Input>;
  on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_FlaggedChatMessage_OneArgs = {
  object: FlaggedChatMessage_Insert_Input;
  on_conflict?: Maybe<FlaggedChatMessage_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_FollowedChatArgs = {
  objects: ReadonlyArray<FollowedChat_Insert_Input>;
  on_conflict?: Maybe<FollowedChat_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_FollowedChat_OneArgs = {
  object: FollowedChat_Insert_Input;
  on_conflict?: Maybe<FollowedChat_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_GroupArgs = {
  objects: ReadonlyArray<Group_Insert_Input>;
  on_conflict?: Maybe<Group_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_GroupAttendeeArgs = {
  objects: ReadonlyArray<GroupAttendee_Insert_Input>;
  on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_GroupAttendee_OneArgs = {
  object: GroupAttendee_Insert_Input;
  on_conflict?: Maybe<GroupAttendee_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_GroupRoleArgs = {
  objects: ReadonlyArray<GroupRole_Insert_Input>;
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
  objects: ReadonlyArray<InputType_Insert_Input>;
  on_conflict?: Maybe<InputType_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_InputType_OneArgs = {
  object: InputType_Insert_Input;
  on_conflict?: Maybe<InputType_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_InvitationArgs = {
  objects: ReadonlyArray<Invitation_Insert_Input>;
  on_conflict?: Maybe<Invitation_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Invitation_OneArgs = {
  object: Invitation_Insert_Input;
  on_conflict?: Maybe<Invitation_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_OnlineStatusArgs = {
  objects: ReadonlyArray<OnlineStatus_Insert_Input>;
  on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_OnlineStatus_OneArgs = {
  object: OnlineStatus_Insert_Input;
  on_conflict?: Maybe<OnlineStatus_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_OriginatingDataArgs = {
  objects: ReadonlyArray<OriginatingData_Insert_Input>;
  on_conflict?: Maybe<OriginatingData_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_OriginatingData_OneArgs = {
  object: OriginatingData_Insert_Input;
  on_conflict?: Maybe<OriginatingData_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_PermissionArgs = {
  objects: ReadonlyArray<Permission_Insert_Input>;
  on_conflict?: Maybe<Permission_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Permission_OneArgs = {
  object: Permission_Insert_Input;
  on_conflict?: Maybe<Permission_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_PinnedChatArgs = {
  objects: ReadonlyArray<PinnedChat_Insert_Input>;
  on_conflict?: Maybe<PinnedChat_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_PinnedChat_OneArgs = {
  object: PinnedChat_Insert_Input;
  on_conflict?: Maybe<PinnedChat_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RequiredContentItemArgs = {
  objects: ReadonlyArray<RequiredContentItem_Insert_Input>;
  on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RequiredContentItem_OneArgs = {
  object: RequiredContentItem_Insert_Input;
  on_conflict?: Maybe<RequiredContentItem_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RoleArgs = {
  objects: ReadonlyArray<Role_Insert_Input>;
  on_conflict?: Maybe<Role_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RolePermissionArgs = {
  objects: ReadonlyArray<RolePermission_Insert_Input>;
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
  objects: ReadonlyArray<Room_Insert_Input>;
  on_conflict?: Maybe<Room_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RoomModeArgs = {
  objects: ReadonlyArray<RoomMode_Insert_Input>;
  on_conflict?: Maybe<RoomMode_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RoomMode_OneArgs = {
  object: RoomMode_Insert_Input;
  on_conflict?: Maybe<RoomMode_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_RoomParticipantArgs = {
  objects: ReadonlyArray<RoomParticipant_Insert_Input>;
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
  objects: ReadonlyArray<Tag_Insert_Input>;
  on_conflict?: Maybe<Tag_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Tag_OneArgs = {
  object: Tag_Insert_Input;
  on_conflict?: Maybe<Tag_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_TransitionsArgs = {
  objects: ReadonlyArray<Transitions_Insert_Input>;
  on_conflict?: Maybe<Transitions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Transitions_OneArgs = {
  object: Transitions_Insert_Input;
  on_conflict?: Maybe<Transitions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UploaderArgs = {
  objects: ReadonlyArray<Uploader_Insert_Input>;
  on_conflict?: Maybe<Uploader_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Uploader_OneArgs = {
  object: Uploader_Insert_Input;
  on_conflict?: Maybe<Uploader_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UserArgs = {
  objects: ReadonlyArray<User_Insert_Input>;
  on_conflict?: Maybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_OneArgs = {
  object: User_Insert_Input;
  on_conflict?: Maybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInvitationConfirmCurrentArgs = {
  inviteCode: Scalars['uuid'];
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
  attendeeIds: ReadonlyArray<Scalars['String']>;
};


/** mutation root */
export type Mutation_RootInvitationSendRepeatEmailArgs = {
  attendeeIds: ReadonlyArray<Scalars['String']>;
};


/** mutation root */
export type Mutation_RootSubmitContentItemArgs = {
  data: Scalars['jsonb'];
  magicToken: Scalars['String'];
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
export type Mutation_RootUpdate_ContentItemPersonArgs = {
  _inc?: Maybe<ContentItemPerson_Inc_Input>;
  _set?: Maybe<ContentItemPerson_Set_Input>;
  where: ContentItemPerson_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_ContentItemPerson_By_PkArgs = {
  _inc?: Maybe<ContentItemPerson_Inc_Input>;
  _set?: Maybe<ContentItemPerson_Set_Input>;
  pk_columns: ContentItemPerson_Pk_Columns_Input;
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

/** column ordering options */
export enum Order_By {
  /** in the ascending order, nulls last */
  Asc = 'asc',
  /** in the ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in the ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in the descending order, nulls first */
  Desc = 'desc',
  /** in the descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in the descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

/** query root */
export type Query_Root = {
  readonly __typename?: 'query_root';
  /** fetch data from the table: "Attendee" */
  readonly Attendee: ReadonlyArray<Attendee>;
  /** fetch aggregated fields from the table: "Attendee" */
  readonly Attendee_aggregate: Attendee_Aggregate;
  /** fetch data from the table: "Attendee" using primary key columns */
  readonly Attendee_by_pk?: Maybe<Attendee>;
  /** fetch data from the table: "Broadcast" */
  readonly Broadcast: ReadonlyArray<Broadcast>;
  /** fetch data from the table: "BroadcastContentItem" */
  readonly BroadcastContentItem: ReadonlyArray<BroadcastContentItem>;
  /** fetch aggregated fields from the table: "BroadcastContentItem" */
  readonly BroadcastContentItem_aggregate: BroadcastContentItem_Aggregate;
  /** fetch data from the table: "BroadcastContentItem" using primary key columns */
  readonly BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
  /** fetch aggregated fields from the table: "Broadcast" */
  readonly Broadcast_aggregate: Broadcast_Aggregate;
  /** fetch data from the table: "Broadcast" using primary key columns */
  readonly Broadcast_by_pk?: Maybe<Broadcast>;
  /** fetch data from the table: "Chat" */
  readonly Chat: ReadonlyArray<Chat>;
  /** fetch data from the table: "ChatMember" */
  readonly ChatMember: ReadonlyArray<ChatMember>;
  /** fetch aggregated fields from the table: "ChatMember" */
  readonly ChatMember_aggregate: ChatMember_Aggregate;
  /** fetch data from the table: "ChatMember" using primary key columns */
  readonly ChatMember_by_pk?: Maybe<ChatMember>;
  /** fetch data from the table: "ChatMessage" */
  readonly ChatMessage: ReadonlyArray<ChatMessage>;
  /** fetch aggregated fields from the table: "ChatMessage" */
  readonly ChatMessage_aggregate: ChatMessage_Aggregate;
  /** fetch data from the table: "ChatMessage" using primary key columns */
  readonly ChatMessage_by_pk?: Maybe<ChatMessage>;
  /** fetch data from the table: "ChatReaction" */
  readonly ChatReaction: ReadonlyArray<ChatReaction>;
  /** fetch aggregated fields from the table: "ChatReaction" */
  readonly ChatReaction_aggregate: ChatReaction_Aggregate;
  /** fetch data from the table: "ChatReaction" using primary key columns */
  readonly ChatReaction_by_pk?: Maybe<ChatReaction>;
  /** fetch data from the table: "ChatTyper" */
  readonly ChatTyper: ReadonlyArray<ChatTyper>;
  /** fetch aggregated fields from the table: "ChatTyper" */
  readonly ChatTyper_aggregate: ChatTyper_Aggregate;
  /** fetch data from the table: "ChatTyper" using primary key columns */
  readonly ChatTyper_by_pk?: Maybe<ChatTyper>;
  /** fetch data from the table: "ChatUnreadIndex" */
  readonly ChatUnreadIndex: ReadonlyArray<ChatUnreadIndex>;
  /** fetch aggregated fields from the table: "ChatUnreadIndex" */
  readonly ChatUnreadIndex_aggregate: ChatUnreadIndex_Aggregate;
  /** fetch data from the table: "ChatUnreadIndex" using primary key columns */
  readonly ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
  /** fetch data from the table: "ChatViewer" */
  readonly ChatViewer: ReadonlyArray<ChatViewer>;
  /** fetch aggregated fields from the table: "ChatViewer" */
  readonly ChatViewer_aggregate: ChatViewer_Aggregate;
  /** fetch data from the table: "ChatViewer" using primary key columns */
  readonly ChatViewer_by_pk?: Maybe<ChatViewer>;
  /** fetch aggregated fields from the table: "Chat" */
  readonly Chat_aggregate: Chat_Aggregate;
  /** fetch data from the table: "Chat" using primary key columns */
  readonly Chat_by_pk?: Maybe<Chat>;
  /** fetch data from the table: "Conference" */
  readonly Conference: ReadonlyArray<Conference>;
  /** fetch data from the table: "ConferenceConfiguration" */
  readonly ConferenceConfiguration: ReadonlyArray<ConferenceConfiguration>;
  /** fetch aggregated fields from the table: "ConferenceConfiguration" */
  readonly ConferenceConfiguration_aggregate: ConferenceConfiguration_Aggregate;
  /** fetch data from the table: "ConferenceConfiguration" using primary key columns */
  readonly ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
  /** fetch data from the table: "ConferenceDemoCode" */
  readonly ConferenceDemoCode: ReadonlyArray<ConferenceDemoCode>;
  /** fetch aggregated fields from the table: "ConferenceDemoCode" */
  readonly ConferenceDemoCode_aggregate: ConferenceDemoCode_Aggregate;
  /** fetch data from the table: "ConferenceDemoCode" using primary key columns */
  readonly ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
  /** fetch aggregated fields from the table: "Conference" */
  readonly Conference_aggregate: Conference_Aggregate;
  /** fetch data from the table: "Conference" using primary key columns */
  readonly Conference_by_pk?: Maybe<Conference>;
  /** fetch data from the table: "ContentGroup" */
  readonly ContentGroup: ReadonlyArray<ContentGroup>;
  /** fetch data from the table: "ContentGroupTag" */
  readonly ContentGroupTag: ReadonlyArray<ContentGroupTag>;
  /** fetch aggregated fields from the table: "ContentGroupTag" */
  readonly ContentGroupTag_aggregate: ContentGroupTag_Aggregate;
  /** fetch data from the table: "ContentGroupTag" using primary key columns */
  readonly ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
  /** fetch data from the table: "ContentGroupType" */
  readonly ContentGroupType: ReadonlyArray<ContentGroupType>;
  /** fetch aggregated fields from the table: "ContentGroupType" */
  readonly ContentGroupType_aggregate: ContentGroupType_Aggregate;
  /** fetch data from the table: "ContentGroupType" using primary key columns */
  readonly ContentGroupType_by_pk?: Maybe<ContentGroupType>;
  /** fetch aggregated fields from the table: "ContentGroup" */
  readonly ContentGroup_aggregate: ContentGroup_Aggregate;
  /** fetch data from the table: "ContentGroup" using primary key columns */
  readonly ContentGroup_by_pk?: Maybe<ContentGroup>;
  /** fetch data from the table: "ContentItem" */
  readonly ContentItem: ReadonlyArray<ContentItem>;
  /** fetch data from the table: "ContentItemPerson" */
  readonly ContentItemPerson: ReadonlyArray<ContentItemPerson>;
  /** fetch aggregated fields from the table: "ContentItemPerson" */
  readonly ContentItemPerson_aggregate: ContentItemPerson_Aggregate;
  /** fetch data from the table: "ContentItemPerson" using primary key columns */
  readonly ContentItemPerson_by_pk?: Maybe<ContentItemPerson>;
  /** fetch aggregated fields from the table: "ContentItem" */
  readonly ContentItem_aggregate: ContentItem_Aggregate;
  /** fetch data from the table: "ContentItem" using primary key columns */
  readonly ContentItem_by_pk?: Maybe<ContentItem>;
  /** fetch data from the table: "ContentPerson" */
  readonly ContentPerson: ReadonlyArray<ContentPerson>;
  /** fetch aggregated fields from the table: "ContentPerson" */
  readonly ContentPerson_aggregate: ContentPerson_Aggregate;
  /** fetch data from the table: "ContentPerson" using primary key columns */
  readonly ContentPerson_by_pk?: Maybe<ContentPerson>;
  /** fetch data from the table: "ContentType" */
  readonly ContentType: ReadonlyArray<ContentType>;
  /** fetch aggregated fields from the table: "ContentType" */
  readonly ContentType_aggregate: ContentType_Aggregate;
  /** fetch data from the table: "ContentType" using primary key columns */
  readonly ContentType_by_pk?: Maybe<ContentType>;
  /** fetch data from the table: "Email" */
  readonly Email: ReadonlyArray<Email>;
  /** fetch aggregated fields from the table: "Email" */
  readonly Email_aggregate: Email_Aggregate;
  /** fetch data from the table: "Email" using primary key columns */
  readonly Email_by_pk?: Maybe<Email>;
  /** fetch data from the table: "Event" */
  readonly Event: ReadonlyArray<Event>;
  /** fetch data from the table: "EventPerson" */
  readonly EventPerson: ReadonlyArray<EventPerson>;
  /** fetch data from the table: "EventPersonRole" */
  readonly EventPersonRole: ReadonlyArray<EventPersonRole>;
  /** fetch aggregated fields from the table: "EventPersonRole" */
  readonly EventPersonRole_aggregate: EventPersonRole_Aggregate;
  /** fetch data from the table: "EventPersonRole" using primary key columns */
  readonly EventPersonRole_by_pk?: Maybe<EventPersonRole>;
  /** fetch aggregated fields from the table: "EventPerson" */
  readonly EventPerson_aggregate: EventPerson_Aggregate;
  /** fetch data from the table: "EventPerson" using primary key columns */
  readonly EventPerson_by_pk?: Maybe<EventPerson>;
  /** fetch data from the table: "EventTag" */
  readonly EventTag: ReadonlyArray<EventTag>;
  /** fetch aggregated fields from the table: "EventTag" */
  readonly EventTag_aggregate: EventTag_Aggregate;
  /** fetch data from the table: "EventTag" using primary key columns */
  readonly EventTag_by_pk?: Maybe<EventTag>;
  /** fetch aggregated fields from the table: "Event" */
  readonly Event_aggregate: Event_Aggregate;
  /** fetch data from the table: "Event" using primary key columns */
  readonly Event_by_pk?: Maybe<Event>;
  /** fetch data from the table: "ExecutedTransitions" */
  readonly ExecutedTransitions: ReadonlyArray<ExecutedTransitions>;
  /** fetch aggregated fields from the table: "ExecutedTransitions" */
  readonly ExecutedTransitions_aggregate: ExecutedTransitions_Aggregate;
  /** fetch data from the table: "ExecutedTransitions" using primary key columns */
  readonly ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
  /** fetch data from the table: "FlaggedChatMessage" */
  readonly FlaggedChatMessage: ReadonlyArray<FlaggedChatMessage>;
  /** fetch aggregated fields from the table: "FlaggedChatMessage" */
  readonly FlaggedChatMessage_aggregate: FlaggedChatMessage_Aggregate;
  /** fetch data from the table: "FlaggedChatMessage" using primary key columns */
  readonly FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
  /** fetch data from the table: "FollowedChat" */
  readonly FollowedChat: ReadonlyArray<FollowedChat>;
  /** fetch aggregated fields from the table: "FollowedChat" */
  readonly FollowedChat_aggregate: FollowedChat_Aggregate;
  /** fetch data from the table: "FollowedChat" using primary key columns */
  readonly FollowedChat_by_pk?: Maybe<FollowedChat>;
  /** fetch data from the table: "Group" */
  readonly Group: ReadonlyArray<Group>;
  /** fetch data from the table: "GroupAttendee" */
  readonly GroupAttendee: ReadonlyArray<GroupAttendee>;
  /** fetch aggregated fields from the table: "GroupAttendee" */
  readonly GroupAttendee_aggregate: GroupAttendee_Aggregate;
  /** fetch data from the table: "GroupAttendee" using primary key columns */
  readonly GroupAttendee_by_pk?: Maybe<GroupAttendee>;
  /** fetch data from the table: "GroupRole" */
  readonly GroupRole: ReadonlyArray<GroupRole>;
  /** fetch aggregated fields from the table: "GroupRole" */
  readonly GroupRole_aggregate: GroupRole_Aggregate;
  /** fetch data from the table: "GroupRole" using primary key columns */
  readonly GroupRole_by_pk?: Maybe<GroupRole>;
  /** fetch aggregated fields from the table: "Group" */
  readonly Group_aggregate: Group_Aggregate;
  /** fetch data from the table: "Group" using primary key columns */
  readonly Group_by_pk?: Maybe<Group>;
  /** fetch data from the table: "InputType" */
  readonly InputType: ReadonlyArray<InputType>;
  /** fetch aggregated fields from the table: "InputType" */
  readonly InputType_aggregate: InputType_Aggregate;
  /** fetch data from the table: "InputType" using primary key columns */
  readonly InputType_by_pk?: Maybe<InputType>;
  /** fetch data from the table: "Invitation" */
  readonly Invitation: ReadonlyArray<Invitation>;
  /** fetch aggregated fields from the table: "Invitation" */
  readonly Invitation_aggregate: Invitation_Aggregate;
  /** fetch data from the table: "Invitation" using primary key columns */
  readonly Invitation_by_pk?: Maybe<Invitation>;
  /** fetch data from the table: "OnlineStatus" */
  readonly OnlineStatus: ReadonlyArray<OnlineStatus>;
  /** fetch aggregated fields from the table: "OnlineStatus" */
  readonly OnlineStatus_aggregate: OnlineStatus_Aggregate;
  /** fetch data from the table: "OnlineStatus" using primary key columns */
  readonly OnlineStatus_by_pk?: Maybe<OnlineStatus>;
  /** fetch data from the table: "OriginatingData" */
  readonly OriginatingData: ReadonlyArray<OriginatingData>;
  /** fetch aggregated fields from the table: "OriginatingData" */
  readonly OriginatingData_aggregate: OriginatingData_Aggregate;
  /** fetch data from the table: "OriginatingData" using primary key columns */
  readonly OriginatingData_by_pk?: Maybe<OriginatingData>;
  /** fetch data from the table: "Permission" */
  readonly Permission: ReadonlyArray<Permission>;
  /** fetch aggregated fields from the table: "Permission" */
  readonly Permission_aggregate: Permission_Aggregate;
  /** fetch data from the table: "Permission" using primary key columns */
  readonly Permission_by_pk?: Maybe<Permission>;
  /** fetch data from the table: "PinnedChat" */
  readonly PinnedChat: ReadonlyArray<PinnedChat>;
  /** fetch aggregated fields from the table: "PinnedChat" */
  readonly PinnedChat_aggregate: PinnedChat_Aggregate;
  /** fetch data from the table: "PinnedChat" using primary key columns */
  readonly PinnedChat_by_pk?: Maybe<PinnedChat>;
  /** fetch data from the table: "RequiredContentItem" */
  readonly RequiredContentItem: ReadonlyArray<RequiredContentItem>;
  /** fetch aggregated fields from the table: "RequiredContentItem" */
  readonly RequiredContentItem_aggregate: RequiredContentItem_Aggregate;
  /** fetch data from the table: "RequiredContentItem" using primary key columns */
  readonly RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
  /** fetch data from the table: "Role" */
  readonly Role: ReadonlyArray<Role>;
  /** fetch data from the table: "RolePermission" */
  readonly RolePermission: ReadonlyArray<RolePermission>;
  /** fetch aggregated fields from the table: "RolePermission" */
  readonly RolePermission_aggregate: RolePermission_Aggregate;
  /** fetch data from the table: "RolePermission" using primary key columns */
  readonly RolePermission_by_pk?: Maybe<RolePermission>;
  /** fetch aggregated fields from the table: "Role" */
  readonly Role_aggregate: Role_Aggregate;
  /** fetch data from the table: "Role" using primary key columns */
  readonly Role_by_pk?: Maybe<Role>;
  /** fetch data from the table: "Room" */
  readonly Room: ReadonlyArray<Room>;
  /** fetch data from the table: "RoomMode" */
  readonly RoomMode: ReadonlyArray<RoomMode>;
  /** fetch aggregated fields from the table: "RoomMode" */
  readonly RoomMode_aggregate: RoomMode_Aggregate;
  /** fetch data from the table: "RoomMode" using primary key columns */
  readonly RoomMode_by_pk?: Maybe<RoomMode>;
  /** fetch data from the table: "RoomParticipant" */
  readonly RoomParticipant: ReadonlyArray<RoomParticipant>;
  /** fetch aggregated fields from the table: "RoomParticipant" */
  readonly RoomParticipant_aggregate: RoomParticipant_Aggregate;
  /** fetch data from the table: "RoomParticipant" using primary key columns */
  readonly RoomParticipant_by_pk?: Maybe<RoomParticipant>;
  /** fetch aggregated fields from the table: "Room" */
  readonly Room_aggregate: Room_Aggregate;
  /** fetch data from the table: "Room" using primary key columns */
  readonly Room_by_pk?: Maybe<Room>;
  /** fetch data from the table: "Tag" */
  readonly Tag: ReadonlyArray<Tag>;
  /** fetch aggregated fields from the table: "Tag" */
  readonly Tag_aggregate: Tag_Aggregate;
  /** fetch data from the table: "Tag" using primary key columns */
  readonly Tag_by_pk?: Maybe<Tag>;
  /** fetch data from the table: "Transitions" */
  readonly Transitions: ReadonlyArray<Transitions>;
  /** fetch aggregated fields from the table: "Transitions" */
  readonly Transitions_aggregate: Transitions_Aggregate;
  /** fetch data from the table: "Transitions" using primary key columns */
  readonly Transitions_by_pk?: Maybe<Transitions>;
  /** fetch data from the table: "Uploader" */
  readonly Uploader: ReadonlyArray<Uploader>;
  /** fetch aggregated fields from the table: "Uploader" */
  readonly Uploader_aggregate: Uploader_Aggregate;
  /** fetch data from the table: "Uploader" using primary key columns */
  readonly Uploader_by_pk?: Maybe<Uploader>;
  /** fetch data from the table: "User" */
  readonly User: ReadonlyArray<User>;
  /** fetch aggregated fields from the table: "User" */
  readonly User_aggregate: User_Aggregate;
  /** fetch data from the table: "User" using primary key columns */
  readonly User_by_pk?: Maybe<User>;
  /** perform the action: "echo" */
  readonly echo?: Maybe<EchoOutput>;
  /** perform the action: "getContentItem" */
  readonly getContentItem?: Maybe<ReadonlyArray<Maybe<GetContentItemOutput>>>;
  /** perform the action: "protectedEcho" */
  readonly protectedEcho?: Maybe<ProtectedEchoOutput>;
};


/** query root */
export type Query_RootAttendeeArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** query root */
export type Query_RootAttendee_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** query root */
export type Query_RootAttendee_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootBroadcastArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** query root */
export type Query_RootBroadcastContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootBroadcastContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootBroadcastContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootBroadcast_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** query root */
export type Query_RootBroadcast_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** query root */
export type Query_RootChatMemberArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** query root */
export type Query_RootChatMember_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** query root */
export type Query_RootChatMember_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatMessageArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** query root */
export type Query_RootChatMessage_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** query root */
export type Query_RootChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatReactionArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** query root */
export type Query_RootChatReaction_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** query root */
export type Query_RootChatReaction_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatTyperArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** query root */
export type Query_RootChatTyper_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** query root */
export type Query_RootChatTyper_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatUnreadIndexArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** query root */
export type Query_RootChatUnreadIndex_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** query root */
export type Query_RootChatUnreadIndex_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChatViewerArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** query root */
export type Query_RootChatViewer_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** query root */
export type Query_RootChatViewer_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** query root */
export type Query_RootChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootConferenceArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** query root */
export type Query_RootConferenceConfigurationArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** query root */
export type Query_RootConferenceConfiguration_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** query root */
export type Query_RootConferenceConfiguration_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootConferenceDemoCodeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** query root */
export type Query_RootConferenceDemoCode_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** query root */
export type Query_RootConferenceDemoCode_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootConference_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** query root */
export type Query_RootConference_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentGroupArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroupTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroupTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroupTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentGroupTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupType_Order_By>>;
  where?: Maybe<ContentGroupType_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroupType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupType_Order_By>>;
  where?: Maybe<ContentGroupType_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroupType_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootContentGroup_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** query root */
export type Query_RootContentGroup_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootContentItemPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** query root */
export type Query_RootContentItemPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** query root */
export type Query_RootContentItemPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** query root */
export type Query_RootContentPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** query root */
export type Query_RootContentPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootContentTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentType_Order_By>>;
  where?: Maybe<ContentType_Bool_Exp>;
};


/** query root */
export type Query_RootContentType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentType_Order_By>>;
  where?: Maybe<ContentType_Bool_Exp>;
};


/** query root */
export type Query_RootContentType_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootEmailArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** query root */
export type Query_RootEmail_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** query root */
export type Query_RootEmail_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootEventArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** query root */
export type Query_RootEventPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** query root */
export type Query_RootEventPersonRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPersonRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPersonRole_Order_By>>;
  where?: Maybe<EventPersonRole_Bool_Exp>;
};


/** query root */
export type Query_RootEventPersonRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPersonRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPersonRole_Order_By>>;
  where?: Maybe<EventPersonRole_Bool_Exp>;
};


/** query root */
export type Query_RootEventPersonRole_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootEventPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** query root */
export type Query_RootEventPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootEventTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** query root */
export type Query_RootEventTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** query root */
export type Query_RootEventTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootEvent_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** query root */
export type Query_RootEvent_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootExecutedTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** query root */
export type Query_RootExecutedTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** query root */
export type Query_RootExecutedTransitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootFlaggedChatMessageArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** query root */
export type Query_RootFlaggedChatMessage_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** query root */
export type Query_RootFlaggedChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootFollowedChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** query root */
export type Query_RootFollowedChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** query root */
export type Query_RootFollowedChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootGroupArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** query root */
export type Query_RootGroupAttendeeArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** query root */
export type Query_RootGroupAttendee_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** query root */
export type Query_RootGroupAttendee_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootGroupRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** query root */
export type Query_RootGroupRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** query root */
export type Query_RootGroupRole_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootGroup_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** query root */
export type Query_RootGroup_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootInputTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<InputType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<InputType_Order_By>>;
  where?: Maybe<InputType_Bool_Exp>;
};


/** query root */
export type Query_RootInputType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<InputType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<InputType_Order_By>>;
  where?: Maybe<InputType_Bool_Exp>;
};


/** query root */
export type Query_RootInputType_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootInvitationArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** query root */
export type Query_RootInvitation_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** query root */
export type Query_RootInvitation_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootOnlineStatusArgs = {
  distinct_on?: Maybe<ReadonlyArray<OnlineStatus_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OnlineStatus_Order_By>>;
  where?: Maybe<OnlineStatus_Bool_Exp>;
};


/** query root */
export type Query_RootOnlineStatus_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<OnlineStatus_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OnlineStatus_Order_By>>;
  where?: Maybe<OnlineStatus_Bool_Exp>;
};


/** query root */
export type Query_RootOnlineStatus_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootOriginatingDataArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** query root */
export type Query_RootOriginatingData_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** query root */
export type Query_RootOriginatingData_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootPermissionArgs = {
  distinct_on?: Maybe<ReadonlyArray<Permission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Permission_Order_By>>;
  where?: Maybe<Permission_Bool_Exp>;
};


/** query root */
export type Query_RootPermission_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Permission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Permission_Order_By>>;
  where?: Maybe<Permission_Bool_Exp>;
};


/** query root */
export type Query_RootPermission_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootPinnedChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** query root */
export type Query_RootPinnedChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** query root */
export type Query_RootPinnedChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootRequiredContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootRequiredContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** query root */
export type Query_RootRequiredContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** query root */
export type Query_RootRolePermissionArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** query root */
export type Query_RootRolePermission_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** query root */
export type Query_RootRolePermission_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** query root */
export type Query_RootRole_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootRoomArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** query root */
export type Query_RootRoomModeArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomMode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomMode_Order_By>>;
  where?: Maybe<RoomMode_Bool_Exp>;
};


/** query root */
export type Query_RootRoomMode_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomMode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomMode_Order_By>>;
  where?: Maybe<RoomMode_Bool_Exp>;
};


/** query root */
export type Query_RootRoomMode_By_PkArgs = {
  name: Scalars['String'];
};


/** query root */
export type Query_RootRoomParticipantArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** query root */
export type Query_RootRoomParticipant_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** query root */
export type Query_RootRoomParticipant_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootRoom_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** query root */
export type Query_RootRoom_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};


/** query root */
export type Query_RootTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};


/** query root */
export type Query_RootTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** query root */
export type Query_RootTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** query root */
export type Query_RootTransitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootUploaderArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};


/** query root */
export type Query_RootUploader_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};


/** query root */
export type Query_RootUploader_By_PkArgs = {
  id: Scalars['uuid'];
};


/** query root */
export type Query_RootUserArgs = {
  distinct_on?: Maybe<ReadonlyArray<User_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<User_Order_By>>;
  where?: Maybe<User_Bool_Exp>;
};


/** query root */
export type Query_RootUser_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<User_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<User_Order_By>>;
  where?: Maybe<User_Bool_Exp>;
};


/** query root */
export type Query_RootUser_By_PkArgs = {
  id: Scalars['String'];
};


/** query root */
export type Query_RootEchoArgs = {
  message: Scalars['String'];
};


/** query root */
export type Query_RootGetContentItemArgs = {
  magicToken: Scalars['String'];
};


/** query root */
export type Query_RootProtectedEchoArgs = {
  message: Scalars['String'];
};

/** subscription root */
export type Subscription_Root = {
  readonly __typename?: 'subscription_root';
  /** fetch data from the table: "Attendee" */
  readonly Attendee: ReadonlyArray<Attendee>;
  /** fetch aggregated fields from the table: "Attendee" */
  readonly Attendee_aggregate: Attendee_Aggregate;
  /** fetch data from the table: "Attendee" using primary key columns */
  readonly Attendee_by_pk?: Maybe<Attendee>;
  /** fetch data from the table: "Broadcast" */
  readonly Broadcast: ReadonlyArray<Broadcast>;
  /** fetch data from the table: "BroadcastContentItem" */
  readonly BroadcastContentItem: ReadonlyArray<BroadcastContentItem>;
  /** fetch aggregated fields from the table: "BroadcastContentItem" */
  readonly BroadcastContentItem_aggregate: BroadcastContentItem_Aggregate;
  /** fetch data from the table: "BroadcastContentItem" using primary key columns */
  readonly BroadcastContentItem_by_pk?: Maybe<BroadcastContentItem>;
  /** fetch aggregated fields from the table: "Broadcast" */
  readonly Broadcast_aggregate: Broadcast_Aggregate;
  /** fetch data from the table: "Broadcast" using primary key columns */
  readonly Broadcast_by_pk?: Maybe<Broadcast>;
  /** fetch data from the table: "Chat" */
  readonly Chat: ReadonlyArray<Chat>;
  /** fetch data from the table: "ChatMember" */
  readonly ChatMember: ReadonlyArray<ChatMember>;
  /** fetch aggregated fields from the table: "ChatMember" */
  readonly ChatMember_aggregate: ChatMember_Aggregate;
  /** fetch data from the table: "ChatMember" using primary key columns */
  readonly ChatMember_by_pk?: Maybe<ChatMember>;
  /** fetch data from the table: "ChatMessage" */
  readonly ChatMessage: ReadonlyArray<ChatMessage>;
  /** fetch aggregated fields from the table: "ChatMessage" */
  readonly ChatMessage_aggregate: ChatMessage_Aggregate;
  /** fetch data from the table: "ChatMessage" using primary key columns */
  readonly ChatMessage_by_pk?: Maybe<ChatMessage>;
  /** fetch data from the table: "ChatReaction" */
  readonly ChatReaction: ReadonlyArray<ChatReaction>;
  /** fetch aggregated fields from the table: "ChatReaction" */
  readonly ChatReaction_aggregate: ChatReaction_Aggregate;
  /** fetch data from the table: "ChatReaction" using primary key columns */
  readonly ChatReaction_by_pk?: Maybe<ChatReaction>;
  /** fetch data from the table: "ChatTyper" */
  readonly ChatTyper: ReadonlyArray<ChatTyper>;
  /** fetch aggregated fields from the table: "ChatTyper" */
  readonly ChatTyper_aggregate: ChatTyper_Aggregate;
  /** fetch data from the table: "ChatTyper" using primary key columns */
  readonly ChatTyper_by_pk?: Maybe<ChatTyper>;
  /** fetch data from the table: "ChatUnreadIndex" */
  readonly ChatUnreadIndex: ReadonlyArray<ChatUnreadIndex>;
  /** fetch aggregated fields from the table: "ChatUnreadIndex" */
  readonly ChatUnreadIndex_aggregate: ChatUnreadIndex_Aggregate;
  /** fetch data from the table: "ChatUnreadIndex" using primary key columns */
  readonly ChatUnreadIndex_by_pk?: Maybe<ChatUnreadIndex>;
  /** fetch data from the table: "ChatViewer" */
  readonly ChatViewer: ReadonlyArray<ChatViewer>;
  /** fetch aggregated fields from the table: "ChatViewer" */
  readonly ChatViewer_aggregate: ChatViewer_Aggregate;
  /** fetch data from the table: "ChatViewer" using primary key columns */
  readonly ChatViewer_by_pk?: Maybe<ChatViewer>;
  /** fetch aggregated fields from the table: "Chat" */
  readonly Chat_aggregate: Chat_Aggregate;
  /** fetch data from the table: "Chat" using primary key columns */
  readonly Chat_by_pk?: Maybe<Chat>;
  /** fetch data from the table: "Conference" */
  readonly Conference: ReadonlyArray<Conference>;
  /** fetch data from the table: "ConferenceConfiguration" */
  readonly ConferenceConfiguration: ReadonlyArray<ConferenceConfiguration>;
  /** fetch aggregated fields from the table: "ConferenceConfiguration" */
  readonly ConferenceConfiguration_aggregate: ConferenceConfiguration_Aggregate;
  /** fetch data from the table: "ConferenceConfiguration" using primary key columns */
  readonly ConferenceConfiguration_by_pk?: Maybe<ConferenceConfiguration>;
  /** fetch data from the table: "ConferenceDemoCode" */
  readonly ConferenceDemoCode: ReadonlyArray<ConferenceDemoCode>;
  /** fetch aggregated fields from the table: "ConferenceDemoCode" */
  readonly ConferenceDemoCode_aggregate: ConferenceDemoCode_Aggregate;
  /** fetch data from the table: "ConferenceDemoCode" using primary key columns */
  readonly ConferenceDemoCode_by_pk?: Maybe<ConferenceDemoCode>;
  /** fetch aggregated fields from the table: "Conference" */
  readonly Conference_aggregate: Conference_Aggregate;
  /** fetch data from the table: "Conference" using primary key columns */
  readonly Conference_by_pk?: Maybe<Conference>;
  /** fetch data from the table: "ContentGroup" */
  readonly ContentGroup: ReadonlyArray<ContentGroup>;
  /** fetch data from the table: "ContentGroupTag" */
  readonly ContentGroupTag: ReadonlyArray<ContentGroupTag>;
  /** fetch aggregated fields from the table: "ContentGroupTag" */
  readonly ContentGroupTag_aggregate: ContentGroupTag_Aggregate;
  /** fetch data from the table: "ContentGroupTag" using primary key columns */
  readonly ContentGroupTag_by_pk?: Maybe<ContentGroupTag>;
  /** fetch data from the table: "ContentGroupType" */
  readonly ContentGroupType: ReadonlyArray<ContentGroupType>;
  /** fetch aggregated fields from the table: "ContentGroupType" */
  readonly ContentGroupType_aggregate: ContentGroupType_Aggregate;
  /** fetch data from the table: "ContentGroupType" using primary key columns */
  readonly ContentGroupType_by_pk?: Maybe<ContentGroupType>;
  /** fetch aggregated fields from the table: "ContentGroup" */
  readonly ContentGroup_aggregate: ContentGroup_Aggregate;
  /** fetch data from the table: "ContentGroup" using primary key columns */
  readonly ContentGroup_by_pk?: Maybe<ContentGroup>;
  /** fetch data from the table: "ContentItem" */
  readonly ContentItem: ReadonlyArray<ContentItem>;
  /** fetch data from the table: "ContentItemPerson" */
  readonly ContentItemPerson: ReadonlyArray<ContentItemPerson>;
  /** fetch aggregated fields from the table: "ContentItemPerson" */
  readonly ContentItemPerson_aggregate: ContentItemPerson_Aggregate;
  /** fetch data from the table: "ContentItemPerson" using primary key columns */
  readonly ContentItemPerson_by_pk?: Maybe<ContentItemPerson>;
  /** fetch aggregated fields from the table: "ContentItem" */
  readonly ContentItem_aggregate: ContentItem_Aggregate;
  /** fetch data from the table: "ContentItem" using primary key columns */
  readonly ContentItem_by_pk?: Maybe<ContentItem>;
  /** fetch data from the table: "ContentPerson" */
  readonly ContentPerson: ReadonlyArray<ContentPerson>;
  /** fetch aggregated fields from the table: "ContentPerson" */
  readonly ContentPerson_aggregate: ContentPerson_Aggregate;
  /** fetch data from the table: "ContentPerson" using primary key columns */
  readonly ContentPerson_by_pk?: Maybe<ContentPerson>;
  /** fetch data from the table: "ContentType" */
  readonly ContentType: ReadonlyArray<ContentType>;
  /** fetch aggregated fields from the table: "ContentType" */
  readonly ContentType_aggregate: ContentType_Aggregate;
  /** fetch data from the table: "ContentType" using primary key columns */
  readonly ContentType_by_pk?: Maybe<ContentType>;
  /** fetch data from the table: "Email" */
  readonly Email: ReadonlyArray<Email>;
  /** fetch aggregated fields from the table: "Email" */
  readonly Email_aggregate: Email_Aggregate;
  /** fetch data from the table: "Email" using primary key columns */
  readonly Email_by_pk?: Maybe<Email>;
  /** fetch data from the table: "Event" */
  readonly Event: ReadonlyArray<Event>;
  /** fetch data from the table: "EventPerson" */
  readonly EventPerson: ReadonlyArray<EventPerson>;
  /** fetch data from the table: "EventPersonRole" */
  readonly EventPersonRole: ReadonlyArray<EventPersonRole>;
  /** fetch aggregated fields from the table: "EventPersonRole" */
  readonly EventPersonRole_aggregate: EventPersonRole_Aggregate;
  /** fetch data from the table: "EventPersonRole" using primary key columns */
  readonly EventPersonRole_by_pk?: Maybe<EventPersonRole>;
  /** fetch aggregated fields from the table: "EventPerson" */
  readonly EventPerson_aggregate: EventPerson_Aggregate;
  /** fetch data from the table: "EventPerson" using primary key columns */
  readonly EventPerson_by_pk?: Maybe<EventPerson>;
  /** fetch data from the table: "EventTag" */
  readonly EventTag: ReadonlyArray<EventTag>;
  /** fetch aggregated fields from the table: "EventTag" */
  readonly EventTag_aggregate: EventTag_Aggregate;
  /** fetch data from the table: "EventTag" using primary key columns */
  readonly EventTag_by_pk?: Maybe<EventTag>;
  /** fetch aggregated fields from the table: "Event" */
  readonly Event_aggregate: Event_Aggregate;
  /** fetch data from the table: "Event" using primary key columns */
  readonly Event_by_pk?: Maybe<Event>;
  /** fetch data from the table: "ExecutedTransitions" */
  readonly ExecutedTransitions: ReadonlyArray<ExecutedTransitions>;
  /** fetch aggregated fields from the table: "ExecutedTransitions" */
  readonly ExecutedTransitions_aggregate: ExecutedTransitions_Aggregate;
  /** fetch data from the table: "ExecutedTransitions" using primary key columns */
  readonly ExecutedTransitions_by_pk?: Maybe<ExecutedTransitions>;
  /** fetch data from the table: "FlaggedChatMessage" */
  readonly FlaggedChatMessage: ReadonlyArray<FlaggedChatMessage>;
  /** fetch aggregated fields from the table: "FlaggedChatMessage" */
  readonly FlaggedChatMessage_aggregate: FlaggedChatMessage_Aggregate;
  /** fetch data from the table: "FlaggedChatMessage" using primary key columns */
  readonly FlaggedChatMessage_by_pk?: Maybe<FlaggedChatMessage>;
  /** fetch data from the table: "FollowedChat" */
  readonly FollowedChat: ReadonlyArray<FollowedChat>;
  /** fetch aggregated fields from the table: "FollowedChat" */
  readonly FollowedChat_aggregate: FollowedChat_Aggregate;
  /** fetch data from the table: "FollowedChat" using primary key columns */
  readonly FollowedChat_by_pk?: Maybe<FollowedChat>;
  /** fetch data from the table: "Group" */
  readonly Group: ReadonlyArray<Group>;
  /** fetch data from the table: "GroupAttendee" */
  readonly GroupAttendee: ReadonlyArray<GroupAttendee>;
  /** fetch aggregated fields from the table: "GroupAttendee" */
  readonly GroupAttendee_aggregate: GroupAttendee_Aggregate;
  /** fetch data from the table: "GroupAttendee" using primary key columns */
  readonly GroupAttendee_by_pk?: Maybe<GroupAttendee>;
  /** fetch data from the table: "GroupRole" */
  readonly GroupRole: ReadonlyArray<GroupRole>;
  /** fetch aggregated fields from the table: "GroupRole" */
  readonly GroupRole_aggregate: GroupRole_Aggregate;
  /** fetch data from the table: "GroupRole" using primary key columns */
  readonly GroupRole_by_pk?: Maybe<GroupRole>;
  /** fetch aggregated fields from the table: "Group" */
  readonly Group_aggregate: Group_Aggregate;
  /** fetch data from the table: "Group" using primary key columns */
  readonly Group_by_pk?: Maybe<Group>;
  /** fetch data from the table: "InputType" */
  readonly InputType: ReadonlyArray<InputType>;
  /** fetch aggregated fields from the table: "InputType" */
  readonly InputType_aggregate: InputType_Aggregate;
  /** fetch data from the table: "InputType" using primary key columns */
  readonly InputType_by_pk?: Maybe<InputType>;
  /** fetch data from the table: "Invitation" */
  readonly Invitation: ReadonlyArray<Invitation>;
  /** fetch aggregated fields from the table: "Invitation" */
  readonly Invitation_aggregate: Invitation_Aggregate;
  /** fetch data from the table: "Invitation" using primary key columns */
  readonly Invitation_by_pk?: Maybe<Invitation>;
  /** fetch data from the table: "OnlineStatus" */
  readonly OnlineStatus: ReadonlyArray<OnlineStatus>;
  /** fetch aggregated fields from the table: "OnlineStatus" */
  readonly OnlineStatus_aggregate: OnlineStatus_Aggregate;
  /** fetch data from the table: "OnlineStatus" using primary key columns */
  readonly OnlineStatus_by_pk?: Maybe<OnlineStatus>;
  /** fetch data from the table: "OriginatingData" */
  readonly OriginatingData: ReadonlyArray<OriginatingData>;
  /** fetch aggregated fields from the table: "OriginatingData" */
  readonly OriginatingData_aggregate: OriginatingData_Aggregate;
  /** fetch data from the table: "OriginatingData" using primary key columns */
  readonly OriginatingData_by_pk?: Maybe<OriginatingData>;
  /** fetch data from the table: "Permission" */
  readonly Permission: ReadonlyArray<Permission>;
  /** fetch aggregated fields from the table: "Permission" */
  readonly Permission_aggregate: Permission_Aggregate;
  /** fetch data from the table: "Permission" using primary key columns */
  readonly Permission_by_pk?: Maybe<Permission>;
  /** fetch data from the table: "PinnedChat" */
  readonly PinnedChat: ReadonlyArray<PinnedChat>;
  /** fetch aggregated fields from the table: "PinnedChat" */
  readonly PinnedChat_aggregate: PinnedChat_Aggregate;
  /** fetch data from the table: "PinnedChat" using primary key columns */
  readonly PinnedChat_by_pk?: Maybe<PinnedChat>;
  /** fetch data from the table: "RequiredContentItem" */
  readonly RequiredContentItem: ReadonlyArray<RequiredContentItem>;
  /** fetch aggregated fields from the table: "RequiredContentItem" */
  readonly RequiredContentItem_aggregate: RequiredContentItem_Aggregate;
  /** fetch data from the table: "RequiredContentItem" using primary key columns */
  readonly RequiredContentItem_by_pk?: Maybe<RequiredContentItem>;
  /** fetch data from the table: "Role" */
  readonly Role: ReadonlyArray<Role>;
  /** fetch data from the table: "RolePermission" */
  readonly RolePermission: ReadonlyArray<RolePermission>;
  /** fetch aggregated fields from the table: "RolePermission" */
  readonly RolePermission_aggregate: RolePermission_Aggregate;
  /** fetch data from the table: "RolePermission" using primary key columns */
  readonly RolePermission_by_pk?: Maybe<RolePermission>;
  /** fetch aggregated fields from the table: "Role" */
  readonly Role_aggregate: Role_Aggregate;
  /** fetch data from the table: "Role" using primary key columns */
  readonly Role_by_pk?: Maybe<Role>;
  /** fetch data from the table: "Room" */
  readonly Room: ReadonlyArray<Room>;
  /** fetch data from the table: "RoomMode" */
  readonly RoomMode: ReadonlyArray<RoomMode>;
  /** fetch aggregated fields from the table: "RoomMode" */
  readonly RoomMode_aggregate: RoomMode_Aggregate;
  /** fetch data from the table: "RoomMode" using primary key columns */
  readonly RoomMode_by_pk?: Maybe<RoomMode>;
  /** fetch data from the table: "RoomParticipant" */
  readonly RoomParticipant: ReadonlyArray<RoomParticipant>;
  /** fetch aggregated fields from the table: "RoomParticipant" */
  readonly RoomParticipant_aggregate: RoomParticipant_Aggregate;
  /** fetch data from the table: "RoomParticipant" using primary key columns */
  readonly RoomParticipant_by_pk?: Maybe<RoomParticipant>;
  /** fetch aggregated fields from the table: "Room" */
  readonly Room_aggregate: Room_Aggregate;
  /** fetch data from the table: "Room" using primary key columns */
  readonly Room_by_pk?: Maybe<Room>;
  /** fetch data from the table: "Tag" */
  readonly Tag: ReadonlyArray<Tag>;
  /** fetch aggregated fields from the table: "Tag" */
  readonly Tag_aggregate: Tag_Aggregate;
  /** fetch data from the table: "Tag" using primary key columns */
  readonly Tag_by_pk?: Maybe<Tag>;
  /** fetch data from the table: "Transitions" */
  readonly Transitions: ReadonlyArray<Transitions>;
  /** fetch aggregated fields from the table: "Transitions" */
  readonly Transitions_aggregate: Transitions_Aggregate;
  /** fetch data from the table: "Transitions" using primary key columns */
  readonly Transitions_by_pk?: Maybe<Transitions>;
  /** fetch data from the table: "Uploader" */
  readonly Uploader: ReadonlyArray<Uploader>;
  /** fetch aggregated fields from the table: "Uploader" */
  readonly Uploader_aggregate: Uploader_Aggregate;
  /** fetch data from the table: "Uploader" using primary key columns */
  readonly Uploader_by_pk?: Maybe<Uploader>;
  /** fetch data from the table: "User" */
  readonly User: ReadonlyArray<User>;
  /** fetch aggregated fields from the table: "User" */
  readonly User_aggregate: User_Aggregate;
  /** fetch data from the table: "User" using primary key columns */
  readonly User_by_pk?: Maybe<User>;
  /** perform the action: "echo" */
  readonly echo?: Maybe<EchoOutput>;
  /** perform the action: "getContentItem" */
  readonly getContentItem?: Maybe<ReadonlyArray<Maybe<GetContentItemOutput>>>;
  /** perform the action: "protectedEcho" */
  readonly protectedEcho?: Maybe<ProtectedEchoOutput>;
};


/** subscription root */
export type Subscription_RootAttendeeArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootAttendee_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Attendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Attendee_Order_By>>;
  where?: Maybe<Attendee_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootAttendee_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootBroadcastArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootBroadcastContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootBroadcastContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<BroadcastContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<BroadcastContentItem_Order_By>>;
  where?: Maybe<BroadcastContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootBroadcastContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootBroadcast_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Broadcast_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Broadcast_Order_By>>;
  where?: Maybe<Broadcast_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootBroadcast_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatMemberArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatMember_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMember_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMember_Order_By>>;
  where?: Maybe<ChatMember_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatMember_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatMessageArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatMessage_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatMessage_Order_By>>;
  where?: Maybe<ChatMessage_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatReactionArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatReaction_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatReaction_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatReaction_Order_By>>;
  where?: Maybe<ChatReaction_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatReaction_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatTyperArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatTyper_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatTyper_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatTyper_Order_By>>;
  where?: Maybe<ChatTyper_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatTyper_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatUnreadIndexArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatUnreadIndex_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatUnreadIndex_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatUnreadIndex_Order_By>>;
  where?: Maybe<ChatUnreadIndex_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatUnreadIndex_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChatViewerArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatViewer_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ChatViewer_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ChatViewer_Order_By>>;
  where?: Maybe<ChatViewer_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChatViewer_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Chat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Chat_Order_By>>;
  where?: Maybe<Chat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootConferenceArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConferenceConfigurationArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConferenceConfiguration_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceConfiguration_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceConfiguration_Order_By>>;
  where?: Maybe<ConferenceConfiguration_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConferenceConfiguration_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootConferenceDemoCodeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConferenceDemoCode_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ConferenceDemoCode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ConferenceDemoCode_Order_By>>;
  where?: Maybe<ConferenceDemoCode_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConferenceDemoCode_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootConference_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Conference_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Conference_Order_By>>;
  where?: Maybe<Conference_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootConference_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentGroupArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroupTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroupTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupTag_Order_By>>;
  where?: Maybe<ContentGroupTag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroupTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentGroupTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupType_Order_By>>;
  where?: Maybe<ContentGroupType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroupType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroupType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroupType_Order_By>>;
  where?: Maybe<ContentGroupType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroupType_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootContentGroup_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentGroup_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentGroup_Order_By>>;
  where?: Maybe<ContentGroup_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentGroup_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentItemPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentItemPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItemPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItemPerson_Order_By>>;
  where?: Maybe<ContentItemPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentItemPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentItem_Order_By>>;
  where?: Maybe<ContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentPerson_Order_By>>;
  where?: Maybe<ContentPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootContentTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentType_Order_By>>;
  where?: Maybe<ContentType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ContentType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ContentType_Order_By>>;
  where?: Maybe<ContentType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootContentType_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootEmailArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEmail_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Email_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Email_Order_By>>;
  where?: Maybe<Email_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEmail_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootEventArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventPersonArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventPersonRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPersonRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPersonRole_Order_By>>;
  where?: Maybe<EventPersonRole_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventPersonRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPersonRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPersonRole_Order_By>>;
  where?: Maybe<EventPersonRole_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventPersonRole_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootEventPerson_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventPerson_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventPerson_Order_By>>;
  where?: Maybe<EventPerson_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventPerson_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootEventTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<EventTag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<EventTag_Order_By>>;
  where?: Maybe<EventTag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEventTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootEvent_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Event_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Event_Order_By>>;
  where?: Maybe<Event_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootEvent_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootExecutedTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootExecutedTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<ExecutedTransitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<ExecutedTransitions_Order_By>>;
  where?: Maybe<ExecutedTransitions_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootExecutedTransitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootFlaggedChatMessageArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootFlaggedChatMessage_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FlaggedChatMessage_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FlaggedChatMessage_Order_By>>;
  where?: Maybe<FlaggedChatMessage_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootFlaggedChatMessage_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootFollowedChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootFollowedChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<FollowedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<FollowedChat_Order_By>>;
  where?: Maybe<FollowedChat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootFollowedChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootGroupArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroupAttendeeArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroupAttendee_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupAttendee_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupAttendee_Order_By>>;
  where?: Maybe<GroupAttendee_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroupAttendee_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootGroupRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroupRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<GroupRole_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<GroupRole_Order_By>>;
  where?: Maybe<GroupRole_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroupRole_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootGroup_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Group_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Group_Order_By>>;
  where?: Maybe<Group_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootGroup_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootInputTypeArgs = {
  distinct_on?: Maybe<ReadonlyArray<InputType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<InputType_Order_By>>;
  where?: Maybe<InputType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootInputType_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<InputType_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<InputType_Order_By>>;
  where?: Maybe<InputType_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootInputType_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootInvitationArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootInvitation_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Invitation_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Invitation_Order_By>>;
  where?: Maybe<Invitation_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootInvitation_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootOnlineStatusArgs = {
  distinct_on?: Maybe<ReadonlyArray<OnlineStatus_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OnlineStatus_Order_By>>;
  where?: Maybe<OnlineStatus_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootOnlineStatus_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<OnlineStatus_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OnlineStatus_Order_By>>;
  where?: Maybe<OnlineStatus_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootOnlineStatus_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootOriginatingDataArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootOriginatingData_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<OriginatingData_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<OriginatingData_Order_By>>;
  where?: Maybe<OriginatingData_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootOriginatingData_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootPermissionArgs = {
  distinct_on?: Maybe<ReadonlyArray<Permission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Permission_Order_By>>;
  where?: Maybe<Permission_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootPermission_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Permission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Permission_Order_By>>;
  where?: Maybe<Permission_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootPermission_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootPinnedChatArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootPinnedChat_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<PinnedChat_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<PinnedChat_Order_By>>;
  where?: Maybe<PinnedChat_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootPinnedChat_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootRequiredContentItemArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRequiredContentItem_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RequiredContentItem_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RequiredContentItem_Order_By>>;
  where?: Maybe<RequiredContentItem_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRequiredContentItem_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootRoleArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRolePermissionArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRolePermission_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RolePermission_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RolePermission_Order_By>>;
  where?: Maybe<RolePermission_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRolePermission_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootRole_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Role_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Role_Order_By>>;
  where?: Maybe<Role_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRole_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootRoomArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoomModeArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomMode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomMode_Order_By>>;
  where?: Maybe<RoomMode_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoomMode_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomMode_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomMode_Order_By>>;
  where?: Maybe<RoomMode_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoomMode_By_PkArgs = {
  name: Scalars['String'];
};


/** subscription root */
export type Subscription_RootRoomParticipantArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoomParticipant_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<RoomParticipant_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<RoomParticipant_Order_By>>;
  where?: Maybe<RoomParticipant_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoomParticipant_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootRoom_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Room_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Room_Order_By>>;
  where?: Maybe<Room_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootRoom_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootTagArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootTag_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Tag_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Tag_Order_By>>;
  where?: Maybe<Tag_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootTag_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootTransitionsArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootTransitions_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Transitions_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Transitions_Order_By>>;
  where?: Maybe<Transitions_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootTransitions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootUploaderArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootUploader_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<Uploader_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<Uploader_Order_By>>;
  where?: Maybe<Uploader_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootUploader_By_PkArgs = {
  id: Scalars['uuid'];
};


/** subscription root */
export type Subscription_RootUserArgs = {
  distinct_on?: Maybe<ReadonlyArray<User_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<User_Order_By>>;
  where?: Maybe<User_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootUser_AggregateArgs = {
  distinct_on?: Maybe<ReadonlyArray<User_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<ReadonlyArray<User_Order_By>>;
  where?: Maybe<User_Bool_Exp>;
};


/** subscription root */
export type Subscription_RootUser_By_PkArgs = {
  id: Scalars['String'];
};


/** subscription root */
export type Subscription_RootEchoArgs = {
  message: Scalars['String'];
};


/** subscription root */
export type Subscription_RootGetContentItemArgs = {
  magicToken: Scalars['String'];
};


/** subscription root */
export type Subscription_RootProtectedEchoArgs = {
  message: Scalars['String'];
};


/** expression to compare columns of type timestamptz. All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['timestamptz']>;
  readonly _gt?: Maybe<Scalars['timestamptz']>;
  readonly _gte?: Maybe<Scalars['timestamptz']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['timestamptz']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['timestamptz']>;
  readonly _lte?: Maybe<Scalars['timestamptz']>;
  readonly _neq?: Maybe<Scalars['timestamptz']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['timestamptz']>>;
};


/** expression to compare columns of type uuid. All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  readonly _eq?: Maybe<Scalars['uuid']>;
  readonly _gt?: Maybe<Scalars['uuid']>;
  readonly _gte?: Maybe<Scalars['uuid']>;
  readonly _in?: Maybe<ReadonlyArray<Scalars['uuid']>>;
  readonly _is_null?: Maybe<Scalars['Boolean']>;
  readonly _lt?: Maybe<Scalars['uuid']>;
  readonly _lte?: Maybe<Scalars['uuid']>;
  readonly _neq?: Maybe<Scalars['uuid']>;
  readonly _nin?: Maybe<ReadonlyArray<Scalars['uuid']>>;
};

export type SelectChatsQueryVariables = Exact<{ [key: string]: never; }>;


export type SelectChatsQuery = { readonly __typename?: 'query_root', readonly Chat: ReadonlyArray<{ readonly __typename?: 'Chat', readonly id: any, readonly name: string, readonly description?: Maybe<string>, readonly mode: string, readonly members: ReadonlyArray<{ readonly __typename?: 'ChatMember', readonly userId: string }>, readonly viewers: ReadonlyArray<{ readonly __typename?: 'ChatViewer', readonly id: any, readonly lastSeen: any, readonly userId: string }> }> };

export type SelectChatQueryVariables = Exact<{
  chatId: Scalars['uuid'];
}>;


export type SelectChatQuery = { readonly __typename?: 'query_root', readonly Chat: ReadonlyArray<{ readonly __typename?: 'Chat', readonly description?: Maybe<string>, readonly creatorId: string, readonly createdAt: any, readonly mode: string, readonly name: string, readonly isAutoNotify: boolean, readonly isAutoPin: boolean, readonly id: any, readonly updatedAt: any, readonly members: ReadonlyArray<{ readonly __typename?: 'ChatMember', readonly userId: string, readonly id: any, readonly invitationAcceptedAt?: Maybe<any>, readonly updatedAt: any, readonly createdAt: any }>, readonly creator: { readonly __typename?: 'User', readonly firstName: string, readonly lastName: string, readonly id: string } }> };

export type InsertMessageMutationVariables = Exact<{
  chatId: Scalars['uuid'];
  content: Scalars['jsonb'];
  index: Scalars['Int'];
}>;


export type InsertMessageMutation = { readonly __typename?: 'mutation_root', readonly insert_ChatMessage?: Maybe<{ readonly __typename?: 'ChatMessage_mutation_response', readonly affected_rows: number }> };

export type LiveChatSubscriptionVariables = Exact<{
  chatId: Scalars['uuid'];
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
}>;


export type LiveChatSubscription = { readonly __typename?: 'subscription_root', readonly Chat: ReadonlyArray<{ readonly __typename?: 'Chat', readonly id: any, readonly typers: ReadonlyArray<{ readonly __typename?: 'ChatTyper', readonly id: any, readonly userId: string, readonly updatedAt: any }>, readonly messages: ReadonlyArray<{ readonly __typename?: 'ChatMessage', readonly content: any, readonly createdAt: any, readonly id: any, readonly index: number, readonly isHighlighted: boolean, readonly senderId: string, readonly updatedAt: any, readonly reactions: ReadonlyArray<{ readonly __typename?: 'ChatReaction', readonly id: any, readonly createdAt: any, readonly reaction: string, readonly reactorId: string }> }>, readonly viewers: ReadonlyArray<{ readonly __typename?: 'ChatViewer', readonly id: any, readonly lastSeen: any, readonly userId: string }> }> };

export type UpsertIsTypingMutationVariables = Exact<{
  chatId: Scalars['uuid'];
  updatedAt: Scalars['timestamptz'];
}>;


export type UpsertIsTypingMutation = { readonly __typename?: 'mutation_root', readonly insert_ChatTyper?: Maybe<{ readonly __typename?: 'ChatTyper_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'ChatTyper', readonly id: any, readonly updatedAt: any, readonly chatId: any, readonly userId: string }> }> };

export type DeleteIsTypingMutationVariables = Exact<{
  chatId: Scalars['uuid'];
  userId: Scalars['String'];
}>;


export type DeleteIsTypingMutation = { readonly __typename?: 'mutation_root', readonly delete_ChatTyper?: Maybe<{ readonly __typename?: 'ChatTyper_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'ChatTyper', readonly id: any }> }> };

export type SelectAllRequiredContentQueryVariables = Exact<{
  conferenceId: Scalars['uuid'];
}>;


export type SelectAllRequiredContentQuery = { readonly __typename?: 'query_root', readonly RequiredContentItem: ReadonlyArray<{ readonly __typename?: 'RequiredContentItem', readonly conferenceId: any, readonly contentTypeName: ContentType_Enum, readonly id: any, readonly name: string, readonly contentGroup: { readonly __typename?: 'ContentGroup', readonly title: string }, readonly contentItem?: Maybe<{ readonly __typename?: 'ContentItem', readonly name: string }> }> };

export type SelectAllGroupsQueryVariables = Exact<{
  conferenceId: Scalars['uuid'];
}>;


export type SelectAllGroupsQuery = { readonly __typename?: 'query_root', readonly Group: ReadonlyArray<{ readonly __typename?: 'Group', readonly conferenceId: any, readonly enabled: boolean, readonly id: any, readonly includeUnauthenticated: boolean, readonly name: string, readonly groupRoles: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly roleId: any, readonly groupId: any }> }> };

export type CreateDeleteGroupsMutationVariables = Exact<{
  deleteGroupIds?: Maybe<ReadonlyArray<Scalars['uuid']>>;
  insertGroups: ReadonlyArray<Group_Insert_Input>;
}>;


export type CreateDeleteGroupsMutation = { readonly __typename?: 'mutation_root', readonly delete_Group?: Maybe<{ readonly __typename?: 'Group_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Group', readonly id: any }> }>, readonly insert_Group?: Maybe<{ readonly __typename?: 'Group_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Group', readonly id: any, readonly conferenceId: any, readonly name: string, readonly enabled: boolean, readonly includeUnauthenticated: boolean, readonly groupRoles: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly groupId: any, readonly roleId: any }> }> }> };

export type UpdateGroupMutationVariables = Exact<{
  groupId: Scalars['uuid'];
  groupName: Scalars['String'];
  enabled: Scalars['Boolean'];
  includeUnauthenticated: Scalars['Boolean'];
  insertRoles: ReadonlyArray<GroupRole_Insert_Input>;
  deleteRoleIds?: Maybe<ReadonlyArray<Scalars['uuid']>>;
}>;


export type UpdateGroupMutation = { readonly __typename?: 'mutation_root', readonly update_Group?: Maybe<{ readonly __typename?: 'Group_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Group', readonly id: any, readonly name: string, readonly conferenceId: any, readonly groupRoles: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly groupId: any, readonly roleId: any }> }> }>, readonly insert_GroupRole?: Maybe<{ readonly __typename?: 'GroupRole_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly groupId: any, readonly roleId: any }> }>, readonly delete_GroupRole?: Maybe<{ readonly __typename?: 'GroupRole_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any }> }> };

export type UpdateConferenceMutationVariables = Exact<{
  id: Scalars['uuid'];
  name?: Maybe<Scalars['String']>;
  shortName?: Maybe<Scalars['String']>;
  slug?: Maybe<Scalars['String']>;
}>;


export type UpdateConferenceMutation = { readonly __typename?: 'mutation_root', readonly update_Conference?: Maybe<{ readonly __typename?: 'Conference_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Conference', readonly id: any, readonly name: string, readonly shortName: string, readonly slug: string }> }> };

export type AttendeePartsFragment = { readonly __typename?: 'Attendee', readonly conferenceId: any, readonly id: any, readonly userId?: Maybe<string>, readonly updatedAt: any, readonly createdAt: any, readonly displayName: string, readonly inviteSent?: Maybe<boolean>, readonly groupAttendees: ReadonlyArray<{ readonly __typename?: 'GroupAttendee', readonly attendeeId: any, readonly id: any, readonly groupId: any }>, readonly invitation?: Maybe<{ readonly __typename?: 'Invitation', readonly attendeeId: any, readonly id: any, readonly inviteCode: any, readonly invitedEmailAddress: string, readonly linkToUserId?: Maybe<string>, readonly createdAt: any, readonly updatedAt: any }> };

export type SelectAllAttendeesQueryVariables = Exact<{
  conferenceId: Scalars['uuid'];
}>;


export type SelectAllAttendeesQuery = { readonly __typename?: 'query_root', readonly Attendee: ReadonlyArray<(
    { readonly __typename?: 'Attendee' }
    & AttendeePartsFragment
  )> };

export type CreateDeleteAttendeesMutationVariables = Exact<{
  deleteAttendeeIds?: Maybe<ReadonlyArray<Scalars['uuid']>>;
  insertAttendees: ReadonlyArray<Attendee_Insert_Input>;
  insertInvitations: ReadonlyArray<Invitation_Insert_Input>;
}>;


export type CreateDeleteAttendeesMutation = { readonly __typename?: 'mutation_root', readonly delete_Attendee?: Maybe<{ readonly __typename?: 'Attendee_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Attendee', readonly id: any }> }>, readonly insert_Attendee?: Maybe<{ readonly __typename?: 'Attendee_mutation_response', readonly returning: ReadonlyArray<(
      { readonly __typename?: 'Attendee' }
      & AttendeePartsFragment
    )> }>, readonly insert_Invitation?: Maybe<{ readonly __typename?: 'Invitation_mutation_response', readonly affected_rows: number }> };

export type UpdateAttendeeMutationVariables = Exact<{
  attendeeId: Scalars['uuid'];
  attendeeName: Scalars['String'];
  insertGroups: ReadonlyArray<GroupAttendee_Insert_Input>;
  deleteGroupIds?: Maybe<ReadonlyArray<Scalars['uuid']>>;
}>;


export type UpdateAttendeeMutation = { readonly __typename?: 'mutation_root', readonly update_Attendee_by_pk?: Maybe<(
    { readonly __typename?: 'Attendee' }
    & AttendeePartsFragment
  )>, readonly insert_GroupAttendee?: Maybe<{ readonly __typename?: 'GroupAttendee_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'GroupAttendee', readonly id: any, readonly attendeeId: any, readonly groupId: any }> }>, readonly delete_GroupAttendee?: Maybe<{ readonly __typename?: 'GroupAttendee_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'GroupAttendee', readonly id: any }> }> };

export type SendInitialInviteEmailsMutationVariables = Exact<{
  attendeeIds: ReadonlyArray<Scalars['String']>;
}>;


export type SendInitialInviteEmailsMutation = { readonly __typename?: 'mutation_root', readonly invitationSendInitialEmail: ReadonlyArray<{ readonly __typename?: 'InvitationSendEmailResult', readonly attendeeId: string, readonly sent: boolean }> };

export type SendRepeatInviteEmailsMutationVariables = Exact<{
  attendeeIds: ReadonlyArray<Scalars['String']>;
}>;


export type SendRepeatInviteEmailsMutation = { readonly __typename?: 'mutation_root', readonly invitationSendRepeatEmail: ReadonlyArray<{ readonly __typename?: 'InvitationSendEmailResult', readonly attendeeId: string, readonly sent: boolean }> };

export type SelectAllPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type SelectAllPermissionsQuery = { readonly __typename?: 'query_root', readonly Permission: ReadonlyArray<{ readonly __typename?: 'Permission', readonly name: string, readonly description: string }> };

export type SelectAllRolesQueryVariables = Exact<{
  conferenceId: Scalars['uuid'];
}>;


export type SelectAllRolesQuery = { readonly __typename?: 'query_root', readonly Role: ReadonlyArray<{ readonly __typename?: 'Role', readonly conferenceId: any, readonly id: any, readonly name: string, readonly rolePermissions: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any, readonly permissionName: Permission_Enum, readonly roleId: any }> }> };

export type CreateDeleteRolesMutationVariables = Exact<{
  deleteRoleIds?: Maybe<ReadonlyArray<Scalars['uuid']>>;
  insertRoles: ReadonlyArray<Role_Insert_Input>;
}>;


export type CreateDeleteRolesMutation = { readonly __typename?: 'mutation_root', readonly delete_Role?: Maybe<{ readonly __typename?: 'Role_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Role', readonly id: any }> }>, readonly insert_Role?: Maybe<{ readonly __typename?: 'Role_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Role', readonly id: any, readonly conferenceId: any, readonly name: string, readonly rolePermissions: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any, readonly permissionName: Permission_Enum, readonly roleId: any }> }> }> };

export type UpdateRoleMutationVariables = Exact<{
  roleId: Scalars['uuid'];
  roleName: Scalars['String'];
  insertPermissions: ReadonlyArray<RolePermission_Insert_Input>;
  deletePermissionNames?: Maybe<ReadonlyArray<Permission_Enum>>;
}>;


export type UpdateRoleMutation = { readonly __typename?: 'mutation_root', readonly update_Role?: Maybe<{ readonly __typename?: 'Role_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Role', readonly id: any, readonly name: string, readonly conferenceId: any, readonly rolePermissions: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any, readonly permissionName: Permission_Enum, readonly roleId: any }> }> }>, readonly insert_RolePermission?: Maybe<{ readonly __typename?: 'RolePermission_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any, readonly permissionName: Permission_Enum, readonly roleId: any }> }>, readonly delete_RolePermission?: Maybe<{ readonly __typename?: 'RolePermission_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any }> }> };

export type ConferenceTakenQueryVariables = Exact<{
  name: Scalars['String'];
  shortName: Scalars['String'];
  slug: Scalars['String'];
}>;


export type ConferenceTakenQuery = { readonly __typename?: 'query_root', readonly Conference: ReadonlyArray<{ readonly __typename?: 'Conference', readonly id: any, readonly name: string, readonly shortName: string, readonly slug: string }> };

export type CreateConferenceMutationVariables = Exact<{
  name: Scalars['String'];
  shortName: Scalars['String'];
  slug: Scalars['String'];
  demoCode: Scalars['uuid'];
}>;


export type CreateConferenceMutation = { readonly __typename?: 'mutation_root', readonly insert_Conference?: Maybe<{ readonly __typename?: 'Conference_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Conference', readonly id: any, readonly slug: string }> }>, readonly update_ConferenceDemoCode?: Maybe<{ readonly __typename?: 'ConferenceDemoCode_mutation_response', readonly affected_rows: number }> };

export type CreateNewConferenceMetaStructureMutationVariables = Exact<{
  conferenceId: Scalars['uuid'];
  attendeeDisplayName: Scalars['String'];
  userId: Scalars['String'];
}>;


export type CreateNewConferenceMetaStructureMutation = { readonly __typename?: 'mutation_root', readonly insert_Attendee?: Maybe<{ readonly __typename?: 'Attendee_mutation_response', readonly affected_rows: number }>, readonly insert_Group?: Maybe<{ readonly __typename?: 'Group_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'Group', readonly id: any, readonly conferenceId: any, readonly name: string, readonly enabled: boolean, readonly groupRoles: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly roleId: any, readonly groupId: any, readonly role: { readonly __typename?: 'Role', readonly id: any, readonly name: string, readonly conferenceId: any, readonly rolePermissions: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly id: any, readonly roleId: any, readonly permissionName: Permission_Enum }> } }> }> }> };

export type ConferenceBySlugQueryVariables = Exact<{
  slug: Scalars['String'];
}>;


export type ConferenceBySlugQuery = { readonly __typename?: 'query_root', readonly Conference: ReadonlyArray<{ readonly __typename?: 'Conference', readonly createdBy: string, readonly id: any, readonly name: string, readonly shortName: string, readonly slug: string, readonly updatedAt: any, readonly createdAt: any }> };

export type CurrentUserGroupsRolesPermissionsQueryVariables = Exact<{
  userId: Scalars['String'];
  conferenceId: Scalars['uuid'];
}>;


export type CurrentUserGroupsRolesPermissionsQuery = { readonly __typename?: 'query_root', readonly User: ReadonlyArray<{ readonly __typename?: 'User', readonly id: string, readonly conferencesCreated: ReadonlyArray<{ readonly __typename?: 'Conference', readonly id: any }>, readonly attendees: ReadonlyArray<{ readonly __typename?: 'Attendee', readonly id: any, readonly userId?: Maybe<string>, readonly conferenceId: any, readonly displayName: string, readonly groupAttendees: ReadonlyArray<{ readonly __typename?: 'GroupAttendee', readonly id: any, readonly groupId: any, readonly attendeeId: any, readonly group: { readonly __typename?: 'Group', readonly enabled: boolean, readonly id: any, readonly includeUnauthenticated: boolean, readonly name: string, readonly conferenceId: any, readonly groupRoles: ReadonlyArray<{ readonly __typename?: 'GroupRole', readonly id: any, readonly roleId: any, readonly groupId: any, readonly role: { readonly __typename?: 'Role', readonly id: any, readonly name: string, readonly conferenceId: any, readonly rolePermissions: ReadonlyArray<{ readonly __typename?: 'RolePermission', readonly permissionName: Permission_Enum, readonly id: any, readonly roleId: any }> } }> } }> }> }> };

export type SelectRequiredItemQueryVariables = Exact<{ [key: string]: never; }>;


export type SelectRequiredItemQuery = { readonly __typename?: 'query_root', readonly RequiredContentItem: ReadonlyArray<{ readonly __typename?: 'RequiredContentItem', readonly id: any, readonly contentTypeName: ContentType_Enum, readonly name: string, readonly conference: { readonly __typename?: 'Conference', readonly id: any, readonly name: string } }> };

export type SubmitContentItemMutationVariables = Exact<{
  contentItemData: Scalars['jsonb'];
  magicToken: Scalars['String'];
}>;


export type SubmitContentItemMutation = { readonly __typename?: 'mutation_root', readonly submitContentItem?: Maybe<{ readonly __typename?: 'SubmitContentItemOutput', readonly message: string, readonly success: boolean }> };

export type GetContentItemQueryVariables = Exact<{
  magicToken: Scalars['String'];
}>;


export type GetContentItemQuery = { readonly __typename?: 'query_root', readonly getContentItem?: Maybe<ReadonlyArray<Maybe<{ readonly __typename?: 'GetContentItemOutput', readonly contentTypeName: string, readonly data: any, readonly layoutData?: Maybe<any>, readonly name: string, readonly id: string }>>> };

export type EchoQueryVariables = Exact<{
  message: Scalars['String'];
}>;


export type EchoQuery = { readonly __typename?: 'query_root', readonly echo?: Maybe<{ readonly __typename?: 'EchoOutput', readonly message: string }> };

export type ProtectedEchoQueryVariables = Exact<{
  message: Scalars['String'];
}>;


export type ProtectedEchoQuery = { readonly __typename?: 'query_root', readonly protectedEcho?: Maybe<{ readonly __typename?: 'ProtectedEchoOutput', readonly message: string }> };

export type SelectInvitationForAcceptQueryVariables = Exact<{
  inviteCode: Scalars['uuid'];
}>;


export type SelectInvitationForAcceptQuery = { readonly __typename?: 'query_root', readonly Invitation: ReadonlyArray<{ readonly __typename?: 'Invitation', readonly hash?: Maybe<string> }> };

export type Invitation_ConfirmCurrentMutationVariables = Exact<{
  inviteCode: Scalars['uuid'];
}>;


export type Invitation_ConfirmCurrentMutation = { readonly __typename?: 'mutation_root', readonly invitationConfirmCurrent?: Maybe<{ readonly __typename?: 'ConfirmInvitationOutput', readonly confSlug?: Maybe<string>, readonly ok: boolean }> };

export type Invitation_ConfirmWithCodeMutationVariables = Exact<{
  inviteCode: Scalars['uuid'];
  confirmationCode: Scalars['String'];
}>;


export type Invitation_ConfirmWithCodeMutation = { readonly __typename?: 'mutation_root', readonly invitationConfirmWithCode?: Maybe<{ readonly __typename?: 'ConfirmInvitationOutput', readonly confSlug?: Maybe<string>, readonly ok: boolean }> };

export type SendInitialConfirmationEmailMutationVariables = Exact<{
  inviteCode: Scalars['uuid'];
}>;


export type SendInitialConfirmationEmailMutation = { readonly __typename?: 'mutation_root', readonly invitationConfirmSendInitialEmail?: Maybe<{ readonly __typename?: 'InvitationConfirmationEmailOutput', readonly sent: boolean }> };

export type SendRepeatConfirmationEmailMutationVariables = Exact<{
  inviteCode: Scalars['uuid'];
}>;


export type SendRepeatConfirmationEmailMutation = { readonly __typename?: 'mutation_root', readonly invitationConfirmSendRepeatEmail?: Maybe<{ readonly __typename?: 'InvitationConfirmationEmailOutput', readonly sent: boolean }> };

export type SelectUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type SelectUsersQuery = { readonly __typename?: 'query_root', readonly User: ReadonlyArray<{ readonly __typename?: 'User', readonly id: string, readonly lastName: string, readonly firstName: string, readonly onlineStatus?: Maybe<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly lastSeen: any, readonly isIncognito: boolean }> }> };

export type SelectCurrentUserQueryVariables = Exact<{
  userId: Scalars['String'];
}>;


export type SelectCurrentUserQuery = { readonly __typename?: 'query_root', readonly User: ReadonlyArray<{ readonly __typename?: 'User', readonly id: string, readonly email?: Maybe<string>, readonly lastName: string, readonly firstName: string, readonly onlineStatus?: Maybe<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly lastSeen: any, readonly isIncognito: boolean }> }> };

export type GetCurrentUserIsIncognitoQueryVariables = Exact<{
  userId: Scalars['String'];
}>;


export type GetCurrentUserIsIncognitoQuery = { readonly __typename?: 'query_root', readonly OnlineStatus: ReadonlyArray<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly isIncognito: boolean }> };

export type UpdateCurrentUserIsIncognitoMutationVariables = Exact<{
  userId: Scalars['String'];
  isIncognito?: Maybe<Scalars['Boolean']>;
}>;


export type UpdateCurrentUserIsIncognitoMutation = { readonly __typename?: 'mutation_root', readonly update_OnlineStatus?: Maybe<{ readonly __typename?: 'OnlineStatus_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly isIncognito: boolean }> }> };

export type GetCurrentUserLastSeenQueryVariables = Exact<{
  userId: Scalars['String'];
}>;


export type GetCurrentUserLastSeenQuery = { readonly __typename?: 'query_root', readonly OnlineStatus: ReadonlyArray<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly lastSeen: any }> };

export type InsertCurrentUserOnlineStatusMutationVariables = Exact<{
  userId: Scalars['String'];
}>;


export type InsertCurrentUserOnlineStatusMutation = { readonly __typename?: 'mutation_root', readonly insert_OnlineStatus?: Maybe<{ readonly __typename?: 'OnlineStatus_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly isIncognito: boolean, readonly lastSeen: any, readonly userId: string }> }> };

export type UpdateCurrentUserLastSeenMutationVariables = Exact<{
  userId: Scalars['String'];
  lastSeen?: Maybe<Scalars['timestamptz']>;
}>;


export type UpdateCurrentUserLastSeenMutation = { readonly __typename?: 'mutation_root', readonly update_OnlineStatus?: Maybe<{ readonly __typename?: 'OnlineStatus_mutation_response', readonly returning: ReadonlyArray<{ readonly __typename?: 'OnlineStatus', readonly id: any, readonly lastSeen: any }> }> };

export const AttendeePartsFragmentDoc = gql`
    fragment AttendeeParts on Attendee {
  conferenceId
  id
  groupAttendees {
    attendeeId
    id
    groupId
  }
  invitation {
    attendeeId
    id
    inviteCode
    invitedEmailAddress
    linkToUserId
    createdAt
    updatedAt
  }
  userId
  updatedAt
  createdAt
  displayName
  inviteSent
}
    `;
export const SelectChatsDocument = gql`
    query selectChats {
  Chat {
    id
    name
    description
    mode
    members {
      userId
    }
    viewers {
      id
      lastSeen
      userId
    }
  }
}
    `;

/**
 * __useSelectChatsQuery__
 *
 * To run a query within a React component, call `useSelectChatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectChatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectChatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSelectChatsQuery(baseOptions?: Apollo.QueryHookOptions<SelectChatsQuery, SelectChatsQueryVariables>) {
        return Apollo.useQuery<SelectChatsQuery, SelectChatsQueryVariables>(SelectChatsDocument, baseOptions);
      }
export function useSelectChatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectChatsQuery, SelectChatsQueryVariables>) {
          return Apollo.useLazyQuery<SelectChatsQuery, SelectChatsQueryVariables>(SelectChatsDocument, baseOptions);
        }
export type SelectChatsQueryHookResult = ReturnType<typeof useSelectChatsQuery>;
export type SelectChatsLazyQueryHookResult = ReturnType<typeof useSelectChatsLazyQuery>;
export type SelectChatsQueryResult = Apollo.QueryResult<SelectChatsQuery, SelectChatsQueryVariables>;
export const SelectChatDocument = gql`
    query SelectChat($chatId: uuid!) {
  Chat(where: {id: {_eq: $chatId}}) {
    description
    creatorId
    createdAt
    mode
    name
    isAutoNotify
    isAutoPin
    id
    updatedAt
    members {
      userId
      id
      invitationAcceptedAt
      updatedAt
      createdAt
    }
    creator {
      firstName
      lastName
      id
    }
  }
}
    `;

/**
 * __useSelectChatQuery__
 *
 * To run a query within a React component, call `useSelectChatQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectChatQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectChatQuery({
 *   variables: {
 *      chatId: // value for 'chatId'
 *   },
 * });
 */
export function useSelectChatQuery(baseOptions: Apollo.QueryHookOptions<SelectChatQuery, SelectChatQueryVariables>) {
        return Apollo.useQuery<SelectChatQuery, SelectChatQueryVariables>(SelectChatDocument, baseOptions);
      }
export function useSelectChatLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectChatQuery, SelectChatQueryVariables>) {
          return Apollo.useLazyQuery<SelectChatQuery, SelectChatQueryVariables>(SelectChatDocument, baseOptions);
        }
export type SelectChatQueryHookResult = ReturnType<typeof useSelectChatQuery>;
export type SelectChatLazyQueryHookResult = ReturnType<typeof useSelectChatLazyQuery>;
export type SelectChatQueryResult = Apollo.QueryResult<SelectChatQuery, SelectChatQueryVariables>;
export const InsertMessageDocument = gql`
    mutation InsertMessage($chatId: uuid!, $content: jsonb!, $index: Int!) {
  insert_ChatMessage(objects: {chatId: $chatId, content: $content, index: $index}) {
    affected_rows
  }
}
    `;
export type InsertMessageMutationFn = Apollo.MutationFunction<InsertMessageMutation, InsertMessageMutationVariables>;

/**
 * __useInsertMessageMutation__
 *
 * To run a mutation, you first call `useInsertMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertMessageMutation, { data, loading, error }] = useInsertMessageMutation({
 *   variables: {
 *      chatId: // value for 'chatId'
 *      content: // value for 'content'
 *      index: // value for 'index'
 *   },
 * });
 */
export function useInsertMessageMutation(baseOptions?: Apollo.MutationHookOptions<InsertMessageMutation, InsertMessageMutationVariables>) {
        return Apollo.useMutation<InsertMessageMutation, InsertMessageMutationVariables>(InsertMessageDocument, baseOptions);
      }
export type InsertMessageMutationHookResult = ReturnType<typeof useInsertMessageMutation>;
export type InsertMessageMutationResult = Apollo.MutationResult<InsertMessageMutation>;
export type InsertMessageMutationOptions = Apollo.BaseMutationOptions<InsertMessageMutation, InsertMessageMutationVariables>;
export const LiveChatDocument = gql`
    subscription LiveChat($chatId: uuid!, $limit: Int = 20, $offset: Int = 0) {
  Chat(where: {id: {_eq: $chatId}}) {
    id
    typers {
      id
      userId
      updatedAt
    }
    messages(order_by: {index: desc}, limit: $limit, offset: $offset) {
      content
      createdAt
      id
      index
      isHighlighted
      senderId
      updatedAt
      reactions {
        id
        createdAt
        reaction
        reactorId
      }
    }
    viewers {
      id
      lastSeen
      userId
    }
  }
}
    `;

/**
 * __useLiveChatSubscription__
 *
 * To run a query within a React component, call `useLiveChatSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLiveChatSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLiveChatSubscription({
 *   variables: {
 *      chatId: // value for 'chatId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useLiveChatSubscription(baseOptions: Apollo.SubscriptionHookOptions<LiveChatSubscription, LiveChatSubscriptionVariables>) {
        return Apollo.useSubscription<LiveChatSubscription, LiveChatSubscriptionVariables>(LiveChatDocument, baseOptions);
      }
export type LiveChatSubscriptionHookResult = ReturnType<typeof useLiveChatSubscription>;
export type LiveChatSubscriptionResult = Apollo.SubscriptionResult<LiveChatSubscription>;
export const UpsertIsTypingDocument = gql`
    mutation UpsertIsTyping($chatId: uuid!, $updatedAt: timestamptz!) {
  insert_ChatTyper(
    objects: {chatId: $chatId, updatedAt: $updatedAt}
    on_conflict: {constraint: ChatTyper_chatId_userId_key, update_columns: updatedAt}
  ) {
    returning {
      id
      updatedAt
      chatId
      userId
    }
  }
}
    `;
export type UpsertIsTypingMutationFn = Apollo.MutationFunction<UpsertIsTypingMutation, UpsertIsTypingMutationVariables>;

/**
 * __useUpsertIsTypingMutation__
 *
 * To run a mutation, you first call `useUpsertIsTypingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertIsTypingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertIsTypingMutation, { data, loading, error }] = useUpsertIsTypingMutation({
 *   variables: {
 *      chatId: // value for 'chatId'
 *      updatedAt: // value for 'updatedAt'
 *   },
 * });
 */
export function useUpsertIsTypingMutation(baseOptions?: Apollo.MutationHookOptions<UpsertIsTypingMutation, UpsertIsTypingMutationVariables>) {
        return Apollo.useMutation<UpsertIsTypingMutation, UpsertIsTypingMutationVariables>(UpsertIsTypingDocument, baseOptions);
      }
export type UpsertIsTypingMutationHookResult = ReturnType<typeof useUpsertIsTypingMutation>;
export type UpsertIsTypingMutationResult = Apollo.MutationResult<UpsertIsTypingMutation>;
export type UpsertIsTypingMutationOptions = Apollo.BaseMutationOptions<UpsertIsTypingMutation, UpsertIsTypingMutationVariables>;
export const DeleteIsTypingDocument = gql`
    mutation DeleteIsTyping($chatId: uuid!, $userId: String!) {
  delete_ChatTyper(where: {chatId: {_eq: $chatId}, userId: {_eq: $userId}}) {
    returning {
      id
    }
  }
}
    `;
export type DeleteIsTypingMutationFn = Apollo.MutationFunction<DeleteIsTypingMutation, DeleteIsTypingMutationVariables>;

/**
 * __useDeleteIsTypingMutation__
 *
 * To run a mutation, you first call `useDeleteIsTypingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteIsTypingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteIsTypingMutation, { data, loading, error }] = useDeleteIsTypingMutation({
 *   variables: {
 *      chatId: // value for 'chatId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useDeleteIsTypingMutation(baseOptions?: Apollo.MutationHookOptions<DeleteIsTypingMutation, DeleteIsTypingMutationVariables>) {
        return Apollo.useMutation<DeleteIsTypingMutation, DeleteIsTypingMutationVariables>(DeleteIsTypingDocument, baseOptions);
      }
export type DeleteIsTypingMutationHookResult = ReturnType<typeof useDeleteIsTypingMutation>;
export type DeleteIsTypingMutationResult = Apollo.MutationResult<DeleteIsTypingMutation>;
export type DeleteIsTypingMutationOptions = Apollo.BaseMutationOptions<DeleteIsTypingMutation, DeleteIsTypingMutationVariables>;
export const SelectAllRequiredContentDocument = gql`
    query SelectAllRequiredContent($conferenceId: uuid!) {
  RequiredContentItem(where: {conferenceId: {_eq: $conferenceId}}) {
    conferenceId
    contentGroup {
      title
    }
    contentTypeName
    contentItem {
      name
    }
    id
    name
  }
}
    `;

/**
 * __useSelectAllRequiredContentQuery__
 *
 * To run a query within a React component, call `useSelectAllRequiredContentQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectAllRequiredContentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectAllRequiredContentQuery({
 *   variables: {
 *      conferenceId: // value for 'conferenceId'
 *   },
 * });
 */
export function useSelectAllRequiredContentQuery(baseOptions: Apollo.QueryHookOptions<SelectAllRequiredContentQuery, SelectAllRequiredContentQueryVariables>) {
        return Apollo.useQuery<SelectAllRequiredContentQuery, SelectAllRequiredContentQueryVariables>(SelectAllRequiredContentDocument, baseOptions);
      }
export function useSelectAllRequiredContentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectAllRequiredContentQuery, SelectAllRequiredContentQueryVariables>) {
          return Apollo.useLazyQuery<SelectAllRequiredContentQuery, SelectAllRequiredContentQueryVariables>(SelectAllRequiredContentDocument, baseOptions);
        }
export type SelectAllRequiredContentQueryHookResult = ReturnType<typeof useSelectAllRequiredContentQuery>;
export type SelectAllRequiredContentLazyQueryHookResult = ReturnType<typeof useSelectAllRequiredContentLazyQuery>;
export type SelectAllRequiredContentQueryResult = Apollo.QueryResult<SelectAllRequiredContentQuery, SelectAllRequiredContentQueryVariables>;
export const SelectAllGroupsDocument = gql`
    query SelectAllGroups($conferenceId: uuid!) {
  Group(where: {conferenceId: {_eq: $conferenceId}}) {
    conferenceId
    enabled
    id
    includeUnauthenticated
    name
    groupRoles {
      id
      roleId
      groupId
    }
  }
}
    `;

/**
 * __useSelectAllGroupsQuery__
 *
 * To run a query within a React component, call `useSelectAllGroupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectAllGroupsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectAllGroupsQuery({
 *   variables: {
 *      conferenceId: // value for 'conferenceId'
 *   },
 * });
 */
export function useSelectAllGroupsQuery(baseOptions: Apollo.QueryHookOptions<SelectAllGroupsQuery, SelectAllGroupsQueryVariables>) {
        return Apollo.useQuery<SelectAllGroupsQuery, SelectAllGroupsQueryVariables>(SelectAllGroupsDocument, baseOptions);
      }
export function useSelectAllGroupsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectAllGroupsQuery, SelectAllGroupsQueryVariables>) {
          return Apollo.useLazyQuery<SelectAllGroupsQuery, SelectAllGroupsQueryVariables>(SelectAllGroupsDocument, baseOptions);
        }
export type SelectAllGroupsQueryHookResult = ReturnType<typeof useSelectAllGroupsQuery>;
export type SelectAllGroupsLazyQueryHookResult = ReturnType<typeof useSelectAllGroupsLazyQuery>;
export type SelectAllGroupsQueryResult = Apollo.QueryResult<SelectAllGroupsQuery, SelectAllGroupsQueryVariables>;
export const CreateDeleteGroupsDocument = gql`
    mutation CreateDeleteGroups($deleteGroupIds: [uuid!] = [], $insertGroups: [Group_insert_input!]!) {
  delete_Group(where: {id: {_in: $deleteGroupIds}}) {
    returning {
      id
    }
  }
  insert_Group(objects: $insertGroups) {
    returning {
      id
      conferenceId
      name
      enabled
      includeUnauthenticated
      groupRoles {
        id
        groupId
        roleId
      }
    }
  }
}
    `;
export type CreateDeleteGroupsMutationFn = Apollo.MutationFunction<CreateDeleteGroupsMutation, CreateDeleteGroupsMutationVariables>;

/**
 * __useCreateDeleteGroupsMutation__
 *
 * To run a mutation, you first call `useCreateDeleteGroupsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDeleteGroupsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDeleteGroupsMutation, { data, loading, error }] = useCreateDeleteGroupsMutation({
 *   variables: {
 *      deleteGroupIds: // value for 'deleteGroupIds'
 *      insertGroups: // value for 'insertGroups'
 *   },
 * });
 */
export function useCreateDeleteGroupsMutation(baseOptions?: Apollo.MutationHookOptions<CreateDeleteGroupsMutation, CreateDeleteGroupsMutationVariables>) {
        return Apollo.useMutation<CreateDeleteGroupsMutation, CreateDeleteGroupsMutationVariables>(CreateDeleteGroupsDocument, baseOptions);
      }
export type CreateDeleteGroupsMutationHookResult = ReturnType<typeof useCreateDeleteGroupsMutation>;
export type CreateDeleteGroupsMutationResult = Apollo.MutationResult<CreateDeleteGroupsMutation>;
export type CreateDeleteGroupsMutationOptions = Apollo.BaseMutationOptions<CreateDeleteGroupsMutation, CreateDeleteGroupsMutationVariables>;
export const UpdateGroupDocument = gql`
    mutation UpdateGroup($groupId: uuid!, $groupName: String!, $enabled: Boolean!, $includeUnauthenticated: Boolean!, $insertRoles: [GroupRole_insert_input!]!, $deleteRoleIds: [uuid!] = []) {
  update_Group(
    where: {id: {_eq: $groupId}}
    _set: {name: $groupName, enabled: $enabled, includeUnauthenticated: $includeUnauthenticated}
  ) {
    returning {
      id
      name
      groupRoles {
        id
        groupId
        roleId
      }
      conferenceId
    }
  }
  insert_GroupRole(objects: $insertRoles) {
    returning {
      id
      groupId
      roleId
    }
  }
  delete_GroupRole(where: {roleId: {_in: $deleteRoleIds}}) {
    returning {
      id
    }
  }
}
    `;
export type UpdateGroupMutationFn = Apollo.MutationFunction<UpdateGroupMutation, UpdateGroupMutationVariables>;

/**
 * __useUpdateGroupMutation__
 *
 * To run a mutation, you first call `useUpdateGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateGroupMutation, { data, loading, error }] = useUpdateGroupMutation({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      groupName: // value for 'groupName'
 *      enabled: // value for 'enabled'
 *      includeUnauthenticated: // value for 'includeUnauthenticated'
 *      insertRoles: // value for 'insertRoles'
 *      deleteRoleIds: // value for 'deleteRoleIds'
 *   },
 * });
 */
export function useUpdateGroupMutation(baseOptions?: Apollo.MutationHookOptions<UpdateGroupMutation, UpdateGroupMutationVariables>) {
        return Apollo.useMutation<UpdateGroupMutation, UpdateGroupMutationVariables>(UpdateGroupDocument, baseOptions);
      }
export type UpdateGroupMutationHookResult = ReturnType<typeof useUpdateGroupMutation>;
export type UpdateGroupMutationResult = Apollo.MutationResult<UpdateGroupMutation>;
export type UpdateGroupMutationOptions = Apollo.BaseMutationOptions<UpdateGroupMutation, UpdateGroupMutationVariables>;
export const UpdateConferenceDocument = gql`
    mutation UpdateConference($id: uuid!, $name: String = "", $shortName: String = "", $slug: String = "") {
  update_Conference(
    where: {id: {_eq: $id}}
    _set: {name: $name, shortName: $shortName, slug: $slug}
  ) {
    returning {
      id
      name
      shortName
      slug
    }
  }
}
    `;
export type UpdateConferenceMutationFn = Apollo.MutationFunction<UpdateConferenceMutation, UpdateConferenceMutationVariables>;

/**
 * __useUpdateConferenceMutation__
 *
 * To run a mutation, you first call `useUpdateConferenceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateConferenceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateConferenceMutation, { data, loading, error }] = useUpdateConferenceMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      shortName: // value for 'shortName'
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useUpdateConferenceMutation(baseOptions?: Apollo.MutationHookOptions<UpdateConferenceMutation, UpdateConferenceMutationVariables>) {
        return Apollo.useMutation<UpdateConferenceMutation, UpdateConferenceMutationVariables>(UpdateConferenceDocument, baseOptions);
      }
export type UpdateConferenceMutationHookResult = ReturnType<typeof useUpdateConferenceMutation>;
export type UpdateConferenceMutationResult = Apollo.MutationResult<UpdateConferenceMutation>;
export type UpdateConferenceMutationOptions = Apollo.BaseMutationOptions<UpdateConferenceMutation, UpdateConferenceMutationVariables>;
export const SelectAllAttendeesDocument = gql`
    query SelectAllAttendees($conferenceId: uuid!) {
  Attendee(where: {conferenceId: {_eq: $conferenceId}}) {
    ...AttendeeParts
  }
}
    ${AttendeePartsFragmentDoc}`;

/**
 * __useSelectAllAttendeesQuery__
 *
 * To run a query within a React component, call `useSelectAllAttendeesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectAllAttendeesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectAllAttendeesQuery({
 *   variables: {
 *      conferenceId: // value for 'conferenceId'
 *   },
 * });
 */
export function useSelectAllAttendeesQuery(baseOptions: Apollo.QueryHookOptions<SelectAllAttendeesQuery, SelectAllAttendeesQueryVariables>) {
        return Apollo.useQuery<SelectAllAttendeesQuery, SelectAllAttendeesQueryVariables>(SelectAllAttendeesDocument, baseOptions);
      }
export function useSelectAllAttendeesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectAllAttendeesQuery, SelectAllAttendeesQueryVariables>) {
          return Apollo.useLazyQuery<SelectAllAttendeesQuery, SelectAllAttendeesQueryVariables>(SelectAllAttendeesDocument, baseOptions);
        }
export type SelectAllAttendeesQueryHookResult = ReturnType<typeof useSelectAllAttendeesQuery>;
export type SelectAllAttendeesLazyQueryHookResult = ReturnType<typeof useSelectAllAttendeesLazyQuery>;
export type SelectAllAttendeesQueryResult = Apollo.QueryResult<SelectAllAttendeesQuery, SelectAllAttendeesQueryVariables>;
export const CreateDeleteAttendeesDocument = gql`
    mutation CreateDeleteAttendees($deleteAttendeeIds: [uuid!] = [], $insertAttendees: [Attendee_insert_input!]!, $insertInvitations: [Invitation_insert_input!]!) {
  delete_Attendee(where: {id: {_in: $deleteAttendeeIds}}) {
    returning {
      id
    }
  }
  insert_Attendee(objects: $insertAttendees) {
    returning {
      ...AttendeeParts
    }
  }
  insert_Invitation(objects: $insertInvitations) {
    affected_rows
  }
}
    ${AttendeePartsFragmentDoc}`;
export type CreateDeleteAttendeesMutationFn = Apollo.MutationFunction<CreateDeleteAttendeesMutation, CreateDeleteAttendeesMutationVariables>;

/**
 * __useCreateDeleteAttendeesMutation__
 *
 * To run a mutation, you first call `useCreateDeleteAttendeesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDeleteAttendeesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDeleteAttendeesMutation, { data, loading, error }] = useCreateDeleteAttendeesMutation({
 *   variables: {
 *      deleteAttendeeIds: // value for 'deleteAttendeeIds'
 *      insertAttendees: // value for 'insertAttendees'
 *      insertInvitations: // value for 'insertInvitations'
 *   },
 * });
 */
export function useCreateDeleteAttendeesMutation(baseOptions?: Apollo.MutationHookOptions<CreateDeleteAttendeesMutation, CreateDeleteAttendeesMutationVariables>) {
        return Apollo.useMutation<CreateDeleteAttendeesMutation, CreateDeleteAttendeesMutationVariables>(CreateDeleteAttendeesDocument, baseOptions);
      }
export type CreateDeleteAttendeesMutationHookResult = ReturnType<typeof useCreateDeleteAttendeesMutation>;
export type CreateDeleteAttendeesMutationResult = Apollo.MutationResult<CreateDeleteAttendeesMutation>;
export type CreateDeleteAttendeesMutationOptions = Apollo.BaseMutationOptions<CreateDeleteAttendeesMutation, CreateDeleteAttendeesMutationVariables>;
export const UpdateAttendeeDocument = gql`
    mutation UpdateAttendee($attendeeId: uuid!, $attendeeName: String!, $insertGroups: [GroupAttendee_insert_input!]!, $deleteGroupIds: [uuid!] = []) {
  update_Attendee_by_pk(
    pk_columns: {id: $attendeeId}
    _set: {displayName: $attendeeName}
  ) {
    ...AttendeeParts
  }
  insert_GroupAttendee(objects: $insertGroups) {
    returning {
      id
      attendeeId
      groupId
    }
  }
  delete_GroupAttendee(where: {groupId: {_in: $deleteGroupIds}}) {
    returning {
      id
    }
  }
}
    ${AttendeePartsFragmentDoc}`;
export type UpdateAttendeeMutationFn = Apollo.MutationFunction<UpdateAttendeeMutation, UpdateAttendeeMutationVariables>;

/**
 * __useUpdateAttendeeMutation__
 *
 * To run a mutation, you first call `useUpdateAttendeeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAttendeeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAttendeeMutation, { data, loading, error }] = useUpdateAttendeeMutation({
 *   variables: {
 *      attendeeId: // value for 'attendeeId'
 *      attendeeName: // value for 'attendeeName'
 *      insertGroups: // value for 'insertGroups'
 *      deleteGroupIds: // value for 'deleteGroupIds'
 *   },
 * });
 */
export function useUpdateAttendeeMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAttendeeMutation, UpdateAttendeeMutationVariables>) {
        return Apollo.useMutation<UpdateAttendeeMutation, UpdateAttendeeMutationVariables>(UpdateAttendeeDocument, baseOptions);
      }
export type UpdateAttendeeMutationHookResult = ReturnType<typeof useUpdateAttendeeMutation>;
export type UpdateAttendeeMutationResult = Apollo.MutationResult<UpdateAttendeeMutation>;
export type UpdateAttendeeMutationOptions = Apollo.BaseMutationOptions<UpdateAttendeeMutation, UpdateAttendeeMutationVariables>;
export const SendInitialInviteEmailsDocument = gql`
    mutation SendInitialInviteEmails($attendeeIds: [String!]!) {
  invitationSendInitialEmail(attendeeIds: $attendeeIds) {
    attendeeId
    sent
  }
}
    `;
export type SendInitialInviteEmailsMutationFn = Apollo.MutationFunction<SendInitialInviteEmailsMutation, SendInitialInviteEmailsMutationVariables>;

/**
 * __useSendInitialInviteEmailsMutation__
 *
 * To run a mutation, you first call `useSendInitialInviteEmailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendInitialInviteEmailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendInitialInviteEmailsMutation, { data, loading, error }] = useSendInitialInviteEmailsMutation({
 *   variables: {
 *      attendeeIds: // value for 'attendeeIds'
 *   },
 * });
 */
export function useSendInitialInviteEmailsMutation(baseOptions?: Apollo.MutationHookOptions<SendInitialInviteEmailsMutation, SendInitialInviteEmailsMutationVariables>) {
        return Apollo.useMutation<SendInitialInviteEmailsMutation, SendInitialInviteEmailsMutationVariables>(SendInitialInviteEmailsDocument, baseOptions);
      }
export type SendInitialInviteEmailsMutationHookResult = ReturnType<typeof useSendInitialInviteEmailsMutation>;
export type SendInitialInviteEmailsMutationResult = Apollo.MutationResult<SendInitialInviteEmailsMutation>;
export type SendInitialInviteEmailsMutationOptions = Apollo.BaseMutationOptions<SendInitialInviteEmailsMutation, SendInitialInviteEmailsMutationVariables>;
export const SendRepeatInviteEmailsDocument = gql`
    mutation SendRepeatInviteEmails($attendeeIds: [String!]!) {
  invitationSendRepeatEmail(attendeeIds: $attendeeIds) {
    attendeeId
    sent
  }
}
    `;
export type SendRepeatInviteEmailsMutationFn = Apollo.MutationFunction<SendRepeatInviteEmailsMutation, SendRepeatInviteEmailsMutationVariables>;

/**
 * __useSendRepeatInviteEmailsMutation__
 *
 * To run a mutation, you first call `useSendRepeatInviteEmailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendRepeatInviteEmailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendRepeatInviteEmailsMutation, { data, loading, error }] = useSendRepeatInviteEmailsMutation({
 *   variables: {
 *      attendeeIds: // value for 'attendeeIds'
 *   },
 * });
 */
export function useSendRepeatInviteEmailsMutation(baseOptions?: Apollo.MutationHookOptions<SendRepeatInviteEmailsMutation, SendRepeatInviteEmailsMutationVariables>) {
        return Apollo.useMutation<SendRepeatInviteEmailsMutation, SendRepeatInviteEmailsMutationVariables>(SendRepeatInviteEmailsDocument, baseOptions);
      }
export type SendRepeatInviteEmailsMutationHookResult = ReturnType<typeof useSendRepeatInviteEmailsMutation>;
export type SendRepeatInviteEmailsMutationResult = Apollo.MutationResult<SendRepeatInviteEmailsMutation>;
export type SendRepeatInviteEmailsMutationOptions = Apollo.BaseMutationOptions<SendRepeatInviteEmailsMutation, SendRepeatInviteEmailsMutationVariables>;
export const SelectAllPermissionsDocument = gql`
    query SelectAllPermissions {
  Permission {
    name
    description
  }
}
    `;

/**
 * __useSelectAllPermissionsQuery__
 *
 * To run a query within a React component, call `useSelectAllPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectAllPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectAllPermissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSelectAllPermissionsQuery(baseOptions?: Apollo.QueryHookOptions<SelectAllPermissionsQuery, SelectAllPermissionsQueryVariables>) {
        return Apollo.useQuery<SelectAllPermissionsQuery, SelectAllPermissionsQueryVariables>(SelectAllPermissionsDocument, baseOptions);
      }
export function useSelectAllPermissionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectAllPermissionsQuery, SelectAllPermissionsQueryVariables>) {
          return Apollo.useLazyQuery<SelectAllPermissionsQuery, SelectAllPermissionsQueryVariables>(SelectAllPermissionsDocument, baseOptions);
        }
export type SelectAllPermissionsQueryHookResult = ReturnType<typeof useSelectAllPermissionsQuery>;
export type SelectAllPermissionsLazyQueryHookResult = ReturnType<typeof useSelectAllPermissionsLazyQuery>;
export type SelectAllPermissionsQueryResult = Apollo.QueryResult<SelectAllPermissionsQuery, SelectAllPermissionsQueryVariables>;
export const SelectAllRolesDocument = gql`
    query SelectAllRoles($conferenceId: uuid!) {
  Role(where: {conferenceId: {_eq: $conferenceId}}) {
    conferenceId
    id
    name
    rolePermissions {
      id
      permissionName
      roleId
    }
  }
}
    `;

/**
 * __useSelectAllRolesQuery__
 *
 * To run a query within a React component, call `useSelectAllRolesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectAllRolesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectAllRolesQuery({
 *   variables: {
 *      conferenceId: // value for 'conferenceId'
 *   },
 * });
 */
export function useSelectAllRolesQuery(baseOptions: Apollo.QueryHookOptions<SelectAllRolesQuery, SelectAllRolesQueryVariables>) {
        return Apollo.useQuery<SelectAllRolesQuery, SelectAllRolesQueryVariables>(SelectAllRolesDocument, baseOptions);
      }
export function useSelectAllRolesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectAllRolesQuery, SelectAllRolesQueryVariables>) {
          return Apollo.useLazyQuery<SelectAllRolesQuery, SelectAllRolesQueryVariables>(SelectAllRolesDocument, baseOptions);
        }
export type SelectAllRolesQueryHookResult = ReturnType<typeof useSelectAllRolesQuery>;
export type SelectAllRolesLazyQueryHookResult = ReturnType<typeof useSelectAllRolesLazyQuery>;
export type SelectAllRolesQueryResult = Apollo.QueryResult<SelectAllRolesQuery, SelectAllRolesQueryVariables>;
export const CreateDeleteRolesDocument = gql`
    mutation CreateDeleteRoles($deleteRoleIds: [uuid!] = [], $insertRoles: [Role_insert_input!]!) {
  delete_Role(where: {id: {_in: $deleteRoleIds}}) {
    returning {
      id
    }
  }
  insert_Role(objects: $insertRoles) {
    returning {
      id
      conferenceId
      name
      rolePermissions {
        id
        permissionName
        roleId
      }
    }
  }
}
    `;
export type CreateDeleteRolesMutationFn = Apollo.MutationFunction<CreateDeleteRolesMutation, CreateDeleteRolesMutationVariables>;

/**
 * __useCreateDeleteRolesMutation__
 *
 * To run a mutation, you first call `useCreateDeleteRolesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDeleteRolesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDeleteRolesMutation, { data, loading, error }] = useCreateDeleteRolesMutation({
 *   variables: {
 *      deleteRoleIds: // value for 'deleteRoleIds'
 *      insertRoles: // value for 'insertRoles'
 *   },
 * });
 */
export function useCreateDeleteRolesMutation(baseOptions?: Apollo.MutationHookOptions<CreateDeleteRolesMutation, CreateDeleteRolesMutationVariables>) {
        return Apollo.useMutation<CreateDeleteRolesMutation, CreateDeleteRolesMutationVariables>(CreateDeleteRolesDocument, baseOptions);
      }
export type CreateDeleteRolesMutationHookResult = ReturnType<typeof useCreateDeleteRolesMutation>;
export type CreateDeleteRolesMutationResult = Apollo.MutationResult<CreateDeleteRolesMutation>;
export type CreateDeleteRolesMutationOptions = Apollo.BaseMutationOptions<CreateDeleteRolesMutation, CreateDeleteRolesMutationVariables>;
export const UpdateRoleDocument = gql`
    mutation UpdateRole($roleId: uuid!, $roleName: String!, $insertPermissions: [RolePermission_insert_input!]!, $deletePermissionNames: [Permission_enum!] = []) {
  update_Role(where: {id: {_eq: $roleId}}, _set: {name: $roleName}) {
    returning {
      id
      name
      rolePermissions {
        id
        permissionName
        roleId
      }
      conferenceId
    }
  }
  insert_RolePermission(objects: $insertPermissions) {
    returning {
      id
      permissionName
      roleId
    }
  }
  delete_RolePermission(where: {permissionName: {_in: $deletePermissionNames}}) {
    returning {
      id
    }
  }
}
    `;
export type UpdateRoleMutationFn = Apollo.MutationFunction<UpdateRoleMutation, UpdateRoleMutationVariables>;

/**
 * __useUpdateRoleMutation__
 *
 * To run a mutation, you first call `useUpdateRoleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateRoleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateRoleMutation, { data, loading, error }] = useUpdateRoleMutation({
 *   variables: {
 *      roleId: // value for 'roleId'
 *      roleName: // value for 'roleName'
 *      insertPermissions: // value for 'insertPermissions'
 *      deletePermissionNames: // value for 'deletePermissionNames'
 *   },
 * });
 */
export function useUpdateRoleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateRoleMutation, UpdateRoleMutationVariables>) {
        return Apollo.useMutation<UpdateRoleMutation, UpdateRoleMutationVariables>(UpdateRoleDocument, baseOptions);
      }
export type UpdateRoleMutationHookResult = ReturnType<typeof useUpdateRoleMutation>;
export type UpdateRoleMutationResult = Apollo.MutationResult<UpdateRoleMutation>;
export type UpdateRoleMutationOptions = Apollo.BaseMutationOptions<UpdateRoleMutation, UpdateRoleMutationVariables>;
export const ConferenceTakenDocument = gql`
    query ConferenceTaken($name: String!, $shortName: String!, $slug: String!) {
  Conference(
    where: {_or: [{name: {_eq: $name}}, {shortName: {_eq: $shortName}}, {slug: {_eq: $slug}}]}
    limit: 1
  ) {
    id
    name
    shortName
    slug
  }
}
    `;

/**
 * __useConferenceTakenQuery__
 *
 * To run a query within a React component, call `useConferenceTakenQuery` and pass it any options that fit your needs.
 * When your component renders, `useConferenceTakenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConferenceTakenQuery({
 *   variables: {
 *      name: // value for 'name'
 *      shortName: // value for 'shortName'
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useConferenceTakenQuery(baseOptions: Apollo.QueryHookOptions<ConferenceTakenQuery, ConferenceTakenQueryVariables>) {
        return Apollo.useQuery<ConferenceTakenQuery, ConferenceTakenQueryVariables>(ConferenceTakenDocument, baseOptions);
      }
export function useConferenceTakenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConferenceTakenQuery, ConferenceTakenQueryVariables>) {
          return Apollo.useLazyQuery<ConferenceTakenQuery, ConferenceTakenQueryVariables>(ConferenceTakenDocument, baseOptions);
        }
export type ConferenceTakenQueryHookResult = ReturnType<typeof useConferenceTakenQuery>;
export type ConferenceTakenLazyQueryHookResult = ReturnType<typeof useConferenceTakenLazyQuery>;
export type ConferenceTakenQueryResult = Apollo.QueryResult<ConferenceTakenQuery, ConferenceTakenQueryVariables>;
export const CreateConferenceDocument = gql`
    mutation CreateConference($name: String!, $shortName: String!, $slug: String!, $demoCode: uuid!) {
  insert_Conference(
    objects: [{name: $name, shortName: $shortName, slug: $slug, demoCodeId: $demoCode}]
  ) {
    returning {
      id
      slug
    }
  }
  update_ConferenceDemoCode(
    where: {id: {_eq: $demoCode}}
    _set: {note: "Code has been used."}
  ) {
    affected_rows
  }
}
    `;
export type CreateConferenceMutationFn = Apollo.MutationFunction<CreateConferenceMutation, CreateConferenceMutationVariables>;

/**
 * __useCreateConferenceMutation__
 *
 * To run a mutation, you first call `useCreateConferenceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateConferenceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createConferenceMutation, { data, loading, error }] = useCreateConferenceMutation({
 *   variables: {
 *      name: // value for 'name'
 *      shortName: // value for 'shortName'
 *      slug: // value for 'slug'
 *      demoCode: // value for 'demoCode'
 *   },
 * });
 */
export function useCreateConferenceMutation(baseOptions?: Apollo.MutationHookOptions<CreateConferenceMutation, CreateConferenceMutationVariables>) {
        return Apollo.useMutation<CreateConferenceMutation, CreateConferenceMutationVariables>(CreateConferenceDocument, baseOptions);
      }
export type CreateConferenceMutationHookResult = ReturnType<typeof useCreateConferenceMutation>;
export type CreateConferenceMutationResult = Apollo.MutationResult<CreateConferenceMutation>;
export type CreateConferenceMutationOptions = Apollo.BaseMutationOptions<CreateConferenceMutation, CreateConferenceMutationVariables>;
export const CreateNewConferenceMetaStructureDocument = gql`
    mutation CreateNewConferenceMetaStructure($conferenceId: uuid!, $attendeeDisplayName: String!, $userId: String!) {
  insert_Attendee(
    objects: [{displayName: $attendeeDisplayName, userId: $userId, conferenceId: $conferenceId, groupAttendees: {data: {group: {data: {conferenceId: $conferenceId, includeUnauthenticated: false, name: "Organisers", groupRoles: {data: {role: {data: {conferenceId: $conferenceId, name: "Organiser", rolePermissions: {data: [{permissionName: CONFERENCE_MANAGE_NAME}, {permissionName: CONFERENCE_MANAGE_ATTENDEES}, {permissionName: CONFERENCE_MODERATE_ATTENDEES}, {permissionName: CONFERENCE_VIEW_ATTENDEES}, {permissionName: CONFERENCE_VIEW}, {permissionName: CONFERENCE_MANAGE_ROLES}, {permissionName: CONFERENCE_MANAGE_GROUPS}, {permissionName: CONFERENCE_MANAGE_CONTENT}, {permissionName: CONFERENCE_MANAGE_SCHEDULE}]}}}}}}}}}}]
  ) {
    affected_rows
  }
  insert_Group(
    objects: [{conferenceId: $conferenceId, enabled: false, name: "Attendees", includeUnauthenticated: false, groupRoles: {data: [{role: {data: {conferenceId: $conferenceId, name: "Attendee", rolePermissions: {data: [{permissionName: CONFERENCE_VIEW}, {permissionName: CONFERENCE_VIEW_ATTENDEES}]}}}}]}}, {conferenceId: $conferenceId, enabled: false, name: "Public", includeUnauthenticated: true, groupRoles: {data: [{role: {data: {conferenceId: $conferenceId, name: "Public", rolePermissions: {data: [{permissionName: CONFERENCE_VIEW}]}}}}]}}, {conferenceId: $conferenceId, enabled: false, name: "Registrars", includeUnauthenticated: false, groupRoles: {data: [{role: {data: {conferenceId: $conferenceId, name: "Registrar", rolePermissions: {data: [{permissionName: CONFERENCE_MANAGE_ATTENDEES}, {permissionName: CONFERENCE_VIEW_ATTENDEES}]}}}}]}}, {conferenceId: $conferenceId, enabled: false, name: "Moderators", includeUnauthenticated: false, groupRoles: {data: [{role: {data: {conferenceId: $conferenceId, name: "Moderator", rolePermissions: {data: [{permissionName: CONFERENCE_MODERATE_ATTENDEES}, {permissionName: CONFERENCE_VIEW_ATTENDEES}, {permissionName: CONFERENCE_VIEW}]}}}}]}}]
  ) {
    returning {
      id
      conferenceId
      name
      enabled
      groupRoles {
        id
        roleId
        groupId
        role {
          id
          name
          conferenceId
          rolePermissions {
            id
            roleId
            permissionName
          }
        }
      }
    }
  }
}
    `;
export type CreateNewConferenceMetaStructureMutationFn = Apollo.MutationFunction<CreateNewConferenceMetaStructureMutation, CreateNewConferenceMetaStructureMutationVariables>;

/**
 * __useCreateNewConferenceMetaStructureMutation__
 *
 * To run a mutation, you first call `useCreateNewConferenceMetaStructureMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNewConferenceMetaStructureMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNewConferenceMetaStructureMutation, { data, loading, error }] = useCreateNewConferenceMetaStructureMutation({
 *   variables: {
 *      conferenceId: // value for 'conferenceId'
 *      attendeeDisplayName: // value for 'attendeeDisplayName'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateNewConferenceMetaStructureMutation(baseOptions?: Apollo.MutationHookOptions<CreateNewConferenceMetaStructureMutation, CreateNewConferenceMetaStructureMutationVariables>) {
        return Apollo.useMutation<CreateNewConferenceMetaStructureMutation, CreateNewConferenceMetaStructureMutationVariables>(CreateNewConferenceMetaStructureDocument, baseOptions);
      }
export type CreateNewConferenceMetaStructureMutationHookResult = ReturnType<typeof useCreateNewConferenceMetaStructureMutation>;
export type CreateNewConferenceMetaStructureMutationResult = Apollo.MutationResult<CreateNewConferenceMetaStructureMutation>;
export type CreateNewConferenceMetaStructureMutationOptions = Apollo.BaseMutationOptions<CreateNewConferenceMetaStructureMutation, CreateNewConferenceMetaStructureMutationVariables>;
export const ConferenceBySlugDocument = gql`
    query ConferenceBySlug($slug: String!) {
  Conference(where: {slug: {_eq: $slug}}, limit: 1) {
    createdBy
    id
    name
    shortName
    slug
    updatedAt
    createdAt
  }
}
    `;

/**
 * __useConferenceBySlugQuery__
 *
 * To run a query within a React component, call `useConferenceBySlugQuery` and pass it any options that fit your needs.
 * When your component renders, `useConferenceBySlugQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConferenceBySlugQuery({
 *   variables: {
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useConferenceBySlugQuery(baseOptions: Apollo.QueryHookOptions<ConferenceBySlugQuery, ConferenceBySlugQueryVariables>) {
        return Apollo.useQuery<ConferenceBySlugQuery, ConferenceBySlugQueryVariables>(ConferenceBySlugDocument, baseOptions);
      }
export function useConferenceBySlugLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConferenceBySlugQuery, ConferenceBySlugQueryVariables>) {
          return Apollo.useLazyQuery<ConferenceBySlugQuery, ConferenceBySlugQueryVariables>(ConferenceBySlugDocument, baseOptions);
        }
export type ConferenceBySlugQueryHookResult = ReturnType<typeof useConferenceBySlugQuery>;
export type ConferenceBySlugLazyQueryHookResult = ReturnType<typeof useConferenceBySlugLazyQuery>;
export type ConferenceBySlugQueryResult = Apollo.QueryResult<ConferenceBySlugQuery, ConferenceBySlugQueryVariables>;
export const CurrentUserGroupsRolesPermissionsDocument = gql`
    query CurrentUserGroupsRolesPermissions($userId: String!, $conferenceId: uuid!) {
  User(where: {id: {_eq: $userId}}) {
    conferencesCreated(where: {id: {_eq: $conferenceId}}) {
      id
    }
    attendees(where: {conferenceId: {_eq: $conferenceId}}) {
      groupAttendees {
        group {
          groupRoles {
            role {
              rolePermissions {
                permissionName
                id
                roleId
              }
              id
              name
              conferenceId
            }
            id
            roleId
            groupId
          }
          enabled
          id
          includeUnauthenticated
          name
          conferenceId
        }
        id
        groupId
        attendeeId
      }
      id
      userId
      conferenceId
      displayName
    }
    id
  }
}
    `;

/**
 * __useCurrentUserGroupsRolesPermissionsQuery__
 *
 * To run a query within a React component, call `useCurrentUserGroupsRolesPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserGroupsRolesPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserGroupsRolesPermissionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      conferenceId: // value for 'conferenceId'
 *   },
 * });
 */
export function useCurrentUserGroupsRolesPermissionsQuery(baseOptions: Apollo.QueryHookOptions<CurrentUserGroupsRolesPermissionsQuery, CurrentUserGroupsRolesPermissionsQueryVariables>) {
        return Apollo.useQuery<CurrentUserGroupsRolesPermissionsQuery, CurrentUserGroupsRolesPermissionsQueryVariables>(CurrentUserGroupsRolesPermissionsDocument, baseOptions);
      }
export function useCurrentUserGroupsRolesPermissionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserGroupsRolesPermissionsQuery, CurrentUserGroupsRolesPermissionsQueryVariables>) {
          return Apollo.useLazyQuery<CurrentUserGroupsRolesPermissionsQuery, CurrentUserGroupsRolesPermissionsQueryVariables>(CurrentUserGroupsRolesPermissionsDocument, baseOptions);
        }
export type CurrentUserGroupsRolesPermissionsQueryHookResult = ReturnType<typeof useCurrentUserGroupsRolesPermissionsQuery>;
export type CurrentUserGroupsRolesPermissionsLazyQueryHookResult = ReturnType<typeof useCurrentUserGroupsRolesPermissionsLazyQuery>;
export type CurrentUserGroupsRolesPermissionsQueryResult = Apollo.QueryResult<CurrentUserGroupsRolesPermissionsQuery, CurrentUserGroupsRolesPermissionsQueryVariables>;
export const SelectRequiredItemDocument = gql`
    query SelectRequiredItem {
  RequiredContentItem {
    id
    contentTypeName
    name
    conference {
      id
      name
    }
  }
}
    `;

/**
 * __useSelectRequiredItemQuery__
 *
 * To run a query within a React component, call `useSelectRequiredItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectRequiredItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectRequiredItemQuery({
 *   variables: {
 *   },
 * });
 */
export function useSelectRequiredItemQuery(baseOptions?: Apollo.QueryHookOptions<SelectRequiredItemQuery, SelectRequiredItemQueryVariables>) {
        return Apollo.useQuery<SelectRequiredItemQuery, SelectRequiredItemQueryVariables>(SelectRequiredItemDocument, baseOptions);
      }
export function useSelectRequiredItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectRequiredItemQuery, SelectRequiredItemQueryVariables>) {
          return Apollo.useLazyQuery<SelectRequiredItemQuery, SelectRequiredItemQueryVariables>(SelectRequiredItemDocument, baseOptions);
        }
export type SelectRequiredItemQueryHookResult = ReturnType<typeof useSelectRequiredItemQuery>;
export type SelectRequiredItemLazyQueryHookResult = ReturnType<typeof useSelectRequiredItemLazyQuery>;
export type SelectRequiredItemQueryResult = Apollo.QueryResult<SelectRequiredItemQuery, SelectRequiredItemQueryVariables>;
export const SubmitContentItemDocument = gql`
    mutation SubmitContentItem($contentItemData: jsonb!, $magicToken: String!) {
  submitContentItem(data: $contentItemData, magicToken: $magicToken) {
    message
    success
  }
}
    `;
export type SubmitContentItemMutationFn = Apollo.MutationFunction<SubmitContentItemMutation, SubmitContentItemMutationVariables>;

/**
 * __useSubmitContentItemMutation__
 *
 * To run a mutation, you first call `useSubmitContentItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitContentItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitContentItemMutation, { data, loading, error }] = useSubmitContentItemMutation({
 *   variables: {
 *      contentItemData: // value for 'contentItemData'
 *      magicToken: // value for 'magicToken'
 *   },
 * });
 */
export function useSubmitContentItemMutation(baseOptions?: Apollo.MutationHookOptions<SubmitContentItemMutation, SubmitContentItemMutationVariables>) {
        return Apollo.useMutation<SubmitContentItemMutation, SubmitContentItemMutationVariables>(SubmitContentItemDocument, baseOptions);
      }
export type SubmitContentItemMutationHookResult = ReturnType<typeof useSubmitContentItemMutation>;
export type SubmitContentItemMutationResult = Apollo.MutationResult<SubmitContentItemMutation>;
export type SubmitContentItemMutationOptions = Apollo.BaseMutationOptions<SubmitContentItemMutation, SubmitContentItemMutationVariables>;
export const GetContentItemDocument = gql`
    query GetContentItem($magicToken: String!) {
  getContentItem(magicToken: $magicToken) {
    contentTypeName
    data
    layoutData
    name
    id
  }
}
    `;

/**
 * __useGetContentItemQuery__
 *
 * To run a query within a React component, call `useGetContentItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetContentItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetContentItemQuery({
 *   variables: {
 *      magicToken: // value for 'magicToken'
 *   },
 * });
 */
export function useGetContentItemQuery(baseOptions: Apollo.QueryHookOptions<GetContentItemQuery, GetContentItemQueryVariables>) {
        return Apollo.useQuery<GetContentItemQuery, GetContentItemQueryVariables>(GetContentItemDocument, baseOptions);
      }
export function useGetContentItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetContentItemQuery, GetContentItemQueryVariables>) {
          return Apollo.useLazyQuery<GetContentItemQuery, GetContentItemQueryVariables>(GetContentItemDocument, baseOptions);
        }
export type GetContentItemQueryHookResult = ReturnType<typeof useGetContentItemQuery>;
export type GetContentItemLazyQueryHookResult = ReturnType<typeof useGetContentItemLazyQuery>;
export type GetContentItemQueryResult = Apollo.QueryResult<GetContentItemQuery, GetContentItemQueryVariables>;
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
export function useEchoQuery(baseOptions: Apollo.QueryHookOptions<EchoQuery, EchoQueryVariables>) {
        return Apollo.useQuery<EchoQuery, EchoQueryVariables>(EchoDocument, baseOptions);
      }
export function useEchoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EchoQuery, EchoQueryVariables>) {
          return Apollo.useLazyQuery<EchoQuery, EchoQueryVariables>(EchoDocument, baseOptions);
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
export function useProtectedEchoQuery(baseOptions: Apollo.QueryHookOptions<ProtectedEchoQuery, ProtectedEchoQueryVariables>) {
        return Apollo.useQuery<ProtectedEchoQuery, ProtectedEchoQueryVariables>(ProtectedEchoDocument, baseOptions);
      }
export function useProtectedEchoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProtectedEchoQuery, ProtectedEchoQueryVariables>) {
          return Apollo.useLazyQuery<ProtectedEchoQuery, ProtectedEchoQueryVariables>(ProtectedEchoDocument, baseOptions);
        }
export type ProtectedEchoQueryHookResult = ReturnType<typeof useProtectedEchoQuery>;
export type ProtectedEchoLazyQueryHookResult = ReturnType<typeof useProtectedEchoLazyQuery>;
export type ProtectedEchoQueryResult = Apollo.QueryResult<ProtectedEchoQuery, ProtectedEchoQueryVariables>;
export const SelectInvitationForAcceptDocument = gql`
    query SelectInvitationForAccept($inviteCode: uuid!) {
  Invitation(where: {inviteCode: {_eq: $inviteCode}}) {
    hash
  }
}
    `;

/**
 * __useSelectInvitationForAcceptQuery__
 *
 * To run a query within a React component, call `useSelectInvitationForAcceptQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectInvitationForAcceptQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectInvitationForAcceptQuery({
 *   variables: {
 *      inviteCode: // value for 'inviteCode'
 *   },
 * });
 */
export function useSelectInvitationForAcceptQuery(baseOptions: Apollo.QueryHookOptions<SelectInvitationForAcceptQuery, SelectInvitationForAcceptQueryVariables>) {
        return Apollo.useQuery<SelectInvitationForAcceptQuery, SelectInvitationForAcceptQueryVariables>(SelectInvitationForAcceptDocument, baseOptions);
      }
export function useSelectInvitationForAcceptLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectInvitationForAcceptQuery, SelectInvitationForAcceptQueryVariables>) {
          return Apollo.useLazyQuery<SelectInvitationForAcceptQuery, SelectInvitationForAcceptQueryVariables>(SelectInvitationForAcceptDocument, baseOptions);
        }
export type SelectInvitationForAcceptQueryHookResult = ReturnType<typeof useSelectInvitationForAcceptQuery>;
export type SelectInvitationForAcceptLazyQueryHookResult = ReturnType<typeof useSelectInvitationForAcceptLazyQuery>;
export type SelectInvitationForAcceptQueryResult = Apollo.QueryResult<SelectInvitationForAcceptQuery, SelectInvitationForAcceptQueryVariables>;
export const Invitation_ConfirmCurrentDocument = gql`
    mutation Invitation_ConfirmCurrent($inviteCode: uuid!) {
  invitationConfirmCurrent(inviteCode: $inviteCode) {
    confSlug
    ok
  }
}
    `;
export type Invitation_ConfirmCurrentMutationFn = Apollo.MutationFunction<Invitation_ConfirmCurrentMutation, Invitation_ConfirmCurrentMutationVariables>;

/**
 * __useInvitation_ConfirmCurrentMutation__
 *
 * To run a mutation, you first call `useInvitation_ConfirmCurrentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInvitation_ConfirmCurrentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [invitationConfirmCurrentMutation, { data, loading, error }] = useInvitation_ConfirmCurrentMutation({
 *   variables: {
 *      inviteCode: // value for 'inviteCode'
 *   },
 * });
 */
export function useInvitation_ConfirmCurrentMutation(baseOptions?: Apollo.MutationHookOptions<Invitation_ConfirmCurrentMutation, Invitation_ConfirmCurrentMutationVariables>) {
        return Apollo.useMutation<Invitation_ConfirmCurrentMutation, Invitation_ConfirmCurrentMutationVariables>(Invitation_ConfirmCurrentDocument, baseOptions);
      }
export type Invitation_ConfirmCurrentMutationHookResult = ReturnType<typeof useInvitation_ConfirmCurrentMutation>;
export type Invitation_ConfirmCurrentMutationResult = Apollo.MutationResult<Invitation_ConfirmCurrentMutation>;
export type Invitation_ConfirmCurrentMutationOptions = Apollo.BaseMutationOptions<Invitation_ConfirmCurrentMutation, Invitation_ConfirmCurrentMutationVariables>;
export const Invitation_ConfirmWithCodeDocument = gql`
    mutation Invitation_ConfirmWithCode($inviteCode: uuid!, $confirmationCode: String!) {
  invitationConfirmWithCode(
    inviteInput: {inviteCode: $inviteCode, confirmationCode: $confirmationCode}
  ) {
    confSlug
    ok
  }
}
    `;
export type Invitation_ConfirmWithCodeMutationFn = Apollo.MutationFunction<Invitation_ConfirmWithCodeMutation, Invitation_ConfirmWithCodeMutationVariables>;

/**
 * __useInvitation_ConfirmWithCodeMutation__
 *
 * To run a mutation, you first call `useInvitation_ConfirmWithCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInvitation_ConfirmWithCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [invitationConfirmWithCodeMutation, { data, loading, error }] = useInvitation_ConfirmWithCodeMutation({
 *   variables: {
 *      inviteCode: // value for 'inviteCode'
 *      confirmationCode: // value for 'confirmationCode'
 *   },
 * });
 */
export function useInvitation_ConfirmWithCodeMutation(baseOptions?: Apollo.MutationHookOptions<Invitation_ConfirmWithCodeMutation, Invitation_ConfirmWithCodeMutationVariables>) {
        return Apollo.useMutation<Invitation_ConfirmWithCodeMutation, Invitation_ConfirmWithCodeMutationVariables>(Invitation_ConfirmWithCodeDocument, baseOptions);
      }
export type Invitation_ConfirmWithCodeMutationHookResult = ReturnType<typeof useInvitation_ConfirmWithCodeMutation>;
export type Invitation_ConfirmWithCodeMutationResult = Apollo.MutationResult<Invitation_ConfirmWithCodeMutation>;
export type Invitation_ConfirmWithCodeMutationOptions = Apollo.BaseMutationOptions<Invitation_ConfirmWithCodeMutation, Invitation_ConfirmWithCodeMutationVariables>;
export const SendInitialConfirmationEmailDocument = gql`
    mutation SendInitialConfirmationEmail($inviteCode: uuid!) {
  invitationConfirmSendInitialEmail(inviteInput: {inviteCode: $inviteCode}) {
    sent
  }
}
    `;
export type SendInitialConfirmationEmailMutationFn = Apollo.MutationFunction<SendInitialConfirmationEmailMutation, SendInitialConfirmationEmailMutationVariables>;

/**
 * __useSendInitialConfirmationEmailMutation__
 *
 * To run a mutation, you first call `useSendInitialConfirmationEmailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendInitialConfirmationEmailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendInitialConfirmationEmailMutation, { data, loading, error }] = useSendInitialConfirmationEmailMutation({
 *   variables: {
 *      inviteCode: // value for 'inviteCode'
 *   },
 * });
 */
export function useSendInitialConfirmationEmailMutation(baseOptions?: Apollo.MutationHookOptions<SendInitialConfirmationEmailMutation, SendInitialConfirmationEmailMutationVariables>) {
        return Apollo.useMutation<SendInitialConfirmationEmailMutation, SendInitialConfirmationEmailMutationVariables>(SendInitialConfirmationEmailDocument, baseOptions);
      }
export type SendInitialConfirmationEmailMutationHookResult = ReturnType<typeof useSendInitialConfirmationEmailMutation>;
export type SendInitialConfirmationEmailMutationResult = Apollo.MutationResult<SendInitialConfirmationEmailMutation>;
export type SendInitialConfirmationEmailMutationOptions = Apollo.BaseMutationOptions<SendInitialConfirmationEmailMutation, SendInitialConfirmationEmailMutationVariables>;
export const SendRepeatConfirmationEmailDocument = gql`
    mutation SendRepeatConfirmationEmail($inviteCode: uuid!) {
  invitationConfirmSendRepeatEmail(inviteInput: {inviteCode: $inviteCode}) {
    sent
  }
}
    `;
export type SendRepeatConfirmationEmailMutationFn = Apollo.MutationFunction<SendRepeatConfirmationEmailMutation, SendRepeatConfirmationEmailMutationVariables>;

/**
 * __useSendRepeatConfirmationEmailMutation__
 *
 * To run a mutation, you first call `useSendRepeatConfirmationEmailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendRepeatConfirmationEmailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendRepeatConfirmationEmailMutation, { data, loading, error }] = useSendRepeatConfirmationEmailMutation({
 *   variables: {
 *      inviteCode: // value for 'inviteCode'
 *   },
 * });
 */
export function useSendRepeatConfirmationEmailMutation(baseOptions?: Apollo.MutationHookOptions<SendRepeatConfirmationEmailMutation, SendRepeatConfirmationEmailMutationVariables>) {
        return Apollo.useMutation<SendRepeatConfirmationEmailMutation, SendRepeatConfirmationEmailMutationVariables>(SendRepeatConfirmationEmailDocument, baseOptions);
      }
export type SendRepeatConfirmationEmailMutationHookResult = ReturnType<typeof useSendRepeatConfirmationEmailMutation>;
export type SendRepeatConfirmationEmailMutationResult = Apollo.MutationResult<SendRepeatConfirmationEmailMutation>;
export type SendRepeatConfirmationEmailMutationOptions = Apollo.BaseMutationOptions<SendRepeatConfirmationEmailMutation, SendRepeatConfirmationEmailMutationVariables>;
export const SelectUsersDocument = gql`
    query selectUsers {
  User {
    id
    lastName
    firstName
    onlineStatus {
      id
      lastSeen
      isIncognito
    }
  }
}
    `;

/**
 * __useSelectUsersQuery__
 *
 * To run a query within a React component, call `useSelectUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useSelectUsersQuery(baseOptions?: Apollo.QueryHookOptions<SelectUsersQuery, SelectUsersQueryVariables>) {
        return Apollo.useQuery<SelectUsersQuery, SelectUsersQueryVariables>(SelectUsersDocument, baseOptions);
      }
export function useSelectUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectUsersQuery, SelectUsersQueryVariables>) {
          return Apollo.useLazyQuery<SelectUsersQuery, SelectUsersQueryVariables>(SelectUsersDocument, baseOptions);
        }
export type SelectUsersQueryHookResult = ReturnType<typeof useSelectUsersQuery>;
export type SelectUsersLazyQueryHookResult = ReturnType<typeof useSelectUsersLazyQuery>;
export type SelectUsersQueryResult = Apollo.QueryResult<SelectUsersQuery, SelectUsersQueryVariables>;
export const SelectCurrentUserDocument = gql`
    query selectCurrentUser($userId: String!) {
  User(where: {id: {_eq: $userId}}) {
    id
    email
    lastName
    firstName
    onlineStatus {
      id
      lastSeen
      isIncognito
    }
  }
}
    `;

/**
 * __useSelectCurrentUserQuery__
 *
 * To run a query within a React component, call `useSelectCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectCurrentUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useSelectCurrentUserQuery(baseOptions: Apollo.QueryHookOptions<SelectCurrentUserQuery, SelectCurrentUserQueryVariables>) {
        return Apollo.useQuery<SelectCurrentUserQuery, SelectCurrentUserQueryVariables>(SelectCurrentUserDocument, baseOptions);
      }
export function useSelectCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectCurrentUserQuery, SelectCurrentUserQueryVariables>) {
          return Apollo.useLazyQuery<SelectCurrentUserQuery, SelectCurrentUserQueryVariables>(SelectCurrentUserDocument, baseOptions);
        }
export type SelectCurrentUserQueryHookResult = ReturnType<typeof useSelectCurrentUserQuery>;
export type SelectCurrentUserLazyQueryHookResult = ReturnType<typeof useSelectCurrentUserLazyQuery>;
export type SelectCurrentUserQueryResult = Apollo.QueryResult<SelectCurrentUserQuery, SelectCurrentUserQueryVariables>;
export const GetCurrentUserIsIncognitoDocument = gql`
    query getCurrentUserIsIncognito($userId: String!) {
  OnlineStatus(where: {userId: {_eq: $userId}}) {
    id
    isIncognito
  }
}
    `;

/**
 * __useGetCurrentUserIsIncognitoQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserIsIncognitoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserIsIncognitoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserIsIncognitoQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetCurrentUserIsIncognitoQuery(baseOptions: Apollo.QueryHookOptions<GetCurrentUserIsIncognitoQuery, GetCurrentUserIsIncognitoQueryVariables>) {
        return Apollo.useQuery<GetCurrentUserIsIncognitoQuery, GetCurrentUserIsIncognitoQueryVariables>(GetCurrentUserIsIncognitoDocument, baseOptions);
      }
export function useGetCurrentUserIsIncognitoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserIsIncognitoQuery, GetCurrentUserIsIncognitoQueryVariables>) {
          return Apollo.useLazyQuery<GetCurrentUserIsIncognitoQuery, GetCurrentUserIsIncognitoQueryVariables>(GetCurrentUserIsIncognitoDocument, baseOptions);
        }
export type GetCurrentUserIsIncognitoQueryHookResult = ReturnType<typeof useGetCurrentUserIsIncognitoQuery>;
export type GetCurrentUserIsIncognitoLazyQueryHookResult = ReturnType<typeof useGetCurrentUserIsIncognitoLazyQuery>;
export type GetCurrentUserIsIncognitoQueryResult = Apollo.QueryResult<GetCurrentUserIsIncognitoQuery, GetCurrentUserIsIncognitoQueryVariables>;
export const UpdateCurrentUserIsIncognitoDocument = gql`
    mutation updateCurrentUserIsIncognito($userId: String!, $isIncognito: Boolean = false) {
  update_OnlineStatus(
    _set: {isIncognito: $isIncognito}
    where: {userId: {_eq: $userId}}
  ) {
    returning {
      id
      isIncognito
    }
  }
}
    `;
export type UpdateCurrentUserIsIncognitoMutationFn = Apollo.MutationFunction<UpdateCurrentUserIsIncognitoMutation, UpdateCurrentUserIsIncognitoMutationVariables>;

/**
 * __useUpdateCurrentUserIsIncognitoMutation__
 *
 * To run a mutation, you first call `useUpdateCurrentUserIsIncognitoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCurrentUserIsIncognitoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCurrentUserIsIncognitoMutation, { data, loading, error }] = useUpdateCurrentUserIsIncognitoMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      isIncognito: // value for 'isIncognito'
 *   },
 * });
 */
export function useUpdateCurrentUserIsIncognitoMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCurrentUserIsIncognitoMutation, UpdateCurrentUserIsIncognitoMutationVariables>) {
        return Apollo.useMutation<UpdateCurrentUserIsIncognitoMutation, UpdateCurrentUserIsIncognitoMutationVariables>(UpdateCurrentUserIsIncognitoDocument, baseOptions);
      }
export type UpdateCurrentUserIsIncognitoMutationHookResult = ReturnType<typeof useUpdateCurrentUserIsIncognitoMutation>;
export type UpdateCurrentUserIsIncognitoMutationResult = Apollo.MutationResult<UpdateCurrentUserIsIncognitoMutation>;
export type UpdateCurrentUserIsIncognitoMutationOptions = Apollo.BaseMutationOptions<UpdateCurrentUserIsIncognitoMutation, UpdateCurrentUserIsIncognitoMutationVariables>;
export const GetCurrentUserLastSeenDocument = gql`
    query getCurrentUserLastSeen($userId: String!) {
  OnlineStatus(where: {userId: {_eq: $userId}}) {
    id
    lastSeen
  }
}
    `;

/**
 * __useGetCurrentUserLastSeenQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserLastSeenQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserLastSeenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserLastSeenQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetCurrentUserLastSeenQuery(baseOptions: Apollo.QueryHookOptions<GetCurrentUserLastSeenQuery, GetCurrentUserLastSeenQueryVariables>) {
        return Apollo.useQuery<GetCurrentUserLastSeenQuery, GetCurrentUserLastSeenQueryVariables>(GetCurrentUserLastSeenDocument, baseOptions);
      }
export function useGetCurrentUserLastSeenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserLastSeenQuery, GetCurrentUserLastSeenQueryVariables>) {
          return Apollo.useLazyQuery<GetCurrentUserLastSeenQuery, GetCurrentUserLastSeenQueryVariables>(GetCurrentUserLastSeenDocument, baseOptions);
        }
export type GetCurrentUserLastSeenQueryHookResult = ReturnType<typeof useGetCurrentUserLastSeenQuery>;
export type GetCurrentUserLastSeenLazyQueryHookResult = ReturnType<typeof useGetCurrentUserLastSeenLazyQuery>;
export type GetCurrentUserLastSeenQueryResult = Apollo.QueryResult<GetCurrentUserLastSeenQuery, GetCurrentUserLastSeenQueryVariables>;
export const InsertCurrentUserOnlineStatusDocument = gql`
    mutation insertCurrentUserOnlineStatus($userId: String!) {
  insert_OnlineStatus(objects: {userId: $userId, isIncognito: false}) {
    returning {
      id
      isIncognito
      lastSeen
      userId
    }
  }
}
    `;
export type InsertCurrentUserOnlineStatusMutationFn = Apollo.MutationFunction<InsertCurrentUserOnlineStatusMutation, InsertCurrentUserOnlineStatusMutationVariables>;

/**
 * __useInsertCurrentUserOnlineStatusMutation__
 *
 * To run a mutation, you first call `useInsertCurrentUserOnlineStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertCurrentUserOnlineStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertCurrentUserOnlineStatusMutation, { data, loading, error }] = useInsertCurrentUserOnlineStatusMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useInsertCurrentUserOnlineStatusMutation(baseOptions?: Apollo.MutationHookOptions<InsertCurrentUserOnlineStatusMutation, InsertCurrentUserOnlineStatusMutationVariables>) {
        return Apollo.useMutation<InsertCurrentUserOnlineStatusMutation, InsertCurrentUserOnlineStatusMutationVariables>(InsertCurrentUserOnlineStatusDocument, baseOptions);
      }
export type InsertCurrentUserOnlineStatusMutationHookResult = ReturnType<typeof useInsertCurrentUserOnlineStatusMutation>;
export type InsertCurrentUserOnlineStatusMutationResult = Apollo.MutationResult<InsertCurrentUserOnlineStatusMutation>;
export type InsertCurrentUserOnlineStatusMutationOptions = Apollo.BaseMutationOptions<InsertCurrentUserOnlineStatusMutation, InsertCurrentUserOnlineStatusMutationVariables>;
export const UpdateCurrentUserLastSeenDocument = gql`
    mutation updateCurrentUserLastSeen($userId: String!, $lastSeen: timestamptz) {
  update_OnlineStatus(
    _set: {lastSeen: $lastSeen}
    where: {userId: {_eq: $userId}}
  ) {
    returning {
      id
      lastSeen
    }
  }
}
    `;
export type UpdateCurrentUserLastSeenMutationFn = Apollo.MutationFunction<UpdateCurrentUserLastSeenMutation, UpdateCurrentUserLastSeenMutationVariables>;

/**
 * __useUpdateCurrentUserLastSeenMutation__
 *
 * To run a mutation, you first call `useUpdateCurrentUserLastSeenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCurrentUserLastSeenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCurrentUserLastSeenMutation, { data, loading, error }] = useUpdateCurrentUserLastSeenMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      lastSeen: // value for 'lastSeen'
 *   },
 * });
 */
export function useUpdateCurrentUserLastSeenMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCurrentUserLastSeenMutation, UpdateCurrentUserLastSeenMutationVariables>) {
        return Apollo.useMutation<UpdateCurrentUserLastSeenMutation, UpdateCurrentUserLastSeenMutationVariables>(UpdateCurrentUserLastSeenDocument, baseOptions);
      }
export type UpdateCurrentUserLastSeenMutationHookResult = ReturnType<typeof useUpdateCurrentUserLastSeenMutation>;
export type UpdateCurrentUserLastSeenMutationResult = Apollo.MutationResult<UpdateCurrentUserLastSeenMutation>;
export type UpdateCurrentUserLastSeenMutationOptions = Apollo.BaseMutationOptions<UpdateCurrentUserLastSeenMutation, UpdateCurrentUserLastSeenMutationVariables>;