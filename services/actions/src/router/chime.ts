import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleJoinRoom } from "../handlers/chime";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ActionPayload } from "../types/hasura/action";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/joinEvent", json(), async (req: Request, res: Response<JoinRoomChimeSessionOutput>) => {
    let body: ActionPayload<joinRoomChimeSessionArgs>;
    try {
        body = req.body;
        assertType<ActionPayload<joinRoomChimeSessionArgs>>(body);
    } catch (e) {
        console.error("Invalid request", { url: req.originalUrl, input: req.body.input, err: e });
        return res.status(200).json({
            message: "Invalid request",
        });
    }

    try {
        const result = await handleJoinRoom(body.input, body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e) {
        console.error("Failure while handling request", { url: req.originalUrl, input: req.body.input, err: e });
        return res.status(200).json({
            message: "Failure while handling request",
        });
    }
});
