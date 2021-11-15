import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import {
    handleChatCacheUpdate,
    handleChatPinCacheUpdate,
    handleChatSubscriptionCacheUpdate,
    handleConferenceCacheUpdate,
    handleContentItemCacheUpdate,
    handleEventCacheUpdate,
    handlePushNotificationSubscriptionCacheUpdate,
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
        const payload = assertType<Payload<CacheUpdate.ConferenceData>>(req.body);
        req.log.trace({ payload }, "Cache update: conference");
        await handleConferenceCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/subconference", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.SubconferenceData>>(req.body);
        req.log.trace({ payload }, "Cache update: subconference");
        await handleSubconferenceCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/room", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.RoomData>>(req.body);
        req.log.trace({ payload }, "Cache update: room");
        await handleRoomCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/registrant", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.RegistrantData>>(req.body);
        req.log.trace({ payload }, "Cache update: registrant");
        await handleRegistrantCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/subconferenceMembership", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.SubconferenceMembershipData>>(req.body);
        req.log.trace({ payload }, "Cache update: subconference membership");
        await handleSubconferenceMembershipCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/roomMembership", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.RoomMembershipData>>(req.body);
        req.log.trace({ payload }, "Cache update: room membership");
        await handleRoomMembershipCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/user", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.UserData>>(req.body);
        req.log.trace({ payload }, "Cache update: user");
        await handleUserCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/event", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.EventData>>(req.body);
        req.log.trace({ payload }, "Cache update: event");
        await handleEventCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/pushNotificationSubscription", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.PushNotificationSubscriptionData>>(req.body);
        req.log.trace({ payload }, "Cache update: push notification subscription");
        await handlePushNotificationSubscriptionCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/chat", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.ChatData>>(req.body);
        req.log.trace({ payload }, "Cache update: chat");
        await handleChatCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/contentItem", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.ContentItemData>>(req.body);
        req.log.trace({ payload }, "Cache update: content item");
        await handleContentItemCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/chatPin", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.ChatPinData>>(req.body);
        req.log.trace({ payload }, "Cache update: chat pin");
        await handleChatPinCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});

router.post("/chatSubscription", json() as any, async (req: Request, res: Response) => {
    try {
        const payload = assertType<Payload<CacheUpdate.ChatSubscriptionData>>(req.body);
        req.log.trace({ payload }, "Cache update: chat subscription");
        await handleChatSubscriptionCacheUpdate(payload);
        res.status(200).json({});
    } catch (err) {
        req.log.error({ err }, "Failure while handling Hasura cache event");
        res.status(500).json("Failure while handling Hasura cache event");
        return;
    }
});
