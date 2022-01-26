import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type { NextFunction, Request, Response } from "express";
import { assertType } from "typescript-is";
import type {
    Conference_Conference,
    InsertAnnouncementsChatMutation,
    InsertAnnouncementsChatMutationVariables,
    SetAnnouncementsChatMutation,
    SetAnnouncementsChatMutationVariables,
} from "../generated/graphql";
import { InsertAnnouncementsChatDocument, SetAnnouncementsChatDocument } from "../generated/graphql";
import { logger } from "../lib/logger";
import type { Payload } from "../types/hasura";

gql`
    mutation InsertAnnouncementsChat($chat: chat_Chat_insert_input!) {
        insert_chat_Chat_one(object: $chat) {
            id
        }
    }

    mutation SetAnnouncementsChat($conferenceId: uuid!, $chatId: uuid!) {
        update_conference_Conference_by_pk(pk_columns: { id: $conferenceId }, _set: { announcementsChatId: $chatId }) {
            id
        }
    }
`;

type RequiredConferenceData = Pick<Conference_Conference, "id">;
export async function conferenceInserted(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<RequiredConferenceData>>(req.body);
        const payload: Payload<RequiredConferenceData> = req.body;
        if (!payload.event.data.new) {
            throw new Error("No conference object");
        }
        const conference: RequiredConferenceData = payload.event.data.new;

        const insertResponse = await gqlClient
            ?.mutation<InsertAnnouncementsChatMutation, InsertAnnouncementsChatMutationVariables>(
                InsertAnnouncementsChatDocument,
                {
                    chat: {
                        conferenceId: conference.id,
                        enableAutoPin: false,
                        enableMandatoryPin: true,
                        enableAutoSubscribe: false,
                        enableMandatorySubscribe: true,
                        restrictToAdmins: true,
                    },
                }
            )
            .toPromise();

        if (insertResponse?.data?.insert_chat_Chat_one) {
            const chatId = insertResponse.data.insert_chat_Chat_one.id;
            await gqlClient
                ?.mutation<SetAnnouncementsChatMutation, SetAnnouncementsChatMutationVariables>(
                    SetAnnouncementsChatDocument,
                    {
                        conferenceId: conference.id,
                        chatId,
                    }
                )
                .toPromise();
        } else {
            throw new Error("Inserting announcements chat returned no data!");
        }

        res.status(200).send({ ok: true });
    } catch (error: any) {
        logger.error({ error }, "Conference inserted event: Failed to process correctly");
        res.status(500).json({ ok: false });
        return;
    }
}
