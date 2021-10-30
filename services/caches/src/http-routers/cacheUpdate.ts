import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { is } from "typescript-is";
import {
    handleConferenceCacheUpdate,
    handleRegistrantCacheUpdate,
    handleRoomCacheUpdate,
    handleRoomMembershipCacheUpdate,
    handleSubconferenceCacheUpdate,
    handleSubconferenceMembershipCacheUpdate,
    handleUserCacheUpdate,
} from "../http-handlers/cacheUpdate";
import type { CacheUpdate } from "../types/hasura/cacheUpdate";
import type { Payload } from "../types/hasura/event";

export const router = express.Router();

router.use(checkEventSecret);

router.post("/conference", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.ConferenceData>>(req.body)) {
            const payload: Payload<CacheUpdate.ConferenceData> = req.body;
            await handleConferenceCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/subconference", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.SubconferenceData>>(req.body)) {
            const payload: Payload<CacheUpdate.SubconferenceData> = req.body;
            await handleSubconferenceCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/room", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.RoomData>>(req.body)) {
            const payload: Payload<CacheUpdate.RoomData> = req.body;
            await handleRoomCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/registrant", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.RegistrantData>>(req.body)) {
            const payload: Payload<CacheUpdate.RegistrantData> = req.body;
            await handleRegistrantCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/subconferenceMembership", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.SubconferenceMembershipData>>(req.body)) {
            const payload: Payload<CacheUpdate.SubconferenceMembershipData> = req.body;
            await handleSubconferenceMembershipCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/roomMembership", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.RoomMembershipData>>(req.body)) {
            const payload: Payload<CacheUpdate.RoomMembershipData> = req.body;
            await handleRoomMembershipCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/user", json() as any, async (req: Request, res: Response) => {
    try {
        if (is<Payload<CacheUpdate.UserData>>(req.body)) {
            const payload: Payload<CacheUpdate.UserData> = req.body;
            await handleUserCacheUpdate(payload);
            res.status(200).json({});
        } else {
            throw new Error("Payload did not match expected type.");
        }
    } catch (e) {
        console.error("Failure while handling Hasura cache event", e);
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});
