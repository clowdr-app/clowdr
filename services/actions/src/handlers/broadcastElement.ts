import assert from "assert";
import { Video_InputType_Enum } from "../generated/graphql";
import * as Element from "../lib/element";
import { BroadcastElementData, Payload } from "../types/hasura/event";

export async function handleBroadcastElementUpdated(payload: Payload<BroadcastElementData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    if (
        payload.event.data.new.inputTypeName === Video_InputType_Enum.Mp4 &&
        payload.event.data.new.input.type === "MP4Input"
    ) {
        await Element.addNewBroadcastTranscode(payload.event.data.new.elementId, payload.event.data.new.input.s3Url);
    }
}
