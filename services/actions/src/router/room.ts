import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { checkJwt } from "@midspace/auth/middlewares/checkJwt";
import type {
    createContentGroupRoomArgs,
    CreateContentGroupRoomOutput,
    createRoomDmArgs,
    CreateRoomDmOutput,
} from "@midspace/hasura/action-types";
import type { EventPayload } from "@midspace/hasura/event";
import type { RoomData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import {
    handleCreateDmRoom,
    handleCreateForItem,
    handleRemoveOldRoomParticipants,
    handleRoomCreated,
} from "../handlers/room";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/created", json(), async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<RoomData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleRoomCreated(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling room created");
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/removeOldParticipants", json(), async (req: Request, res: Response) => {
    try {
        await handleRemoveOldRoomParticipants(req.log);
    } catch (err) {
        req.log.error({ err }, "Failure while handling remove old room participants");
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.use(json());
router.use(checkJwt);

router.post("/createDm", async (req: Request, res: Response<CreateRoomDmOutput>) => {
    try {
        const params = req.body.input;
        assertType<createRoomDmArgs>(params);
        const result = await handleCreateDmRoom(params, req.body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ body: req.body, err: e }, "Invalid request");
        return res.status(200).json({
            message: "Invalid request",
        });
    }
});

router.post("/createForItem", async (req: Request, res: Response<CreateContentGroupRoomOutput>) => {
    try {
        const params = req.body.input;
        assertType<createContentGroupRoomArgs>(params);
        const result = await handleCreateForItem(req.log, params, req.body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ body: req.body, err: e }, "Invalid request");
        return res.status(200).json({
            message: "Invalid request",
        });
    }
});
