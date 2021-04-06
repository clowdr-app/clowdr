import { Chat_MessageType_Enum, RoomPrivacy_Enum } from "../../../generated/graphql";
import { getAttendeeInfo } from "../../../lib/cache/attendeeInfo";
import { getChatInfo } from "../../../lib/cache/chatInfo";
import { getSubscriptions } from "../../../lib/cache/subscription";
import { chatListenersKeyName, generateRoomName } from "../../../lib/chat";
import { sendNotifications } from "../../../lib/notifications";
import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { redisClientP } from "../../../redis";
import { emitter } from "../../../socket-emitter/socket-emitter";
import { Action, Message } from "../../../types/chat";

console.info("Chat messages distribution worker running");

async function onMessage(action: Action<Message>) {
    const eventName =
        action.op === "INSERT"
            ? "receive"
            : action.op === "UPDATE"
            ? "update"
            : action.op === "DELETE"
            ? "delete"
            : "unknown";

    const chatId = action.data.chatId;
    emitter.to(generateRoomName(chatId)).emit(`chat.messages.${eventName}`, action.data);

    if (action.op === "INSERT") {
        const subscriptions = await getSubscriptions(chatId, {
            chatId,
            attendeeIds: [],
        });
        if (subscriptions) {
            const listenerUserIds = (await redisClientP.smembers(chatListenersKeyName(chatId))).map(
                (x) => x.split("¬")[1]
            );
            const subscribedAttendeeIds = subscriptions.attendeeIds.filter((x) => x !== action.data.senderId);
            const subscribedUserIds = (
                await Promise.all(
                    subscribedAttendeeIds.map((attendeeId) =>
                        getAttendeeInfo(attendeeId, {
                            displayName: "unknown",
                        })
                    )
                )
            )
                .filter((x) => !!x?.userId && !listenerUserIds.includes(x.userId))
                .map((x) => x?.userId) as string[];

            const chatInfo = await getChatInfo(chatId, {
                conference: {
                    id: "distribution.onMessage:unknown-conference-id",
                    slug: "distribution.onMessage:unknown-conference-slug",
                },
                contentGroups: [],
                restrictToAdmins: false,
                rooms: [],
            });
            if (chatInfo) {
                const room = chatInfo.rooms.length > 0 ? chatInfo.rooms[0] : undefined;
                const otherAttendeeId =
                    room?.privacy === RoomPrivacy_Enum.Dm
                        ? room.people.find((x) => x.attendeeId !== action.data.senderId)?.attendeeId
                        : undefined;
                const otherAttendeeInfo = otherAttendeeId
                    ? await getAttendeeInfo(otherAttendeeId, {
                          displayName: "distribution.onMessage:unknown-attendee-displayName",
                      })
                    : undefined;

                const chatName =
                    chatInfo.contentGroups && chatInfo.contentGroups.length > 0
                        ? chatInfo.contentGroups && chatInfo.contentGroups[0].title
                        : room?.name ?? "Unknown chat";
                sendNotifications(subscribedUserIds, {
                    description: action.data.message,
                    title: `New ${
                        action.data.type === Chat_MessageType_Enum.Message
                            ? "message"
                            : action.data.type === Chat_MessageType_Enum.Answer
                            ? "answer"
                            : action.data.type === Chat_MessageType_Enum.Question
                            ? "question"
                            : action.data.type === Chat_MessageType_Enum.Emote
                            ? "emote"
                            : action.data.type === Chat_MessageType_Enum.DuplicationMarker
                            ? "event"
                            : "message"
                    }`,
                    chatId,
                    linkURL: `/conference/${chatInfo.conference.slug}/chat/${chatId}`,
                    subtitle: otherAttendeeInfo ? `from ${otherAttendeeInfo.displayName}` : `in ${chatName}`,
                });
            }
        }
    }
}

async function Main() {
    onDistributionMessage(onMessage);
}

Main();
