import type { EventPayload } from "@midspace/hasura/event";
import type { VonageVideoPlaybackCommandData } from "@midspace/hasura/event-data";
import type { VonageVideoPlaybackCommandSignal } from "@midspace/shared-types/video/vonage-video-playback-command";
import assert from "node:assert";
import type pino from "pino";
import Vonage from "../lib/vonage/vonageClient";

export async function handleVonageVideoPlaybackCommandInserted(
    _logger: pino.Logger,
    data: EventPayload<VonageVideoPlaybackCommandData>
) {
    assert(data.event.data.new, "Expected payload to have new row.");

    const newRow = data.event.data.new;

    const signal: VonageVideoPlaybackCommandSignal = {
        command: newRow.command,
        createdAtMillis: Date.parse(newRow.created_at),
        createdByRegistrantId: newRow.createdByRegistrantId ?? null,
    };

    await Vonage.signal(newRow.vonageSessionId, null, {
        data: signal,
        type: "video-playback",
    });
}
