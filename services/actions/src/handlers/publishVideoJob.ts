import assert from "assert";
import { Payload, PublishVideoJobData } from "../types/hasura/event";

export async function handlePublishVideoJobInserted(payload: Payload<PublishVideoJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");
    assert(!payload.event.data.old, "Payload must not contain old data");

    console.log("Pretending to upload content item to Vimeo", payload.event.data.new.contentItemId);
    // todo: upload content item to Vimeo! Then update the content item and job accordingly.
}
