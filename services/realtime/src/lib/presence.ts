import crypto from "crypto";

/**
 * A Presence List contains the user ids present for that list.
 */
export function presenceListKey(listId: string): string {
    return `PresenceList:${listId}`;
}

export function extractPresenceListIdFromKey(listKey: string): string {
    return listKey.substring(presenceListKey("").length);
}

/**
 * A Presence Channel is the pub/sub channel for the associated presence list.
 */
export function presenceChannelName(listId: string): string {
    return `PresenceQueue:${listId}`;
}

export function getVerifiedPageKey(confSlug: string, path: string): string {
    const hash = crypto.createHash("sha256");
    hash.write(confSlug, "utf8");
    hash.write(path, "utf8");
    return hash.digest("hex").toLowerCase();
}
