import type { NextFunction, Request, Response } from "express";
import { getAuthHeader, HasuraHeaders, parseHasuraHeaderArray } from "../auth";

export const parseSessionVariables = (req: Request, _res: Response, next: NextFunction): void => {
    const roomIds = getAuthHeader(req.body.session_variables, HasuraHeaders.RoomIds);
    if (typeof roomIds === "string") {
        try {
            req.roomIds = parseHasuraHeaderArray(roomIds);
        } catch (err: unknown) {
            req.log.error({ roomIds }, `Failed to parse ${HasuraHeaders.RoomIds} header`);
            req.roomIds = [];
        }
    } else {
        req.roomIds = [];
    }
    const registrantIds = getAuthHeader(req.body.session_variables, HasuraHeaders.RegistrantIds);
    if (typeof registrantIds === "string") {
        try {
            req.registrantIds = parseHasuraHeaderArray(registrantIds);
        } catch (err: unknown) {
            req.log.error({ registrantIds }, `Failed to parse ${HasuraHeaders.RegistrantIds} header`);
            req.registrantIds = [];
        }
    } else {
        req.registrantIds = [];
    }
    const conferenceIds = getAuthHeader(req.body.session_variables, HasuraHeaders.ConferenceIds);
    if (typeof conferenceIds === "string") {
        try {
            req.conferenceIds = parseHasuraHeaderArray(conferenceIds);
        } catch (err: unknown) {
            req.log.error({ conferenceIds }, `Failed to parse ${HasuraHeaders.ConferenceIds} header`);
            req.conferenceIds = [];
        }
    } else {
        req.conferenceIds = [];
    }
    const subconferenceIds = getAuthHeader(req.body.session_variables, HasuraHeaders.SubconferenceIds);
    if (typeof subconferenceIds === "string") {
        try {
            req.subconferenceIds = parseHasuraHeaderArray(subconferenceIds);
        } catch (err: unknown) {
            req.log.error({ subconferenceIds }, `Failed to parse ${HasuraHeaders.SubconferenceIds} header`);
            req.subconferenceIds = [];
        }
    } else {
        req.subconferenceIds = [];
    }
    const userId = getAuthHeader(req.body.session_variables, HasuraHeaders.UserId);
    if (typeof userId === "string") {
        req.userId = userId;
    }
    const magicToken = getAuthHeader(req.body.session_variables, HasuraHeaders.MagicToken);
    if (typeof magicToken === "string") {
        req.magicToken = magicToken;
    }
    next();
};

declare module "http" {
    interface IncomingMessage {
        roomIds: string[];
        registrantIds: string[];
        conferenceIds: string[];
        subconferenceIds: string[];
        userId: string | undefined;
        magicToken: string | undefined;
    }
}
