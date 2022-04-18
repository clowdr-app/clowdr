import { gqlClient } from "@midspace/component-clients/graphqlClient";
import type { DocumentNode } from "graphql";
import gql from "graphql-tag";
import {
    UpdateFromTask_Collection_ExhibitionDocument,
    UpdateFromTask_Collection_ProgramPersonDocument,
    UpdateFromTask_Collection_TagDocument,
    UpdateFromTask_Content_ElementDocument,
    UpdateFromTask_Content_ItemDocument,
    UpdateFromTask_Content_ItemExhibitionDocument,
    UpdateFromTask_Content_ItemProgramPersonDocument,
    UpdateFromTask_Content_ItemTagDocument,
    UpdateFromTask_Room_RoomDocument,
    UpdateFromTask_Room_ShufflePeriodDocument,
    UpdateFromTask_Schedule_ContinuationDocument,
    UpdateFromTask_Schedule_EventDocument,
    UpdateFromTask_Schedule_EventProgramPersonDocument,
} from "../../generated/graphql";
import type { ImportOutput } from "../../types/job";
import type { UpdateData } from "../../types/task";
import { updateJobProgressAndOutputs } from "./job";

gql`
    mutation UpdateFromTask_Room_Room($id: uuid!, $input: room_Room_set_input!) {
        update: update_room_Room_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Room_ShufflePeriod($id: uuid!, $input: room_ShufflePeriod_set_input!) {
        update: update_room_ShufflePeriod_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Collection_Exhibition($id: uuid!, $input: collection_Exhibition_set_input!) {
        update: update_collection_Exhibition_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Collection_ProgramPerson($id: uuid!, $input: collection_ProgramPerson_set_input!) {
        update: update_collection_ProgramPerson_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Collection_Tag($id: uuid!, $input: collection_Tag_set_input!) {
        update: update_collection_Tag_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Content_Item($id: uuid!, $input: content_Item_set_input!) {
        update: update_content_Item_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Content_ItemProgramPerson($id: uuid!, $input: content_ItemProgramPerson_set_input!) {
        update: update_content_ItemProgramPerson_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Content_ItemTag($id: uuid!, $input: content_ItemTag_set_input!) {
        update: update_content_ItemTag_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Content_ItemExhibition($id: uuid!, $input: content_ItemExhibition_set_input!) {
        update: update_content_ItemExhibition_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Content_Element($id: uuid!, $input: content_Element_set_input!) {
        update: update_content_Element_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Schedule_Event($id: uuid!, $input: schedule_Event_set_input!) {
        update: update_schedule_Event_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Schedule_Continuation($id: uuid!, $input: schedule_Continuation_set_input!) {
        update: update_schedule_Continuation_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }

    mutation UpdateFromTask_Schedule_EventProgramPerson($id: uuid!, $input: schedule_EventProgramPerson_set_input!) {
        update: update_schedule_EventProgramPerson_by_pk(pk_columns: { id: $id }, _set: $input) {
            id
        }
    }
`;

export async function updateEntity(jobId: string, data: UpdateData): Promise<boolean> {
    let document: DocumentNode;
    switch (data.type) {
        case "Room":
            document = UpdateFromTask_Room_RoomDocument;
            break;
        case "ShufflePeriod":
            document = UpdateFromTask_Room_ShufflePeriodDocument;
            break;
        case "Exhibition":
            document = UpdateFromTask_Collection_ExhibitionDocument;
            break;
        case "ProgramPerson":
            document = UpdateFromTask_Collection_ProgramPersonDocument;
            break;
        case "Tag":
            document = UpdateFromTask_Collection_TagDocument;
            break;
        case "Item":
            document = UpdateFromTask_Content_ItemDocument;
            break;
        case "ItemProgramPerson":
            document = UpdateFromTask_Content_ItemProgramPersonDocument;
            break;
        case "ItemTag":
            document = UpdateFromTask_Content_ItemTagDocument;
            break;
        case "ItemExhibition":
            document = UpdateFromTask_Content_ItemExhibitionDocument;
            break;
        case "Element":
            document = UpdateFromTask_Content_ElementDocument;
            break;
        case "Event":
            document = UpdateFromTask_Schedule_EventDocument;
            break;
        case "Continutation":
            document = UpdateFromTask_Schedule_ContinuationDocument;
            break;
        case "EventProgramPerson":
            document = UpdateFromTask_Schedule_EventProgramPersonDocument;
            break;
        default:
            throw new Error("Unrecognised table");
    }

    const id = data.value.id;
    delete data.value.id;
    const response = await gqlClient
        ?.mutation<any, any>(document, {
            id,
            input: data.value,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    const result = response?.data?.update;
    if (!result) {
        throw new Error("No result from insert!");
    }

    const outputs: ImportOutput[] = data.outputs.map((outputSource) => ({
        name: outputSource.outputName,
        value: result[outputSource.columnName] ?? null,
    }));

    await updateJobProgressAndOutputs(jobId, "apply_existing:update_required", outputs);

    return true;
}
