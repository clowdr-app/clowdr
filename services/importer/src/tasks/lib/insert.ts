import { gqlClient } from "@midspace/component-clients/graphqlClient";
import type { DocumentNode } from "graphql";
import gql from "graphql-tag";
import {
    InsertFromTask_Collection_ExhibitionDocument,
    InsertFromTask_Collection_ProgramPersonDocument,
    InsertFromTask_Collection_TagDocument,
    InsertFromTask_Content_ElementDocument,
    InsertFromTask_Content_ItemDocument,
    InsertFromTask_Content_ItemExhibitionDocument,
    InsertFromTask_Content_ItemProgramPersonDocument,
    InsertFromTask_Content_ItemTagDocument,
    InsertFromTask_Room_RoomDocument,
    InsertFromTask_Room_ShufflePeriodDocument,
    InsertFromTask_Schedule_ContinuationDocument,
    InsertFromTask_Schedule_EventDocument,
    InsertFromTask_Schedule_EventProgramPersonDocument,
} from "../../generated/graphql";
import type { ImportOutput } from "../../types/job";
import type { InsertData } from "../../types/task";
import { updateJobProgressAndOutputs } from "./job";

gql`
    mutation InsertFromTask_Room_Room($input: room_Room_insert_input!) {
        insert: insert_room_Room_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Room_ShufflePeriod($input: room_ShufflePeriod_insert_input!) {
        insert: insert_room_ShufflePeriod_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Collection_Exhibition($input: collection_Exhibition_insert_input!) {
        insert: insert_collection_Exhibition_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Collection_ProgramPerson($input: collection_ProgramPerson_insert_input!) {
        insert: insert_collection_ProgramPerson_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Collection_Tag($input: collection_Tag_insert_input!) {
        insert: insert_collection_Tag_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Content_Item($input: content_Item_insert_input!) {
        insert: insert_content_Item_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Content_ItemProgramPerson($input: content_ItemProgramPerson_insert_input!) {
        insert: insert_content_ItemProgramPerson_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Content_ItemTag($input: content_ItemTag_insert_input!) {
        insert: insert_content_ItemTag_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Content_ItemExhibition($input: content_ItemExhibition_insert_input!) {
        insert: insert_content_ItemExhibition_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Content_Element($input: content_Element_insert_input!) {
        insert: insert_content_Element_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Schedule_Event($input: schedule_Event_insert_input!) {
        insert: insert_schedule_Event_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Schedule_Continuation($input: schedule_Continuation_insert_input!) {
        insert: insert_schedule_Continuation_one(object: $input) {
            id
        }
    }

    mutation InsertFromTask_Schedule_EventProgramPerson($input: schedule_EventProgramPerson_insert_input!) {
        insert: insert_schedule_EventProgramPerson_one(object: $input) {
            id
        }
    }
`;

export async function insertTask(jobId: string, data: InsertData): Promise<boolean> {
    let document: DocumentNode;
    switch (data.type) {
        case "Room":
            document = InsertFromTask_Room_RoomDocument;
            break;
        case "ShufflePeriod":
            document = InsertFromTask_Room_ShufflePeriodDocument;
            break;
        case "Exhibition":
            document = InsertFromTask_Collection_ExhibitionDocument;
            break;
        case "ProgramPerson":
            document = InsertFromTask_Collection_ProgramPersonDocument;
            break;
        case "Tag":
            document = InsertFromTask_Collection_TagDocument;
            break;
        case "Item":
            document = InsertFromTask_Content_ItemDocument;
            break;
        case "ItemProgramPerson":
            document = InsertFromTask_Content_ItemProgramPersonDocument;
            break;
        case "ItemTag":
            document = InsertFromTask_Content_ItemTagDocument;
            break;
        case "ItemExhibition":
            document = InsertFromTask_Content_ItemExhibitionDocument;
            break;
        case "Element":
            document = InsertFromTask_Content_ElementDocument;
            break;
        case "Event":
            document = InsertFromTask_Schedule_EventDocument;
            break;
        case "Continutation":
            document = InsertFromTask_Schedule_ContinuationDocument;
            break;
        case "EventProgramPerson":
            document = InsertFromTask_Schedule_EventProgramPersonDocument;
            break;
        default:
            throw new Error("Unrecognised table");
    }

    const response = await gqlClient
        ?.mutation<any, any>(document, {
            input: data.value,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    const result = response?.data?.insert;
    if (!result) {
        throw new Error("No result from insert!");
    }

    const outputs: ImportOutput[] = data.outputs.map((outputSource) => ({
        name: outputSource.outputName,
        value: result[outputSource.columnName] ?? null,
    }));

    await updateJobProgressAndOutputs(jobId, "insert_new", outputs);

    return true;
}
