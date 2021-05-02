import express from "express";
import { checkEventSecret } from "../middlewares/checkEventSecret";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

// router.post("/sync", async (_req: Request, res: Response) => {
//     // todo: sync input switches
//     try {
//         const holdOffOnCreatingChannel = await syncChannelSchedules();
//         await ensureUpcomingChannelsStarted(holdOffOnCreatingChannel);
//         await stopChannelsWithoutUpcomingOrCurrentEvents();
//     } catch (e) {
//         console.error("Failure while ensuring creation of upcoming channels", e);
//         res.status(500).json("Failure");
//         return;
//     }
//     res.status(200).json("OK");
// });
