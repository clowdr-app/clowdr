ALTER INDEX "chat"."id_desc_chat_id" RENAME TO "chat_Message_idDescending_chatId";
ALTER INDEX "chat"."pin_attendee_id" RENAME TO "chat_Pin_registrantId";
ALTER INDEX "chat"."pin_chat_id" RENAME TO "chat_Pin_chatId";
ALTER INDEX "chat"."chat_reaction_sid" RENAME TO "chat_Reaction_sId";
ALTER INDEX "chat"."read_up_to_index_by_attendee" RENAME TO "chat_ReadUpToIndex_registrantId";
ALTER INDEX "chat"."read_up_to_index_by_chat" RENAME TO "chat_ReadUpToIndex_chatId";
DROP INDEX "chat"."read_up_to_index_by_chat_attendee";
ALTER INDEX "chat"."subscription_attendee_id" RENAME TO "chat_Subscription_registrantId";
DROP INDEX "chat"."subscription_by_attendee_id";
ALTER INDEX "chat"."subscription_chat_id" RENAME TO "chat_Subscription_chatId";