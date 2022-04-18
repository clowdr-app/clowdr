import type {
    Collection_Exhibition_Insert_Input,
    Collection_Exhibition_Set_Input,
    Collection_ProgramPerson_Insert_Input,
    Collection_ProgramPerson_Set_Input,
    Collection_Tag_Insert_Input,
    Collection_Tag_Set_Input,
    Content_Element_Insert_Input,
    Content_Element_Set_Input,
    Content_ItemExhibition_Insert_Input,
    Content_ItemExhibition_Set_Input,
    Content_ItemProgramPerson_Insert_Input,
    Content_ItemProgramPerson_Set_Input,
    Content_ItemTag_Insert_Input,
    Content_ItemTag_Set_Input,
    Content_Item_Insert_Input,
    Content_Item_Set_Input,
    Room_Room_Insert_Input,
    Room_Room_Set_Input,
    Room_ShufflePeriod_Insert_Input,
    Room_ShufflePeriod_Set_Input,
    Schedule_Continuation_Insert_Input,
    Schedule_Continuation_Set_Input,
    Schedule_EventProgramPerson_Insert_Input,
    Schedule_EventProgramPerson_Set_Input,
    Schedule_Event_Insert_Input,
    Schedule_Event_Set_Input,
} from "../generated/graphql";

export type Task = {
    jobId: string;
} & (
    | {
          type: "initialize";
      }
    | {
          type: "assign_rooms";
      }
    | {
          type: "queue_sessions";
      }
    | {
          type: "queue_exhibitions";
      }
    | {
          type: "compile_session";
          fileIndex: number;
          sessionIndex: number;
      }
    | {
          type: "compile_exhibition";
          fileIndex: number;
          exhibitionIndex: number;
      }
    | {
          type: "apply";
          data: InsertData;
          followOn?: InsertData[] | null | undefined;
      }
);

export type ImportOutputSelector = {
    outputName: string;
    columnName: "id";
};

export type InsertData = {
    remapColumns: string[];
    outputs: ImportOutputSelector[];
} & (
    | {
          type: "Room";
          value: Room_Room_Insert_Input;
      }
    | {
          type: "ShufflePeriod";
          value: Room_ShufflePeriod_Insert_Input;
      }
    | {
          type: "Exhibition";
          value: Collection_Exhibition_Insert_Input;
      }
    | {
          type: "ProgramPerson";
          value: Collection_ProgramPerson_Insert_Input;
      }
    | {
          type: "Tag";
          value: Collection_Tag_Insert_Input;
      }
    | {
          type: "Item";
          value: Content_Item_Insert_Input;
      }
    | {
          type: "ItemProgramPerson";
          value: Content_ItemProgramPerson_Insert_Input;
      }
    | {
          type: "ItemTag";
          value: Content_ItemTag_Insert_Input;
      }
    | {
          type: "ItemExhibition";
          value: Content_ItemExhibition_Insert_Input;
      }
    | {
          type: "Element";
          value: Content_Element_Insert_Input;
      }
    | {
          type: "Event";
          value: Schedule_Event_Insert_Input;
      }
    | {
          type: "Continutation";
          value: Schedule_Continuation_Insert_Input;
      }
    | {
          type: "EventProgramPerson";
          value: Schedule_EventProgramPerson_Insert_Input;
      }
);

export type UpdateData = {
    remapColumns: string[];
    outputs: ImportOutputSelector[];
} & (
    | {
          type: "Room";
          value: Room_Room_Set_Input;
      }
    | {
          type: "ShufflePeriod";
          value: Room_ShufflePeriod_Set_Input;
      }
    | {
          type: "Exhibition";
          value: Collection_Exhibition_Set_Input;
      }
    | {
          type: "ProgramPerson";
          value: Collection_ProgramPerson_Set_Input;
      }
    | {
          type: "Tag";
          value: Collection_Tag_Set_Input;
      }
    | {
          type: "Item";
          value: Content_Item_Set_Input;
      }
    | {
          type: "ItemProgramPerson";
          value: Content_ItemProgramPerson_Set_Input;
      }
    | {
          type: "ItemTag";
          value: Content_ItemTag_Set_Input;
      }
    | {
          type: "ItemExhibition";
          value: Content_ItemExhibition_Set_Input;
      }
    | {
          type: "Element";
          value: Content_Element_Set_Input;
      }
    | {
          type: "Event";
          value: Schedule_Event_Set_Input;
      }
    | {
          type: "Continutation";
          value: Schedule_Continuation_Set_Input;
      }
    | {
          type: "EventProgramPerson";
          value: Schedule_EventProgramPerson_Set_Input;
      }
);
