import { gqlClient } from "@midspace/component-clients/graphqlClient";
import assert from "assert";
import type { NextFunction, Request, Response } from "express";
import { gql } from "graphql-tag";
import { assertType } from "typescript-is";
import type { FlagInserted_GetModeratorsQuery, FlagInserted_GetModeratorsQueryVariables } from "../generated/graphql";
import { FlagInserted_GetModeratorsDocument } from "../generated/graphql";
import { generateChatPinsChangedRoomName, generateChatSubscriptionsChangedRoomName } from "../lib/chat";
import { logger } from "../lib/logger";
import { sendNotifications } from "../lib/notifications";
import { emitter } from "../socket-emitter/socket-emitter";
import type { Flag, Payload, Pin, Subscription } from "../types/hasura";

export async function subscriptionChanged(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<Subscription>>(req.body);

        const data: Payload<Subscription> = req.body;

        const sub = data.event.data.new ?? data.event.data.old;
        assert(sub, "Missing data");

        if (data.event.op === "INSERT" || data.event.op === "MANUAL") {
            emitter.in(generateChatSubscriptionsChangedRoomName(sub.registrantId)).emit("chat.subscribed", sub.chatId);
        } else if (data.event.op === "DELETE") {
            emitter
                .in(generateChatSubscriptionsChangedRoomName(sub.registrantId))
                .emit("chat.unsubscribed", sub.chatId);
        }

        res.status(200).send("OK");
    } catch (error: any) {
        logger.error({ error }, "Chat subscription changed: Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
}

export async function pinChanged(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<Pin>>(req.body);

        const data: Payload<Pin> = req.body;

        const sub = data.event.data.new ?? data.event.data.old;
        assert(sub, "Missing data");

        if (data.event.op === "INSERT" || data.event.op === "MANUAL") {
            emitter.in(generateChatPinsChangedRoomName(sub.registrantId)).emit("chat.pinned", sub.chatId);
        } else if (data.event.op === "DELETE") {
            emitter.in(generateChatPinsChangedRoomName(sub.registrantId)).emit("chat.unpinned", sub.chatId);
        }

        res.status(200).send("OK");
    } catch (error: any) {
        logger.error({ error }, "Chat pin changed: Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
}

gql`
    query FlagInserted_GetModerators($messageSId: uuid!) {
        chat_Message(where: { sId: { _eq: $messageSId } }) {
            chat {
                conference {
                    slug
                    registrants(where: { conferenceRole: { _eq: MODERATOR } }) {
                        id
                        userId
                    }
                }
            }
        }
    }
`;

export async function flagInserted(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<Flag>>(req.body);

        const data: Payload<Flag> = req.body;
        assert(data.event.data.new, "New flag is not defined.");
        const newFlag: Flag = data.event.data.new;

        const messageSId = newFlag.messageSId;
        const response = await gqlClient
            ?.query<FlagInserted_GetModeratorsQuery, FlagInserted_GetModeratorsQueryVariables>(
                FlagInserted_GetModeratorsDocument,
                {
                    messageSId,
                }
            )
            .toPromise();
        assert(response?.data, "List of moderators could not be retrieved.");
        if (response.data.chat_Message.length) {
            const message = response.data.chat_Message[0];
            const maybeUserIds = message.chat.conference.registrants.map((registrant) => registrant.userId);
            const userIds = maybeUserIds.filter((x) => !!x) as string[];
            sendNotifications(new Set(userIds), {
                description: "A message has been reported. Please go to the moderation hub to resolve it.",
                title: "Message reported",
                linkURL: `/conference/${message.chat.conference.slug}/manage/chats/moderation`,
                subtitle: `Reason: ${newFlag.type}`,
            });
        }

        res.status(200).send("OK");
    } catch (error: any) {
        logger.error({ error }, "Chat flag inserted: Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
}
