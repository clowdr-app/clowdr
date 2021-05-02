import assert from "assert";
import { is } from "typescript-is";
import { validate } from "uuid";
import { redisClientP } from "../redis";

export function onConnect(_userId: string, _socketId: string): void {
    // TODO
}

export function onDisconnect(_socketId: string, _userId: string): void {
    // TODO
}

type ViewCountInfo = {
    identifier: string;
    contentType: "Item" | "Element" | "Room.HLSStream";
};

export function onViewCount(
    _conferenceSlugs: string[],
    _userId: string,
    _socketId: string
): (info: any) => Promise<void> {
    return async (info) => {
        try {
            assert(is<ViewCountInfo>(info), "Submitted analytics info is invalid. (type)");
            assert(validate(info.identifier), "Submitted analytics info is invalid. (id)");
            await redisClientP.incr(`analytics.view.count:${info.contentType}:${info.identifier}`);
        } catch (e) {
            console.error(e);
        }
    };
}
