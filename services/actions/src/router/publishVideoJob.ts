// import { json } from "body-parser";
// import express, { Request, Response } from "express";
// import { assertType } from "typescript-is";
// import { handlePublishVideoJobInserted } from "../handlers/publishVideoJob";
// import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
// import { Payload, PublishVideoJobData } from "../types/hasura/event";

// export const router = express.Router();

// // Protected routes
// router.use(checkEventSecret);

// router.post("/created", json(), async (req: Request, res: Response) => {
//     try {
//         assertType<Payload<PublishVideoJobData>>(req.body);
//     } catch (e: any) {
//         req.log.error("Received incorrect payload", e);
//         res.status(500).json("Unexpected payload");
//         return;
//     }

//     try {
//         await handlePublishVideoJobInserted(req.body);
//     } catch (e: any) {
//         req.log.error("Failure while handling PublishVideoJob inserted", e);
//         res.status(500).json("Failure while handling event");
//         return;
//     }

//     res.status(200).json("OK");
// });
