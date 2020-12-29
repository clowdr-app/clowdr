import assert from "assert";
import { InputType_Enum } from "../generated/graphql";
import * as ContentItem from "../lib/contentItem";
import { BroadcastContentItemData, Payload } from "../types/hasura/event";

export async function handleBroadcastContentItemUpdated(payload: Payload<BroadcastContentItemData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    if (
        payload.event.data.new.inputTypeName === InputType_Enum.Mp4 &&
        payload.event.data.new.input.type === "MP4Input"
    ) {
        await ContentItem.addNewBroadcastTranscode(
            payload.event.data.new.contentItemId,
            payload.event.data.new.input.s3Url
        );
    }
}
