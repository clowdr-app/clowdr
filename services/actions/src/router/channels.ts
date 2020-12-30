import express, { Request, Response } from "express";
import {
    ensureUpcomingChannelsCreated,
    stopChannelsWithoutUpcomingOrCurrentEvents,
    syncChannelSchedules,
} from "../lib/channels";
import { checkEventSecret } from "../middlewares/checkEventSecret";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/sync", async (_req: Request, res: Response) => {
    // todo: destroy channels for rooms with no ongoing events in the last 30 mins
    // todo: sync input switches
    try {
        const holdOffOnCreatingChannel = await syncChannelSchedules();
        await ensureUpcomingChannelsCreated(holdOffOnCreatingChannel);
        await stopChannelsWithoutUpcomingOrCurrentEvents();
    } catch (e) {
        console.error("Failure while ensuring creation of upcoming channels", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
